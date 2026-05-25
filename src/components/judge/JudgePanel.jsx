// JudgePanel.jsx — AI 評審互動主區（含重新作答功能）
import { useCallback, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { GEMINI_API_KEY } from '../../utils/constants';
import { uploadFilesToGemini, generateJudgeQuestion, scoreAnswer } from '../../services/geminiService';
import { mockUploadFiles, mockGenerateQuestion, mockScoreAnswer, resetMockIndex } from '../../services/mockService';
import { extractTextFromFile } from '../../services/fileProcessor';

export default function JudgePanel() {
  const { state, actions } = useAppContext();
  const { simulation, files, settings, history } = state;
  const apiKey = state.apiKey || GEMINI_API_KEY;
  const useMock = !apiKey;

  // 重新作答狀態
  const [isRevising, setIsRevising] = useState(false);
  const [reviseAnswer, setReviseAnswer] = useState('');
  const [originalFeedback, setOriginalFeedback] = useState(null);

  // 開始模擬
  const handleStart = useCallback(async () => {
    if (files.length === 0) {
      alert('請先上傳至少一個檔案');
      return;
    }
    actions.startSimulation();
    resetMockIndex();

    try {
      let fileUris = [];
      let documentContext = '';

      if (useMock) {
        const results = await mockUploadFiles(files);
        documentContext = results.map((r) => r.textContent || '').join('\n\n');
        results.forEach((r) => actions.updateFile(r.fileId, { status: 'ready' }));
      } else {
        for (const f of files) {
          if (f.type !== 'pdf') {
            try {
              actions.updateFile(f.id, { status: 'processing' });
              const text = await extractTextFromFile(f.rawFile);
              actions.updateFile(f.id, { status: 'ready', textContent: text });
              if (text) documentContext += `\n【${f.name}】\n${text}\n`;
            } catch (err) {
              actions.updateFile(f.id, { status: 'error', error: err.message });
            }
          }
        }
        const pdfFiles = files.filter((f) => f.type === 'pdf');
        if (pdfFiles.length > 0) {
          const results = await uploadFilesToGemini(pdfFiles, apiKey, (id, status, error) => {
            actions.updateFile(id, { status, error: error || null });
          });
          fileUris = results.filter((r) => r.uri).map((r) => ({ uri: r.uri, mimeType: r.mimeType }));
        }
      }

      actions.simulationReady({ fileUris, documentContext });
      await generateNextQuestion([], fileUris, documentContext, false, null);
    } catch (err) {
      actions.setError(err.message);
    }
  }, [files, settings, apiKey, useMock]);

  // 生成下一題
  const generateNextQuestion = async (hist, fileUris, docCtx, isFollowUp, lastFeedback) => {
    actions.setLoading(true);
    setIsRevising(false);
    setOriginalFeedback(null);
    try {
      let question;
      if (useMock) {
        question = await mockGenerateQuestion();
      } else {
        question = await generateJudgeQuestion({
          apiKey, settings, history: hist,
          fileRefs: fileUris || simulation.fileUris,
          documentContext: docCtx || simulation.documentContext,
          isFollowUp, lastFeedback,
        });
      }
      actions.setQuestion(question);
    } catch (err) {
      actions.setError(err.message);
    }
  };

  // 送出回答（共用：首次 & 修正版）
  const submitAnswer = async (answer, isRevision) => {
    if (!answer.trim()) return;
    actions.setLoading(true);

    try {
      let feedback;
      if (useMock) {
        feedback = await mockScoreAnswer(answer);
      } else {
        feedback = await scoreAnswer({
          apiKey, question: simulation.currentQuestion, answer,
          settings, fileRefs: simulation.fileUris,
          documentContext: simulation.documentContext,
        });
      }
      actions.setFeedback(feedback);
      actions.setAnswer(answer);
      actions.addHistory({
        round: simulation.currentRound,
        question: simulation.currentQuestion,
        answer,
        feedback,
        isFollowUp: false,
        isRevision,
        originalFeedback: isRevision ? originalFeedback : null,
        timestamp: new Date().toISOString(),
      });
      if (isRevision) setIsRevising(false);
    } catch (err) {
      actions.setError(err.message);
    }
  };

  // 首次送出
  const handleSubmit = useCallback(() => {
    submitAnswer(simulation.currentAnswer, false);
  }, [simulation]);

  // 重新作答
  const handleRevise = useCallback(() => {
    setOriginalFeedback(simulation.currentFeedback);
    setReviseAnswer(simulation.currentAnswer);
    setIsRevising(true);
  }, [simulation]);

  // 送出修正版
  const handleSubmitRevision = useCallback(() => {
    submitAnswer(reviseAnswer, true);
  }, [reviseAnswer]);

  // 取消修正
  const handleCancelRevise = useCallback(() => {
    setIsRevising(false);
    setReviseAnswer('');
  }, []);

  // 下一題
  const handleNext = useCallback(() => {
    const totalRounds = settings.totalRounds;
    if (totalRounds > 0 && simulation.currentRound >= totalRounds) {
      actions.finishSimulation();
      actions.toggleSummary();
      return;
    }
    generateNextQuestion(history, null, null, false, null);
  }, [simulation, settings, history]);

  // 追問
  const handleFollowUp = useCallback(() => {
    generateNextQuestion(history, null, null, true, simulation.currentFeedback);
  }, [simulation, history]);

  // 重新開始
  const handleRestart = useCallback(() => {
    actions.resetSimulation();
    setIsRevising(false);
    setOriginalFeedback(null);
    files.forEach((f) => actions.updateFile(f.id, { status: 'pending' }));
  }, [files]);

  // 結束模擬
  const handleFinish = useCallback(() => {
    actions.finishSimulation();
    actions.toggleSummary();
  }, []);

  // ---- Render ----

  // Idle
  if (simulation.status === 'idle') {
    return (
      <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="empty-state-icon">⚖️</div>
        <div className="empty-state-text">
          <strong style={{ fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>準備開始模擬</strong>
          1. 在左側上傳你的企劃書或簡報<br />
          2. 調整評審設定<br />
          3. 點擊下方按鈕開始
        </div>
        <button className="btn btn-primary btn-lg" style={{ marginTop: 24, alignSelf: 'center' }} onClick={handleStart}
          disabled={files.length === 0}>
          🚀 開始模擬
        </button>
        {files.length === 0 && (
          <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: 8 }}>請先上傳至少一個檔案</div>
        )}
      </div>
    );
  }

  // Loading
  if (simulation.isLoading) {
    return (
      <div className="loading-spinner" style={{ flex: 1, justifyContent: 'center' }}>
        <div className="spinner" />
        <div className="loading-text">
          {simulation.status === 'preparing' ? '正在處理檔案並準備第一題...' : 'AI 評審思考中...'}
        </div>
      </div>
    );
  }

  // Error
  if (simulation.error) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20 }}>
        <div className="error-box">
          <strong>❌ 錯誤</strong><br />{simulation.error}
        </div>
        <div className="action-row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => {
            actions.setError(null);
            generateNextQuestion(history, null, null, false, null);
          }}>重試</button>
          <button className="btn btn-danger" onClick={handleRestart}>重新開始</button>
        </div>
      </div>
    );
  }

  // Finished
  if (simulation.status === 'finished') {
    return (
      <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="empty-state-icon">🏁</div>
        <div className="empty-state-text">
          <strong style={{ fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>模擬結束</strong>
          共完成 {history.length} 輪問答
        </div>
        <div className="action-row" style={{ justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => actions.toggleSummary()}>📊 查看總結報告</button>
          <button className="btn btn-secondary" onClick={handleRestart}>🔄 重新開始</button>
        </div>
      </div>
    );
  }

  // Active
  return (
    <div style={{ flex: 1 }}>
      {/* Question */}
      {simulation.currentQuestion && (
        <div className="question-card">
          <div className="question-tags">
            <span className="tag">第 {simulation.currentRound} 輪</span>
            <span className="tag">{simulation.currentQuestion.scopeLevel === 'topic' ? '主題' : simulation.currentQuestion.scopeLevel === 'detail' ? '細節' : '均衡'}</span>
            <span className="tag">{simulation.currentQuestion.answerType === 'closed' ? '封閉式' : simulation.currentQuestion.answerType === 'open' ? '開放式' : '混合'}</span>
            <span className="tag">難度 {simulation.currentQuestion.difficulty}</span>
          </div>
          <div className="question-text">{simulation.currentQuestion.question}</div>
          {settings.showHints && simulation.currentQuestion.purpose && (
            <div className="question-purpose">
              <strong>💡 提問目的：</strong>{simulation.currentQuestion.purpose}
            </div>
          )}
        </div>
      )}

      {/* 首次回答輸入框 */}
      {!simulation.currentFeedback && !isRevising && (
        <div style={{ marginBottom: 16 }}>
          <textarea className="form-textarea" style={{ minHeight: 160, fontSize: '.95rem' }}
            placeholder="在此輸入你的回答..."
            value={simulation.currentAnswer}
            onChange={(e) => actions.setAnswer(e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{simulation.currentAnswer.length} 字</span>
            <button className="btn btn-primary" onClick={handleSubmit}
              disabled={!simulation.currentAnswer.trim()}>📤 送出回答</button>
          </div>
        </div>
      )}

      {/* 修正版回答輸入框 */}
      {isRevising && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: '.82rem', fontWeight: 600, color: 'var(--warning)',
            marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ✏️ 重新作答 — 根據回饋修正你的回答
          </div>
          <textarea className="form-textarea" style={{
            minHeight: 180, fontSize: '.95rem',
            borderColor: 'var(--warning)', borderWidth: 2,
          }}
            placeholder="修正你的回答..."
            value={reviseAnswer}
            onChange={(e) => setReviseAnswer(e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{reviseAnswer.length} 字</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={handleCancelRevise}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmitRevision}
                disabled={!reviseAnswer.trim()}>📤 送出修正版</button>
            </div>
          </div>
        </div>
      )}

      {/* 你的回答（評分後顯示） */}
      {simulation.currentFeedback && !isRevising && (
        <div className="card" style={{ borderLeft: '4px solid var(--info)', marginBottom: 16 }}>
          <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            📝 你的回答
            {originalFeedback && <span className="tag" style={{ marginLeft: 8, background: 'var(--warning-bg)', color: 'var(--warning)' }}>修正版</span>}
          </div>
          <div style={{ fontSize: '.88rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
            {simulation.currentAnswer}
          </div>
        </div>
      )}

      {/* 修正前後對比（修正版才顯示） */}
      {simulation.currentFeedback && !isRevising && originalFeedback && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16,
        }}>
          <div style={{
            padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
          }}>
            <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>原始得分</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: getScoreColorClass(originalFeedback.overallScore) === 'score-color-high' ? 'var(--score-high)' : getScoreColorClass(originalFeedback.overallScore) === 'score-color-mid' ? 'var(--score-mid)' : 'var(--score-low)', textAlign: 'center' }}>
              {originalFeedback.overallScore.toFixed(1)}
            </div>
          </div>
          <div style={{
            padding: 12, borderRadius: 'var(--radius-sm)',
            border: '2px solid var(--success)', background: 'var(--success-bg)',
          }}>
            <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--success)', marginBottom: 6 }}>修正後得分</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--success)', textAlign: 'center' }}>
              {simulation.currentFeedback.overallScore.toFixed(1)}
              <span style={{ fontSize: '.8rem', marginLeft: 6 }}>
                {simulation.currentFeedback.overallScore > originalFeedback.overallScore
                  ? `↑ +${(simulation.currentFeedback.overallScore - originalFeedback.overallScore).toFixed(1)}`
                  : simulation.currentFeedback.overallScore < originalFeedback.overallScore
                    ? `↓ ${(simulation.currentFeedback.overallScore - originalFeedback.overallScore).toFixed(1)}`
                    : '→ 持平'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {simulation.currentFeedback && !isRevising && (
        <div className="feedback-card">
          <div className="feedback-score-main">
            <div className={`feedback-score-value ${getScoreColorClass(simulation.currentFeedback.overallScore)}`}>
              {simulation.currentFeedback.overallScore.toFixed(1)}
            </div>
            <div className="feedback-score-label">
              {originalFeedback ? '修正後總分 / 10' : '總分 / 10'}
            </div>
          </div>

          <div className="feedback-dimensions">
            {Object.entries(simulation.currentFeedback.dimensionScores).map(([key, val]) => (
              <div key={key} className="feedback-dim">
                <span className="feedback-dim-label">{getDimLabel(key)}</span>
                <span className={`feedback-dim-score ${getScoreColorClass(val)}`}>
                  {val}
                  {originalFeedback && (
                    <span style={{ fontSize: '.65rem', marginLeft: 4, color: 'var(--text-muted)' }}>
                      ({val > originalFeedback.dimensionScores[key] ? '+' : ''}{(val - originalFeedback.dimensionScores[key]).toFixed(0)})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {simulation.currentFeedback.strengths.length > 0 && (
            <div className="feedback-section">
              <div className="feedback-section-title">✅ 優點</div>
              <ul className="feedback-list">
                {simulation.currentFeedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {simulation.currentFeedback.weaknesses.length > 0 && (
            <div className="feedback-section">
              <div className="feedback-section-title">⚠️ 弱點</div>
              <ul className="feedback-list">
                {simulation.currentFeedback.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="feedback-section">
            <div className="feedback-section-title">💬 評語</div>
            <div className="feedback-text">{simulation.currentFeedback.feedback}</div>
          </div>

          <div className="feedback-section">
            <div className="feedback-section-title">📝 改進建議</div>
            <div className="feedback-text">{simulation.currentFeedback.improvementAdvice}</div>
          </div>

          {simulation.currentFeedback.modelAnswer && (
            <div className="feedback-section" style={{
              background: 'var(--success-bg)', border: '1px solid var(--success)',
              borderRadius: 'var(--radius-md)', padding: 16,
            }}>
              <div className="feedback-section-title" style={{ color: 'var(--success)' }}>🌟 高分示範回答</div>
              <div className="feedback-text" style={{ whiteSpace: 'pre-wrap' }}>
                {simulation.currentFeedback.modelAnswer}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="action-row">
            <button className="btn btn-primary" onClick={handleNext}>➡️ 下一題</button>
            <button className="btn btn-secondary" onClick={handleRevise}>✏️ 重新作答</button>
            {simulation.currentFeedback.shouldFollowUp && (
              <button className="btn btn-secondary" onClick={handleFollowUp}>🔍 追問</button>
            )}
            <button className="btn btn-secondary" onClick={handleFinish}>🏁 結束模擬</button>
            <button className="btn btn-danger btn-sm" onClick={handleRestart} style={{ marginLeft: 'auto' }}>🔄 重新開始</button>
          </div>
        </div>
      )}
    </div>
  );
}

function getScoreColorClass(score) {
  if (score >= 7.5) return 'score-color-high';
  if (score >= 5) return 'score-color-mid';
  return 'score-color-low';
}

const DIM_MAP = { completeness: '完整度', correctness: '正確度', logic: '邏輯性', persuasiveness: '說服力', responsiveness: '應變能力' };
function getDimLabel(key) { return DIM_MAP[key] || key; }
