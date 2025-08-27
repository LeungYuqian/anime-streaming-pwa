@echo off
chcp 65001 >nul
echo ===================================
echo    動漫串流 PWA 快速部署腳本
echo ===================================
echo.

echo 正在檢查系統環境...

:: 檢查 Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [錯誤] 未找到 Git，請先安裝 Git
    echo 下載地址: https://git-scm.com/download/win
    pause
    exit /b 1
)

:: 檢查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [錯誤] 未找到 Node.js，請先安裝 Node.js
    echo 下載地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [成功] 系統環境檢查完成
echo.

:: 安裝 Vercel CLI
echo 正在安裝 Vercel CLI...
npm install -g vercel

:: 初始化 Git 倉庫
echo 正在初始化 Git 倉庫...
git init
git add .
git commit -m "Initial commit: Anime streaming PWA with Supabase integration"

echo.
echo ===================================
echo        手動步驟指引
echo ===================================
echo 1. 訪問 https://github.com/new
echo 2. 創建名為 'anime-streaming-pwa' 的倉庫
echo 3. 複製倉庫 URL
echo.
set /p repoUrl=請輸入您的 GitHub 倉庫 URL: 

if "%repoUrl%"=="" (
    echo [錯誤] 未提供倉庫 URL
    pause
    exit /b 1
)

echo 正在推送代碼到 GitHub...
git remote add origin %repoUrl%
git branch -M main
git push -u origin main

echo.
echo [成功] 代碼推送完成！
echo.
echo 正在啟動 Vercel 部署...
vercel login
vercel --prod

echo.
echo ===================================
echo         部署完成！
echo ===================================
echo 請在 Vercel Dashboard 中設定環境變數：
echo - SUPABASE_URL
echo - SUPABASE_ANON_KEY  
echo - SUPABASE_SERVICE_ROLE_KEY
echo.
echo 詳細配置請參考 DEPLOYMENT.md
echo.
pause