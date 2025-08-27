# 🚀 快速部署指南

由於系統缺少必要的開發工具，請按照以下步驟手動完成部署：

## 📋 前置要求

### 1. 安裝必要工具
請訪問以下網站下載並安裝：

- **Git**: https://git-scm.com/download/win
- **Node.js**: https://nodejs.org/zh-cn/download/ (選擇 LTS 版本)
- **GitHub 帳戶**: https://github.com (如果沒有請註冊)
- **Vercel 帳戶**: https://vercel.com (可用 GitHub 帳戶登入)

### 2. 驗證安裝
安裝完成後，重新開啟命令提示字元並執行：
```bash
git --version
node --version
npm --version
```

## 🔧 部署步驟

### 步驟 1: 初始化 Git 倉庫
```bash
git init
git add .
git commit -m "Initial commit: Anime Streaming PWA"
```

### 步驟 2: 創建 GitHub 倉庫
1. 訪問 https://github.com/new
2. 倉庫名稱：`anime-streaming-pwa`
3. 設為公開倉庫
4. 不要初始化 README（因為本地已有文件）
5. 點擊「Create repository」

### 步驟 3: 推送代碼到 GitHub
```bash
git remote add origin https://github.com/你的用戶名/anime-streaming-pwa.git
git branch -M main
git push -u origin main
```

### 步驟 4: 部署到 Vercel
1. 訪問 https://vercel.com
2. 點擊「New Project」
3. 選擇剛創建的 GitHub 倉庫
4. 保持預設設定，點擊「Deploy」

### 步驟 5: 配置環境變數（可選）
如果要使用 Supabase 數據庫功能：

1. 在 Vercel 項目設定中找到「Environment Variables」
2. 添加以下變數：
   - `SUPABASE_URL`: 你的 Supabase 項目 URL
   - `SUPABASE_ANON_KEY`: 你的 Supabase 匿名密鑰
   - `NEXT_PUBLIC_SITE_URL`: 你的 Vercel 部署 URL
   - `NEXT_PUBLIC_APP_NAME`: Anime Streaming PWA

## 🎯 部署完成

部署成功後，你將獲得：
- 🌐 **線上網址**: `https://你的項目名.vercel.app`
- 📱 **PWA 功能**: 可安裝到手機桌面
- 🎬 **動漫串流**: 完整的動漫瀏覽和播放功能
- 📰 **新聞功能**: 最新動漫資訊
- 🔍 **搜索功能**: 智能搜索和篩選

## ❓ 遇到問題？

1. **Git 推送失敗**: 檢查 GitHub 用戶名和倉庫名是否正確
2. **Vercel 部署失敗**: 檢查 `vercel.json` 和 `package.json` 配置
3. **功能異常**: 檢查瀏覽器控制台是否有錯誤訊息

## 📞 技術支援

如需協助，請提供：
- 錯誤訊息截圖
- 瀏覽器控制台日誌
- 部署步驟詳情

---

**恭喜！** 🎉 你的動漫串流 PWA 應用已準備就緒！