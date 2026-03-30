import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export interface ClienteFormData {
  apellido: string;
  nombre: string;
  cuit: string;
  telefono: string;
}

interface ClienteFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ClienteFormData) => void;
  initialData?: ClienteFormData | null;
  isEditing?: boolean;
}

const ClienteForm = ({ open, onClose, onSubmit, initialData, isEditing }: ClienteFormProps) => {
  const [form, setForm] = useState<ClienteFormData>({
    apellido: "",
    nombre: "",
    cuit: "",
    telefono: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({ apellido: "", nombre: "", cuit: "", telefono: "" });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "Modificar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apellido">Apellido *</Label>
            <Input
              id="apellido"
              value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: e.target.value })}
              required
              placeholder="Ej: García"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
              placeholder="Ej: Juan"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cuit">CUIT *</Label>
            <Input
              id="cuit"
              value={form.cuit}
              onChange={(e) => setForm({ ...form, cuit: e.target.value })}
              required
              placeholder="Ej: 20-12345678-9"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="Ej: +54 11 1234-5678"
              autoComplete="off"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? "Guardar Cambios" : "Agregar Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClienteForm;
