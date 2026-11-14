import React, { useState } from 'react';
import type { Exam, Question, Option } from '../types';
import { MathText } from './MathText';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Shuffle,
  Clock,
  CheckCircle2,
  HelpCircle,
  Play,
  Share2
} from 'lucide-react';

interface EditorViewProps {
  exam: Exam;
  onSave: (updatedExam: Exam) => void;
  onBack: () => void;
  onStartPractice: (exam: Exam) => void;
  onShare?: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  exam,
  onSave,
  onBack,
  onStartPractice,
  onShare,
}) => {
  const [currentExam, setCurrentExam] = useState<Exam>(() => {
    const copy: Exam = JSON.parse(JSON.stringify(exam));
    copy.questions?.forEach((q) => {
      if (
        q.explanation &&
        (q.explanation.includes('(AI Gợi ý)') || q.explanation.includes('Đề xuất lựa chọn'))
      ) {
        q.explanation = '';
      }
    });
    return copy;
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const missingAnswersCount = currentExam.questions.filter((q) => !q.correctOptionId).length;

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateTitle = (title: string) => {
    setCurrentExam((prev) => ({ ...prev, title }));
  };

  const handleUpdateDuration = (durationMinutes: number) => {
    setCurrentExam((prev) => ({ ...prev, durationMinutes }));
  };

  const handleUpdateTags = (tagsStr: string) => {
    setCurrentExam((prev) => ({
      ...prev,
      tags: tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
    }));
  };

  const handleQuestionTextChange = (qIndex: number, text: string) => {
    const questions = [...currentExam.questions];
    questions[qIndex].text = text;
    setCurrentExam((prev) => ({ ...prev, questions }));
  };

  const handleExplanationChange = (qIndex: number, explanation: string) => {
    const questions = [...currentExam.questions];
    questions[qIndex].explanation = explanation;
    setCurrentExam((prev) => ({ ...prev, questions }));
  };

  // Toggle selection: click to select as correct answer; click again to deselect
  const handleSelectCorrectOption = (qIndex: number, optionId: string) => {
    const questions = [...currentExam.questions];
    if (questions[qIndex].correctOptionId === optionId) {
      questions[qIndex].correctOptionId = undefined;
    } else {
      questions[qIndex].correctOptionId = optionId;
    }
    setCurrentExam((prev) => ({ ...prev, questions }));
  };

  const handleOptionTextChange = (qIndex: number, optIndex: number, text: string) => {
    const questions = [...currentExam.questions];
    questions[qIndex].options[optIndex].text = text;
    setCurrentExam((prev) => ({ ...prev, questions }));
  };

  const handleAddOption = (qIndex: number) => {
    const questions = [...currentExam.questions];
    const q = questions[qIndex];
    const nextKey = String.fromCharCode(65 + q.options.length);
    const newOpt: Option = {
      id: `${q.id}_opt_${nextKey}_${Date.now()}`,
      key: nextKey,
      text: '',
    };
    q.options.push(newOpt);
    setCurrentExam((prev) => ({ ...prev, questions }));
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const questions = [...currentExam.questions];
    const q = questions[qIndex];
    const removedOpt = q.options[optIndex];
    q.options.splice(optIndex, 1);
    q.options.forEach((opt, idx) => {
      opt.key = String.fromCharCode(65 + idx);
    });
    if (q.correctOptionId === removedOpt.id) {
      q.correctOptionId = undefined;
    }
    setCurrentExam((prev) => ({ ...prev, questions }));
  };

  const handleAddQuestion = () => {
    const newQNumber = currentExam.questions.length + 1;
    const newQId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newQuestion: Question = {
      id: newQId,
      number: newQNumber,
      text: '',
      options: [
        { id: `${newQId}_opt_A`, key: 'A', text: '' },
        { id: `${newQId}_opt_B`, key: 'B', text: '' },
        { id: `${newQId}_opt_C`, key: 'C', text: '' },
        { id: `${newQId}_opt_D`, key: 'D', text: '' },
      ],
      correctOptionId: undefined,
      explanation: '',
    };
    setCurrentExam((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth',
      });
    }, 100);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (currentExam.questions.length <= 1) {
      alert('Đề thi phải có ít nhất 1 câu hỏi.');
      return;
    }
    const questions = [...currentExam.questions];
    questions.splice(qIndex, 1);
    // Renumber
    questions.forEach((q, idx) => {
      q.number = idx + 1;
    });
    setCurrentExam((prev) => ({ ...prev, questions }));
    showToast('Đã xóa câu hỏi.');
  };

  const handleShuffleQuestions = () => {
    const questions = [...currentExam.questions].sort(() => Math.random() - 0.5);
    questions.forEach((q, idx) => {
      q.number = idx + 1;
    });
    setCurrentExam((prev) => ({ ...prev, questions }));
    showToast('Đã xáo trộn thứ tự các câu hỏi!');
  };

  const handleSave = () => {
    onSave(currentExam);
    showToast('Đã lưu bài trắc nghiệm thành công!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại thư viện</span>
        </button>

        <div className="flex items-center gap-2">
          {missingAnswersCount > 0 && (
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
              Còn {missingAnswersCount} câu chưa chọn đáp án
            </span>
          )}

          <button
            onClick={handleShuffleQuestions}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition-colors"
            title="Xáo trộn câu hỏi"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {onShare && (
            <button
              onClick={onShare}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition-colors"
              title="Chia sẻ đề thi này"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Lưu đề</span>
          </button>

          <button
            onClick={() => {
              handleSave();
              onStartPractice(currentExam);
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Vào luyện tập</span>
          </button>
        </div>
      </div>

      {/* Metadata Configuration */}
      <div className="mt-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Thông tin cơ bản
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tiêu đề bài thi
            </label>
            <input
              type="text"
              value={currentExam.title}
              onChange={(e) => handleUpdateTitle(e.target.value)}
              placeholder="Ví dụ: Kiểm tra Giải tích 12..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500"
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
                value={currentExam.durationMinutes}
                onChange={(e) => handleUpdateDuration(parseInt(e.target.value, 10) || 15)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nhãn phân loại (ngăn cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={currentExam.tags?.join(', ') || ''}
                onChange={(e) => handleUpdateTags(e.target.value)}
                placeholder="Toán, Đại học, Giải tích..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions List Header */}
      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Danh sách câu hỏi
            </h2>
            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-mono">
              {currentExam.questions.length}
            </span>
          </div>

          <button
            onClick={handleAddQuestion}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu hỏi mới</span>
          </button>
        </div>

        {currentExam.questions.map((q, qIndex) => {
          return (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs relative"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center">
                    {q.number || qIndex + 1}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Câu hỏi {q.number || qIndex + 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Xóa câu hỏi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text Editor */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung câu hỏi (hỗ trợ công thức toán $...$)
                </label>
                <textarea
                  value={q.text}
                  onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                  placeholder="Nhập nội dung đề bài tại đây..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500 font-sans"
                />

                {/* Math Live Preview if needed */}
                {q.text.includes('$') && (
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                      Xem trước công thức:
                    </span>
                    <MathText text={q.text} />
                  </div>
                )}
              </div>

              {/* Options Section */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Lựa chọn đáp án (bấm vào chữ A, B, C, D để chọn đáp án đúng — bấm lần nữa để bỏ chọn)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddOption(qIndex)}
                    className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm lựa chọn</span>
                  </button>
                </div>

                {q.options.map((opt, optIndex) => {
                  const isCorrect = q.correctOptionId === opt.id;

                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-2 p-2 rounded-2xl border transition-all ${
                        isCorrect
                          ? 'border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
                      }`}
                    >
                      {/* Radio button to pick/toggle as correct option */}
                      <button
                        type="button"
                        onClick={() => handleSelectCorrectOption(qIndex, opt.id)}
                        className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                          isCorrect
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title={isCorrect ? 'Đáp án đúng (Bấm lần nữa để bỏ chọn)' : 'Nhấp để chọn làm đáp án đúng'}
                      >
                        {opt.key}
                      </button>

                      {/* Option text */}
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(qIndex, optIndex, e.target.value)}
                        placeholder={`Nội dung phương án ${opt.key}...`}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                      />

                      {/* Math preview inline if contains $ */}
                      {opt.text.includes('$') && (
                        <div className="hidden sm:block text-xs px-2 py-1 bg-white/60 dark:bg-slate-800/60 rounded">
                          <MathText text={opt.text} />
                        </div>
                      )}

                      {/* Remove option button if > 2 options */}
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(qIndex, optIndex)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Xóa phương án"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Optional Explanation Field */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                {q.explanation && q.explanation.trim().length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Lời giải thích / Hướng dẫn giải</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleExplanationChange(qIndex, '')}
                        className="text-[11px] text-slate-400 hover:text-rose-500 transition"
                      >
                        Xóa giải thích
                      </button>
                    </div>
                    <textarea
                      value={q.explanation}
                      onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                      rows={2}
                      placeholder="Nhập lời giải thích tại đây..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleExplanationChange(qIndex, ' ')}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm lời giải thích</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Question Button Bottom */}
        <div className="pt-2 text-center">
          <button
            onClick={handleAddQuestion}
            className="w-full py-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu hỏi mới</span>
          </button>
        </div>
      </div>
    </div>
  );
};
