// 由 scripts/build_pwa.py 生成，不要直接改 sw.js
const VERSION = '2af438acf5';
const CACHE = 'guicheng-' + VERSION;
const FONT_CACHE = 'guicheng-fonts';
const FILES = [
"./",
"index.html",
"style.css",
"app.js",
"data.js",
"maps.js",
"pwa.js",
"manifest.webmanifest",
"assets/app/apple-touch-icon.png",
"assets/app/icon-192.png",
"assets/app/icon-512.png",
"assets/app/icon-maskable-512.png",
"assets/avatars/Miss.Christine.webp",
"assets/avatars/Mon3tr.webp",
"assets/avatars/W.webp",
"assets/avatars/“暴躁铁皮”.webp",
"assets/avatars/乌啾.webp",
"assets/avatars/乌尔比安.webp",
"assets/avatars/乌有.webp",
"assets/avatars/云迹.webp",
"assets/avatars/仇白.webp",
"assets/avatars/伊桑.webp",
"assets/avatars/伺夜.webp",
"assets/avatars/余.webp",
"assets/avatars/佩佩.webp",
"assets/avatars/克莱门莎.webp",
"assets/avatars/冻河.webp",
"assets/avatars/凛御银灰.webp",
"assets/avatars/凯瑟琳.webp",
"assets/avatars/初雪.webp",
"assets/avatars/华法琳.webp",
"assets/avatars/卡涅利安.webp",
"assets/avatars/卡达.webp",
"assets/avatars/历阵锐枪芬.webp",
"assets/avatars/可露希尔.webp",
"assets/avatars/史尔特尔.webp",
"assets/avatars/吉星.webp",
"assets/avatars/哈洛德.webp",
"assets/avatars/圣聆初雪.webp",
"assets/avatars/地灵.webp",
"assets/avatars/塔露拉.webp",
"assets/avatars/塞雷娅.webp",
"assets/avatars/复奏.webp",
"assets/avatars/夏栎.webp",
"assets/avatars/夕.webp",
"assets/avatars/夜莺.webp",
"assets/avatars/奥尔佳.webp",
"assets/avatars/奥斯塔.webp",
"assets/avatars/妮芙.webp",
"assets/avatars/安哲拉.webp",
"assets/avatars/安洁莉娜.webp",
"assets/avatars/宴.webp",
"assets/avatars/寒檀.webp",
"assets/avatars/山.webp",
"assets/avatars/帕拉斯.webp",
"assets/avatars/幽灵鲨.webp",
"assets/avatars/异客.webp",
"assets/avatars/引星棘刺.webp",
"assets/avatars/归溟幽灵鲨.webp",
"assets/avatars/忍冬.webp",
"assets/avatars/怒潮凛冬.webp",
"assets/avatars/慕斯.webp",
"assets/avatars/承曦格雷伊.webp",
"assets/avatars/折光.webp",
"assets/avatars/折桠.webp",
"assets/avatars/拉普兰德.webp",
"assets/avatars/拜松.webp",
"assets/avatars/摆渡人.webp",
"assets/avatars/斥罪.webp",
"assets/avatars/斯卡蒂.webp",
"assets/avatars/旅骨.webp",
"assets/avatars/星极.webp",
"assets/avatars/星源.webp",
"assets/avatars/机械师.webp",
"assets/avatars/杰克.webp",
"assets/avatars/极光.webp",
"assets/avatars/棘刺.webp",
"assets/avatars/森蚺.webp",
"assets/avatars/歌蕾蒂娅.webp",
"assets/avatars/水月.webp",
"assets/avatars/水灯心.webp",
"assets/avatars/泡泡.webp",
"assets/avatars/波登可.webp",
"assets/avatars/流明.webp",
"assets/avatars/浊心斯卡蒂.webp",
"assets/avatars/海沫.webp",
"assets/avatars/涤火杰西卡.webp",
"assets/avatars/淬羽赫默.webp",
"assets/avatars/深巡.webp",
"assets/avatars/深靛.webp",
"assets/avatars/渡桥.webp",
"assets/avatars/温蒂.webp",
"assets/avatars/溯光星源.webp",
"assets/avatars/灰喉.webp",
"assets/avatars/灵知.webp",
"assets/avatars/烈夏.webp",
"assets/avatars/烛煌.webp",
"assets/avatars/焰尾.webp",
"assets/avatars/玛恩纳.webp",
"assets/avatars/瑕光.webp",
"assets/avatars/瑰盐.webp",
"assets/avatars/白铁.webp",
"assets/avatars/盟约·辅助干员.webp",
"assets/avatars/真理.webp",
"assets/avatars/真言.webp",
"assets/avatars/矩.webp",
"assets/avatars/砾.webp",
"assets/avatars/空弦.webp",
"assets/avatars/纯烬艾雅法拉.webp",
"assets/avatars/维伊.webp",
"assets/avatars/维娜·维多利亚.webp",
"assets/avatars/缪尔赛思.webp",
"assets/avatars/罗比菈塔.webp",
"assets/avatars/耀骑士临光.webp",
"assets/avatars/老鲤.webp",
"assets/avatars/耶拉.webp",
"assets/avatars/至简.webp",
"assets/avatars/艾丝黛尔.webp",
"assets/avatars/艾丽妮.webp",
"assets/avatars/艾雅法拉.webp",
"assets/avatars/荒芜拉普兰德.webp",
"assets/avatars/莎草.webp",
"assets/avatars/蓝毒.webp",
"assets/avatars/蕾缪安.webp",
"assets/avatars/薇薇安娜.webp",
"assets/avatars/蛇屠箱.webp",
"assets/avatars/褐果.webp",
"assets/avatars/角峰.webp",
"assets/avatars/贝洛内.webp",
"assets/avatars/赫德雷.webp",
"assets/avatars/赫拉格.webp",
"assets/avatars/车尔尼.webp",
"assets/avatars/远牙.webp",
"assets/avatars/迷迭香.webp",
"assets/avatars/逻各斯.webp",
"assets/avatars/遥.webp",
"assets/avatars/酒神.webp",
"assets/avatars/野鬃.webp",
"assets/avatars/铃兰.webp",
"assets/avatars/铸铁.webp",
"assets/avatars/锏.webp",
"assets/avatars/锡人.webp",
"assets/avatars/阿米娅.webp",
"assets/avatars/陨星.webp",
"assets/avatars/隐德来希.webp",
"assets/avatars/雪猎.webp",
"assets/avatars/霍尔海雅.webp",
"assets/avatars/霜叶.webp",
"assets/avatars/青枳.webp",
"assets/avatars/风丸.webp",
"assets/avatars/风絮.webp",
"assets/avatars/魔王.webp",
"assets/avatars/鸿雪.webp",
"assets/avatars/黍.webp",
"assets/avatars/黑键.webp",
"assets/equips/M3茧甲.webp",
"assets/equips/一次性促销券.webp",
"assets/equips/不屈弹射器.webp",
"assets/equips/不退者之盾.webp",
"assets/equips/不退者力场.webp",
"assets/equips/不退者卫护系统.webp",
"assets/equips/乌萨斯呼吸器.webp",
"assets/equips/人事部文档.webp",
"assets/equips/人事部记录.webp",
"assets/equips/伊比利亚骨刺刀.webp",
"assets/equips/伪装服.webp",
"assets/equips/佣兵名牌.webp",
"assets/equips/信标.webp",
"assets/equips/加速维式重锤.webp",
"assets/equips/动能加速器.webp",
"assets/equips/动能单手弩.webp",
"assets/equips/动能轰击弩.webp",
"assets/equips/博士投影.webp",
"assets/equips/卡西米尔竞技旗.webp",
"assets/equips/卫戍推荐信.webp",
"assets/equips/双模机械臂.webp",
"assets/equips/变形同构体.webp",
"assets/equips/叙拉古正装.webp",
"assets/equips/可靠怀表.webp",
"assets/equips/坚固维式重锤.webp",
"assets/equips/坚守盾牌.webp",
"assets/equips/多功能补剂.webp",
"assets/equips/天马之枪.webp",
"assets/equips/天马之盔.webp",
"assets/equips/天马之耀.webp",
"assets/equips/定期存折.webp",
"assets/equips/寻呼模块.webp",
"assets/equips/战栗维式重锤.webp",
"assets/equips/投机骰子.webp",
"assets/equips/护盾无人机.webp",
"assets/equips/拟态物质.webp",
"assets/equips/歌利亚头盔.webp",
"assets/equips/汲取者之喙.webp",
"assets/equips/汲取者之心.webp",
"assets/equips/汲取者之镰.webp",
"assets/equips/源石溶剂.webp",
"assets/equips/灵巧涡轮手套.webp",
"assets/equips/灼燃维式重锤.webp",
"assets/equips/炎国短刀.webp",
"assets/equips/瓶装烈性反应.webp",
"assets/equips/电流维式重锤.webp",
"assets/equips/突袭手雷.webp",
"assets/equips/简易通讯机.webp",
"assets/equips/精准狙击镜.webp",
"assets/equips/精打细算玩偶.webp",
"assets/equips/紧急调度券.webp",
"assets/equips/终极维式重锤.webp",
"assets/equips/维式重锤.webp",
"assets/equips/聚合急救箱.webp",
"assets/equips/莱塔尼亚小鼓.webp",
"assets/equips/萨尔贡浓茶.webp",
"assets/equips/虹彩活血饮料.webp",
"assets/equips/蜂鸣器.webp",
"assets/equips/见钱眼开玩偶.webp",
"assets/equips/谢拉格不融冰.webp",
"assets/equips/迅捷作战粮.webp",
"assets/equips/阿戈尔重刃.webp",
"assets/equips/随身身份牌.webp",
"assets/equips/雪祀之衣.webp",
"assets/equips/驮兽储蓄罐.webp",
"assets/equips/驱逐者瓦斯.webp",
"assets/equips/驱逐者警棍.webp",
"assets/equips/驱逐者防暴装备.webp",
"assets/icons/arcaneShip.webp",
"assets/icons/deputShip.webp",
"assets/icons/docShip.webp",
"assets/icons/egirShip.webp",
"assets/icons/emptyShip.webp",
"assets/icons/iberiaShip.webp",
"assets/icons/indomShip.webp",
"assets/icons/investShip.webp",
"assets/icons/kazimierzShip.webp",
"assets/icons/kjeragShip.webp",
"assets/icons/lethaniaShip.webp",
"assets/icons/maniShip.webp",
"assets/icons/miraShip.webp",
"assets/icons/preciShip.webp",
"assets/icons/raidShip.webp",
"assets/icons/sargonShip.webp",
"assets/icons/siracusaShip.webp",
"assets/icons/skillfulShip.webp",
"assets/icons/soloShip.webp",
"assets/icons/steadShip.webp",
"assets/icons/suntShip.webp",
"assets/icons/swiftShip.webp",
"assets/icons/ursusShip.webp",
"assets/icons/victoriaShip.webp",
"assets/icons/visiShip.webp",
"assets/icons/yanShip.webp",
"assets/maps/01-1.webp",
"assets/maps/01-2.webp",
"assets/maps/01-3.webp",
"assets/maps/02-1.webp",
"assets/maps/02-2.webp",
"assets/maps/02-3.webp",
"assets/maps/03-1.webp",
"assets/maps/03-2.webp",
"assets/maps/03-3.webp",
"assets/maps/04-1.webp",
"assets/maps/04-2.webp",
"assets/maps/04-3.webp",
"assets/maps/05-1.webp",
"assets/maps/05-2.webp",
"assets/maps/05-3.webp",
"assets/maps/06-1.webp",
"assets/maps/06-2.webp",
"assets/maps/06-3.webp",
"assets/maps/09-1.webp",
"assets/maps/09-2.webp",
"assets/maps/09-3.webp",
"assets/maps/10-1.webp",
"assets/maps/10-2.webp",
"assets/maps/10-3.webp",
"assets/maps/11-1.webp",
"assets/maps/11-2.webp",
"assets/maps/11-3.webp",
"assets/maps/12-1.webp",
"assets/maps/12-2.webp",
"assets/maps/12-3.webp"
];

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
