// ============================================================
// geminiService.js — Gemini API 封裝模組
// ============================================================
import { GEMINI_BASE_URL, GEMINI_MODEL, MIME_TYPES, GEMINI_NATIVE_TYPES } from '../utils/constants';
import { buildSystemInstruction, buildQuestionPrompt, buildScoringPrompt } from './promptBuilder';
import { safeParseJSON, validateQuestionSchema, validateFeedbackSchema } from './schemaValidator';
import { extractTextFromFile, fileToBase64 } from './fileProcessor';

// 重試設定
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * 延遲函式
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 帶重試的 fetch
 */
async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        // Rate limit
        if (i < retries) {
          const waitTime = RETRY_DELAY_MS * Math.pow(2, i);
          console.warn(`Rate limited. 等待 ${waitTime}ms 後重試...`);
          await delay(waitTime);
          continue;
        }
        throw new Error('已達到 API 請求頻率限制（429）。請等待 1~2 分鐘後重試，或改用 gemini-2.5-flash 模型（免費版限制較寬鬆）。');
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error('API Key 無效或已過期，請重新設定');
      }

      if (response.status >= 500) {
        if (i < retries) {
          await delay(RETRY_DELAY_MS * Math.pow(2, i));
          continue;
        }
        throw new Error(`Gemini API 伺服器錯誤 (${response.status})，請稍後再試`);
      }

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`API 錯誤 (${response.status}): ${errBody}`);
      }

      return await response.json();
    } catch (err) {
      if (err.message.includes('API Key') || err.message.includes('API 錯誤')) {
        throw err; // 不重試
      }
      if (i === retries) {
        throw new Error(`網路請求失敗: ${err.message}`);
      }
      await delay(RETRY_DELAY_MS * Math.pow(2, i));
    }
  }
}

// ============================================================
// 檔案上傳
// ============================================================

/**
 * 上傳檔案至 Gemini Files API（僅 PDF）
 * @param {File} file - 瀏覽器 File 物件
 * @param {string} apiKey
 * @returns {{ uri: string, mimeType: string, name: string }}
 */
export async function uploadFileToGemini(file, apiKey) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (!GEMINI_NATIVE_TYPES.includes(ext)) {
    // 非 PDF 格式，擷取文字返回
    const text = await extractTextFromFile(file);
    return { uri: null, mimeType: null, name: file.name, textContent: text };
  }

  // PDF → 使用 Files API multipart upload
  const url = `${GEMINI_BASE_URL.replace('/v1beta', '')}/upload/v1beta/files?key=${apiKey}`;

  const metadata = { file: { display_name: file.name } };
  const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });

  const formData = new FormData();
  formData.append('metadata', metadataBlob);
  formData.append('file', file);

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'X-Goog-Upload-Protocol': 'multipart' },
    body: formData,
  });

  if (!response?.file?.uri) {
    throw new Error('檔案上傳失敗：回傳中缺少 file URI');
  }

  // 等待處理完成
  let fileInfo = response.file;
  let attempts = 0;
  while (fileInfo.state === 'PROCESSING' && attempts < 30) {
    await delay(2000);
    const getUrl = `${GEMINI_BASE_URL}/files/${fileInfo.name}?key=${apiKey}`;
    const getResp = await fetch(getUrl);
    fileInfo = (await getResp.json());
    // Handle nested structure
    if (fileInfo.file) fileInfo = fileInfo.file;
    attempts++;
  }

  if (fileInfo.state === 'FAILED') {
    throw new Error('檔案處理失敗');
  }

  return {
    uri: fileInfo.uri,
    mimeType: fileInfo.mimeType || MIME_TYPES[ext],
    name: fileInfo.name || file.name,
    textContent: null,
  };
}

/**
 * 批量上傳檔案
 */
export async function uploadFilesToGemini(files, apiKey, onProgress) {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    try {
      if (onProgress) onProgress(files[i].id, 'uploading');
      const result = await uploadFileToGemini(files[i].rawFile, apiKey);
      results.push({ fileId: files[i].id, ...result });
      if (onProgress) onProgress(files[i].id, 'ready');
    } catch (err) {
      results.push({ fileId: files[i].id, error: err.message });
      if (onProgress) onProgress(files[i].id, 'error', err.message);
    }
  }
  return results;
}

// ============================================================
// 內容生成
// ============================================================

/**
 * 建立 generateContent 請求
 */
function buildGenerateContentRequest({ apiKey, prompt, fileRefs, documentContext }) {
  const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const parts = [];

  // 加入檔案引用
  if (fileRefs && fileRefs.length > 0) {
    for (const ref of fileRefs) {
      if (ref.uri) {
        parts.push({ file_data: { mime_type: ref.mimeType, file_uri: ref.uri } });
      }
    }
  }

  // 加入 prompt 文字
  parts.push({ text: prompt });

  const body = {
    system_instruction: {
      parts: [{ text: buildSystemInstruction() }],
    },
    contents: [
      { role: 'user', parts },
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 8192,
    },
  };

  return { url, body };
}

/**
 * 生成評審問題
 */
export async function generateJudgeQuestion({ apiKey, settings, history, fileRefs, documentContext, isFollowUp, lastFeedback }) {
  const prompt = buildQuestionPrompt({
    settings,
    history,
    documentContext,
    isFollowUp,
    lastFeedback,
  });

  const { url, body } = buildGenerateContentRequest({
    apiKey,
    prompt,
    fileRefs,
    documentContext,
  });

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  // 提取回覆文字
  const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('AI 未回傳有效內容');
  }

  // 解析 JSON
  const parsed = safeParseJSON(text);
  if (!parsed.success) {
    throw new Error(`問題生成 JSON 解析失敗: ${parsed.error}\n原始回應: ${text}`);
  }

  // 驗證 schema
  const validation = validateQuestionSchema(parsed.data);
  if (!validation.valid) {
    console.warn('問題 schema 驗證警告:', validation.errors);
  }

  return validation.data;
}

/**
 * 評分回答
 */
export async function scoreAnswer({ apiKey, question, answer, settings, fileRefs, documentContext }) {
  const prompt = buildScoringPrompt({
    question,
    answer,
    documentContext,
    settings,
  });

  const { url, body } = buildGenerateContentRequest({
    apiKey,
    prompt,
    fileRefs,
    documentContext,
  });

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('AI 未回傳有效評分內容');
  }

  const parsed = safeParseJSON(text);
  if (!parsed.success) {
    throw new Error(`評分 JSON 解析失敗: ${parsed.error}\n原始回應: ${text}`);
  }

  const validation = validateFeedbackSchema(parsed.data);
  if (!validation.valid) {
    console.warn('評分 schema 驗證警告:', validation.errors);
  }

  return validation.data;
}
