import { describe, it, expect } from 'vitest';
import { CONFIG } from './config.js';
import {
  createGame, evolutionMultiplier, evolutionLevelFor, formName,
  coatName, sizeName, mutationName, geneLabel, populationByTrait,
  secondsProduction, feed, poolCost, bulkCost, buyPool, buyPoolBulk, produce, offlineGains, isCleared, isPoolRevealed,
  boostMultiplier, activeBoostChannels, claimBoost, useCard, supplyRemaining, pickSupplyTarget, toLocalDateKey,
  rolloverDaily, metricValue, claimTask, unlockAchievements,
  collectGenes, collectionProgress, formatCount, shareText,
  globalShopMultiplier, shopMultiplierCost, buyMultiplier, raptureMultiplier, raptureRate, raptureUpgradeCost, buyRaptureUpgrade, useClicker, shopPoolUpgradeCost, buyPoolUpgrade, buyBuff, setTheme,
  bonusMultiplier, buyThemeItem,
} from './core.js';

describe('createGame', () => {
  it('初始状态：数量 0、累计 0、池子全 0、进化 0', () => {
    const s = createGame({ faction: 'kimi' });
    expect(s.count).toBe(0);
    expect(s.totalProduced).toBe(0);
    expect(s.pools).toHaveLength(CONFIG.pools.length);
    expect(s.pools.every((n) => n === 0)).toBe(true);
    expect(s.evolutionLevel).toBe(0);
  });
});

describe('进化等级与倍率', () => {
  it('每跨 10× 升一级，封顶形态数-1', () => {
    expect(evolutionLevelFor(0)).toBe(0);
    expect(evolutionLevelFor(9)).toBe(0);
    expect(evolutionLevelFor(10)).toBe(1);
    expect(evolutionLevelFor(99)).toBe(1);
    expect(evolutionLevelFor(100)).toBe(2);
    expect(evolutionLevelFor(1e11)).toBe(11); // 千亿
    expect(evolutionLevelFor(1e12)).toBe(12); // 万亿
    expect(evolutionLevelFor(1e24)).toBe(24); // 亿亿亿 = 最高形态
    expect(evolutionLevelFor(1e25)).toBe(24); // 封顶
  });

  it('进化倍率逐级 ×multiplier', () => {
    expect(evolutionMultiplier(0)).toBe(1);
    expect(evolutionMultiplier(1)).toBe(CONFIG.evolution.multiplier);
    expect(evolutionMultiplier(2)).toBe(CONFIG.evolution.multiplier ** 2);
  });

  it('formName 按阵营与等级取名，最终形态为亿亿亿', () => {
    expect(formName(createGame({ faction: 'kimi' }))).toBe('奶团基米');
    expect(formName(createGame({ faction: 'dog' }))).toBe('奶团哈基汪');
    const mid = { ...createGame({ faction: 'kimi' }), evolutionLevel: 11 };
    expect(formName(mid)).toBe('千亿基米');
    const top = { ...createGame({ faction: 'kimi' }), evolutionLevel: 24 };
    expect(formName(top)).toBe('亿亿亿基米');
    expect(formName({ ...createGame({ faction: 'dog' }), evolutionLevel: 24 })).toBe('亿亿亿汪');
  });
});

describe('喂食', () => {
  it('喂一口产一窝，数量与累计同步上涨', () => {
    const s = createGame({ faction: 'kimi' });
    const next = feed(s, Date.now(), () => 1); // rng=1 保证不触发狂暴
    expect(next.count).toBe(CONFIG.feed.base);
    expect(next.totalProduced).toBe(CONFIG.feed.base);
  });

  it('喂食随进化倍率放大', () => {
    const s = { ...createGame({ faction: 'kimi' }), evolutionLevel: 1 };
    const next = feed(s, Date.now(), () => 1);
    expect(next.count).toBe(CONFIG.feed.base * CONFIG.evolution.multiplier);
  });

  it('有产能后喂食跟随当前秒产（×clickSeconds），保底只在无产能时生效', () => {
    const NOW = 1755235200000;
    const s = { ...createGame({ faction: 'kimi' }) };
    s.pools[2] = 1; // 房子 4/s > 保底 1
    const next = feed(s, NOW, () => 1);
    expect(next.count - s.count).toBeCloseTo(CONFIG.pools[2].prod * CONFIG.feed.clickSeconds);
  });
});

