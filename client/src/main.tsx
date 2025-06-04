import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Extender a interface Window para incluir deferredPrompt
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

// Função para registrar o Service Worker para PWA e notificações push
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      // Registrar o service worker para PWA
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado com sucesso:', registration.scope);
      
      // Verificar permissões de notificação se disponível
      if ("Notification" in window) {
        const existingPermission = Notification.permission;
        console.log("Permissão de notificação atual:", existingPermission);
      }
      
      // Verificar se o navegador suporta instalação de PWA
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevenir o comportamento padrão do Chrome 67 e anteriores
        e.preventDefault();
        // Guardar o evento para usar depois
        window.deferredPrompt = e;
        console.log('App pode ser instalado como PWA');
      });
      
      // Notificar quando o PWA for instalado com sucesso
      window.addEventListener('appinstalled', () => {
        console.log('Aplicação instalada com sucesso!');
        // Limpar o prompt guardado
        window.deferredPrompt = null;
      });
      
    } catch (error) {
      console.error("Erro ao registrar o Service Worker:", error);
    }
  } else {
    console.log("Este navegador não suporta Service Workers");
  }
}

// Inicializa o service worker após o carregamento da página
window.addEventListener("load", registerServiceWorker);

createRoot(document.getElementById("root")!).render(<App />);
