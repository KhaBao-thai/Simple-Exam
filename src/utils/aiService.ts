import type { Question, AISettings } from '../types';
import { getAISettings, DEFAULT_GEMINI_MODEL, saveAISettings } from './storage';

export interface AISolveResult {
  questionId: string;
  correctKey: string;
  explanation: string;
}

const FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];

/**
 * Executes a Gemini request with automatic fallback across viable models
 */
async function executeGeminiRequest(
  primaryModel: string,
  apiKey: string,
  requestBody: any,
  timeoutMs: number = 35000
): Promise<any | null> {
  const modelsToTry = Array.from(new Set([primaryModel, ...FALLBACK_MODELS]));

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

      const response = await fetch(endpoint, {
        method: 'POST',
        signal: abortController.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          if (model !== primaryModel) {
            const current = getAISettings();
            saveAISettings({ ...current, model });
          }
          return data;
        }
      } else {
        const err = await response.text();
        console.warn(`Model ${model} returned ${response.status}:`, err);
      }
    } catch (e) {
      console.warn(`Error calling model ${model}:`, e);
    }
  }

  return null;
}

/**
 * Solves a single batch of questions (max 8)
 */
async function solveBatchDirect(
  batch: Question[],
  apiKey: string,
  primaryModel: string
): Promise<Record<string, { correctOptionId: string; explanation: string }>> {
  const questionsPrompt = batch.map((q, idx) => {
    const opts = q.options.map((o) => `${o.key}. ${o.text}`).join('\n');
    const knownKey = q.correctOptionId ? q.options.find((o) => o.id === q.correctOptionId)?.key : undefined;
    const knownHint = knownKey ? ` (Đáp án chọn sẵn: ${knownKey})` : '';
    return `[Câu ${q.number || idx + 1}] (ID: ${q.id})${knownHint}\nĐề: ${q.text}\n${opts}`;
  }).join('\n\n---\n\n');

  const systemInstruction = `Bạn là một chuyên gia khảo thí và học thuật uy tín. Nhiệm vụ của bạn là giải chính xác các câu hỏi trắc nghiệm dưới đây (bao gồm Y khoa, Khoa học tự nhiên, Kỹ thuật, Xã hội, Ngôn ngữ) và viết lời giải thích chi tiết.
Quy tắc:
1. Suy luận cẩn trọng theo tiêu chuẩn khoa học để chọn đáp án đúng nhất (A, B, C, D...). Nếu đề có ghi "(Đáp án chọn sẵn: X)", hãy xác minh và giải thích vì sao X đúng.
2. Viết lời giải thích chuyên môn ngắn gọn, súc tích, dễ hiểu (1-3 câu), giải thích rõ cơ chế/lý do phương án này đúng và phân tích vì sao các phương án khác chưa chính xác.
3. Trả về đúng định dạng JSON array:
[
  {
    "id": "chuỗi id câu hỏi nguyên gốc",
    "correctKey": "A",
    "explanation": "Lời giải thích chi tiết chuyên môn"
  }
]`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: `${systemInstruction}\n\nDanh sách câu hỏi cần giải:\n\n${questionsPrompt}` }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  const data = await executeGeminiRequest(primaryModel, apiKey, requestBody, 35000);
  if (!data) return {};

  const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) return {};

  const cleanedJson = candidateText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
  const parsedAnswers: Array<{ id: string; correctKey: string; explanation: string }> = JSON.parse(cleanedJson);

  const resultMap: Record<string, { correctOptionId: string; explanation: string }> = {};

  for (const item of parsedAnswers) {
    const q = batch.find((quest) => quest.id === item.id);
    if (q) {
      const matchingOpt = q.options.find((o) => o.key.toUpperCase() === item.correctKey.toUpperCase());
      if (matchingOpt) {
        resultMap[q.id] = {
          correctOptionId: matchingOpt.id,
          explanation: item.explanation || '',
        };
      }
    }
  }

  return resultMap;
}

/**
 * Solves a single batch using the backend server proxy (/api/ai/solve)
 */
async function solveBatchViaServer(
  batch: Question[],
  userApiKey?: string,
  model?: string
): Promise<Record<string, { correctOptionId: string; explanation: string }>> {
  try {
    const res = await fetch('/api/ai/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questions: batch,
        userApiKey,
        model,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.results)) {
        const resultMap: Record<string, { correctOptionId: string; explanation: string }> = {};
        for (const item of json.results) {
          const q = batch.find((quest) => quest.id === item.id);
          if (q) {
            const matchingOpt = q.options.find((o) => o.key.toUpperCase() === item.correctKey?.toUpperCase());
            if (matchingOpt) {
              resultMap[q.id] = {
                correctOptionId: matchingOpt.id,
                explanation: item.explanation || '',
              };
            }
          }
        }
        return resultMap;
      }
    }
  } catch (e) {
    console.warn('Backend proxy solver unavailable:', e);
  }
  return {};
}

