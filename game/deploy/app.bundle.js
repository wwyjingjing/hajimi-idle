// 本文件由 build.mjs 自动生成，请勿手改。
// 修改 config.js / core.js / ui.js 后运行 `node build.mjs` 重新生成。
(function () {
"use strict";

// ============ config.js ============
// 单一配置模块：生产池子、进化形态、数值、文案、跳转目标全部集中于此。
// 数值目标：自然挂机到 1 亿亿亿（10²⁴）通关，可按需微调。

const CONFIG = {
  // localStorage 单 key 存档
  storageKey: 'hajimi-idle.save.v1',

  // 分享文案与晒图里的游戏入口链接（对外域名）
  share: {
    link: 'https://ea8df52043fd4121a761eed0a3e2c2c4.app.workbuddy.link/',
  },

  // 对邦看板入口 + 官方群
  board: {
    url: 'https://cb205ceeef4f4527a2515517d585571c.bj5.agentos-app.net',
    group: '765996335', // QQ 群号
  },

  // 排行榜 / 账号（Supabase，见 docs/adr/0002 与 docs/leaderboard-schema.sql）
  supabase: {
    url: 'https://sboaeygtztyubizypvrc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNib2FleWd0enR5dWJpenlwdnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODgxNzYsImV4cCI6MjEwMjM2NDE3Nn0.RXOOx7G34D32TK40UGNuE4bngdfdsZRSYJ8Fx0JaMoU',
  },
  leaderboard: {
    submitIntervalMs: 10 * 1000, // 每 10 秒上报一次（关页/切后台另即时上报）
    topN: 100,                   // 榜单前 100 名
  },

  // 通关目标：累计产仔达 10²⁴（1 亿亿亿）
  clear: {
    target: 1e24,
    evolutionBase: 10, // 每跨 10× 进化一级
  },

  // 喂一口：早期无产能时按基础产仔保底；有产能后 = 当前每秒产出 × clickSeconds
  feed: {
    base: 1,
    clickSeconds: 1, // 每点一口 = 当前秒产的多少秒（跟随产出成长）
  },

  // 喂一口狂暴：低概率触发，全局产出 ×7 持续 30 秒，结束后冷却 120 秒（不可常驻）
  rapture: {
    baseRate: 0.001,          // 基础触发率（每点一次喂食独立判定）
    multiplier: 7,            // 狂暴期间全局产出倍率
    durationSeconds: 30,      // 狂暴持续时间
    cooldownSeconds: 120,     // 狂暴结束后的冷却（期间不可触发）
    maxLevel: 5,              // 升级封顶（成本见 shop.raptureUpgrade）
  },

  // 连点器：看视频 50% 获得，开启后自动连点喂食
  clicker: {
    ratePerSecond: 5,         // 连点频率
    durationSeconds: 60,      // 单次开启持续
    videoChance: 0.5,         // 看视频获得概率
  },

  // 进化：全局质量，每级生产效率 ×multiplier；形态 = 进化等级对应形象（分阵营），共 25 级直通 1 亿亿亿
  evolution: {
    multiplier: 1.2,
    forms: {
      kimi: [
        '奶团基米', '幼基米', '顽皮基米', '少年基米', '成年基米', '肥宅基米', '机械基米', '天使基米', '恶魔基米', '星辰基米', '基米之神', '千亿基米',
        '军团基米', '星海基米', '银河基米', '位面基米', '次元基米', '多元基米', '永恒基米', '造物主基米', '天道基米', '混沌基米', '起源基米', '终焉基米', '亿亿亿基米',
      ],
      dog: [
        '奶团哈基汪', '幼汪', '顽皮汪', '少年汪', '成年汪', '肥宅汪', '机械汪', '天使汪', '恶魔汪', '星辰汪', '哈基汪之神', '千亿哈基汪',
        '军团汪', '星海汪', '银河汪', '位面汪', '次元汪', '多元汪', '永恒汪', '造物主汪', '天道汪', '混沌汪', '起源汪', '终焉汪', '亿亿亿汪',
      ],
    },
  },

  // 两大阵营：外观、配色、文案
  factions: {
    kimi: { name: '基米队', emoji: '🐱', tag: '养哈基米', theme: { bg: '#fff0f6', panel: '#fffafc', accent: '#ff6fa5', accentSoft: '#ffd9e6', text: '#7a2847' } },
    dog: { name: '大狗队', emoji: '🐶', tag: '养哈基汪', theme: { bg: '#eef4ff', panel: '#fbfdff', accent: '#4f7cff', accentSoft: '#dbe6ff', text: '#1d3a6e' } },
  },

  // 基因池：毛色/体型/变异三字段 + 寿命/交配规则
  genes: {
    mateSuccessRate: 0.5,   // 交配 50% 遗传成功
    lifespanSeconds: 120,   // 每个寿命周期时长（交配倒计时）
    coats: {
      kimi: ['橘', '奶牛', '狸花', '三花', '黑', '白', '蓝灰', '金渐层'],
      dog: ['柴', '金毛', '哈士奇', '柯基', '德牧', '斑点', '雪橇', '泰迪'],
    },
    sizes: ['迷你', '标准', '大型', '巨型'],
    mutations: ['异色瞳', '天使环', '恶魔角', '机械义肢', '星辰毛尖', '帝王冠'],
  },

  // 25 级生产池子（设施）：cost = 基础成本（每多买一个 ×poolCostGrowth），prod = 每秒产仔
  // 数值口径：前期快（前两个池子便宜且自动产出可观）、中期慢（国家~宇宙成本抬升拉长）、
  // 后期超慢（通关后仍有追求目标），整体约 7-10 天自然挂机到 1 亿亿亿（10²⁴）。
  pools: [
    { name: '下水道', cost: 10, prod: 0.1 },
    { name: '猫狗窝', cost: 100, prod: 0.8 },
    { name: '房子', cost: 1000, prod: 4 },
    { name: '庄园', cost: 15000, prod: 20 },
    { name: '村庄', cost: 250000, prod: 100 },
    { name: '城市', cost: 4e6, prod: 500 },
    { name: '大都会', cost: 6e7, prod: 2500 },
    { name: '国家', cost: 1e9, prod: 13000 },
    { name: '星球', cost: 1.5e10, prod: 70000 },
    { name: '星系', cost: 2.5e11, prod: 4e5 },
    { name: '宇宙', cost: 4e12, prod: 2.2e6 },
    { name: '克隆', cost: 7e13, prod: 1.2e7 },
    { name: '时空位面', cost: 1.2e15, prod: 7e7 },
    { name: '多元宇宙', cost: 2e16, prod: 4e8 },
    { name: '创世奇点', cost: 3e17, prod: 2.5e9 },
    { name: '无限法则', cost: 5e18, prod: 1.5e10 },
    { name: '起源之海', cost: 8e19, prod: 1e11 },
    { name: '至高位面', cost: 1.5e21, prod: 6e11 },
    { name: '无尽虚空', cost: 3e22, prod: 4e12 },
    { name: '亿亿亿圣殿', cost: 6e23, prod: 2.5e13 },
    { name: '永恒轮回', cost: 1.2e25, prod: 1.5e14 },
    { name: '创世神座', cost: 2.5e26, prod: 8e14 },
    { name: '至高神国', cost: 5e27, prod: 4e15 },
    { name: '虚空彼岸', cost: 1e29, prod: 2e16 },
    { name: '万物归一', cost: 2e30, prod: 1e17 },
  ],
  poolCostGrowth: 1.15, // 每多买一个，该池成本 ×1.15

  // 池子渐显：从低到高，累计养出达到某池子基础成本的 60% 才解锁显示（第 0 池永远可见）
  poolReveal: {
    ratio: 0.6,
  },

  // 离线收益：关页后按最后倍速 × 秒产结算，上限 8 小时
  offline: {
    maxSeconds: 8 * 3600,
  },

  // 三种加速状态（可同时存在，每词条同时只能生效一张）：各自 ×2，时长不同
  boost: {
    task: { durationSeconds: 30 * 60 },   // 任务加速卡：×2 持续 30 分钟
    video: { durationSeconds: 10 * 60 },  // 看视频加速：×2 持续 10 分钟
    shop: { durationSeconds: 10 * 60 },   // 商店加速：×2 持续 10 分钟
  },

  // 引流闭环："去看应援，领加速"（复用上一款已验证口径）
  supply: {
    dailyLimit: 20,     // 每日前 20 次点击给加速道具
    cooldownMs: 2500,   // "补给装载中"动画时长
    // 默认跳转：主办方 B 站空间（官方合集建成后换成 collectiondetail?sid=xxx）
    collectionUrl: 'https://space.bilibili.com/3546815827806287',
    // 今日推荐精选单篇（数据来自腾讯文档智能表「应援作品收集」，可用 fetch_supports.mjs 同步）
    featured: [
      { title: '【基狗对邦应援】SHOUT（呐喊）纯良应援教学', bvid: 'BV1Hd3J6dEfa', author: '吴吴又京京', ready: true },
      { title: '我是真的爱哈你', bvid: 'BV1ubgj69EFx', author: '樱栾阡陌', ready: true },
      { title: '一堆棍母【哈基杯应援】', bvid: 'BV13xuy6iEqA', author: 'Fishe_Le', ready: true },
      { title: '大狗叫：嚼叫', bvid: 'BV1MSuC6wEU6', author: 'SalvatoreSolace', ready: true },
      { title: '电棍，哈基米：直到大地颗变成一酸橙', bvid: 'BV1m7gH6iEzV', author: '爱布拉娜p', ready: true },
      { title: '叮咚鸡怀旧小卖部【哈基杯应援】', bvid: 'BV1EkgA6qEvo', author: '南华真人666', ready: true },
    ],
    // 短链前缀：留空或构造失败时回退原始 B 站链接
    shortLinkPrefix: '',
  },

  // 任务：每日任务（每天刷新）+ 主线任务（一次性），奖励 = 任务加速卡 ×1（×2 持续 30 分钟）
  tasks: {
    daily: [
      { id: 'd-feed-10', name: '喂食 10 次', metric: 'dailyFeeds', target: 10 },
      { id: 'd-feed-50', name: '喂食 50 次', metric: 'dailyFeeds', target: 50 },
      { id: 'd-feed-100', name: '喂食 100 次', metric: 'dailyFeeds', target: 100 },
      { id: 'd-buy-3', name: '购买 3 个池子', metric: 'poolsOwned', target: 3 },
      { id: 'd-buy-10', name: '购买 10 个池子', metric: 'poolsOwned', target: 10 },
      { id: 'd-boost-1', name: '领 1 次加速', metric: 'dailyBoosts', target: 1 },
      { id: 'd-boost-5', name: '领 5 次加速', metric: 'dailyBoosts', target: 5 },
      { id: 'd-boost-10', name: '领 10 次加速', metric: 'dailyBoosts', target: 10 },
    ],
    mainline: [
      { id: 'm-click-100', name: '累计喂食 100 次', metric: 'clicks', target: 100 },
      { id: 'm-click-1000', name: '累计喂食 1000 次', metric: 'clicks', target: 1000 },
      { id: 'm-click-5000', name: '累计喂食 5000 次', metric: 'clicks', target: 5000 },
      { id: 'm-prod-1e4', name: '累计养出 1 万只', metric: 'totalProduced', target: 1e4 },
      { id: 'm-prod-1e6', name: '累计养出 100 万只', metric: 'totalProduced', target: 1e6 },
      { id: 'm-prod-1e8', name: '累计养出 1 亿只', metric: 'totalProduced', target: 1e8 },
      { id: 'm-prod-1e10', name: '累计养出 100 亿只', metric: 'totalProduced', target: 1e10 },
      { id: 'm-prod-1e12', name: '累计养出 1 万亿只', metric: 'totalProduced', target: 1e12 },
      { id: 'm-prod-1e16', name: '累计养出 1 亿亿只', metric: 'totalProduced', target: 1e16 },
      { id: 'm-prod-1e20', name: '累计养出 1 万亿亿只', metric: 'totalProduced', target: 1e20 },
      { id: 'm-pool-20', name: '拥有 20 个池子', metric: 'poolsOwned', target: 20 },
      { id: 'm-evo-5', name: '进化到肥宅形态', metric: 'evolutionLevel', target: 5 },
      { id: 'm-evo-8', name: '进化到恶魔形态', metric: 'evolutionLevel', target: 8 },
      { id: 'm-evo-11', name: '进化到千亿形态', metric: 'evolutionLevel', target: 11 },
      { id: 'm-evo-24', name: '进化到亿亿亿形态', metric: 'evolutionLevel', target: 24 },
    ],
  },

  // 成就：达成自动点亮、纯荣誉
  achievements: [
    // 产出里程碑
    { id: 'a-prod-1e3', name: '破千', desc: '累计养出 1000 只', metric: 'totalProduced', target: 1e3 },
    { id: 'a-prod-1e4', name: '破万', desc: '累计养出 1 万只', metric: 'totalProduced', target: 1e4 },
    { id: 'a-prod-1e6', name: '百万大户', desc: '累计养出 100 万只', metric: 'totalProduced', target: 1e6 },
    { id: 'a-prod-1e8', name: '亿万身家', desc: '累计养出 1 亿只', metric: 'totalProduced', target: 1e8 },
    { id: 'a-prod-1e10', name: '百亿传奇', desc: '累计养出 100 亿只', metric: 'totalProduced', target: 1e10 },
    { id: 'a-prod-1e12', name: '万亿大户', desc: '累计养出 1 万亿只', metric: 'totalProduced', target: 1e12 },
    { id: 'a-prod-1e16', name: '亿亿传奇', desc: '累计养出 1 亿亿只', metric: 'totalProduced', target: 1e16 },
    { id: 'a-prod-1e20', name: '万亿亿主宰', desc: '累计养出 1 万亿亿只', metric: 'totalProduced', target: 1e20 },
    { id: 'a-clear', name: '亿亿亿达成', desc: '通关：养出 1 亿亿亿只', metric: 'totalProduced', target: 1e24 },
    // 进化
    { id: 'a-evo-1', name: '初长成', desc: '进化到幼年形态', metric: 'evolutionLevel', target: 1 },
    { id: 'a-evo-5', name: '肥宅快乐', desc: '进化到肥宅形态', metric: 'evolutionLevel', target: 5 },
    { id: 'a-evo-11', name: '千亿传说', desc: '进化到千亿形态', metric: 'evolutionLevel', target: 11 },
    { id: 'a-evo-24', name: '亿亿亿传说', desc: '进化到亿亿亿形态', metric: 'evolutionLevel', target: 24 },
    // 喂食
    { id: 'a-click-100', name: '手速惊人', desc: '累计喂食 100 次', metric: 'clicks', target: 100 },
    { id: 'a-click-1000', name: '疯狂喂食', desc: '累计喂食 1000 次', metric: 'clicks', target: 1000 },
    { id: 'a-click-5000', name: '喂食狂魔', desc: '累计喂食 5000 次', metric: 'clicks', target: 5000 },
    // 池子
    { id: 'a-pool-5', name: '池子收藏家', desc: '拥有 5 个生产池子', metric: 'poolsOwned', target: 5 },
    { id: 'a-pool-20', name: '池子大户', desc: '拥有 20 个生产池子', metric: 'poolsOwned', target: 20 },
    { id: 'a-pool-50', name: '池子帝国', desc: '拥有 50 个生产池子', metric: 'poolsOwned', target: 50 },
    // 加速
    { id: 'a-boost-1', name: '初次加速', desc: '累计领 1 次看视频加速', metric: 'totalBoosts', target: 1 },
    { id: 'a-boost-20', name: '加速常客', desc: '累计领 20 次看视频加速', metric: 'totalBoosts', target: 20 },
    { id: 'a-boost-stack3', name: '三倍火力', desc: '任务/看视频/商店三种加速同时生效', metric: 'maxActiveChannels', target: 3 },
  ],

  // 商店：用动物数量购买永久/临时增益 + 节日主题
  shop: {
    multiplier: { base: 1.1, baseCost: 2000, costGrowth: 10 },          // 全局产出倍率：每级 ×1.1，成本 2000×10^n
    raptureUpgrade: { rateFactor: 2, baseCost: 5e7, costGrowth: 10 },   // 喂一口狂暴升级：每级触发率 ×2，成本 5000万×10^n（5 级封顶）
    poolUpgrade: { factor: 2, costFactor: 60, costGrowth: 20 },       // 池子升级：该池产出 ×2，成本 = 该池基础成本 ×60 ×20^n
    buff: { cost: 1500 },                                                  // 商店加速卡：×2 持续 10 分钟（时长见 boost.shop）
    themes: [
      { id: 'default', name: '日常', emoji: '🌈', bonus: 1, item: null },
      { id: 'qixi', name: '七夕', emoji: '💕', bonus: 1.1, item: { name: '鹊桥', cost: 5000, bonus: 1.2 } },
      { id: 'zhongqiu', name: '中秋', emoji: '🌕', bonus: 1.15, item: { name: '月饼', cost: 8000, bonus: 1.25 } },
      { id: 'shengdan', name: '圣诞', emoji: '🎄', bonus: 1.2, item: { name: '圣诞袜', cost: 12000, bonus: 1.3 } },
      { id: 'xinnian', name: '新年', emoji: '🧧', bonus: 1.25, item: { name: '红包', cost: 20000, bonus: 1.4 } },
    ],
  },

  // 新闻栏：保护动物宣传标语（每 N 秒轮换一条）
  news: [
    '🐾 官方倡议：为保护濒危哈基米，请大量繁殖它们！',
    '📢 繁殖即保护——每多一只哈基米，世界就多一分柔软。',
    '🌏 让哈基米遍布每一个位面，是我们的光荣使命。',
    '❤️ 别让你的哈基米孤单，多喂一口，多生一窝。',
    '🐶 哈基汪保护协会：多养、多生、多晒太阳。',
    '🏠 给每只哈基米一个家，从下水道到时空位面。',
    '📣 关爱小动物，从点一下"喂食"开始。',
    '🌟 亿亿亿哈基米不是梦，是保护动物的小目标。',
  ],
};


// ============ core.js ============
// 养哈基米/哈基汪 · 纯逻辑核心
// 不碰 DOM、不碰 localStorage；时钟与随机数注入，Node 环境可直接测试。
// 票 01 覆盖：喂食、生产池子购买、秒产、进化、离线收益、通关判定。


/**
 * 创建一局新游戏（state 为纯数据，不含 DOM/时钟）。
 * @param {{faction?:'kimi'|'dog'}} opts
 */
function createGame({ faction = 'kimi' } = {}) {
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
function evolutionMultiplier(level) {
  return CONFIG.evolution.multiplier ** level;
}

/** 由累计产仔推算进化等级：每跨 evolutionBase(10)× 升一级，封顶形态数-1。 */
function evolutionLevelFor(totalProduced) {
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
function formName(state) {
  const forms = CONFIG.evolution.forms[state.faction] ?? CONFIG.evolution.forms.kimi;
  return forms[Math.min(state.evolutionLevel, forms.length - 1)];
}

/** 毛色名（按阵营）。 */
function coatName(state, gene) {
  const coats = CONFIG.genes.coats[state.faction] ?? CONFIG.genes.coats.kimi;
  return coats[gene.coat];
}

/** 体型名。 */
function sizeName(gene) {
  return CONFIG.genes.sizes[gene.size];
}

/** 变异名（无变异返回 null）。 */
function mutationName(gene) {
  return gene.mutation == null ? null : CONFIG.genes.mutations[gene.mutation];
}

/** 某池子基因池的可读描述，如「橘·标准」或「橘·标准·异色瞳」。 */
function geneLabel(state, poolIndex) {
  const g = state.genes[poolIndex];
  const m = mutationName(g);
  return m ? `${coatName(state, g)}·${sizeName(g)}·${m}` : `${coatName(state, g)}·${sizeName(g)}`;
}

/**
 * 种群统计：按当前每池基因性状（毛色×体型×变异）聚合累计产仔数量，降序。
 * 返回 [{ coat, size, mutation, label, count }]；仅含已产仔的性状。
 */
function populationByTrait(state) {
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
function boostMultiplier(state, now) {
  let m = 1;
  if (now < state.boost.task.expiresAt) m *= 2;
  if (now < state.boost.video.expiresAt) m *= 2;
  if (now < state.boost.shop.expiresAt) m *= 2;
  return m;
}

/** 当前同时生效的加速状态数（0~3）。 */
function activeBoostChannels(state, now) {
  return (now < state.boost.task.expiresAt ? 1 : 0)
    + (now < state.boost.video.expiresAt ? 1 : 0)
    + (now < state.boost.shop.expiresAt ? 1 : 0);
}

/** 商店全局产出倍率：base ^ 倍率等级。 */
function globalShopMultiplier(state) {
  return CONFIG.shop.multiplier.base ** state.shop.multLevel;
}

/** 节日加成：当前主题 bonus × 已购节日道具 bonus 之积。 */
function bonusMultiplier(state) {
  let m = 1;
  for (const t of CONFIG.shop.themes) {
    if (t.id === state.shop.theme) m *= t.bonus;
    if (t.item && state.shop.themeItems[t.id]) m *= t.item.bonus;
  }
  return m;
}

/** 狂暴倍率：狂暴生效期间全局产出 ×multiplier，否则 1。 */
function raptureMultiplier(state, now) {
  return now < state.rapture.activeUntil ? CONFIG.rapture.multiplier : 1;
}

/** 当前喂食狂暴触发率（基础率 × 2^升级等级，封顶 3.2%）。 */
function raptureRate(state) {
  const lv = Math.min(state.shop.raptureLevel, CONFIG.rapture.maxLevel);
  return CONFIG.rapture.baseRate * Math.pow(CONFIG.shop.raptureUpgrade.rateFactor, lv);
}

/** 每秒产仔 = Σ[已购 × 秒产 × 池子升级] × 进化 × 加速 × 商店全局 × 节日加成 × 狂暴。 */
function secondsProduction(state, now = Date.now()) {
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
function feed(state, now = Date.now(), rng = Math.random) {
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
function poolCost(state, index) {
  const pool = CONFIG.pools[index];
  if (!pool) return Infinity;
  return Math.floor(pool.cost * Math.pow(CONFIG.poolCostGrowth, state.pools[index]));
}

/** 一次买 count 个池子的总成本（等比数列求和，含 1.15× 递增）。 */
function bulkCost(state, index, count) {
  const pool = CONFIG.pools[index];
  if (!pool || count <= 0) return Infinity;
  const owned = state.pools[index];
  const r = CONFIG.poolCostGrowth;
  return Math.floor(pool.cost * Math.pow(r, owned) * (Math.pow(r, count) - 1) / (r - 1));
}

/** 批量买 count 个池子：钱够则扣款 + 该池 +count（并收录基因组合进图鉴）；否则原样返回。 */
function buyPoolBulk(state, index, count) {
  const cost = bulkCost(state, index, count);
  if (cost === Infinity || state.count < cost) return state;
  const pools = [...state.pools];
  pools[index] += count;
  return collectGenes({ ...state, count: state.count - cost, pools });
}

/** 买一级池子：钱够则扣款 + 该池 +1（并收录其初始基因组合进图鉴）；否则原样返回。 */
function buyPool(state, index) {
  return buyPoolBulk(state, index, 1);
}

/** 某池子是否已解锁显示：第 0 池永远可见，其余需累计养出达到其基础成本的 ratio（60%）。 */
function isPoolRevealed(state, index) {
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
function produce(state, seconds, rng = Math.random, now = Date.now()) {
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
function offlineGains(state, lastSeen, now) {
  const elapsed = Math.max(0, (now - lastSeen) / 1000);
  const seconds = Math.min(elapsed, CONFIG.offline.maxSeconds);
  const next = produce(state, seconds, Math.random, now);
  return { state: next, gains: next.count - state.count, seconds };
}

/** 是否通关（累计产仔达 1 亿亿亿）。 */
function isCleared(state) {
  return state.totalProduced >= CONFIG.clear.target;
}

// ============================================================
// 引流闭环：加速道具与每日补给配额（票 03）
// ============================================================

/** 本地日期键（YYYY-MM-DD），按玩家本地时区。 */
function toLocalDateKey(now) {
  const d = now instanceof Date ? now : new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 今日剩余可领加速次数。 */
function supplyRemaining(state, now) {
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
function useCard(state, type, now = Date.now()) {
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
function useClicker(state, now = Date.now()) {
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
function claimBoost(state, now) {
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
function pickSupplyTarget(rng = Math.random, homeWeight = 1) {
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
function rolloverDaily(state, now) {
  const today = toLocalDateKey(now);
  if (state.stats.dailyDate === today) return state;
  return {
    ...state,
    stats: { ...state.stats, dailyDate: today, dailyFeeds: 0, dailyBoosts: 0 },
    tasks: { ...state.tasks, dailyDone: {} },
  };
}

/** 任务/成就进度指标的当前值。 */
function metricValue(state, metric) {
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
function claimTask(state, taskId, now = Date.now()) {
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
function unlockAchievements(state) {
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
function collectGenes(state) {
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
function collectionProgress(state) {
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
function formatCount(n) {
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
function shareText(state, variant = 'flaunt') {
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
function shopMultiplierCost(state) {
  return Math.floor(CONFIG.shop.multiplier.baseCost * Math.pow(CONFIG.shop.multiplier.costGrowth, state.shop.multLevel));
}

/** 购买一级全局产出倍率（永久 ×base）。 */
function buyMultiplier(state) {
  const cost = shopMultiplierCost(state);
  if (state.count < cost) return state;
  return { ...state, count: state.count - cost, shop: { ...state.shop, multLevel: state.shop.multLevel + 1 } };
}

/** 喂一口狂暴升级当前成本（5000 万 × 10^n）。 */
function raptureUpgradeCost(state) {
  return Math.floor(CONFIG.shop.raptureUpgrade.baseCost * Math.pow(CONFIG.shop.raptureUpgrade.costGrowth, state.shop.raptureLevel));
}

/** 购买一级喂一口狂暴升级（触发率 ×rateFactor，封顶 maxLevel 级）。 */
function buyRaptureUpgrade(state) {
  const cost = raptureUpgradeCost(state);
  if (state.count < cost) return state;
  if (state.shop.raptureLevel >= CONFIG.rapture.maxLevel) return state; // 已满级
  return { ...state, count: state.count - cost, shop: { ...state.shop, raptureLevel: state.shop.raptureLevel + 1 } };
}

/** 某池子升级当前成本（随该池基础成本缩放，越高级的池子升级越贵）。 */
function shopPoolUpgradeCost(state, index) {
  const pool = CONFIG.pools[index];
  if (!pool) return Infinity;
  return Math.floor(pool.cost * CONFIG.shop.poolUpgrade.costFactor * Math.pow(CONFIG.shop.poolUpgrade.costGrowth, state.shop.poolUpgrades[index]));
}

/** 购买某池子升级（该池产出 ×factor，永久）。 */
function buyPoolUpgrade(state, index) {
  const cost = shopPoolUpgradeCost(state, index);
  if (state.count < cost) return state;
  const poolUpgrades = [...state.shop.poolUpgrades];
  poolUpgrades[index]++;
  return { ...state, count: state.count - cost, shop: { ...state.shop, poolUpgrades } };
}

/** 用动物数量购买商店加速卡（×2 持续 10 分钟，未生效则直接开启，否则存进背包）。 */
function buyBuff(state, now = Date.now()) {
  const cost = CONFIG.shop.buff.cost;
  if (state.count < cost) return state;
  const next = grantBoost(state, 'shop', now);
  return { ...next, count: state.count - cost };
}

/** 切换节日主题（含产出加成 bonus）。 */
function setTheme(state, themeId) {
  if (!CONFIG.shop.themes.some((t) => t.id === themeId)) return state;
  return { ...state, shop: { ...state.shop, theme: themeId } };
}

/** 购买节日道具（永久产出加成 bonus，花费动物数量）。 */
function buyThemeItem(state, themeId) {
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


// ============ ui.js ============
// 渲染层：喂食点击 + 池子购买 + 挂机秒产 + 进化形态 + 基因池展示 + 选边换边 + 离线收益 + 通关。
// 全部逻辑在 core.js，本文件只做呈现与输入、localStorage 适配与游戏循环。


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
  submitScore(); // 排行榜上报（内部 10s 节流，失败静默）
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
    // 先 UPDATE、未命中再 INSERT（不用 upsert：upsert 要求整表 SELECT 权限，会泄露原始数据）
    const payload = {
      total_produced: Math.floor(state.totalProduced),
      count: Math.floor(state.count),
      play_seconds: Math.floor(state.stats.playSeconds || 0), // 游玩时长，云端按此核算分数合理性
      // form_level/updated_at 由服务端计算与写入（客户端不可写，防伪造）
    };
    console.log('[排行榜] 上报:', payload);
    const u = await sb.from('scores').update(payload).eq('player_id', playerId);
    if (u.error) {
      console.warn('[排行榜] UPDATE 失败:', u.error);
      // 上报失败：静默降级（网络/云端瞬时拒绝都不打断游戏；下个周期自动重试）
      throw u.error;
    }
    if (!u.data || u.data.length === 0) {
      console.log('[排行榜] UPDATE 未命中，执行 INSERT');
      const i = await sb.from('scores').insert({ player_id: playerId, ...payload });
      if (i.error) {
        console.warn('[排行榜] INSERT 失败:', i.error);
        throw i.error;
      }
    } else {
      console.log('[排行榜] UPDATE 成功');
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
    // 仙界 tab 查 leaderboard_immortal 视图（total >= 1e18，云端正交于人界榜）
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
      ? '<div style="padding:14px;color:#999;text-align:center;">🐉 仙界空无一人<br><span style="font-size:12px;">养到 100 亿亿（1e18）即可破碎虚空飞升仙界！</span></div>'
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
    if (me >= 0) {
      $('lb-mine').innerHTML = `🎯 ${isImmortal ? '仙' : '人'}界你的排名：第 ${me + 1} 名（${fmt(rows[me].total_produced)}）<span style="font-size:10px;color:#bbb;"> ID:#${shortPlayerId(playerId)}</span><button id="btn-rename" style="margin-left:8px;padding:2px 8px;border:none;border-radius:6px;background:var(--accent-soft);color:var(--accent);font-size:12px;cursor:pointer;">✏️ 改名字</button>`;
      $('btn-rename').addEventListener('click', () => { showNicknameModal(nickname); });
    } else if (playerId) {
      const { data: my } = await sb.from(isImmortal ? 'leaderboard_immortal' : 'leaderboard').select('total_produced').eq('player_id', playerId).maybeSingle();
      $('lb-mine').innerHTML = my && my.total_produced != null
        ? `🎯 ${isImmortal ? '仙' : '人'}界你的累计：${fmt(my.total_produced)}（暂在前 ${CONFIG.leaderboard.topN} 名外）<span style="font-size:10px;color:#bbb;"> ID:#${shortPlayerId(playerId)}</span><button id="btn-rename" style="margin-left:8px;padding:2px 8px;border:none;border-radius:6px;background:var(--accent-soft);color:var(--accent);font-size:12px;cursor:pointer;">✏️ 改名字</button>`
        : isImmortal
          ? '🎯 你尚未飞升仙界（养到 100 亿亿 1e18 即可）'
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
  initSupabase(); // 匿名登录 + 玩家档案（失败静默，不影响游戏）
  window.addEventListener('pagehide', () => submitScore(true));
}

init();


})();
