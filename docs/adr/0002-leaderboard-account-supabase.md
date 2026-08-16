# 排行榜与账号系统：Supabase 托管 + 匿名登录轻量账号

养成小游戏此前是纯前端 + localStorage 单 key 存档、零后端。新增排行榜（按累计养出 10²⁴ 排名，可阵营分榜）与账号系统，决策引入 Supabase（托管 Postgres + Auth + REST）作为唯一后端，账号采用轻量方案：Supabase 匿名登录自动生成玩家 ID，玩家自填昵称、无密码。

## 背景
- 硬约束：纯前端 H5、零运维、活动向（哈基杯-基狗对邦）、玩家零门槛、静态托管（workbuddy.link）。
- 反作弊现实：客户端可改 localStorage / 伪造请求，接受"君子协定 + 基础防护"档位。

## 决策
1. 后端：Supabase（免费额度）——数据库 / Auth / REST API / RLS 一体，无需服务器、无需 ICP 备案。
2. 账号：匿名登录（`signInAnonymously` → `auth.uid()` 即玩家 ID）+ 昵称自填；不做用户名密码、不做第三方登录。
3. 分数：上报累计养出 `totalProduced`（游戏内天然单调），`scores` 表每玩家一行、只增不减（触发器取历史峰值）。
4. 上报时机：游戏内每 10s + 切后台/关页（`pagehide`）时**两步走**上报（先 UPDATE 未命中再 INSERT；不用 upsert——upsert 需整表 SELECT 权限，会泄露原始数据）。
5. 前端接入：`index.html` 用 CDN 引入 supabase-js（不改打包器），`config.js` 放 `supabase.url / anonKey`。

## 安全设计（2026-08 攻击复盘后定稿）
一次渗透测试绕开前端直打 Supabase REST，暴露了 RLS 只挡"行"不挡"列"的根因：`created_at`/`banned` 等本应服务端独占的字段对客户端开放写权限，锚点一崩整条防线失效（把 created_at 改成 2020 年即可伪造"六岁账号"绕过全部校验）。据此定稿：

1. **列级授权（核心防线）**：`players.created_at`/`banned`、`scores.updated_at`/`form_level` 客户端**不可读不可写**，服务端独占。客户端仅可写白名单列（昵称/阵营/分数/游玩时长）。
2. **速率核算锚定账号年龄**：`total ≤ (now - created_at) × 1e12`（created_at 服务端写入、不可伪造）。早期版本用客户端 `play_seconds` 核算，旧客户端不传该字段导致全部误锁，已废弃该设计——play_seconds 仅作展示/参考字段保留。配合 ① 绝对上限 1e15 ② 增量 ≤1e14 ③ 只增不减 ④ form_level 服务端重算（杜绝"25 级配 1e13"自相矛盾），作弊者被复合兜底。
3. **scores 不加外键**：FK 校验会强制 anon 对 players 有表级 SELECT，从而暴露锚点列；归属由 RLS「仅本人行」+ 触发器自查兜底，孤儿行不影响展示。
4. **触发器 SECURITY DEFINER**：内部查 `players.created_at/banned` 以属主身份执行，避免被列级授权挡住。
5. **读路径脱敏**：匿名只能读 `leaderboard` 视图（仅 player_id/nickname/faction/total_produced 4 列、过滤拉黑）；scores 原表零 SELECT，players 仅 3 列可见。作弊者无法读榜校准、无法看他人年龄。
6. **拉黑机制**：`players.banned` 服务端管理（运营一条命令拉黑），拉黑后视图不展示且禁止上报；客户端无法自解封。

## 表结构（详见 `docs/leaderboard-schema.sql`）
- `players(id = auth.uid(), nickname, faction, banned, created_at)`
- `scores(player_id, total_produced, count, form_level, play_seconds, updated_at)`

## 残余风险（已接受）
- **养号只能真等**：created_at 不可伪造后，批量注册养数小时再写满仍可行（上限 1e15 + 增量 ≤1e14 兜底）——账号年龄是"延迟"而非"阻断"，纯前端信任问题无根治方案。
- 最终排名建议**运营人工复核** top 玩家建档时间与拉黑名单，配合君子协定声明。

## 被否决
- 自建 Node/VPS：要运维、国内绑域名需备案、成本高。
- 用户名密码 / QQ 微信登录：门槛高，与活动向零门槛目标冲突。
- 纯前端 localStorage 伪排行榜：无服务器无法跨玩家排名，直接不可行。
