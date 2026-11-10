"""根据 data.json 生成 PRTS 图片下载清单（MediaWiki 标准路径：md5 前 1/2 位）。
输出每行: 本地路径<TAB>URL
用法: python image_list.py data.json > images.tsv
然后: sh fetch_images.sh images.tsv 输出目录（再自行转成 webp 放进 assets/）"""
import json, sys, hashlib, urllib.parse

ICON = {'炎': 'yanShip', '远见': 'visiShip', '维多利亚': 'victoriaShip', '叙拉古': 'siracusaShip',
        '卡西米尔': 'kazimierzShip', '迅捷': 'swiftShip', '坚守': 'steadShip', '灵巧': 'skillfulShip',
        '奥术': 'arcaneShip', '萨尔贡': 'sargonShip', '突袭': 'raidShip', '精准': 'preciShip',
        '奇迹': 'miraShip', '调和': 'maniShip', '谢拉格': 'kjeragShip', '投资人': 'investShip',
        '不屈': 'indomShip', '协防干员': 'emptyShip', '独行': 'soloShip', '绝技': 'suntShip',
        '阿戈尔': 'egirShip', '助力': 'deputShip', '乌萨斯': 'ursusShip', '伊比利亚': 'iberiaShip',
        '莱塔尼亚': 'lethaniaShip', '聚合': 'docShip'}


def url(fn):
    fn = fn.replace(' ', '_')
    h = hashlib.md5(fn.encode('utf-8')).hexdigest()
    return f"https://media.prts.wiki/{h[0]}/{h[:2]}/{urllib.parse.quote(fn)}"


if __name__ == '__main__':
    d = json.load(open(sys.argv[1], encoding='utf-8'))
    sys.stdout.reconfigure(encoding='utf-8')
    for o in d['operators']:
        print(f"avatars/{o['name']}.png\t{url('头像_' + o['name'] + '.png')}")
    for p in d['pacts']:
        print(f"icons/{ICON[p['name']]}.png\t{url('卫戍协议：盟约_icon_' + ICON[p['name']] + '.png')}")
    for e in d.get('equips', []):
        print(f"equips/{e['name']}.png\t{url('卫戍协议 道具 ' + e['name'] + '.png')}")