describe('生产池子', () => {
  it('poolCost 基础成本随已购数 ×1.15 递增', () => {
    const s = createGame();
    expect(poolCost(s, 0)).toBe(CONFIG.pools[0].cost);
    const bought = { ...s, pools: s.pools.map((n, i) => (i === 0 ? 1 : n)) };
    expect(poolCost(bought, 0)).toBe(Math.floor(CONFIG.pools[0].cost * CONFIG.poolCostGrowth));
  });

  it('buyPool 钱够则扣款并 +1，钱不够原样返回', () => {
    const poor = createGame();
    expect(buyPool(poor, 0)).toBe(poor); // 0 元买不起
    const rich = { ...createGame(), count: 100 };
    const next = buyPool(rich, 0);
    expect(next.pools[0]).toBe(1);
    expect(next.count).toBe(100 - CONFIG.pools[0].cost);
  });

  it('bulkCost 按等比求和计算一次性买 N 个的总成本', () => {
    const s = createGame();
    // 买 1 个 = 基础成本；买 2 个 = 基础 + 基础×1.15
    expect(bulkCost(s, 0, 1)).toBe(Math.floor(CONFIG.pools[0].cost));
    expect(bulkCost(s, 0, 2)).toBe(Math.floor(CONFIG.pools[0].cost * (1 + CONFIG.poolCostGrowth)));
  });

  it('buyPoolBulk 一次买 N 个，钱不够原样返回', () => {
    const s = createGame();
    const rich = { ...s, count: 1e9 };
    const next = buyPoolBulk(rich, 0, 10);
    expect(next.pools[0]).toBe(10);
    const poor = { ...createGame(), count: 1 };
    expect(buyPoolBulk(poor, 0, 10)).toBe(poor);
  });

  it('secondsProduction = Σ(已购×秒产) × 进化倍率', () => {
    const s = createGame();
    s.pools[1] = 1; // 猫狗窝
    expect(secondsProduction(s)).toBe(CONFIG.pools[1].prod);
    s.evolutionLevel = 1;
    expect(secondsProduction(s)).toBeCloseTo(CONFIG.pools[1].prod * CONFIG.evolution.multiplier);
  });

  it('isPoolRevealed 第 0 池永远可见，其余需累计养出达其成本 60%', () => {
    const s = createGame();
    expect(isPoolRevealed(s, 0)).toBe(true); // 下水道永远可见
    expect(isPoolRevealed(s, 1)).toBe(false); // 猫狗窝成本 100，60% = 60，累计 0 不显示
    const grown = { ...s, totalProduced: 60 };
    expect(isPoolRevealed(grown, 1)).toBe(true); // 累计 60 正好达标
    expect(isPoolRevealed(grown, 2)).toBe(false); // 房子成本 1000，60% = 600
    const richer = { ...s, totalProduced: 1e15 };
    expect(isPoolRevealed(richer, 12)).toBe(true); // 时空位面成本 1.2e15，60% = 7.2e14
  });
});

describe('挂机产出与通关', () => {
  it('produce 结算 seconds 秒，数量/累计/进化同步', () => {
    const s = createGame();
    s.pools[1] = 1;
    const next = produce(s, 100);
    expect(next.count).toBe(CONFIG.pools[1].prod * 100);
    expect(next.totalProduced).toBe(CONFIG.pools[1].prod * 100);
  });

  it('离线收益上限 8 小时，收益按秒产 × 上限时长结算', () => {
    const s = createGame();
    s.pools[0] = 1;
    const lastSeen = 0;
    const now = (8 * 3600 + 600) * 1000; // 8h10m，超上限
    const r = offlineGains(s, lastSeen, now);
    expect(r.seconds).toBe(8 * 3600);
    expect(r.gains).toBeCloseTo(CONFIG.pools[0].prod * 8 * 3600);
  });

  it('isCleared 累计达通关目标判定通关', () => {
    const notCleared = { ...createGame(), totalProduced: CONFIG.clear.target / 2 };
    expect(isCleared(notCleared)).toBe(false);
    const cleared = { ...createGame(), totalProduced: CONFIG.clear.target };
    expect(isCleared(cleared)).toBe(true);
  });
});

