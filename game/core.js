// 养哈基米/哈基汪 · 纯逻辑核心
// 不碰 DOM、不碰 localStorage；时钟与随机数注入，Node 环境可直接测试。
// 票 01 覆盖：喂食、生产池子购买、秒产、进化、离线收益、通关判定。

import { CONFIG } from './config.js';

/**
 * 创建一局新游戏（state 为纯数据，不含 DOM/时钟）。
 * @param {{faction?:'kimi'|'dog'}} opts
 */
export function createGame({ faction = 'kimi' } = {}) {
  const emptyGene = () => ({ coat: 0, size: 0, mutation: null });
  return {
    faction,
    count: 0,                                  // 持有（可花的货币）
    totalProduced: 0,                          // 累计产仔（进化 + 通关依据）
    pools: Array(CONFIG.pools.length).fill(0), // 每级池子已购数量
    evolutionLevel: 0,                         // 当前进化等级（形态）
    genes: Array(CONFIG.pools.length).fill(null).map(emptyGene), // 每池基因池
    mateProgress: Array(CONFIG.pools.length).fill(0),            // 每池交配倒计时（秒）
    boost: { task: { expiresAt: 0 }, video: { expiresAt: 0 }, shop: { expiresAt: 0 } }, // 三种加速状态（各 ×2，可同时存在）
    cards: { task: 0, video: 0, shop: 0 },                        // 背包里的加速卡数量（每词条同时只能生效一张）
    rapture: { activeUntil: 0, readyAt: 0 },                     // 喂一口狂暴：生效截止 + 冷却结束（下一次可触发）
    clicker: { count: 0, activeUntil: 0 },                       // 连点器：背包数量 + 生效截止
    supply: { date: '', used: 0 },                               // 每日补给配额（日期戳 + 今日已用）
    stats: { clicks: 0, dailyFeeds: 0, dailyBoosts: 0, totalBoosts: 0, maxActiveChannels: 0, playSeconds: 0, dailyDate: '' }, // 任务/成就统计（playSeconds=累计游玩秒数，云端按此核算分数合理性）
    tasks: { dailyDone: {}, mainlineDone: {} },                  // 已完成并领取的任务
    achievements: {},                                            // 已点亮成就 { id: true }
    collected: { combos: {}, mutations: {} },                    // 藏品图鉴已收录（基因组合/变异）
    poolProduced: Array(CONFIG.pools.length).fill(0),            // 每池累计产仔（用于种群统计）
    shop: { multLevel: 0, raptureLevel: 0, poolUpgrades: Array(CONFIG.pools.length).fill(0), theme: 'default', themeItems: {} }, // 商店
  };
}

/** 进化倍率：每级 ×multiplier。 */
export function evolutionMultiplier(level) {
  return CONFIG.evolution.multiplier ** level;
}

/** 由累计产仔推算进化等级：每跨 evolutionBase(10)× 升一级，封顶形态数-1。 */
export function evolutionLevelFor(totalProduced) {
  const maxLevel = CONFIG.evolution.forms.kimi.length - 1;
  let level = 0;
  let threshold = CONFIG.clear.evolutionBase;
  while (totalProduced >= threshold && level < maxLevel) {
    level++;
    threshold *= CONFIG.clear.evolutionBase;
  }
  return level;
}

/** 当前形态名（按阵营）。 */
export function formName(state) {
  const forms = CONFIG.evolution.forms[state.faction] ?? CONFIG.evolution.forms.kimi;
  return forms[Math.min(state.evolutionLevel, forms.length - 1)];
}

/** 毛色名（按阵营）。 */
export function coatName(state, gene) {
  const coats = CONFIG.genes.coats[state.faction] ?? CONFIG.genes.coats.kimi;
  return coats[gene.coat];
}

/** 体型名。 */
export function sizeName(gene) {
  return CONFIG.genes.sizes[gene.size];
}

/** 变异名（无变异返回 null）。 */
export function mutationName(gene) {
  return gene.mutation == null ? null : CONFIG.genes.mutations[gene.mutation];
}

/** 某池子基因池的可读描述，如「橘·标准」或「橘·标准·异色瞳」。 */
export function geneLabel(state, poolIndex) {
  const g = state.genes[poolIndex];
  const m = mutationName(g);
  return m ? `${coatName(state, g)}·${sizeName(g)}·${m}` : `${coatName(state, g)}·${sizeName(g)}`;
}

