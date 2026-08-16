# 08 — 榜单安全专项 PRD（反作弊系统的活文档）

**What to build:** 面向运营的榜单反作弊「活文档」：威胁模型、防线层次、服务端校验原理、监控体检方法、拉黑 SOP、排查手册。目的：让你时刻知道榜单反作弊系统**如何工作、是否健康、作弊者怎么死、正常玩家怎么不被误伤**。

**Blocked by:** 无（系统已上线 v0.6，本文档描述的是当前实现）

**Status:** ready-for-agent

- [ ] 阅读本文档 + `docs/adr/0002` + `docs/leaderboard-schema.sql`，形成对防作弊体系的完整认识
- [ ] 按「监控与体检」章节跑一遍体检 SQL，确认线上系统健康
- [ ] 把「拉黑 SOP」打印/收藏，发现作弊账号按流程执行
- [ ] 若玩家反馈「分数不上/不显示」，按「排查手册」口径答复

---

## 一、威胁模型（作弊者怎么想）

纯前端游戏 + 匿名账号 + 君子协定档位，作弊者可能的攻击路径：

| # | 攻击方式 | 能否得逞 | 现有防线 |
|---|---------|---------|---------|
| 1 | 改 localStorage 存档（改数量/进化等级） | ❌ 改不到榜 | 分数以**客户端上报的 totalProduced** 为准，且云端校验 |
| 2 | 直接伪造 HTTP 请求上报超大分数 | ❌ 被触发器拒 | 绝对上限 + 速率核算 + 只增不减 |
| 3 | 伪造 `created_at`（改早建号时间绕过速率） | ❌ 列级授权 | created_at 服务端独占，客户端不可读不可写 |
| 4 | 伪造 `banned=false`（自解封） | ❌ 列级授权 | banned 服务端独占，客户端不可写 |
| 5 | 伪造 `form_level`（25 级配低分数自相矛盾） | ❌ 服务端重算 | form_level 由触发器按 total 重算，客户端写入无效 |
| 6 | 批量注册养号（真等数小时再写满） | ⚠️ 部分可行 | 只能**延迟**不能**阻断**：速率核算 age×1e12 为真约束 |
| 7 | 读榜校准（看别人分数/年龄决定写多少） | ❌ 读路径脱敏 | scores 零 SELECT；players 仅 3 列；只有 leaderboard 视图 |
| 8 | 刷昵称/改阵营干扰榜单 | ⚠️ 低危害 | 昵称 1-16 字 + faction 白名单枚举 |

**核心结论**：客户端全被攻破也不怕——因为**所有可信锚点（created_at/banned/updated_at/form_level）都在服务端**，客户端能动的只有 total_produced/count/play_seconds 三个值，而这三个值受「速率核算」这个真约束管辖。

---

## 二、防线层次（纵深防御总览）

从外到内共 6 层，任何单层被绕过，下一层仍兜底：

```
玩家 → 前端(可被改) → Supabase Auth(匿名登录) → RLS(行级) → 列级授权(白名单) → 触发器(SECURITY DEFINER) → 视图(脱敏读)
        [不可信]         [身份锚点]              [仅本人行]     [服务端独占列]        [权威校验]           [只露4列]
```

| 层 | 机制 | 防什么 | 代码位置 |
|----|------|--------|---------|
| L1 | 匿名登录 `signInAnonymously` | 玩家 ID = auth.uid()，身份服务端签发 | `game/ui.js` initSupabase |
| L2 | RLS 行级策略 | 写操作仅限本人行；读全开放（榜单） | `docs/leaderboard-schema.sql` §3 |
| L3 | **列级授权**（核心防线） | created_at/banned/updated_at/form_level 客户端不可读不可写；scores 零 SELECT | schema §4 |
| L4 | 两步走上报（非 upsert） | upsert 需整表 SELECT 会泄露数据；两步走只 UPDATE/INSERT 白名单列 | `game/ui.js` submitScore |
| L5 | **触发器 keep_max_score**（SECURITY DEFINER） | 拉黑禁报、绝对上限、速率核算、只增不减、form_level 重算 | schema §5 |
| L6 | leaderboard 视图 | 只露 4 列（player_id/nickname/faction/total_produced）、过滤拉黑 | schema §6 |

