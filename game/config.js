// 单一配置模块：生产池子、进化形态、数值、文案、跳转目标全部集中于此。
// 数值目标：自然挂机到 1 亿亿亿（10²⁴）通关，可按需微调。

export const CONFIG = {
  // localStorage 单 key 存档
  storageKey: 'hajimi-idle.save.v1',

  // 分享文案与晒图里的游戏入口链接（对外域名；线上以 site_config 表 share key 为准，此处为本地兜底）
  share: {
    link: 'https://www.bilibili.com/toy/hajimi-idle-public/index.html',
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
    enabled: false,               // ★ 总开关：false=隐藏排行榜入口+停止上报（B站版本用）；true=显示（需重新部署）
    submitIntervalMs: 10 * 1000,  // 每 10 秒上报一次（关页/切后台另即时上报）
    topN: 100,                    // 榜单前 100 名
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
      { title: '走近哈基屋', bvid: 'BV1cfb96eEfG', author: '永雏塔顺费', ready: true },
      { title: '【哈基杯应援】除草机音乐', bvid: 'BV1m3bv6XEdd', author: '海绵宝宝非谦儿', ready: true },
      { title: '【基狗对邦应援】😺聪明的基米😺', bvid: 'BV1Vnbe6ZEXV', author: '勇者アリス', ready: true },
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
