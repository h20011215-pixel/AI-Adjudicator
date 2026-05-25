// App.jsx — Root component
import './App.css';
import { useAppContext } from './context/AppContext';
import Header from './components/Header';
import ApiKeyModal from './components/ApiKeyModal';
import UploadPanel from './components/upload/UploadPanel';
import SettingsPanel from './components/settings/SettingsPanel';
import JudgePanel from './components/judge/JudgePanel';
import ScorePanel from './components/score/ScorePanel';
import HistoryPanel from './components/history/HistoryPanel';
import SummaryModal from './components/summary/SummaryModal';

function AppContent() {
  const { state } = useAppContext();

  return (
    <div data-theme={state.theme}>
      <Header />
      <div className="main-layout">
        {/* 左側：上傳 + 設定 */}
        <div className="panel-left">
          <UploadPanel />
          <SettingsPanel />
        </div>

        {/* 中間：AI 評審互動 */}
        <div className="panel-center">
          <JudgePanel />
        </div>

        {/* 右側：分數 + 歷史 */}
        <div className="panel-right">
          <ScorePanel />
          <HistoryPanel />
        </div>
      </div>

      <ApiKeyModal />
      <SummaryModal />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