/**
 * 种群统计：按当前每池基因性状（毛色×体型×变异）聚合累计产仔数量，降序。
 * 返回 [{ coat, size, mutation, label, count }]；仅含已产仔的性状。
 */
export function populationByTrait(state) {
  const map = new Map();
  for (let i = 0; i < CONFIG.pools.length; i++) {
    const produced = state.poolProduced[i] || 0;
    if (produced <= 0) continue;
    const g = state.genes[i];
    const key = `${g.coat},${g.size},${g.mutation}`;
    const existing = map.get(key);
    if (existing) existing.count += produced;
    else map.set(key, { coat: g.coat, size: g.size, mutation: g.mutation, label: geneLabel(state, i), count: produced });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/** 加速倍速 = 任务加速卡 ×2 × 看视频加速 ×2 × 商店加速 ×2（三种可同时叠加，最高 8×）。 */
export function boostMultiplier(state, now) {
  let m = 1;
  if (now < state.boost.task.expiresAt) m *= 2;
  if (now < state.boost.video.expiresAt) m *= 2;
  if (now < state.boost.shop.expiresAt) m *= 2;
  return m;
}

/** 当前同时生效的加速状态数（0~3）。 */
export function activeBoostChannels(state, now) {
  return (now < state.boost.task.expiresAt ? 1 : 0)
    + (now < state.boost.video.expiresAt ? 1 : 0)
    + (now < state.boost.shop.expiresAt ? 1 : 0);
}

/** 商店全局产出倍率：base ^ 倍率等级。 */
export function globalShopMultiplier(state) {
  return CONFIG.shop.multiplier.base ** state.shop.multLevel;
}

/** 节日加成：当前主题 bonus × 已购节日道具 bonus 之积。 */
export function bonusMultiplier(state) {
  let m = 1;
  for (const t of CONFIG.shop.themes) {
    if (t.id === state.shop.theme) m *= t.bonus;
    if (t.item && state.shop.themeItems[t.id]) m *= t.item.bonus;
  }
  return m;
}

/** 狂暴倍率：狂暴生效期间全局产出 ×multiplier，否则 1。 */
export function raptureMultiplier(state, now) {
  return now < state.rapture.activeUntil ? CONFIG.rapture.multiplier : 1;
}

/** 当前喂食狂暴触发率（基础率 × 2^升级等级，封顶 3.2%）。 */
export function raptureRate(state) {
  const lv = Math.min(state.shop.raptureLevel, CONFIG.rapture.maxLevel);
  return CONFIG.rapture.baseRate * Math.pow(CONFIG.shop.raptureUpgrade.rateFactor, lv);
}

/** 每秒产仔 = Σ[已购 × 秒产 × 池子升级] × 进化 × 加速 × 商店全局 × 节日加成 × 狂暴。 */
export function secondsProduction(state, now = Date.now()) {
  let base = 0;
  for (let i = 0; i < CONFIG.pools.length; i++) {
    const upgradedProd = CONFIG.pools[i].prod * (CONFIG.shop.poolUpgrade.factor ** state.shop.poolUpgrades[i]);
    base += state.pools[i] * upgradedProd;
  }
  return base * evolutionMultiplier(state.evolutionLevel) * boostMultiplier(state, now) * globalShopMultiplier(state) * bonusMultiplier(state) * raptureMultiplier(state, now);
}

/**
 * 喂一口：产一窝，数量与累计同步上涨，重算进化等级，并累加点击统计。
 * 每次点击有概率触发「狂暴」（×7 持续 30s，结束后冷却 120s 才可再触发）。
 * @param {number} [now=Date.now()] 注入时钟（跨天重置每日统计）
 * @param {() => number} [rng=Math.random] 注入随机源（狂暴判定）
 */
export function feed(state, now = Date.now(), rng = Math.random) {
  const s = rolloverDaily(state, now);
  let rapture = s.rapture;
  // 狂暴判定：未生效中 && 冷却已结束
  if (now >= s.rapture.activeUntil && now >= s.rapture.readyAt && rng() < raptureRate(s)) {
    rapture = {
      activeUntil: now + CONFIG.rapture.durationSeconds * 1000,
      readyAt: now + (CONFIG.rapture.durationSeconds + CONFIG.rapture.cooldownSeconds) * 1000,
    };
  }
  // 喂食量：早期按基础产仔保底；有产能后跟随当前秒产 × clickSeconds（狂暴倍率两者都含）
  const raptureMult = raptureMultiplier({ ...s, rapture }, now);
  const floor = CONFIG.feed.base * evolutionMultiplier(s.evolutionLevel) * raptureMult;
  const scaled = secondsProduction({ ...s, rapture }, now) * CONFIG.feed.clickSeconds;
  const amount = Math.max(floor, scaled);
  const totalProduced = s.totalProduced + amount;
  return {
    ...s,
    rapture,
    count: s.count + amount,
    totalProduced,
    evolutionLevel: evolutionLevelFor(totalProduced),
    stats: { ...s.stats, clicks: s.stats.clicks + 1, dailyFeeds: s.stats.dailyFeeds + 1 },
  };
}

/** 第 index 级池子的当前成本（基础成本 × poolCostGrowth^已购数）。 */
export function poolCost(state, index) {
  const pool = CONFIG.pools[index];
  if (!pool) return Infinity;
  return Math.floor(pool.cost * Math.pow(CONFIG.poolCostGrowth, state.pools[index]));
}

/** 一次买 count 个池子的总成本（等比数列求和，含 1.15× 递增）。 */
export function bulkCost(state, index, count) {
  const pool = CONFIG.pools[index];
  if (!pool || count <= 0) return Infinity;
  const owned = state.pools[index];
  const r = CONFIG.poolCostGrowth;
  return Math.floor(pool.cost * Math.pow(r, owned) * (Math.pow(r, count) - 1) / (r - 1));
}

/** 批量买 count 个池子：钱够则扣款 + 该池 +count（并收录基因组合进图鉴）；否则原样返回。 */
export function buyPoolBulk(state, index, count) {
  const cost = bulkCost(state, index, count);
  if (cost === Infinity || state.count < cost) return state;
  const pools = [...state.pools];
  pools[index] += count;
  return collectGenes({ ...state, count: state.count - cost, pools });
}

/** 买一级池子：钱够则扣款 + 该池 +1（并收录其初始基因组合进图鉴）；否则原样返回。 */
export function buyPool(state, index) {
  return buyPoolBulk(state, index, 1);
}

/** 某池子是否已解锁显示：第 0 池永远可见，其余需累计养出达到其基础成本的 ratio（60%）。 */
export function isPoolRevealed(state, index) {
  if (index <= 0) return true;
  const pool = CONFIG.pools[index];
  if (!pool) return false;
  return state.totalProduced >= CONFIG.poolReveal.ratio * pool.cost;
}

/** 单次交配的遗传/变异：随机选一个字段推进（毛色/体型升一级，或变异随机替换）。 */
function mateGene(gene, rng) {
  const field = Math.floor(rng() * 3);
  if (field === 0) {
    const max = (CONFIG.genes.coats.kimi.length) - 1;
    return { ...gene, coat: Math.min(gene.coat + 1, max) };
  }
  if (field === 1) {
    const max = CONFIG.genes.sizes.length - 1;
    return { ...gene, size: Math.min(gene.size + 1, max) };
  }
  return { ...gene, mutation: Math.floor(rng() * CONFIG.genes.mutations.length) };
}

/**
 * 结算 seconds 秒：挂机产出（count/totalProduced 上涨、进化重算）+ 各活跃池子的交配。
 * @param {object} state
 * @param {number} seconds
 * @param {() => number} [rng=Math.random] 注入随机源（交配遗传）
 * @param {number} [now=Date.now()] 注入时钟（计算加速倍速）
 */
export function produce(state, seconds, rng = Math.random, now = Date.now()) {
  const s = state;

  const amount = secondsProduction(s, now) * seconds;
  const totalProduced = s.totalProduced + amount;
  const mateProgress = s.mateProgress.slice();
  let genes = s.genes;
  let poolProduced = s.poolProduced;

  // 每池累计产仔（供种群统计）：按该池秒产占比折算
  const globalMult = evolutionMultiplier(s.evolutionLevel) * boostMultiplier(s, now) * globalShopMultiplier(s) * bonusMultiplier(s) * raptureMultiplier(s, now);
  for (let i = 0; i < CONFIG.pools.length; i++) {
    if (s.pools[i] <= 0) continue; // 没有动物就不交配、不产仔
    const upgradedProd = CONFIG.pools[i].prod * (CONFIG.shop.poolUpgrade.factor ** s.shop.poolUpgrades[i]);
    const produced_i = s.pools[i] * upgradedProd * globalMult * seconds;
    if (produced_i > 0) {
      if (poolProduced === s.poolProduced) poolProduced = s.poolProduced.slice();
      poolProduced[i] += produced_i;
    }
    mateProgress[i] += seconds;
    while (mateProgress[i] >= CONFIG.genes.lifespanSeconds) {
      mateProgress[i] -= CONFIG.genes.lifespanSeconds;
      if (rng() < CONFIG.genes.mateSuccessRate) {
        if (genes === s.genes) genes = s.genes.slice();
        genes[i] = mateGene(genes[i], rng);
      }
    }
  }

  // 记录历史峰值：同时生效的加速状态数（供成就「三倍火力」）
  const activeNow = activeBoostChannels(s, now);
  const stats = activeNow > s.stats.maxActiveChannels ? { ...s.stats, maxActiveChannels: activeNow } : s.stats;

  const next = {
    ...s,
    count: s.count + amount,
    totalProduced,
    genes,
    mateProgress,
    poolProduced,
    stats,
    evolutionLevel: evolutionLevelFor(totalProduced),
  };
  return collectGenes(next);
}

/**
 * 离线收益：按 min(now - lastSeen, 8h) 结算，返回新 state 与收益。
 * @param {object} state 上次的 state
 * @param {number} lastSeen 上次时间戳（ms）
 * @param {number} now 当前时间戳（ms）
 */
export function offlineGains(state, lastSeen, now) {
  const elapsed = Math.max(0, (now - lastSeen) / 1000);
  const seconds = Math.min(elapsed, CONFIG.offline.maxSeconds);
  const next = produce(state, seconds, Math.random, now);
  return { state: next, gains: next.count - state.count, seconds };
}

/** 是否通关（累计产仔达 1 亿亿亿）。 */
export function isCleared(state) {
  return state.totalProduced >= CONFIG.clear.target;
}

// ============================================================
// 引流闭环：加速道具与每日补给配额（票 03）
// ============================================================

/** 本地日期键（YYYY-MM-DD），按玩家本地时区。 */
export function toLocalDateKey(now) {
  const d = now instanceof Date ? now : new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 今日剩余可领加速次数。 */
export function supplyRemaining(state, now) {
  const key = toLocalDateKey(now);
  const used = state.supply.date === key ? state.supply.used : 0;
  return Math.max(0, CONFIG.supply.dailyLimit - used);
}

/**
 * 发放一张加速卡：对应词条未生效则直接开启（×2，各自时长）；已生效则存进背包 +1。
 * @param {string} type 'task' | 'video' | 'shop'
 */
function grantBoost(state, type, now) {
  if (now < state.boost[type].expiresAt) {
    return { ...state, cards: { ...state.cards, [type]: state.cards[type] + 1 } };
  }
  return {
    ...state,
    boost: { ...state.boost, [type]: { expiresAt: now + CONFIG.boost[type].durationSeconds * 1000 } },
  };
}

/** 从背包主动使用一张加速卡（对应词条未生效时才可用，同时只能用一张）。 */
export function useCard(state, type, now = Date.now()) {
  if (!CONFIG.boost[type]) return state;
  if (state.cards[type] <= 0) return state;             // 没有卡
  if (now < state.boost[type].expiresAt) return state;  // 已有生效卡
  return {
    ...state,
    cards: { ...state.cards, [type]: state.cards[type] - 1 },
    boost: { ...state.boost, [type]: { expiresAt: now + CONFIG.boost[type].durationSeconds * 1000 } },
  };
}

/** 使用一个连点器：有存货且未生效才可用，开启后自动连点喂食 durationSeconds 秒。 */
export function useClicker(state, now = Date.now()) {
  if (state.clicker.count <= 0) return state;           // 没有连点器
  if (now < state.clicker.activeUntil) return state;    // 已生效，不能叠加
  return {
    ...state,
    clicker: {
      count: state.clicker.count - 1,
      activeUntil: now + CONFIG.clicker.durationSeconds * 1000,
    },
  };
}

/**
 * 领一次看视频加速（点击"去看应援"后调用）：
 * - 跨天自动重置配额；额度内：看视频加速未生效则开启 10 分钟 ×2，已生效则发一张看视频加速卡存进背包
 * - 超额：不发放，granted=false（仍计数，用于提示"今日补给已领完"）
 */
export function claimBoost(state, now) {
  const s = rolloverDaily(state, now);
  const key = toLocalDateKey(now);
  let supply = s.supply;
  if (supply.date !== key) supply = { date: key, used: 0 };
  const granted = supply.used < CONFIG.supply.dailyLimit;
  const used = supply.used + 1;

  let next = s;
  let stats = s.stats;
  if (granted) {
    next = grantBoost(s, 'video', now);
    stats = { ...s.stats, dailyBoosts: s.stats.dailyBoosts + 1, totalBoosts: s.stats.totalBoosts + 1 };
  }

  return {
    state: { ...next, supply: { date: key, used }, stats },
    granted,
    active: now < next.boost.video.expiresAt,
    cards: next.cards.video,
    remaining: Math.max(0, CONFIG.supply.dailyLimit - used),
  };
}

/**
 * "去看应援"按钮的随机跳转目标：在全部 ready 应援作品 + 主办方主页之间随机选一个。
 * @param {() => number} [rng=Math.random]
 * @returns {{url:string, kind:'work'|'home'}}
 */
export function pickSupplyTarget(rng = Math.random, homeWeight = 1) {
  const featured = CONFIG.supply.featured.filter((it) => it && it.ready !== false && it.bvid);
  const pool = featured.map((it) => ({ url: `https://www.bilibili.com/video/${it.bvid}`, kind: 'work' }));
  for (let i = 0; i < homeWeight; i++) pool.push({ url: CONFIG.supply.collectionUrl, kind: 'home' });
  if (pool.length === 0) return { url: CONFIG.supply.collectionUrl, kind: 'home' };
  return pool[Math.floor(rng() * pool.length)];
}

// ============================================================
// 任务与成就（票 04）
// ============================================================

/** 跨天重置每日统计与每日任务领取记录。 */
export function rolloverDaily(state, now) {
  const today = toLocalDateKey(now);
  if (state.stats.dailyDate === today) return state;
  return {
    ...state,
    stats: { ...state.stats, dailyDate: today, dailyFeeds: 0, dailyBoosts: 0 },
    tasks: { ...state.tasks, dailyDone: {} },
  };
}

/** 任务/成就进度指标的当前值。 */
export function metricValue(state, metric) {
  switch (metric) {
    case 'clicks': return state.stats.clicks;
    case 'dailyFeeds': return state.stats.dailyFeeds;
    case 'dailyBoosts': return state.stats.dailyBoosts;
    case 'totalBoosts': return state.stats.totalBoosts;
    case 'maxActiveChannels': return state.stats.maxActiveChannels;
    case 'poolsOwned': return state.pools.reduce((a, b) => a + b, 0);
    case 'totalProduced': return state.totalProduced;
    case 'evolutionLevel': return state.evolutionLevel;
    default: return 0;
  }
}

function findTask(taskId) {
  return CONFIG.tasks.daily.find((t) => t.id === taskId)
    || CONFIG.tasks.mainline.find((t) => t.id === taskId)
    || null;
}

/**
 * 领取任务奖励：进度达标且未领取则发放一张任务加速卡（×2 持续 30 分钟，未生效则直接开启，否则存进背包）。
 * @returns {{state:object, claimed:boolean}}
 */
export function claimTask(state, taskId, now = Date.now()) {
  const task = findTask(taskId);
  if (!task) return { state, claimed: false };
  const s = rolloverDaily(state, now);
  const isDaily = CONFIG.tasks.daily.some((t) => t.id === taskId);
  const doneMap = isDaily ? s.tasks.dailyDone : s.tasks.mainlineDone;
  if (doneMap[taskId]) return { state: s, claimed: false }; // 已领取
  if (metricValue(s, task.metric) < task.target) return { state: s, claimed: false }; // 进度不足

  const done = { ...doneMap, [taskId]: true };
  const tasks = isDaily ? { ...s.tasks, dailyDone: done } : { ...s.tasks, mainlineDone: done };
  const next = grantBoost(s, 'task', now);
  return { state: { ...next, tasks }, claimed: true };
}

/**
 * 自动点亮达成的成就（纯荣誉，无奖励）。
 * @returns {{state:object, newlyUnlocked:string[]}}
 */
export function unlockAchievements(state) {
  const newly = [];
  const achievements = { ...state.achievements };
  for (const a of CONFIG.achievements) {
    if (!achievements[a.id] && metricValue(state, a.metric) >= a.target) {
      achievements[a.id] = true;
      newly.push(a.id);
    }
  }
  return { state: { ...state, achievements }, newlyUnlocked: newly };
}

// ============================================================
// 藏品图鉴与分享文案（票 05）
// ============================================================

/**
 * 把已激活池子（已购 >0）的基因组合与变异收录进藏品图鉴（幂等）。
 */
export function collectGenes(state) {
  const combos = { ...state.collected.combos };
  const mutations = { ...state.collected.mutations };
  for (let i = 0; i < CONFIG.pools.length; i++) {
    if (state.pools[i] <= 0) continue;
    const g = state.genes[i];
    combos[`${g.coat},${g.size}`] = true;
    if (g.mutation != null) mutations[String(g.mutation)] = true;
  }
  return { ...state, collected: { combos, mutations } };
}

/** 藏品图鉴进度：形态（进化解锁）+ 基因组合 + 变异。 */
export function collectionProgress(state) {
  const formsOwned = state.evolutionLevel + 1;
  const combosOwned = Object.keys(state.collected.combos).length;
  const mutationsOwned = Object.keys(state.collected.mutations).length;
  const totalForms = CONFIG.evolution.forms.kimi.length;
  const totalCombos = CONFIG.genes.coats.kimi.length * CONFIG.genes.sizes.length;
  const totalMutations = CONFIG.genes.mutations.length;
  const total = totalForms + totalCombos + totalMutations;
  const owned = formsOwned + combosOwned + mutationsOwned;
  return { owned, total, complete: owned >= total };
}

/** 大数格式化：万 / 亿 / 万亿 / 亿亿 / 万亿亿 / 亿亿亿。 */
export function formatCount(n) {
  if (!isFinite(n)) return '0';
  const units = ['', '万', '亿', '万亿', '亿亿', '万亿亿', '亿亿亿'];
  let u = 0;
  let v = n;
  while (v >= 1e4 && u < units.length - 1) { v /= 1e4; u++; }
  return (u === 0 ? Math.floor(v).toLocaleString() : v.toFixed(2) + units[u]);
}

/**
 * 生成分享文案（双版本：阵营挑衅 / 战果炫耀）。
 */
export function shareText(state, variant = 'flaunt') {
  const f = CONFIG.factions[state.faction];
  const rival = state.faction === 'kimi' ? CONFIG.factions.dog.name : CONFIG.factions.kimi.name;
  const link = CONFIG.share.link;
  const count = formatCount(state.totalProduced);
  const form = formName(state);
  const p = collectionProgress(state);
  if (variant === 'taunt') {
    return `我的${f.name}养出了 ${count} 只（${form}），${rival}谁敢应战？来应援补给站比一比 → ${link}`;
  }
  return `我把小动物养到 ${form}（${count} 只），图鉴 ${p.owned}/${p.total}，谁与争锋 → ${link}`;
}

// ============================================================
// 商店（票 06 前扩展）：全局倍率 / 池子升级 / 临时 buff / 节日主题
// ============================================================

/** 全局产出倍率当前升级成本。 */
export function shopMultiplierCost(state) {
  return Math.floor(CONFIG.shop.multiplier.baseCost * Math.pow(CONFIG.shop.multiplier.costGrowth, state.shop.multLevel));
}

/** 购买一级全局产出倍率（永久 ×base）。 */
export function buyMultiplier(state) {
  const cost = shopMultiplierCost(state);
  if (state.count < cost) return state;
  return { ...state, count: state.count - cost, shop: { ...state.shop, multLevel: state.shop.multLevel + 1 } };
}

/** 喂一口狂暴升级当前成本（5000 万 × 10^n）。 */
export function raptureUpgradeCost(state) {
  return Math.floor(CONFIG.shop.raptureUpgrade.baseCost * Math.pow(CONFIG.shop.raptureUpgrade.costGrowth, state.shop.raptureLevel));
}

/** 购买一级喂一口狂暴升级（触发率 ×rateFactor，封顶 maxLevel 级）。 */
export function buyRaptureUpgrade(state) {
  const cost = raptureUpgradeCost(state);
  if (state.count < cost) return state;
  if (state.shop.raptureLevel >= CONFIG.rapture.maxLevel) return state; // 已满级
  return { ...state, count: state.count - cost, shop: { ...state.shop, raptureLevel: state.shop.raptureLevel + 1 } };
}

/** 某池子升级当前成本（随该池基础成本缩放，越高级的池子升级越贵）。 */
export function shopPoolUpgradeCost(state, index) {
  const pool = CONFIG.pools[index];
  if (!pool) return Infinity;
  return Math.floor(pool.cost * CONFIG.shop.poolUpgrade.costFactor * Math.pow(CONFIG.shop.poolUpgrade.costGrowth, state.shop.poolUpgrades[index]));
}

/** 购买某池子升级（该池产出 ×factor，永久）。 */
export function buyPoolUpgrade(state, index) {
  const cost = shopPoolUpgradeCost(state, index);
  if (state.count < cost) return state;
  const poolUpgrades = [...state.shop.poolUpgrades];
  poolUpgrades[index]++;
  return { ...state, count: state.count - cost, shop: { ...state.shop, poolUpgrades } };
}

/** 用动物数量购买商店加速卡（×2 持续 10 分钟，未生效则直接开启，否则存进背包）。 */
export function buyBuff(state, now = Date.now()) {
  const cost = CONFIG.shop.buff.cost;
  if (state.count < cost) return state;
  const next = grantBoost(state, 'shop', now);
  return { ...next, count: state.count - cost };
}

/** 切换节日主题（含产出加成 bonus）。 */
export function setTheme(state, themeId) {
  if (!CONFIG.shop.themes.some((t) => t.id === themeId)) return state;
  return { ...state, shop: { ...state.shop, theme: themeId } };
}

/** 购买节日道具（永久产出加成 bonus，花费动物数量）。 */
export function buyThemeItem(state, themeId) {
  const theme = CONFIG.shop.themes.find((t) => t.id === themeId);
  if (!theme || !theme.item) return state;
  if (state.shop.themeItems[themeId]) return state; // 已购买
  if (state.count < theme.item.cost) return state;
  return {
    ...state,
    count: state.count - theme.item.cost,
    shop: { ...state.shop, themeItems: { ...state.shop.themeItems, [themeId]: true } },
  };
}

// ============================================================
// 远端运营配置（site_config 表 → CONFIG 覆盖，见 docs/site-config-schema.sql）
// ============================================================

/**
 * 把远端 site_config 行（[{key, value}]）覆盖到本地 CONFIG 对象。
 * 纯函数：只覆盖白名单 key 且值合法（featured/news 为数组、board/share 为对象、
 * collection_url 为非空字符串）；缺 key / 非法值一律保留本地默认。
 * @param {object} cfg 本地 CONFIG（会被就地修改，引用可变对象）
 * @param {Array<{key:string, value:any}>} rows 远端配置行
 * @returns {object} 返回同一 cfg（便于链式/断言）
 */
export function applySiteConfig(cfg, rows) {
  if (!cfg || !Array.isArray(rows)) return cfg;
  for (const row of rows) {
    if (!row || typeof row.key !== 'string') continue;
    const v = row.value;
    switch (row.key) {
      case 'featured':
        if (Array.isArray(v) && v.length) cfg.supply.featured = v;
        break;
      case 'board':
        if (v && typeof v === 'object' && !Array.isArray(v)) cfg.board = { ...cfg.board, ...v };
        break;
      case 'share':
        if (v && typeof v === 'object' && !Array.isArray(v)) cfg.share = { ...cfg.share, ...v };
        break;
      case 'collection_url':
        if (typeof v === 'string' && v) cfg.supply.collectionUrl = v;
        break;
      case 'news':
        if (Array.isArray(v) && v.length) cfg.news = v;
        break;
      default: break;
    }
  }
  return cfg;
}
