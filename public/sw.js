const CACHE_NAME = 'unifsmedu-cache-v1';

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('[SW] Instalado');
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
    console.log('[SW] Ativado');
});

// Evento de fetch - Obrigatório para PWA (Add to Home Screen)
self.addEventListener('fetch', (event) => {
    // Responde com o recurso da rede ou do cache (estratégia simples)
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
