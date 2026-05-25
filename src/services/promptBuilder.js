// ============================================================
// promptBuilder.js — Prompt 組裝模組
// ============================================================
import {
  SCOPE_DESCRIPTIONS,
  TYPE_DESCRIPTIONS,
  STYLE_DESCRIPTIONS,
  DOMAIN_OPTIONS,
  DIFFICULTY_LABELS,
} from '../utils/constants';

/**
 * 取得 system instruction
 */
export function buildSystemInstruction() {
  return `你是一位經驗豐富的專業比賽評審，擁有超過十年的創業競賽、商業企劃、簡報評審經驗。你的職責是根據參賽者上傳的企劃書、簡報等文件內容，模擬真實比賽中的 Q&A 環節。

你的行為準則：
1. 你必須仔細閱讀並記住文件中的所有內容，包括數字、假設、策略、風險點。
2. 你提出的問題必須緊密結合文件內容，不可以問太空泛的問題。
3. 你必須引用文件中的具體段落、數字或假設來出題。
4. 你的評分標準必須一致：相同品質的回答應獲得相同水準的分數。
5. 你必須嚴格按照指定的 JSON 格式回覆，不可在 JSON 外加入任何文字、不可加入 markdown code fence。
6. 若文件內容不足以出針對性題目，你應自動轉為通用評審模式，但仍需在 purpose 欄位告知參賽者。
7. 回覆語言一律使用繁體中文。`;
}

/**
 * 組裝問題生成 prompt
 */
export function buildQuestionPrompt({ settings, history, documentContext, isFollowUp, lastFeedback }) {
  const scopeDesc = settings.scopeLevel <= 30
    ? SCOPE_DESCRIPTIONS.low
    : settings.scopeLevel >= 71
      ? SCOPE_DESCRIPTIONS.high
      : SCOPE_DESCRIPTIONS.mid;

  const typeDesc = settings.answerType <= 30
    ? TYPE_DESCRIPTIONS.low
    : settings.answerType >= 71
      ? TYPE_DESCRIPTIONS.high
      : TYPE_DESCRIPTIONS.mid;

  const styleDesc = STYLE_DESCRIPTIONS[settings.judgeStyle] || STYLE_DESCRIPTIONS.professional;

  const domainLabels = settings.domains
    .map((d) => DOMAIN_OPTIONS.find((o) => o.value === d)?.label || d)
    .join('、');

  const diffLabel = DIFFICULTY_LABELS[settings.difficulty - 1] || '進階';

  // 歷史摘要（最近5輪）
  let historyText = '（尚無歷史對話）';
  if (history.length > 0) {
    const recent = history.slice(-5);
    historyText = recent
      .map(
        (h, i) =>
          `第${h.round}輪：\n  題目：${h.question.question}\n  回答摘要：${h.answer.substring(0, 150)}${h.answer.length > 150 ? '...' : ''}\n  得分：${h.feedback.overallScore}`
      )
      .join('\n\n');
  }

  let followUpContext = '';
  if (isFollowUp && lastFeedback) {
    followUpContext = `\n【追問指示】
上一題回答不夠完整，請根據以下建議追問內容進行追問：
${lastFeedback.followUpQuestion || lastFeedback.improvementAdvice}
追問應該更深入，聚焦在回答不足之處。\n`;
  }

  return `你現在要為參賽者生成下一道評審問題。${followUpContext}

【評審設定】
- 問題範圍偏向：${scopeDesc}
- 問題類型偏向：${typeDesc}
- 難度等級：${diffLabel}（${settings.difficulty}/5）
- 評審風格：${styleDesc}
- 關注領域：${domainLabels}
${settings.showHints ? '- 請在 purpose 欄位提供提示，讓參賽者了解此題想測試什麼' : '- 不要在 purpose 欄位提供過多提示'}

【文件內容】
${documentContext || '（無文件內容，請使用通用評審模式）'}

【歷史對話】
${historyText}

【出題規則】
1. 題目必須引用文件中的具體內容（數字、假設、策略名稱等）
2. 不可重複先前已問過的主題
3. 根據範圍設定調整問題深度
4. 根據類型設定調整問題性質
5. 根據難度調整壓力程度：等級${settings.difficulty}代表${diffLabel}
6. 題目要具體、有方向性，不可以只問「請說明你的商業模式」這種太空泛的問題
7. 題目應該像真正的評審會問的那樣，有針對性、有挑戰性

請以以下 JSON 格式回覆（只回覆 JSON，不要包含任何其他文字或 markdown code fence）：
{
  "question": "具體問題內容",
  "scopeLevel": "topic 或 balanced 或 detail",
  "answerType": "closed 或 mixed 或 open",
  "purpose": "此題想測試的能力或知識點",
  "difficulty": ${settings.difficulty},
  "followUpRecommended": false
}`;
}

