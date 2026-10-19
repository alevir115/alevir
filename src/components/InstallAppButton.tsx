import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export const InstallAppButton = () => {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const { toast } = useToast();

  const isElectron = navigator.userAgent.includes("Electron") || window.location.protocol === "file:";
  if (isElectron) return null;

  if (isInstalled) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Check className="h-4 w-4" />
        App instalada
      </Button>
    );
  }

  const handleClick = async () => {
    if (!canInstall) {
      const inIframe = window.self !== window.top;
      toast({
        title: inIframe ? "Abrí la app publicada para instalarla" : "Instalá la app desde el navegador",
        description: inIframe
          ? "Desde la vista previa no se puede instalar. Entrá a https://alevir.lovable.app en Chrome o Edge."
          : "En Chrome o Edge: menú ⋮ → \"Transmitir, guardar y compartir\" → \"Instalar página como app\" (o el ícono de instalar en la barra de direcciones). En iPhone: Compartir → \"Agregar a inicio\".",
      });
      return;
    }
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      toast({ title: "¡App instalada en tu escritorio!" });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className="gap-2">
      <Download className="h-4 w-4" />
      Instalar app
    </Button>
  );
};
