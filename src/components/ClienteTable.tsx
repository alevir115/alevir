import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";

interface Cliente {
  id: number;
  dni: string | null;
  apellido: string;
  nombre: string;
  cuit: string;
  telefono: string | null;
}

interface ClienteTableProps {
  clientes: Cliente[];
  onEdit: (cliente: Cliente) => void;
  onDelete: (id: number) => void;
}

const ClienteTable = ({ clientes, onEdit, onDelete }: ClienteTableProps) => {
  if (clientes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">No hay clientes registrados</p>
        <p className="text-sm">Agregá tu primer cliente para comenzar</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">ID</TableHead>
            <TableHead className="font-semibold">DNI</TableHead>
            <TableHead className="font-semibold">Apellido</TableHead>
            <TableHead className="font-semibold">Nombre</TableHead>
            <TableHead className="font-semibold">CUIT</TableHead>
            <TableHead className="font-semibold">Teléfono</TableHead>
            <TableHead className="font-semibold text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => (
            <TableRow key={cliente.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-mono text-muted-foreground">{cliente.id}</TableCell>
              <TableCell className="font-mono">{cliente.dni || "—"}</TableCell>
              <TableCell className="font-medium">{cliente.apellido}</TableCell>
              <TableCell>{cliente.nombre}</TableCell>
              <TableCell className="font-mono">{cliente.cuit}</TableCell>
              <TableCell>{cliente.telefono || "—"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(cliente)}
                    className="h-8 w-8 text-primary hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(cliente.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClienteTable;
