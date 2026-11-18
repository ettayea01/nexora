// NEXORA Service Worker — versioned, relative URLs only (subpath-safe: GitHub Pages /nexora/)
const CACHE='nexora-shell-v1';
const ASSETS=['./','./index.html','./offline.html','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./src/styles/main.css','./src/js/db.js','./src/js/utils.js','./src/js/i18n.js','./src/js/ui.js','./src/js/sync.js','./src/js/app.js','./src/js/modules/dashboard.js','./src/js/modules/notes.js','./src/js/modules/tasks.js','./src/js/modules/calendar.js','./src/js/modules/library.js','./src/js/modules/focus.js','./src/js/modules/finance.js','./src/js/modules/toolbox.js','./src/js/modules/files.js','./src/js/modules/settings.js','./src/js/vendor/qrcode.min.js','./src/js/vendor/pdf.min.js','./src/js/vendor/pdf.worker.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;
 if(req.mode==='navigate'){e.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r}).catch(()=>caches.match('./index.html').then(r=>r||caches.match('./offline.html'))));return}
 e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(r=>{if(r.ok&&new URL(req.url).origin===location.origin){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return r}).catch(()=>caches.match('./offline.html'))))});
