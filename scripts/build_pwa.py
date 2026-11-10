"""生成 PWA 所需文件：应用图标 + sw.js（离线缓存清单，版本号取文件内容哈希）。
改动网页/数据/图片后重新运行一次：python scripts/build_pwa.py
"""
import hashlib, json, os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
RED, BG = (234, 85, 48), (13, 10, 9)
FONT = 'C:/Windows/Fonts/msyhbd.ttc'


def icon(size, maskable=False):
    im = Image.new('RGBA', (size, size), BG if maskable else (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pad = int(size * (0.14 if maskable else 0.04))       # maskable 图标要留安全区
    s, e = pad, size - pad
    cut = int((e - s) * 0.16)                             # 与页面一致的切角
    d.polygon([(s, s), (e - cut, s), (e, s + cut), (e, e), (s + cut, e), (s, e - cut)], fill=RED)
    f = ImageFont.truetype(FONT, int((e - s) * 0.62))
    d.text((size / 2, size / 2), '规', font=f, fill='white', anchor='mm')
    return im


out = ROOT / 'assets' / 'app'
out.mkdir(parents=True, exist_ok=True)
for n in (192, 512):
    icon(n).save(out / f'icon-{n}.png')
icon(512, True).save(out / 'icon-maskable-512.png')
icon(180, True).convert('RGB').save(out / 'apple-touch-icon.png')

# 预缓存清单：页面本体 + 全部本地图片
files = ['./', 'index.html', 'style.css', 'app.js', 'data.js', 'maps.js', 'pwa.js', 'manifest.webmanifest']
for p in sorted((ROOT / 'assets').rglob('*')):
    if p.is_file():
        files.append(p.relative_to(ROOT).as_posix())
h = hashlib.sha1()
for f in files:
    if f != './':
        h.update(f.encode()); h.update((ROOT / f).read_bytes())
h.update((ROOT / 'scripts' / 'sw.template.js').read_bytes())   # 缓存逻辑变了也要换版本
version = h.hexdigest()[:10]

tpl = (ROOT / 'scripts' / 'sw.template.js').read_text(encoding='utf-8')
sw = tpl.replace('__VERSION__', version).replace('__FILES__', json.dumps(files, ensure_ascii=False, indent=0))
(ROOT / 'sw.js').write_text(sw, encoding='utf-8')
print(f'sw.js: {len(files)} files, version {version}')
