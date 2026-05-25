// ============================================================
// AppContext.jsx — 全域狀態管理 (Context + useReducer)
// ============================================================
import { createContext, useContext, useReducer, useCallback } from 'react';
import { DEFAULT_SETTINGS } from '../utils/constants';

const AppContext = createContext(null);

const initialState = {
  // 主題
  theme: 'dark',

  // API 設定
  apiKey: '',
  isMockMode: true,
  showApiKeyModal: false,

  // 上傳檔案
  files: [],

  // 評審設定
  settings: { ...DEFAULT_SETTINGS },

  // 模擬狀態
  simulation: {
    status: 'idle', // 'idle' | 'preparing' | 'active' | 'finished'
    currentRound: 0,
    currentQuestion: null,
    currentAnswer: '',
    currentFeedback: null,
    isLoading: false,
    error: null,
    fileUris: [], // Gemini file references
    documentContext: '', // 擷取的文字 context
  },

  // 歷史紀錄
  history: [],

  // 總結報告
  showSummary: false,
};

function appReducer(state, action) {
  switch (action.type) {
    // === 主題 ===
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };

    // === API Key ===
    case 'SET_API_KEY':
      return {
        ...state,
        apiKey: action.payload,
        isMockMode: !action.payload,
        showApiKeyModal: false,
      };
    case 'TOGGLE_API_KEY_MODAL':
      return { ...state, showApiKeyModal: !state.showApiKeyModal };

    // === 檔案 ===
    case 'ADD_FILES':
      return { ...state, files: [...state.files, ...action.payload] };
    case 'UPDATE_FILE':
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.payload.id ? { ...f, ...action.payload.updates } : f
        ),
      };
    case 'REMOVE_FILE':
      return {
        ...state,
        files: state.files.filter((f) => f.id !== action.payload),
      };
    case 'CLEAR_FILES':
      return { ...state, files: [] };

    // === 設定 ===
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case 'RESET_SETTINGS':
      return { ...state, settings: { ...DEFAULT_SETTINGS } };

    // === 模擬 ===
    case 'START_SIMULATION':
      return {
        ...state,
        simulation: {
          ...state.simulation,
          status: 'preparing',
          currentRound: 0,
          isLoading: true,
          error: null,
        },
        history: [],
      };
    case 'SIMULATION_READY':
      return {
        ...state,
        simulation: {
          ...state.simulation,
          status: 'active',
          fileUris: action.payload.fileUris || [],
          documentContext: action.payload.documentContext || '',
        },
      };
    case 'SET_QUESTION':
      return {
        ...state,
        simulation: {
          ...state.simulation,
          currentRound: state.simulation.currentRound + 1,
          currentQuestion: action.payload,
          currentAnswer: '',
          currentFeedback: null,
          isLoading: false,
          error: null,
        },
      };
    case 'SET_ANSWER':
      return {
        ...state,
        simulation: {
          ...state.simulation,
          currentAnswer: action.payload,
        },
      };
    case 'SET_FEEDBACK':
      return {
        ...state,
        simulation: {
          ...state.simulation,
          currentFeedback: action.payload,
          isLoading: false,
        },
      };
    case 'SET_LOADING':
      return {
        ...state,
        simulation: { ...state.simulation, isLoading: action.payload },
      };
    case 'SET_ERROR':
      return {
        ...state,
        simulation: {
          ...state.simulation,
          error: action.payload,
          isLoading: false,
        },
      };
    case 'ADD_HISTORY':
      return {
        ...state,
        history: [...state.history, action.payload],
      };
    case 'FINISH_SIMULATION':
      return {
        ...state,
        simulation: { ...state.simulation, status: 'finished', isLoading: false },
      };
    case 'RESET_SIMULATION':
      return {
        ...state,
        simulation: {
          status: 'idle',
          currentRound: 0,
          currentQuestion: null,
          currentAnswer: '',
          currentFeedback: null,
          isLoading: false,
          error: null,
          fileUris: [],
          documentContext: '',
        },
        history: [],
        showSummary: false,
      };

    // === 總結 ===
    case 'TOGGLE_SUMMARY':
      return { ...state, showSummary: !state.showSummary };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 方便使用的 dispatch wrapper
  const actions = {
    toggleTheme: useCallback(() => dispatch({ type: 'TOGGLE_THEME' }), []),
    setApiKey: useCallback((key) => dispatch({ type: 'SET_API_KEY', payload: key }), []),
    toggleApiKeyModal: useCallback(() => dispatch({ type: 'TOGGLE_API_KEY_MODAL' }), []),
    addFiles: useCallback((files) => dispatch({ type: 'ADD_FILES', payload: files }), []),
    updateFile: useCallback((id, updates) => dispatch({ type: 'UPDATE_FILE', payload: { id, updates } }), []),
    removeFile: useCallback((id) => dispatch({ type: 'REMOVE_FILE', payload: id }), []),
    clearFiles: useCallback(() => dispatch({ type: 'CLEAR_FILES' }), []),
    updateSettings: useCallback((s) => dispatch({ type: 'UPDATE_SETTINGS', payload: s }), []),
    resetSettings: useCallback(() => dispatch({ type: 'RESET_SETTINGS' }), []),
    startSimulation: useCallback(() => dispatch({ type: 'START_SIMULATION' }), []),
    simulationReady: useCallback((data) => dispatch({ type: 'SIMULATION_READY', payload: data }), []),
    setQuestion: useCallback((q) => dispatch({ type: 'SET_QUESTION', payload: q }), []),
    setAnswer: useCallback((a) => dispatch({ type: 'SET_ANSWER', payload: a }), []),
    setFeedback: useCallback((f) => dispatch({ type: 'SET_FEEDBACK', payload: f }), []),
    setLoading: useCallback((l) => dispatch({ type: 'SET_LOADING', payload: l }), []),
    setError: useCallback((e) => dispatch({ type: 'SET_ERROR', payload: e }), []),
    addHistory: useCallback((h) => dispatch({ type: 'ADD_HISTORY', payload: h }), []),
    finishSimulation: useCallback(() => dispatch({ type: 'FINISH_SIMULATION' }), []),
    resetSimulation: useCallback(() => dispatch({ type: 'RESET_SIMULATION' }), []),
    toggleSummary: useCallback(() => dispatch({ type: 'TOGGLE_SUMMARY' }), []),
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
