// Header.jsx
import { useAppContext } from '../context/AppContext';

export default function Header() {
  const { state, actions } = useAppContext();
  const isActive = state.simulation.status !== 'idle';

  const handleReset = () => {
    if (confirm('確定要重設模擬嗎？所有進度與歷史紀錄將會清除。')) {
      actions.resetSimulation();
      state.files.forEach((f) => actions.updateFile(f.id, { status: 'pending' }));
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">⚖️ AI 評審模擬器</div>
        <div className="header-subtitle">Pitch Judge Simulator</div>
      </div>
      <div className="header-right">
        {isActive && (
          <button className="btn btn-danger btn-sm" onClick={handleReset}>
            ✕ 重設模擬
          </button>
        )}
        {state.isMockMode && <span className="mock-badge">模擬模式</span>}
        <button className="btn btn-ghost btn-sm" onClick={actions.toggleApiKeyModal}>
          🔑 API Key
        </button>
        <button className="btn-icon" onClick={actions.toggleTheme} title="切換主題">
          {state.theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
