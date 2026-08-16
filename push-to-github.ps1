# 哈基杯-基狗对邦 · 推送到 GitHub 脚本
# 用法：右键 → 使用 PowerShell 运行

$repoPath = "F:\workbuddy\哈基杯-基狗对邦\hajimi-idle-2026-08-15"
Set-Location $repoPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  哈基米挂机游戏 - GitHub 推送工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否有未提交的修改
$status = git status --short
if ($status) {
    Write-Host "📦 发现未提交的修改：" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    
    $commitMsg = Read-Host "请输入提交信息（直接回车使用默认）"
    if (-not $commitMsg) {
        $commitMsg = "update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
    
    git add -A
    git commit -m "$commitMsg"
    Write-Host "✅ 提交成功" -ForegroundColor Green
} else {
    Write-Host "✅ 没有未提交的修改" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 正在推送到 GitHub..." -ForegroundColor Cyan
Write-Host "   如果弹出登录窗口，请使用你的 GitHub 账号登录" -ForegroundColor Yellow
Write-Host "   或者输入用户名和 Personal Access Token" -ForegroundColor Yellow
Write-Host ""

# 推送
git push -u origin master

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ 推送成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 仓库地址: https://github.com/wwyjingjing/hajimi-idle" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 提示：Git Credential Manager 已记住你的登录信息，" -ForegroundColor Gray
    Write-Host "   下次推送不需要再输入密码。" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ❌ 推送失败" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的原因：" -ForegroundColor Yellow
    Write-Host "1. 网络连接问题" -ForegroundColor Yellow
    Write-Host "2. GitHub 账号或 Token 错误" -ForegroundColor Yellow
    Write-Host "3. 仓库不存在（需要先创建）" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "解决方法：" -ForegroundColor Cyan
    Write-Host "1. 访问 https://github.com/new 创建仓库" -ForegroundColor Cyan
    Write-Host "2. 仓库名称填：hajimi-idle" -ForegroundColor Cyan
    Write-Host "3. 不要勾选 'Initialize with README'" -ForegroundColor Cyan
    Write-Host "4. 重新运行此脚本" -ForegroundColor Cyan
}

Write-Host ""
Pause