describe('基因池 / 寿命 / 交配 / 遗传', () => {
  const activePool0 = () => {
    let s = createGame({ faction: 'kimi' });
    s = { ...s, count: 100 };
    return buyPool(s, 0);
  };

  it('createGame 初始化每池基因池与交配进度', () => {
    const s = createGame();
    expect(s.genes).toHaveLength(CONFIG.pools.length);
    expect(s.mateProgress).toHaveLength(CONFIG.pools.length);
    expect(s.genes[0]).toEqual({ coat: 0, size: 0, mutation: null });
  });

  it('寿命周期走完触发交配，成功（rng=0）推进毛色', () => {
    const s = activePool0();
    const next = produce(s, CONFIG.genes.lifespanSeconds, () => 0);
    expect(next.genes[0].coat).toBe(1);
  });

  it('交配失败（rng=0.9）基因不变', () => {
    const s = activePool0();
    const next = produce(s, CONFIG.genes.lifespanSeconds, () => 0.9);
    expect(next.genes[0]).toEqual({ coat: 0, size: 0, mutation: null });
  });

  it('交配触发变异（随机替换变异标记）', () => {
    const s = activePool0();
    const seq = [0.1, 0.99, 0.5]; // 成功 + 变异字段 + 变异索引 3
    let i = 0;
    const next = produce(s, CONFIG.genes.lifespanSeconds, () => seq[i++]);
    expect(next.genes[0].mutation).toBe(3);
  });

  it('离线时长按寿命周期折算多次交配', () => {
    const s = activePool0();
    const next = produce(s, CONFIG.genes.lifespanSeconds * 3, () => 0);
    expect(next.genes[0].coat).toBe(3);
    expect(next.mateProgress[0]).toBeLessThan(CONFIG.genes.lifespanSeconds);
  });

  it('毛色升到顶后不再上涨', () => {
    let s = activePool0();
    s = { ...s, genes: s.genes.map((g, i) => (i === 0 ? { ...g, coat: 7 } : g)) };
    const next = produce(s, CONFIG.genes.lifespanSeconds, () => 0);
    expect(next.genes[0].coat).toBe(7);
  });

  it('geneLabel 输出可读基因描述', () => {
    const s = createGame({ faction: 'kimi' });
    s.genes[0] = { coat: 1, size: 2, mutation: 3 };
    expect(geneLabel(s, 0)).toBe('奶牛·大型·机械义肢');
    expect(coatName(s, s.genes[0])).toBe('奶牛');
    expect(sizeName(s.genes[0])).toBe('大型');
    expect(mutationName(s.genes[0])).toBe('机械义肢');
  });

  it('populationByTrait 按每池当前性状聚合累计产仔、降序', () => {
    let s = createGame({ faction: 'kimi' });
    s.pools[0] = 1;
    s.pools[1] = 1;
    s.poolProduced = [100, 250, ...Array(CONFIG.pools.length - 2).fill(0)];
    s.genes[0] = { coat: 0, size: 0, mutation: null }; // 橘·迷你
    s.genes[1] = { coat: 1, size: 0, mutation: null }; // 奶牛·迷你
    const pop = populationByTrait(s);
    expect(pop).toHaveLength(2);
    expect(pop[0].label).toBe('奶牛·迷你');
    expect(pop[0].count).toBe(250);
    expect(pop[1].label).toBe('橘·迷你');
    expect(pop[1].count).toBe(100);
  });

  it('populationByTrait 同一性状的多个池子数量相加', () => {
    const s = createGame({ faction: 'kimi' });
    s.pools[0] = 1;
    s.pools[2] = 1;
    s.poolProduced = [30, 0, 70, ...Array(CONFIG.pools.length - 3).fill(0)];
    const pop = populationByTrait(s);
    expect(pop).toHaveLength(1);
    expect(pop[0].count).toBe(100);
  });
});

