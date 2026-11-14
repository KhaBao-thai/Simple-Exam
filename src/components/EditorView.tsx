import React, { useState } from 'react';
import type { Exam, Question, Option } from '../types';
import { MathText } from './MathText';
import { solveQuestionsWithGemini } from '../utils/aiService';
import { getAISettings } from '../utils/storage';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Shuffle,
  Clock,
  CheckCircle2,
  HelpCircle,
  Play,
  Loader2,
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
  const [isSolvingAll, setIsSolvingAll] = useState(false);
  const [solvingQuestionId, setSolvingQuestionId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const missingAnswersCount = currentExam.questions.filter((q) => !q.correctOptionId).length;
  const missingExplanationCount = currentExam.questions.filter((q) => !q.explanation || q.explanation.trim().length === 0).length;

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

  const handleSelectCorrectOption = (qIndex: number, optionId: string) => {
    const questions = [...currentExam.questions];
    questions[qIndex].correctOptionId = optionId;
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
      correctOptionId: `${newQId}_opt_A`,
      explanation: '',
    };
    setCurrentExam((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      const questions = currentExam.questions.filter((_, idx) => idx !== qIndex);
      questions.forEach((q, idx) => {
        q.number = idx + 1;
      });
      setCurrentExam((prev) => ({ ...prev, questions }));
    }
  };

  const handleShuffleQuestions = () => {
    const shuffled = [...currentExam.questions].sort(() => Math.random() - 0.5);
    shuffled.forEach((q, idx) => {
      q.number = idx + 1;
    });
    setCurrentExam((prev) => ({ ...prev, questions: shuffled }));
    showToast('Đã xáo trộn thứ tự các câu hỏi!');
  };

  // AI solve single question
  const handleSolveSingleWithAI = async (q: Question) => {
    setSolvingQuestionId(q.id);
    try {
      const aiSettings = getAISettings();
      const res = await solveQuestionsWithGemini([q], aiSettings);
      if (res[q.id]) {
        const questions = currentExam.questions.map((quest) => {
          if (quest.id === q.id) {
            return {
              ...quest,
              correctOptionId: res[q.id].correctOptionId,
              explanation: quest.explanation || res[q.id].explanation,
              aiGeneratedAnswer: true,
            };
          }
          return quest;
        });
        setCurrentExam((prev) => ({ ...prev, questions }));
        showToast(`AI đã chọn đáp án cho câu ${q.number}!`);
      }
    } catch (e) {
      console.error(e);
      alert('Không thể nhờ AI giải lúc này. Vui lòng kiểm tra lại API Key trong phần Cài đặt.');
    } finally {
      setSolvingQuestionId(null);
    }
  };

  // AI solve all missing questions
  const handleSolveAllMissingWithAI = async () => {
    const missing = currentExam.questions.filter((q) => !q.correctOptionId);
    if (missing.length === 0) {
      showToast('Tất cả các câu hỏi đều đã có đáp án!', 'info');
      return;
    }

    setIsSolvingAll(true);
    try {
      const aiSettings = getAISettings();
      const res = await solveQuestionsWithGemini(missing, aiSettings);

      const questions = currentExam.questions.map((quest) => {
        if (!quest.correctOptionId && res[quest.id]) {
          return {
            ...quest,
            correctOptionId: res[quest.id].correctOptionId,
            explanation: quest.explanation || res[quest.id].explanation,
            aiGeneratedAnswer: true,
          };
        }
        return quest;
      });

      setCurrentExam((prev) => ({ ...prev, questions }));
      showToast(`AI đã giải xong ${Object.keys(res).length} câu hỏi!`);
    } catch (e) {
      console.error(e);
      alert('Đã xảy ra lỗi khi gọi AI. Vui lòng thử lại.');
    } finally {
      setIsSolvingAll(false);
    }
  };

  // AI generate explanations for all questions that lack one
  const handleGenerateAllExplanationsWithAI = async () => {
    const targets = currentExam.questions.filter((q) => !q.explanation || q.explanation.trim().length === 0);
    if (targets.length === 0) {
      showToast('Tất cả câu hỏi đều đã có lời giải thích!', 'info');
      return;
    }

    setIsSolvingAll(true);
    try {
      const aiSettings = getAISettings();
      const res = await solveQuestionsWithGemini(targets, aiSettings);

      const questions = currentExam.questions.map((quest) => {
        if (res[quest.id]) {
          return {
            ...quest,
            correctOptionId: quest.correctOptionId || res[quest.id].correctOptionId,
            explanation: res[quest.id].explanation,
            aiGeneratedAnswer: !quest.correctOptionId,
          };
        }
        return quest;
      });

      setCurrentExam((prev) => ({ ...prev, questions }));
      showToast(`AI đã tạo xong lời giải thích cho ${Object.keys(res).length} câu hỏi!`);
    } catch (e) {
      console.error(e);
      alert('Đã xảy ra lỗi khi gọi AI. Vui lòng thử lại.');
    } finally {
      setIsSolvingAll(false);
    }
  };

  const handleSave = () => {
    onSave(currentExam);
    showToast('Đã lưu bài trắc nghiệm thành công!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
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
            <button
              onClick={handleSolveAllMissingWithAI}
              disabled={isSolvingAll}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Nhờ AI tự động chọn đáp án và thêm giải thích cho các câu còn thiếu"
            >
              {isSolvingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              )}
              <span>AI giải & giải thích ({missingAnswersCount} câu)</span>
            </button>
          )}

          {missingExplanationCount > 0 && missingAnswersCount === 0 && (
            <button
              onClick={handleGenerateAllExplanationsWithAI}
              disabled={isSolvingAll}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Nhờ AI tự động tạo lời giải thích chi tiết cho các câu chưa có giải thích"
            >
              {isSolvingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>AI soạn giải thích ({missingExplanationCount} câu)</span>
            </button>
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
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Luyện tập</span>
          </button>
        </div>
      </div>

      {/* Exam Meta Settings Section */}
      <div className="mt-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tiêu đề bài trắc nghiệm
            </label>
            <input
              type="text"
              value={currentExam.title}
              onChange={(e) => handleUpdateTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-base font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500"
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
                value={currentExam.durationMinutes}
                onChange={(e) => handleUpdateDuration(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Thẻ phân loại
              </label>
              <input
                type="text"
                value={currentExam.tags?.join(', ') || ''}
                onChange={(e) => handleUpdateTags(e.target.value)}
                placeholder="Toán học, Tiếng Anh, Lý..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Danh sách câu hỏi ({currentExam.questions.length})
          </h2>
          <button
            onClick={handleAddQuestion}
            className="px-3.5 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
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
                  {q.aiGeneratedAnswer && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-slate-500" /> AI đã giải
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Single Question AI Solver */}
                  <button
                    onClick={() => handleSolveSingleWithAI(q)}
                    disabled={solvingQuestionId === q.id}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors flex items-center gap-1"
                    title="Nhờ AI phân tích câu này và chọn đáp án đúng"
                  >
                    {solvingQuestionId === q.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>AI giải câu này</span>
                  </button>

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
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500 leading-relaxed font-sans"
                />

                {/* Math text live preview if contains $ */}
                {q.text.includes('$') && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Xem trước công thức:</span>
                    <MathText text={q.text} />
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Các phương án trả lời <span className="text-slate-400 font-normal">(Bấm nút tròn để chọn đáp án đúng)</span>
                  </span>
                  <button
                    onClick={() => handleAddOption(qIndex)}
                    className="text-xs text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm phương án</span>
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
                      {/* Radio to pick as correct option */}
                      <button
                        type="button"
                        onClick={() => handleSelectCorrectOption(qIndex, opt.id)}
                        className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                          isCorrect
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title={isCorrect ? 'Đáp án đúng' : 'Nhấp để chọn làm đáp án đúng'}
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
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                        className="text-[11px] text-slate-400 hover:text-rose-500 transition font-medium"
                      >
                        Bỏ ghi chú này
                      </button>
                    </div>
                    <textarea
                      value={q.explanation}
                      onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                      placeholder="Giải thích vì sao đáp án trên là đúng..."
                      rows={2}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleExplanationChange(qIndex, ' ')}
                    className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 transition py-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm lời giải thích / ghi chú (tùy chọn)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Bottom add button */}
        <div className="text-center pt-4">
          <button
            onClick={handleAddQuestion}
            className="px-6 py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu hỏi mới</span>
          </button>
        </div>
      </div>
    </div>
  );
};
