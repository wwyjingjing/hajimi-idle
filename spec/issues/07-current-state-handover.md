# 07 — 现状全景与交接 PRD（01-06 之后的全部迭代）

**What to build:** 本文件是 01-06 全部落地并上线后，本会话（2026-08-15 起）所有追加迭代的完整沉淀：功能现状、数值口径、安全设计、部署运维、已知问题与待办。供新上下文直接接手，无需从零探索。

**Blocked by:** 无（06 已部署上线）

**Status:** ready-for-agent

- [ ] 新上下文按本 PRD 完成交接核对（跑通 `vitest`、本地预览、Supabase 只读检查）
- [ ] 决定待办项优先级（见 Further Notes）
- [ ] 若玩家端仍有"成绩不上/不显示"反馈，按"旧缓存 bundle 需强制刷新"口径答复

---

## Problem Statement

原 spec（01-06）已完成并上线（线上 v0.6）。之后按用户迭代指令追加了大量功能与一次安全加固：通关目标从千亿(10¹¹)改为 1 亿亿亿(10²⁴)、进化形态 12→25 级、生产池 13→20 个、三通道加速+背包、看应援君子协定、喂一口狂暴、连点器、喂食跟随产出、更多任务成就、**排行榜+轻量账号（Supabase）+完整防作弊**、营销素材（宣传脚本/15s 视频提示词/B 站 Toy 帖）。会话上下文将切换，需要一份可独立接手的 PRD。

## Solution

一个纯前端 H5 挂机养成游戏（现状 v0.6，线上已部署），玩法在 01-06 基础上迭代为：

- **通关**：累计养出 1 亿亿亿(10²⁴) 只；进化 25 级（奶团→…→亿亿亿），每 10× 升一级，全局效率 ×1.2/级。
- **生产池**：20 级 → **25 级**（下水道→…→亿亿亿圣殿→永恒轮回→创世神座→至高神国→虚空彼岸→万物归一），**从低到高渐显**（累计养出 ≥ 池子基础成本 60% 才显示，第 0 池常显），带内联马赛克 SVG 图标。
- **喂食**：产出 = max(基础 1×进化×狂暴, 当前秒产 × `feed.clickSeconds`=1)，即跟随当前产能成长；连点器自动喂食 5 次/秒×60s，触发飘字动效。
- **狂暴**：喂食低概率触发（基础 0.1%，升级每级 ×2，封顶 3.2%），全局产出 ×7 持续 30s，**结束后冷却 120s**（数学上不可常驻）；触发时整体 UI 镶金边 + 提示。
- **三通道加速**：任务卡(×2/30min)、看视频(×2/10min)、商店(×2/10min) 三词条独立可叠加(最高 ×8)，每词条同时只生效一张，多余的存**背包**手动使用。
- **应援闭环**：看应援=君子协定（点击即结算，不验证观看），每日 20 次上限，50% 概率掉落连点器；跳转随机落在真实应援作品+主办方主页。
- **商店**：全局倍率(1.1^n)、池子升级(×2^n)、商店加速卡、节日主题+道具、狂暴升级(5000万×10ⁿ)。
- **任务/成就/图鉴/背包/新闻/分享**：每日任务 8 条、主线 14 条；成就 22 条；图鉴=25 形态+32 基因组合+6 变异+种群统计；分享含对外域名链接与 Canvas 晒图。
- **排行榜+轻量账号（Supabase）**：匿名登录自动玩家 ID + 自填昵称；按 total_produced 排名，阵营分榜；云端防作弊（见实现决策）。
- **远端运营配置（site_config）**：推广位 featured / 看板 board / 分享 share / 应援默认地址 collection_url / 新闻 news 全部由 Supabase `site_config` 表托管；前端启动时拉取并覆盖 CONFIG（白名单 key + 值合法性校验），失败静默回退本地 config.js（离线可玩）。运营改数据库即可更新弹窗/推广内容，无需重新构建部署（见 docs/site-config-schema.sql 与 core.applySiteConfig）。

## User Stories

### 玩法迭代