---

## 三、服务端校验详解（触发器逐条解读）

`keep_max_score()` 在每次 INSERT/UPDATE scores 前执行（`before insert or update`），按顺序做 5 件事，**任何一条不通过则整个上报被拒绝**：

### 3.1 拉黑禁报
```sql
if exists (select 1 from public.players where id = new.player_id and coalesce(banned, false)) then
  raise exception 'player banned';
```
- 拉黑玩家的上报直接报错，分数冻结在拉黑时刻。
- 已拉黑玩家的名字也已在视图中消失（视图 WHERE banned=false）。

### 3.2 绝对上限
```sql
if new.total_produced > 1e18 then raise exception 'score beyond ceiling';
```
- 纯兜底：任何 total 超过 1e18（= 1 万亿亿）直接拒。
- ⚠️ **历史坑**：早期上限是 1e15，会锁住逼近的头部玩家（胖宝宝 ~7e14 已接近），已抬升到 1e18。**不要再降回去。**

### 3.3 速率核算（真约束，核心！）
```sql
rate_cap constant numeric := 1e12;
acct_age = now() - players.created_at（秒）
if new.total_produced > acct_age * rate_cap then raise exception 'rate implausible';
```
- 含义：**累计养出 ≤ 账号年龄(秒) × 1e12**。
- 账号年龄用 `created_at`（服务端写入、不可伪造），与客户端版本、play_seconds 都无关 → **任何客户端都不会误锁**。
- 正常玩家产能观察值 ~1e10~1e11/s，速率上限 1e12/s 是 10~100 倍裕量，正常玩家永不触发。
- 例：账号建了 1 小时（3600s）→ 上限 3.6e15；1 天（86400s）→ 8.64e16。要写到 1e18 需要账号真实存在 ~11.5 天。
- ⚠️ **历史坑**：早期用客户端 play_seconds 核算，旧客户端不传该字段导致全部误锁，**已废弃**。play_seconds 现在只是展示字段。

### 3.4 只增不减
```sql
if tg_op = 'UPDATE' then
  new.total_produced = greatest(new.total_produced, old.total_produced);
  new.count = greatest(new.count, old.count);
```
- 玩家分数只能涨不能跌，防「先写大数上榜，再降回来」的干扰。

### 3.5 form_level 服务端重算
```sql
new.form_level = least(greatest(floor(log(total)/log(10))::int, 0), 24);
```
- form_level = 按 total 的数量级算进化等级（0~24），与游戏内进化一致。
- 客户端传的 form_level 无效（它甚至没有 UPDATE 授权）。

---

## 四、读路径脱敏

- **前端唯一读路径**：`select * from leaderboard`（视图，仅 4 列，过滤拉黑）。
- **scores 原表**：anon 只有 `select(player_id)`（无实际数据列）——原始分数、时长、updated_at 全不泄露。
- **players 原表**：anon 只能读/写 `id/nickname/faction` 三列——created_at/banned 不可见。
- **效果**：作弊者无法读榜校准、无法看他人年龄、无法知道 rate_cap 是否被触发过。

---

## 五、监控与体检（运营定期检查）

> 在 Supabase 控制台 → SQL Editor 执行。建议**每日对邦期间跑一遍**。

### 5.1 体检脚本（一键检查系统健康）

