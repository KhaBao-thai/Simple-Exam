import type { Question, Option } from '../types';
import { normalizeVietnameseSpacing } from './fileExtractors';

export interface ParseResult {
  title: string;
  questions: Question[];
  rawText: string;
}

/**
 * Extracts answer key map from bottom answer table if present (e.g., 1.A 2.B 3.C or 1-A 2-B)
 */
function extractBottomAnswerKey(text: string): Record<number, string> {
  const answerMap: Record<number, string> = {};

  // Find sections often titled "ĐÁP ÁN", "BẢNG ĐÁP ÁN", "ANSWER KEY"
  const answerSectionRegex = /(?:bảng\s*đáp\s*án|phần\s*đáp\s*án|hướng\s*dẫn\s*chấm|khung\s*đáp\s*án|\bđáp\s*án\b|\banswer\s*key\b)[\s\S]*$/i;
  const matchSection = text.match(answerSectionRegex);

  // If no explicit answer key section is found, NEVER scan the whole document
  if (!matchSection) {
    return answerMap;
  }

  const targetText = matchSection[0];

  // Pattern 1: "Câu 1: A", "1.A", "1: A", "1-A", "1. A"
  const itemRegex1 = /(?:câu\s*)?(\d+)\s*[:.\-\)]\s*([A-D])(?=[.\s,;\)\n\t]|$)(?![a-zA-Zà-ỹ])/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex1.exec(targetText)) !== null) {
    const qNum = parseInt(match[1], 10);
    const ansKey = match[2].toUpperCase();
    if (qNum > 0 && !answerMap[qNum]) {
      answerMap[qNum] = ansKey;
    }
  }

  // Pattern 2: "1A 2B 3C 4D" (compact list)
  const itemRegex2 = /\b(\d+)\s*([A-D])(?=[.\s,;\)\n\t]|$)(?![a-zA-Zà-ỹ])/gi;
  while ((match = itemRegex2.exec(targetText)) !== null) {
    const qNum = parseInt(match[1], 10);
    const ansKey = match[2].toUpperCase();
    if (qNum > 0 && !answerMap[qNum]) {
      answerMap[qNum] = ansKey;
    }
  }

  return answerMap;
}

/**
 * Splits raw text into question blocks based on question headers
 */
