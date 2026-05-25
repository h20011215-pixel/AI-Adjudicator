// SummaryModal.jsx
import { useAppContext } from '../../context/AppContext';
import { calculateSummary, exportToJSON, exportToMarkdown, exportToText } from '../../services/exportService';
import { DIMENSION_LABELS } from '../../utils/constants';

export default function SummaryModal() {
  const { state, actions } = useAppContext();
  if (!state.showSummary) return null;

  const summary = calculateSummary(state.history);
  if (!summary) {
    return (
      <div className="modal-overlay" onClick={() => actions.toggleSummary()}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2 className="modal-title">📊 總結報告</h2>
          <p>尚無足夠資料產生報告。</p>
          <button className="btn btn-secondary" onClick={() => actions.toggleSummary()}>關閉</button>
        </div>
      </div>
    );
  }

  const getColor = (s) => s >= 7.5 ? 'var(--score-high)' : s >= 5 ? 'var(--score-mid)' : 'var(--score-low)';

  return (
    <div className="modal-overlay" onClick={() => actions.toggleSummary()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">📊 總結報告</h2>

        {/* 總覽 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div className="score-overview" style={{ margin: 0 }}>
            <div className="score-big" style={{ color: getColor(summary.avgScore), fontSize: '2rem' }}>{summary.avgScore}</div>
            <div className="score-sub">總平均分</div>
          </div>
          <div className="score-overview" style={{ margin: 0 }}>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{summary.totalRounds}</div>
            <div className="score-sub">總回合數</div>
          </div>
          <div className="score-overview" style={{ margin: 0 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: getColor(summary.bestDimension.score) }}>
              {summary.bestDimension.label}
            </div>
            <div className="score-sub">最佳維度</div>
          </div>
        </div>

        {/* 維度分數 */}
        <div className="card">
          <div className="feedback-section-title">各維度平均分數</div>
          <div className="score-dims">
            {Object.entries(summary.dimAverages).map(([key, val]) => (
              <div key={key} className="score-dim-row">
                <span className="score-dim-label">{DIMENSION_LABELS[key]}</span>
                <div className="score-dim-bar-bg">
                  <div className="score-dim-bar" style={{ width: `${val * 10}%`, background: getColor(val) }} />
                </div>
                <span className="score-dim-val" style={{ color: getColor(val) }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 弱點 */}
        {summary.topWeaknesses.length > 0 && (
          <div className="card">
            <div className="feedback-section-title">⚠️ 最常見弱點</div>
            <ul className="feedback-list">
              {summary.topWeaknesses.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {/* 建議 */}
        <div className="card">
          <div className="feedback-section-title">📝 建議加強方向</div>
          <ul className="feedback-list">
            {summary.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
          </ul>
        </div>

        {/* 匯出 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => exportToJSON(state.history, summary)}>📥 匯出 JSON</button>
          <button className="btn btn-secondary" onClick={() => exportToMarkdown(state.history, summary)}>📥 匯出 Markdown</button>
          <button className="btn btn-secondary" onClick={() => exportToText(state.history, summary)}>📥 匯出純文字</button>
          <button className="btn btn-ghost" onClick={() => actions.toggleSummary()} style={{ marginLeft: 'auto' }}>關閉</button>
        </div>
      </div>
    </div>
  );
}
