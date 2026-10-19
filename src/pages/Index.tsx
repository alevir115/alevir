import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Users, WifiOff, RefreshCw } from "lucide-react";
import ConsultarClima from "@/components/ConsultarClima";
import BuscarPorDni from "@/components/BuscarPorDni";
import ClienteTable from "@/components/ClienteTable";
import ClienteForm, { ClienteFormData } from "@/components/ClienteForm";
import { InstallAppButton } from "@/components/InstallAppButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Cliente,
  ClienteData,
  PendingOp,
  applyQueue,
  enqueue,
  flushQueue,
  isNetworkError,
  loadCache,
  loadQueue,
  newTempId,
  saveCache,
  saveQueue,
} from "@/lib/offline-clientes";

const toData = (d: ClienteFormData): ClienteData => ({
  dni: d.dni,
  apellido: d.apellido,
  nombre: d.nombre,
  cuit: d.cuit,
  telefono: d.telefono || null,
});

const runOp = async (op: PendingOp) => {
  if (op.kind === "insert") return supabase.from("clientes").insert(op.data);
  if (op.kind === "update") return supabase.from("clientes").update(op.data).eq("id", op.id);
  return supabase.from("clientes").delete().eq("id", op.id);
};

const Index = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(loadQueue().length);
  const [syncing, setSyncing] = useState(false);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    networkMode: "always",
    queryFn: async () => {
      const queue = loadQueue();
      try {
        const { data, error } = await supabase.from("clientes").select("*").order("apellido");
        if (error) throw error;
        saveCache(data as Cliente[]);
        return applyQueue(data as Cliente[], queue);
      } catch (e) {
        if (!isNetworkError(e)) throw e;
        return applyQueue(loadCache(), queue);
      }
    },
  });

  const sync = useCallback(async () => {
    const queue = loadQueue();
    if (!queue.length || !navigator.onLine) return;
    setSyncing(true);
    const res = await flushQueue(queue, runOp);
    saveQueue(res.remaining);
    setPending(res.remaining.length);
    setSyncing(false);
    queryClient.invalidateQueries({ queryKey: ["clientes"] });
    if (res.sent) toast({ title: `Se sincronizaron ${res.sent} cambio(s) con la base de datos` });
    if (res.rejected)
      toast({
        title: `${res.rejected} cambio(s) no se pudieron guardar`,
        description: "Puede que el DNI ya exista o que el cliente haya sido borrado.",
        variant: "destructive",
      });
  }, [queryClient, toast]);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      sync();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    sync();
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [sync]);

  /** Intenta guardar en la base; si no hay internet, lo deja en la cola local. */
  const saveOrQueue = async (op: PendingOp): Promise<"saved" | "queued"> => {
    const isLocalOnly = op.kind !== "insert" && op.id < 0;
    if (navigator.onLine && !isLocalOnly) {
      const { error } = await runOp(op);
      if (!error) return "saved";
      if (!isNetworkError(error)) throw error;
    }
    const q = enqueue(loadQueue(), op);
    saveQueue(q);
    setPending(q.length);
    return "queued";
  };

  const offlineToast = () =>
    toast({ title: "Guardado sin conexión", description: "Se va a enviar a la base de datos cuando vuelva internet." });

  const mutationOpts = { networkMode: "always" as const };

  const addMutation = useMutation({
    ...mutationOpts,
    mutationFn: (data: ClienteFormData) => saveOrQueue({ kind: "insert", tempId: newTempId(), data: toData(data) }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      r === "queued" ? offlineToast() : toast({ title: "Cliente agregado correctamente" });
      setFormOpen(false);
    },
    onError: (e: any) =>
      toast({
        title: e?.code === "23505" ? "Ya existe un cliente con ese DNI" : "Error al agregar cliente",
        variant: "destructive",
      }),
  });

  const updateMutation = useMutation({
    ...mutationOpts,
    mutationFn: ({ id, data }: { id: number; data: ClienteFormData }) =>
      saveOrQueue({ kind: "update", id, data: toData(data) }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      r === "queued" ? offlineToast() : toast({ title: "Cliente modificado correctamente" });
      setEditingCliente(null);
      setFormOpen(false);
    },
    onError: (e: any) =>
      toast({
        title: e?.code === "23505" ? "Ya existe un cliente con ese DNI" : "Error al modificar cliente",
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    ...mutationOpts,
    mutationFn: (id: number) => saveOrQueue({ kind: "delete", id }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      r === "queued" ? offlineToast() : toast({ title: "Cliente eliminado correctamente" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "Error al eliminar cliente", variant: "destructive" }),
  });

  const handleSubmit = (data: ClienteFormData) => {
    if (editingCliente) {
      updateMutation.mutate({ id: editingCliente.id, data });
    } else {
      addMutation.mutate(data);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingCliente(null);
  };

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.apellido.toLowerCase().includes(q) ||
      c.nombre.toLowerCase().includes(q) ||
      c.cuit.toLowerCase().includes(q) ||
      (c.dni && c.dni.includes(q)) ||
      (c.telefono && c.telefono.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Gestión de Clientes
            </h1>
            <p className="text-sm text-muted-foreground">
              {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} registrado{clientes.length !== 1 ? "s" : ""}
            </p>
          </div>
          <InstallAppButton />
        </div>

        {(!online || pending > 0) && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-foreground">
            {online ? <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} /> : <WifiOff className="h-4 w-4" />}
            <span className="flex-1">
              {online ? "Conectado." : "Sin conexión. Podés seguir trabajando."}{" "}
              {pending > 0 && `${pending} cambio(s) pendiente(s) de enviar a la base de datos.`}
            </span>
            {online && pending > 0 && (
              <Button size="sm" variant="outline" onClick={sync} disabled={syncing}>
                Sincronizar
              </Button>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, apellido, DNI o CUIT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <BuscarPorDni />
            <ConsultarClima />
            <Button onClick={() => setFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Cliente
            </Button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            Cargando clientes...
          </div>
        ) : (
          <ClienteTable clientes={filtered} onEdit={handleEdit} onDelete={setDeleteId} />
        )}
      </div>

      {/* Form Dialog */}
      <ClienteForm
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        initialData={
          editingCliente
            ? {
                dni: editingCliente.dni || "",
                apellido: editingCliente.apellido,
                nombre: editingCliente.nombre,
                cuit: editingCliente.cuit,
                telefono: editingCliente.telefono || "",
              }
            : null
        }
        isEditing={!!editingCliente}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cliente será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
