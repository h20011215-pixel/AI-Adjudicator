// ============================================================
// mockService.js — Mock 模式假資料模組
// ============================================================

// 模擬延遲
function mockDelay(ms = 1500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 預定義的模擬問題庫
const MOCK_QUESTIONS = [
  {
    question: '你們在企劃書中提到目標市場規模為 50 億元，這個數字的計算依據是什麼？是採用 TAM、SAM 還是 SOM？請具體說明推估方式。',
    scopeLevel: 'detail',
    answerType: 'closed',
    purpose: '驗證市場規模估算的可靠性與方法論',
    difficulty: 3,
    followUpRecommended: false,
  },
  {
    question: '你們的商業模式中提到訂閱制與廣告收入雙軌並行，但這兩種模式在用戶體驗上可能產生衝突。你如何平衡免費用戶的廣告體驗與付費用戶的無廣告承諾？',
    scopeLevel: 'balanced',
    answerType: 'open',
    purpose: '測試商業模式內部一致性與策略思考深度',
    difficulty: 4,
    followUpRecommended: false,
  },
  {
    question: '根據你們的財務預測，預計第二年就能達到損益兩平，但你們的客戶獲取成本（CAC）與客戶終身價值（LTV）比率是多少？這個時程是否過於樂觀？',
    scopeLevel: 'detail',
    answerType: 'mixed',
    purpose: '檢驗財務預測的合理性與關鍵假設',
    difficulty: 4,
    followUpRecommended: true,
  },
  {
    question: '你們列出了三個主要競爭對手，但似乎忽略了近期剛獲得 A 輪融資的新進者。面對這類具有資金優勢的競爭者，你們的護城河是什麼？',
    scopeLevel: 'topic',
    answerType: 'open',
    purpose: '評估競爭分析的完整性與防禦策略',
    difficulty: 3,
    followUpRecommended: false,
  },
  {
    question: '你們的技術架構選擇了微服務架構，但團隊目前只有三位工程師。在人力有限的情況下，為什麼不考慮先用單體架構快速迭代？請說明技術決策的權衡。',
    scopeLevel: 'detail',
    answerType: 'open',
    purpose: '測試技術可行性與資源配置的現實考量',
    difficulty: 4,
    followUpRecommended: false,
  },
  {
    question: '你們提到第一年預計獲取 10,000 名用戶，具體的行銷管道策略是什麼？各管道預期的轉換率和成本分別是多少？',
    scopeLevel: 'detail',
    answerType: 'closed',
    purpose: '驗證用戶獲取策略的具體性和可執行性',
    difficulty: 3,
    followUpRecommended: true,
  },
  {
    question: '如果你們最大的假設——用戶願意為此服務付費——被證明是錯誤的，你們的 Plan B 是什麼？',
    scopeLevel: 'topic',
    answerType: 'open',
    purpose: '評估風險管理能力與應變思維',
    difficulty: 5,
    followUpRecommended: false,
  },
  {
    question: '你們的營運策略中提到要在六個月內進入東南亞市場，但沒有提到在地化的具體計畫。語言、法規、支付方式等本地化挑戰，你們有什麼應對方案？',
    scopeLevel: 'balanced',
    answerType: 'open',
    purpose: '檢視國際化策略的深度和可行性',
    difficulty: 4,
    followUpRecommended: false,
  },
];

// 模擬評分回覆
function generateMockFeedback(answer) {
  const len = answer.length;
  const baseScore = Math.min(9, Math.max(4, 5 + len / 100));
  const variance = () => (Math.random() - 0.5) * 1.5;

  const completeness = Math.max(1, Math.min(10, Math.round((baseScore + variance()) * 10) / 10));
  const correctness = Math.max(1, Math.min(10, Math.round((baseScore + variance()) * 10) / 10));
  const logic = Math.max(1, Math.min(10, Math.round((baseScore + variance() + 0.3) * 10) / 10));
  const persuasiveness = Math.max(1, Math.min(10, Math.round((baseScore + variance()) * 10) / 10));
  const responsiveness = Math.max(1, Math.min(10, Math.round((baseScore + variance() + 0.5) * 10) / 10));

  const overall = Math.round(
    ((completeness + correctness * 1.2 + logic + persuasiveness + responsiveness * 1.2) / 5.4) * 10
  ) / 10;

  const shouldFollowUp = len < 80 || Math.random() > 0.6;

  return {
    overallScore: Math.max(1, Math.min(10, overall)),
    dimensionScores: { completeness, correctness, logic, persuasiveness, responsiveness },
    strengths: [
      '回答有一定的結構性',
      len > 100 ? '內容涵蓋面較廣' : '回答簡潔有力',
      '展現了對主題的基本理解',
    ].slice(0, 2 + Math.floor(Math.random() * 2)),
    weaknesses: [
      len < 80 ? '回答篇幅不足，缺少具體細節' : '部分論述可以更加深入',
      '缺少具體數據支撐',
      '可以加入更多實際案例佐證',
    ].slice(0, 1 + Math.floor(Math.random() * 2)),
    feedback: `整體而言，你的回答${overall >= 7 ? '表現良好' : overall >= 5 ? '尚可但有改進空間' : '需要大幅加強'}。${len < 50 ? '回答過於簡短，建議提供更完整的論述。' : '建議可以補充更多具體數據和案例來增強說服力。'}`,
    improvementAdvice: '建議在回答時先重述問題核心，再分點陳述觀點，最後以數據或案例佐證。這樣的結構會讓回答更有說服力。',
    shouldFollowUp,
    followUpQuestion: shouldFollowUp
      ? '你剛才提到的策略聽起來有道理，但能否具體說明第一階段的執行步驟和時間表？'
      : '',
    modelAnswer: '以這道題目為例，一個高分回答應該包含以下結構：\n\n首先，直接回應問題核心——我們的市場規模估算採用由上而下（TAM→SAM→SOM）方法。根據 IDC 2024 年報告，全球相關產業規模約 200 億美元（TAM），台灣市場佔比約 2.5%，即 50 億元（SAM）。考量我們第一年僅鎖定中小企業客群（約佔 SAM 的 30%），可觸及市場約 15 億元（SOM）。\n\n其次，補充假設驗證——這個推估已透過訪談 50 家潛在客戶進行交叉驗證，其中 68% 表示願意嘗試。\n\n最後，展示風險意識——即使實際市場僅達推估的 50%，仍足以支撐我們的損益兩平目標。',
  };
}

let questionIndex = 0;

/**
 * Mock: 上傳檔案
 */
export async function mockUploadFiles(files) {
  await mockDelay(800);
  return files.map((f) => ({
    fileId: f.id,
    uri: `mock://files/${f.name}`,
    mimeType: f.mimeType,
    name: f.name,
    textContent: `【模擬文件內容：${f.name}】\n這是模擬模式下的文件內容。在真實模式下，系統會擷取文件中的實際內容供 AI 評審參考。`,
  }));
}

/**
 * Mock: 生成評審問題
 */
export async function mockGenerateQuestion() {
  await mockDelay(1200 + Math.random() * 800);
  const q = MOCK_QUESTIONS[questionIndex % MOCK_QUESTIONS.length];
  questionIndex++;
  return { ...q };
}

/**
 * Mock: 評分回答
 */
export async function mockScoreAnswer(answer) {
  await mockDelay(1500 + Math.random() * 1000);
  return generateMockFeedback(answer);
}

/**
 * 重置 mock 索引
 */
export function resetMockIndex() {
  questionIndex = 0;
}