```sql
-- 1) 系统健康总览：触发器/视图/授权是否在位
select 'trigger' as item, count(*) as ok from pg_trigger
  where tgname = 'scores_keep_max' and not tgisinternal
union all select 'view', count(*) from pg_views
  where viewname = 'leaderboard' and schemaname = 'public'
union all select 'players_rls', count(*) from pg_policies
  where tablename = 'players' and schemaname = 'public'
union all select 'scores_rls', count(*) from pg_policies
  where tablename = 'scores' and schemaname = 'public';
-- 期望输出：trigger=1, view=1, players_rls=4, scores_rls=4

-- 2) 前 20 名（含账号年龄，人工复核用）
select p.nickname, p.faction,
       s.total_produced,
       round(extract(epoch from now() - p.created_at)/3600, 1) as age_hours,
       round(s.total_produced / greatest(extract(epoch from now() - p.created_at), 1)) as rate_per_sec
from public.scores s
join public.players p on p.id = s.player_id
order by s.total_produced desc limit 20;

-- 3) 异常信号扫描：逼近速率上限的玩家（rate > 5e11/s 就要警惕）
select p.nickname, s.total_produced,
       round(extract(epoch from now() - p.created_at)) as age_sec,
       round(s.total_produced / greatest(extract(epoch from now() - p.created_at), 1)) as rate_per_sec
from public.scores s
join public.players p on p.id = s.player_id
where s.total_produced > extract(epoch from now() - p.created_at) * 5e11
order by rate_per_sec desc;
```

### 5.2 建议建一个运营只读视图（免去每次 join）

```sql
-- 运营专用视图：含年龄/速率，仅属主可查（不要 grant 给 anon！）
create or replace view public.leaderboard_ops as
select p.nickname, p.faction, p.banned, p.created_at,
       s.total_produced, s.count, s.form_level, s.play_seconds, s.updated_at
from public.scores s
join public.players p on p.id = s.player_id;
```

### 5.3 健康检查清单（每次对邦 Day 前）

- [ ] 5.1 脚本输出符合期望（trigger=1 / view=1 / RLS=4+4）
- [ ] 榜单 top20 的「账号年龄」都合理（没有几小时就冲到 e17+ 的账号）
- [ ] 最近没有「rate implausible」类报错刷屏（Supabase → Logs → Postgres）
- [ ] 玩家端能正常上报（随机找 1-2 个活跃玩家确认 updated_at 在刷新）
- [ ] 拉黑名单为空或符合预期（`select nickname from players where banned`）

---

## 六、拉黑运营 SOP

### 6.1 识别作弊信号

| 信号 | 说明 |
|------|------|
| 账号年龄极短但分数极高 | age×1e12 上限附近（5.1 脚本#3 扫到） |
| 昵称带特殊字符刷屏/挑衅 | 运营主观判断 |
| 多个相似昵称同时上榜 | 疑似养号群 |
| 玩家举报 | 群里/评论区收集 |

### 6.2 拉黑（一条命令）

```sql
-- 按昵称拉黑（推荐，昵称唯一可读）
update public.players set banned = true where nickname = '作弊者昵称';

-- 或按 player_id 拉黑（已知 ID 时）
update public.players set banned = true where id = 'uuid-here';
```

### 6.3 验证

```sql
-- 应返回 1 行（该玩家）
select nickname, banned from public.players where nickname = '作弊者昵称';
-- 应不再出现在榜单
select count(*) from public.leaderboard where nickname = '作弊者昵称'; -- = 0
```

### 6.4 误拉黑解除

```sql
update public.players set banned = false where nickname = '玩家昵称';
```

> ⚠️ **注意**：拉黑是**永久冻结**（分数保留但不再展示/上报）。如只是想冻结分数但不除名，当前系统不支持（无单独开关），按需演进。

---

## 七、排查手册（玩家反馈问题时的口径）

### 7.1 「我的分数不上/不显示」排查顺序

