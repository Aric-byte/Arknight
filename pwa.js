// PWA：注册离线缓存、显示「安装应用」按钮、提示新版本
(() => {
  const btn = document.getElementById('btn-install');
  let deferred = null;
  const toast = msg => {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.hidden = true; }, 3000);
  };

  // Chrome / Edge / 安卓：浏览器允许安装时才出现按钮
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; btn.hidden = false; });
  btn.addEventListener('click', async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice.catch(() => null);
      deferred = null; btn.hidden = true;
    } else {
      toast('iPhone/iPad：在 Safari 里点「分享」→「添加到主屏幕」');
    }
  });
  window.addEventListener('appinstalled', () => { btn.hidden = true; toast('已安装，可以从桌面或主屏打开'); });

  // iOS Safari 没有安装事件：未安装时也显示按钮，点了给出步骤
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (!standalone && /iPhone|iPad|iPod/.test(navigator.userAgent)) btn.hidden = false;

  // 离线缓存只能在 https 或 localhost 下工作，直接双击打开文件时跳过
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const hadController = !!navigator.serviceWorker.controller;  // 首次访问时没有，不需要刷新
  // 每次打开都让 SW 补齐缺的图片（网络不稳时一次下不全）
  navigator.serviceWorker.ready.then(reg => setTimeout(() => reg.active?.postMessage('fill'), 3000)).catch(() => {});
  navigator.serviceWorker.register('sw.js').then(reg => {
    const ask = w => {
      if (!w || !hadController) return;
      toast('有新版本，正在更新…');
      w.postMessage('skipWaiting');
    };
    if (reg.waiting) ask(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed') ask(w); });
    });
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded || !hadController) return;
    reloaded = true; location.reload();
  });
})();
