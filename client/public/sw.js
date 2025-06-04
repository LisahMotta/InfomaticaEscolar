// Nome do cache
const CACHE_NAME = 'sala-informatica-v1';

// Lista de arquivos para cache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-96x96.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// Instalação do Service Worker e cache dos arquivos
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Fazendo cache dos arquivos estáticos');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Instalado com sucesso');
        return self.skipWaiting();
      })
  );
});

// Ativação do Service Worker e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando Service Worker...');
  
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Ativado com sucesso');
      return self.clients.claim();
    })
  );
});

// Estratégia de cache: Network First com fallback para cache
self.addEventListener('fetch', (event) => {
  // Não interceptar requisições para APIs
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request)
          .then(response => {
            if (response) {
              console.log('[Service Worker] Retornando do cache:', event.request.url);
              return response;
            }
            
            // Para navegação, retornar a página inicial do cache
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            
            return Promise.reject('Recurso não encontrado no cache');
          });
      })
  );
});

// Event listener para notificações push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recebido');
  
  let notificationData = {};
  
  try {
    if (event.data) {
      notificationData = event.data.json();
      console.log('[Service Worker] Dados da notificação:', notificationData);
    }
  } catch (e) {
    console.error('[Service Worker] Erro ao processar dados da notificação:', e);
  }
  
  const title = notificationData.title || 'Notificação do Sistema';
  const options = {
    body: notificationData.body || 'Você tem uma nova notificação',
    icon: notificationData.icon || '/icons/icon-192x192.svg',
    badge: '/icons/icon-96x96.svg',
    data: notificationData.data || {},
    vibrate: [100, 50, 100],
    actions: [
      {
        action: 'open',
        title: 'Abrir',
      },
      {
        action: 'close',
        title: 'Fechar',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Event listener para clique em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificação clicada:', event.notification.tag);
  
  event.notification.close();
  
  const urlToOpen = (event.notification.data && event.notification.data.url) ? 
    new URL(event.notification.data.url, self.location.origin).href : 
    '/';
  
  if (event.action === 'close') {
    console.log('[Service Worker] Notificação fechada');
    return;
  }
  
  console.log('[Service Worker] Abrindo:', urlToOpen);
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // Tentar encontrar uma janela já aberta para focar
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Se não encontrou, abrir uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});