"""把 parse_prts.py 生成的 data.json 转成网页用的 data.js（含激活档位）。
用法: python build_data.py data.json ../data.js"""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from image_list import ICON
d = json.load(open(sys.argv[1], encoding='utf-8'))
# 战场地图（assets/maps/<战场>-<场地>.webp），来自 PRTS「卫戍协议·规程/战场一览」
d['maps'] = [{'id': f'{b:02d}-{s}', 'name': f'战场 #{b:02d} · 场地{s}'} for b in (1,2,3,4,5,6,9,10,11,12) for s in (1,2,3)]
d['deployLimit'] = 8
for p in d['pacts']:
    if p['name'] == '绝技':
        p['thresholds'] = [2, 5]; p['special'] = 'elite'
    elif p['name'] == '独行':
        p['thresholds'] = [1]; p['special'] = 'solo'
    elif p['name'] == '调和':
        p['thresholds'] = [1]; p['special'] = 'harmony'
    else:
        up = p['upgrade']
        if not up:   # PRTS 表格没写第二档时，从效果里的「<在场N名…>」补上（如【聚合】3 人）
            ns = [int(n) for n in re.findall(r'在场(\d+)名', p['effect']) if int(n) > p['need']]
            up = min(ns) if ns else None
        p['thresholds'] = [p['need']] + ([up] if up else [])
        # 只有明确写了「整备区的【X】干员也可用于激活盟约」才算整备区计数（卡西米尔只是提到召唤整备区干员）
        p['special'] = 'bench' if '整备区的【' + p['name'] + '】干员也可用于激活盟约' in p['effect'] else None
    p['icon'] = ICON[p['name']]
    p.pop('need'); p.pop('upgrade')
src = '// 数据来源：PRTS Wiki「卫戍协议·规程/PRTS盟约记录」（文字 CC BY-NC-SA 3.0）\n'
src += 'window.SP_DATA = ' + json.dumps(d, ensure_ascii=False, indent=1) + ';\n'
open(sys.argv[2], 'w', encoding='utf-8').write(src)
print(len(d['pacts']), len(d['operators']))
