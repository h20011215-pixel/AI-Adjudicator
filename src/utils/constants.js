// ============================================================
// constants.js — 全域常數定義
// ============================================================

export const GEMINI_API_KEY = ''; // 使用者透過網頁右上角「API Key」按鈕自行填入

export const GEMINI_MODEL = 'gemini-2.5-flash';

export const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// 支援的檔案類型
export const SUPPORTED_EXTENSIONS = ['pdf', 'pptx', 'docx', 'txt'];

export const MIME_TYPES = {
  pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
};

// Gemini Files API 只支援 PDF，其他格式需前端擷取文字
export const GEMINI_NATIVE_TYPES = ['pdf'];

// 檔案大小限制（50MB — Gemini PDF 上限）
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// 評審風格選項
export const JUDGE_STYLES = [
  { value: 'friendly', label: '友善' },
  { value: 'professional', label: '專業' },
  { value: 'neutral', label: '中立' },
  { value: 'strict', label: '嚴格' },
  { value: 'stress', label: '壓力測試' },
];

// 問題領域選項
export const DOMAIN_OPTIONS = [
  { value: 'business_model', label: '商業模式' },
  { value: 'market_analysis', label: '市場分析' },
  { value: 'financial_projection', label: '財務推估' },
  { value: 'operation_strategy', label: '營運策略' },
  { value: 'tech_feasibility', label: '技術可行性' },
  { value: 'risk_management', label: '風險控管' },
  { value: 'presentation', label: '簡報表達' },
  { value: 'competitive_advantage', label: '競爭優勢' },
  { value: 'regulation', label: '法規' },
  { value: 'other', label: '其他' },
];

// 回答字數限制
export const ANSWER_LENGTH_OPTIONS = [
  { value: 'short', label: '短答（50~100字）', hint: '簡潔扼要' },
  { value: 'medium', label: '中答（100~300字）', hint: '結構化回答' },
  { value: 'long', label: '長答（300字以上）', hint: '完整論述' },
];

// 難度等級描述
export const DIFFICULTY_LABELS = [
  '入門',
  '基礎',
  '進階',
  '困難',
  '極限',
];

// Scope level descriptions for prompt building
export const SCOPE_DESCRIPTIONS = {
  low: '偏向主題/大方向：請問高層次的願景、核心價值、目標市場定位、整體策略方向',
  mid: '均衡：請混合問商業邏輯、競爭分析、執行計畫合理性',
  high: '偏向細節/數據/執行面：請問具體數字計算、假設依據、執行時間表、成本結構',
};

// Answer type descriptions for prompt building
export const TYPE_DESCRIPTIONS = {
  low: '偏向有唯一或較明確答案：請問事實、定義、計算、資料一致性',
  mid: '均衡：請混合事實確認與策略判斷',
  high: '偏向開放式/策略型回答：請問策略取捨、風險因應、情境假設',
};

// Judge style descriptions for prompt building
export const STYLE_DESCRIPTIONS = {
  friendly: '語氣友善溫和，給予鼓勵，但仍保持專業提問深度',
  professional: '語氣專業中性，直接切入重點，不帶情感',
  neutral: '不帶任何情感色彩，純粹就事論事',
  strict: '語氣嚴格，會挑戰回答中的漏洞和不一致之處',
  stress: '壓力測試模式，會刻意追問、質疑、挑戰極限',
};

// 維度名稱對照
export const DIMENSION_LABELS = {
  completeness: '完整度',
  correctness: '正確度',
  logic: '邏輯性',
  persuasiveness: '說服力',
  responsiveness: '應變能力',
};

// 預設設定
export const DEFAULT_SETTINGS = {
  scopeLevel: 50,
  answerType: 50,
  difficulty: 3,
  judgeStyle: 'professional',
  domains: ['business_model', 'market_analysis'],
  showHints: true,
  answerLength: 'medium',
  totalRounds: 0,
};
