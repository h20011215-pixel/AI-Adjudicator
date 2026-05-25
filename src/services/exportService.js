// ============================================================
// exportService.js — 匯出報告模組
// ============================================================
import { DIMENSION_LABELS } from '../utils/constants';

/**
 * 計算總結報告資料
 */
export function calculateSummary(history) {
  if (!history || history.length === 0) {
    return null;
  }

  const totalRounds = history.length;

  // 平均分數
  const avgScore =
    Math.round(
      (history.reduce((sum, h) => sum + h.feedback.overallScore, 0) / totalRounds) * 10
    ) / 10;

  // 各維度平均
  const dims = ['completeness', 'correctness', 'logic', 'persuasiveness', 'responsiveness'];
  const dimAverages = {};
  for (const dim of dims) {
    dimAverages[dim] =
      Math.round(
        (history.reduce((sum, h) => sum + (h.feedback.dimensionScores[dim] || 0), 0) / totalRounds) * 10
      ) / 10;
  }

  // 最常見弱點
  const weaknessCount = {};
  history.forEach((h) => {
    (h.feedback.weaknesses || []).forEach((w) => {
      weaknessCount[w] = (weaknessCount[w] || 0) + 1;
    });
  });
  const topWeaknesses = Object.entries(weaknessCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w);

  // 最佳表現維度
  const bestDim = dims.reduce((best, dim) =>
    dimAverages[dim] > dimAverages[best] ? dim : best
  );
  const worstDim = dims.reduce((worst, dim) =>
    dimAverages[dim] < dimAverages[worst] ? dim : worst
  );

  // 最佳表現題型
  const bestRound = history.reduce((best, h) =>
    h.feedback.overallScore > best.feedback.overallScore ? h : best
  );
  const worstRound = history.reduce((worst, h) =>
    h.feedback.overallScore < worst.feedback.overallScore ? h : worst
  );

  // 建議加強方向
  const improvements = [];
  if (dimAverages.completeness < 6.5) improvements.push('回答需要更完整，涵蓋問題的所有面向');
  if (dimAverages.correctness < 6.5) improvements.push('需要確保回答內容的正確性，與文件數據保持一致');
  if (dimAverages.logic < 6.5) improvements.push('加強邏輯推理，確保因果關係清晰');
  if (dimAverages.persuasiveness < 6.5) improvements.push('增加數據和案例來提升說服力');
  if (dimAverages.responsiveness < 6.5) improvements.push('更直接地回應評審問題，避免偏題');
  if (improvements.length === 0) improvements.push('整體表現優秀，持續保持！');

  return {
    totalRounds,
    avgScore,
    dimAverages,
    topWeaknesses,
    bestDimension: { key: bestDim, label: DIMENSION_LABELS[bestDim], score: dimAverages[bestDim] },
    worstDimension: { key: worstDim, label: DIMENSION_LABELS[worstDim], score: dimAverages[worstDim] },
    bestRound: { round: bestRound.round, score: bestRound.feedback.overallScore, question: bestRound.question.question },
    worstRound: { round: worstRound.round, score: worstRound.feedback.overallScore, question: worstRound.question.question },
    improvements,
  };
}

/**
 * 匯出為 JSON
 */
export function exportToJSON(history, summary) {
  const data = {
    exportDate: new Date().toISOString(),
    summary,
    rounds: history.map((h) => ({
      round: h.round,
      question: h.question,
      answer: h.answer,
      feedback: h.feedback,
      isFollowUp: h.isFollowUp,
      timestamp: h.timestamp,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `評審模擬報告_${formatDateForFilename()}.json`);
}

/**
 * 匯出為 Markdown
 */
export function exportToMarkdown(history, summary) {
  let md = `# AI 評審模擬報告\n\n`;
  md += `> 匯出時間：${new Date().toLocaleString('zh-TW')}\n\n`;

  // 總結
  md += `## 總結\n\n`;
  md += `| 項目 | 數值 |\n|------|------|\n`;
  md += `| 總回合數 | ${summary.totalRounds} |\n`;
  md += `| 總平均分 | ${summary.avgScore} / 10 |\n`;
  md += `| 最佳表現維度 | ${summary.bestDimension.label}（${summary.bestDimension.score}）|\n`;
  md += `| 最弱表現維度 | ${summary.worstDimension.label}（${summary.worstDimension.score}）|\n\n`;

  // 各維度
  md += `### 各維度平均分數\n\n`;
  md += `| 維度 | 分數 |\n|------|------|\n`;
  for (const [key, val] of Object.entries(summary.dimAverages)) {
    md += `| ${DIMENSION_LABELS[key]} | ${val} |\n`;
  }
  md += `\n`;

  // 建議
  md += `### 建議加強方向\n\n`;
  summary.improvements.forEach((imp) => {
    md += `- ${imp}\n`;
  });
  md += `\n`;

  // 各輪紀錄
  md += `## 各輪問答紀錄\n\n`;
  history.forEach((h) => {
    md += `### 第 ${h.round} 輪${h.isFollowUp ? '（追問）' : ''}\n\n`;
    md += `**題目：** ${h.question.question}\n\n`;
    md += `**回答：** ${h.answer}\n\n`;
    md += `**總分：** ${h.feedback.overallScore} / 10\n\n`;
    md += `**評語：** ${h.feedback.feedback}\n\n`;
    md += `**改進建議：** ${h.feedback.improvementAdvice}\n\n`;
    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, `評審模擬報告_${formatDateForFilename()}.md`);
}

/**
 * 匯出為純文字
 */
export function exportToText(history, summary) {
  let txt = `AI 評審模擬報告\n${'='.repeat(50)}\n\n`;
  txt += `匯出時間：${new Date().toLocaleString('zh-TW')}\n\n`;

  txt += `【總結】\n`;
  txt += `總回合數：${summary.totalRounds}\n`;
  txt += `總平均分：${summary.avgScore} / 10\n`;
  txt += `最佳維度：${summary.bestDimension.label}（${summary.bestDimension.score}）\n`;
  txt += `最弱維度：${summary.worstDimension.label}（${summary.worstDimension.score}）\n\n`;

  txt += `【各維度平均】\n`;
  for (const [key, val] of Object.entries(summary.dimAverages)) {
    txt += `  ${DIMENSION_LABELS[key]}：${val}\n`;
  }
  txt += `\n`;

  txt += `【建議加強】\n`;
  summary.improvements.forEach((imp) => {
    txt += `  • ${imp}\n`;
  });
  txt += `\n`;

  txt += `${'='.repeat(50)}\n\n`;
  history.forEach((h) => {
    txt += `第 ${h.round} 輪${h.isFollowUp ? '（追問）' : ''}\n${'-'.repeat(30)}\n`;
    txt += `題目：${h.question.question}\n`;
    txt += `回答：${h.answer}\n`;
    txt += `總分：${h.feedback.overallScore} / 10\n`;
    txt += `評語：${h.feedback.feedback}\n`;
    txt += `建議：${h.feedback.improvementAdvice}\n\n`;
  });

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `評審模擬報告_${formatDateForFilename()}.txt`);
}

// === 工具函式 ===

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDateForFilename() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
}
