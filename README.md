# 動漫串流應用 (Anime Streaming App)

一個現代化的漸進式網頁應用程式 (PWA)，提供動漫串流服務，整合 Supabase 數據庫和 Vercel 部署。

## 🌟 功能特色

### 核心功能
- 🎬 **動漫串流**：高品質動漫視頻播放
- 📱 **PWA 支援**：可安裝到設備主屏幕
- 🌐 **多語言支援**：中文、英文、日文、韓文
- 🎤 **語音搜索**：支援語音輸入搜索功能
- 📊 **智能分類**：按類型、狀態、評分等多維度分類

### 數據庫功能 (Supabase)
- 👤 **用戶偏好**：保存個人化設置
- 📝 **觀看清單**：收藏喜愛的動漫
- 📈 **觀看進度**：記錄播放進度
- 🔒 **安全認證**：行級安全性保護

### 技術特色
- ⚡ **快速載入**：Service Worker 緩存策略
- 📱 **響應式設計**：適配各種設備尺寸
- 🔄 **離線支援**：部分功能可離線使用
- 🎨 **現代 UI**：美觀的用戶界面設計

## 🚀 快速開始

### 本地開發

1. **克隆項目**
```bash
git clone <your-repository-url>
cd anime-streaming-app
```

2. **設置環境變數**
```bash
cp .env.example .env.local
# 編輯 .env.local 並填入您的 Supabase 配置
```

3. **啟動開發服務器**
```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js (如果已安裝)
npx serve .
```

4. **訪問應用**
打開瀏覽器訪問 `http://localhost:8000`

### 部署到 Vercel

詳細部署指南請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📁 項目結構

```
├── index.html              # 主頁面
├── script.js              # 主要 JavaScript 邏輯
├── styles.css             # 樣式文件
├── sw.js                  # Service Worker
├── manifest.json          # PWA 清單文件
├── vercel.json           # Vercel 配置
├── package.json          # 項目依賴
├── .env.example          # 環境變數模板
├── .gitignore            # Git 忽略文件
├── DEPLOYMENT.md         # 部署指南
├── README.md             # 項目說明
└── icons/                # PWA 圖標
    ├── icon-72x72.svg
    ├── icon-96x96.svg
    ├── icon-128x128.svg
    ├── icon-144x144.svg
    ├── icon-152x152.svg
    ├── icon-192x192.svg
    ├── icon-384x384.svg
    └── icon-512x512.svg
```

## 🔧 配置說明

### 環境變數

創建 `.env.local` 文件並配置以下變數：

```env
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 可選配置
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_NAME=Anime Streaming App
```

### Supabase 設置

1. 創建 Supabase 項目
2. 執行 `DEPLOYMENT.md` 中的 SQL 腳本創建數據表
3. 配置行級安全性 (RLS) 政策
4. 獲取 API 密鑰並配置環境變數

## 🛠️ 開發指南

### 主要組件

- **DatabaseService**: Supabase 數據庫操作封裝
- **AnimeService**: 動漫數據處理和 API 調用
- **UIManager**: 用戶界面管理和更新
- **CacheManager**: Service Worker 緩存管理

### API 集成

- **Jikan API**: 免費動漫數據 API
- **Kitsu API**: 備用動漫數據源
- **Supabase**: 用戶數據和偏好存儲

### 緩存策略

- **靜態資源**: Cache First 策略
- **動態內容**: Network First 策略
- **圖片資源**: 專用圖片緩存
- **API 響應**: 智能緩存和更新

## 📱 PWA 功能

### 安裝提示
應用會自動檢測安裝條件並顯示安裝提示

### 離線支援
- 緩存的頁面和資源可離線訪問
- 離線狀態指示器
- 網絡恢復時自動同步

### 推送通知
- 新動漫更新通知
- 觀看提醒
- 系統消息

## 🌍 多語言支援

支援的語言：
- 🇹🇼 繁體中文 (預設)
- 🇺🇸 English
- 🇯🇵 日本語
- 🇰🇷 한국어

語言設置會自動保存到本地存儲。

## 🔒 安全性

### 數據保護
- 行級安全性 (RLS) 保護用戶數據
- API 密鑰環境變數管理
- HTTPS 強制加密傳輸

### 內容安全
- CSP 頭部配置
- XSS 防護
- 安全的 iframe 嵌入

## 📊 性能優化

### 載入優化
- 圖片懶加載
- 代碼分割
- 資源預載入
- Service Worker 緩存

### 運行時優化
- 虛擬滾動
- 防抖搜索
- 內存管理
- 錯誤邊界

## 🐛 故障排除

### 常見問題

1. **Supabase 連接失敗**
   - 檢查環境變數配置
   - 確認 API 密鑰有效性
   - 檢查網絡連接

2. **視頻播放問題**
   - 檢查視頻源 URL
   - 確認瀏覽器支援
   - 檢查網絡速度

3. **PWA 安裝問題**
   - 確認 HTTPS 連接
   - 檢查 manifest.json
   - 驗證 Service Worker

### 調試工具

- 瀏覽器開發者工具
- Vercel 部署日誌
- Supabase 儀表板
- Service Worker 調試

## 🤝 貢獻指南

1. Fork 項目
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權條款

本項目採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件

## 🙏 致謝

- [Supabase](https://supabase.com) - 後端即服務平台
- [Vercel](https://vercel.com) - 部署和託管平台
- [Jikan API](https://jikan.moe) - 動漫數據 API
- [Kitsu API](https://kitsu.docs.apiary.io) - 備用動漫數據源

## 📞 聯繫方式

- 項目維護者: [Your Name]
- Email: [your.email@example.com]
- GitHub: [https://github.com/yourusername]

---

**最後更新**: 2024年12月19日  
**版本**: v1.0.0