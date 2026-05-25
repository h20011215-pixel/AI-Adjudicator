// SettingsPanel.jsx
import { useAppContext } from '../../context/AppContext';
import { JUDGE_STYLES, DOMAIN_OPTIONS, ANSWER_LENGTH_OPTIONS, DIFFICULTY_LABELS } from '../../utils/constants';

export default function SettingsPanel() {
  const { state, actions } = useAppContext();
  const s = state.settings;
  const isActive = state.simulation.status === 'active';
  const disabled = isActive;

  const update = (key, val) => actions.updateSettings({ [key]: val });

  const toggleDomain = (val) => {
    const next = s.domains.includes(val)
      ? s.domains.filter((d) => d !== val)
      : [...s.domains, val];
    update('domains', next);
  };

  return (
    <div className="panel-section">
      <div className="panel-section-title">⚙️ 評審設定</div>

      {/* 問題範圍 */}
      <div className="form-group">
        <label className="form-label">問題範圍</label>
        <div className="slider-container">
          <input type="range" min="0" max="100" value={s.scopeLevel}
            onChange={(e) => update('scopeLevel', +e.target.value)} disabled={disabled} />
          <div className="slider-labels"><span>主題/大方向</span><span>細節/數據</span></div>
        </div>
      </div>

      {/* 問題類型 */}
      <div className="form-group">
        <label className="form-label">問題類型</label>
        <div className="slider-container">
          <input type="range" min="0" max="100" value={s.answerType}
            onChange={(e) => update('answerType', +e.target.value)} disabled={disabled} />
          <div className="slider-labels"><span>明確答案</span><span>開放策略</span></div>
        </div>
      </div>

      {/* 難度 */}
      <div className="form-group">
        <label className="form-label">難度等級</label>
        <div className="difficulty-group">
          {[1, 2, 3, 4, 5].map((d) => (
            <button key={d} className={`difficulty-pill ${s.difficulty === d ? 'selected' : ''}`}
              onClick={() => !disabled && update('difficulty', d)} disabled={disabled}>
              {d}<br /><span style={{ fontSize: '.65rem' }}>{DIFFICULTY_LABELS[d - 1]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 評審風格 */}
      <div className="form-group">
        <label className="form-label">評審風格</label>
        <div className="style-group">
          {JUDGE_STYLES.map((st) => (
            <button key={st.value} className={`style-option ${s.judgeStyle === st.value ? 'selected' : ''}`}
              onClick={() => !disabled && update('judgeStyle', st.value)} disabled={disabled}>
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* 問題領域 */}
      <div className="form-group">
        <label className="form-label">問題領域（多選）</label>
        <div className="chip-group">
          {DOMAIN_OPTIONS.map((d) => (
            <span key={d.value} className={`chip ${s.domains.includes(d.value) ? 'selected' : ''}`}
              onClick={() => !disabled && toggleDomain(d.value)}>
              {d.label}
            </span>
          ))}
        </div>
      </div>

      {/* 提示開關 */}
      <div className="form-group">
        <div className="toggle-row">
          <span className="toggle-label">顯示提問目的</span>
          <div className={`toggle-switch ${s.showHints ? 'active' : ''}`}
            onClick={() => !disabled && update('showHints', !s.showHints)} />
        </div>
      </div>

      {/* 回答字數 */}
      <div className="form-group">
        <label className="form-label">回答字數限制</label>
        <div className="style-group">
          {ANSWER_LENGTH_OPTIONS.map((opt) => (
            <button key={opt.value} className={`style-option ${s.answerLength === opt.value ? 'selected' : ''}`}
              onClick={() => !disabled && update('answerLength', opt.value)} disabled={disabled}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 總回合數 */}
      <div className="form-group">
        <label className="form-label">總回合數（0 = 無限）</label>
        <input className="form-input" type="number" min="0" max="50" value={s.totalRounds}
          onChange={(e) => update('totalRounds', Math.max(0, +e.target.value))} disabled={disabled} />
      </div>
    </div>
  );
}
