# 卫戍协议·规程 阵容编辑器

纯前端网页，**直接双击 `index.html` 就能用**，不需要本地服务器。图片都在本地 `assets/` 里，断网也能用（只有标题用的 Barlow Condensed 字体来自 Google Fonts，断网时会换成系统字体）。

## 两个页面
### 阵容编辑
- 左侧：带图标的盟约筛选（同时具备 / 任一）、阶数筛选
- 中间：带头像的干员卡片，按阶数分组；可以用「全部普通 / 全部精锐」切换显示哪种特质；支持搜索名字、盟约、特质关键词
- 点击卡片放上场，按住 Shift 点击或右键放进整备区
- 右侧：场上（默认 8 格，对应部署上限 8）和整备区的头像格子。点头像打开干员详情，右键在场上和整备区之间移动，点右上角「精」切换精锐状态
- 干员详情：查看特质，设为精锐，移到场上或整备区，移出阵容；**每人最多带 2 件装备**（70 件规程装备，可以切换基础/进阶）。两件能组合的装备会提示组合结果（如天马之盔+天马之枪→天马之耀）
- 盟约激活：显示人数、档位和效果全文；差 1 人就能升档时，会列出可以补上的干员头像，点头像直接加入

### 战场部署
- 收录 10 个战场 × 3 个场地，共 30 个场地（规程版本）。格子布局来自游戏关卡数据，显示的是我方半场
- 格子类型：可部署地面、围栏边（可部署）、高台（仅远程）、特殊地块、不可部署地面、红门、保护点、传送点
- 红色虚线是敌人从红门（或传送出口）走到保护点的最短路线（按格子 BFS 估算，不是游戏实际寻路）
- 部署方式：把干员拖到可部署格上，或者先点干员、再点格子；拖到已有干员的格子会互换位置；双击或拖出棋盘就撤回
- 朝向：点选已部署的干员，在下方工具条里选上下左右，也可以用方向键，或右键干员顺时针旋转。绿色虚框是它的「身前一格」，Delete 撤回，Esc 取消选中
- 棋子上会显示朝向箭头和携带的装备图标
- 每个场地的站位分别保存；「实景参考图」里可以对照 PRTS 的场地截图

## 盟约规则
- 同一名干员只算 1 人（对应游戏里的"不同干员"）
- 【调和】：场上出现过的核心盟约，激活人数各 +1
- 【独行】：场上恰好 1 名时生效，2 名及以上失效
- 【绝技】：按场上精锐状态的干员数计算
- 【远见】【奇迹】【投资人】：整备区里的干员也计数

## 其他功能
- 禁用盟约：点选本局被 ban 的盟约后，核心盟约全部被 ban 的干员会自动禁用（附加盟约不算；没有核心盟约的干员要附加盟约全被 ban 才禁用）
- 预设：可以保存、载入、覆盖、删除多套阵容。每套里有场上、整备区、精锐、装备、场上上限，以及各地图的站位和朝向（保存在浏览器 localStorage 里）
- 导出 / 导入：在「预设」里把全部预设导出成一个 JSON 文件，或者从文件导入。导入时会跳过重复的预设。用来备份，或者在双击版、安装版和手机之间搬存档（这几处的存档互相看不到）
- 分享：复制一个带阵容和装备的链接（站位和朝向只保存在本机）

## 安装成应用（PWA）
页面可以安装成独立窗口的应用，装好后能离线使用。全部 279 个文件（约 4MB）都会缓存到本地。
- **只能在 https 网址或 localhost 下安装**。直接双击 index.html 打开也能正常使用，只是不能安装、没有离线缓存。
- **本机电脑**：双击 `启动.bat`（需要 Python），浏览器会打开 http://localhost:8765/。点右上角「安装应用」，或地址栏右边的安装图标。装好之后不用再开 bat，从开始菜单打开即可。
- **手机**：先把整个文件夹放到一个 https 网址上（GitHub Pages、Netlify、Cloudflare Pages 都行），再用手机打开：
  - 安卓 Chrome：点「安装应用」，或者菜单 →「添加到主屏幕」
  - iPhone Safari：「分享」→「添加到主屏幕」
- 改了网页、数据或图片之后，要运行一次 `python scripts/build_pwa.py`（会重新生成图标和 `sw.js` 里的缓存清单）。已安装的应用下次联网打开时会自动更新。

## 文件
| 文件 | 说明 |
|---|---|
| index.html / style.css / app.js | 页面、样式、逻辑 |
| manifest.webmanifest / pwa.js / sw.js | PWA：应用信息、安装按钮、离线缓存（sw.js 由 scripts/build_pwa.py 生成） |
| 启动.bat | 在本机用 localhost 打开，用于安装 |
| data.js | 干员、盟约、地图列表（自动生成） |
| maps.js | 30 个场地的格子和敌人路线（自动生成） |
| assets/avatars, icons, equips, maps | 干员头像、盟约图标、装备图标、战场地图（webp） |
| scripts/parse_prts.py | 从 PRTS 页面源码解析出 data.json |
| scripts/build_data.py | data.json → data.js，补上激活档位、图标、地图列表 |
| scripts/fetch_levels.sh + build_maps.py | 下载游戏关卡数据并生成 maps.js |
| scripts/image_list.py + fetch_images.sh | 生成图片下载清单并下载（PNG，需要自己再转 webp） |

## 版本更新时刷新数据
```bash
curl -L "https://prts.wiki/index.php?title=卫戍协议·规程/PRTS盟约记录&action=raw" -o raw.txt
python scripts/parse_prts.py raw.txt scripts/data.json
python scripts/build_data.py scripts/data.json data.js
python scripts/image_list.py scripts/data.json > images.tsv
sh scripts/fetch_images.sh images.tsv img
sh scripts/fetch_levels.sh levels
python scripts/build_maps.py levels maps.js
```

## 已知限制
- 【调和】按"每个出现过的核心盟约 +1"计算，2 名调和干员时是否叠加没有核实，规则以游戏内为准
- 只统计人数和档位，不模拟层数叠加
- 没有干员职业数据，所以高台「仅远程」只做提示，不会阻止近战干员放上去
- 敌人路线是估算的，不考虑干员阻挡；也不模拟战斗

数据与图片来源：PRTS Wiki（文字 CC BY-NC-SA 3.0）；格子数据来自 Kengxxiao/ArknightsGameData。非官方玩家工具，明日方舟相关名称与美术版权归鹰角网络所有。