1. 作为玩家，我希望能一路养到 1 亿亿亿只通关，且进化形态随进度一路变化到亿亿亿形态。
2. 作为玩家，我希望生产池子从低到高逐级解锁（达到下一池成本 60% 才显示），避免一开始就看到一长串买不起的池子。
3. 作为玩家，我希望点喂食的收益跟随当前秒产成长，而不是永远 +1/+2。
4. 作为玩家，我希望连点器自动喂食（5 次/秒×60s），有按钮脉冲和数字飘字动效。
5. 作为玩家，我希望喂食可能触发狂暴（×7/30s），触发瞬间整个界面镶金边，够爽但不会常驻。
6. 作为玩家，我希望狂暴升级（触发率 0.1%→3.2%）成本高（5000万×10ⁿ）且 5 级封顶，不会无限变强。
7. 作为玩家，我希望任务/看视频/商店三种加速是三条独立词条、可同时生效（×8），每词条同时只用一张，多余卡存背包。
8. 作为玩家，我希望点"去看应援"即得加速（君子协定），不强制观看；每日 20 次，50% 概率掉连点器。

### 排行榜与账号

9. 作为玩家，我希望打开游戏即匿名建档，填昵称就能上榜，零门槛。
10. 作为玩家，我希望排行榜按累计养出排名，可切总榜/基米队/大狗队，并看到我的排名。
11. 作为玩家，我希望拉黑名单不出现在榜单上，作弊者改不了自己的创建时间/拉黑状态。
12. 作为运营，我希望分数合理性由云端（服务端权威）核算，任何客户端版本都不会误锁正常玩家。
13. 作为运营，我希望一条命令即可拉黑作弊账号（`players.banned=true`），其数据不再展示且无法再上报。

### 营销与部署

14. 作为运营，我希望有 15s 广告视频提示词、宣传视频脚本、B 站 Toy 发帖+测试申请文档可直接使用。
15. 作为运营，我希望构建（build.mjs）与部署（deploy/ 目录 + CloudStudio）流程明确，改代码后一键出包。

## Implementation Decisions

- **模块**（不变）：`core`（纯逻辑，无 DOM，时钟/随机数/存储注入）+ `ui`（渲染）+ `config.js` 单配置；`build.mjs` 合并为 `app.bundle.js`（file:// 可玩）；`server.mjs` 本地预览（8322）；`deploy/` 为部署目录（index.html + app.bundle.js + assets）。
- **数值口径**（config.js 顶部注释齐全，可调）：
  - 通关 `clear.target = 1e24`；进化 `evolutionBase = 10`、`multiplier = 1.2`，形态 25 级（奶团→军团→星海→…→亿亿亿）。
  - 生产池 25 个：下水道(cost10/prod0.1) → 时空位面(1.2e15/7e7) → 多元宇宙(2e16/4e8) → 创世奇点(3e17/2.5e9) → 无限法则(5e18/1.5e10) → 起源之海(8e19/1e11) → 至高位面(1.5e21/6e11) → 无尽虚空(3e22/4e12) → 亿亿亿圣殿(6e23/2.5e13) → **永恒轮回(1.2e25/1.5e14)** → **创世神座(2.5e26/8e14)** → **至高神国(5e27/4e15)** → **虚空彼岸(1e29/2e16)** → **万物归一(2e30/1e17)**；`poolCostGrowth 1.15`；渐显 `poolReveal.ratio 0.6`。
  - 狂暴 `rapture`：baseRate 0.001、multiplier 7、duration 30s、cooldown 120s、maxLevel 5、shop.raptureUpgrade {rateFactor 2, baseCost 5e7, costGrowth 10}。
  - 连点器 `clicker`：ratePerSecond 5、durationSeconds 60、videoChance 0.5。
  - 喂食 `feed`：base 1、clickSeconds 1（产出 = max(基础×进化×狂暴, 秒产×clickSeconds)）。
  - 三通道 `boost`：task 30min / video 10min / shop 10min（各 ×2）；背包 `cards {task,video,shop}` + `clicker`；狂暴/连点器状态 `rapture {activeUntil,readyAt}`、`clicker {count,activeUntil}`。
  - 大数格式化：万/亿/万亿/亿亿/万亿亿/亿亿亿。
