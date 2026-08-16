# 给 AI 的版本更新操作说明（如何基于 GitHub 仓库迭代本项目）

> 本文档写给接手本项目的 AI（或开发者）：请严格按此流程更新版本。所有命令、路径、红线均为实测有效。

---

## 0. 项目是什么

「哈基杯-基狗对邦 · 挂机养成小游戏」：纯前端 H5 挂机游戏（类 Cookie Clicker），养哈基米/哈基汪两阵营对邦引流用。
- 线上地址：`https://ea8df52043fd4121a761eed0a3e2c2c4.app.workbuddy.link/`（v0.7 已构建待部署；当前源码版本号见 index.html）
- GitHub 仓库：`https://github.com/wwyjingjing/hajimi-idle`（唯一版本源）
- 云端后端：Supabase 项目 `sboaeygtztyubizypvrc`（仅排行榜/账号用，anon key 在 `game/config.js`）

---

## 1. 获取代码

```bash
# 克隆（只读获取）
git clone https://github.com/wwyjingjing/hajimi-idle.git
cd hajimi-idle

# 本地已有副本时，拉取最新
git pull origin master
```

**约定**：只维护 `master` 分支；每次迭代 = 新 commit 推送到 `master`。

---

## 2. 环境与路径（Windows 本机，重要）

- **Node.js**：系统 PATH 未配置 node，必须用全路径：
  ```
  C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node.exe
  ```
  下文所有 `node` 命令请替换为该路径，或先 `$env:Path += ";C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2"`。
- **测试**：项目内已装 vitest（`game/node_modules` 存在，无需 npm install；若缺失则 `npm ci`）。
- **GitHub 推送**：本机 GitHub Desktop 已登录（token 存于 Windows 凭据管理器）。命令行推送若遇 `sh.exe signal pipe` 崩溃 / 提示输入用户名，用下面「推送」章节的 URL 内嵌 token 方式（token 可从凭据管理器读取，见第 8 节）。

---

## 3. 项目结构（必须理解）

```
hajimi-idle/
├── spec/
│   ├── spec.md                          # 基线规格
│   └── issues/                          # 实现票 PRD（01 骨架 → 07 现状交接 → 08 榜单安全）
├── docs/
│   ├── adr/0002-leaderboard-account-supabase.md   # 排行榜安全设计决策
│   ├── leaderboard-schema.sql          # Supabase 建表/授权/触发器（唯一事实源）
│   └── 宣传视频脚本.md / 15秒广告视频提示词.md / B站Toy宣传帖与测试申请.md  # 营销素材
├── game/                               # ★ 源码
│   ├── index.html                      # 入口页面（含版本号第 137 行）
│   ├── config.js                       # ★ 单一配置：数值/文案/跳转/Supabase 连接
│   ├── core.js                         # ★ 纯逻辑核心（无 DOM，可测试）
│   ├── ui.js                           # ★ 渲染层 + localStorage + 事件 + 排行榜上报
│   ├── core.test.js                    # Vitest 测试（57 用例，唯一测试 seam）
│   ├── build.mjs                       # 打包脚本（config+core+ui → app.bundle.js）
│   ├── server.mjs                      # 本地预览服务器
│   ├── assets/                         # 动物形态图片（kimi-0~24.png / dog-0~24.png）
│   ├── package.json                    # vitest 依赖
│   └── deploy/                         # ★ 部署目录（只放 index.html + app.bundle.js + assets/）
└── README.md / DEPLOY.md
```

**模块铁律**：
- 游戏逻辑一律写 `core.js`（纯函数，时钟/随机数/存储注入，不碰 DOM）。
- 页面渲染/事件/localStorage 写 `ui.js`。
- 数值与文案改 `config.js`（不要散落硬编码）。
- **不要手改 `app.bundle.js`**（由 build.mjs 生成）。

---

## 4. 测试（每改必跑）

```bash
cd game
<node路径> ./node_modules/vitest/vitest.mjs run --pool=threads
```

- 期望输出：`core.test.js (57 tests)` 全绿。
- 新增/修改 core.js 行为时**必须**同步补测试用例（时钟/随机数注入，只测外部行为）。
- 云端（Supabase）行为**不写进 Vitest**，用真实客户端验证（打开本地预览手动测，或复用 `game/_verify_security.mjs` 范式）。

---

## 5. 本地预览

```bash
cd game
<node路径> server.mjs
```

浏览器打开 `http://127.0.0.1:8322`。

---

## 6. 修改→构建→部署 完整流程（每次迭代）

```bash
# ① 改源码（config.js / core.js / ui.js / index.html）
# ② 跑测试确保全绿
# ③ 更新版本号：index.html 第 137 行 <p class="sub">v0.XX</p>（如 v0.64）
# ④ 打包
cd game
<node路径> build.mjs          # 生成 app.bundle.js

# ⑤ 同步到部署目录（只同步 3 样）
copy index.html      deploy\index.html
copy app.bundle.js   deploy\app.bundle.js
xcopy assets         deploy\assets /E /I /Y

# ⑥ 部署（WorkBuddy 平台工具，命令行不可直接用）
#    用 WorkBuddy 执行：workbuddy_cloudstudio_deploy --directory F:\...\hajimi-idle\game\deploy
#    部署后返回线上地址，务必用浏览器打开验证功能 + 版本号

# ⑦ 提交推送（见第 8 节）
```

