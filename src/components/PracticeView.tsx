import React, { useState, useEffect } from 'react';
import type { Exam, Question } from '../types';
import { MathText } from './MathText';
import confetti from 'canvas-confetti';
import { solveQuestionsWithGemini } from '../utils/aiService';
import { saveOrUpdateExam, getAISettings } from '../utils/storage';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  Edit3,
  Share2,
  Sparkles,
  Loader2
} from 'lucide-react';

interface PracticeViewProps {
  exam: Exam;
  onBack: () => void;
  onEdit: () => void;
  onShare?: () => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  exam,
  onBack,
  onEdit,
  onShare,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(exam.questions);
  const [isExplainingAI, setIsExplainingAI] = useState(false);

  useEffect(() => {
    setQuestions(exam.questions);
  }, [exam]);

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;

  const currentSelectedOptId = currentQ ? selectedAnswers[currentQ.id] : undefined;
  const isAnswered = !!currentSelectedOptId;
  const isCorrect = isAnswered && currentQ.correctOptionId === currentSelectedOptId;

  // Stats
  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = questions.filter(
    (q) => selectedAnswers[q.id] && selectedAnswers[q.id] === q.correctOptionId
  ).length;
  const incorrectCount = answeredCount - correctCount;

  // Handle asking AI to explain the current question
  const handleAskAIExplain = async (q: Question) => {
    setIsExplainingAI(true);
    try {
      const aiSettings = getAISettings();
      const res = await solveQuestionsWithGemini([q], aiSettings);
      if (res[q.id]?.explanation) {
        const updatedQuestions = questions.map((item) =>
          item.id === q.id ? { ...item, explanation: res[q.id].explanation } : item
        );
        setQuestions(updatedQuestions);
        saveOrUpdateExam({
          ...exam,
          questions: updatedQuestions,
          updatedAt: Date.now(),
        });
      } else {
        alert('Không thể tạo lời giải thích lúc này. Vui lòng kiểm tra lại API Key trong mục "Cài đặt AI" trên thanh menu.');
      }
    } catch (e) {
      console.error(e);
      alert('Không thể gọi AI giải thích lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsExplainingAI(false);
    }
  };

  // Handle answering
  const handleSelectOption = (optionId: string) => {
    // If already answered this question, keep or allow re-answer
    if (selectedAnswers[currentQ.id]) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }));

    // Trigger mini confetti on last question if good score
    if (currentIndex === totalQuestions - 1) {
      if (optionId === currentQ.correctOptionId) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    }
  };

  // Keyboard navigation: A, B, C, D or numbers 1-4, and right arrow for next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentQ || showSummary) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key) && !isAnswered) {
        const opt = currentQ.options.find((o) => o.key.toUpperCase() === key);
        if (opt) handleSelectOption(opt.id);
      } else if (['1', '2', '3', '4'].includes(e.key) && !isAnswered) {
        const index = parseInt(e.key, 10) - 1;
        if (currentQ.options[index]) {
          handleSelectOption(currentQ.options[index].id);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (isAnswered && currentIndex < totalQuestions - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQ, isAnswered, currentIndex, totalQuestions, showSummary]);

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowSummary(false);
  };

  if (totalQuestions === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Bài trắc nghiệm này chưa có câu hỏi nào.</p>
        <button
          onClick={onEdit}
          className="mt-4 px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-xl text-xs font-medium"
        >
          Vào Trình biên tập thêm câu hỏi
        </button>
      </div>
    );
  }

  // Summary View at end of practice
  if (showSummary) {
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="bg-white dark:bg-gray-800/90 rounded-3xl border border-gray-200 dark:border-gray-700/80 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Hoàn thành luyện tập!
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Bạn đã ôn tập xong toàn bộ câu hỏi trong bộ đề này.
          </p>

          <div className="my-8 p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 flex items-center justify-around">
            <div>
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {correctCount}
              </span>
              <p className="text-xs text-gray-400 mt-1">Câu đúng</p>
            </div>
            <div className="h-10 w-px bg-gray-200 dark:bg-gray-800" />
            <div>
              <span className="text-3xl font-extrabold text-rose-500">
                {incorrectCount}
              </span>
              <p className="text-xs text-gray-400 mt-1">Câu sai</p>
            </div>
            <div className="h-10 w-px bg-gray-200 dark:bg-gray-800" />
            <div>
              <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {percentage}%
              </span>
              <p className="text-xs text-gray-400 mt-1">Tỷ lệ đúng</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Luyện tập lại</span>
            </button>

            <button
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-xs font-medium shadow-xs transition-all"
            >
              Về thư viện đề
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thư viện</span>
        </button>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{correctCount} đúng</span>
          </span>
          <span className="text-rose-500 font-medium flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>{incorrectCount} sai</span>
          </span>
          <span className="text-gray-400 font-medium">
            {currentIndex + 1} / {totalQuestions}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onShare && (
            <button
              onClick={onShare}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Chia sẻ đề thi này"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Chỉnh sửa câu hỏi này"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
        <div
          className="bg-slate-900 dark:bg-slate-200 h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xs transition-all">
        {/* Question Counter */}
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300">
            Câu {currentQ.number || currentIndex + 1}
          </span>

          <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
            Phím tắt: bấm A, B, C, D hoặc 1, 2, 3, 4
          </span>
        </div>

        {/* Question Text */}
        <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
          <MathText text={currentQ.text} />
        </div>

        {/* Options List */}
        <div className="mt-8 space-y-3">
          {currentQ.options.map((option) => {
            const isUserPicked = currentSelectedOptId === option.id;
            const isOptionCorrect = currentQ.correctOptionId === option.id;

            // Compute styling according to "Instant Feedback"
            let optStyle =
              'border-gray-200/80 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-800 dark:text-gray-200';
            let badgeStyle =
              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';

            if (isAnswered) {
              if (isOptionCorrect) {
                // Correct option is ALWAYS highlighted in green once answered
                optStyle =
                  'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500/30';
                badgeStyle = 'bg-emerald-600 text-white';
              } else if (isUserPicked && !isOptionCorrect) {
                // If user picked this wrong option, highlight in red
                optStyle =
                  'border-rose-400 bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 ring-1 ring-rose-400/30';
                badgeStyle = 'bg-rose-500 text-white';
              } else {
                // Other options muted
                optStyle =
                  'border-gray-200/50 dark:border-gray-800/50 opacity-50 text-gray-400 dark:text-gray-500';
              }
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                disabled={isAnswered}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 group ${optStyle} ${
                  !isAnswered ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-transform ${badgeStyle}`}
                >
                  {option.key}
                </span>

                <div className="flex-1 text-sm sm:text-base font-normal pt-0.5">
                  <MathText text={option.text} />
                </div>

                {/* Instant Check/Cross icon */}
                {isAnswered && (
                  <span className="shrink-0 mt-0.5">
                    {isOptionCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : isUserPicked ? (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    ) : null}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Instant Answer & Explanation Section */}
        {isAnswered && (
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/60 animate-in fade-in slide-in-from-top-2 duration-300">
            <div
              className={`p-5 rounded-2xl border text-sm leading-relaxed ${
                isCorrect
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-200'
                  : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40 text-rose-950 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider mb-2">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-300">Chính xác!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span className="text-rose-700 dark:text-rose-300">
                      Chưa chính xác — Đáp án đúng là{' '}
                      <strong>
                        {currentQ.options.find((o) => o.id === currentQ.correctOptionId)?.key}
                      </strong>
                    </span>
                  </>
                )}
              </div>

              {currentQ.explanation && currentQ.explanation.trim() && !currentQ.explanation.includes('(AI Gợi ý)') ? (
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Giải thích chi tiết:</span>
                    </div>
                    <button
                      onClick={() => handleAskAIExplain(currentQ)}
                      disabled={isExplainingAI}
                      className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-normal flex items-center gap-1 transition"
                      title="Soạn lại lời giải thích bằng AI"
                    >
                      {isExplainingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-500" />}
                      <span>Hỏi lại AI</span>
                    </button>
                  </div>
                  <MathText text={currentQ.explanation} />
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Câu này chưa có lời giải thích</span>
                  <button
                    onClick={() => handleAskAIExplain(currentQ)}
                    disabled={isExplainingAI}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                  >
                    {isExplainingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
                    <span>Nhờ AI giải thích chi tiết</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="mt-6 flex items-center justify-between gap-3">
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

        {/* Question Selector Dots / Numbers drawer */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-md py-1 px-2">
          {exam.questions.map((q, idx) => {
            const ansId = selectedAnswers[q.id];
            let dotColor = 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
            if (ansId) {
              dotColor =
                ansId === q.correctOptionId
                  ? 'bg-emerald-500 text-white'
                  : 'bg-rose-500 text-white';
            }
            if (idx === currentIndex) {
              dotColor += ' ring-2 ring-slate-900 dark:ring-white ring-offset-2 dark:ring-offset-slate-900';
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 transition-transform ${dotColor}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

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
            onClick={() => setShowSummary(true)}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
          >
            <Award className="w-4 h-4" />
            <span>Xem tổng kết</span>
          </button>
        )}
      </div>
    </div>
  );
};
