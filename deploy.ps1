# 動漫串流 PWA 自動部署腳本
# 此腳本將自動安裝必要工具並完成部署

Write-Host "=== 動漫串流 PWA 自動部署腳本 ===" -ForegroundColor Green
Write-Host "正在檢查系統環境..." -ForegroundColor Yellow

# 檢查並安裝 Chocolatey（Windows 包管理器）
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "正在安裝 Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    refreshenv
}

# 檢查並安裝 Git
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "正在安裝 Git..." -ForegroundColor Yellow
    choco install git -y
    refreshenv
}

# 檢查並安裝 Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "正在安裝 Node.js..." -ForegroundColor Yellow
    choco install nodejs -y
    refreshenv
}

# 檢查並安裝 Vercel CLI
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "正在安裝 Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host "\n=== 工具安裝完成，開始部署流程 ===" -ForegroundColor Green

# 初始化 Git 倉庫
Write-Host "正在初始化 Git 倉庫..." -ForegroundColor Yellow
git init
git add .
git commit -m "Initial commit: Anime streaming PWA with Supabase integration"

# 提示用戶創建 GitHub 倉庫
Write-Host "\n=== 請完成以下步驟 ===" -ForegroundColor Cyan
Write-Host "1. 訪問 https://github.com/new" -ForegroundColor White
Write-Host "2. 創建名為 'anime-streaming-pwa' 的新倉庫" -ForegroundColor White
Write-Host "3. 選擇 Public，不要勾選 'Add a README file'" -ForegroundColor White
Write-Host "4. 點擊 'Create repository'" -ForegroundColor White
Write-Host "5. 複製倉庫 URL（例如：https://github.com/yourusername/anime-streaming-pwa.git）" -ForegroundColor White

$repoUrl = Read-Host "\n請輸入您的 GitHub 倉庫 URL"

if ($repoUrl) {
    Write-Host "正在推送代碼到 GitHub..." -ForegroundColor Yellow
    git remote add origin $repoUrl
    git branch -M main
    git push -u origin main
    
    Write-Host "\n=== 代碼推送完成！ ===" -ForegroundColor Green
    
    # 提示 Vercel 部署
    Write-Host "\n=== Vercel 部署步驟 ===" -ForegroundColor Cyan
    Write-Host "現在將開始 Vercel 部署流程..." -ForegroundColor Yellow
    
    # 登錄 Vercel
    Write-Host "請在瀏覽器中完成 Vercel 登錄..." -ForegroundColor Yellow
    vercel login
    
    # 部署項目
    Write-Host "正在部署項目..." -ForegroundColor Yellow
    vercel --prod
    
    Write-Host "\n=== 部署完成！ ===" -ForegroundColor Green
    Write-Host "\n接下來請完成以下配置：" -ForegroundColor Cyan
    Write-Host "1. 在 Vercel Dashboard 中設定環境變數：" -ForegroundColor White
    Write-Host "   - SUPABASE_URL" -ForegroundColor Gray
    Write-Host "   - SUPABASE_ANON_KEY" -ForegroundColor Gray
    Write-Host "   - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Gray
    Write-Host "2. 在 Supabase 中創建數據庫表（參考 DEPLOYMENT.md）" -ForegroundColor White
    Write-Host "3. 測試應用功能" -ForegroundColor White
    
} else {
    Write-Host "未提供倉庫 URL，請手動完成 GitHub 推送和 Vercel 部署" -ForegroundColor Red
}

Write-Host "\n=== 部署腳本執行完成 ===" -ForegroundColor Green
Write-Host "詳細說明請參考 DEPLOYMENT.md 和 MANUAL_DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow

Pause