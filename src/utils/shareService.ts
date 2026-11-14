import LZString from 'lz-string';
import QRCode from 'qrcode';
import type { Exam } from '../types';

export interface ShareBundle {
  version: number;
  type: 'simple-exam' | 'simple-exam-bundle';
  createdAt: number;
  appName: string;
  exams: Array<Omit<Exam, 'attempts' | 'bestScore'>>;
}

/**
 * Strips personal attempts and runtime stats to keep sharing lightweight
 */
export function sanitizeExamForShare(exam: Exam): Omit<Exam, 'attempts' | 'bestScore'> {
  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    sourceFileName: exam.sourceFileName,
    createdAt: exam.createdAt,
    updatedAt: exam.updatedAt,
    durationMinutes: exam.durationMinutes || 0,
    questions: exam.questions.map((q) => ({
      id: q.id,
      number: q.number,
      text: q.text,
      options: q.options,
      correctOptionId: q.correctOptionId,
      explanation: q.explanation,
      aiGeneratedAnswer: q.aiGeneratedAnswer,
    })),
    tags: exam.tags || [],
  };
}

/**
 * Packages single or multiple exams into a standard share bundle
 */
export function createShareBundle(exams: Exam[]): ShareBundle {
  return {
    version: 1,
    type: exams.length === 1 ? 'simple-exam' : 'simple-exam-bundle',
    createdAt: Date.now(),
    appName: 'SimpleExam',
    exams: exams.map(sanitizeExamForShare),
  };
}

/**
 * Compresses share bundle to a URL-safe encoded string
 */
export function encodeShareBundle(bundle: ShareBundle): string {
  const jsonStr = JSON.stringify(bundle);
  return LZString.compressToEncodedURIComponent(jsonStr);
}

/**
 * Decompresses a URL-safe encoded string back to a ShareBundle
 */
export function decodeShareBundle(encoded: string): ShareBundle | null {
  try {
    const jsonStr = LZString.decompressFromEncodedURIComponent(encoded);
    if (!jsonStr) return null;

    const parsed = JSON.parse(jsonStr);
    if (parsed && Array.isArray(parsed.exams) && parsed.exams.length > 0) {
      return parsed as ShareBundle;
    }
    // Also support raw single exam format if legacy
    if (parsed && parsed.id && Array.isArray(parsed.questions)) {
      return {
        version: 1,
        type: 'simple-exam',
        createdAt: parsed.createdAt || Date.now(),
        appName: 'SimpleExam',
        exams: [sanitizeExamForShare(parsed)],
      };
    }
    return null;
  } catch (e) {
    console.error('Failed to decode share bundle:', e);
    return null;
  }
}

/**
 * Generates full share URL
 */
export function generateShareUrl(bundle: ShareBundle): {
  url: string;
  charCount: number;
  isTooLongForQr: boolean;
  isTooLongForUrl: boolean;
} {
  const encoded = encodeShareBundle(bundle);
  // Build URL with hash parameter (avoids server 404s when hosted statically)
  const baseUrl = window.location.origin + window.location.pathname;
  const fullUrl = `${baseUrl}#share=${encoded}`;
  
  const charCount = fullUrl.length;
  // QR codes are recommended under 2200 chars for reliable camera scanning
  const isTooLongForQr = charCount > 2300;
  // Browser URLs should stay under ~8000 chars
  const isTooLongForUrl = charCount > 8000;

  return {
    url: fullUrl,
    charCount,
    isTooLongForQr,
    isTooLongForUrl,
  };
}

/**
 * Generates high-resolution QR code data URL
 */
export async function generateQrCode(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 360,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}

/**
 * Downloads a share bundle as a JSON file
 */
export function downloadShareBundleFile(bundle: ShareBundle, defaultFilename?: string): void {
  const filename =
    defaultFilename ||
    (bundle.exams.length === 1
      ? `${bundle.exams[0].title.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 40)}.json`
      : `KhoDeThi_SimpleExam_${new Date().toISOString().slice(0, 10)}.json`);

  const jsonStr = JSON.stringify(bundle, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
