"""把 parse_prts.py 生成的 data.json 转成网页用的 data.js（含激活档位）。
用法: python build_data.py data.json ../data.js"""
import json, sys, os
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
        p['thresholds'] = [p['need']] + ([p['upgrade']] if p['upgrade'] else [])
        p['special'] = 'bench' if '整备区' in p['effect'] else None
    p['icon'] = ICON[p['name']]
    p.pop('need'); p.pop('upgrade')
src = '// 数据来源：PRTS Wiki「卫戍协议·规程/PRTS盟约记录」（文字 CC BY-NC-SA 3.0）\n'
src += 'window.SP_DATA = ' + json.dumps(d, ensure_ascii=False, indent=1) + ';\n'
open(sys.argv[2], 'w', encoding='utf-8').write(src)
print(len(d['pacts']), len(d['operators']))