describe('加速道具与每日补给（票 03）', () => {
  const NOW = 1755235200000; // 固定时间戳

  it('toLocalDateKey 输出本地 YYYY-MM-DD', () => {
    expect(toLocalDateKey(new Date(2026, 7, 15, 12, 0, 0))).toBe('2026-08-15');
  });

  it('boostMultiplier 三种加速各自 ×2，可同时叠加最高 8×', () => {
    const s = createGame();
    expect(boostMultiplier(s, NOW)).toBe(1);
    expect(boostMultiplier({ ...s, boost: { ...s.boost, video: { expiresAt: NOW + 1000 } } }, NOW)).toBe(2);
    const all3 = {
      ...s,
      boost: { task: { expiresAt: NOW + 1000 }, video: { expiresAt: NOW + 1000 }, shop: { expiresAt: NOW + 1000 } },
    };
    expect(boostMultiplier(all3, NOW)).toBe(8);
    expect(boostMultiplier({ ...s, boost: { ...s.boost, video: { expiresAt: NOW - 1 } } }, NOW)).toBe(1);
  });

  it('activeBoostChannels 统计当前同时生效的加速状态数', () => {
    const s = createGame();
    expect(activeBoostChannels(s, NOW)).toBe(0);
    const two = { ...s, boost: { ...s.boost, task: { expiresAt: NOW + 1000 }, shop: { expiresAt: NOW + 1000 } } };
    expect(activeBoostChannels(two, NOW)).toBe(2);
  });

  it('claimBoost 看视频加速未生效则开启 10 分钟 ×2，已生效则发卡进背包', () => {
    let r = claimBoost(createGame(), NOW);
    expect(r.granted).toBe(true);
    expect(r.active).toBe(true);
    expect(r.cards).toBe(0);
    expect(r.state.boost.video.expiresAt).toBe(NOW + CONFIG.boost.video.durationSeconds * 1000);
    r = claimBoost(r.state, NOW);
    expect(r.active).toBe(true);
    expect(r.cards).toBe(1); // 已在生效中 → 存背包
    expect(r.state.boost.video.expiresAt).toBe(NOW + CONFIG.boost.video.durationSeconds * 1000); // 时长不累加
  });

  it('useCard 从背包主动使用加速卡，每个词条同时只能生效一张', () => {
    const withCards = { ...createGame(), cards: { task: 2, video: 0, shop: 1 } };
    let s = useCard(withCards, 'task', NOW);
    expect(s.boost.task.expiresAt).toBe(NOW + CONFIG.boost.task.durationSeconds * 1000);
    expect(s.cards.task).toBe(1);
    expect(useCard(s, 'task', NOW)).toBe(s); // 已生效，不能再用第二张
    s = useCard(s, 'shop', NOW); // 商店词条独立，可同时生效
    expect(s.boost.shop.expiresAt).toBe(NOW + CONFIG.boost.shop.durationSeconds * 1000);
    expect(s.cards.shop).toBe(0);
    expect(boostMultiplier(s, NOW)).toBe(4); // 任务 ×2 × 商店 ×2
    expect(useCard(s, 'video', NOW)).toBe(s); // 没有卡
  });

  it('三种加速可同时存在（×8），叠加峰值计入成就', () => {
    let s = { ...createGame(), count: 1e9 };
    for (let i = 0; i < 100; i++) s = feed(s, NOW);   // 喂满 100 次（主线任务达标）
    s = buyBuff(s, NOW);                              // 商店加速 ×2
    s = claimBoost(s, NOW).state;                     // 看视频加速 ×2
    s = claimTask(s, 'm-click-100', NOW).state;       // 任务加速 ×2
    expect(boostMultiplier(s, NOW)).toBe(8);
    expect(activeBoostChannels(s, NOW)).toBe(3);
    s.pools[0] = 1;
    s = produce(s, 1, () => 0, NOW);
    expect(s.stats.maxActiveChannels).toBe(3);
  });

  it('每日软上限：额度内发放，超出只计数不发放', () => {
    let state = createGame();
    for (let i = 0; i < CONFIG.supply.dailyLimit; i++) state = claimBoost(state, NOW).state;
    const over = claimBoost(state, NOW);
    expect(over.granted).toBe(false);
    expect(over.state.supply.used).toBe(CONFIG.supply.dailyLimit + 1);
  });

  it('跨天自动重置配额', () => {
    let state = claimBoost(createGame(), NOW).state;
    const nextDay = NOW + 24 * 3600 * 1000;
    const r = claimBoost(state, nextDay);
    expect(r.granted).toBe(true);
    expect(r.state.supply.used).toBe(1);
  });

  it('secondsProduction 计入加速倍速', () => {
    const s = createGame();
    s.pools[1] = 1;
    expect(secondsProduction({ ...s, boost: { ...s.boost, video: { expiresAt: NOW + 1000 } } }, NOW)).toBeCloseTo(CONFIG.pools[1].prod * 2);
  });

  it('pickSupplyTarget 在作品与主页之间随机（rng 命中两端）', () => {
    const work = pickSupplyTarget(() => 0);
    expect(work.kind).toBe('work');
    expect(work.url).toMatch(/^https:\/\/www\.bilibili\.com\/video\/BV/);
    const home = pickSupplyTarget(() => 0.999);
    expect(home.kind).toBe('home');
    expect(home.url).toBe(CONFIG.supply.collectionUrl);
  });

  it('supplyRemaining 反映剩余额度', () => {
    const s = createGame();
    expect(supplyRemaining(s, NOW)).toBe(CONFIG.supply.dailyLimit);
    expect(supplyRemaining(claimBoost(s, NOW).state, NOW)).toBe(CONFIG.supply.dailyLimit - 1);
  });
});

