// ============================================================
// schemaValidator.js — JSON Schema 驗證
// ============================================================

/**
 * 驗證問題生成結果
 */
export function validateQuestionSchema(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['回傳不是有效的 JSON 物件'] };
  }
  if (typeof obj.question !== 'string' || !obj.question.trim()) {
    errors.push('缺少 question 欄位或為空');
  }
  if (!['topic', 'balanced', 'detail'].includes(obj.scopeLevel)) {
    errors.push(`scopeLevel 無效: ${obj.scopeLevel}`);
    obj.scopeLevel = 'balanced'; // fallback
  }
  if (!['closed', 'mixed', 'open'].includes(obj.answerType)) {
    errors.push(`answerType 無效: ${obj.answerType}`);
    obj.answerType = 'mixed'; // fallback
  }
  if (typeof obj.purpose !== 'string') {
    obj.purpose = '';
  }
  if (typeof obj.difficulty !== 'number' || obj.difficulty < 1 || obj.difficulty > 5) {
    obj.difficulty = 3;
  }
  if (typeof obj.followUpRecommended !== 'boolean') {
    obj.followUpRecommended = false;
  }
  return { valid: errors.length === 0, errors, data: obj };
}

/**
 * 驗證評分結果
 */
export function validateFeedbackSchema(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['回傳不是有效的 JSON 物件'] };
  }

  // overallScore
  if (typeof obj.overallScore !== 'number' || obj.overallScore < 1 || obj.overallScore > 10) {
    errors.push(`overallScore 無效: ${obj.overallScore}`);
    obj.overallScore = Math.max(1, Math.min(10, Number(obj.overallScore) || 5));
  }

  // dimensionScores
  if (!obj.dimensionScores || typeof obj.dimensionScores !== 'object') {
    errors.push('缺少 dimensionScores');
    obj.dimensionScores = {
      completeness: 5, correctness: 5, logic: 5, persuasiveness: 5, responsiveness: 5,
    };
  } else {
    const dims = ['completeness', 'correctness', 'logic', 'persuasiveness', 'responsiveness'];
    for (const dim of dims) {
      if (typeof obj.dimensionScores[dim] !== 'number') {
        obj.dimensionScores[dim] = 5;
        errors.push(`dimensionScores.${dim} 不是數字`);
      } else {
        obj.dimensionScores[dim] = Math.max(1, Math.min(10, obj.dimensionScores[dim]));
      }
    }
  }

  // 陣列欄位
  if (!Array.isArray(obj.strengths)) obj.strengths = [];
  if (!Array.isArray(obj.weaknesses)) obj.weaknesses = [];

  // 字串欄位
  if (typeof obj.feedback !== 'string') obj.feedback = '';
  if (typeof obj.improvementAdvice !== 'string') obj.improvementAdvice = '';
  if (typeof obj.shouldFollowUp !== 'boolean') obj.shouldFollowUp = false;
  if (typeof obj.followUpQuestion !== 'string') obj.followUpQuestion = '';
  if (typeof obj.modelAnswer !== 'string') obj.modelAnswer = '';

  return { valid: errors.length === 0, errors, data: obj };
}

/**
 * 安全解析 JSON，處理各種 Gemini 回傳格式
 */
export function safeParseJSON(text) {
  if (!text || typeof text !== 'string') {
    return { success: false, error: '空回應', data: null, rawText: text };
  }

  let cleaned = text.trim();

  // 移除 markdown code fence
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);
    return { success: true, data: parsed, rawText: text };
  } catch (e) {
    // 嘗試找到 JSON 物件
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return { success: true, data: parsed, rawText: text };
      } catch (e2) {
        // ignore
      }
    }

    // 嘗試修復被截斷的 JSON（補上缺少的引號和括號）
    let repaired = cleaned;
    if (!repaired.endsWith('}')) {
      // 計算未關閉的引號
      const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
      if (quoteCount % 2 !== 0) repaired += '"';
      // 補上可能缺少的括號
      const opens = (repaired.match(/\{/g) || []).length;
      const closes = (repaired.match(/\}/g) || []).length;
      for (let i = 0; i < opens - closes; i++) repaired += '}';
    }
    try {
      const parsed = JSON.parse(repaired);
      return { success: true, data: parsed, rawText: text };
    } catch (e3) {
      // ignore
    }

    return { success: false, error: `JSON 解析失敗: ${e.message}`, data: null, rawText: text };
  }
}
