# 🎵 簡譜節拍師 v2.0 — Rhythm Beat Master

> **霓虹電玩街機風格** × 簡譜節奏遊戲 × Web Audio API  
> 使用鍵盤或麥克風，跟著節拍打出完美判定！

---

## ✨ 功能特色

### 🎮 核心玩法
- **7 個按鍵**（1～7 對應 Do Re Mi Fa Sol La Si）跟著音符節拍
- 音符從右往左捲動，在**判定線**（菱形光柱）按下對應數字鍵
- 三種判定：**PERFECT**（金色）、**GOOD**（綠色）、**MISS**（紅色）
- 即時連擊數 COMBO 統計

### 🌟 五大高優先功能（v2.0 新增）
| 功能 | 說明 |
|---|---|
| 📁 模組化重構 | `game.js` / `input.js` / `index.js` ES Module 架構 |
| 🎵 背景旋律合成 | Web Audio API 即時合成，和倒數計時同步啟動 |
| 💾 LocalStorage 最高分 | 每首歌 × 每個難度分別記錄，選曲卡片顯示 PB 徽章 |
| 📱 觸控虛擬按鍵 | 多指同時觸控，支援行動裝置 |
| 🎯 四段難度調整 | 初學 / 一般 / 高手 / 地獄，改變 Perfect/Good 判定視窗 |

### 🎨 UI/UX 設計
- **霓虹電玩街（Neon Arcade Street）** 設計語言
- 幾何網格背景 + CRT 掃描線
- 3D 金屬光澤音符球（高光 + 內陰影）
- 3D 立體按鍵（下壓動畫 + 彩虹頂部光條）
- 星空粒子動態背景
- 完整 **RWD 響應式設計**（手機／平板／桌機）

---

## 🚀 快速開始

> ⚠️ 本專案使用 **ES Module**，需要 HTTP 伺服器，**不能直接雙擊開啟 index.html**

### 方法一：使用 http-server
```bash
npx http-server . -p 8787 -o
```

### 方法二：VS Code Live Server
安裝 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 擴充，右鍵 `index.html` → Open with Live Server

---

## 🎹 操作方式

| 鍵 | 功能 |
|---|---|
| `1` ～ `7` | 按下對應音符 |
| `ESC` | 暫停 / 繼續 |
| 觸控螢幕 | 點擊底部虛擬按鍵（支援多指） |

---

## 🎵 內建曲目

| 曲目 | 副標 | BPM | 難度 |
|---|---|---|---|
| 小星星 | Twinkle Twinkle Little Star | 96 | ⭐ |
| 生日快樂 | Happy Birthday to You | 88 | ⭐ |
| 兩隻老虎 | Are You Sleeping | 116 | ⭐ |
| 天黑黑 | 台灣童謠 | 108 | ⭐⭐ |
| 月亮代表我的心 | 鄧麗君 | 72 | ⭐⭐ |

歌曲資料儲存在 `songs/` 資料夾（JSON 格式），可自行新增。

---

## 📁 專案結構

```
music/
├── index.html      # 主頁面（霓虹電玩街 UI）
├── index.js        # 主控制器（UI 流程協調）
├── game.js         # 遊戲引擎（音符、判定、計分、音效）
├── input.js        # 輸入系統（鍵盤、麥克風、觸控）
├── songs/          # 曲目 JSON 資料
│   ├── xiao-xing-xing.json
│   ├── birthday.json
│   ├── liang-zhi-lao-hu.json
│   ├── tian-hei-hei.json
│   └── mao-mao-yu.json（月亮代表我的心）
└── assets/         # 靜態資源
```

---

## 🎯 難度說明

| 難度 | Perfect 視窗 | Good 視窗 |
|---|---|---|
| 🟢 初學 Easy | ±250ms | ±500ms |
| ⭐ 一般 Normal | ±150ms | ±320ms |
| 🔥 高手 Hard | ±80ms | ±180ms |
| 💀 地獄 Expert | ±40ms | ±100ms |

---

## 📝 輸入模式

| 模式 | 說明 |
|---|---|
| ⌨️ 鍵盤模式 | 鍵盤數字鍵 1～7 |
| 🎤 麥克風模式 | 唱出音階自動偵測 |
| ✏️ 自訂樂譜 | 手動輸入簡譜數字，即興演奏 |

---

## 🔧 技術架構

- **Pure HTML/CSS/JS**（零框架，零建構工具）
- **ES Module** 模組化
- **Web Audio API** — 音效合成 + 麥克風音高偵測
- **requestAnimationFrame** — 60fps 遊戲迴圈
- **performance.now()** — 精確時間軸
- **localStorage** — 最高分持久化
- **Google Fonts** — Black Han Sans + Orbitron + Rajdhani

---

## 📋 版本紀錄

### v2.0 (2026-03-08)
- ✅ 模組化重構（game.js / input.js / index.js）
- ✅ 背景旋律 Web Audio 合成
- ✅ LocalStorage 最高分 + 選曲 PB 徽章
- ✅ 觸控多指虛擬按鍵
- ✅ 四段難度（初學/一般/高手/地獄）
- ✅ 全局 UI 大改版：霓虹電玩街 3D 風格

### v1.0 (2026-03-07)
- ✅ 基礎遊戲架構（單一 HTML）
- ✅ 鍵盤 + 麥克風輸入
- ✅ 選曲、遊戲、結果三畫面
- ✅ 粒子爆炸、判定動畫

---

## 📄 授權

MIT License — 歡迎自由使用與修改