describe('任务与成就（票 04）', () => {
  const NOW = 1755235200000;

  it('feed 累计点击与每日喂食统计', () => {
    let s = feed(createGame(), NOW);
    expect(s.stats.clicks).toBe(1);
    expect(s.stats.dailyFeeds).toBe(1);
    s = feed(s, NOW);
    expect(s.stats.clicks).toBe(2);
    expect(s.stats.dailyFeeds).toBe(2);
  });

  it('claimBoost 累计每日领加速次数与总次数', () => {
    let r = claimBoost(createGame(), NOW);
    expect(r.state.stats.dailyBoosts).toBe(1);
    expect(r.state.stats.totalBoosts).toBe(1);
    r = claimBoost(r.state, NOW);
    expect(r.state.stats.totalBoosts).toBe(2);
  });

  it('rolloverDaily 跨天重置每日统计与每日任务', () => {
    let s = feed(createGame(), NOW);
    s = { ...s, tasks: { ...s.tasks, dailyDone: { 'd-feed-10': true } } };
    const next = rolloverDaily(s, NOW + 24 * 3600 * 1000);
    expect(next.stats.dailyFeeds).toBe(0);
    expect(next.stats.dailyBoosts).toBe(0);
    expect(next.tasks.dailyDone).toEqual({});
    expect(next.stats.clicks).toBe(1); // 累计不清
  });

  it('metricValue 返回对应指标', () => {
    const s = createGame();
    s.pools[0] = 1;
    s.pools[1] = 2;
    expect(metricValue(s, 'poolsOwned')).toBe(3);
    expect(metricValue(s, 'totalProduced')).toBe(0);
  });

  it('claimTask 进度不足不发放，达标发放任务加速卡并标记已领取', () => {
    let state = createGame();
    for (let i = 0; i < 5; i++) state = feed(state, NOW);
    expect(claimTask(state, 'd-feed-10', NOW).claimed).toBe(false);
    for (let i = 0; i < 5; i++) state = feed(state, NOW);
    const r = claimTask(state, 'd-feed-10', NOW);
    expect(r.claimed).toBe(true);
    expect(r.state.boost.task.expiresAt).toBe(NOW + CONFIG.boost.task.durationSeconds * 1000); // 任务加速卡直接开启
    expect(r.state.boost.video.expiresAt).toBe(0); // 不影响看视频
    expect(r.state.tasks.dailyDone['d-feed-10']).toBe(true);
    expect(claimTask(r.state, 'd-feed-10', NOW).claimed).toBe(false); // 已领取
  });

  it('主线任务一次性领取，累计进度不清', () => {
    let state = createGame();
    for (let i = 0; i < 100; i++) state = feed(state, NOW);
    const r = claimTask(state, 'm-click-100', NOW);
    expect(r.claimed).toBe(true);
    expect(r.state.tasks.mainlineDone['m-click-100']).toBe(true);
  });

  it('unlockAchievements 达标自动点亮并返回新增，不重复', () => {
    const none = unlockAchievements(createGame());
    expect(none.newlyUnlocked).toHaveLength(0);
    const s = { ...createGame(), totalProduced: 2000 };
    const r = unlockAchievements(s);
    expect(r.state.achievements['a-prod-1e3']).toBe(true);
    expect(r.newlyUnlocked).toContain('a-prod-1e3');
    expect(unlockAchievements(r.state).newlyUnlocked).toHaveLength(0);
  });
});

