# GitHub Desktop 操作指南（中文对照）

## 第一步：打开 GitHub Desktop

找到桌面上的 **GitHub Desktop** 图标，双击打开。

界面是英文的，但跟着我的步骤做就行。

---

## 第二步：登录 GitHub 账号

1. 点击左上角的 **File** → **Options**（或按 Ctrl+,）
2. 选择 **Accounts** 标签
3. 点击 **Sign in to GitHub.com**
4. 浏览器会打开登录页面，登录你的 GitHub 账号
5. 授权完成后回到 Desktop

---

## 第三步：导入本地项目

### 方法 A：直接添加现有仓库（推荐）

1. 点击左上角的 **File** → **Add local repository...**
   （文件 → 添加本地仓库）

2. 点击 **Choose...** 按钮

3. 浏览到项目文件夹：
   ```
   F:\workbuddy\哈基杯-基狗对邦\hajimi-idle-2026-08-15
   ```

4. 点击 **Add repository**（添加仓库）

---

## 第四步：发布到 GitHub

添加仓库后，界面会显示：

```
No remote configured（未配置远程仓库）
Publish this repository to GitHub（发布此仓库到 GitHub）
```

点击 **Publish repository** 按钮。

### 填写信息：

| 英文 | 中文 | 填写内容 |
|------|------|---------|
| Name | 仓库名 | `hajimi-idle` |
| Description | 描述 | `哈基杯-基狗对邦 · 挂机养成游戏` |
| ☑️ Keep this code private | 保持私有 | 取消勾选（如果你想公开） |

点击 **Publish repository** 发布。

---

## 第五步：等待上传完成

上传过程会显示进度条：

```
Pushing to origin...（推送到远程）
```

完成后会显示：

```
Last fetched just now（刚刚获取）
```

---

## 第六步：验证上传

点击界面右上角的 **View on GitHub**（在 GitHub 上查看）按钮。

浏览器会打开：
```
https://github.com/wwyjingjing/hajimi-idle
```

---

## 界面翻译对照

### 主界面

| 英文 | 中文 | 功能 |
|------|------|------|
| Current repository | 当前仓库 | 显示当前项目名 |
| Current branch | 当前分支 | 显示当前分支（默认 master） |
| Changes | 更改 | 显示修改的文件 |
| History | 历史 | 显示提交历史 |
| Fetch origin | 获取远程 | 拉取远程更新 |
| Pull origin | 拉取远程 | 下载远程更改 |
| Push origin | 推送到远程 | 上传本地更改 |

### 菜单栏

| 英文 | 中文 | 功能 |
|------|------|------|
| File | 文件 | 新建/添加/克隆仓库 |
| Edit | 编辑 | 撤销/重做/偏好设置 |
| View | 查看 | 刷新/全屏 |
| Repository | 仓库 | 在浏览器中打开/在命令行中打开 |
| Branch | 分支 | 新建/重命名/删除分支 |
| Help | 帮助 | 文档/关于 |

### 提交区域（左下角）

| 英文 | 中文 | 功能 |
|------|------|------|
| Summary (required) | 摘要（必填） | 提交信息标题 |
| Description | 描述 | 提交信息详情 |
| Commit to master | 提交到 master | 保存更改 |
| Push origin | 推送到远程 | 上传到 GitHub |

---

## 日常迭代操作

### 1. 修改代码后提交

1. 修改文件（用 VS Code 或其他编辑器）
2. 回到 GitHub Desktop
3. 在 **Changes** 标签看到修改的文件
4. 勾选要提交的文件
5. 填写 **Summary**（例如：`feat: 新增改名字功能`）
6. 点击 **Commit to master**
7. 点击 **Push origin** 上传到 GitHub

### 2. 查看历史

点击 **History** 标签，可以看到所有提交记录。

### 3. 回退版本

1. 点击 **History** 标签
2. 右键点击要回退的提交
3. 选择 **Revert this commit**（撤销此提交）

---

## 常见问题

### Q: 提示 "Authentication failed"
A: 需要重新登录。File → Options → Accounts → Sign out → 重新 Sign in

### Q: 提示 "Failed to publish"
A: 检查网络连接，或仓库名是否已存在

### Q: 文件没有显示在 Changes 中
A: 点击 Repository → Refresh（刷新）

### Q: 想改回中文界面
A: GitHub Desktop 没有官方中文，但操作很简单，记住上面的对照表即可

---

## 快捷操作

| 快捷键 | 功能 |
|--------|------|
| Ctrl + , | 打开设置 |
| Ctrl + P | 推送 |
| Ctrl + Shift + P | 拉取 |
| Ctrl + Enter | 提交 |
| Ctrl + T | 新建分支 |
| Ctrl + Shift + A | 添加本地仓库 |
| Ctrl + Shift + O | 在浏览器中打开 |
| Ctrl + Shift + F | 在文件资源管理器中打开 |