export function parseQuizText(rawText: string, defaultTitle?: string): ParseResult {
  // Normalize line endings and repair fragmented Vietnamese syllables (from PDFs or paste)
  const normalizedText = normalizeVietnameseSpacing(
    rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim()
  );

  // Try to deduce title from the first lines if available
  const lines = normalizedText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  let title = defaultTitle || 'Bài trắc nghiệm mới';
  if (lines.length > 0 && !lines[0].match(/^(?:câu|question|\d+[\.\)])/i)) {
    title = lines[0].replace(/^[#\*\s\-_=]+|[#\*\s\-_=]+$/g, '').trim();
    if (title.length > 80) {
      title = title.substring(0, 80) + '...';
    }
  }

  const bottomAnswerMap = extractBottomAnswerKey(normalizedText);

  // Regex to match question start: "Câu 1:", "Câu 1.", "Question 1:", "1.", "1)", etc.
  // Using a regex split with lookahead
  const questionDelimiter = /(?=(?:^|\n)\s*(?:câu\s*\d+|question\s*\d+|\d+[\.\)]|\b\d+\/)\s*[:\.\-\)]?)/i;

  const blocks = normalizedText.split(questionDelimiter);
  const questions: Question[] = [];

  let currentNumber = 1;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Must look somewhat like a question (starts with number or Câu/Question)
    const headerMatch = trimmed.match(/^(?:câu\s*(\d+)|question\s*(\d+)|(\d+)[\.\)]|\b(\d+)\/)\s*[:\.\-\)]?\s*/i);

    // If it doesn't match header and we haven't found any questions yet, skip (likely header intro/metadata)
    if (!headerMatch) {
      if (questions.length === 0) continue;
      // If questions already exist, it might be an orphaned block or bottom section, skip if it's purely answer key
      if (trimmed.match(/^(?:bảng\s*đáp\s*án|answer\s*key)/i)) continue;
    }

    let qNum = currentNumber;
    if (headerMatch) {
      const numStr = headerMatch[1] || headerMatch[2] || headerMatch[3] || headerMatch[4];
      if (numStr) {
        qNum = parseInt(numStr, 10);
      }
    }

    // Remove the question header from text
    let content = headerMatch ? trimmed.substring(headerMatch[0].length).trim() : trimmed;

    // Check for inline explanation
    let explanation: string | undefined = undefined;
    const expMatch = content.match(/(?:\n|^)\s*(?:lời\s*giải|hướng\s*dẫn\s*giải|giải\s*thích|explanation)\s*[:\.\-]\s*([\s\S]*)$/i);
    if (expMatch) {
      explanation = expMatch[1].trim();
      content = content.substring(0, expMatch.index).trim();
    }

    // Check for inline answer: "Đáp án: A", "Đ/A: B", "Answer: C", "Key: D"
    let inlineAnswerKey: string | undefined = undefined;
    const ansMatch = content.match(/(?:\n|^)\s*(?:đáp\s*án(?:\s*đúng)?|đ\/a|đáp\s*số|answer|key)\s*[:.\-]?\s*([A-D])(?=[.\s,;\)\n]|$)(?![a-zA-Zà-ỹ])/i);
    if (ansMatch) {
      inlineAnswerKey = ansMatch[1].toUpperCase();
      content = content.replace(ansMatch[0], '').trim();
    }

    // Now extract options: A, B, C, D (supports *A., A*., A. *xxx, (Đúng))
    const parsedQuestion = parseQuestionContent(content, qNum);

    if (parsedQuestion.options.length >= 2) {
      // Determine correct answer:
      // Priority 1: marked on option (*A, (Đúng)...)
      // Priority 2: inline answer (Đáp án: A)
      // Priority 3: bottom answer map
      const finalKey = parsedQuestion.markedCorrectKey || inlineAnswerKey || bottomAnswerMap[qNum];
      if (finalKey) {
        const matchingOpt = parsedQuestion.options.find(
          (o) => o.key.toUpperCase() === finalKey.toUpperCase()
        );
        if (matchingOpt) {
          parsedQuestion.correctOptionId = matchingOpt.id;
        }
      }

      if (explanation) {
        parsedQuestion.explanation = explanation;
      }

      // Clean up internal helper field
      delete parsedQuestion.markedCorrectKey;

      questions.push(parsedQuestion);
      currentNumber = qNum + 1;
    }
  }

  // Fallback: If standard delimiter failed to parse (e.g. format is unusual), attempt line-by-line fallback
  if (questions.length === 0) {
    const fallbackQuestions = fallbackLineByLineParse(normalizedText);
    if (fallbackQuestions.length > 0) {
      return {
        title,
        questions: fallbackQuestions,
        rawText: normalizedText,
      };
    }
  }

  return {
    title,
    questions,
    rawText: normalizedText,
  };
}

interface ParsedQuestionWithMark extends Question {
  markedCorrectKey?: string;
}

/**
 * Parses the prompt and options from question body text
 */
