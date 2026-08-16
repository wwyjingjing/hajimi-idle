@echo off
chcp 65001 >nul
title 哈基米游戏 - GitHub Desktop 导入工具

echo ========================================
echo   哈基杯-基狗对邦 · GitHub Desktop 导入
echo ========================================
echo.
echo 正在查找 GitHub Desktop...

set "GITHUB_DESKTOP=%LOCALAPPDATA%\GitHubDesktop\GitHubDesktop.exe"

if not exist "%GITHUB_DESKTOP%" (
    echo ❌ 未找到 GitHub Desktop
    echo 请确认已安装 GitHub Desktop
    echo 下载地址: https://desktop.github.com
    pause
    exit /b 1
)

echo ✅ 找到 GitHub Desktop
echo.
echo 项目路径: F:\workbuddy\哈基杯-基狗对邦\hajimi-idle-2026-08-15
echo.
echo 正在打开 GitHub Desktop...
echo.
echo ⚠️  首次使用请按以下步骤操作：
echo    1. 点击 File → Add local repository...
echo    2. 点击 Choose... 选择项目文件夹
echo    3. 点击 Add repository
echo    4. 点击 Publish repository 发布到 GitHub
echo.

start "" "%GITHUB_DESKTOP%"

echo ✅ GitHub Desktop 已启动
echo.
pause
