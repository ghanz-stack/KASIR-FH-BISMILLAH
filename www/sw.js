// ponytail: no-op service worker. App dibundle native via Capacitor jadi sudah offline
// by default; SW ini cuma supaya registration di index.html tidak 404 di log.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
