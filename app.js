/* 卫戍协议·规程 阵容编辑器 */
(() => {
  'use strict';

  const DATA = window.SP_DATA;
  const PACTS = DATA.pacts;                       // {name,type,effect,thresholds,special,icon}
  const OPS = DATA.operators.map((o, i) => ({ ...o, id: i }));
  const MAPS = DATA.maps || [];
  const PACT = Object.fromEntries(PACTS.map(p => [p.name, p]));
  const OP_BY_NAME = Object.fromEntries(OPS.map(o => [o.name, o]));
  const ROMAN = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ'];
  const CAP_DEFAULT = DATA.deployLimit || 8;
  const BENCH_MAX = 12;
  const EQUIPS = DATA.equips || [];
  const EQ = Object.fromEntries(EQUIPS.map(e => [e.name, e]));
  const EQ_SLOTS = 2;
  const DIRS = { R: ['朝右', 0], D: ['朝下', 90], L: ['朝左', 180], U: ['朝上', 270] };
  const DIR_ORDER = ['R', 'D', 'L', 'U'];
  const FRONT = { R: [0, 1], D: [1, 0], L: [0, -1], U: [-1, 0] };

  const avatar = o => `assets/avatars/${encodeURIComponent(o.name)}.webp`;
  const pactIcon = p => `assets/icons/${p.icon}.webp`;
  const mapSrc = m => `assets/maps/${m.id}.webp`;
  const eqIcon = e => `assets/equips/${encodeURIComponent(e.name)}.webp`;

  // ---------- 安全的 localStorage ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 忽略 */ } },
  };

  // ---------- 状态 ----------
  const state = {
    view: 'build',
    field: [], bench: [], elite: new Set(),
    cap: CAP_DEFAULT,
    bannedPacts: new Set(),
    filters: { tiers: new Set(), pacts: new Set(), and: false, hideBanned: true, q: '' },
    showElite: false,
    banMode: false,
    onlyActive: false,
    openPacts: new Set(),
    map: MAPS[0]?.id,
    positions: {},          // {mapId: {干员名: [行, 列, 朝向]}}
    equips: {},             // {干员名: [{n: 装备名, a: 是否进阶}, ...]} 最多 2 件
  };

  function loadState() {
    const s = store.get('sp_state', null);
    const ok = id => Number.isInteger(id) && OPS[id];
    if (s) {
      state.field = (s.field || []).filter(ok);
      state.bench = (s.bench || []).filter(ok);
      state.elite = new Set((s.elite || []).filter(ok));
      state.cap = s.cap || CAP_DEFAULT;
      state.bannedPacts = new Set((s.banned || []).filter(n => PACT[n]?.type === 'core'));
      state.equips = cleanEquips(s.equips);
    }
    state.filters.hideBanned = store.get('sp_hide_banned', true);
    state.onlyActive = store.get('sp_only_active', false);
    state.positions = store.get('sp_cells', {});
    const m = store.get('sp_map', null);
    if (m && MAPS.some(x => x.id === m)) state.map = m;
  }
  function saveState() {
    store.set('sp_state', { field: state.field, bench: state.bench, elite: [...state.elite], cap: state.cap, banned: [...state.bannedPacts], equips: state.equips });
  }
  function cleanEquips(obj) {
    const out = {};
    for (const [name, list] of Object.entries(obj || {})) {
      if (!OP_BY_NAME[name] || !Array.isArray(list)) continue;
      const l = list.filter(x => x && EQ[x.n]).slice(0, EQ_SLOTS).map(x => ({ n: x.n, a: !!x.a }));
      if (l.length) out[name] = l;
    }
    return out;
  }

  // ---------- 工具 ----------
  const $ = sel => document.querySelector(sel);
  const el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) e.append(c);
    return e;
  };
  const img = (src, alt, cls) => el('img', { src, alt, class: cls, loading: 'lazy', draggable: 'false', onerror: e => { e.target.style.visibility = 'hidden'; } });
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // 特质文本：<时机> 高亮，【盟约】加粗，数字强调
  const fmtTrait = s => esc(s)
    .replace(/&lt;([^&]+?)&gt;/g, '<span class="when">&lt;$1&gt;</span>')
    .replace(/【([^】]+)】/g, '<b>【$1】</b>')
    .replace(/\n/g, '<br>');
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 1800);
  }
  // 禁用规则（与游戏一致）：只有核心盟约会被禁用；干员的核心盟约全部被禁用即离开本局，
  // 附加盟约不影响；没有核心盟约的干员不会因禁用而离开
  // 变形同构体：与另一件特定装备同时携带时，携带者获得对应盟约（PRTS「变形同构体」天赋）
  const MORPH = { '炎国短刀': '炎', '阿戈尔重刃': '阿戈尔', '萨尔贡浓茶': '萨尔贡', '伊比利亚骨刺刀': '伊比利亚', '莱塔尼亚小鼓': '莱塔尼亚',
    '谢拉格不融冰': '谢拉格', '乌萨斯呼吸器': '乌萨斯', '卡西米尔竞技旗': '卡西米尔', '叙拉古正装': '叙拉古', '精准狙击镜': '精准',
    '突袭手雷': '突袭', '坚守盾牌': '坚守', '不屈弹射器': '不屈', '迅捷作战粮': '迅捷', '灵巧涡轮手套': '灵巧', '奥术法阵': '奥术', '聚合急救箱': '聚合' };
  const morphPact = n => MORPH[n] || (n.includes('维式重锤') ? '维多利亚' : null);
  const MORPH_EQ = '变形同构体';
  // 装备额外给予的盟约（不含干员本来就有的）
  const grantedPacts = o => {
    const l = (state.equips[o.name] || []).map(x => x.n);
    if (!l.includes(MORPH_EQ)) return [];
    return [...new Set(l.map(morphPact).filter(p => p && PACT[p] && !o.pacts.includes(p)))];
  };
  const opPacts = o => { const g = grantedPacts(o); return g.length ? [...o.pacts, ...g] : o.pacts; };
  const isBanned = op => {
    const core = op.pacts.filter(p => PACT[p]?.type === 'core');
    return core.length > 0 && core.every(p => state.bannedPacts.has(p));
  };
  const picon = p => el('span', { class: `picon ${p.type}` }, img(pactIcon(p), p.name));
  const ptag = (name, hl) => {
    const p = PACT[name];
    return el('span', { class: `ptag ${p?.type || 'extra'}${hl ? ' hl' : ''}` }, p ? img(pactIcon(p), '') : null, name);
  };
  const mini = (o, onclick) => el('img', {
    class: 'mini', src: avatar(o), alt: o.name, title: `${ROMAN[o.tier]} ${o.name}`, loading: 'lazy', draggable: 'false', onclick,
  });

  // ---------- 盟约计算 ----------
  function computePacts() {
    const fieldOps = state.field.map(id => OPS[id]);
    const benchOps = state.bench.map(id => OPS[id]);
    const res = {};
    for (const p of PACTS) {
      const members = fieldOps.filter(o => opPacts(o).includes(p.name));
      const benchMembers = p.special === 'bench' ? benchOps.filter(o => opPacts(o).includes(p.name)) : [];
      res[p.name] = { pact: p, members, benchMembers, raw: members.length + benchMembers.length, bonus: 0 };
    }
    const elites = fieldOps.filter(o => state.elite.has(o.id));     // 绝技：场上精锐干员数
    Object.assign(res['绝技'], { members: elites, raw: elites.length });
    if (res['调和'].raw >= 1) {                                       // 调和：场上出现的核心盟约 +1
      for (const r of Object.values(res)) if (r.pact.type === 'core' && r.raw >= 1) r.bonus = 1;
    }
    for (const r of Object.values(res)) {
      r.count = r.raw + r.bonus;
      const th = r.pact.thresholds;
      r.level = r.pact.special === 'solo' ? (r.raw === 1 ? 1 : r.raw >= 2 ? -1 : 0) : th.filter(t => r.count >= t).length;
      r.max = th[th.length - 1];
    }
    return res;
  }

  // ---------- 操作 ----------
  function place(id, where) {
    const op = OPS[id];
    if (isBanned(op)) { toast(`${op.name} 的盟约已全部被禁用`); return; }
    const inField = state.field.includes(id), inBench = state.bench.includes(id);
    if (where === 'field') {
      if (inField) { remove(id); return; }
      if (state.field.length >= state.cap) { toast(`场上已满（${state.cap} 人），可放入整备区`); return; }
      if (inBench) state.bench = state.bench.filter(x => x !== id);
      state.field.push(id);
    } else {
      if (inBench) { remove(id); return; }
      if (state.bench.length >= BENCH_MAX) { toast('整备区已满'); return; }
      if (inField) state.field = state.field.filter(x => x !== id);
      state.bench.push(id);
    }
    commit();
  }
  function remove(id) {
    state.field = state.field.filter(x => x !== id);
    state.bench = state.bench.filter(x => x !== id);
    state.elite.delete(id);
    delete state.equips[OPS[id].name];
    commit();
  }
  function commit() { saveState(); render(); }

  // ---------- 渲染：左侧筛选 ----------
  function renderFilters() {
    const f = state.filters;
    const counts = {};
    OPS.forEach(o => o.pacts.forEach(p => (counts[p] = (counts[p] || 0) + 1)));
    for (const type of ['core', 'extra']) {
      $(`#f-${type}`).replaceChildren(...PACTS.filter(p => p.type === type).map(p => el('div', {
        class: 'pact-btn' + (f.pacts.has(p.name) ? ' on' : '') + (state.bannedPacts.has(p.name) ? ' banned' : ''),
        title: p.effect,
        onclick: () => { f.pacts.has(p.name) ? f.pacts.delete(p.name) : f.pacts.add(p.name); render(); },
      }, picon(p), el('span', { class: 'pact-label', text: p.name }), el('span', { class: 'n', text: counts[p.name] || 0 }))));
    }
    $('#f-tier').replaceChildren(...[1, 2, 3, 4, 5, 6].map(t => el('span', {
      class: 'tier-btn' + (f.tiers.has(t) ? ' on' : ''), 'data-tier': t, text: ROMAN[t],
      onclick: () => { f.tiers.has(t) ? f.tiers.delete(t) : f.tiers.add(t); render(); },
    })));
    document.querySelectorAll('#seg-mode button').forEach(b => b.classList.toggle('on', (b.dataset.and === '1') === f.and));
    document.querySelectorAll('#seg-elite button').forEach(b => b.classList.toggle('on', (b.dataset.e === '1') === state.showElite));
    $('#f-hide-banned').checked = f.hideBanned;
  }

  function filteredOps() {
    const f = state.filters, q = f.q.trim().toLowerCase();
    return OPS.filter(o => {
      if (f.hideBanned && isBanned(o)) return false;
      if (f.tiers.size && !f.tiers.has(o.tier)) return false;
      if (f.pacts.size) {
        const sel = [...f.pacts];
        if (!(f.and ? sel.every(p => o.pacts.includes(p)) : sel.some(p => o.pacts.includes(p)))) return false;
      }
      if (q && !(o.name + ' ' + o.pacts.join(' ') + ' ' + o.trait + ' ' + o.traitElite + ' ' + o.traitType).toLowerCase().includes(q)) return false;
      return true;
    });
  }

  // ---------- 渲染：干员卡片 ----------
  function renderPool() {
    const list = filteredOps();
    const box = $('#pool'); box.replaceChildren();
    $('#pool-count').textContent = list.length;
    const sel = state.filters.pacts;
    const byTier = {};
    list.forEach(o => (byTier[o.tier] ||= []).push(o));
    for (const t of Object.keys(byTier).map(Number).sort()) {
      box.append(el('div', { class: 'tier-head', 'data-tier': t }, el('span', { class: 'tn', text: ROMAN[t] }), '阶', el('small', { text: `${byTier[t].length} 名` })));
      const grid = el('div', { class: 'cards' });
      for (const o of byTier[t]) {
        const inField = state.field.includes(o.id), inBench = state.bench.includes(o.id), banned = isBanned(o);
        const text = state.showElite && o.traitElite ? o.traitElite : o.trait;
        grid.append(el('div', {
          class: 'card' + (inField ? ' in-field' : '') + (inBench ? ' in-bench' : '') + (banned ? ' disabled' : ''),
          'data-tier': o.tier,
          onclick: e => place(o.id, e.shiftKey ? 'bench' : 'field'),
          oncontextmenu: e => { e.preventDefault(); place(o.id, 'bench'); },
        },
          el('div', { class: 'card-art' }, img(avatar(o), o.name), el('span', { class: 'tb', text: ROMAN[o.tier] }),
            inField ? el('span', { class: 'state', text: '场上' }) : inBench ? el('span', { class: 'state', text: '整备' }) : null),
          el('div', { class: 'card-body' },
            el('div', { class: 'card-top' }, el('span', { class: 'card-name', text: o.name }), el('span', { class: 'ttype', text: o.traitType })),
            el('div', { class: 'ptags' }, o.pacts.map(p => ptag(p, sel.has(p)))),
            el('div', { class: 'trait', html: fmtTrait(text) }))));
      }
      box.append(grid);
    }
    if (!list.length) box.append(el('p', { class: 'hint', text: '没有符合条件的干员' }));
  }

  // ---------- 渲染：阵容格子 ----------
  function slotTile(id, where) {
    const o = OPS[id], elite = state.elite.has(id);
    return el('div', {
      class: 'slot', 'data-tier': o.tier,
      title: `${o.name}（点击查看详情、配装备；右键在场上/整备区之间移动）`,
      onclick: e => { if (!e.target.closest('.elite')) openOperator(id); },
      oncontextmenu: e => { e.preventDefault(); place(id, where === 'field' ? 'bench' : 'field'); },
    },
      img(avatar(o), o.name),
      el('span', { class: 'tb', text: ROMAN[o.tier] }),
      el('button', { class: 'elite' + (elite ? ' on' : ''), title: '切换精锐（计入【绝技】）', text: '精',
        onclick: () => { elite ? state.elite.delete(id) : state.elite.add(id); commit(); } }),
      eqMinis(o.name),
      el('span', { class: 'nm', text: o.name }));
  }
  const eqMinis = name => {
    const l = state.equips[name] || [];
    return l.length ? el('span', { class: 'eqs' }, l.map(x => el('img', { src: eqIcon(EQ[x.n]), alt: x.n, title: x.n + (x.a ? '（进阶）' : ''), class: x.a ? 'adv' : '', draggable: 'false' }))) : null;
  };
  function renderSquad() {
    const field = state.field.map(id => slotTile(id, 'field'));
    for (let i = state.field.length; i < state.cap; i++) field.push(el('div', { class: 'slot empty', text: i + 1 }));
    $('#field').replaceChildren(...field);
    $('#bench').replaceChildren(...state.bench.map(id => slotTile(id, 'bench')));
    $('#field-count').textContent = `${state.field.length}/${state.cap}`;
    $('#bench-count').textContent = state.bench.length || '';
  }

  // ---------- 渲染：盟约激活 ----------
  function renderPacts() {
    const res = computePacts();
    const used = new Set([...state.field, ...state.bench]);
    const rows = Object.values(res).filter(r => r.raw > 0)
      .sort((a, b) => (b.level - a.level) || (b.count - a.count) || (a.pact.type === 'core' ? -1 : 1));
    const shown = state.onlyActive ? rows.filter(r => r.level !== 0) : rows;
    const box = $('#pact-list'); box.replaceChildren();
    if (!shown.length) {
      box.append(el('p', { class: 'hint', text: state.field.length ? '暂无已激活盟约' : '点击干员卡片加入阵容' }));
      return;
    }
    for (const r of shown) {
      const p = r.pact, th = p.thresholds, fail = r.level === -1;
      const pips = el('div', { class: 'pips' });
      for (let i = 1; i <= r.max; i++) pips.append(el('span', { class: 'pip' + (i <= r.count && !fail ? ' on' : '') + (th.includes(i) ? ' th' : '') }));
      const next = th.find(t => r.count < t);
      let candidates = null;
      if (next && next - r.count === 1 && p.special !== 'elite') {
        const c = OPS.filter(o => !used.has(o.id) && !isBanned(o) && o.pacts.includes(p.name)).sort((a, b) => a.tier - b.tier);
        if (c.length) candidates = el('div', { class: 'pact-candidates' }, el('div', { text: '再加 1 人可升档（点击加入）：' }),
          el('div', { class: 'pact-members' }, c.map(o => mini(o, ev => { ev.stopPropagation(); place(o.id, 'field'); }))));
      }
      const lv = fail ? el('span', { class: 'lv fail', text: '失效' })
        : r.level > 0 ? el('span', { class: 'lv' + (r.level >= 2 ? ' l2' : ''), text: th.length > 1 ? `Lv${r.level}` : '激活' })
          : el('span', { class: 'lv off', text: `差${next - r.count}` });
      box.append(el('div', {
        class: `pact ${fail ? 'fail' : r.level >= 2 ? 'lv2' : r.level === 1 ? 'lv1' : 'inactive'}${state.openPacts.has(p.name) ? ' open' : ''}`,
        onclick: e => {
          if (e.target.closest('.pact-body')) return;
          state.openPacts.has(p.name) ? state.openPacts.delete(p.name) : state.openPacts.add(p.name);
          renderPacts();
        },
      },
        el('div', { class: 'pact-head' }, picon(p), el('span', { class: 'pact-name', text: p.name }), lv, pips,
          el('span', { class: 'pact-count' }, String(r.count), r.bonus ? el('small', { text: '(含调和)' }) : null, el('small', { text: ` / ${th.join('·')}` }))),
        el('div', { class: 'pact-body' },
          el('div', { class: 'pact-effect', text: p.effect }),
          el('div', { class: 'pact-members' }, [...r.members, ...r.benchMembers].map(o => mini(o))),
          candidates,
          p.special === 'solo' && fail ? el('div', { class: 'note', text: '场上有 2 名及以上【独行】干员，效果失效' }) : null,
          p.special === 'harmony' ? el('div', { class: 'note', text: '按"场上出现的核心盟约激活人数 +1"计算' }) : null,
          el('button', { class: 'link', text: '在干员池中筛选此盟约', onclick: () => {
            state.filters.pacts = new Set([p.name]); state.filters.and = false; switchView('build'); render();
          } }))));
    }
  }

  // ---------- 禁用盟约 ----------
  function renderBan() {
    $('#ban-panel').hidden = !state.banMode;
    $('#btn-ban').classList.toggle('on', state.banMode);
    if (!state.banMode) return;
    for (const type of ['core']) {
      $(`#ban-${type}`).replaceChildren(...PACTS.filter(p => p.type === type).map(p => el('div', {
        class: 'pact-btn' + (state.bannedPacts.has(p.name) ? ' banned' : ''),
        onclick: () => {
          state.bannedPacts.has(p.name) ? state.bannedPacts.delete(p.name) : state.bannedPacts.add(p.name);
          const drop = [...state.field, ...state.bench].filter(id => isBanned(OPS[id]));
          state.field = state.field.filter(id => !drop.includes(id));
          state.bench = state.bench.filter(id => !drop.includes(id));
          drop.forEach(id => state.elite.delete(id));
          commit();
        },
      }, picon(p), el('span', { class: 'pact-label', text: p.name }))));
    }
    const banned = OPS.filter(isBanned);
    $('#ban-result').textContent = banned.length ? `已自动禁用 ${banned.length} 名：${banned.map(o => o.name).join('、')}` : '当前没有被完全禁用的干员';
  }

  // ---------- 战场部署（格子） ----------
  const GRIDS = window.SP_GRIDS || {};
  const DEPLOYABLE = new Set('.f#gmun');
  const TILE_INFO = {
    '.': ['dep', '可部署'], 'f': ['dep fence', '可部署（围栏边）'], '#': ['high', '高台（仅远程）'],
    'g': ['sp', '特殊地块：决斗草地'], 'm': ['sp', '特殊地块：泥沼'], 'u': ['sp', '特殊地块：加速带'], 'n': ['sp', '特殊地块：感染区'],
    '_': ['floor', '不可部署'], 'X': ['void', ''], 'S': ['start', '红门（敌人出发点）'], 'E': ['end', '保护点'],
    'i': ['tel', '传送入口'], 'o': ['tel', '传送出口'],
  };
  let selected = null;     // 选中的干员名（点选部署 / 调整朝向）
  let justDragged = false; // 刚拖完时忽略随后的 click，避免被当成「选中」

  function cellMap() { return (state.positions[state.map] ||= {}); }      // {干员名: [行, 列, 朝向]}
  function savePositions() { store.set('sp_cells', state.positions); }
  const occupant = (pos, r, c) => Object.keys(pos).find(n => pos[n][0] === r && pos[n][1] === c);
  const dirOf = (pos, n) => (pos[n] && DIRS[pos[n][2]]) ? pos[n][2] : 'R';

  function deployTo(name, r, c) {
    const g = GRIDS[state.map];
    if (!g || !DEPLOYABLE.has(g.cells[r]?.[c])) return false;
    const pos = cellMap();
    const other = occupant(pos, r, c);
    if (other === name) return true;
    const myDir = dirOf(pos, name);
    if (other) {                         // 互换：对方去我原来的位置（保留它自己的朝向），或回到未部署
      if (pos[name]) pos[other] = [pos[name][0], pos[name][1], dirOf(pos, other)]; else delete pos[other];
    }
    pos[name] = [r, c, myDir];
    savePositions();
    return true;
  }
  function setDir(name, d) {
    const pos = cellMap();
    if (!pos[name]) return;
    pos[name][2] = d; savePositions(); renderDeploy();
  }
  function undeploy(name) { delete cellMap()[name]; if (selected === name) selected = null; savePositions(); renderDeploy(); }

  function renderDeploy() {
    if (state.view !== 'deploy') return;
    const m = MAPS.find(x => x.id === state.map);
    const g = GRIDS[state.map];
    $('#map-select').value = state.map;
    const mimg = $('#map-img');
    if (m && !mimg.src.endsWith(mapSrc(m))) mimg.src = mapSrc(m);
    const board = $('#board');
    if (!g) { board.replaceChildren(el('p', { class: 'hint', text: '这张地图没有格子数据' })); return; }

    const pos = cellMap();
    const fieldOps = state.field.map(id => OPS[id]);
    Object.keys(pos).forEach(n => { if (!fieldOps.some(o => o.name === n)) delete pos[n]; });
    if (selected && !fieldOps.some(o => o.name === selected)) selected = null;

    const rows = g.cells.length, cols = g.cells[0].length;
    board.style.setProperty('--cols', cols);
    board.style.setProperty('--rows', rows);
    sizeBoard();
    // 选中干员的「身前一格」
    let front = null;
    if (selected && pos[selected]) {
      const [dr, dc] = FRONT[dirOf(pos, selected)];
      front = [pos[selected][0] + dr, pos[selected][1] + dc];
    }
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = g.cells[r][c];
        const [cls, label] = TILE_INFO[ch] || ['void', ''];
        const name = occupant(pos, r, c);
        const o = name && OP_BY_NAME[name];
        const mark = { S: '敌', E: '守', i: '传', o: '传', '#': '高' }[ch];
        const isFront = front && front[0] === r && front[1] === c;
        const cell = el('div', {
          class: `cell ${cls}${DEPLOYABLE.has(ch) ? ' droppable' : ''}${isFront ? ' front' : ''}`, 'data-r': r, 'data-c': c, title: label,
          onclick: () => {
            if (justDragged) return;
            if (o) { selected = selected === name ? null : name; renderDeploy(); return; }
            if (selected && deployTo(selected, r, c)) renderDeploy();   // 保持选中，方便接着调朝向
          },
        }, mark ? el('span', { class: 'mark' + (ch === '#' ? ' dim' : ''), text: mark }) : null);
        if (o) {
          const d = dirOf(pos, name);
          const t = el('div', {
            class: 'token' + (selected === name ? ' sel' : ''), 'data-tier': o.tier, 'data-dir': d,
            title: `${o.name}（${DIRS[d][0]}）\n右键：顺时针旋转 · 双击：撤回`,
            ondblclick: ev => { ev.stopPropagation(); undeploy(name); },
            oncontextmenu: ev => { ev.preventDefault(); setDir(name, DIR_ORDER[(DIR_ORDER.indexOf(d) + 1) % 4]); },
          },
            img(avatar(o), o.name), el('span', { class: 'tb', text: ROMAN[o.tier] }),
            el('span', { class: 'dir', style: `transform: rotate(${DIRS[d][1]}deg)` }),
            eqMinis(name),
            el('span', { class: 'nm', text: o.name }));
          t.addEventListener('pointerdown', ev => startDrag(ev, o));
          cell.append(t);
        }
        cells.push(cell);
      }
    }
    // 敌人路线（SVG，坐标以格子为单位）
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'paths');
    svg.setAttribute('viewBox', `0 0 ${cols} ${rows}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    if (!$('#map-path').checked) svg.style.display = 'none';
    g.paths.forEach((p, i) => {
      const pl = document.createElementNS(svgNS, 'polyline');
      const off = (i - (g.paths.length - 1) / 2) * 0.1;
      pl.setAttribute('points', p.map(([r, c]) => `${c + 0.5 + off},${r + 0.5 + off}`).join(' '));
      pl.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.append(pl);
    });
    board.replaceChildren(...cells, svg);

    const placed = fieldOps.filter(o => pos[o.name]).length;
    const total = g.cells.join('').split('').filter(ch => DEPLOYABLE.has(ch)).length;
    $('#board-count').textContent = `已部署 ${placed} / ${Math.min(state.cap, g.limit || 8)} · 可部署格 ${total}`;

    // 选中干员的工具条：朝向 / 装备 / 撤回
    const bar = $('#sel-bar');
    const so = selected && OP_BY_NAME[selected];
    if (so) {
      const deployed = !!pos[selected], d = dirOf(pos, selected);
      bar.hidden = false;
      bar.replaceChildren(
        el('img', { class: 'mini', src: avatar(so), alt: so.name, draggable: 'false' }),
        el('b', { text: so.name }),
        deployed ? el('span', { class: 'hint', text: '朝向' }) : el('span', { class: 'hint', text: '点一个可部署格放下' }),
        deployed ? el('div', { class: 'seg dir-seg' }, DIR_ORDER.map(k => el('button', {
          class: k === d ? 'on' : '', title: DIRS[k][0], html: `<i style="transform:rotate(${DIRS[k][1]}deg)">➜</i>`,
          onclick: () => setDir(selected, k) }))) : null,
        el('button', { class: 'btn small', text: '装备', onclick: () => openOperator(so.id) }),
        deployed ? el('button', { class: 'btn small ghost', text: '撤回', onclick: () => undeploy(selected) }) : null,
        el('button', { class: 'link', text: '取消选中', onclick: () => { selected = null; renderDeploy(); } }));
    } else {
      bar.hidden = true;
    }

    $('#map-roster').replaceChildren(...fieldOps.filter(o => !pos[o.name]).map(o => {
      const s = el('div', { class: 'slot' + (selected === o.name ? ' sel' : ''), 'data-tier': o.tier, title: '拖到格子上，或点一下再点格子',
        onclick: () => { if (justDragged) return; selected = selected === o.name ? null : o.name; renderDeploy(); } },
        img(avatar(o), o.name), el('span', { class: 'tb', text: ROMAN[o.tier] }), eqMinis(o.name), el('span', { class: 'nm', text: o.name }));
      s.addEventListener('pointerdown', ev => startDrag(ev, o));
      return s;
    }));
  }

  // 按容器宽度计算格子大小
  function sizeBoard() {
    const board = $('#board'), wrap = board.parentElement;
    const cols = +board.style.getPropertyValue('--cols') || 9;
    const avail = wrap.clientWidth - 20 - 3 * (cols - 1) - 2;
    const cell = Math.max(28, Math.min(84, Math.floor(avail / cols)));
    board.style.setProperty('--cell', cell + 'px');
    board.classList.toggle('compact', cell < 52);   // 格子太小时只显示头像
  }
  window.addEventListener('resize', () => { if (state.view === 'deploy') sizeBoard(); });

  // 方向键调整选中干员的朝向，Delete 撤回，Esc 取消选中
  document.addEventListener('keydown', e => {
    if (state.view !== 'deploy' || !selected || !$('#modal').hidden || e.target.closest('input, select, textarea')) return;
    const k = { ArrowRight: 'R', ArrowDown: 'D', ArrowLeft: 'L', ArrowUp: 'U' }[e.key];
    if (k && cellMap()[selected]) { e.preventDefault(); setDir(selected, k); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); undeploy(selected); }
    else if (e.key === 'Escape') { selected = null; renderDeploy(); }
  });

  // 拖拽：移动超过 6px 才算拖，否则当作点击
  function startDrag(e, o) {
    if (e.button !== 0) return;
    e.preventDefault();                   // 阻止拖动时选中页面文字
    const sx = e.clientX, sy = e.clientY;
    let ghost = null, hover = null;
    const cellAt = ev => document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.cell');
    const move = ev => {
      if (!ghost) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        ghost = el('div', { class: 'drag-ghost', 'data-tier': o.tier }, img(avatar(o), o.name));
        document.body.append(ghost);
        document.body.classList.add('dragging');
        window.getSelection?.().removeAllRanges();
      }
      ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
      const c = cellAt(ev);
      const next = c && c.classList.contains('droppable') ? c : null;
      if (next !== hover) { hover?.classList.remove('hover'); hover = next; hover?.classList.add('hover'); }
    };
    const up = ev => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (!ghost) return;                 // 没拖动 = 点击，交给 onclick
      ghost.remove(); document.body.classList.remove('dragging');
      hover?.classList.remove('hover');
      const c = cellAt(ev);
      if (c?.classList.contains('droppable')) deployTo(o.name, +c.dataset.r, +c.dataset.c);
      else if (!document.elementFromPoint(ev.clientX, ev.clientY)?.closest('#board')) { delete cellMap()[o.name]; savePositions(); }  // 拖出棋盘 = 撤回
      if (selected === o.name && !cellMap()[o.name]) selected = null;
      justDragged = true;
      setTimeout(() => { justDragged = false; }, 0);
      renderDeploy();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function switchView(v) {
    state.view = v;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.view === v));
    $('#view-build').hidden = v !== 'build';
    $('#view-deploy').hidden = v !== 'deploy';
    document.querySelector('.hero .kicker').textContent = v === 'build' ? 'LINEUP · 阵容编辑' : 'DEPLOY · 战场部署';
    document.querySelector('.hero h1').firstChild.textContent = v === 'build' ? '组建阵容' : '战场部署';
    renderDeploy();
  }

  // ---------- 干员详情 / 装备 ----------
  function equipCombos(list) {
    // 「若与“A”同时持有则组合为“B”」
    const names = list.map(x => x.n), out = [];
    for (const n of names) {
      const m = /若与“([^”]+)”同时持有则组合为“([^”]+)”/.exec(EQ[n].base);
      if (m && names.includes(m[1]) && !out.includes(m[2])) out.push(m[2]);
    }
    return out;
  }
  function openOperator(id) {
    const o = OPS[id];
    if (!state.field.includes(id) && !state.bench.includes(id)) { closeModal(); return; }
    const elite = state.elite.has(id), inField = state.field.includes(id);
    const list = state.equips[o.name] || [];
    const body = $('#modal-body'); body.replaceChildren();
    body.append(el('div', { class: 'op-detail', 'data-tier': o.tier },
      el('div', { class: 'od-art' }, img(avatar(o), o.name), el('span', { class: 'tb', text: ROMAN[o.tier] })),
      el('div', { class: 'od-info' },
        el('div', { class: 'od-name', text: o.name }),
        el('div', { class: 'ptags' }, o.pacts.map(p => ptag(p)), grantedPacts(o).map(p => el('span', { class: 'granted', title: '由变形同构体获得' }, ptag(p, true)))),
        el('div', { class: 'trait', html: `<span class="ttype">${esc(o.traitType)}</span> ` + fmtTrait(elite && o.traitElite ? o.traitElite : o.trait) }))));
    body.append(el('div', { class: 'od-actions' },
      el('button', { class: 'btn small' + (elite ? ' on' : ''), text: elite ? '精锐 ✓' : '设为精锐', onclick: () => { elite ? state.elite.delete(id) : state.elite.add(id); commit(); openOperator(id); } }),
      el('button', { class: 'btn small', text: inField ? '移到整备区' : '移到场上', onclick: () => { place(id, inField ? 'bench' : 'field'); openOperator(id); } }),
      el('button', { class: 'btn small danger', text: '移出阵容', onclick: () => { remove(id); closeModal(); } })));
    body.append(el('div', { class: 'side-sec' }, el('span', { class: 'sec-title', text: `装备（${list.length}/${EQ_SLOTS}）` })));
    for (let i = 0; i < EQ_SLOTS; i++) {
      const x = list[i], e = x && EQ[x.n];
      body.append(e ? el('div', { class: 'eq-slot' },
        el('div', { class: 'eq-icon', 'data-tier': e.tier }, img(eqIcon(e), e.name)),
        el('div', { class: 'eq-text' },
          el('div', { class: 'eq-name' }, e.name, el('small', { text: ` ${ROMAN[e.tier]}阶 · 售价 ${e.price}` })),
          el('div', { class: 'eq-eff', text: (x.a && e.adv ? e.adv : e.base) + (e.note ? '\n' + e.note : '') })),
        el('div', { class: 'eq-btns' },
          e.adv ? el('button', { class: 'btn small' + (x.a ? ' on' : ''), text: x.a ? '进阶' : '基础', title: '切换基础/进阶',
            onclick: () => { x.a = !x.a; commit(); openOperator(id); } }) : null,
          el('button', { class: 'btn small', text: '更换', onclick: () => openEquipPicker(id, i) }),
          el('button', { class: 'btn small danger', text: '卸下', onclick: () => {
            list.splice(i, 1); if (!list.length) delete state.equips[o.name]; commit(); openOperator(id);
          } })))
        : el('button', { class: 'eq-slot empty', text: '+ 添加装备', onclick: () => openEquipPicker(id, list.length) }));
      if (!e) break;
    }
    const combos = equipCombos(list);
    if (combos.length) body.append(el('p', { class: 'note', text: `两件装备同时持有，会组合为「${combos.join('」「')}」` }));
    if (list.some(x => x.n === MORPH_EQ)) {
      const g = grantedPacts(o), other = list.find(x => x.n !== MORPH_EQ);
      const want = other && morphPact(other.n);
      body.append(el('p', { class: 'note', text: g.length ? `变形同构体：该干员额外获得【${g.join('】【')}】盟约，已计入盟约人数`
        : want ? `变形同构体：「${other.n}」对应【${want}】，该干员本来就有这个盟约，不重复计数`
        : '变形同构体：再携带一件对应装备即可获得额外盟约（如「不屈弹射器」→【不屈】、「炎国短刀」→【炎】、「维式重锤」系列→【维多利亚】）' }));
    }
    if (o.pacts.includes('维多利亚') && list.length) body.append(el('p', { class: 'hint', text: '携带装备的【维多利亚】干员可享受维多利亚盟约的伤害加成。' }));
    $('#modal-title').textContent = '干员详情'; $('#modal').hidden = false;
  }
  function openEquipPicker(id, slot) {
    const o = OPS[id];
    const body = $('#modal-body'); body.replaceChildren();
    const f = { q: '', tier: 0 };
    const search = el('input', { type: 'text', placeholder: '搜装备名或效果，如：攻击力、维式' });
    const tiers = el('div', { class: 'tier-row' });
    const grid = el('div', { class: 'eq-grid' });
    const draw = () => {
      tiers.replaceChildren(...[0, 1, 2, 3, 4, 5, 6].map(t => el('span', {
        class: 'tier-btn' + (f.tier === t ? ' on' : ''), 'data-tier': t || 1, text: t ? ROMAN[t] : '全部',
        onclick: () => { f.tier = t; draw(); } })));
      const q = f.q.trim().toLowerCase();
      grid.replaceChildren(...EQUIPS.filter(e => (!f.tier || e.tier === f.tier) && (!q || (e.name + e.base + e.adv + e.note).toLowerCase().includes(q)))
        .map(e => el('div', { class: 'eq-card', 'data-tier': e.tier, title: `${e.name}\n基础：${e.base}${e.adv ? '\n进阶：' + e.adv : ''}${e.note ? '\n' + e.note : ''}`,
          onclick: () => {
            const list = (state.equips[o.name] ||= []);
            list[Math.min(slot, list.length)] = { n: e.name, a: false };
            state.equips[o.name] = list.slice(0, EQ_SLOTS);
            commit(); openOperator(id);
          } },
          el('div', { class: 'eq-icon' }, img(eqIcon(e), e.name), el('span', { class: 'tb', text: ROMAN[e.tier] })),
          el('div', { class: 'eq-text' }, el('div', { class: 'eq-name', text: e.name }), el('div', { class: 'eq-eff', text: e.base })))));
    };
    search.addEventListener('input', () => { f.q = search.value; draw(); });
    body.append(el('div', { class: 'save-row' }, el('button', { class: 'btn small', text: '← 返回', onclick: () => openOperator(id) }), search), tiers, grid);
    draw();
    $('#modal-title').textContent = `为 ${o.name} 选择装备（第 ${slot + 1} 件）`; $('#modal').hidden = false;
    search.focus();
  }

  // ---------- 预设 ----------
  // 站位：只保留场上干员、合法格子与朝向
  function cleanPositions(obj, names) {
    const out = {};
    for (const [mid, map] of Object.entries(obj || {})) {
      const g = GRIDS[mid];
      if (!g || !map || typeof map !== 'object') continue;
      const m = {};
      for (const [n, v] of Object.entries(map)) {
        if (!names.has(n) || !Array.isArray(v)) continue;
        const [r, c, d] = v;
        if (DEPLOYABLE.has(g.cells[r]?.[c])) m[n] = [r, c, DIRS[d] ? d : 'R'];
      }
      if (Object.keys(m).length) out[mid] = m;
    }
    return out;
  }
  const mapCount = p => Object.keys(p.positions || {}).length;
  function currentLineup() {
    const n = ids => ids.map(id => OPS[id].name);
    const field = n(state.field);
    return { field, bench: n(state.bench), elite: n([...state.elite]), equips: JSON.parse(JSON.stringify(state.equips)),
      positions: cleanPositions(state.positions, new Set(field)), cap: state.cap };
  }
  function applyLineup(l) {
    const ids = arr => (arr || []).map(n => OP_BY_NAME[n]?.id).filter(id => id != null);
    state.field = ids(l.field); state.bench = ids(l.bench); state.elite = new Set(ids(l.elite));
    state.equips = cleanEquips(l.equips);
    if (l.cap >= 1 && l.cap <= 12) state.cap = l.cap;
    if (state.field.length > state.cap) state.cap = Math.min(12, state.field.length);
    if (l.positions) {                    // 旧预设没有站位：保留当前站位
      state.positions = cleanPositions(l.positions, new Set(state.field.map(id => OPS[id].name)));
      selected = null; savePositions();
    }
    commit();
  }

  // 导出 / 导入：一个 JSON 文件，包含全部预设和当前阵容
  function exportPresets() {
    const presets = store.get('sp_presets', []);
    const data = { app: 'guicheng-lineup', v: 1, exported: new Date().toISOString(), presets, current: currentLineup() };
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `规程阵容预设_${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`已导出 ${presets.length} 套预设`);
  }
  function importPresets(file) {
    const rd = new FileReader();
    rd.onload = () => {
      let data;
      try { data = JSON.parse(rd.result); } catch { toast('文件不是有效的 JSON'); return; }
      const list = Array.isArray(data) ? data : data?.presets;
      if (!Array.isArray(list)) { toast('没有找到预设数据'); return; }
      const presets = store.get('sp_presets', []);
      const key = p => `${p.name}|${p.t}`;
      const have = new Set(presets.map(key));
      let added = 0;
      for (const p of list) {
        if (!p || typeof p.name !== 'string' || !Array.isArray(p.field)) continue;
        if (have.has(key(p))) continue;   // 同名且同一时间保存的视为重复
        presets.push({ name: p.name.slice(0, 40), field: p.field, bench: p.bench || [], elite: p.elite || [],
          equips: p.equips || {}, positions: p.positions, cap: p.cap, t: p.t || Date.now() });
        have.add(key(p)); added++;
      }
      presets.sort((a, b) => (b.t || 0) - (a.t || 0));
      store.set('sp_presets', presets);
      toast(added ? `已导入 ${added} 套预设` : '没有新的预设（都已存在）');
      openPresets();
    };
    rd.readAsText(file);
  }

  function openPresets() {
    const presets = store.get('sp_presets', []);
    const save = () => store.set('sp_presets', presets);
    const body = $('#modal-body'); body.replaceChildren();
    const nameInput = el('input', { type: 'text', placeholder: '预设名称，如：乌萨斯奥术' });
    body.append(el('div', { class: 'save-row' }, nameInput, el('button', { class: 'btn', text: '保存当前阵容', onclick: () => {
      if (!state.field.length && !state.bench.length) { toast('阵容为空'); return; }
      presets.unshift({ name: nameInput.value.trim() || `阵容 ${presets.length + 1}`, ...currentLineup(), t: Date.now() });
      save(); toast('已保存'); openPresets();
    } })));
    const file = el('input', { type: 'file', accept: '.json,application/json', hidden: '' });
    file.addEventListener('change', () => { if (file.files[0]) importPresets(file.files[0]); });
    body.append(el('div', { class: 'io-row' },
      el('span', { class: 'hint', text: '预设和各地图站位、朝向一起保存，只存在当前浏览器里。换设备或备份请导出成文件。' }),
      el('button', { class: 'btn small', text: '导出全部', onclick: exportPresets }),
      el('button', { class: 'btn small', text: '导入', onclick: () => file.click() }), file));
    if (!presets.length) body.append(el('p', { class: 'hint', text: '还没有保存的预设。' }));
    presets.forEach((p, i) => {
      const n = mapCount(p);
      body.append(el('div', { class: 'preset-row' },
        el('div', { class: 'pname' }, p.name,
          el('span', { class: 'pmeta', text: n ? `含 ${n} 张地图站位` : '无站位' }),
          el('div', { class: 'faces' }, (p.field || []).map(n => OP_BY_NAME[n]).filter(Boolean).map(o => mini(o)))),
        el('button', { class: 'btn small', text: '载入', onclick: () => { applyLineup(p); closeModal(); toast(`已载入：${p.name}`); } }),
        el('button', { class: 'btn small ghost', text: '覆盖', title: '用当前阵容和站位覆盖这套预设', onclick: () => {
          if (!state.field.length && !state.bench.length) { toast('阵容为空'); return; }
          if (!confirm(`用当前阵容覆盖「${p.name}」？`)) return;
          presets[i] = { name: p.name, ...currentLineup(), t: Date.now() }; save(); toast('已覆盖'); openPresets();
        } }),
        el('button', { class: 'btn small danger', text: '删除', onclick: () => {
          if (!confirm(`删除预设「${p.name}」？`)) return;
          presets.splice(i, 1); save(); openPresets();
        } })));
    });
    $('#modal-title').textContent = '阵容预设'; $('#modal').hidden = false;
  }
  const closeModal = () => { $('#modal').hidden = true; };

  // ---------- 分享（URL hash） ----------
  function shareLink() {
    const enc = ids => ids.map(id => id.toString(36)).join('.');
    const eqi = n => EQUIPS.findIndex(e => e.name === n);
    const q = Object.entries(state.equips).map(([n, l]) => OP_BY_NAME[n].id.toString(36) + '-' + l.map(x => eqi(x.n).toString(36) + (x.a ? '*' : '')).join('-')).join('.');
    const url = location.href.split('#')[0] + `#f=${enc(state.field)}&b=${enc(state.bench)}&e=${enc([...state.elite])}&q=${encodeURIComponent(q)}&c=${state.cap}&v=${OPS.length}`;
    const done = () => toast('分享链接已复制');
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done, () => prompt('复制此链接：', url));
    else prompt('复制此链接：', url);
  }
  function readHash() {
    if (!location.hash.includes('f=')) return false;
    const q = new URLSearchParams(location.hash.slice(1));
    if (q.get('v') && +q.get('v') !== OPS.length) toast('链接来自不同版本的数据，可能不准确');
    const dec = s => (s || '').split('.').filter(Boolean).map(x => parseInt(x, 36)).filter(id => OPS[id]);
    state.field = dec(q.get('f')); state.bench = dec(q.get('b')); state.elite = new Set(dec(q.get('e')));
    state.cap = Math.max(1, Math.min(12, +q.get('c') || CAP_DEFAULT));
    const eq = {};
    (q.get('q') || '').split('.').filter(Boolean).forEach(part => {
      const [oid, ...items] = part.split('-');
      const o = OPS[parseInt(oid, 36)];
      if (o) eq[o.name] = items.map(t => ({ n: EQUIPS[parseInt(t, 36)]?.name, a: t.endsWith('*') }));
    });
    state.equips = cleanEquips(eq);
    history.replaceState(null, '', location.pathname + location.search);
    return true;
  }

  // ---------- 总渲染 ----------
  function render() { renderFilters(); renderPool(); renderSquad(); renderPacts(); renderBan(); renderDeploy(); }

  function bind() {
    $('#st-ops').textContent = OPS.length;
    $('#st-core').textContent = PACTS.filter(p => p.type === 'core').length;
    $('#st-extra').textContent = PACTS.filter(p => p.type === 'extra').length;
    $('#st-cap').textContent = CAP_DEFAULT;

    const cap = $('#cap');
    for (let i = 1; i <= 12; i++) cap.append(el('option', { value: i, text: i }));
    cap.value = state.cap;
    cap.addEventListener('change', () => {
      state.cap = +cap.value;
      while (state.field.length > state.cap) state.bench.unshift(state.field.pop());
      state.bench = state.bench.slice(0, BENCH_MAX);
      commit();
    });
    let t;
    $('#search').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { state.filters.q = e.target.value; renderPool(); }, 120); });
    document.querySelectorAll('#seg-mode button').forEach(b => b.addEventListener('click', () => { state.filters.and = b.dataset.and === '1'; render(); }));
    document.querySelectorAll('#seg-elite button').forEach(b => b.addEventListener('click', () => { state.showElite = b.dataset.e === '1'; renderFilters(); renderPool(); }));
    $('#f-hide-banned').addEventListener('change', e => { state.filters.hideBanned = e.target.checked; store.set('sp_hide_banned', e.target.checked); render(); });
    $('#f-reset').addEventListener('click', () => {
      Object.assign(state.filters, { tiers: new Set(), pacts: new Set(), and: false, q: '' });
      $('#search').value = ''; render();
    });
    $('#only-active').checked = state.onlyActive;
    $('#only-active').addEventListener('change', e => { state.onlyActive = e.target.checked; store.set('sp_only_active', e.target.checked); renderPacts(); });
    $('#btn-sort').addEventListener('click', () => { state.field.sort((a, b) => OPS[a].tier - OPS[b].tier || a - b); commit(); });
    $('#btn-clear').addEventListener('click', () => {
      if (!state.field.length && !state.bench.length) return;
      if (confirm('清空场上和整备区？')) { state.field = []; state.bench = []; state.elite.clear(); commit(); }
    });
    $('#btn-ban').addEventListener('click', () => { state.banMode = !state.banMode; renderBan(); });
    $('#ban-done').addEventListener('click', () => { state.banMode = false; renderBan(); });
    $('#btn-presets').addEventListener('click', openPresets);
    $('#btn-share').addEventListener('click', shareLink);
    $('#modal-close').addEventListener('click', closeModal);
    $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
    document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => switchView(b.dataset.view)));

    const ms = $('#map-select');
    MAPS.forEach(m => ms.append(el('option', { value: m.id, text: m.name })));
    ms.addEventListener('change', () => { state.map = ms.value; store.set('sp_map', state.map); renderDeploy(); });
    $('#map-path').addEventListener('change', renderDeploy);
    $('#map-clear').addEventListener('click', () => { state.positions[state.map] = {}; savePositions(); renderDeploy(); });
  }

  loadState();
  const fromLink = readHash();
  bind();
  render();
  if (fromLink) { saveState(); toast('已从分享链接载入阵容'); }
})();
