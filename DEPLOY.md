# 哈基杯-基狗对邦 · 养成小游戏（养哈基米）部署指南

> 本文档面向后续接手的 Agent / 开发者，说明如何构建并发布这个纯静态小游戏。

## 项目结构

```
hajimi-idle-2026-08-15/
├── game/                 # 源码目录
│   ├── index.html        # 入口页面
│   ├── app.bundle.js     # 由 build.mjs 合并 config.js + core.js + ui.js 生成
│   ├── config.js         # 数值、文案、跳转目标、分享链接等配置
│   ├── core.js           # 纯逻辑核心（喂食、池子、进化、加速、任务等）
│   ├── ui.js             # 渲染层与事件绑定
│   ├── build.mjs         # 零依赖打包脚本
│   ├── server.mjs        # 本地开发服务器（可选）
│   ├── assets/           # 动物形象图片（png/svg）
│   └── deploy/           # 用于 CloudStudio 部署的精简目录
└── DEPLOY.md             # 本文件
```

## 构建步骤

编辑 `config.js` / `core.js` / `ui.js` 后，必须重新打包：

```bash
node game/build.mjs
```

该脚本会读取 `config.js` + `core.js` + `ui.js`，去掉 import/export，合并成一份可直接被 `<script src>` 引用的 `app.bundle.js`。

> 注意：本游戏是纯静态页面，没有构建器（webpack/vite 等），不要手动编辑 `app.bundle.js`。

## 本地预览（可选）

```bash
cd game
node server.mjs
```

默认监听 `http://127.0.0.1:8080`，可直接用浏览器打开验证。

## 部署步骤

### 1. 准备精简部署目录

**不要**直接部署整个 `game/` 目录（里面包含 `node_modules`、测试文件、源码等），否则 CloudStudio 后端启动会 504 超时。

需要把以下文件复制到 `game/deploy/`：

- `index.html`
- `app.bundle.js`
- `assets/` 目录（内含动物形象图片）

可用以下 PowerShell / Bash 命令：

```bash
mkdir -p game/deploy
cp game/index.html game/deploy/index.html
cp game/app.bundle.js game/deploy/app.bundle.js
cp -r game/assets game/deploy/assets
```

### 2. 部署到 CloudStudio

使用 WorkBuddy 的 CloudStudio 部署工具，目标目录选择 `game/deploy/`：

```
workbuddy_cloudstudio_deploy --directory F:\workbuddy\哈基杯-基狗对邦\hajimi-idle-2026-08-15\game\deploy
```

部署成功后会返回类似：

```
https://ea8df52043fd4121a761eed0a3e2c2c4.app.workbuddy.link
```

该链接就是外部可访问的公开地址，可在 QQ / 微信 / 浏览器中打开。

### 3. 验证

部署后建议立即用 curl 验证是否 200：

```bash
curl -sI --max-time 10 https://<sandbox-id>.app.workbuddy.link
```

正常应返回 `HTTP/1.1 200 OK`。

## 版本更新流程

1. 修改源码（`config.js` / `core.js` / `ui.js` / `index.html`）。
2. 更新 `index.html` 中的版本号（如 `v0.3`）。
3. 运行 `node game/build.mjs` 重新生成 `app.bundle.js`。
4. 把 `index.html`、`app.bundle.js`、`assets/` 同步到 `game/deploy/`。
5. 调用 `workbuddy_cloudstudio_deploy` 重新部署。
6. 用 curl 或浏览器验证线上版本号与功能。

## 重要注意事项

1. **必须打包后再部署**：直接改 `ui.js` 不运行 `build.mjs`，线上不会生效。
2. **必须部署 `game/deploy/` 而不是 `game/`**：前者只含 3 个必要文件，后者含 `node_modules` 会导致 CloudStudio 启动失败。
3. **分享链接要同步更新**：`config.js` 中的 `CONFIG.share.link` 应和当前部署后的地址保持一致，否则分享出去的入口会错。
4. **localStorage 存档 key**：当前是 `hajimi-idle.save.v1`，不要与其他游戏冲突。

## 已知兼容性问题

### QQ 内置浏览器「去看应援」无法获得加速卡

**原因**：QQ 内置浏览器会拦截 `window.open('_blank')`，且页面切到后台后 `setTimeout` 常被挂起，导致原本"跳转 2.5 秒后再发加速卡"的逻辑失效。

**修复方案**（已在 `ui.js` 的 `doSupply()` 中实现）：

- 点击按钮后**立即**调用 `claimBoost()` 发放加速卡并 `persist()` 写入 localStorage。
- 然后再尝试 `window.open()` 打开应援视频。
- 即使弹窗被拦截，用户回退到游戏时加速卡也已经到账。

后续如需调整领奖时机，应保证"发放 + 持久化"在跳转前同步完成。

## 联系

- 官方 QQ 群：`765996335`
- 对邦看板：见 `config.js` 中 `CONFIG.board.url`