- **排行榜/账号（Supabase，详见 docs/leaderboard-schema.sql 与 docs/adr/0002）**：
  - 匿名登录（signInAnonymously）→ `players(id=auth.uid, nickname, faction, banned, created_at)`；`scores(player_id, total_produced, count, form_level, play_seconds, updated_at)`。
  - **列级授权（核心防线）**：`created_at`/`banned`/`updated_at`/`form_level` 服务端独占，客户端不可读不可写；scores 无 SELECT（读仅经视图）；白名单列授权明细见 schema 文件。
  - **scores 无外键**（FK 校验会强制 anon 读 players 全表暴露锚点）；归属由 RLS「仅本人行」+ 触发器兜底。
  - **触发器 SECURITY DEFINER**（内部查 players 以属主身份执行）：拉黑禁报 → 天花板 1e18 → 速率 `total ≤ 账号年龄×1e12`（created_at 服务端权威，任何客户端版本不误锁）→ 只增不减 → `form_level` 服务端按 total 重算（与进化等级一致）。
  - **弃用**：客户端 play_seconds 核算（旧客户端不传导致全误锁）、增量锁 ≤1e14（误伤追涨）、旧天花板 1e15（逼近头部玩家）、upsert 上报（需整表 SELECT 会泄露）；现用**两步走**上报（先 UPDATE 未命中再 INSERT）。
  - **leaderboard 视图**：仅 4 列（player_id/nickname/faction/total_produced），过滤拉黑，匿名可读；前端唯一读路径。
  - **拉黑**：`players.banned=true` 运营一条命令；拉黑后视图不展示 + 触发器拒绝其上报。
- **远端运营配置（site_config，详见 docs/site-config-schema.sql）**：
  - 表 `site_config(key text PK, value jsonb, updated_at, enabled)`，匿名只读（RLS），客户端禁写；种子数据与 config.js 对齐。
  - key：`featured`（推广位数组）、`board`（{url,group}）、`share`（{link}）、`collection_url`（字符串）、`news`（字符串数组）。
  - 前端 `loadSiteConfig()` 在 initSupabase 内启动时拉取（不依赖匿名登录成功），经 core `applySiteConfig` 白名单覆盖 CONFIG；失败/缺 key 静默回退本地（离线可玩）。
  - 运营更新：`update public.site_config set value = '...'::jsonb where key = '...';` → 玩家下次启动/刷新即生效，无需重新构建部署。
- **前端**：排行榜入口「🏅 排行」、昵称弹窗、总榜/分榜 tab、我的排名；上报每 10s + pagehide；游玩时长随存档。
- **营销**：`docs/宣传视频脚本.md`（45s 主版+15s 极速版+标题/封面/旁白/简介/TAG）、`docs/15秒广告视频提示词.md`（AI 文生视频提示词）、`docs/B站Toy宣传帖与测试申请.md`（发帖+测试资格申请+8 张截图清单）。
- **部署**：改代码 → `node game/build.mjs` → 同步 `game/deploy/`（index.html+app.bundle.js+assets）→ WorkBuddy 执行 `workbuddy_cloudstudio_deploy --directory ...\game\deploy`。CloudStudio 线上（内部部署用）：https://ea8df52043fd4121a761eed0a3e2c2c4.app.workbuddy.link/；**对外主入口（2026-08-15 起）**：https://www.bilibili.com/toy/hajimi-idle-public/index.html（B 站 Toy 公开版，分享链接 site_config.share.link 已指向它）；本地预览 http://127.0.0.1:8322。**B 站 Toy 部署**：toy CLI（`C:\Users\Administrator\AppData\Local\Programs\toy\toy.exe`，已登录「吴吴的京」）→ 同步最新 `app.bundle.js`+`index.html`+`assets/` 到 `F:\workbuddy\_toy-publish` → `toy update 22870361262080 <path> --yes`（公开版 hajimi-idle-public）+ `toy update 22866645109760 <path> --yes`（链接版 hajimi-idle）→ 提交审核。Toy 链接：https://www.bilibili.com/toy/hajimi-idle/index.html（LINK_ONLY）与 https://www.bilibili.com/toy/hajimi-idle-public/index.html（PUBLIC）。

