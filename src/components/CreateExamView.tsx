import React, { useState, useRef } from 'react';
import type { Exam, Question } from '../types';
import { extractTextFromFile } from '../utils/fileExtractors';
import { parseQuizText } from '../utils/quizParser';
import {
  UploadCloud,
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

      // Parse questions from document/text
      const parseRes = parseQuizText(text, defaultTitle);
      const questions = parseRes.questions;

      if (questions.length === 0) {
        throw new Error(
          'Không tìm thấy câu hỏi trắc nghiệm nào trong tài liệu. Vui lòng đảm bảo các câu hỏi có định dạng như "Câu 1:", "1.", và các lựa chọn "A.", "B.", "C.", "D." hoặc bấm nút "Tạo đề trống" bên dưới để tự soạn.'
        );
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
          correctOptionId: undefined,
          explanation: '',
        },
      ],
    };

    onExamCreated(newExam, 'editor');
  };

  const handleSaveAndGo = (targetMode: 'practice' | 'editor') => {
    if (!parsedExam) return;

    const examId = 'exam_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const finalExam: Exam = {
      id: examId,
      title: parsedExam.title,
      description: parsedExam.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      durationMinutes: parsedExam.durationMinutes,
      tags: parsedExam.tags.split(',').map((t) => t.trim()).filter(Boolean),
      questions: parsedExam.questions,
    };

    onExamCreated(finalExam, targetMode);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Tạo bài trắc nghiệm mới
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Tải lên file PDF/Word hoặc dán văn bản để tự động tạo đề thi trong tích tắc
        </p>

        {/* Tab switch */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mt-6 text-xs font-semibold">
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

                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>

                {selectedFile ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Bấm để chọn tệp khác
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Kéo thả tệp vào đây, hoặc <span className="underline">chọn tệp từ máy tính</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      Hỗ trợ định dạng PDF (.pdf), Microsoft Word (.docx), hoặc Văn bản (.txt)
                    </p>
                  </div>
                )}
              </div>

              {/* Sample files hint */}
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Tài liệu sẽ được xử lý cục bộ an toàn trên máy bạn</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('paste');
                    setPastedText(
                      `Câu 1: Thủ đô của Việt Nam là gì?\nA. Hà Nội\nB. TP. Hồ Chí Minh\nC. Đà Nẵng\nD. Cần Thơ\nĐáp án: A\n\nCâu 2: Một năm có bao nhiêu mùa chính ở miền Bắc?\nA. 2 mùa\nB. 3 mùa\nC. 4 mùa\nD. 5 mùa\nĐáp án: C`
                    );
                  }}
                  className="hover:text-slate-700 dark:hover:text-slate-300 underline"
                >
                  Dán đề mẫu thử nghiệm
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Direct Paste Area */}
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Nội dung đề thi trắc nghiệm
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
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium py-2 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo đề thi trống (tự soạn từ đầu)</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onCancel}
                type="button"
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                onClick={handleStartParsing}
                disabled={
                  isProcessing ||
                  (activeTab === 'upload' && !selectedFile) ||
                  (activeTab === 'paste' && !pastedText.trim())
                }
                type="button"
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  isProcessing ||
                  (activeTab === 'upload' && !selectedFile) ||
                  (activeTab === 'paste' && !pastedText.trim())
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm'
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
              <span className="text-amber-600 dark:text-amber-400 block sm:inline sm:ml-1 mt-1 sm:mt-0">
                (Còn {parsedExam.missingCount} câu chưa có đáp án, bạn có thể bổ sung trong Trình biên tập đề thi).
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
                  <span>Thời gian làm bài thi (phút)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={parsedExam.durationMinutes}
                  onChange={(e) =>
                    setParsedExam({
                      ...parsedExam,
                      durationMinutes: parseInt(e.target.value, 10) || 15,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nhãn phân loại (cách nhau bởi dấu phẩy)</span>
                </label>
                <input
                  type="text"
                  value={parsedExam.tags}
                  onChange={(e) => setParsedExam({ ...parsedExam, tags: e.target.value })}
                  placeholder="Y học, Khảo thí, Ôn tập..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mô tả ngắn
              </label>
              <input
                type="text"
                value={parsedExam.description}
                onChange={(e) => setParsedExam({ ...parsedExam, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => setParsedExam(null)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              Phân tích lại
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleSaveAndGo('editor')}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Chỉnh sửa đề thi</span>
              </button>

              <button
                onClick={() => handleSaveAndGo('practice')}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Luyện tập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
