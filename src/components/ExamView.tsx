import React, { useState, useEffect } from 'react';
import type { Exam, ExamAttempt } from '../types';
import { MathText } from './MathText';
import {
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle,
  AlertTriangle,
  Send
} from 'lucide-react';

interface ExamViewProps {
  exam: Exam;
  onFinishExam: (attempt: ExamAttempt) => void;
  onExit: () => void;
}

export const ExamView: React.FC<ExamViewProps> = ({
  exam,
  onFinishExam,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(
    exam.durationMinutes > 0 ? exam.durationMinutes * 60 : 0
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [startTime] = useState(Date.now());

  const totalQuestions = exam.questions.length;
  const currentQ = exam.questions[currentIndex];

  // Timer countdown
  useEffect(() => {
    if (exam.durationMinutes <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam.durationMinutes]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionId: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const handleSubmitExam = () => {
    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);
    let correctCount = 0;

    exam.questions.forEach((q) => {
      if (q.correctOptionId && userAnswers[q.id] === q.correctOptionId) {
        correctCount++;
      }
    });

    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const attempt: ExamAttempt = {
      id: 'attempt_' + Date.now(),
      examId: exam.id,
      date: Date.now(),
      score: correctCount,
      totalQuestions,
      percentage,
      timeSpentSeconds,
      userAnswers,
      mode: 'exam',
    };

    onFinishExam(attempt);
  };

  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => {
            if (confirm('Bạn có chắc muốn thoát bài thi? Tiến trình thi sẽ không được lưu.')) {
              onExit();
            }
          }}
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát</span>
        </button>

        {/* Timer */}
        {exam.durationMinutes > 0 && (
          <div
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 border ${
              timeLeftSeconds < 180
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 animate-pulse'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>
        )}

        <button
          onClick={() => setShowConfirmModal(true)}
          className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-xs font-medium shadow-xs transition-all flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Nộp bài</span>
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Area (3 cols) */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800/90 rounded-3xl border border-gray-200/90 dark:border-gray-700/80 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                Câu {currentQ.number || currentIndex + 1} / {totalQuestions}
              </span>

              <button
                onClick={() => handleToggleFlag(currentQ.id)}
                className={`text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                  flaggedQuestions.has(currentQ.id)
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-semibold'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{flaggedQuestions.has(currentQ.id) ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}</span>
              </button>
            </div>

            <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
              <MathText text={currentQ.text} />
            </div>

            {/* Options */}
            <div className="mt-8 space-y-3">
              {currentQ.options.map((option) => {
                const isSelected = userAnswers[currentQ.id] === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer active:scale-[0.99] ${
                      isSelected
                        ? 'border-slate-900 dark:border-white bg-slate-100/60 dark:bg-slate-800/60 text-slate-900 dark:text-white ring-1 ring-slate-900/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {option.key}
                    </span>
                    <div className="flex-1 text-sm sm:text-base font-normal pt-0.5">
                      <MathText text={option.text} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                currentIndex === 0
                  ? 'opacity-40 cursor-not-allowed text-gray-400'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-xs font-medium shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Câu tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-all flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Hoàn thành & Nộp bài</span>
              </button>
            )}
          </div>
        </div>

        {/* Question Palette Sidebar (1 col) */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800/90 rounded-3xl border border-gray-200/90 dark:border-gray-700/80 p-5 shadow-xs sticky top-20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Danh sách câu hỏi
            </h3>

            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
              {exam.questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!userAnswers[q.id];
                const isFlagged = flaggedQuestions.has(q.id);

                let btnColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
                if (isAnswered) {
                  btnColor = 'bg-slate-900 dark:bg-white text-white dark:text-slate-900';
                }
                if (isFlagged) {
                  btnColor += ' ring-2 ring-amber-400';
                }
                if (isCurrent) {
                  btnColor += ' outline outline-2 outline-slate-900 dark:outline-white';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${btnColor}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-900 dark:bg-white shrink-0" />
                <span>Đã làm: {answeredCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700 shrink-0" />
                <span>Chưa làm: {unansweredCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-400 shrink-0" />
                <span>Đánh dấu: {flaggedQuestions.size}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white">
              Xác nhận nộp bài thi?
            </h3>

            {unansweredCount > 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                Bạn vẫn còn <strong className="text-amber-600">{unansweredCount}</strong> câu chưa trả lời. Bạn có chắc chắn muốn nộp bài ngay bây giờ?
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                Bạn đã hoàn thành toàn bộ câu hỏi. Hệ thống sẽ chấm điểm và phân tích kết quả bài thi.
              </p>
            )}

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
              >
                Tiếp tục làm bài
              </button>

              <button
                onClick={handleSubmitExam}
                className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-xs font-semibold shadow-xs transition-all"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
