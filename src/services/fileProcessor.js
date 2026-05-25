// ============================================================
// fileProcessor.js — 檔案文字擷取模組 (DOCX, PPTX, TXT)
// ============================================================
import mammoth from 'mammoth';
import JSZip from 'jszip';

/**
 * 根據檔案類型擷取文字內容
 * @param {File} file - 瀏覽器 File 物件
 * @returns {Promise<string>} 擷取的文字內容
 */
export async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  switch (ext) {
    case 'txt':
      return await readTextFile(file);
    case 'docx':
      return await readDocxFile(file);
    case 'pptx':
      return await readPptxFile(file);
    case 'pdf':
      // PDF 由 Gemini 原生處理，不需前端擷取
      return null;
    default:
      throw new Error(`不支援的檔案格式: .${ext}`);
  }
}

/**
 * 讀取純文字檔
 */
async function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('TXT 檔案讀取失敗'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * 讀取 DOCX 檔案（使用 mammoth）
 */
async function readDocxFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * 讀取 PPTX 檔案（使用 JSZip 解析 slide XML）
 */
async function readPptxFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const texts = [];
  const slideFiles = Object.keys(zip.files)
    .filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)[1]);
      const numB = parseInt(b.match(/slide(\d+)/)[1]);
      return numA - numB;
    });

  for (const slidePath of slideFiles) {
    const slideXml = await zip.files[slidePath].async('text');
    const slideTexts = extractTextFromXml(slideXml);
    const slideNum = slidePath.match(/slide(\d+)/)[1];
    if (slideTexts.trim()) {
      texts.push(`【投影片 ${slideNum}】\n${slideTexts}`);
    }
  }

  return texts.join('\n\n');
}

/**
 * 從 OOXML 中提取文字
 */
function extractTextFromXml(xml) {
  // 匹配 <a:t> 標籤中的文字
  const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
  if (!matches) return '';

  return matches
    .map((m) => {
      const textMatch = m.match(/<a:t[^>]*>([^<]*)<\/a:t>/);
      return textMatch ? textMatch[1] : '';
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * 將 File 轉為 base64
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('檔案讀取失敗'));
    reader.readAsDataURL(file);
  });
}
