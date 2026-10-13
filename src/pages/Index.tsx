import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Users } from "lucide-react";
import ConsultarClima from "@/components/ConsultarClima";
import ClienteTable from "@/components/ClienteTable";
import ClienteForm, { ClienteFormData } from "@/components/ClienteForm";
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

interface Cliente {
  id: number;
  apellido: string;
  nombre: string;
  cuit: string;
  telefono: string | null;
}

const Index = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("apellido");
      if (error) throw error;
      return data as Cliente[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: ClienteFormData) => {
      const { error } = await supabase.from("clientes").insert({
        apellido: data.apellido,
        nombre: data.nombre,
        cuit: data.cuit,
        telefono: data.telefono || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast({ title: "Cliente agregado correctamente" });
      setFormOpen(false);
    },
    onError: () => toast({ title: "Error al agregar cliente", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ClienteFormData }) => {
      const { error } = await supabase
        .from("clientes")
        .update({
          apellido: data.apellido,
          nombre: data.nombre,
          cuit: data.cuit,
          telefono: data.telefono || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast({ title: "Cliente modificado correctamente" });
      setEditingCliente(null);
      setFormOpen(false);
    },
    onError: () => toast({ title: "Error al modificar cliente", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast({ title: "Cliente eliminado correctamente" });
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
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Gestión de Clientes
            </h1>
            <p className="text-sm text-muted-foreground">
              {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} registrado{clientes.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, apellido o CUIT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2"><ConsultarClima />
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button></div>
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
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
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
