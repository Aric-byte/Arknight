// 由 scripts/build_pwa.py 生成，不要直接改 sw.js
const VERSION = '__VERSION__';
const CACHE = 'guicheng-' + VERSION;
const FONT_CACHE = 'guicheng-fonts';
const FILES = __FILES__;

self.addEventListener('install', e => {
  // 路径逐段 encodeURIComponent，与页面里图片地址的写法一致
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => f.split('/').map(encodeURIComponent).join('/')))));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith('guicheng-') && k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Google 字体：缓存优先，联网时顺便更新
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONT_CACHE).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // 本站文件：缓存优先（忽略 ?t= 之类的查询参数），没有再走网络
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