describe('藏品图鉴与分享（票 05）', () => {
  it('formatCount 万/亿/万亿/亿亿/亿亿亿格式化', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(1000)).toBe('1,000');
    expect(formatCount(12345)).toBe('1.23万');
    expect(formatCount(1e8)).toBe('1.00亿');
    expect(formatCount(1e11)).toBe('1000.00亿');
    expect(formatCount(1e12)).toBe('1.00万亿');
    expect(formatCount(1e16)).toBe('1.00亿亿');
    expect(formatCount(1e20)).toBe('1.00万亿亿');
    expect(formatCount(1e24)).toBe('1.00亿亿亿');
  });

  it('buyPool 收录初始基因组合，交配出变异后收录变异', () => {
    let s = createGame();
    s = { ...s, count: 100 };
    s = buyPool(s, 0);
    expect(s.collected.combos['0,0']).toBe(true);
    // 手动放一个变异基因并 collectGenes
    s = { ...s, genes: s.genes.map((g, i) => (i === 0 ? { ...g, mutation: 2 } : g)) };
    s = collectGenes(s);
    expect(s.collected.mutations['2']).toBe(true);
  });

  it('collectionProgress 统计形态+基因组合+变异，总数 63', () => {
    const s = createGame();
    const p = collectionProgress(s);
    expect(p.owned).toBe(1); // 初始只有形态 1（奶团）
    expect(p.total).toBe(25 + 8 * 4 + 6); // 25 形态 + 32 组合 + 6 变异
    expect(p.complete).toBe(false);
  });

  it('shareText 两种变体含数量/阵营/图鉴/链接', () => {
    const s = { ...createGame({ faction: 'kimi' }), totalProduced: 12345 };
    const t = shareText(s, 'taunt');
    expect(t).toContain('基米队');
    expect(t).toContain('大狗队');
    expect(t).toContain('1.23万');
    expect(t).toContain(CONFIG.share.link);
    const fl = shareText(s, 'flaunt');
    expect(fl).toContain('图鉴');
    expect(fl).toContain(CONFIG.share.link);
  });
});

