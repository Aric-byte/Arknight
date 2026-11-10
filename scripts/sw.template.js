// 由 scripts/build_pwa.py 生成，不要直接改 sw.js
const VERSION = '__VERSION__';
const CACHE = 'guicheng-' + VERSION;
const FONT_CACHE = 'guicheng-fonts';
const FILES = __FILES__;

// 路径逐段 encodeURIComponent，与页面里图片地址的写法一致
const url = f => f.split('/').map(encodeURIComponent).join('/');
const CORE = FILES.filter(f => !f.startsWith('assets/') || f.startsWith('assets/app/')).map(url);
const MEDIA = FILES.filter(f => f.startsWith('assets/') && !f.startsWith('assets/app/')).map(url);

// 单个文件：超时 + 重试；网络不稳时不会因为一张图失败就整个安装失败
async function fetchInto(cache, u, tries = 3) {
  if (await cache.match(u)) return true;
  for (let i = 0; i < tries; i++) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 20000);
      const r = await fetch(u, { signal: ctl.signal, cache: 'no-cache' });
      clearTimeout(t);
      if (r.ok) { await cache.put(u, r); return true; }
    } catch { /* 重试 */ }
    await new Promise(r => setTimeout(r, 1500 * (i + 1)));   // 稍等再试，避免连续撞上断线
  }
  return false;
}
// 图片并发下载（4 路），失败的忽略，之后打开页面时会再补
async function fillMedia(cache) {
  const queue = [...MEDIA];
  const worker = async () => { while (queue.length) await fetchInto(cache, queue.shift()); };
  await Promise.all(Array.from({ length: 4 }, worker));
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // 旧版本缓存里已有的图片直接复制过来，不用重新下载
    for (const k of await caches.keys()) {
      if (!k.startsWith('guicheng-') || k === CACHE || k === FONT_CACHE) continue;
      const old = await caches.open(k);
      for (const u of MEDIA) {
        const hit = await old.match(u);
        if (hit) await cache.put(u, hit);
      }
    }
    const ok = await Promise.all(CORE.map(u => fetchInto(cache, u, 4)));
    if (ok.includes(false)) throw new Error('核心文件下载失败');   // 核心文件必须齐全；图片在激活后再补
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('guicheng-') && k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
    await fillMedia(await caches.open(CACHE));   // 激活后在后台下载全部图片
  })());
});

// 页面每次打开都会发 'fill'：把上次网络不好没下到的图片补上（已缓存的会跳过）
let filling = null;
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
  if (e.data === 'fill') {
    filling ||= caches.open(CACHE).then(fillMedia).finally(() => { filling = null; });
    e.waitUntil(filling);
  }
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  // Google 字体：缓存优先，联网时顺便更新
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONT_CACHE).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (u.origin !== location.origin) return;
  // 本站文件：缓存优先（忽略 ?t= 之类的查询参数）；没有就联网取，并顺手存进缓存
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const r = await fetch(req);
    if (r.ok && u.search === '') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
    return r;
  })());
});
