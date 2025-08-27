# 手動部署指南

由於系統缺少必要的開發工具，請按照以下步驟手動完成部署：

## 第一步：安裝必要工具

### 1. 安裝 Git
- 訪問 https://git-scm.com/download/win
- 下載並安裝 Git for Windows
- 安裝完成後重啟命令提示符

### 2. 安裝 Node.js 和 npm
- 訪問 https://nodejs.org/
- 下載並安裝 LTS 版本
- 這將同時安裝 npm

### 3. 安裝 Vercel CLI（可選）
```bash
npm install -g vercel
```

## 第二步：創建 GitHub 倉庫

### 方法一：使用 GitHub 網站
1. 訪問 https://github.com
2. 點擊右上角的 "+" 按鈕
3. 選擇 "New repository"
4. 填寫倉庫信息：
   - Repository name: `anime-streaming-pwa`
   - Description: `A modern anime streaming PWA with Supabase integration`
   - 選擇 Public
   - 勾選 "Add a README file"
5. 點擊 "Create repository"

## 第三步：上傳代碼到 GitHub

### 在項目目錄中執行以下命令：

```bash
# 初始化 Git 倉庫
git init

# 添加所有文件
git add .

# 提交代碼
git commit -m "Initial commit: Anime streaming PWA with Supabase integration"

# 添加遠程倉庫（替換 YOUR_USERNAME 為你的 GitHub 用戶名）
git remote add origin https://github.com/YOUR_USERNAME/anime-streaming-pwa.git

# 推送代碼
git push -u origin main
```

## 第四步：部署到 Vercel

### 方法一：使用 Vercel 網站（推薦）
1. 訪問 https://vercel.com
2. 使用 GitHub 帳號登錄
3. 點擊 "New Project"
4. 選擇你剛創建的 `anime-streaming-pwa` 倉庫
5. 點擊 "Import"
6. 在環境變數設定中添加：
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   NEXT_PUBLIC_APP_NAME=Anime Streaming PWA
   ```
7. 點擊 "Deploy"

### 方法二：使用 Vercel CLI
```bash
# 登錄 Vercel
vercel login

# 部署項目
vercel

# 設定環境變數
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 重新部署以應用環境變數
vercel --prod
```

## 第五步：設定 Supabase 數據庫

### 1. 創建 Supabase 項目
1. 訪問 https://supabase.com
2. 創建新項目
3. 記錄項目 URL 和 API 密鑰

### 2. 創建數據庫表
在 Supabase SQL 編輯器中執行以下 SQL：

```sql
-- 用戶偏好設定表
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  language VARCHAR(10) DEFAULT 'zh-TW',
  theme VARCHAR(20) DEFAULT 'dark',
  auto_play BOOLEAN DEFAULT true,
  subtitle_language VARCHAR(10) DEFAULT 'zh-TW',
  video_quality VARCHAR(10) DEFAULT 'auto',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 觀看清單表
CREATE TABLE watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id VARCHAR(50) NOT NULL,
  anime_title VARCHAR(255) NOT NULL,
  anime_image VARCHAR(500),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 觀看進度表
CREATE TABLE watch_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id VARCHAR(50) NOT NULL,
  episode_number INTEGER NOT NULL,
  progress_seconds INTEGER DEFAULT 0,
  total_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, anime_id, episode_number)
);

-- 啟用 RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_progress ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own watchlist" ON watchlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own watchlist" ON watchlist
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON watch_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON watch_progress
  FOR ALL USING (auth.uid() = user_id);
```

## 第六步：驗證部署

1. 訪問你的 Vercel 部署 URL
2. 檢查應用是否正常載入
3. 測試 PWA 功能（離線支援、安裝提示）
4. 驗證 Supabase 連接（檢查瀏覽器控制台是否有錯誤）

## 部署完成後你將獲得：

- **主要 URL**: `https://your-project-name.vercel.app`
- **預覽 URL**: 每次推送代碼時的臨時 URL
- **自定義域名**: 可在 Vercel 設定中配置

## 故障排除

### 常見問題：
1. **Supabase 連接失敗**: 檢查環境變數是否正確設定
2. **CORS 錯誤**: 在 Supabase 設定中添加你的域名到允許清單
3. **PWA 不工作**: 確保使用 HTTPS 連接
4. **視頻無法播放**: 檢查視頻源 URL 和 CORS 設定

## 聯繫支援

如果遇到問題，請檢查：
- Vercel 部署日誌
- 瀏覽器開發者工具控制台
- Supabase 項目日誌

---

**注意**: 請確保在生產環境中使用真實的動漫視頻源，並遵守相關版權法律。