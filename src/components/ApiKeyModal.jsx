// ApiKeyModal.jsx
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function ApiKeyModal() {
  const { state, actions } = useAppContext();
  const [key, setKey] = useState(state.apiKey);

  if (!state.showApiKeyModal) return null;

  const handleSave = () => {
    actions.setApiKey(key.trim());
  };

  return (
    <div className="modal-overlay" onClick={actions.toggleApiKeyModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h2 className="modal-title">🔑 設定 Gemini API Key</h2>
        <div className="form-group">
          <label className="form-label">API Key</label>
          <input
            className="form-input"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="輸入你的 Gemini API Key..."
          />
        </div>
        <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          未填入 API Key 時，系統將以模擬模式運作（使用假資料展示流程）。
          <br />你可以在 <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Google AI Studio</a> 取得 API Key。
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={actions.toggleApiKeyModal}>取消</button>
          <button className="btn btn-primary" onClick={handleSave}>儲存</button>
        </div>
      </div>
    </div>
  );
}