> ⚠️ 部署必须用 `game/deploy/`（精简目录），**不要**用 `game/`（含 node_modules 会导致 CloudStudio 504）。

---

## 7. 榜单安全红线（改代码时绝对不要破坏）

排行榜由 Supabase 云端防作弊，**前端任何改动都绕不开云端校验**，但有几条红线：

1. **不要改 `docs/leaderboard-schema.sql` 的授权/触发器/视图结构**（除非是安全专项迭代，且需同步执行到 Supabase 并更新 08 PRD）。
2. **前端上报保持「两步走」**（`ui.js` 的 `submitScore`：先 UPDATE 未命中再 INSERT），**不要改回 upsert**（upsert 需整表 SELECT 权限，会泄露数据被拒绝）。
3. **客户端不可写/读的列**（`players.created_at`/`banned`、`scores.updated_at`/`form_level`）前端一律不碰。
4. **昵称弹窗 `#overlay-nickname` 必须 z-index 35**（高于其他弹窗 30），否则会被排行榜遮挡。
5. 玩家反馈「分数不上/不显示」：先让玩家**强制刷新**（旧缓存 bundle 的 upsert 被新授权拒绝是头号原因）；真有问题看浏览器 Console 的 `[排行榜]` 日志（rate implausible / player banned 等）。
6. **人界/封神榜双榜（v0.8）**：`leaderboard` 视图 = 人界榜（`total < 1e18`），`leaderboard_immortal` 视图 = 封神榜（`total >= 1e18`，飞升玩家；2026-08-15 前端展示名由「仙界」改「封神榜」，**视图名不改**），前端「🐉 封神榜」tab 查该视图。两个视图**必须同步维护**：改人界榜过滤条件时封神榜视图也要对应改；绝对上限 1e24（通关目标），**不要再降回 1e18**（会重新封顶飞升玩家）。
7. 防作弊完整机制见 `spec/issues/08-leaderboard-security-ops.md`（含监控 SQL、拉黑 SOP、排查手册、双榜设计日志），改动前必读。

---

## 8. 推送回 GitHub（本机已踩平的坑）

```bash
cd hajimi-idle
git add -A
git commit -m "feat: <一句话描述>"
```

**推送的两种方式（任选）**：

### 方式 A：GitHub Desktop（最稳）
打开 GitHub Desktop → 仓库 hajimi-idle → 左下角填 Summary → Commit to master → 顶部 **Push origin**。

### 方式 B：命令行（需 token）
本机 Git 命令行的凭据提示器会因沙箱环境崩溃（sh.exe signal pipe），直接推会报 `could not read Username`。解法：
1. 从 Windows 凭据管理器读 GitHub Desktop 的 token（target 名 `GitHub - https://api.github.com/wwyjingjing`，PowerShell CredRead 读 CredentialBlob，UTF-8 解码，`gho_` 开头）。
2. 用 URL 内嵌 token 推送（token 不在配置落盘）：
```bash
git push "https://wwyjingjing:<TOKEN>@github.com/wwyjingjing/hajimi-idle.git" master
```
3. 网络间歇超时属正常，重试 2-3 次即可。

---

## 9. 回退版本（GitHub 上操作）

- **回退到历史版本**（GitHub 网页）：仓库 → Commits → 找到目标 commit → `...` → **Revert**（生成反向 commit，不动历史）。
- **本地强回退**（慎用，会丢之后的提交）：
```bash
git log --oneline            # 看 commit 列表
git reset --hard <commit-hash>
git push -f origin master    # 强制推送覆盖远程
```

---

## 10. 当前已知待办候选（按需实现，别自作主张全做）

见 `spec/issues/07-current-state-handover.md` 的 Further Notes：
1. 新池子数值微调（亿亿亿圣殿 cost 6e23 贴近通关目标 1e24）；「亿亿亿圣殿」成就/新闻文案补一句。
2. 拉黑名单运营（把作弊昵称发运营，SQL：`update players set banned=true where nickname='...'`）。
3. 短链计数服务开通（原 06 遗留）。
4. 若要对邦结算/复盘，汇总榜单快照。

**迭代前先问运营要本次需求**，不要自行扩大范围。

---

## 11. 交接核对清单（每次接手后先做）

- [ ] `git pull` 拿到最新代码
- [ ] 跑通 57 个 Vitest 用例
- [ ] 本地预览 `http://127.0.0.1:8322` 能玩
- [ ] 读 `spec/issues/08-leaderboard-security-ops.md` 了解防作弊现状（防止改坏）
- [ ] 确认线上版本号与本地 index.html 一致（不一致说明上次没部署，问运营）
