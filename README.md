# 🎵 簡譜節拍師 v2.6 — Rhythm Beat Master

> **太鼓達人風格** × 簡譜節奏遊戲 × Web Audio API  
> 使用鍵盤或麥克風，跟著節拍打出完美判定！並解鎖多樣隱藏成就與獎勵！

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

### 🎨 UI/UX 設計 (v2.6 全新改版)
- **太鼓達人 (Taiko) 2D 視覺風格**
- 清爽的橫向卷軸設計，聚焦節奏打擊
- 動態打擊判定環與全新連擊特效
- 隨歌曲切換的響應式背景顏色搭配
- 支援 **RWD 響應式設計**（手機／平板／桌機）

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

### v2.6 (2026-03-10)
- ✅ **太鼓達人重製版 UI (Taiko Redesign)**：全新 2D 橫向卷軸介面。
- ✅ **動態成就系統 (Achievements System)**：全域紀錄解鎖進度。
- ✅ **解鎖獎勵 (Unlockables)**：新增隱藏曲目《卡農》與「太鼓」、「喵星人」等自訂音效。
- ✅ **Toast 解鎖動畫通知**：即時或結算時展示成就解鎖提示。
- ✅ **定音節拍器 (Metronome)**：新增練習節拍器功能與實用快捷開關。
- ✅ **Early / Late 判定提示**：更精準的打擊反饋。
- ✅ **打擊特效強化**：Combo 10x, 20x 觸發更絢麗的視覺回饋。

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

---

<!-- BEGIN:PROJECT_GUIDE -->
## 專案導覽

簡譜節拍師

- 專案定位：實用工具／自動化原型
- Repository：`cagoooo/music`
- 可見性：公開
- 主要技術：HTML
- 線上入口：未在 GitHub repository metadata 設定

### 可以怎麼應用

- 解決特定工作流程中的重複操作或資訊整理需求
- 作為相近工具的功能原型與程式碼參考
- 串接新的資料來源、服務或介面後延伸到其他情境

這些是依目前專案定位整理的延伸方向，不代表所有情境都已內建完成；實作前請先確認現有功能與資料格式。

### 技術與專案結構

- `README.md`
- `index.html`

檔案結構會隨版本演進；若本節與程式碼不一致，以目前預設分支的原始碼為準。

### 本機執行

這是可直接由瀏覽器載入的靜態網站。可用任一靜態檔案伺服器預覽，例如：
```bash
python -m http.server 8000
```
接著開啟 `http://localhost:8000`。請避免直接以 `file://` 測試需要模組、請求或 Service Worker 的功能。

### 給 AI Agent 的接手指南

1. 先閱讀本 README、`AGENTS.md`（若有）、套件腳本與部署設定。
2. 先從入口檔、設定檔與資料流確認真實行為，不要只依 repo 名稱推測。
3. 修改前檢查環境變數、外部服務、檔案格式與失敗處理。
4. 完成後執行既有檢查，並以最小可重現案例驗證主要流程。
5. 不要捏造尚未存在的功能；README 與實作有落差時，應同時更新文件。
6. 提交前只納入本次任務檔案，並記錄實際執行過的驗證。

### 安全與資料注意事項

- 不要提交 `.env`、服務帳號、API 金鑰、token、學生個資或正式環境匯出資料。
- 使用 Firebase、Supabase、Google API 或其他雲端服務時，請建立自己的測試專案並套用最小權限。
- 若要公開衍生作品，請先確認程式碼、圖片、音訊、字型與教材內容的授權。

### 貢獻與客製化

歡迎依教學現場、活動或工作流程需求進行 fork／客製化。建議在變更說明中交代使用情境、主要修改、測試方式，以及是否影響資料格式或部署設定。
<!-- END:PROJECT_GUIDE -->
