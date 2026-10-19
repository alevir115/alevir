import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IdCard, Loader2 } from "lucide-react";
import { applyQueue, loadCache, loadQueue } from "@/lib/offline-clientes";

interface ClienteDni {
  id: number;
  dni: string;
  apellido: string;
  nombre: string;
  cuit: string;
  telefono: string | null;
}

const BuscarPorDni = () => {
  const [open, setOpen] = useState(false);
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);
  const [cliente, setCliente] = useState<ClienteDni | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni) return;
    setLoading(true);
    setCliente(null);
    setError(null);
    const { data, error } = await supabase.functions.invoke("cliente-por-dni", { body: { dni } });
    setLoading(false);
    if (error && !navigator.onLine) {
      const local = applyQueue(loadCache(), loadQueue()).find((c) => c.dni === dni);
      if (local) { setCliente(local as ClienteDni); return; }
    }
    if (error || !data || data.error) {
      setError("No se encontró ningún cliente con ese DNI");
      return;
    }
    setCliente(data as ClienteDni);
  };

  const filas: [string, string][] = cliente
    ? [
        ["ID", String(cliente.id)],
        ["DNI", cliente.dni],
        ["Apellido", cliente.apellido],
        ["Nombre", cliente.nombre],
        ["CUIT", cliente.cuit],
        ["Teléfono", cliente.telefono || "—"],
      ]
    : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) { setDni(""); setCliente(null); setError(null); }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <IdCard className="h-4 w-4" />
          Buscar por DNI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buscar cliente por DNI</DialogTitle>
        </DialogHeader>
        <form onSubmit={buscar} className="flex gap-2">
          <Input
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
            placeholder="Ej: 30123456"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
          />
          <Button type="submit" disabled={loading || !dni}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
          </Button>
        </form>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {cliente && (
          <dl className="divide-y rounded-lg border bg-card">
            {filas.map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-2 text-sm">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BuscarPorDni;
