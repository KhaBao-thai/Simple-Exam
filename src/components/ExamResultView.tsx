import React, { useState, useEffect } from 'react';
import type { Exam, ExamAttempt } from '../types';
import { MathText } from './MathText';
import confetti from 'canvas-confetti';
import {
  Award,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Printer
} from 'lucide-react';

interface ExamResultViewProps {
  exam: Exam;
  attempt: ExamAttempt;
  onRetake: () => void;
  onBackToLibrary: () => void;
  onPrint: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  exam,
  attempt,
  onRetake,
  onBackToLibrary,
  onPrint,
}) => {
  const [filter, setFilter] = useState<'all' | 'wrong' | 'correct'>('all');

  useEffect(() => {
    if (attempt.percentage >= 60) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [attempt.percentage]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  const filteredQuestions = exam.questions.filter((q) => {
    const isCorrect = attempt.userAnswers[q.id] === q.correctOptionId;
    if (filter === 'wrong') return !isCorrect;
    if (filter === 'correct') return isCorrect;
    return true;
  });

  const scaledScore = ((attempt.score / attempt.totalQuestions) * 10).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top action */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={onBackToLibrary}
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về thư viện</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrint}
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In kết quả</span>
          </button>

          <button
            onClick={onRetake}
            className="px-4 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm lại bài</span>
          </button>
        </div>
      </div>

      {/* Main Score Card */}
      <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Kết quả bài thi: {exam.title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Hoàn thành lúc {new Date(attempt.date).toLocaleTimeString()} • Thời gian làm bài:{' '}
          {formatDuration(attempt.timeSpentSeconds)}
        </p>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {scaledScore}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Thang điểm 10</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {attempt.score}/{attempt.totalQuestions}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Số câu đúng</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-3xl font-extrabold text-rose-500">
              {attempt.totalQuestions - attempt.score}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Số câu sai</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {attempt.percentage}%
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Tỷ lệ chính xác</p>
          </div>
        </div>
      </div>

      {/* Question Details Section */}
      <div className="mt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Chi tiết từng câu hỏi & Lời giải
          </h2>

          {/* Filter Pills */}
          <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Tất cả ({exam.questions.length})
            </button>
            <button
              onClick={() => setFilter('wrong')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'wrong'
                  ? 'bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Câu sai ({attempt.totalQuestions - attempt.score})
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'correct'
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Câu đúng ({attempt.score})
            </button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-5">
          {filteredQuestions.map((q, qIndex) => {
            const userPickId = attempt.userAnswers[q.id];
            const isCorrect = userPickId === q.correctOptionId;

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-gray-800/90 rounded-3xl border border-gray-200/90 dark:border-gray-700/80 p-6 shadow-xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center justify-center">
                    {q.number || qIndex + 1}
                  </span>

                  {isCorrect ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Sai
                    </span>
                  )}
                </div>

                <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white leading-relaxed">
                  <MathText text={q.text} />
                </div>

                {/* Options Review */}
                <div className="mt-4 space-y-2">
                  {q.options.map((opt) => {
                    const isPicked = userPickId === opt.id;
                    const isRightAnswer = q.correctOptionId === opt.id;

                    let optBg = 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-200/60 dark:border-gray-700/60';
                    let badgeBg = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';

                    if (isRightAnswer) {
                      optBg = 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-medium';
                      badgeBg = 'bg-emerald-600 text-white';
                    } else if (isPicked && !isRightAnswer) {
                      optBg = 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-400 dark:border-rose-800 text-rose-950 dark:text-rose-200 line-through';
                      badgeBg = 'bg-rose-500 text-white';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${optBg}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${badgeBg}`}>
                            {opt.key}
                          </span>
                          <span>
                            <MathText text={opt.text} />
                          </span>
                        </div>

                        {isRightAnswer && (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                            Đáp án đúng
                          </span>
                        )}
                        {isPicked && !isRightAnswer && (
                          <span className="text-[11px] font-semibold text-rose-500 shrink-0">
                            Bạn đã chọn
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && q.explanation.trim() && !q.explanation.includes('(AI Gợi ý)') && !q.explanation.includes('Đề xuất lựa chọn') && (
                  <div className="mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 mb-1">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Lời giải thích:</span>
                    </span>
                    <MathText text={q.explanation} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