function parseQuestionContent(bodyText: string, qNum: number): ParsedQuestionWithMark {
  const qId = `q_${qNum}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Find option markers like A., B., C., D. or A), B), C), D) or *A., A*., *A)
  // Handles both inline (A. apple   B. banana) and multiline
  const optionRegex = /(?:^|\s+|\n)([*]?\s*[A-D]\s*[*]?)(?:[\.\)]|\])\s+/g;
  
  const matches: Array<{
    key: string;
    isAsteriskMarked: boolean;
    index: number;
    fullMatchLength: number;
  }> = [];
  let m: RegExpExecArray | null;

  while ((m = optionRegex.exec(bodyText)) !== null) {
    const rawMarker = m[1].replace(/\s+/g, '');
    const isAsteriskMarked = rawMarker.includes('*');
    const key = rawMarker.replace(/[^A-D]/gi, '').toUpperCase();

    matches.push({
      key,
      isAsteriskMarked,
      index: m.index,
      fullMatchLength: m[0].length,
    });
  }

  let markedCorrectKey: string | undefined = undefined;

  // If we found at least 2 consecutive-like options (A and B...)
  if (matches.length >= 2) {
    const firstOptionIndex = matches[0].index;
    const promptText = bodyText.substring(0, firstOptionIndex).trim();

    const options: Option[] = [];
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const startText = current.index + current.fullMatchLength;
      const endText = i + 1 < matches.length ? matches[i + 1].index : bodyText.length;
      let optText = bodyText.substring(startText, endText).trim();

      // Check if option text starts with * or ends with (Đúng), [Đúng], (*)
      let isCorrect = current.isAsteriskMarked;
      if (/^\*\s*/.test(optText)) {
        isCorrect = true;
        optText = optText.replace(/^\*\s*/, '').trim();
      }
      if (/\s*[\(\[]\s*(?:đúng|chính xác|\*)\s*[\)\]]$/i.test(optText)) {
        isCorrect = true;
        optText = optText.replace(/\s*[\(\[]\s*(?:đúng|chính xác|\*)\s*[\)\]]$/i, '').trim();
      }

      if (isCorrect) {
        markedCorrectKey = current.key;
      }

      options.push({
        id: `${qId}_opt_${current.key}`,
        key: current.key,
        text: optText,
      });
    }

    return {
      id: qId,
      number: qNum,
      text: promptText,
      options,
      markedCorrectKey,
    };
  }

  // If regex failed to find A., B., try standard lines
  const lines = bodyText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const promptLines: string[] = [];
  const options: Option[] = [];

  for (const line of lines) {
    const optLineMatch = line.match(/^([*]?\s*[A-D]\s*[*]?)(?:[\.\)]|\])\s*(.*)$/i);
    if (optLineMatch) {
      const rawMarker = optLineMatch[1].replace(/\s+/g, '');
      const isAsteriskMarked = rawMarker.includes('*');
      const key = rawMarker.replace(/[^A-D]/gi, '').toUpperCase();
      let optText = optLineMatch[2].trim();

      let isCorrect = isAsteriskMarked;
      if (/^\*\s*/.test(optText)) {
        isCorrect = true;
        optText = optText.replace(/^\*\s*/, '').trim();
      }
      if (/\s*[\(\[]\s*(?:đúng|chính xác|\*)\s*[\)\]]$/i.test(optText)) {
        isCorrect = true;
        optText = optText.replace(/\s*[\(\[]\s*(?:đúng|chính xác|\*)\s*[\)\]]$/i, '').trim();
      }

      if (isCorrect) {
        markedCorrectKey = key;
      }

      options.push({
        id: `${qId}_opt_${key}`,
        key,
        text: optText,
      });
    } else if (options.length === 0) {
      promptLines.push(line);
    }
  }

  return {
    id: qId,
    number: qNum,
    text: promptLines.join('\n').trim() || bodyText,
    options,
    markedCorrectKey,
  };
}

/**
 * Fallback parser for plain text lists
 */
function fallbackLineByLineParse(text: string): Question[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const questions: Question[] = [];
  let currentQ: Partial<Question> | null = null;
  let qCount = 0;

  for (const line of lines) {
    const qHeaderMatch = line.match(/^(?:câu|question|\d+[\.\)])\s*(\d+)?[:\.\-\)]?\s*(.*)$/i);
    const optMatch = line.match(/^([A-D])[\.\)]\s*(.*)$/i);

    if (qHeaderMatch && !optMatch) {
      if (currentQ && currentQ.options && currentQ.options.length >= 2) {
        questions.push(currentQ as Question);
      }
      qCount++;
      const id = `fallback_q_${qCount}`;
      currentQ = {
        id,
        number: qCount,
        text: qHeaderMatch[2] || line,
        options: [],
      };
    } else if (optMatch && currentQ) {
      const key = optMatch[1].toUpperCase();
      currentQ.options = currentQ.options || [];
      currentQ.options.push({
        id: `${currentQ.id}_opt_${key}`,
        key,
        text: optMatch[2].trim(),
      });
    } else if (currentQ && (!currentQ.options || currentQ.options.length === 0)) {
      currentQ.text = (currentQ.text ? currentQ.text + '\n' : '') + line;
    }
  }

  if (currentQ && currentQ.options && currentQ.options.length >= 2) {
    questions.push(currentQ as Question);
  }

  return questions;
}
