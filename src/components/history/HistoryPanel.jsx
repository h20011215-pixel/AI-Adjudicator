// HistoryPanel.jsx — 多層獨立展開收合
import { useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { DIMENSION_LABELS } from '../../utils/constants';

// 可獨立展開的區塊
function AccordionSection({ icon, title, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 6 }}>
      <div
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 0', cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '.78rem', fontWeight: 600, color: color || 'var(--text-secondary)' }}>
          {icon} {title}
        </span>
        <span style={{ fontSize: '.7rem', color: 'var(--text-muted)', width: 18, textAlign: 'center' }}>
          {open ? '−' : '+'}
        </span>
      </div>
      {open && (
        <div style={{ paddingBottom: 8, fontSize: '.78rem', lineHeight: 1.6 }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function HistoryPanel() {
  const { state } = useAppContext();
  const { history } = state;
  const [expandedRound, setExpandedRound] = useState(null);

  const getScoreColor = (score) => {
    if (score >= 7.5) return 'var(--score-high)';
    if (score >= 5) return 'var(--score-mid)';
    return 'var(--score-low)';
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

  const toggleRound = useCallback((id) => {
    setExpandedRound((prev) => (prev === id ? null : id));
  }, []);

  if (history.length === 0) {
    return (
      <div className="panel-section">
        <div className="panel-section-title">📋 歷史紀錄</div>
        <div className="empty-state" style={{ padding: '20px 10px' }}>
          <div className="empty-state-icon">📜</div>
          <div className="empty-state-text">尚無問答紀錄</div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-section" style={{ padding: 0 }}>
      <div className="panel-section-title" style={{ padding: '16px 16px 12px' }}>
        📋 歷史紀錄（{history.length} 輪）
      </div>

      {[...history].reverse().map((h, idx) => {
        const uid = `${h.round}-${h.timestamp}`;
        const isOpen = expandedRound === uid;
        const dims = h.feedback.dimensionScores;
        const isRevision = h.isRevision;
        const scoreDelta = isRevision && h.originalFeedback
          ? (h.feedback.overallScore - h.originalFeedback.overallScore).toFixed(1)
          : null;

        return (
          <div key={uid} style={{ borderBottom: '1px solid var(--border-color)' }}>

            {/* 卡片預覽 */}
            <div
              onClick={() => toggleRound(uid)}
              style={{ padding: '10px 16px', cursor: 'pointer', transition: 'background .15s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = ''}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '.82rem', fontWeight: 600, color: isRevision ? 'var(--warning)' : 'var(--accent)' }}>
                    第 {h.round} 輪{h.isFollowUp ? '（追問）' : ''}
                  </span>
                  {isRevision && (
                    <span style={{
                      fontSize: '.62rem', padding: '1px 6px', borderRadius: 3,
                      background: 'var(--warning-bg)', color: 'var(--warning)', fontWeight: 600,
                    }}>修正版</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '.85rem', fontWeight: 700, color: getScoreColor(h.feedback.overallScore) }}>
                    {h.feedback.overallScore.toFixed(1)}
                  </span>
                  {scoreDelta !== null && (
                    <span style={{
                      fontSize: '.65rem', fontWeight: 600,
                      color: +scoreDelta > 0 ? 'var(--score-high)' : +scoreDelta < 0 ? 'var(--score-low)' : 'var(--text-muted)',
                    }}>
                      {+scoreDelta > 0 ? `↑+${scoreDelta}` : +scoreDelta < 0 ? `↓${scoreDelta}` : '→'}
                    </span>
                  )}
                  <span style={{ fontSize: '.6rem', color: 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>
              {/* 題目預覽 */}
              <div style={{
                fontSize: '.78rem', color: 'var(--text-secondary)', marginTop: 4,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {h.question.question}
              </div>
              <div style={{ fontSize: '.68rem', color: 'var(--text-muted)', marginTop: 3 }}>{formatTime(h.timestamp)}</div>
            </div>

            {/* 展開區域：完整題目 + 回答 + 總分 + 各獨立可展開區塊 */}
            {isOpen && (
              <div style={{ padding: '0 16px 14px' }} onClick={(e) => e.stopPropagation()}>

                {/* 完整題目 */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>📌 題目</div>
                  <div style={{ fontSize: '.85rem', lineHeight: 1.7 }}>{h.question.question}</div>
                  {h.question.purpose && (
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 4 }}>💡 {h.question.purpose}</div>
                  )}
                </div>

                {/* 回答 */}
                <div style={{
                  marginBottom: 10, padding: 10,
                  background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--info)',
                }}>
                  <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--info)', marginBottom: 4 }}>📝 你的回答</div>
                  <div style={{ fontSize: '.82rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{h.answer}</div>
                </div>

                {/* 總分 */}
                <div style={{
                  textAlign: 'center', padding: '8px', marginBottom: 4,
                  background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
                }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700, color: getScoreColor(h.feedback.overallScore) }}>
                    {h.feedback.overallScore.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>/ 10</span>
                </div>

                {/* === 各獨立展開區塊 === */}

                <AccordionSection icon="📊" title="各維度分數" color="var(--text-primary)">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {Object.entries(dims).map(([key, val]) => (
                      <div key={key} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '4px 8px', background: 'var(--bg-input)', borderRadius: 4,
                      }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{DIMENSION_LABELS[key]}</span>
                        <span style={{ fontWeight: 700, color: getScoreColor(val) }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </AccordionSection>

                {h.feedback.strengths.length > 0 && (
                  <AccordionSection icon="✅" title="優點" color="var(--success)">
                    {h.feedback.strengths.map((s, i) => <div key={i}>• {s}</div>)}
                  </AccordionSection>
                )}

                {h.feedback.weaknesses.length > 0 && (
                  <AccordionSection icon="⚠️" title="弱點" color="var(--warning)">
                    {h.feedback.weaknesses.map((w, i) => <div key={i}>• {w}</div>)}
                  </AccordionSection>
                )}

                <AccordionSection icon="💬" title="評語" color="var(--text-secondary)">
                  <div>{h.feedback.feedback}</div>
                </AccordionSection>

                <AccordionSection icon="📝" title="改進建議" color="var(--text-secondary)">
                  <div>{h.feedback.improvementAdvice}</div>
                </AccordionSection>

                {h.feedback.modelAnswer && (
                  <AccordionSection icon="🌟" title="高分示範回答" color="var(--success)">
                    <div style={{
                      whiteSpace: 'pre-wrap', padding: 8,
                      background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)',
                    }}>
                      {h.feedback.modelAnswer}
                    </div>
                  </AccordionSection>
                )}

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
