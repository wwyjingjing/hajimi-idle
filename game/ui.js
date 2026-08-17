// 渲染层：喂食点击 + 池子购买 + 挂机秒产 + 进化形态 + 基因池展示 + 选边换边 + 离线收益 + 通关。
// 全部逻辑在 core.js，本文件只做呈现与输入、localStorage 适配与游戏循环。

import { CONFIG } from './config.js';
import {
  createGame, feed, buyPoolBulk, bulkCost, produce, offlineGains, isCleared,
  formName, secondsProduction, poolCost, evolutionLevelFor, geneLabel, populationByTrait, isPoolRevealed,
  boostMultiplier, activeBoostChannels, claimBoost, useCard, supplyRemaining, pickSupplyTarget,
  rolloverDaily, metricValue, claimTask, unlockAchievements,
  collectGenes, collectionProgress, shareText,
  globalShopMultiplier, shopMultiplierCost, buyMultiplier, raptureMultiplier, raptureRate, raptureUpgradeCost, buyRaptureUpgrade, useClicker, shopPoolUpgradeCost, buyPoolUpgrade, buyBuff, setTheme,
  bonusMultiplier, buyThemeItem,
  applySiteConfig,
} from './core.js';

function getStorage() {
  try {
    const s = window.localStorage;
    const k = '__hajimi_idle_probe__';
    s.setItem(k, '1');
    s.removeItem(k);
    return s;
  } catch {
    return { getItem: () => null, setItem: () => {} };
  }
}
const storage = getStorage();

const $ = (id) => document.getElementById(id);
const countEl = $('count');
const totalEl = $('total');
const cpsEl = $('cps');
const formEl = $('form-name');
const badgeEl = $('badge-faction');
const poolsEl = $('pools');
const toastEl = $('toast');
const feedBtnEl = $('btn-feed');

let state = createGame();
let started = false;
let cleared = false;
let toastTimer = null;
let buyAmount = 1;

function fmt(n) {
  if (!isFinite(n)) return '0';
  const units = ['', '万', '亿', '万亿', '亿亿', '万亿亿', '亿亿亿'];
  let u = 0;
  let v = n;
  while (v >= 1e4 && u < units.length - 1) { v /= 1e4; u++; }
  return (u === 0 ? Math.floor(v).toLocaleString() : v.toFixed(2) + units[u]);
}

// 生产速率专用：小于 1 的保留小数（下水道 0.1、猫狗窝 0.8 等），其余走大数格式化
function fmtProd(n) {
  if (!isFinite(n)) return '0';
  if (n < 1) return String(+n.toFixed(2));
  return fmt(n);
}

function currentFaction() {
  return CONFIG.factions[state.faction] ?? CONFIG.factions.kimi;
}

function applyTheme() {
  const f = currentFaction();
  const root = document.documentElement;
  root.style.setProperty('--bg', f.theme.bg);
  root.style.setProperty('--panel', f.theme.panel);
  root.style.setProperty('--accent', f.theme.accent);
  root.style.setProperty('--accent-soft', f.theme.accentSoft);
  root.style.setProperty('--text', f.theme.text);
}

function normalizeState(s) {
  const g = createGame({ faction: s && s.faction === 'dog' ? 'dog' : 'kimi' });
  if (!s || typeof s !== 'object') return g;
  const totalProduced = Number(s.totalProduced) || 0;

  // 兼容旧存档：池子数量扩展时保留已有数据，新增池子补 0
  function migrateArray(arr, defaultArr) {
    if (!Array.isArray(arr)) return defaultArr;
    if (arr.length === defaultArr.length) return arr.map((n) => Number(n) || 0);
    if (arr.length < defaultArr.length) {
      const migrated = arr.map((n) => Number(n) || 0);
      while (migrated.length < defaultArr.length) migrated.push(0);
      return migrated;
    }
    return arr.slice(0, defaultArr.length).map((n) => Number(n) || 0);
  }
  function migrateGenes(arr, defaultArr) {
    if (!Array.isArray(arr)) return defaultArr;
    if (arr.length === defaultArr.length) {
      return arr.map((gene) => ({
        coat: Number(gene?.coat) || 0,
        size: Number(gene?.size) || 0,
        mutation: gene?.mutation == null ? null : Number(gene.mutation),
      }));
    }
    if (arr.length < defaultArr.length) {
      const migrated = arr.map((gene) => ({
        coat: Number(gene?.coat) || 0,
        size: Number(gene?.size) || 0,
        mutation: gene?.mutation == null ? null : Number(gene.mutation),
      }));
      while (migrated.length < defaultArr.length) migrated.push({ coat: 0, size: 0, mutation: null });
      return migrated;
    }
    return arr.slice(0, defaultArr.length).map((gene) => ({
      coat: Number(gene?.coat) || 0,
      size: Number(gene?.size) || 0,
      mutation: gene?.mutation == null ? null : Number(gene.mutation),
    }));
  }

  return {
    ...g,
    count: Number(s.count) || 0,
    totalProduced,
    pools: migrateArray(s.pools, g.pools),
    genes: migrateGenes(s.genes, g.genes),
    mateProgress: migrateArray(s.mateProgress, g.mateProgress),
    evolutionLevel: evolutionLevelFor(totalProduced),
    boost: {
      task: { expiresAt: Number(s.boost?.task?.expiresAt) || 0 },
      video: { expiresAt: Number(s.boost?.video?.expiresAt) || 0 },
      shop: { expiresAt: Number(s.boost?.shop?.expiresAt) || 0 },
    },
    rapture: {
      activeUntil: Number(s.rapture?.activeUntil) || 0,
      readyAt: Number(s.rapture?.readyAt) || 0,
    },
    clicker: {
      count: Number(s.clicker?.count) || 0,
      activeUntil: Number(s.clicker?.activeUntil) || 0,
    },
    cards: {
      task: Number(s.cards?.task) || 0,
      video: Number(s.cards?.video) || 0,
      shop: Number(s.cards?.shop) || 0,
    },
    poolProduced: migrateArray(s.poolProduced, g.poolProduced),
    supply: s.supply && typeof s.supply === 'object' ? { date: typeof s.supply.date === 'string' ? s.supply.date : '', used: Number(s.supply.used) || 0 } : g.supply,
    stats: s.stats && typeof s.stats === 'object' ? {
      clicks: Number(s.stats.clicks) || 0,
      dailyFeeds: Number(s.stats.dailyFeeds) || 0,
      dailyBoosts: Number(s.stats.dailyBoosts) || 0,
      totalBoosts: Number(s.stats.totalBoosts) || 0,
      maxActiveChannels: Number(s.stats.maxActiveChannels) || 0,
      playSeconds: Number(s.stats.playSeconds) || 0,
      dailyDate: typeof s.stats.dailyDate === 'string' ? s.stats.dailyDate : '',
    } : g.stats,
    tasks: s.tasks && typeof s.tasks === 'object' ? {
      dailyDone: s.tasks.dailyDone && typeof s.tasks.dailyDone === 'object' ? { ...s.tasks.dailyDone } : {},
      mainlineDone: s.tasks.mainlineDone && typeof s.tasks.mainlineDone === 'object' ? { ...s.tasks.mainlineDone } : {},
    } : g.tasks,
    achievements: s.achievements && typeof s.achievements === 'object' ? { ...s.achievements } : g.achievements,
    shop: s.shop && typeof s.shop === 'object' ? {
      multLevel: Number(s.shop.multLevel) || 0,
      raptureLevel: Number(s.shop.raptureLevel) || 0,
      poolUpgrades: migrateArray(s.shop.poolUpgrades, g.shop.poolUpgrades),
      theme: CONFIG.shop.themes.some((t) => t.id === s.shop.theme) ? s.shop.theme : 'default',
      themeItems: s.shop.themeItems && typeof s.shop.themeItems === 'object' ? { ...s.shop.themeItems } : {},
    } : g.shop,
  };
}

