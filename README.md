# AI 評審模擬器 | Pitch Judge Simulator

上傳企劃書或簡報，讓 AI 模擬真實比賽評審進行 Q&A 問答、評分與回饋。

## 快速開始

```bash
cd pitch-judge-simulator
npm install
npm run dev
```

開啟瀏覽器至 `http://localhost:5173/`

## 設定 API Key

在 `src/utils/constants.js` 中填入你的 Gemini API Key：

```javascript
export const GEMINI_API_KEY = '你的_API_KEY';
```

或在網頁右上角點擊「🔑 API Key」按鈕設定。

**未填入 API Key 時，系統會自動切換為模擬模式（使用假資料展示完整流程）。**

## 功能

- 📁 上傳 PDF / PPTX / DOCX / TXT 檔案
- ⚙️ 自訂評審風格、難度、問題範圍
- ⚖️ AI 依據文件內容出題並評分
- 📊 即時分數總覽與維度分析
- 📋 完整問答歷史紀錄
- 📥 匯出 JSON / Markdown / 純文字報告
- 🌓 深色 / 淺色主題切換

## 技術架構

- React + Vite
- Gemini API (REST)
- mammoth.js (DOCX 解析)
- JSZip (PPTX 解析)
- Vanilla CSS (自訂設計系統)

## 檔案結構

```
src/
├── context/AppContext.jsx     # 全域狀態管理
├── services/
│   ├── geminiService.js       # Gemini API 封裝
│   ├── mockService.js         # 模擬模式假資料
│   ├── promptBuilder.js       # Prompt 組裝
│   ├── schemaValidator.js     # JSON 驗證
│   ├── fileProcessor.js       # 檔案文字擷取
│   └── exportService.js       # 匯出報告
├── components/
│   ├── Header.jsx
│   ├── ApiKeyModal.jsx
│   ├── upload/UploadPanel.jsx
│   ├── settings/SettingsPanel.jsx
│   ├── judge/JudgePanel.jsx
│   ├── score/ScorePanel.jsx
│   ├── history/HistoryPanel.jsx
│   └── summary/SummaryModal.jsx
├── utils/constants.js
├── App.jsx
├── App.css
└── main.jsx
```