/**
 * 組裝評分 prompt
 */
export function buildScoringPrompt({ question, answer, documentContext, settings }) {
  const styleDesc = STYLE_DESCRIPTIONS[settings.judgeStyle] || STYLE_DESCRIPTIONS.professional;

  return `你現在要以${styleDesc.substring(0, 6)}的風格評分參賽者的回答。

【本輪題目】
${question.question}

【題目意圖】
${question.purpose}

【題目類型】
範圍：${question.scopeLevel} | 回答類型：${question.answerType}

【參賽者回答】
${answer}

【文件原文參考】
${documentContext ? documentContext.substring(0, 2000) : '（無文件參考）'}

【評分規則】
1. completeness (1-10)：回答是否涵蓋題目所有面向？是否有遺漏？
2. correctness (1-10)：回答內容是否正確？與文件中的數據是否一致？
3. logic (1-10)：回答的邏輯是否清晰？因果推理是否合理？
4. persuasiveness (1-10)：回答是否有說服力？是否有數據或例子支撐？
5. responsiveness (1-10)：回答是否切題？是否直接回應評審的問題？

【評分標準校準】
- 6.0 = 基本合格，回答了問題但缺少深度
- 7.0 = 良好，有結構有邏輯但可以更完整
- 8.0 = 優秀，內容完整有說服力
- 9.0 = 極優，超出預期有創見
- 10.0 = 幾乎不可能的完美回答
- 5.0 以下 = 明顯偏離或嚴重不足

【特殊判定】
- 若回答明顯偏離題目 → correctness ≤ 4, responsiveness ≤ 3
- 若回答有結構、因果、數據 → logic ≥ 7, persuasiveness ≥ 7
- 若回答太短或漏答重要面向 → completeness ≤ 5
- overallScore 是加權平均（responsiveness 和 correctness 權重稍高），非簡單平均
- 所有 strengths、weaknesses、feedback、improvementAdvice 都必須使用繁體中文

【高分示範回答】
在評分結束後，請根據文件內容撰寫一段「可以拿到 9 分以上的示範回答」。
- 示範回答必須直接引用文件中的數據、事實或策略
- 回答要有清楚的結構（重述問題 → 分點論述 → 數據佐證 → 結論）
- 長度約 150~300 字，展示最佳回答範本

請以以下 JSON 格式回覆（只回覆 JSON，不要包含任何其他文字或 markdown code fence）：
{
  "overallScore": 7.5,
  "dimensionScores": {
    "completeness": 8,
    "correctness": 7,
    "logic": 8,
    "persuasiveness": 7,
    "responsiveness": 8
  },
  "strengths": ["具體優點1", "具體優點2"],
  "weaknesses": ["具體弱點1"],
  "feedback": "整體評語",
  "improvementAdvice": "改進建議",
  "shouldFollowUp": true,
  "followUpQuestion": "追問內容（若 shouldFollowUp 為 false 可為空字串）",
  "modelAnswer": "根據文件內容撰寫的高分示範回答"
}`;
}
