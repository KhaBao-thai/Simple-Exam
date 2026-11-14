import React, { useState } from 'react';
import type { Exam, Question } from '../types';
import type { ShareBundle } from '../utils/shareService';
import {
  Download,
  Play,
  Clock,
  Layers,
  CheckCircle2,
  X,
  FileText,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react';

interface ReceiveShareModalProps {
  bundle: ShareBundle;
  onImportAndPractice: (exam: Exam) => void;
  onImportAndTakeExam: (exam: Exam) => void;
  onImportAll: (exams: Exam[]) => void;
  onClose: () => void;
}

export const ReceiveShareModal: React.FC<ReceiveShareModalProps> = ({
  bundle,
  onImportAndPractice,
  onImportAndTakeExam,
  onImportAll,
  onClose,
}) => {
  const [showQuestionsPreview, setShowQuestionsPreview] = useState(false);
  const [importedSuccess, setImportedSuccess] = useState(false);

  // Reconstruct full Exam objects with required fields
  const reconstructedExams: Exam[] = bundle.exams.map((be) => ({
    ...be,
    id: be.id || `exam-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: be.createdAt || Date.now(),
    updatedAt: Date.now(),
    durationMinutes: be.durationMinutes || 0,
    tags: be.tags || [],
    questions: be.questions as Question[],
    attempts: [],
  }));

  const isSingle = reconstructedExams.length === 1;
  const singleExam = isSingle ? reconstructedExams[0] : null;
  const totalQuestions = reconstructedExams.reduce((sum, e) => sum + e.questions.length, 0);

  const handleSaveAll = () => {
    onImportAll(reconstructedExams);
    setImportedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                {isSingle ? 'Nhận đề thi được chia sẻ' : 'Nhận kho đề thi được chia sẻ'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Từ liên kết Simple Exam
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {importedSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Đã thêm thành công vào kho đề của bạn!
              </h3>
              <p className="text-xs text-slate-500">Đang chuyển về giao diện...</p>
            </div>
          ) : isSingle && singleExam ? (
            <>
              {/* Single Exam Details */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                      {singleExam.title}
                    </h3>
                    {singleExam.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {singleExam.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
                  <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 font-medium text-slate-700 dark:text-slate-300">
                    {singleExam.questions.length} câu hỏi
                  </span>

                  {singleExam.durationMinutes > 0 && (
                    <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {singleExam.durationMinutes} phút
                    </span>
                  )}

                  {singleExam.tags?.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3 text-slate-400" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons for Single Exam */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => onImportAndPractice(singleExam)}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Lưu & Luyện tập ngay
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onImportAndTakeExam(singleExam)}
                    className="py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Clock className="w-4 h-4 text-slate-400" />
                    Vào thi tính giờ
                  </button>

                  <button
                    onClick={handleSaveAll}
                    className="py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    Chỉ lưu vào kho
                  </button>
                </div>
              </div>

              {/* Preview Questions Accordion */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuestionsPreview(!showQuestionsPreview)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition py-1"
                >
                  <span>Xem trước {singleExam.questions.length} câu hỏi</span>
                  {showQuestionsPreview ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showQuestionsPreview && (
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
                    {singleExam.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50"
                      >
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          Câu {idx + 1}: {q.text}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {q.options.length} lựa chọn
                          {q.explanation ? ' • Có giải thích' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Multi-exam Bundle */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Gói {reconstructedExams.length} đề thi
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tổng cộng {totalQuestions} câu hỏi trắc nghiệm
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                  <Layers className="w-6 h-6" />
                </div>
              </div>

              {/* List of exams in bundle */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
                {reconstructedExams.map((ex, idx) => (
                  <div
                    key={ex.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between"
                  >
                    <div className="truncate mr-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {idx + 1}. {ex.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {ex.questions.length} câu hỏi
                        {ex.durationMinutes > 0 ? ` • ${ex.durationMinutes} phút` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveAll}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                Nhập toàn bộ vào kho đề của tôi
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