| 步骤 | 检查 | 处理 |
|------|------|-----|
| 1 | 是否旧缓存 bundle | **强制刷新**（Ctrl+F5 / 清缓存），旧 upsert 被新授权拒是头号原因 |
| 2 | 是否没填昵称 | 填昵称才上报（`submitScore` 无昵称直接 return） |
| 3 | Console 是否有 `rate implausible` | 说明速率被拒（理论上正常玩家不会；若出现查是否 age 计算异常） |
| 4 | Console 是否有 `player banned` | 被拉黑，按 6.4 判断是否误伤 |
| 5 | Console 是否有 UPDATE/INSERT 失败 | 网络/表结构问题，查 Supabase Logs |
| 6 | 排行榜是否打开时未刷新 | 关闭重开排行榜（每 10s 自动上报 + 打开时拉取） |

### 7.2 误锁判定

- 正常玩家（挂机几天、秒产 ~1e10~1e11）**不可能**触发 rate implausible（裕量 10~100 倍）。
- 若真有正常玩家被拒：查他的 `created_at`（5.1 #2）是否异常（比如建号时间被误改、或 supabase 项目刚建导致 age 极小）。**created_at 是服务端写入的，通常不会错**；真错了属于 Supabase 侧问题，可手动修正：
```sql
-- 极端情况下修正账号年龄（运营手动，慎重）
update public.players set created_at = now() - interval '3 days' where id = 'uuid-here';
```

### 7.3 头部玩家逼近上限的预判

- 速率核算 age×1e12 是**动态**的：age 越大上限越高，玩家只要持续玩就不会撞墙。
- 唯一可能：**单次超长离线收益**（离线 8h 上限封顶 8×3600×秒产，正常远低于 1e12/s 速率，安全）。

---

## 八、数据口径速查卡

| 数值 | 值 | 含义 |
|------|-----|------|
| rate_cap | 1e12/s | 速率上限：total ≤ 账号年龄(秒) × 1e12 |
| 绝对上限 | 1e18 | total 超过即拒（纯兜底） |
| form_level | 0~24 | 服务端按 total 重算（= 进化等级） |
| 昵称长度 | 1~16 字 | players 表 check 约束 |
| faction | kimi / dog | 白名单枚举 |
| 榜单长度 | top 100 | CONFIG.leaderboard.topN |
| 上报频率 | 每 10s + pagehide | 前端 submitScore 节流 |
| 正常玩家速率 | ~1e10~1e11/s | 观察值，裕量 10~100 倍 |

---

## 九、演进候选（未来可按需加）

1. **服务端产能重算**：把游戏产能公式移植云端，完全不用信任客户端上报（成本高，当前 Out of Scope）。
2. **异常波动告警**：Supabase Edge Function + cron 每日扫 5.1#3 并推送运营（当前手动跑 SQL）。
3. **分数衰减/冻结开关**：区分「拉黑除名」与「冻结不除名」两种运营动作。
4. **同设备多账号检测**：基于 IP/设备指纹（Supabase Auth 可看 last_sign_in_at），识别养号群。
5. **速率上限参数化**：rate_cap 提到 config 表可调，避免改函数（当前改函数即可，见下方运维提示）。

## 十、运维提示（改防作弊参数的方法）

- **改 rate_cap / 上限**：直接在 SQL Editor 改 `keep_max_score()` 函数体后执行 `create or replace function ...`（schema.sql §5 原样改数值再跑即可，幂等）。
- **改完必验**：跑 5.1#1 确认 trigger 仍存在（create or replace 不会丢 trigger）。
- **schema 文件同步**：线上改了，记得同步改 `docs/leaderboard-schema.sql`，保持文档=线上。

---

## 相关文档索引

- `docs/adr/0002-leaderboard-account-supabase.md` — 决策背景（含渗透复盘）
- `docs/leaderboard-schema.sql` — 建表/授权/触发器/视图唯一事实源（**以它为准**）
- `docs/anti-cheat-audit.sql` — 全榜速率核算 + 异常扫描（运营只读脚本）
- `spec/issues/07-current-state-handover.md` — 交接 PRD（含已知问题）
- `game/ui.js`（initSupabase / submitScore / renderLeaderboard）— 前端读写实现
- `game/config.js`（supabase / leaderboard 段）— 连接配置

---

## 附录：运营操作日志（每次核查/拉黑记一笔）

