// Este é um Service Worker genérico e leve necessário apnes para habilitar a instalação PWA (Add to Homescreen).
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Ignora o fetch para não interferir na navegação padrão, apenas para enganar o Chrome e aceitar PWA
});
