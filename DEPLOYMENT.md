# 部署指南 - Vercel + Supabase

本指南將幫助您將動漫串流應用部署到 Vercel 並連接 Supabase 數據庫。

## 前置準備

### 1. Supabase 設置

1. 前往 [Supabase](https://supabase.com) 並創建新項目
2. 在項目儀表板中，前往 **Settings > API**
3. 記錄以下信息：
   - `Project URL`
   - `anon public` 密鑰
   - `service_role` 密鑰（可選，用於服務端操作）

### 2. 數據庫表結構

在 Supabase SQL 編輯器中執行以下 SQL 來創建必要的表：

```sql
-- 用戶偏好設置表
CREATE TABLE user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    preferences JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 觀看清單表
CREATE TABLE watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    anime_id TEXT NOT NULL,
    anime_data JSONB NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, anime_id)
);

-- 觀看進度表
CREATE TABLE watch_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    anime_id TEXT NOT NULL,
    episode INTEGER NOT NULL,
    progress FLOAT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, anime_id, episode)
);

-- 創建索引以提高查詢性能
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_watchlist_anime_id ON watchlist(anime_id);
CREATE INDEX idx_watch_progress_user_id ON watch_progress(user_id);
CREATE INDEX idx_watch_progress_anime_id ON watch_progress(anime_id);

-- 啟用行級安全性 (RLS)
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_progress ENABLE ROW LEVEL SECURITY;

-- 創建 RLS 政策（允許用戶只能訪問自己的數據）
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own watchlist" ON watchlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist" ON watchlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist" ON watchlist
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON watch_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON watch_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON watch_progress
    FOR UPDATE USING (auth.uid() = user_id);
```

## Vercel 部署步驟

### 方法一：通過 Vercel 儀表板

1. 前往 [Vercel](https://vercel.com) 並登入
2. 點擊 "New Project"
3. 導入您的 Git 存儲庫
4. 在 "Environment Variables" 部分添加以下變數：
   - `SUPABASE_URL`: 您的 Supabase 項目 URL
   - `SUPABASE_ANON_KEY`: 您的 Supabase anon 密鑰
   - `SUPABASE_SERVICE_ROLE_KEY`: 您的 Supabase service role 密鑰（可選）
5. 點擊 "Deploy"

### 方法二：通過 Vercel CLI

1. 安裝 Vercel CLI：
```bash
npm i -g vercel
```

2. 在項目根目錄執行：
```bash
vercel login
vercel
```

3. 設置環境變數：
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

4. 重新部署：
```bash
vercel --prod
```

## 環境變數設置

### 必需的環境變數

| 變數名 | 描述 | 範例 |
|--------|------|------|
| `SUPABASE_URL` | Supabase 項目 URL | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase 匿名密鑰 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### 可選的環境變數

| 變數名 | 描述 | 範例 |
|--------|------|------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服務角色密鑰 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_SITE_URL` | 網站 URL | `https://your-app.vercel.app` |

## 驗證部署

部署完成後，請執行以下檢查：

1. **訪問網站**：確保網站能正常載入
2. **檢查控制台**：打開瀏覽器開發者工具，確保沒有 JavaScript 錯誤
3. **測試 Supabase 連接**：檢查控制台是否顯示 "Supabase client initialized successfully"
4. **測試功能**：嘗試添加動漫到觀看清單（如果已實現用戶認證）

## 故障排除

### 常見問題

1. **Supabase 連接失敗**
   - 檢查環境變數是否正確設置
   - 確認 Supabase 項目狀態正常
   - 檢查 API 密鑰是否有效

2. **CORS 錯誤**
   - 在 Supabase 項目設置中添加您的 Vercel 域名到允許的來源

3. **數據庫操作失敗**
   - 檢查 RLS 政策是否正確設置
   - 確認表結構是否正確創建

4. **環境變數未生效**
   - 重新部署項目
   - 檢查變數名稱是否正確

### 調試技巧

1. 檢查 Vercel 部署日誌
2. 使用瀏覽器開發者工具檢查網絡請求
3. 檢查 Supabase 項目的 API 日誌

## 更新和維護

### 定期更新

1. **依賴更新**：定期更新 Supabase 客戶端庫
2. **安全更新**：定期輪換 API 密鑰
3. **備份**：定期備份 Supabase 數據庫

### 監控

1. 設置 Vercel 分析以監控性能
2. 使用 Supabase 儀表板監控數據庫使用情況
3. 設置錯誤追蹤（如 Sentry）

## 支援

如果遇到問題，請檢查：
- [Vercel 文檔](https://vercel.com/docs)
- [Supabase 文檔](https://supabase.com/docs)
- 項目的 GitHub Issues

---

**最後更新**：2024年12月19日
**版本**：v1.0