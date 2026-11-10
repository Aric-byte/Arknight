import re, json, sys
raw = open(sys.argv[1], encoding='utf-8').read()
out = sys.argv[2]

def split_top(s):
    # split template body by top-level |
    parts, depth, cur, i = [], 0, '', 0
    while i < len(s):
        if s.startswith('{{', i): depth += 1; cur += '{{'; i += 2; continue
        if s.startswith('}}', i): depth -= 1; cur += '}}'; i += 2; continue
        if s.startswith('[[', i): depth += 1; cur += '[['; i += 2; continue
        if s.startswith(']]', i): depth -= 1; cur += ']]'; i += 2; continue
        if s[i] == '|' and depth == 0: parts.append(cur); cur = ''; i += 1; continue
        cur += s[i]; i += 1
    parts.append(cur)
    return parts

def templates(text, name):
    res = []
    start = 0
    key = '{{' + name
    while True:
        i = text.find(key, start)
        if i < 0: break
        k = i + len(key)
        while k < len(text) and text[k] in ' \n\r\t': k += 1   # 允许模板名后换行
        if k >= len(text) or text[k] != '|':
            start = k; continue
        body_start = k + 1
        depth, j = 0, i
        while j < len(text):
            if text.startswith('{{', j): depth += 1; j += 2; continue
            if text.startswith('}}', j):
                depth -= 1; j += 2
                if depth == 0: break
                continue
            j += 1
        body = text[body_start:j-2]
        d = {}
        for p in split_top(body):
            if '=' in p:
                k, v = p.split('=', 1); d[k.strip()] = v.strip()
        res.append((i, d))
        start = j
    return res

def clean(s):
    prev = None
    while prev != s:
        prev = s
        s = re.sub(r'\{\{color\|[^|{}]*\|([^{}]*)\}\}', r'\1', s)
        s = re.sub(r'\{\{术语\|[^|{}]*\|([^{}]*)\}\}', r'\1', s)
        s = re.sub(r'\{\{[^|{}]*\|([^{}|]*)\}\}', r'\1', s)
    s = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', s)
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    s = s.replace('<br>', '\n').replace('<br/>', '\n').replace('<br />', '\n')
    s = re.sub(r'</?(?!>)[a-zA-Z][^>]*>', '', s)
    return s.strip()

roman = {'Ⅰ':1,'Ⅱ':2,'Ⅲ':3,'Ⅳ':4,'Ⅴ':5,'Ⅵ':6}
sec_core = raw.index('=== 核心盟约 ==='); sec_add = raw.index('=== 附加盟约 ==='); sec_end = raw.index('==S.W.E.E.P.策略报告==')
pacts = []
for pos, d in templates(raw[:sec_end], '卫戍协议/盟约'):
    eff = clean(d.get('效果',''))
    m6 = re.search(r'<(?:在场)?(\d+)名不同', eff)
    pacts.append({'name': d['盟约'], 'type': 'core' if pos < sec_add else 'extra',
                  'need': int(d.get('人数','0') or 0), 'effect': eff,
                  'upgrade': int(m6.group(1)) if m6 else None})

db0 = raw.index('==干员数据库=='); db1 = raw.index('==机变阶段==')
db = raw[db0:db1]
heads = [(m.start(), roman[m.group(1)]) for m in re.finditer(r'\|(Ⅰ|Ⅱ|Ⅲ|Ⅳ|Ⅴ|Ⅵ)\}\}阶干员', db)]
ops = []
for pos, d in templates(db, '卫戍协议/参战干员'):
    tier = max([t for p,t in heads if p < pos] or [0])
    bonds = [d[k] for k in sorted(d) if re.fullmatch(r'盟约\d+', k) and d[k]]
    ops.append({'name': d.get('干员'), 'tier': tier, 'pacts': bonds,
                'traitType': d.get('特质类型',''),
                'trait': clean(d.get('特质1','')), 'traitElite': clean(d.get('特质2',''))})
extra_keys = set()
for _, d in templates(db, '卫戍协议/参战干员'): extra_keys |= set(d)
# 装备数据库：{{:卫戍协议/道具|类型=装备|等阶=|名称=|售价=|效果=【基础】...<br>【进阶】...|描述=}}
eq0 = raw.index('== 装备数据库 ==')
eq1 = raw.index('\n== ', eq0 + 5)
equips = []
for _, d in templates(raw[eq0:eq1], ':卫戍协议/道具'):
    if d.get('类型') != '装备':
        continue
    eff = clean(d.get('效果', ''))
    base, _, adv = eff.partition('\n')
    note = ''
    if '【基础&进阶】' in base:          # 基础/进阶相同；后面的行是补充说明
        base, note, adv = base.replace('【基础&进阶】', ''), adv, ''
    equips.append({'name': d['名称'], 'tier': int(d.get('等阶', '0') or 0), 'price': int(d.get('售价', '0') or 0),
                   'base': base.replace('【基础】', '').strip(), 'adv': adv.replace('【进阶】', '').strip(),
                   'note': note.strip(), 'desc': clean(d.get('描述', ''))})
json.dump({'pacts': pacts, 'operators': ops, 'equips': equips}, open(out,'w',encoding='utf-8'), ensure_ascii=False, indent=1)
from collections import Counter
with open(out + '.log', 'w', encoding='utf-8') as f:
    print(len(pacts), [(p['name'],p['type'],p['need'],p['upgrade']) for p in pacts], file=f)
    print(len(ops), Counter(o['tier'] for o in ops), file=f)
    print(Counter(b for o in ops for b in o['pacts']), file=f)
    print('keys', extra_keys, file=f)
    print([o['name'] for o in ops if not o['pacts']], file=f)
