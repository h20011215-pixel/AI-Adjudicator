// ScorePanel.jsx
import { useAppContext } from '../../context/AppContext';
import { DIMENSION_LABELS } from '../../utils/constants';

export default function ScorePanel() {
  const { state } = useAppContext();
  const { history, simulation } = state;

  if (history.length === 0) {
    return (
      <div className="panel-section">
        <div className="panel-section-title">📊 分數總覽</div>
        <div className="empty-state" style={{ padding: '20px 10px' }}>
          <div className="empty-state-icon">📈</div>
          <div className="empty-state-text">尚無評分紀錄</div>
        </div>
      </div>
    );
  }

  const avgScore = Math.round(
    (history.reduce((s, h) => s + h.feedback.overallScore, 0) / history.length) * 10
  ) / 10;

  const dims = ['completeness', 'correctness', 'logic', 'persuasiveness', 'responsiveness'];
  const dimAvgs = {};
  dims.forEach((d) => {
    dimAvgs[d] = Math.round(
      (history.reduce((s, h) => s + (h.feedback.dimensionScores[d] || 0), 0) / history.length) * 10
    ) / 10;
  });

  const getColor = (score) => {
    if (score >= 7.5) return 'var(--score-high)';
    if (score >= 5) return 'var(--score-mid)';
    return 'var(--score-low)';
  };

  return (
    <div className="panel-section">
      <div className="panel-section-title">📊 分數總覽</div>

      <div className="score-overview">
        <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
          第 {simulation.currentRound} 輪 · 共 {history.length} 題已完成
        </div>
        <div className="score-big" style={{ color: getColor(avgScore) }}>{avgScore.toFixed(1)}</div>
        <div className="score-sub">平均分數 / 10</div>
      </div>

      <div className="score-dims">
        {dims.map((d) => (
          <div key={d} className="score-dim-row">
            <span className="score-dim-label">{DIMENSION_LABELS[d]}</span>
            <div className="score-dim-bar-bg">
              <div className="score-dim-bar" style={{
                width: `${dimAvgs[d] * 10}%`,
                background: getColor(dimAvgs[d]),
              }} />
            </div>
            <span className="score-dim-val" style={{ color: getColor(dimAvgs[d]) }}>{dimAvgs[d]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
