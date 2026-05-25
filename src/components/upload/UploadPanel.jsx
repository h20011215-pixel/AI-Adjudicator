// UploadPanel.jsx
import { useRef, useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SUPPORTED_EXTENSIONS, MAX_FILE_SIZE, MIME_TYPES } from '../../utils/constants';

export default function UploadPanel() {
  const { state, actions } = useAppContext();
  const inputRef = useRef(null);
  const [dragover, setDragover] = useState(false);
  const isActive = state.simulation.status === 'active';

  const processFiles = useCallback((fileList) => {
    const newFiles = [];
    for (const file of fileList) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        alert(`不支援的檔案格式: .${ext}\n支援格式: ${SUPPORTED_EXTENSIONS.join(', ')}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert(`檔案 ${file.name} 超過 20MB 限制`);
        continue;
      }
      newFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        type: ext,
        size: file.size,
        mimeType: MIME_TYPES[ext] || 'application/octet-stream',
        status: 'pending',
        error: null,
        fileUri: null,
        textContent: null,
        rawFile: file,
      });
    }
    if (newFiles.length > 0) actions.addFiles(newFiles);
  }, [actions]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    if (!isActive) processFiles(e.dataTransfer.files);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusText = (s) => {
    const map = { pending: '待上傳', uploading: '上傳中...', processing: '處理中...', ready: '✓ 就緒', error: '✗ 失敗' };
    return map[s] || s;
  };

  const getFileIcon = (type) => {
    const icons = { pdf: '📄', docx: '📝', pptx: '📊', txt: '📃' };
    return icons[type] || '📎';
  };

  return (
    <div className="panel-section">
      <div className="panel-section-title">📁 檔案上傳</div>
      <div
        className={`dropzone ${dragover ? 'dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
        onClick={() => !isActive && inputRef.current?.click()}
        style={isActive ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
      >
        <div className="dropzone-icon">📂</div>
        <div className="dropzone-text">拖曳檔案至此或點擊上傳</div>
        <div className="dropzone-hint">支援 PDF、PPTX、DOCX、TXT（≤ 50MB）</div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.pptx,.docx,.txt"
          style={{ display: 'none' }}
          onChange={(e) => processFiles(e.target.files)}
          disabled={isActive}
        />
      </div>

      {state.files.length > 0 && (
        <div className="file-list">
          {state.files.map((f) => (
            <div key={f.id} className="file-item">
              <span className="file-item-icon">{getFileIcon(f.type)}</span>
              <div className="file-item-info">
                <div className="file-item-name">{f.name}</div>
                <div className="file-item-meta">{f.type.toUpperCase()} · {formatSize(f.size)}</div>
              </div>
              <span className={`file-item-status ${f.status}`}>{getStatusText(f.status)}</span>
              {!isActive && (
                <button className="btn-icon" onClick={() => actions.removeFile(f.id)} title="移除">✕</button>
              )}
            </div>
          ))}
          {!isActive && state.files.length > 1 && (
            <button className="btn btn-danger btn-sm" onClick={actions.clearFiles} style={{ marginTop: 4 }}>
              清除全部
            </button>
          )}
        </div>
      )}
    </div>
  );
}
