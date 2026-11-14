import * as pdfjsLib from 'pdfjs-dist';
// Import worker directly via Vite's asset query so versions always match exactly 100%
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

// Set up pdf.js worker using local bundled worker
try {
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  }
} catch (e) {
  console.warn('PDF.js worker setup warning:', e);
}

/**
 * Normalizes Vietnamese text by repairing syllables that were broken apart by PDF character segmentation
 */
export function normalizeVietnameseSpacing(text: string): string {
  if (!text) return '';

  let s = text;

  const vowels = '[aăâeêioôơuưyAĂÂEÊIOÔƠUƯYàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ]';
  const accentedVowels = '[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ]';
  const initialClusters = '(?:ngh|ng|nh|ch|th|tr|kh|ph|gh|gi|qu|[bcdđghklmnprstvxBCDĐGHKLMNPRSTVX])';
  const finalClusters = '(?:ng|nh|ch|[cptmniyuoCPTMNIYUO])';

  for (let iter = 0; iter < 5; iter++) {
    // 1. Initial consonant + vowel (e.g. 'h ấp', 'ch ất', 's ố', 'ph ổi', 'g ợ', 't ắ')
    s = s.replace(new RegExp('(^|[\\s(„“\"])(' + initialClusters + ')\\s+(' + vowels + '[a-zA-Zà-ỹ]*)', 'g'),
      (match, lead, init, rest) => {
        // Avoid merging multiple-choice option letters like 'A. ', 'B. ', 'C. ', 'D. '
        if (/^[A-D]$/i.test(init) && /^[\.\)\]]/.test(rest)) return match;
        // Avoid merging standalone long words
        if (init.length > 2 && !/^(?:ngh|ng|nh|ch|th|tr|kh|ph|gh|gi|qu)$/i.test(init)) return match;
        return lead + init + rest;
      }
    );

    // 2. Trailing consonant / glide (e.g. 'đạ t', 'lượ ng', 'dướ i', 'thườ ng', 'tắ c', 'độ c', 'rố i', 'gợ i')
    s = s.replace(new RegExp('([a-zA-Zà-ỹ]*' + accentedVowels + '[a-zA-Zà-ỹ]*)\\s+(' + finalClusters + ')(?=[\\s.,!?;:)\\]]|$)', 'g'),
      (_match, root, end) => root + end
    );

    // 3. Medial 'o' or 'u' glide: 'lo ạ' -> 'loạ', 'to à' -> 'toà', 'ho à' -> 'hoà'
    s = s.replace(new RegExp('([a-zA-Zà-ỹ]+[ouOU])\\s+(' + accentedVowels + '[a-zA-Zà-ỹ]*)', 'g'),
      (_match, p1, p2) => p1 + p2
    );
  }

  // Handle specific frequent PDF extraction artifacts
  s = s.replace(/\bT\s+ỷ\b/g, 'Tỷ')
       .replace(/\bt\s+ỷ\b/g, 'tỷ')
       .replace(/\bg\s+i\s+ớ\s+i\b/gi, 'giới')
       .replace(/\bh\s+ô\b\s+h\s*áp\b/gi, 'hô hấp')
       .replace(/\bh\s*áp\s+ký\b/gi, 'hấp ký')
       .replace(/[ \t]{2,}/g, ' ')
       .trim();

  return s;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  // Ensure worker is explicitly set before calling getDocument
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    useSystemFonts: true,
  });
  const pdfDoc = await loadingTask.promise;
  
  const textChunks: string[] = [];
  const numPages = pdfDoc.numPages;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    
    const items = textContent.items as Array<{
      str?: string;
      transform?: number[];
      width?: number;
    }>;

    let pageText = '';
    let lastY: number | null = null;
    let lastX: number | null = null;
    let lastWidth: number = 0;

    for (const item of items) {
      if (item.str === undefined) continue;
      const str = item.str;
      if (str === '') continue;

      const currentX = item.transform ? item.transform[4] : null;
      const currentY = item.transform ? item.transform[5] : null;
      const currentWidth = item.width || 0;

      if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
        // New line
        pageText += '\n';
      } else if (lastX !== null && currentX !== null && lastY !== null && currentY !== null) {
        // Same line: determine gap between previous item and current item
        const gap = currentX - (lastX + lastWidth);

        // Natural word spaces in standard fonts are >= 3.2 units.
        // Smaller gaps are kerning/font fragments in Vietnamese and should NOT have spaces inserted.
        if (gap >= 3.2 && !pageText.endsWith(' ') && !str.startsWith(' ')) {
          pageText += ' ';
        }
      }

      pageText += str;
      lastX = currentX;
      lastY = currentY;
      lastWidth = currentWidth;
    }

    const cleaned = normalizeVietnameseSpacing(pageText.trim());
    textChunks.push(cleaned);
  }

  return textChunks.join('\n\n');
}

export async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return normalizeVietnameseSpacing(result.value);
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.pdf')) {
    return extractTextFromPdf(file);
  } else if (name.endsWith('.docx')) {
    return extractTextFromDocx(file);
  } else if (name.endsWith('.txt') || name.endsWith('.md')) {
    const text = await file.text();
    return normalizeVietnameseSpacing(text);
  } else {
    const text = await file.text();
    return normalizeVietnameseSpacing(text);
  }
}
