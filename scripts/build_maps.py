"""把游戏关卡数据转成格子部署用的 maps.js。

关卡数据来自 Kengxxiao/ArknightsGameData:
  zh_CN/gamedata/levels/activities/act3autochess/level_act3autochess_mXX/level_act3autochess_mXX_sub_0Y.json
  （mXX = 战场编号，sub_0Y = 场地 Y）

用法:
  sh fetch_levels.sh 关卡目录          # 下载 30 个场地文件
  python build_maps.py 关卡目录 ../maps.js

输出每个场地「我方半场」的格子（左半边，第 0~10 列），以及从红门到蓝门的敌人最短路线。
格子字符:
  .  可部署地面    f 可部署（围栏边）   # 高台（仅远程）   g/m/u/n 特殊地块（可部署）
  _  不可部署地面  X 禁区               S 敌人出发点(红门)  E 保护点(蓝门)
  i/o 传送入口/出口
"""
import json, os, sys
from collections import deque

LEVEL_DIR, OUT = sys.argv[1], sys.argv[2]
BATTLES = [1, 2, 3, 4, 5, 6, 9, 10, 11, 12]
CH = {'tile_road': '.', 'tile_fence_bound': 'f', 'tile_wall': '#', 'tile_floor': '_',
      'tile_forbidden': 'X', 'tile_start': 'S', 'tile_end': 'E', 'tile_telin': 'i', 'tile_telout': 'o',
      'tile_duel_grassland': 'g', 'tile_mire': 'm', 'tile_speedup': 'u', 'tile_infection': 'n',
      'tile_achand': 'X', 'tile_acbag': 'X', 'tile_acempty': 'X'}
BATTLE_CH = set('.f#gmunE')        # 用来判断哪些行属于战斗区
LR_BOUNDARY = 10                   # player_map_lr_boundary_col


def load(path):
    d = json.load(open(path, encoding='utf-8'))
    md = d['mapData']
    grid = [[CH.get(md['tiles'][x]['tileKey'], 'X') for x in row] for row in md['map']]
    walk = [[md['tiles'][x]['passableMask'] == 'ALL' and md['tiles'][x]['tileKey'] != 'tile_forbidden'
             for x in row] for row in md['map']]
    limit = d['options'].get('characterLimit', 8)
    return grid, walk, limit


def enemy_paths(grid, walk):
    """每个红门（及传送出口）BFS 到最近的蓝门（4 邻接，只走 passable=ALL 的格子）。坐标为 (行, 列)，行从上往下。"""
    h, w = len(grid), len(grid[0])
    paths = []
    for sr in range(h):
        for sc in range(w):
            if grid[sr][sc] not in 'So':
                continue
            prev = {(sr, sc): None}
            q = deque([(sr, sc)])
            goal = None
            while q:
                r, c = q.popleft()
                if grid[r][c] == 'E':
                    goal = (r, c); break
                for dr, dc in ((0, -1), (1, 0), (-1, 0), (0, 1)):
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < h and 0 <= nc < w and (nr, nc) not in prev and walk[nr][nc]:
                        prev[(nr, nc)] = (r, c); q.append((nr, nc))
            if goal:
                p, cur = [], goal
                while cur:
                    p.append(cur); cur = prev[cur]
                paths.append(p[::-1])
    return paths


def crop(grid):
    """取左半场（含边界列），只保留包含战斗格子的行，再按非禁区收紧列范围。"""
    rows = [r for r, row in enumerate(grid) if any(ch in BATTLE_CH for ch in row[:LR_BOUNDARY + 1])]
    r0, r1 = min(rows), max(rows)
    cols = [c for r in range(r0, r1 + 1) for c in range(LR_BOUNDARY + 1) if grid[r][c] != 'X']
    c0, c1 = min(cols), max(cols)
    return r0, r1, c0, c1


maps = {}
for b in BATTLES:
    for s in (1, 2, 3):
        path = os.path.join(LEVEL_DIR, f'level_act3autochess_m{b:02d}_sub_0{s}.json')
        grid, walk, limit = load(path)
        r0, r1, c0, c1 = crop(grid)
        cells = [''.join(grid[r][c0:c1 + 1]) for r in range(r0, r1 + 1)]
        ps = []
        for p in enemy_paths(grid, walk):
            q = [[r - r0, c - c0] for r, c in p if r0 <= r <= r1 and c0 <= c <= c1]
            if len(q) > 1 and q not in ps:
                ps.append(q)
        maps[f'{b:02d}-{s}'] = {'cells': cells, 'paths': ps, 'limit': limit}

src = '// 格子数据来源：Kengxxiao/ArknightsGameData（act3autochess 关卡），由 scripts/build_maps.py 生成\n'
src += 'window.SP_GRIDS = ' + json.dumps(maps, ensure_ascii=False) + ';\n'
open(OUT, 'w', encoding='utf-8').write(src)
deploy = {k: sum(row.count(ch) for row in v['cells'] for ch in '.f#gmun') for k, v in maps.items()}
print(len(maps), 'maps; deployable cells:', deploy)
