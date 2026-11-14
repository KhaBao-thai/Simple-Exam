import React, { useState } from 'react';
import type { Exam } from '../types';
import { MathText } from './MathText';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Check,
  X,
  HelpCircle
} from 'lucide-react';

interface FlashcardViewProps {
  exam: Exam;
  onBack: () => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({ exam, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  const totalQuestions = exam.questions.length;
  const currentQ = exam.questions[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleMarkMastered = () => {
    setMasteredIds((prev) => new Set(prev).add(currentQ.id));
    handleNext();
  };

  const correctOption = currentQ?.options.find((o) => o.id === currentQ.correctOptionId);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về thư viện</span>
        </button>

        <div className="text-xs text-gray-400 font-medium">
          Đã nhớ: <strong className="text-emerald-600 dark:text-emerald-400">{masteredIds.size}</strong> / {totalQuestions}
        </div>
      </div>

      {/* Card Container */}
      <div className="mt-8">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full min-h-[340px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 shadow-sm cursor-pointer transition-all hover:shadow-md flex flex-col justify-between select-none relative"
        >
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold uppercase tracking-wider">
              {isFlipped ? 'Đáp án & Lời giải' : `Câu hỏi ${currentIndex + 1} / ${totalQuestions}`}
            </span>
            <span className="flex items-center gap-1 text-[11px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-lg text-gray-600 dark:text-gray-300">
              <RotateCw className="w-3 h-3" /> Nhấp để lật thẻ
            </span>
          </div>

          {/* Card Body */}
          <div className="my-auto py-6">
            {!isFlipped ? (
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
                  <MathText text={currentQ.text} />
                </h3>

                <div className="mt-6 space-y-2">
                  {currentQ.options.map((opt) => (
                    <div
                      key={opt.id}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-md bg-gray-200 dark:bg-gray-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {opt.key}
                      </span>
                      <span>
                        <MathText text={opt.text} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                    Đáp án chính xác:
                  </span>
                  <div className="text-base font-semibold">
                    {correctOption ? (
                      <>
                        <strong>{correctOption.key}.</strong> <MathText text={correctOption.text} />
                      </>
                    ) : (
                      'Chưa có đáp án cụ thể'
                    )}
                  </div>
                </div>

                {currentQ.explanation && (
                  <div className="mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 mb-1">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Giải thích chi tiết:</span>
                    </span>
                    <MathText text={currentQ.explanation} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-center text-[11px] text-gray-400">
            {masteredIds.has(currentQ.id) && (
              <span className="text-emerald-600 font-medium">✓ Đã thuộc câu này</span>
            )}
          </div>
        </div>
      </div>

      {/* Flashcard Bottom Controls */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`p-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs transition-colors ${
            currentIndex === 0
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNext}
            className="px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5 text-rose-500" />
            <span>Chưa nhớ</span>
          </button>

          <button
            onClick={handleMarkMastered}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Đã nhớ</span>
          </button>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === totalQuestions - 1}
          className={`p-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs transition-colors ${
            currentIndex === totalQuestions - 1
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