describe('商店（票 06 前扩展）', () => {
  const NOW = 1755235200000;

  it('globalShopMultiplier 每级 ×base', () => {
    const s = createGame();
    expect(globalShopMultiplier(s)).toBe(1);
    const lv2 = { ...s, shop: { ...s.shop, multLevel: 2 } };
    expect(globalShopMultiplier(lv2)).toBe(CONFIG.shop.multiplier.base ** 2);
  });

  it('buyMultiplier 钱够升级、钱不够原样返回', () => {
    const poor = createGame();
    expect(buyMultiplier(poor)).toBe(poor);
    const rich = { ...createGame(), count: 1e9 };
    const next = buyMultiplier(rich);
    expect(next.shop.multLevel).toBe(1);
    expect(next.count).toBe(1e9 - shopMultiplierCost(rich));
  });

  it('buyPoolUpgrade 升级后该池产出翻倍', () => {
    let s = { ...createGame(), count: 1e9 };
    s = buyPoolUpgrade(s, 0);
    expect(s.shop.poolUpgrades[0]).toBe(1);
    s.pools[0] = 1;
    // 下水道基础 0.1，升级后 ×2 = 0.2
    expect(secondsProduction(s)).toBeCloseTo(CONFIG.pools[0].prod * CONFIG.shop.poolUpgrade.factor);
  });

  it('buyRaptureUpgrade 升级狂暴触发率，成本 5000万×10^n，满级封顶', () => {
    const poor = createGame();
    expect(buyRaptureUpgrade(poor)).toBe(poor); // 钱不够原样返回
    expect(raptureUpgradeCost(poor)).toBe(CONFIG.shop.raptureUpgrade.baseCost);
    expect(raptureRate(poor)).toBeCloseTo(0.001); // L0 基础 0.1%
    let s = { ...createGame(), count: 1e12 };
    s = buyRaptureUpgrade(s);
    expect(s.shop.raptureLevel).toBe(1);
    expect(raptureRate(s)).toBeCloseTo(0.002); // L1 0.2%
    expect(raptureUpgradeCost(s)).toBe(CONFIG.shop.raptureUpgrade.baseCost * CONFIG.shop.raptureUpgrade.costGrowth);
    for (let i = 0; i < CONFIG.rapture.maxLevel + 3; i++) s = buyRaptureUpgrade({ ...s, count: 1e15 });
    expect(s.shop.raptureLevel).toBe(CONFIG.rapture.maxLevel); // 满级封顶
    expect(raptureRate(s)).toBeCloseTo(0.001 * Math.pow(2, CONFIG.rapture.maxLevel)); // 3.2%
  });

  it('喂一口触发狂暴：×7 生效 30s，结束后冷却 120s 才可再触发', () => {
    const NOW = 1755235200000;
    let s = createGame();
    // rng=0 必触发
    const raged = feed(s, NOW, () => 0);
    expect(raged.rapture.activeUntil).toBe(NOW + CONFIG.rapture.durationSeconds * 1000);
    expect(raged.rapture.readyAt).toBe(NOW + (CONFIG.rapture.durationSeconds + CONFIG.rapture.cooldownSeconds) * 1000);
    expect(raptureMultiplier(raged, NOW)).toBe(CONFIG.rapture.multiplier);
    expect(raptureMultiplier(raged, NOW + 1000)).toBe(CONFIG.rapture.multiplier); // 生效中
    expect(raptureMultiplier(raged, NOW + CONFIG.rapture.durationSeconds * 1000 + 1)).toBe(1); // 结束后恢复
    // 狂暴生效中再点不重新触发
    const during = feed(raged, NOW + 1000, () => 0);
    expect(during.rapture.activeUntil).toBe(raged.rapture.activeUntil);
    // 冷却期内 rng=0 也不触发
    const cooling = feed(raged, NOW + CONFIG.rapture.durationSeconds * 1000 + 1000, () => 0);
    expect(cooling.rapture.activeUntil).toBe(raged.rapture.activeUntil);
    // 冷却结束后可再次触发
    const after = feed(raged, NOW + (CONFIG.rapture.durationSeconds + CONFIG.rapture.cooldownSeconds) * 1000 + 1, () => 0);
    expect(after.rapture.activeUntil).toBeGreaterThan(raged.rapture.activeUntil);
  });

  it('useClicker 消耗连点器并开启 60 秒；生效中不叠加', () => {
    const NOW = 1755235200000;
    let s = createGame();
    expect(useClicker(s, NOW)).toBe(s); // 没有连点器
    s = { ...s, clicker: { count: 2, activeUntil: 0 } };
    const on = useClicker(s, NOW);
    expect(on.clicker.count).toBe(1);
    expect(on.clicker.activeUntil).toBe(NOW + CONFIG.clicker.durationSeconds * 1000);
    expect(useClicker(on, NOW)).toBe(on); // 已生效不叠加
  });

  it('buyBuff 用动物数量购买商店加速卡（×2 持续 10 分钟，生效中则存背包）', () => {
    const rich = { ...createGame(), count: 1e9 };
    const next = buyBuff(rich, NOW);
    expect(next.boost.shop.expiresAt).toBe(NOW + CONFIG.boost.shop.durationSeconds * 1000);
    expect(next.count).toBe(1e9 - CONFIG.shop.buff.cost);
    const again = buyBuff(next, NOW); // 已生效 → 存背包
    expect(again.cards.shop).toBe(1);
    expect(again.boost.shop.expiresAt).toBe(NOW + CONFIG.boost.shop.durationSeconds * 1000);
  });

  it('setTheme 切换节日主题，非法主题不变', () => {
    const s = setTheme(createGame(), 'qixi');
    expect(s.shop.theme).toBe('qixi');
    expect(setTheme(s, 'nope').shop.theme).toBe('qixi');
  });

  it('bonusMultiplier = 当前主题加成 × 已购节日道具加成', () => {
    const s = createGame();
    expect(bonusMultiplier(s)).toBe(1); // 日常无加成
    const qixi = setTheme(s, 'qixi');
    expect(bonusMultiplier(qixi)).toBeCloseTo(1.1);
    // 购买七夕道具后：主题 1.1 × 道具 1.2
    const bought = buyThemeItem({ ...qixi, count: 1e9 }, 'qixi');
    expect(bonusMultiplier(bought)).toBeCloseTo(1.1 * 1.2);
  });

  it('buyThemeItem 花费动物数量并永久生效，重复购买不重复扣', () => {
    const s = { ...createGame(), count: 1e9 };
    const bought = buyThemeItem(s, 'qixi');
    expect(bought.shop.themeItems['qixi']).toBe(true);
    expect(bought.count).toBe(1e9 - CONFIG.shop.themes.find((t) => t.id === 'qixi').item.cost);
    expect(buyThemeItem(bought, 'qixi')).toBe(bought); // 已购买不再扣
  });
});