/**
 * Call Google Gemini API (or backend server proxy) to solve questions and generate explanations.
 * Safe & resilient: Batches requests in chunks of 8 to avoid timeouts and supports server-side proxy fallback.
 */
export async function solveQuestionsWithGemini(
  questions: Question[],
  settings?: AISettings
): Promise<Record<string, { correctOptionId: string; explanation: string }>> {
  if (!questions || questions.length === 0) return {};

  const currentSettings = settings || getAISettings();
  const apiKey = currentSettings.geminiApiKey?.trim();
  const primaryModel = currentSettings.model || DEFAULT_GEMINI_MODEL;

  // Split into manageable batches of 8 questions to prevent timeouts on large tests
  const BATCH_SIZE = 8;
  const batches: Question[][] = [];
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    batches.push(questions.slice(i, i + BATCH_SIZE));
  }

  const mergedResults: Record<string, { correctOptionId: string; explanation: string }> = {};

  const batchPromises = batches.map(async (batch) => {
    // 1. If client has API key, try direct call first
    if (apiKey) {
      try {
        const directRes = await solveBatchDirect(batch, apiKey, primaryModel);
        if (Object.keys(directRes).length > 0) {
          Object.assign(mergedResults, directRes);
          return;
        }
      } catch (err) {
        console.warn('Direct solve failed for batch, trying backend proxy...', err);
      }
    }

    // 2. Fallback: Try backend server proxy
    try {
      const serverRes = await solveBatchViaServer(batch, apiKey, primaryModel);
      if (Object.keys(serverRes).length > 0) {
        Object.assign(mergedResults, serverRes);
        return;
      }
    } catch (err) {
      console.warn('Server proxy solve failed for batch:', err);
    }
  });

  await Promise.all(batchPromises);

  return mergedResults;
}

/**
 * Uses Gemini AI to parse unstructured raw text into structured multiple-choice questions
 */
export async function parseQuizWithGemini(
  rawText: string,
  settings?: AISettings
): Promise<Question[]> {
  const currentSettings = settings || getAISettings();
  const apiKey = currentSettings.geminiApiKey?.trim();
  if (!apiKey || !rawText || rawText.trim().length === 0) return [];

  const primaryModel = currentSettings.model || DEFAULT_GEMINI_MODEL;

  const prompt = `Bạn là công cụ trích xuất câu hỏi trắc nghiệm từ văn bản. Hãy đọc văn bản sau và trích xuất tất cả các câu hỏi trắc nghiệm nhiều lựa chọn (multiple choice questions).
Với mỗi câu hỏi:
- text: nội dung câu hỏi
- options: danh sách các phương án [{"key": "A", "text": "nội dung phương án A"}, ...]
- correctKey: chữ cái đáp án đúng ("A", "B", "C", "D"...) nếu tìm thấy hoặc tự suy luận nếu đề chưa có
- explanation: giải thích ngắn gọn vì sao đáp án đúng

Trả về ĐÚNG định dạng JSON array (không thêm chữ gì ngoài JSON):
[
  {
    "number": 1,
    "text": "Nội dung câu hỏi...",
    "options": [
      { "key": "A", "text": "Phương án A" },
      { "key": "B", "text": "Phương án B" },
      { "key": "C", "text": "Phương án C" },
      { "key": "D", "text": "Phương án D" }
    ],
    "correctKey": "A",
    "explanation": "Giải thích..."
  }
]

Văn bản đầu vào:
${rawText.substring(0, 15000)}`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  try {
    const data = await executeGeminiRequest(primaryModel, apiKey, requestBody, 35000);
    if (!data) return [];

    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return [];

    const cleanedJson = candidateText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const parsedList: any[] = JSON.parse(cleanedJson);

    if (!Array.isArray(parsedList)) return [];

    const questions: Question[] = [];

    parsedList.forEach((item, idx) => {
      const qNum = item.number || idx + 1;
      const qId = `q_ai_${Date.now()}_${idx}`;
      const options = (item.options || []).map((o: any) => ({
        id: `${qId}_opt_${o.key}`,
        key: o.key,
        text: o.text || '',
      }));

      const matchingOpt = options.find((o: any) => o.key.toUpperCase() === item.correctKey?.toUpperCase());

      questions.push({
        id: qId,
        number: qNum,
        text: item.text || '',
        options,
        correctOptionId: matchingOpt ? matchingOpt.id : options[0]?.id,
        explanation: item.explanation || 'Được trích xuất và phân tích bởi AI.',
        aiGeneratedAnswer: true,
      });
    });

    return questions;
  } catch (err) {
    console.warn('AI parsing failed:', err);
    return [];
  }
}

/**
 * Local solver disabled - never invent fake answers or fake notes
 */
export function solveQuestionsLocally(
  _questions: Question[]
): Record<string, { correctOptionId: string; explanation: string }> {
  return {};
}
