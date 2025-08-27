#!/usr/bin/env node

// Vercel 構建腳本 - 處理環境變數注入
const fs = require('fs');
const path = require('path');

console.log('🔧 開始構建過程...');

// 讀取 index.html
const indexPath = path.join(__dirname, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// 替換環境變數佔位符
const envVars = {
    'SUPABASE_URL': process.env.SUPABASE_URL || '',
    'SUPABASE_ANON_KEY': process.env.SUPABASE_ANON_KEY || '',
    'NEXT_PUBLIC_SITE_URL': process.env.NEXT_PUBLIC_SITE_URL || '',
    'NEXT_PUBLIC_APP_NAME': process.env.NEXT_PUBLIC_APP_NAME || 'Anime Streaming PWA'
};

Object.entries(envVars).forEach(([key, value]) => {
    const placeholder = `{{ ${key} }}`;
    indexContent = indexContent.replace(new RegExp(placeholder, 'g'), value);
    console.log(`✅ 替換 ${key}: ${value ? '已設定' : '未設定'}`);
});

// 創建構建目錄
const buildDir = path.join(__dirname, 'dist');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
}

// 寫入處理後的 index.html
fs.writeFileSync(path.join(buildDir, 'index.html'), indexContent);

// 複製其他必要文件
const filesToCopy = [
    'styles.css',
    'script.js',
    'sw.js',
    'manifest.json',
    'vercel.json'
];

filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(buildDir, file));
        console.log(`📄 複製文件: ${file}`);
    }
});

// 複製圖標文件
const iconFiles = fs.readdirSync(__dirname).filter(file => file.startsWith('icon-') && file.endsWith('.svg'));
iconFiles.forEach(file => {
    fs.copyFileSync(file, path.join(buildDir, file));
    console.log(`🎨 複製圖標: ${file}`);
});

console.log('🎉 構建完成！');
console.log(`📁 輸出目錄: ${buildDir}`);