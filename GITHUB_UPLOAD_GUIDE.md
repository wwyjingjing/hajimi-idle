# GitHub 手动上传指南

## 项目信息

- **仓库名**: `hajimi-idle`
- **本地路径**: `F:\workbuddy\哈基杯-基狗对邦\hajimi-idle-2026-08-15`
- **ZIP 文件**: `F:\workbuddy\hajimi-idle.zip` (约 19.4 MB)
- **Git 提交**: `7a25419` (Initial commit: v0.6)

---

## 上传步骤

### 1. 创建 GitHub 仓库

访问 https://github.com/new

填写信息：
- **Repository name**: `hajimi-idle`
- **Description**: `哈基杯-基狗对邦 · 挂机养成游戏`
- **Visibility**: Public（或 Private）
- **☑️ Add a README file**: 勾选（这样可以直接在线编辑）
- **☑️ Add .gitignore**: 选择 `Node`
- **License**: 不需要

点击 **Create repository**

---

### 2. 上传文件

创建仓库后，点击页面中间的 **"uploading an existing file"** 链接。

或者：
1. 点击仓库页面的 **"<> Code"** 标签
2. 点击 **"Add file"** 下拉菜单
3. 选择 **"Upload files"**

---

### 3. 拖放 ZIP 文件

将 `F:\workbuddy\hajimi-idle.zip` 拖放到上传区域。

**注意**: GitHub 网页上传限制 **25MB**，我们的 ZIP 是 19.4MB，可以上传。

---

### 4. 提交上传

在页面底部填写提交信息：
- **Commit changes**: 选择 "Create a new branch for this commit and start a pull request"
- 分支名: `upload-initial`

点击 **Commit changes**

---

### 5. 解压 ZIP（在 GitHub 上）

GitHub 不会自动解压 ZIP，你需要：

**方案 A：本地解压后上传文件夹**
1. 在本地解压 `hajimi-idle.zip`
2. 进入解压后的文件夹
3. 选择所有文件和文件夹
4. 拖放到 GitHub 上传页面

**方案 B：使用 GitHub Desktop（推荐）**
1. 下载安装 GitHub Desktop: https://desktop.github.com
2. 登录你的 GitHub 账号
3. 选择 "Clone a repository from the Internet"
4. 选择 `wwyjingjing/hajimi-idle`
5. 本地路径选择解压后的文件夹
6. 同步上传

---

### 6. 验证上传

上传完成后，仓库结构应该是：

```
hajimi-idle/
├── docs/              # 文档和营销素材
│   ├── 15秒广告视频提示词.md
│   ├── B站Toy宣传帖与测试申请.md
│   ├── 宣传视频脚本.md
│   ├── leaderboard-schema.sql
│   └── adr/
├── game/              # 游戏源码
│   ├── config.js      # 配置
│   ├── core.js        # 核心逻辑
│   ├── ui.js          # 渲染层
│   ├── core.test.js   # 测试
│   ├── build.mjs      # 构建脚本
│   ├── server.mjs     # 本地预览
│   ├── index.html     # 入口
│   ├── package.json
│   └── deploy/        # 部署产物
├── spec/              # PRD 规范
│   ├── spec.md
│   └── issues/
├── .gitignore
└── README.md
```

---

## 后续迭代工作流

### 在 GitHub 网页上编辑（简单修改）

1. 打开文件
2. 点击右上角 **铅笔图标** (Edit)
3. 修改内容
4. 底部填写提交信息
5. 点击 **Commit changes**

### 使用 GitHub Codespaces（在线 IDE）

1. 仓库页面点击 **"<> Code"**
2. 选择 **"Codespaces"** 标签
3. 点击 **"Create codespace on master"**
4. 在线编辑，自动保存提交

### 等有网络后用 Git 推送

```powershell
cd "F:\workbuddy\哈基杯-基狗对邦\hajimi-idle-2026-08-15"
git remote add origin https://github.com/wwyjingjing/hajimi-idle.git
git push -u origin master
```

---

## 重要文件说明

| 文件 | 说明 |
|------|------|
| `game/config.js` | 数值配置（通关目标、池子、进化等） |
| `game/core.js` | 纯逻辑核心（可测试） |
| `game/ui.js` | 渲染层（DOM 操作） |
| `game/core.test.js` | 57 个 Vitest 用例 |
| `game/build.mjs` | 打包脚本 |
| `docs/leaderboard-schema.sql` | Supabase 数据库结构 |
| `docs/adr/` | 架构决策记录 |

---

## 联系方式

如有问题，通过 GitHub Issues 或 QQ 群 765996335 联系。
