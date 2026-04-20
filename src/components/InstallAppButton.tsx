import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export const InstallAppButton = () => {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const { toast } = useToast();

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
      toast({
        title: "Instalación no disponible",
        description:
          "Tu navegador no soporta instalación automática. En Chrome/Edge buscá el ícono ⊕ en la barra de direcciones.",
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