### 2026-08-16 首次全榜核查与拉黑

**背景**：对邦期间首次系统性反作弊核查。用 `docs/anti-cheat-audit.sql` ① 全榜速率核算 Top 60。

**判定口径**：
- 正常玩家速率观察值 ~1e10~1e11/s（裕量 10~100 倍）。
- 🚨 昵称自曝（代肝广告/作弊标记）→ 直接拉黑。
- ⚠️ 速率逼近上限（>5e11/s）但未超标 → 保留观察，不拉黑（运营判断，防误伤）。

**已拉黑（3 个，昵称自曝）**：
1. `曼波波波养猫代肝加vx`（dog）— 代肝广告，速率 3.3e11/s 超观察值 3 倍
2. `养猫科技.一键登顶.稳定不封.代`（kimi）— 代肝广告
3. `回归审计勿删`（kimi）— 昵称=作弊标记，42 分钟建号冲 5e14，数值恰好凑整 500000000000000

**拉黑 SQL**：`update public.players set banned = true where nickname in (...)` → 验证 `leaderboard` 视图 leaked=0 ✅

**保留观察（3 个，速率异常但未超标）**：
- `Cirno`（kimi）9.6e11/s 逼近硬上限 1e12，16.9h 满速
- `我是谁压实度`（dog）6.4e11/s，1.8h 建号冲到 4.12e15
- `Ab_Wesker`（dog）3.7e11/s，26 分钟建号 5.76e14

**观察要点**：若上述 3 个后续速率持续异常（不降速 / 短期冲 e17+），或触发 `rate implausible` 被拒，再评估拉黑。

**既有拉黑（本次核查发现的历史状态）**：`SilverWolfLv.999`（5e14）、`"素裳"`（9e14，created_at 显示 6.6 年前异常）。

**正常确认**：`胖宝宝`（2.3e10/s，PRD 认证真实头部玩家）、`caicai`、`Miko`、`狗叫曼波`、`0` 等速率均在正常区间。

---

### 2026-08-16（同日）误拉黑纠正：玩家申诉为正常游玩

**背景**：运营拉黑 `养猫科技.一键登顶.稳定不封.代`（当时判定为代肝广告号）；`cai`、`Ab_Wesker` 列入观察名单。玩家本人申诉三个均为正常游玩号。

**处置**：
- `update public.players set banned = false where nickname in ('cai','Ab_Wesker','养猫科技.一键登顶.稳定不封.代')` → 全部 banned=false ✅
- 验证 `leaderboard` 视图三账号均在榜且分数持续上涨（Ab_Wesker 5.76e14 → 1.26e15，证明持续正常上报）✅

**复盘教训**：
- **昵称含营销词 ≠ 作弊**：`养猫科技.一键登顶.稳定不封.代` 是玩家真实昵称（或玩家认可的风格），不能仅凭昵称判定拉黑；拉黑动作有"不可逆观感"（分数冻结+除名），应先用核算数据 + 玩家沟通再定。
- **速率偏高 ≠ 作弊**：`Ab_Wesker` 建号初期速率 3.7e11/s 接近观察上限，但实际是正常游玩（可能用了连点器/狂暴/多加速叠加，短期冲量），后续速率回落至正常区间。
- **更新判定口径**：拉黑仅限「确凿作弊」（如改请求绕过触发器被拒、速率硬超标 age×1e12、或玩家/官方确认作弊）；「昵称可疑」与「速率偏高」一律先沟通后处置。

**最终拉黑名单（本日有效）**：仅 `曼波波波养猫代肝加vx`、`回归审计勿删` 两个（昵称自曝 + 数值人为凑整，且无玩家申诉）。
**观察名单清空**：`cai`、`Ab_Wesker`、`养猫科技.一键登顶.稳定不封.代` 已确认正常移出；`Cirno`、`我是谁压实度` 经运营确认为正常玩家，一并移出观察名单（未拉黑过，无实际影响，仅文档清除）。
