// Registra el service worker solo en la app publicada (no en la vista previa, ni en dev, ni en Electron).
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const inIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  const host = window.location.hostname;
  const isPreview = host.includes("id-preview--") || host.includes("lovableproject.com");
  const isElectron = navigator.userAgent.includes("Electron") || window.location.protocol === "file:";

  if (!import.meta.env.PROD || inIframe || isPreview || isElectron) {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    return;
  }

  import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true }));
}