function loadSave() {
  try {
    const raw = storage.getItem(CONFIG.storageKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persist() {
  try {
    storage.setItem(CONFIG.storageKey, JSON.stringify({ state, lastSeen: Date.now() }));
  } catch { /* 忽略 */ }
}

let lastAnimalKey = '';
function renderAnimal() {
  const key = `${state.faction}-${state.evolutionLevel}`;
  if (key === lastAnimalKey) return;
  lastAnimalKey = key;
  const img = $('animal-img');
  const exts = ['png', 'svg'];
  let stage = 0;
  img.onload = () => { img.style.display = 'block'; };
  img.onerror = () => {
    if (stage < exts.length - 1) { stage++; img.src = `assets/${key}.${exts[stage]}`; }
    else { img.style.display = 'none'; } // 回退 emoji 占位
  };
  img.src = `assets/${key}.${exts[0]}`;
}

function render() {
  const now = Date.now();
  countEl.textContent = fmt(state.count);
  totalEl.textContent = fmt(state.totalProduced);
  cpsEl.textContent = fmt(secondsProduction(state, now));
  formEl.textContent = formName(state);
  renderBoost(now);
  renderSupply(now);
  renderPools();
  renderAnimal();
}

function fmtTime(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

// 喂食飘字：在数量数字附近生成 +N 上浮淡出动效
let floatSeq = 0;
function spawnCountFloat(amount) {
  if (amount <= 0 || !countEl) return;
  const rect = countEl.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'count-float';
  el.textContent = `+${fmt(amount)}`;
  el.style.left = `${rect.left + rect.width / 2 + (Math.random() * 60 - 30)}px`;
  el.style.top = `${rect.top + 8}px`;
  el.style.transform = 'translate(-50%, 0)';
  el.id = `cf-${++floatSeq}`;
  document.body.appendChild(el);
  setTimeout(() => { const n = document.getElementById(el.id); if (n) n.remove(); }, 850);
}

let lastRaptureActive = false; // 狂暴触发边沿检测（用于金边 + 提示）
function renderBoost(now) {
  // 三个独立词条：任务加速卡 / 看视频加速 / 商店加速（各自 ×2，可同时存在，每词条同时只生效一张）
  const line = (active, label, remaining) => active ? `${label} ×2（${fmtTime(remaining)}）` : `${label} 未生效`;
  $('boost-task').textContent = line(now < state.boost.task.expiresAt, '🎫 任务加速卡', state.boost.task.expiresAt - now);
  $('boost-video').textContent = line(now < state.boost.video.expiresAt, '🎬 看视频加速', state.boost.video.expiresAt - now);
  $('boost-shop').textContent = line(now < state.boost.shop.expiresAt, '🛒 商店加速', state.boost.shop.expiresAt - now);
  // 狂暴 / 连点器状态
  const raptureActive = now < state.rapture.activeUntil;
  $('boost-rapture').textContent = raptureActive
    ? `⚡ 喂一口狂暴 ×${CONFIG.rapture.multiplier}（${fmtTime(state.rapture.activeUntil - now)}）`
    : `⚡ 狂暴待机（触发率 ${(raptureRate(state) * 100).toFixed(1)}%${now < state.rapture.readyAt ? ` · 冷却 ${fmtTime(state.rapture.readyAt - now)}` : ''}）`;
  // 狂暴触发：整体 UI 镶金边 + 首次提示
  const frame = $('rapture-frame');
  if (frame) frame.classList.toggle('show', raptureActive);
  if (raptureActive && !lastRaptureActive) toast('⚡ 狂暴触发！全局产出 ×7（30 秒）');
  lastRaptureActive = raptureActive;
  // 连点器运行中：喂食按钮高频脉冲动效
  const clickerActive = now < state.clicker.activeUntil;
  if (feedBtnEl) feedBtnEl.classList.toggle('auto', clickerActive);
  $('boost-clicker').textContent = clickerActive
    ? `🖱 连点器运行中（${fmtTime(state.clicker.activeUntil - now)}）`
    : `🖱 连点器 ×${state.clicker.count}`;
  const pending = [];
  if (state.cards.task > 0) pending.push(`任务卡×${state.cards.task}`);
  if (state.cards.video > 0) pending.push(`看视频卡×${state.cards.video}`);
  if (state.cards.shop > 0) pending.push(`商店卡×${state.cards.shop}`);
  $('boost-pending').textContent = pending.length ? `🎒 背包待用：${pending.join(' · ')}` : '';
}

function renderSupply(now) {
  const remaining = supplyRemaining(state, now);
  $('supply-remaining').textContent = remaining > 0
    ? `今日补给剩余 ${remaining} 次`
    : '今日补给已领完（仍可继续看应援视频）';
}

function shortWrap(url) {
  const p = CONFIG.supply.shortLinkPrefix;
  if (!p) return url;
  try { return p + encodeURIComponent(url); } catch { return url; }
}

let supplyBusy = false;
function doSupply() {
  if (supplyBusy) return;
  supplyBusy = true;
  const target = pickSupplyTarget().url;
  // 君子协定：点击即结算，不看玩家是否真的进入推广链接/观看视频
  const r = claimBoost(state, Date.now());
  state = r.state;
  let gotClicker = false;
  if (r.granted) {
    // 看视频 50% 概率获得连点器
    if (Math.random() < CONFIG.clicker.videoChance) {
      state = { ...state, clicker: { ...state.clicker, count: state.clicker.count + 1 } };
      gotClicker = true;
    }
  }
  persist();
  render();
  if (r.granted) {
    if (r.active) toast(gotClicker ? '🤝 君子协定：加速 ×2 生效，还掉了 1 个🖱连点器！' : '🤝 君子协定：看视频加速 ×2 已生效（10 分钟）');
    else toast(gotClicker ? `🤝 君子协定：已存看视频加速卡 ×1，还掉了 1 个🖱连点器！` : `🤝 君子协定：已存入背包看视频加速卡 ×1（累计 ${r.cards} 张）`);
  } else {
    toast('今日补给已领完，仍可继续看应援视频应援');
  }
  // 仍尝试打开推广链接（可看可不看，全凭自觉）
  try { window.open(shortWrap(target), '_blank', 'noopener'); } catch { /* 忽略弹窗拦截 */ }
  setTimeout(() => { supplyBusy = false; }, 600); // 防连点双份
}

// 生产池子马赛克风图标（内联 SVG，crispEdges 像素硬边）
const POOL_ICONS = [
  // 0 下水道
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="4" y="4" width="24" height="24" rx="5" fill="#9a9a9a"/><rect x="4" y="4" width="24" height="24" rx="5" fill="none" stroke="#5a5a5a" stroke-width="2"/><rect x="10" y="10" width="12" height="12" rx="6" fill="#2b2b2b"/><rect x="13" y="13" width="6" height="6" rx="3" fill="#3fa9f5"/></svg>',
  // 1 猫狗窝
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="6" y="13" width="20" height="13" fill="#b0763f"/><path d="M4 13 L16 4 L28 13 Z" fill="#7a4f2b"/><rect x="13" y="18" width="6" height="8" rx="3" fill="#4f3218"/></svg>',
  // 2 房子
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="8" y="14" width="16" height="12" fill="#f5d9a8"/><path d="M5 15 L16 6 L27 15 Z" fill="#d94f4f"/><rect x="13" y="19" width="6" height="7" fill="#7a4f2b"/><rect x="9" y="16" width="4" height="4" fill="#a8d8ea"/></svg>',
  // 3 庄园
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="8" y="14" width="16" height="12" fill="#cbb9a6"/><rect x="5" y="10" width="6" height="16" fill="#b0a090"/><rect x="21" y="10" width="6" height="16" fill="#b0a090"/><rect x="5" y="6" width="6" height="4" fill="#8b7d70"/><rect x="21" y="6" width="6" height="4" fill="#8b7d70"/><path d="M8 14 L16 8 L24 14 Z" fill="#8b7d70"/><rect x="13" y="18" width="6" height="8" fill="#6b5a4a"/></svg>',
  // 4 村庄
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><path d="M3 17 L9 12 L15 17 Z" fill="#d94f4f"/><rect x="5" y="17" width="8" height="8" fill="#f5d9a8"/><path d="M18 17 L24 12 L30 17 Z" fill="#4f8fd9"/><rect x="20" y="17" width="8" height="8" fill="#f5d9a8"/></svg>',
  // 5 城市
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="5" y="12" width="6" height="16" fill="#7d8ea8"/><rect x="13" y="6" width="7" height="22" fill="#8fa0b8"/><rect x="22" y="10" width="6" height="18" fill="#7d8ea8"/><rect x="7" y="14" width="2" height="2" fill="#eaf4ff"/><rect x="15" y="8" width="3" height="2" fill="#eaf4ff"/><rect x="24" y="12" width="2" height="2" fill="#eaf4ff"/></svg>',
  // 6 大都会
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="3" y="14" width="5" height="14" fill="#5a6b82"/><rect x="10" y="8" width="6" height="20" fill="#6b7d94"/><rect x="18" y="4" width="6" height="24" fill="#5a6b82"/><rect x="26" y="11" width="5" height="17" fill="#6b7d94"/><rect x="12" y="11" width="2" height="2" fill="#ffe08a"/><rect x="20" y="7" width="2" height="2" fill="#ffe08a"/></svg>',
  // 7 国家
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="6" y="5" width="3" height="21" fill="#8a8a8a"/><rect x="9" y="6" width="13" height="7" fill="#e04f4f"/><rect x="5" y="24" width="22" height="4" fill="#6fae6f"/></svg>',
  // 8 星球
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><circle cx="16" cy="16" r="11" fill="#4f8fd9"/><path d="M9 13 h6 v4 h-3 v4 h6 v-4 h4 v5 h-7" fill="#6fae6f"/><ellipse cx="16" cy="16" rx="18" ry="4" fill="none" stroke="#d9b36a" stroke-width="2" transform="rotate(-20 16 16)"/></svg>',
  // 9 星系
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="2" y="2" width="28" height="28" rx="4" fill="#1b1f3a"/><rect x="14" y="6" width="4" height="4" fill="#ffd97a"/><rect x="22" y="12" width="3" height="3" fill="#b79dff"/><rect x="7" y="16" width="3" height="3" fill="#ff9ecb"/><rect x="12" y="22" width="4" height="4" fill="#7ad9ff"/><rect x="24" y="24" width="3" height="3" fill="#ffd97a"/><circle cx="16" cy="15" r="5" fill="#4f5bd9"/><circle cx="16" cy="15" r="2" fill="#ffd97a"/></svg>',
  // 10 宇宙
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="2" y="2" width="28" height="28" rx="4" fill="#0d0f1f"/><circle cx="12" cy="12" r="6" fill="#d97a4f"/><circle cx="12" cy="12" r="2" fill="#ffd9a8"/><circle cx="24" cy="22" r="5" fill="#4f8fd9"/><rect x="6" y="22" width="2" height="2" fill="#ffd97a"/><rect x="27" y="7" width="2" height="2" fill="#b79dff"/><rect x="18" y="4" width="2" height="2" fill="#ffd97a"/></svg>',
  // 11 克隆
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="7" y="4" width="4" height="4" fill="#4fbf6f"/><rect x="7" y="12" width="4" height="4" fill="#4fbf6f"/><rect x="7" y="20" width="4" height="4" fill="#4fbf6f"/><rect x="7" y="28" width="4" height="4" fill="#4fbf6f"/><rect x="21" y="4" width="4" height="4" fill="#4fbf6f"/><rect x="21" y="12" width="4" height="4" fill="#4fbf6f"/><rect x="21" y="20" width="4" height="4" fill="#4fbf6f"/><rect x="21" y="28" width="4" height="4" fill="#4fbf6f"/><rect x="12" y="6" width="8" height="3" fill="#9ae0a8"/><rect x="12" y="14" width="8" height="3" fill="#9ae0a8"/><rect x="12" y="22" width="8" height="3" fill="#9ae0a8"/></svg>',
  // 12 时空位面
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><path d="M16 2 L28 16 L16 30 L4 16 Z" fill="#7a4fd9"/><path d="M16 8 L23 16 L16 24 L9 16 Z" fill="#b79dff"/><rect x="14" y="13" width="4" height="6" fill="#ffd97a"/></svg>',
  // 13 多元宇宙
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><circle cx="10" cy="10" r="7" fill="#3fa9f5"/><circle cx="22" cy="12" r="5" fill="#ff8ac2"/><circle cx="14" cy="22" r="6" fill="#8ad97a"/><circle cx="25" cy="24" r="4" fill="#ffd97a"/><circle cx="10" cy="10" r="2" fill="#eaf4ff"/><circle cx="22" cy="12" r="1.5" fill="#fff"/><circle cx="14" cy="22" r="1.5" fill="#fff"/></svg>',
  // 14 创世奇点
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="2" y="2" width="28" height="28" rx="4" fill="#1b1f3a"/><circle cx="16" cy="16" r="9" fill="#ff9e4f"/><circle cx="16" cy="16" r="5" fill="#fff3c4"/><circle cx="16" cy="16" r="2" fill="#fff"/><rect x="6" y="6" width="3" height="3" fill="#ffd97a"/><rect x="25" y="8" width="3" height="3" fill="#ffd97a"/><rect x="8" y="25" width="3" height="3" fill="#ffd97a"/></svg>',
  // 15 无限法则
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="2" y="2" width="28" height="28" rx="4" fill="#120d2e"/><path d="M6 12 Q10 7 14 12 Q18 17 22 12 Q26 7 26 12 Q26 17 22 20 Q18 15 14 20 Q10 25 6 20 Q6 17 6 12 Z" fill="#ffd97a"/><rect x="13" y="10" width="2" height="2" fill="#120d2e"/><rect x="17" y="14" width="2" height="2" fill="#120d2e"/></svg>',
  // 16 起源之海
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="2" y="2" width="28" height="28" rx="4" fill="#0e3a5c"/><path d="M2 20 Q8 16 14 20 Q20 24 26 20 L30 20 L30 30 L2 30 Z" fill="#2f8fd9"/><path d="M2 24 Q8 20 14 24 Q20 28 26 24 L30 24 L30 30 L2 30 Z" fill="#7ad0ff"/><rect x="8" y="6" width="4" height="4" fill="#7ad0ff"/><rect x="18" y="10" width="3" height="3" fill="#eaf4ff"/></svg>',
  // 17 至高位面
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><path d="M16 2 L30 12 L16 22 L2 12 Z" fill="#8a6fd9"/><path d="M16 10 L26 17 L16 24 L6 17 Z" fill="#b79dff"/><path d="M16 17 L23 22 L16 27 L9 22 Z" fill="#e0d4ff"/><rect x="14" y="5" width="4" height="4" fill="#ffd97a"/></svg>',
  // 18 无尽虚空
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="2" y="2" width="28" height="28" rx="4" fill="#07070f"/><path d="M16 4 Q22 12 16 20 Q10 28 4 20" fill="none" stroke="#5a4fd9" stroke-width="3"/><path d="M16 4 Q22 12 16 20 Q10 28 4 20" fill="none" stroke="#8a7aff" stroke-width="1.5"/><rect x="24" y="6" width="3" height="3" fill="#b79dff"/><rect x="26" y="22" width="2" height="2" fill="#7ad9ff"/><circle cx="16" cy="20" r="1.5" fill="#fff"/></svg>',
  // 19 亿亿亿圣殿
  '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="4" y="20" width="24" height="8" fill="#b8860b"/><rect x="8" y="16" width="16" height="4" fill="#daa520"/><path d="M4 16 L16 6 L28 16 Z" fill="#ffd700"/><path d="M4 16 L16 6 L28 16 Z" fill="none" stroke="#b8860b" stroke-width="1.5"/><rect x="13" y="22" width="6" height="6" fill="#7a4a00"/><rect x="13" y="12" width="6" height="2" fill="#fff3c4"/></svg>',
];

function renderPools() {
  poolsEl.innerHTML = '';
  const revealed = CONFIG.pools.map((_, i) => isPoolRevealed(state, i));
  CONFIG.pools.forEach((pool, i) => {
    if (!revealed[i]) return; // 未解锁的池子默认隐藏
    const owned = state.pools[i];
    const cost = bulkCost(state, i, buyAmount);
    const gene = owned > 0 ? ` · ${geneLabel(state, i)}` : '';
    const row = document.createElement('div');
    row.className = 'pool-row';
    const icon = document.createElement('div');
    icon.className = 'pool-icon';
    icon.innerHTML = POOL_ICONS[i] || '🏠';
    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = `<div class="name">${pool.name}</div><div class="desc">每秒 ${fmtProd(pool.prod)} 只 · 已有 ${owned} 个${gene}</div>`;
    const btn = document.createElement('button');
    btn.className = 'buy-btn';
    btn.innerHTML = `买×${buyAmount}<span class="cost">${fmt(cost)}</span>`;
    btn.disabled = state.count < cost;
    btn.addEventListener('click', () => {
      const next = buyPoolBulk(state, i, buyAmount);
      if (next !== state) { state = next; persist(); render(); }
    });
    row.appendChild(icon);
    row.appendChild(info);
    row.appendChild(btn);
    poolsEl.appendChild(row);
  });

  // 显示下一个即将解锁的池子提示
  const nextIndex = CONFIG.pools.findIndex((_, i) => !revealed[i]);
  const nextEl = $('pool-next-hint');
  if (nextEl && nextIndex > 0) {
    const pool = CONFIG.pools[nextIndex];
    const threshold = CONFIG.poolReveal.ratio * pool.cost;
    const remain = Math.max(0, threshold - state.totalProduced);
    nextEl.textContent = `🔒 下一个：${pool.name}（累计养出 ${fmt(threshold)} 只解锁，还差 ${fmt(remain)} 只）`;
    nextEl.classList.toggle('hidden', remain <= 0);
  } else if (nextEl) {
    nextEl.classList.add('hidden');
  }
}

function updateBuyAmount() {
  document.querySelectorAll('.buy-amt').forEach((b) => b.classList.toggle('active', Number(b.dataset.amt) === buyAmount));
}

function showFaction() {
  $('screen-faction').classList.remove('hidden');
  $('screen-game').classList.add('hidden');
}

function showGame() {
  $('screen-faction').classList.add('hidden');
  $('screen-game').classList.remove('hidden');
}

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2000);
}

function maybeClear() {
  if (!cleared && isCleared(state)) {
    cleared = true;
    $('clear-form').textContent = formName(state);
    $('overlay-clear').classList.add('show');
  }
}

function checkAchievements() {
  const r = unlockAchievements(state);
  if (r.newlyUnlocked.length > 0) {
    state = r.state;
    const names = r.newlyUnlocked.map((id) => CONFIG.achievements.find((a) => a.id === id)?.name || id);
    toast(`🏆 成就解锁：${names.join('、')}`);
  }
}

// 游玩时长统计：按 tick 真实间隔累计，单次上限 3 秒（后台挂起/切走不计入）
let lastTickMs = Date.now();
let clickerCarry = 0; // 连点器小数频率累计
function tickPlaySeconds() {
  const now = Date.now();
  const dt = Math.min(Math.max(now - lastTickMs, 0), 3000) / 1000;
  lastTickMs = now;
  if (dt > 0) state = { ...state, stats: { ...state.stats, playSeconds: (state.stats.playSeconds || 0) + dt } };
}

// 连点器自动喂食：生效期间按 ratePerSecond 频率执行 feed，带飘字动效
function tickClicker(now) {
  if (now >= state.clicker.activeUntil) return;
  clickerCarry += CONFIG.clicker.ratePerSecond;
  while (clickerCarry >= 1) {
    clickerCarry -= 1;
    const before = state.count;
    state = feed(state, now, Math.random);
    const gained = state.count - before;
    if (gained > 0) spawnCountFloat(gained);
  }
}

function onTick() {
  tickPlaySeconds();
  const now = Date.now();
  tickClicker(now);
  state = produce(state, 1);
  checkAchievements();
  render();
  maybeClear();
  persist();
  if (CONFIG.leaderboard.enabled) submitScore(); // 排行榜上报（内部 10s 节流，失败静默；关闭时不上报）
}

function taskRowHtml(t, done, ok) {
  const value = metricValue(state, t.metric);
  const prog = `${fmt(Math.min(value, t.target))}/${fmt(t.target)}`;
  let right;
  if (done) right = '<span style="color:#4caf50;font-weight:700;font-size:13px;">已领取</span>';
  else if (ok) right = `<button class="claim-task" data-task-id="${t.id}" style="border:none;border-radius:8px;background:var(--accent);color:#fff;padding:6px 12px;font-weight:700;cursor:pointer;">领取</button>`;
  else right = '<span style="color:#bbb;font-size:13px;">未完成</span>';
  return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;"><div style="flex:1;"><div style="font-size:14px;">${t.name}</div><div style="font-size:12px;color:#999;">${prog}</div></div>${right}</div>`;
}

function renderTasks() {
  state = rolloverDaily(state, Date.now());
  $('task-daily').innerHTML = CONFIG.tasks.daily
    .map((t) => taskRowHtml(t, !!state.tasks.dailyDone[t.id], metricValue(state, t.metric) >= t.target)).join('');
  $('task-mainline').innerHTML = CONFIG.tasks.mainline
    .map((t) => taskRowHtml(t, !!state.tasks.mainlineDone[t.id], metricValue(state, t.metric) >= t.target)).join('');
}

function renderAchievements() {
  const grid = $('achievements-grid');
  grid.innerHTML = CONFIG.achievements.map((a) => {
    const unlocked = !!state.achievements[a.id];
    return `<div style="border-radius:10px;padding:10px;background:var(--panel);text-align:center;opacity:${unlocked ? 1 : 0.4};"><div style="font-size:22px;">${unlocked ? '🏅' : '🔒'}</div><div style="font-size:13px;font-weight:700;">${a.name}</div><div style="font-size:11px;color:#999;">${a.desc}</div></div>`;
  }).join('');
}

let activeVariant = 'taunt';
let lastShareCanvas = null;

function renderCollection() {
  state = collectGenes(state);
  const p = collectionProgress(state);
  $('c-progress').textContent = `${p.owned}/${p.total}`;
  const items = [];
  CONFIG.evolution.forms[state.faction].forEach((name, i) => {
    items.push({ emoji: '🐾', name, owned: i <= state.evolutionLevel });
  });
  const coats = CONFIG.genes.coats[state.faction];
  CONFIG.genes.sizes.forEach((size, si) => {
    coats.forEach((coat, ci) => {
      const key = `${ci},${si}`;
      items.push({ emoji: '🧬', name: `${coat}·${size}`, owned: !!state.collected.combos[key] });
    });
  });
  CONFIG.genes.mutations.forEach((m, mi) => {
    items.push({ emoji: '✨', name: m, owned: !!state.collected.mutations[String(mi)] });
  });
  $('collection-grid').innerHTML = items.map((it) =>
    `<div style="border-radius:10px;padding:8px;background:var(--panel);text-align:center;opacity:${it.owned ? 1 : 0.35};"><div style="font-size:20px;">${it.emoji}</div><div style="font-size:11px;font-weight:700;">${it.owned ? it.name : '？？？'}</div></div>`
  ).join('');

  // 种群统计：每个不同性状的哈基米有多少只
  const pop = populationByTrait(state);
  $('population-list').innerHTML = pop.length
    ? pop.map((t, i) =>
        `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 10px;border-radius:10px;background:var(--panel);${i === 0 ? 'border:2px solid var(--accent);' : ''}">
          <span style="font-size:13px;font-weight:700;">${t.label}</span>
          <span style="font-size:13px;color:var(--accent);font-weight:800;">${fmt(t.count)} 只</span>
        </div>`
      ).join('')
    : '<div style="padding:10px;text-align:center;color:#999;font-size:13px;">还没有不同性状的哈基米，先买池子让它挂机产仔吧</div>';
}

function renderShare() {
  $('share-text').textContent = shareText(state, activeVariant);
}

function updateShareVariant() {
  document.querySelectorAll('.share-variant').forEach((b) => b.classList.toggle('active', b.dataset.variant === activeVariant));
  renderShare();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('已复制，去群里/动态晒出来吧');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    toast(ok ? '已复制' : '复制失败，请长按上方文案手动复制');
  }
}

function drawShareCard() {
  const f = currentFaction();
  const p = collectionProgress(state);
  const w = 720, h = 960;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const accent = f.theme.accent;
  const bg = f.theme.bg;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w, 22);
  ctx.fillRect(0, h - 22, w, 22);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#333';
  ctx.font = 'bold 50px sans-serif';
  ctx.fillText('哈基杯-基狗对邦', w / 2, 120);
  ctx.fillStyle = accent;
  ctx.font = '38px sans-serif';
  ctx.fillText('· 应援补给站 ·', w / 2, 175);
  ctx.fillStyle = '#333';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText(`${f.emoji} ${f.name}`, w / 2, 280);
  ctx.fillStyle = accent;
  ctx.font = 'bold 130px sans-serif';
  ctx.fillText(fmt(state.totalProduced), w / 2, 440);
  ctx.fillStyle = '#666';
  ctx.font = '36px sans-serif';
  ctx.fillText('累计养出（只）', w / 2, 495);
  ctx.fillStyle = '#333';
  ctx.font = '42px sans-serif';
  ctx.fillText(`${formName(state)} · 图鉴 ${p.owned}/${p.total}`, w / 2, 590);
  ctx.fillStyle = '#888';
  ctx.font = '30px sans-serif';
  ctx.fillText(CONFIG.share.link, w / 2, 880);
  return canvas;
}

