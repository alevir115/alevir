import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CloudSun, MapPin } from "lucide-react";

interface Localidad {
  id: string;
  nombre: string;
  departamento: { nombre: string };
  centroide: { lat: number; lon: number };
}

const weatherText = (c: number) => {
  if (c === 0) return "Despejado";
  if (c <= 3) return "Parcialmente nublado";
  if (c <= 48) return "Niebla";
  if (c <= 67) return "Lluvia";
  if (c <= 77) return "Nieve";
  if (c <= 82) return "Chaparrones";
  return "Tormenta";
};

const ConsultarClima = () => {
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [sel, setSel] = useState<Localidad | null>(null);

  const { data: localidades = [], isLoading } = useQuery({
    queryKey: ["localidades-santafe"],
    enabled: open,
    staleTime: Infinity,
    queryFn: async () => {
      const r = await fetch(
        "https://apis.datos.gob.ar/georef/api/localidades?provincia=santa%20fe&max=1000&campos=id,nombre,departamento.nombre,centroide&orden=nombre"
      );
      if (!r.ok) throw new Error("Error localidades");
      const j = await r.json();
      return j.localidades as Localidad[];
    },
  });

  const { data: clima, isLoading: cargandoClima, isError } = useQuery({
    queryKey: ["clima", sel?.id],
    enabled: !!sel,
    queryFn: async () => {
      const r = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${sel!.centroide.lat}&longitude=${sel!.centroide.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=America%2FArgentina%2FBuenos_Aires`
      );
      if (!r.ok) throw new Error("Error clima");
      return (await r.json()).current;
    },
  });

  const lista = localidades.filter((l) =>
    l.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <CloudSun className="h-4 w-4" />
        Consultar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Clima en localidades de Santa Fe</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Buscar localidad..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            autoComplete="off"
          />
          <div className="max-h-60 overflow-y-auto rounded-md border">
            {isLoading ? (
              <p className="p-3 text-sm text-muted-foreground">Cargando localidades...</p>
            ) : (
              lista.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSel(l)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent ${
                    sel?.id === l.id ? "bg-accent" : ""
                  }`}
                >
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>{l.nombre}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{l.departamento?.nombre}</span>
                </button>
              ))
            )}
          </div>
          {sel && (
            <div className="rounded-md border bg-muted/40 p-4">
              <p className="font-semibold text-foreground">{sel.nombre}</p>
              {cargandoClima ? (
                <p className="text-sm text-muted-foreground">Cargando clima...</p>
              ) : isError || !clima ? (
                <p className="text-sm text-destructive">No se pudo obtener el clima.</p>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <span className="text-3xl font-bold text-foreground">{Math.round(clima.temperature_2m)}°C</span>
                  <span className="self-center text-muted-foreground">{weatherText(clima.weather_code)}</span>
                  <span>Humedad: {clima.relative_humidity_2m}%</span>
                  <span>Viento: {clima.wind_speed_10m} km/h</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConsultarClima;
