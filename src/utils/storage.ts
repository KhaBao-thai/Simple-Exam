import type { Exam, ExamAttempt, AISettings } from '../types';
import { SAMPLE_EXAMS } from './sampleExams';

const STORAGE_KEY_EXAMS = 'simple_exam_library_v1';
const STORAGE_KEY_AI_SETTINGS = 'simple_exam_ai_settings_v1';

export const DEFAULT_GEMINI_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

export function getStoredExams(): Exam[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXAMS);
    if (raw === null) {
      // First time initialization ONLY
      saveExams(SAMPLE_EXAMS);
      return SAMPLE_EXAMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Strip any legacy placeholder/fake "(AI Gợi ý)" notes
      let modified = false;
      parsed.forEach((exam: Exam) => {
        exam.questions?.forEach((q) => {
          if (q.explanation && (q.explanation.includes('(AI Gợi ý)') || q.explanation.includes('Đề xuất lựa chọn'))) {
            q.explanation = '';
            modified = true;
          }
        });
      });
      if (modified) {
        saveExams(parsed);
      }
      return parsed; // Returns [] cleanly if all deleted!
    }
    return [];
  } catch (err) {
    console.error('Failed to load exams from storage:', err);
    return [];
  }
}

export function saveExams(exams: Exam[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(exams));
  } catch (err) {
    console.error('Failed to save exams to storage:', err);
  }
}

export function getExamById(id: string): Exam | undefined {
  const exams = getStoredExams();
  return exams.find((e) => e.id === id);
}

export function saveOrUpdateExam(exam: Exam): void {
  const exams = getStoredExams();
  const index = exams.findIndex((e) => e.id === exam.id);
  if (index >= 0) {
    exams[index] = { ...exam, updatedAt: Date.now() };
  } else {
    exams.unshift({ ...exam, updatedAt: Date.now() });
  }
  saveExams(exams);
}

export function deleteExam(id: string): void {
  const exams = getStoredExams();
  const filtered = exams.filter((e) => e.id !== id);
  saveExams(filtered);
}

export function clearAllExams(): void {
  saveExams([]);
}

export function duplicateExam(id: string): Exam | null {
  const exam = getExamById(id);
  if (!exam) return null;
  const newExam: Exam = {
    ...exam,
    id: 'exam_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: `${exam.title} (Bản sao)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    attempts: [],
    bestScore: undefined,
  };
  saveOrUpdateExam(newExam);
  return newExam;
}

export function recordExamAttempt(examId: string, attempt: ExamAttempt): Exam | null {
  const exam = getExamById(examId);
  if (!exam) return null;

  const attempts = exam.attempts ? [...exam.attempts, attempt] : [attempt];
  
  let bestScore = exam.bestScore;
  if (!bestScore || attempt.percentage >= bestScore.percentage) {
    bestScore = {
      score: attempt.score,
      total: attempt.totalQuestions,
      percentage: attempt.percentage,
      date: attempt.date,
    };
  }

  const updatedExam: Exam = {
    ...exam,
    attempts,
    bestScore,
    updatedAt: Date.now(),
  };

  saveOrUpdateExam(updatedExam);
  return updatedExam;
}

export function getAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AI_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Auto-migrate legacy/deprecated models like gemini-2.5-flash or gemini-1.5-flash
      let model = parsed.model || DEFAULT_GEMINI_MODEL;
      if (model.includes('2.5') || model.includes('1.5')) {
        model = DEFAULT_GEMINI_MODEL;
      }
      return {
        ...parsed,
        geminiApiKey: parsed.geminiApiKey?.trim() || DEFAULT_GEMINI_KEY,
        model,
        autoSolveMissing: parsed.autoSolveMissing ?? false,
      };
    }
  } catch (e) {
    console.error('Failed to load AI settings', e);
  }
  return {
    geminiApiKey: DEFAULT_GEMINI_KEY,
    model: DEFAULT_GEMINI_MODEL,
    autoSolveMissing: false,
  };
}

export function saveAISettings(settings: AISettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_AI_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save AI settings', e);
  }
}