function showShareImage(canvas) {
  lastShareCanvas = canvas;
  $('share-image-img').src = canvas.toDataURL('image/png');
  $('share-image-img').style.display = 'block';
  $('btn-download').style.display = 'block';
}

function downloadImage(canvas) {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'hajimi-idle-share.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

let newsIndex = 0;
function renderNews() {
  $('news-bar').textContent = CONFIG.news[newsIndex % CONFIG.news.length];
  newsIndex++;
}

const shopBtnStyle = 'border:none;border-radius:8px;background:var(--accent);color:#fff;padding:6px 12px;font-weight:700;font-size:13px;cursor:pointer;';

function renderShop() {
  $('shop-balance').textContent = `余额 ${fmt(state.count)}`;
  const mult = globalShopMultiplier(state);
  let html = '';
  html += `<div style="padding:8px 0;border-bottom:1px dashed #ddd;display:flex;align-items:center;gap:8px;">
    <div style="flex:1;"><div style="font-weight:700;">全局产出倍率 ×${(+mult.toFixed(2))}</div><div style="font-size:12px;color:#999;">下一级 ×${CONFIG.shop.multiplier.base}（永久）</div></div>
    <button class="shop-buy" data-shop-buy="multiplier" style="${shopBtnStyle}">${fmt(shopMultiplierCost(state))}</button></div>`;

  html += `<div style="padding:8px 0;border-bottom:1px dashed #ddd;display:flex;align-items:center;gap:8px;">
    <div style="flex:1;"><div style="font-weight:700;">喂一口狂暴升级 · 触发率 ${(raptureRate(state) * 100).toFixed(1)}%</div><div style="font-size:12px;color:#999;">狂暴 ×${CONFIG.rapture.multiplier} 持续 ${CONFIG.rapture.durationSeconds}s，每级触发率×${CONFIG.shop.raptureUpgrade.rateFactor}（封顶 ${CONFIG.rapture.maxLevel} 级）</div></div>
    <button class="shop-buy" data-shop-buy="rapture" style="${shopBtnStyle}">${fmt(raptureUpgradeCost(state))}</button></div>`;

  html += `<div style="padding:8px 0;border-bottom:1px dashed #ddd;display:flex;align-items:center;gap:8px;">
    <div style="flex:1;"><div style="font-weight:700;">商店加速卡 ×2</div><div style="font-size:12px;color:#999;">持续 10 分钟（生效中再买则存进背包）</div></div>
    <button class="shop-buy" data-shop-buy="buff" style="${shopBtnStyle}">${fmt(CONFIG.shop.buff.cost)}</button></div>`;

  html += `<div style="padding:8px 0;"><div style="font-weight:700;">池子升级（该池产出 ×2，永久）</div></div>`;
  CONFIG.pools.forEach((p, i) => {
    const lv = state.shop.poolUpgrades[i];
    html += `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;">
      <div style="flex:1;font-size:13px;">${p.name} <span style="color:var(--accent);font-weight:700;">×${CONFIG.shop.poolUpgrade.factor ** lv}</span></div>
      <button class="shop-buy" data-shop-buy="pool" data-index="${i}" style="${shopBtnStyle}">${fmt(shopPoolUpgradeCost(state, i))}</button></div>`;
  });

  html += `<div style="padding:8px 0;border-top:1px dashed #ddd;"><div style="font-weight:700;">节日活动（当前加成 ×${bonusMultiplier(state).toFixed(2)}）</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">`;
  CONFIG.shop.themes.forEach((t) => {
    const active = state.shop.theme === t.id;
    const label = t.bonus > 1 ? `${t.emoji} ${t.name} ×${t.bonus}` : `${t.emoji} ${t.name}`;
    html += `<button class="theme-btn" data-theme="${t.id}" style="border:none;border-radius:8px;padding:6px 12px;font-weight:700;cursor:pointer;${active ? 'background:var(--accent);color:#fff;' : 'background:var(--accent-soft);color:var(--text);'}">${label}</button>`;
  });
  html += `</div>`;

  // 节日道具
  CONFIG.shop.themes.forEach((t) => {
    if (!t.item) return;
    const owned = !!state.shop.themeItems[t.id];
    html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;">
      <div style="flex:1;font-size:13px;">${t.emoji} ${t.item.name} <span style="color:var(--accent);font-weight:700;">产出 ×${t.item.bonus}</span>（永久）</div>
      ${owned ? '<span style="color:#4caf50;font-weight:700;font-size:13px;">已拥有</span>' : `<button class="shop-buy" data-shop-buy="theme-item" data-theme="${t.id}" style="${shopBtnStyle}">${fmt(t.item.cost)}</button>`}
    </div>`;
  });
  html += `</div>`;
  $('shop-body').innerHTML = html;
}

function renderBackpack() {
  const now = Date.now();
  const defs = [
    { type: 'task', emoji: '🎫', name: '任务加速卡', desc: '×2 持续 30 分钟（完成任务获得）' },
    { type: 'video', emoji: '🎬', name: '看视频加速卡', desc: '×2 持续 10 分钟（看应援获得）' },
    { type: 'shop', emoji: '🛒', name: '商店加速卡', desc: '×2 持续 10 分钟（商店购买获得）' },
  ];
  const rows = defs.map((d) => {
    const active = now < state.boost[d.type].expiresAt;
    const count = state.cards[d.type];
    const status = active ? `生效中，剩余 ${fmtTime(state.boost[d.type].expiresAt - now)}` : '空闲';
    const disabled = active || count <= 0;
    return `<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px dashed #ddd;">
      <div style="flex:1;">
        <div style="font-weight:700;">${d.emoji} ${d.name} ×2</div>
        <div style="font-size:12px;color:#999;">${d.desc}</div>
        <div style="font-size:12px;font-weight:700;color:${active ? 'var(--accent)' : '#999'};">${status} · 持有 ${count} 张</div>
      </div>
      <button class="use-card" data-card="${d.type}" ${disabled ? 'disabled' : ''} style="border:none;border-radius:8px;background:var(--accent);color:#fff;padding:7px 14px;font-weight:700;font-size:13px;cursor:pointer;${disabled ? 'opacity:0.4;' : ''}">使用</button>
    </div>`;
  }).join('');

  // 连点器
  const clickerActive = now < state.clicker.activeUntil;
  const clickerDisabled = clickerActive || state.clicker.count <= 0;
  const clickerHtml = `<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px dashed #ddd;">
    <div style="flex:1;">
      <div style="font-weight:700;">🖱 连点器</div>
      <div style="font-size:12px;color:#999;">自动连点喂食 ${CONFIG.clicker.ratePerSecond} 次/秒 × ${CONFIG.clicker.durationSeconds}s（看视频 50% 获得）</div>
      <div style="font-size:12px;font-weight:700;color:${clickerActive ? 'var(--accent)' : '#999'};">${clickerActive ? `运行中，剩余 ${fmtTime(state.clicker.activeUntil - now)}` : '空闲'} · 持有 ${state.clicker.count} 个</div>
    </div>
    <button class="use-card" data-card="clicker" ${clickerDisabled ? 'disabled' : ''} style="border:none;border-radius:8px;background:var(--accent);color:#fff;padding:7px 14px;font-weight:700;font-size:13px;cursor:pointer;${clickerDisabled ? 'opacity:0.4;' : ''}">使用</button>
  </div>`;

  // 节日道具
  const themeItems = CONFIG.shop.themes.filter((t) => t.item && state.shop.themeItems[t.id]);
  const themeHtml = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 0;">
    <div><div style="font-weight:700;">🎁 节日道具</div><div style="font-size:12px;color:#999;">永久产出加成</div></div>
    <span style="font-size:13px;color:var(--accent);font-weight:800;">${themeItems.length ? themeItems.map((t) => `${t.emoji}${t.item.name}`).join('、') : '暂无'}</span></div>`;
  $('backpack-body').innerHTML = rows + clickerHtml + themeHtml;
}

// ============================================================
// 排行榜 / 账号（Supabase 轻量接入，见 docs/adr/0002）
// ============================================================

let sb = null;            // supabase 客户端
let playerId = null;      // 匿名登录的 auth.uid()
let nickname = '';        // 已填昵称
let lbFaction = 'all';    // 排行榜当前 tab
let lastSubmitAt = 0;     // 上次上报时间
let lastSubFaction = '';  // 上次上报时的阵营

const NICK_KEY = 'hajimi-idle.nickname.v1';

function loadNickname() { try { return localStorage.getItem(NICK_KEY) || ''; } catch { return ''; } }
function saveNickname(n) { try { localStorage.setItem(NICK_KEY, n); } catch { /* 忽略 */ } }

async function initSupabase() {
  try {
    if (!window.supabase || !CONFIG.supabase || !CONFIG.supabase.url) {
      console.log('[排行榜] Supabase 未配置');
      return;
    }
    sb = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    // 远端运营配置（推广位/看板/分享/新闻/排行榜开关）：anon 只读即可，不依赖匿名登录；
    // 失败静默回退本地 config.js（游戏必须离线可玩）。
    await loadSiteConfig();
    // 排行榜未启用（维护中）：只读配置，不匿名登录、不上报
    if (!CONFIG.leaderboard.enabled) {
      console.log('[排行榜] 维护中（site_config 或本地配置 enabled=false），不启用账号与上报');
      return;
    }
    let session = (await sb.auth.getSession()).data.session;
    if (!session) session = (await sb.auth.signInAnonymously()).data.session;
    if (!session) {
      console.warn('[排行榜] 匿名登录失败');
      return;
    }
    playerId = session.user.id;
    nickname = loadNickname();
    console.log('[排行榜] 初始化: playerId=', playerId, '本地昵称=', nickname);
    // 立即建立玩家档案（players.created_at 作为云端游玩时长校验的服务端锚点）
    await ensurePlayerRow();
    const { data: row } = await sb.from('players').select('nickname').eq('id', playerId).maybeSingle();
    if (row && row.nickname && row.nickname !== '神秘玩家') {
      nickname = row.nickname;
      console.log('[排行榜] 从云端恢复昵称:', nickname);
    }
  } catch (e) { console.warn('排行榜初始化失败（可能未建表/匿名登录未开启）', e); }
}

// 拉取远端运营配置（docs/site-config-schema.sql 建的 site_config 表）并覆盖 CONFIG。
// 覆盖规则在 core.applySiteConfig（白名单 key + 值合法性校验）；失败/缺 key 静默保留本地默认。
async function loadSiteConfig() {
  if (!sb) return;
  try {
    const { data, error } = await sb.from('site_config').select('key, value');
    if (error) throw error;
    applySiteConfig(CONFIG, data || []);
    console.log('[远端配置] 已加载 site_config:', (data || []).map((r) => r.key).join(', ') || '空');
    // 刷新受远端配置影响的 UI：群号、新闻栏
    $('btn-group').textContent = CONFIG.board.group;
    renderNews();
  } catch (e) {
    console.warn('[远端配置] 拉取失败，使用本地配置', e);
  }
}

async function ensurePlayerRow() {
  if (!sb || !playerId) return;
  try {
    await sb.from('players').upsert(
      { id: playerId, nickname: nickname || '神秘玩家', faction: state.faction },
      { onConflict: 'id' }
    );
  } catch (e) { console.warn(e); }
}

function showNicknameModal(prefill = '') {
  const isRename = Boolean(prefill);
  $('nickname-title').textContent = isRename ? '✏️ 修改昵称' : '🏅 加入排行榜';
  $('nickname-desc').textContent = isRename ? '换个新名字（1~16 字）' : '填个昵称就能上排行榜（1~16 字）';
  $('btn-nickname-submit').textContent = isRename ? '保存修改' : '确定上榜';
  $('nickname-input').value = prefill;
  $('overlay-nickname').classList.add('show');
  setTimeout(() => { try { $('nickname-input').focus(); } catch { /* 忽略 */ } }, 80);
}

async function submitNickname() {
  const name = ($('nickname-input').value || '').trim().slice(0, 16);
  if (!name) { toast('昵称不能为空'); return; }
  const isRename = nickname && nickname !== name;
  nickname = name;
  saveNickname(name);
  try { await sb.from('players').update({ nickname: name, faction: state.faction }).eq('id', playerId); }
  catch (e) { console.warn(e); }
  $('overlay-nickname').classList.remove('show');
  submitScore(true);
  if (isRename) {
    toast(`✅ 昵称已改为「${name}」`);
    // 如果排行榜正在打开，刷新显示
    if ($('overlay-leaderboard').classList.contains('show')) {
      renderLeaderboard();
    }
  } else {
    toast(`👋 ${name}，已加入排行榜！`);
  }
}

async function submitScore(force = false) {
  if (!sb || !playerId) {
    console.log('[排行榜] 未初始化，跳过上报');
    return;
  }
  if (!nickname) {
    console.log('[排行榜] 无昵称，跳过上报（玩家需填昵称才能上榜）');
    return;
  }
  const now = Date.now();
  if (!force && now - lastSubmitAt < CONFIG.leaderboard.submitIntervalMs) return;
  lastSubmitAt = now;
  try {
    // 服务端权威重算（方案 A）：上报完整 state，云端用公式算权威 total 写库。
    // 客户端 total 仅供参考；若 RPC 未部署/失败则静默降级（不影响游戏）。
    const statePayload = {
      count: state.count,
      totalProduced: state.totalProduced,
      pools: state.pools,
      evolutionLevel: state.evolutionLevel,
      boost: state.boost,
      rapture: state.rapture,
      shop: state.shop,
      stats: { playSeconds: state.stats.playSeconds || 0 },
    };
    const { data: rpcData, error: rpcErr } = await sb.rpc('recalc_score', { p_state: statePayload });
    if (rpcErr) {
      // RPC 未部署或参数问题：静默降级（保持旧路径尝试写 scores，避免完全断联）
      console.warn('[排行榜] recalc_score RPC 失败，降级旧路径:', rpcErr.message);
      const payload = {
        total_produced: Math.floor(state.totalProduced),
        count: Math.floor(state.count),
        play_seconds: Math.floor(state.stats.playSeconds || 0),
      };
      const u = await sb.from('scores').update(payload).eq('player_id', playerId);
      if (u.error) throw u.error;
      if (!u.data || u.data.length === 0) {
        const i = await sb.from('scores').insert({ player_id: playerId, ...payload });
        if (i.error) throw i.error;
      }
    } else if (rpcData && rpcData.error) {
      console.warn('[排行榜] recalc_score 云端拒绝:', rpcData.error, rpcData.context || '');
    } else if (rpcData && rpcData.recalculated) {
      // 用服务端权威值校准本地展示（榜单读数源已更新）
      console.log('[排行榜] 服务端权威 total:', rpcData.total_server);
    }
    if (lastSubFaction !== state.faction) {
      lastSubFaction = state.faction;
      await sb.from('players').update({ faction: state.faction }).eq('id', playerId);
    }
  } catch (e) {
    console.warn('[排行榜] 上报异常:', e);
    /* 表未建/网络问题/云端判定不合理：静默降级，不打断游戏 */
  }
}

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** 玩家短 ID：取 player_id（UUID）前 6 位大写，用于区分同名玩家。 */
function shortPlayerId(pid) {
  if (!pid || typeof pid !== 'string') return '';
  return pid.replace(/-/g, '').slice(0, 6).toUpperCase();
}

async function renderLeaderboard() {
  const listEl = $('lb-list');
  listEl.innerHTML = '<div style="padding:14px;color:#999;text-align:center;">加载中…</div>';
  $('lb-mine').textContent = '';
  try {
    if (!sb) throw new Error('supabase 未就绪');
    // 封神榜 tab 查 leaderboard_immortal 视图（total >= 1e18，云端正交于人界榜）
    // 人界 tab 查 leaderboard 视图（total < 1e18）
    const isImmortal = lbFaction === 'immortal';
    let q = sb.from(isImmortal ? 'leaderboard_immortal' : 'leaderboard')
      .select('player_id,total_produced,nickname,faction')
      .order('total_produced', { ascending: false })
      .limit(CONFIG.leaderboard.topN);
    if (!isImmortal && lbFaction !== 'all') q = q.eq('faction', lbFaction);
    const { data, error } = await q;
    if (error) throw error;
    const rows = data || [];
    const emptyHtml = isImmortal
      ? '<div style="padding:14px;color:#999;text-align:center;">🐉 封神榜空无一人<br><span style="font-size:12px;">养到 100 亿亿（1e18）即可破碎虚空登封神榜！</span></div>'
      : '<div style="padding:14px;color:#999;text-align:center;">还没有玩家上榜，快去养哈基米吧！</div>';
    listEl.innerHTML = rows.length
      ? rows.map((r, i) => `<div style="display:flex;align-items:center;gap:8px;padding:9px 6px;border-bottom:1px dashed #eee;${r.player_id === playerId ? 'background:var(--accent-soft);border-radius:10px;' : ''}">
          <span style="width:26px;font-weight:800;font-size:14px;color:${i < 3 ? 'var(--accent)' : '#999'};">${i + 1}</span>
          <span style="flex:1;min-width:0;">
            <span style="display:flex;align-items:center;gap:4px;font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.player_id === playerId ? '⭐ ' : ''}${escHtml(r.nickname || '神秘玩家')}${r.player_id === playerId && shortPlayerId(r.player_id) ? `<span style="font-size:10px;color:#bbb;font-weight:600;flex-shrink:0;">#${shortPlayerId(r.player_id)}</span>` : ''}</span>
            <span style="font-size:11px;color:${r.faction === 'kimi' ? '#ff6fa5' : '#4f7cff'};font-weight:600;">${r.faction === 'kimi' ? '🐱 基米队' : '🐶 大狗队'}</span>
          </span>
          <span style="font-weight:800;color:var(--accent);font-size:13px;flex-shrink:0;">${fmt(r.total_produced)}</span>
        </div>`).join('')
      : emptyHtml;
    const me = rows.findIndex((r) => r.player_id === playerId);
    const realmLabel = isImmortal ? '封神榜' : '人界';
    if (me >= 0) {
      $('lb-mine').innerHTML = `🎯 ${realmLabel}你的排名：第 ${me + 1} 名（${fmt(rows[me].total_produced)}）<span style="font-size:10px;color:#bbb;"> ID:#${shortPlayerId(playerId)}</span><button id="btn-rename" style="margin-left:8px;padding:2px 8px;border:none;border-radius:6px;background:var(--accent-soft);color:var(--accent);font-size:12px;cursor:pointer;">✏️ 改名字</button>`;
      $('btn-rename').addEventListener('click', () => { showNicknameModal(nickname); });
    } else if (playerId) {
      const { data: my } = await sb.from(isImmortal ? 'leaderboard_immortal' : 'leaderboard').select('total_produced').eq('player_id', playerId).maybeSingle();
      $('lb-mine').innerHTML = my && my.total_produced != null
        ? `🎯 ${realmLabel}你的累计：${fmt(my.total_produced)}（暂在前 ${CONFIG.leaderboard.topN} 名外）<span style="font-size:10px;color:#bbb;"> ID:#${shortPlayerId(playerId)}</span><button id="btn-rename" style="margin-left:8px;padding:2px 8px;border:none;border-radius:6px;background:var(--accent-soft);color:var(--accent);font-size:12px;cursor:pointer;">✏️ 改名字</button>`
        : isImmortal
          ? '🎯 你尚未登封神榜（养到 100 亿亿 1e18 即可）'
          : '🎯 你还没上榜（先填昵称，挂机后自动上报）';
      const renameBtn = $('btn-rename');
      if (renameBtn) renameBtn.addEventListener('click', () => { showNicknameModal(nickname); });
    }
  } catch (e) {
    listEl.innerHTML = '<div style="padding:14px;color:#999;text-align:center;">排行榜暂不可用<br><span style="font-size:12px;">请确认已执行建表 SQL、开启匿名登录、网络可达</span></div>';
  }
}

function updateLbTabs() {
  document.querySelectorAll('.lb-tab').forEach((b) => {
    const active = b.dataset.faction === lbFaction;
    b.style.background = active ? 'var(--accent)' : 'var(--accent-soft)';
    b.style.color = active ? '#fff' : 'var(--text)';
  });
}

function bindEvents() {
  $('btn-feed').addEventListener('click', () => {
    const before = state.count;
    state = feed(state);
    const gained = state.count - before;
    if (gained > 0) spawnCountFloat(gained);
    checkAchievements();
    render();
    maybeClear();
    persist();
  });

  $('btn-clear-close').addEventListener('click', () => $('overlay-clear').classList.remove('show'));
  $('btn-offline-close').addEventListener('click', () => $('overlay-offline').classList.remove('show'));
  $('btn-supply').addEventListener('click', doSupply);
  $('btn-board').addEventListener('click', () => {
    try { window.open(CONFIG.board.url, '_blank', 'noopener'); } catch { /* 忽略弹窗拦截 */ }
  });
  $('btn-group').addEventListener('click', () => copyText(CONFIG.board.group));
  $('btn-settings').addEventListener('click', () => {
    const f = currentFaction();
    $('s-current').textContent = `${f.emoji} ${f.name}`;
    $('overlay-settings').classList.add('show');
  });
  $('btn-settings-close').addEventListener('click', () => $('overlay-settings').classList.remove('show'));
  $('btn-tasks').addEventListener('click', () => { renderTasks(); $('overlay-tasks').classList.add('show'); });
  $('btn-achievements').addEventListener('click', () => { renderAchievements(); $('overlay-achievements').classList.add('show'); });
  $('btn-tasks-close').addEventListener('click', () => $('overlay-tasks').classList.remove('show'));
  $('btn-achievements-close').addEventListener('click', () => $('overlay-achievements').classList.remove('show'));
  $('btn-collection').addEventListener('click', () => { renderCollection(); $('overlay-collection').classList.add('show'); });
  $('btn-collection-close').addEventListener('click', () => $('overlay-collection').classList.remove('show'));
  $('btn-shop').addEventListener('click', () => { renderShop(); $('overlay-shop').classList.add('show'); });
  $('btn-shop-close').addEventListener('click', () => $('overlay-shop').classList.remove('show'));
  $('btn-backpack').addEventListener('click', () => { renderBackpack(); $('overlay-backpack').classList.add('show'); });
  $('btn-backpack-close').addEventListener('click', () => $('overlay-backpack').classList.remove('show'));
  $('btn-share').addEventListener('click', () => { renderShare(); $('overlay-share').classList.add('show'); });
  $('btn-share-close').addEventListener('click', () => $('overlay-share').classList.remove('show'));
  $('btn-copy').addEventListener('click', () => copyText($('share-text').textContent));
  $('btn-share-image').addEventListener('click', () => showShareImage(drawShareCard()));
  $('btn-download').addEventListener('click', () => { if (lastShareCanvas) downloadImage(lastShareCanvas); });

  $('btn-leaderboard').addEventListener('click', () => {
    // 排行榜维护中（enabled=false）：显示维护提示，不展示榜单
    if (!CONFIG.leaderboard.enabled) {
      $('lb-list').innerHTML = '<div style="padding:28px 14px;color:#999;text-align:center;">🔧 排行榜维护中<br><span style="font-size:12px;">敬请期待，马上回来！</span></div>';
      $('lb-mine').textContent = '';
      updateLbTabs();
      $('overlay-leaderboard').classList.add('show');
      return;
    }
    if (!nickname) { showNicknameModal(); return; }
    updateLbTabs();
    renderLeaderboard();
    $('overlay-leaderboard').classList.add('show');
  });
  $('btn-leaderboard-close').addEventListener('click', () => $('overlay-leaderboard').classList.remove('show'));
  $('btn-nickname-submit').addEventListener('click', submitNickname);
  $('nickname-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitNickname(); });

  // 点击遮罩背景或按 Esc 均可退回上一页（关闭弹层）
  document.addEventListener('click', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('overlay')) {
      e.target.classList.remove('show');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.overlay.show').forEach((o) => o.classList.remove('show'));
    }
  });

  document.addEventListener('click', (e) => {
    const backBtn = e.target.closest('.overlay-back');
    if (backBtn) {
      const ov = document.getElementById(backBtn.dataset.overlay);
      if (ov) ov.classList.remove('show');
      return;
    }
    const lbBtn = e.target.closest('.lb-tab');
    if (lbBtn) {
      lbFaction = lbBtn.dataset.faction;
      updateLbTabs();
      renderLeaderboard();
      return;
    }
    const shopBtn = e.target.closest('.shop-buy');
    if (shopBtn) {
      const kind = shopBtn.dataset.shopBuy;
      let next = state;
      if (kind === 'multiplier') next = buyMultiplier(state);
      else if (kind === 'rapture') next = buyRaptureUpgrade(state);
      else if (kind === 'buff') next = buyBuff(state, Date.now());
      else if (kind === 'pool') next = buyPoolUpgrade(state, Number(shopBtn.dataset.index));
      else if (kind === 'theme-item') next = buyThemeItem(state, shopBtn.dataset.theme);
      if (next !== state) { state = next; toast('购买成功！'); persist(); renderShop(); render(); }
      else toast('动物数量不足');
      return;
    }
    const themeBtn = e.target.closest('.theme-btn');
    if (themeBtn) {
      state = setTheme(state, themeBtn.dataset.theme);
      persist();
      renderShop();
      toast('已切换节日主题');
      return;
    }

    const useCardBtn = e.target.closest('.use-card');
    if (useCardBtn) {
      const type = useCardBtn.dataset.card;
      const next = type === 'clicker' ? useClicker(state, Date.now()) : useCard(state, type, Date.now());
      if (next !== state) { state = next; toast(type === 'clicker' ? '🖱 连点器已开启（60 秒）' : '加速卡已使用！'); persist(); renderBackpack(); render(); }
      else toast(type === 'clicker' ? '没有连点器，或已在生效中' : '该词条已有生效卡，或没有可用卡');
      return;
    }

    const amtBtn = e.target.closest('.buy-amt');
    if (amtBtn) {
      buyAmount = Number(amtBtn.dataset.amt);
      updateBuyAmount();
      renderPools();
      return;
    }

    const variantBtn = e.target.closest('.share-variant');
    if (variantBtn) {
      activeVariant = variantBtn.dataset.variant;
      updateShareVariant();
      return;
    }

    const claimBtn = e.target.closest('.claim-task');
    if (claimBtn) {
      const r = claimTask(state, claimBtn.dataset.taskId, Date.now());
      if (r.claimed) {
        state = r.state;
        toast('任务完成，加速 +30 分钟！');
        renderTasks();
        render();
      }
      persist();
      return;
    }

    const b = e.target.closest('[data-faction]');
    if (!b) return;
    const fid = b.dataset.faction;
    if (!CONFIG.factions[fid]) return;
    if (!started) {
      state = createGame({ faction: fid });
      started = true;
      cleared = false;
      showGame();
    } else if ($('overlay-settings').classList.contains('show')) {
      state = { ...state, faction: fid };
      $('overlay-settings').classList.remove('show');
    } else {
      return;
    }
    badgeEl.textContent = `${CONFIG.factions[fid].emoji} ${CONFIG.factions[fid].name}`;
    applyTheme();
    persist();
    render();
  });
}

function init() {
  applyTheme();
  $('btn-group').textContent = CONFIG.board.group; // 群号从配置单点维护
  bindEvents();
  const save = loadSave();
  if (save && save.state) {
    state = normalizeState(save.state);
    started = true;
    badgeEl.textContent = `${currentFaction().emoji} ${currentFaction().name}`;
    const lastSeen = Number(save.lastSeen) || Date.now();
    const r = offlineGains(state, lastSeen, Date.now());
    if (r.gains > 0) {
      state = r.state;
      $('offline-gains').textContent = fmt(r.gains);
      $('overlay-offline').classList.add('show');
    }
    showGame();
    render();
    persist();
  } else {
    showFaction();
  }
  setInterval(onTick, 1000);
  renderNews();
  setInterval(renderNews, 4000);
  initSupabase(); // 初始化 supabase client + 拉 site_config +（enabled 时）匿名登录/档案；失败静默
  window.addEventListener('pagehide', () => { if (CONFIG.leaderboard.enabled) submitScore(true); });
}

init();
