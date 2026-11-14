import React, { useState, useMemo } from 'react';
import type { Exam } from '../types';
import {
  Search,
  Plus,
  Play,
  Clock,
  Layers,
  Edit3,
  MoreVertical,
  Printer,
  Copy,
  Trash2,
  FileText,
  Download,
  Upload,
  AlertCircle,
  Award,
  X,
  Share2
} from 'lucide-react';

interface LibraryViewProps {
  exams: Exam[];
  onSelectExam: (exam: Exam, mode: 'practice' | 'exam' | 'flashcard' | 'editor' | 'print') => void;
  onCreateNew: () => void;
  onDeleteExam: (id: string) => void;
  onDuplicateExam: (id: string) => void;
  onImportExams: (exams: Exam[]) => void;
  onRestoreSamples: () => void;
  onShareExam?: (exam: Exam) => void;
  onShareBank?: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  exams,
  onSelectExam,
  onCreateNew,
  onDeleteExam,
  onDuplicateExam,
  onImportExams,
  onRestoreSamples,
  onShareExam,
  onShareBank,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

  // Extract all tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    exams.forEach((e) => e.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [exams]);

  // Filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const matchQuery =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTag = selectedTag === 'all' || e.tags?.includes(selectedTag);
      return matchQuery && matchTag;
    });
  }, [exams, searchQuery, selectedTag]);

  const totalQuestions = useMemo(() => {
    return exams.reduce((acc, curr) => acc + curr.questions.length, 0);
  }, [exams]);

  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exams, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SimpleExam_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportExams(parsed);
        } else if (parsed && parsed.id && parsed.questions) {
          onImportExams([parsed]);
        }
      } catch (err) {
        alert('File JSON không hợp lệ.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmDelete = () => {
    if (examToDelete) {
      onDeleteExam(examToDelete.id);
      setExamToDelete(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bộ sưu tập đề thi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý và luyện tập {exams.length} bộ đề ({totalQuestions} câu hỏi trắc nghiệm đã lưu).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {onShareBank && exams.length > 0 && (
            <button
              onClick={onShareBank}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 shadow-xs"
              title="Tạo link hoặc mã QR chia sẻ toàn bộ kho đề thi"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>Chia sẻ kho đề</span>
            </button>
          )}

          <label className="cursor-pointer px-3 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5">
            <Upload className="w-4 h-4" />
            <span>Nhập JSON</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={handleExportAll}
            className="px-3 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5"
            title="Sao lưu toàn bộ đề ra file JSON"
          >
            <Download className="w-4 h-4" />
            <span>Sao lưu</span>
          </button>

          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-medium shadow-xs transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đề mới</span>
          </button>
        </div>
      </div>

      {/* Quick Summary & Search Bar */}
      <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm đề thi hoặc tag..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500 transition-all"
          />
        </div>

        {/* Quick Tag Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xl text-xs">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedTag === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Tất cả ({exams.length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedTag === tag
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Exams Grid */}
      {filteredExams.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const hasMissingAnswers = exam.questions.some((q) => !q.correctOptionId);

            return (
              <div
                key={exam.id}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:border-slate-400 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                {/* Header of Card */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {exam.tags?.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                      {hasMissingAnswers && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-500" /> Cần đáp án
                        </span>
                      )}
                    </div>

                    {/* Menu Button */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === exam.id ? null : exam.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === exam.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 text-xs"
                        >
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onSelectExam(exam, 'editor');
                            }}
                            className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Chỉnh sửa đề</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onSelectExam(exam, 'print');
                            }}
                            className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-400" />
                            <span>Xem bản in / PDF</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onDuplicateExam(exam.id);
                            }}
                            className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Nhân bản đề này</span>
                          </button>
                          {onShareExam && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onShareExam(exam);
                              }}
                              className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Share2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Chia sẻ đề này</span>
                            </button>
                          )}
                          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setExamToDelete(exam);
                            }}
                            className="w-full px-3 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa đề</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3
                    onClick={() => onSelectExam(exam, 'practice')}
                    className="font-semibold text-base text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 cursor-pointer transition-colors line-clamp-2 leading-snug"
                  >
                    {exam.title}
                  </h3>

                  {exam.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {exam.description}
                    </p>
                  )}

                  {/* Metadata line */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-4">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      {exam.questions.length} câu
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {exam.durationMinutes > 0 ? `${exam.durationMinutes} phút` : 'Tự do'}
                    </span>
                    {exam.bestScore && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                          <Award className="w-3.5 h-3.5 text-slate-400" />
                          {exam.bestScore.percentage}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {/* Mode 1: Instant Feedback Practice */}
                  <button
                    onClick={() => onSelectExam(exam, 'practice')}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-medium text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs"
                    title="Chế độ chọn câu hỏi sau đó có luôn đáp án"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Luyện tập</span>
                  </button>

                  {/* Mode 2: Timed Exam */}
                  <button
                    onClick={() => onSelectExam(exam, 'exam')}
                    className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors flex items-center gap-1"
                    title="Thi thử tính giờ"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Thi thử</span>
                  </button>

                  {/* Mode 3: Flashcard */}
                  <button
                    onClick={() => onSelectExam(exam, 'flashcard')}
                    className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium text-xs transition-colors"
                    title="Ôn tập thẻ Flashcard"
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>

                  {/* Mode 4: Editor */}
                  <button
                    onClick={() => onSelectExam(exam, 'editor')}
                    className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium text-xs transition-colors"
                    title="Chỉnh sửa câu hỏi & đáp án"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Quick Share */}
                  {onShareExam && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShareExam(exam);
                      }}
                      className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium text-xs transition-colors"
                      title="Chia sẻ đề thi này"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-12 text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 max-w-lg mx-auto p-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {searchQuery ? 'Không tìm thấy đề thi phù hợp' : 'Chưa có bài trắc nghiệm nào'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto">
            {searchQuery
              ? 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.'
              : 'Tải lên file PDF hoặc Word (.docx) để hệ thống tự động nhận diện và tạo bài trắc nghiệm cho bạn.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-medium transition-all shadow-sm"
            >
              Tải file tạo đề ngay
            </button>
            <button
              onClick={onRestoreSamples}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Khôi phục đề mẫu
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (100% reliable, immune to browser popup blocker) */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Xác nhận xóa bài trắc nghiệm</span>
              </h3>
              <button
                onClick={() => setExamToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa bài trắc nghiệm <strong className="text-slate-900 dark:text-white font-semibold">"{examToDelete.title}"</strong>?
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Hành động này sẽ xóa hoàn toàn bộ đề khỏi bộ nhớ trình duyệt và không thể hoàn tác.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setExamToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa vĩnh viễn</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
