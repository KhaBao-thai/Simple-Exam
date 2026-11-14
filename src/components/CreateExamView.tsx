import React, { useState, useRef } from 'react';
import type { Exam, Question } from '../types';
import { extractTextFromFile } from '../utils/fileExtractors';
import { parseQuizText } from '../utils/quizParser';
import { solveQuestionsWithGemini, parseQuizWithGemini } from '../utils/aiService';
import { getAISettings } from '../utils/storage';
import {
  UploadCloud,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Tag,
  ClipboardList,
  Plus
} from 'lucide-react';

interface CreateExamViewProps {
  onExamCreated: (exam: Exam, targetMode: 'practice' | 'editor') => void;
  onCancel: () => void;
}

export const CreateExamView: React.FC<CreateExamViewProps> = ({
  onExamCreated,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Parsing & Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result Preview State
  const [parsedExam, setParsedExam] = useState<{
    title: string;
    description: string;
    durationMinutes: number;
    tags: string;
    questions: Question[];
    missingCount: number;
    sourceFileName?: string;
  } | null>(null);

  const [autoSolveWithAI, setAutoSolveWithAI] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setParsedExam(null);
  };

  const processContent = async (text: string, fileName?: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      setProcessingStep('Đang phân tích cấu trúc câu hỏi...');
      await new Promise((r) => setTimeout(r, 150));

      const defaultTitle = fileName
        ? fileName.replace(/\.[^/.]+$/, '').replace(/[_-\s]+/g, ' ')
        : 'Bài trắc nghiệm mới';

      // 1. Try standard parser
      const parseRes = parseQuizText(text, defaultTitle);
      let questions = parseRes.questions;

      // 2. If regex parser found 0 questions, attempt Gemini AI parsing
      if (questions.length === 0) {
        setProcessingStep('Đang kích hoạt AI đọc hiểu và bóc tách câu hỏi từ tài liệu...');
        const aiQuestions = await parseQuizWithGemini(text);
        if (aiQuestions.length > 0) {
          questions = aiQuestions;
        }
      }

      if (questions.length === 0) {
        throw new Error(
          'Không tìm thấy câu hỏi trắc nghiệm nào trong tài liệu. Vui lòng đảm bảo các câu hỏi có định dạng như "Câu 1:", "1.", và các lựa chọn "A.", "B.", "C.", "D." hoặc bấm nút "Tạo đề trống" bên dưới để tự nhập.'
        );
      }

      // 3. If user enabled AI, automatically solve missing answers and generate detailed explanations
      if (autoSolveWithAI) {
        const targetQuestions = questions.filter(
          (q) => !q.correctOptionId || !q.explanation || q.explanation.trim().length === 0
        );

        if (targetQuestions.length > 0) {
          setProcessingStep(`AI đang suy luận đáp án và soạn lời giải thích chi tiết cho ${targetQuestions.length} câu hỏi...`);
          const aiSettings = getAISettings();
          const solvedMap = await solveQuestionsWithGemini(targetQuestions, aiSettings);

          questions = questions.map((q) => {
            if (solvedMap[q.id]) {
              return {
                ...q,
                correctOptionId: q.correctOptionId || solvedMap[q.id].correctOptionId,
                explanation: q.explanation || solvedMap[q.id].explanation,
                aiGeneratedAnswer: !q.correctOptionId,
              };
            }
            return q;
          });
        }
      }

      const calculatedDuration = Math.max(5, Math.ceil(questions.length * 1.5));

      setParsedExam({
        title: parseRes.title || defaultTitle,
        description: `Tạo từ ${fileName || 'nội dung dán trực tiếp'} với ${questions.length} câu hỏi.`,
        durationMinutes: calculatedDuration,
        tags: 'Trắc nghiệm',
        questions,
        missingCount: questions.filter((q) => !q.correctOptionId).length,
        sourceFileName: fileName,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Đã xảy ra lỗi khi phân tích tài liệu.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleStartParsing = async () => {
    if (activeTab === 'upload') {
      if (!selectedFile) return;
      setIsProcessing(true);
      setProcessingStep('Đang trích xuất nội dung văn bản từ tệp...');
      try {
        const text = await extractTextFromFile(selectedFile);
        if (!text || text.trim().length === 0) {
          throw new Error('Tệp không có nội dung văn bản hoặc không thể đọc được.');
        }
        await processContent(text, selectedFile.name);
      } catch (err: any) {
        setIsProcessing(false);
        setErrorMessage(err.message || 'Không thể trích xuất văn bản từ tệp này.');
      }
    } else {
      if (!pastedText.trim()) return;
      await processContent(pastedText.trim(), 'Van_ban_dan.txt');
    }
  };

  // Create an empty blank exam directly
  const handleCreateBlankExam = () => {
    const blankId = 'exam_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const qId = `q_1_${Date.now()}`;
    const newExam: Exam = {
      id: blankId,
      title: 'Bài trắc nghiệm mới',
      description: 'Soạn thảo câu hỏi trắc nghiệm',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      durationMinutes: 15,
      tags: ['Tự soạn'],
      questions: [
        {
          id: qId,
          number: 1,
          text: 'Nhập nội dung câu hỏi số 1...',
          options: [
            { id: `${qId}_opt_A`, key: 'A', text: 'Lựa chọn A' },
            { id: `${qId}_opt_B`, key: 'B', text: 'Lựa chọn B' },
            { id: `${qId}_opt_C`, key: 'C', text: 'Lựa chọn C' },
            { id: `${qId}_opt_D`, key: 'D', text: 'Lựa chọn D' },
          ],
          correctOptionId: `${qId}_opt_A`,
          explanation: '',
        },
      ],
    };

    onExamCreated(newExam, 'editor');
  };

  const handleSaveAndGo = (targetMode: 'practice' | 'editor') => {
    if (!parsedExam) return;

    const newExam: Exam = {
      id: 'exam_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: parsedExam.title.trim() || 'Bài trắc nghiệm mới',
      description: parsedExam.description.trim(),
      sourceFileName: parsedExam.sourceFileName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      durationMinutes: parsedExam.durationMinutes,
      questions: parsedExam.questions,
      tags: parsedExam.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    onExamCreated(newExam, targetMode);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Tạo bài trắc nghiệm
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto">
          Tự động trích xuất từ PDF, Word hoặc dán trực tiếp. Hệ thống nhận diện câu hỏi, đáp án và hỗ trợ AI giải đề tự động.
        </p>

        {/* Tab Switcher */}
        <div className="mt-6 inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium">
          <button
            onClick={() => {
              setActiveTab('upload');
              setParsedExam(null);
            }}
            className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Tải tệp lên (.pdf, .docx)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('paste');
              setParsedExam(null);
            }}
            className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'paste'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Dán nội dung trực tiếp</span>
          </button>
        </div>
      </div>

      {/* Main Form */}
      {!parsedExam ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          {activeTab === 'upload' ? (
            <div>
              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-slate-400 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto mb-4">
                  {selectedFile ? <FileText className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
                </div>

                {selectedFile ? (
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-base">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Nhấp để chọn file khác
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm sm:text-base">
                      Kéo thả file tài liệu vào đây hoặc <span className="underline font-semibold">chọn tệp từ máy tính</span>
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      Hỗ trợ PDF (.pdf), Word (.docx), hoặc Text (.txt, .md)
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Nội dung câu hỏi trắc nghiệm
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Dán đề thi của bạn vào đây...&#10;&#10;Ví dụ:&#10;Câu 1: Thủ đô của Việt Nam là gì?&#10;A. Hà Nội&#10;B. Đà Nẵng&#10;C. TP. Hồ Chí Minh&#10;D. Huế&#10;Đáp án: A&#10;Lời giải: Hà Nội là thủ đô của nước CHXHCN Việt Nam."
                rows={10}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500 font-mono text-xs leading-relaxed transition-all"
              />
            </div>
          )}

          {/* AI Toggle */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Tự động nhờ AI giải đề & tạo lời giải thích chi tiết
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  AI sẽ suy luận đáp án chính xác và thêm lời giải thích học thuật cho từng câu hỏi
                </p>
                {!getAISettings().geminiApiKey?.trim() && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                    ⚠️ Nhớ nhập API Key tại menu <strong>Cài đặt AI</strong> trên thanh menu để kích hoạt tính năng này nhé!
                  </p>
                )}
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSolveWithAI}
                onChange={(e) => setAutoSolveWithAI(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-slate-900 dark:peer-checked:bg-slate-100 dark:peer-checked:after:bg-slate-900"></div>
            </label>
          </div>

          {/* Error display */}
          {errorMessage && (
            <div className="mt-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleCreateBlankExam}
              type="button"
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo đề trống và tự nhập câu hỏi</span>
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                onClick={onCancel}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors"
              >
                Hủy
              </button>

              <button
                onClick={handleStartParsing}
                disabled={isProcessing || (activeTab === 'upload' ? !selectedFile : !pastedText.trim())}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs ${
                  isProcessing || (activeTab === 'upload' ? !selectedFile : !pastedText.trim())
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{processingStep || 'Đang xử lý...'}</span>
                  </>
                ) : (
                  <>
                    <span>Bắt đầu phân tích</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Preview & Confirmation Step */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Phân tích thành công</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Xem trước thông tin đề thi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Đã nhận diện được{' '}
            <strong className="text-slate-900 dark:text-white">{parsedExam.questions.length}</strong> câu hỏi trắc nghiệm.
            {parsedExam.missingCount > 0 && (
              <span className="text-amber-600 dark:text-amber-400 ml-1">
                (Còn {parsedExam.missingCount} câu chưa có đáp án, bạn có thể chỉnh sửa hoặc nhờ AI giải trong Editor).
              </span>
            )}
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tiêu đề đề thi
              </label>
              <input
                type="text"
                value={parsedExam.title}
                onChange={(e) => setParsedExam({ ...parsedExam, title: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Thời gian làm bài (phút)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={parsedExam.durationMinutes}
                  onChange={(e) =>
                    setParsedExam({ ...parsedExam, durationMinutes: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Đặt 0 nếu không giới hạn thời gian.</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Thẻ / Phân loại (cách nhau bởi dấu phẩy)</span>
                </label>
                <input
                  type="text"
                  value={parsedExam.tags}
                  onChange={(e) => setParsedExam({ ...parsedExam, tags: e.target.value })}
                  placeholder="Toán, Tiếng Anh, THPT..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Action Choice */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => setParsedExam(null)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors"
            >
              Quay lại chọn file
            </button>

            <div className="w-full sm:w-auto flex items-center gap-2">
              <button
                onClick={() => handleSaveAndGo('editor')}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors"
              >
                Vào Trình chỉnh sửa
              </button>

              <button
                onClick={() => handleSaveAndGo('practice')}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Luyện tập ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