## Testing Decisions

- **唯一测试 seam**：`core` 模块（`core.test.js`，Vitest，Node 环境），注入时钟/随机数/存储，只测外部行为，不测 UI/DOM/localStorage 真实读写。共 **57 个用例**，`vitest run --pool=threads` 全绿。
- 覆盖面：喂食（含跟随秒产/狂暴保底）、池子购买/批量/渐显、进化、交配遗传、狂暴（触发/冷却/封顶）、连点器（消耗/不叠加）、三通道加速（claimBoost/useCard/useClicker）、每日/主线任务、成就、图鉴/种群统计、商店（倍率/池子升级/狂暴升级/加速卡/节日）、分享文案、isCleared/formatCount 大数、isPoolRevealed。
- 云端（Supabase）行为以**真实客户端脚本验证**（signInAnonymously → upsert/两步走 → 视图读取 → 攻击向量断言），不属于 Vitest seam，但已有验证脚本模式可复用。

## Out of Scope

- 完全杜绝养号（账号年龄是延迟非阻断，纯前端信任问题无根治方案）；最终排名建议运营人工复核 top 玩家建档时间与拉黑名单。
- 服务端重算产能（游戏逻辑纯前端，未移植到云端）。
- 微信/QQ 登录、用户名密码账号体系（维持匿名+昵称轻量方案）。
- 真实立绘/音源替换（沿用 emoji + 内联 SVG 马赛克图标）。
- 对局计分系统（游戏与计分完全解耦）。

## Further Notes

- **已知问题**：
  - 玩家端若仍"成绩不上/不显示"：多为浏览器缓存旧 bundle（旧 upsert 被新授权拒）→ 强制刷新一次即恢复；服务端与线上 v0.6 已实测正常（两步走落库、updated_at 刷新、视图含最新排名）。
  - 头部玩家（如 胖宝宝 ~7e14）已接近旧天花板，已抬至 1e18；速率核算 age×1e12 为真约束，暂无人触发。
- **待办候选**（用户可随时指定优先级）：
  - ~~新池子数值微调（尤其亿亿亿圣殿 cost6e23 贴近通关目标）；「亿亿亿圣殿」成就/新闻文案补一句。~~ ✅ **已完成**（2026-08-15）：池子从 20 个扩建到 25 个，新增「永恒轮回」「创世神座」「至高神国」「虚空彼岸」「万物归一」5 个池子；旧存档自动迁移兼容。
  - 拉黑名单运营（把新发现的作弊昵称发我即可执行）。
  - 短链计数服务开通（原 06 遗留）。
  - 若要对邦结算/复盘，汇总榜单快照。
- **环境**：Supabase 项目 `sboaeygtztyubizypvrc`（anon key 在 `config.js`；数据库密码由用户持有，`game/apply_schema.mjs` 走 `SUPABASE_DB_PASSWORD` 环境变量；**本机直连数据库受限：DNS 仅解析出 IPv6 且本机无 IPv6，需在 Supabase 控制台 SQL Editor 手动执行建表 SQL**）；本地 node 全路径 `C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node.exe`（PATH 未配置）；游戏文档 `docs/`（ADR 0001/0002、leaderboard-schema.sql、site-config-schema.sql、营销三件套）。**B 站 Toy 部署**：toy CLI 位于 `C:\Users\Administrator\AppData\Local\Programs\toy\toy.exe`，已登录「吴吴的京」；部署目录 `F:\workbuddy\_toy-publish`（同步 deploy 三件套后 `toy update 22870361262080 <path> --yes` + `toy update 22866645109760 <path> --yes`）。**site_config 动态配置已上线**（2026-08-15）：表已建、种子数据已入、B 站 Toy 已更新进入审核；运营改 `public.site_config` 任一 key 的 value 即可更新弹窗/推广内容，玩家刷新即生效。
