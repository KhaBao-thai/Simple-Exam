import React, { useState } from 'react';
import type { Exam } from '../types';
import { MathText } from './MathText';
import { ArrowLeft, Printer } from 'lucide-react';

interface PrintViewProps {
  exam: Exam;
  onBack: () => void;
}

export const PrintView: React.FC<PrintViewProps> = ({ exam, onBack }) => {
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [includeHeaderInfo, setIncludeHeaderInfo] = useState(true);
  const [includeAnswerTable, setIncludeAnswerTable] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Print Controls Bar - Hidden when printing */}
      <div className="no-print bg-white dark:bg-gray-800/90 rounded-3xl border border-gray-200 dark:border-gray-700/80 p-5 mb-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={includeAnswers}
              onChange={(e) => setIncludeAnswers(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Kèm đáp án & lời giải</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={includeHeaderInfo}
              onChange={(e) => setIncludeHeaderInfo(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Khung thông tin thí sinh</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={includeAnswerTable}
              onChange={(e) => setIncludeAnswerTable(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Bảng đáp án tổng hợp</span>
          </label>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-xs font-semibold shadow-xs transition-all flex items-center gap-2 shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>In đề thi / Lưu PDF</span>
        </button>
      </div>

      {/* Printable Sheet (Simulates paper A4) */}
      <div className="bg-white text-black p-8 sm:p-12 rounded-3xl border border-gray-200 shadow-sm print:p-0 print:border-none print:shadow-none font-sans">
        {/* Exam Header */}
        {includeHeaderInfo && (
          <div className="border-b-2 border-black pb-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase font-bold tracking-widest text-gray-700">
                  BÀI KIỂM TRA TRẮC NGHIỆM
                </p>
                <h1 className="text-xl sm:text-2xl font-extrabold uppercase mt-1">
                  {exam.title}
                </h1>
                <p className="text-xs text-gray-600 mt-1">
                  Thời gian làm bài:{' '}
                  {exam.durationMinutes > 0 ? `${exam.durationMinutes} phút` : 'Tự do'} (Không kể thời gian phát đề)
                </p>
              </div>

              {/* Student info box */}
              <div className="border border-black p-3 rounded text-xs w-60 space-y-2">
                <div>Họ và tên: .......................................</div>
                <div>Lớp: .................  SBD: ......................</div>
                <div>Điểm số: .........../10 .........................</div>
              </div>
            </div>
          </div>
        )}

        {/* Questions list */}
        <div className="space-y-6">
          {exam.questions.map((q, idx) => {
            return (
              <div key={q.id} className="avoid-break-inside text-sm">
                <div className="font-bold mb-2">
                  <span>Câu {q.number || idx + 1}: </span>
                  <MathText text={q.text} />
                </div>

                {/* 4 options in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pl-2">
                  {q.options.map((opt) => {
                    const isCorrect = includeAnswers && q.correctOptionId === opt.id;

                    return (
                      <div
                        key={opt.id}
                        className={`flex items-start gap-2 ${
                          isCorrect ? 'font-bold text-emerald-800 underline' : ''
                        }`}
                      >
                        <span className="font-semibold">{opt.key}.</span>
                        <span>
                          <MathText text={opt.text} />
                        </span>
                        {isCorrect && (
                          <span className="text-[11px] font-bold text-emerald-700 ml-1">
                            (Đáp án đúng)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Optional explanation */}
                {includeAnswers && q.explanation && (
                  <div className="mt-2.5 p-2.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-800">
                    <span className="font-semibold">Lời giải: </span>
                    <MathText text={q.explanation} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Answer Table */}
        {includeAnswerTable && (
          <div className="mt-10 pt-6 border-t border-gray-400 avoid-break-inside">
            <h3 className="text-xs font-bold uppercase tracking-wider text-center mb-3">
              BẢNG ĐÁP ÁN TỔNG HỢP
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 text-center text-xs">
              {exam.questions.map((q, idx) => {
                const correctOpt = q.options.find((o) => o.id === q.correctOptionId);
                return (
                  <div key={q.id} className="border border-gray-300 p-1.5 rounded">
                    <div className="font-bold text-gray-600">{idx + 1}</div>
                    <div className="text-indigo-600 font-extrabold mt-0.5">
                      {includeAnswers && correctOpt ? correctOpt.key : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
