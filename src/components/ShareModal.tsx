import React, { useState, useEffect, useMemo } from 'react';
import type { Exam } from '../types';
import {
  createShareBundle,
  generateShareUrl,
  generateQrCode,
  downloadShareBundleFile,
  type ShareBundle,
} from '../utils/shareService';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  Download,
  ExternalLink,
  Layers,
  FileText,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ShareModalProps {
  exams: Exam[]; // All available exams
  initialSelectedExamId?: string; // If sharing a specific exam
  isBankMode?: boolean; // If sharing exam bank
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  exams,
  initialSelectedExamId,
  isBankMode = false,
  onClose,
}) => {
  // If initialSelectedExamId is passed, default selection to that exam; otherwise select all
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialSelectedExamId) {
      return [initialSelectedExamId];
    }
    return exams.map((e) => e.id);
  });

  const [activeTab, setActiveTab] = useState<'link' | 'file'>('link');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Filter selected exams
  const selectedExams = useMemo(() => {
    return exams.filter((e) => selectedIds.includes(e.id));
  }, [exams, selectedIds]);

  const totalQuestions = useMemo(() => {
    return selectedExams.reduce((sum, e) => sum + e.questions.length, 0);
  }, [selectedExams]);

  // Create share bundle
  const bundle: ShareBundle | null = useMemo(() => {
    if (selectedExams.length === 0) return null;
    return createShareBundle(selectedExams);
  }, [selectedExams]);

  // Generate share URL and stats
  const shareMeta = useMemo(() => {
    if (!bundle) return null;
    return generateShareUrl(bundle);
  }, [bundle]);

  // Generate QR Code when share URL changes
  useEffect(() => {
    if (!shareMeta || shareMeta.isTooLongForQr) {
      setQrDataUrl(null);
      return;
    }

    let isMounted = true;
    setIsGeneratingQr(true);

    generateQrCode(shareMeta.url)
      .then((dataUrl) => {
        if (isMounted) {
          setQrDataUrl(dataUrl);
          setIsGeneratingQr(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
        if (isMounted) {
          setQrDataUrl(null);
          setIsGeneratingQr(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [shareMeta]);

  // Toggle single exam selection
  const handleToggleExam = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all
  const handleToggleSelectAll = () => {
    if (selectedIds.length === exams.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(exams.map((e) => e.id));
    }
  };

  // Copy share URL
  const handleCopyLink = async () => {
    if (!shareMeta?.url) return;
    try {
      await navigator.clipboard.writeText(shareMeta.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareMeta.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Native share if supported (mobile)
  const handleNativeShare = async () => {
    if (!shareMeta?.url || !bundle) return;
    const title =
      bundle.exams.length === 1
        ? `Đề thi: ${bundle.exams[0].title}`
        : `Kho đề thi Simple Exam (${bundle.exams.length} đề)`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Cùng làm bài thi trắc nghiệm trên Simple Exam! (${totalQuestions} câu hỏi)`,
          url: shareMeta.url,
        });
      } catch (e) {
        console.warn('Share cancelled or not allowed:', e);
      }
    } else {
      handleCopyLink();
    }
  };

  // Download QR Code PNG
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_SimpleExam_${selectedExams[0]?.title.slice(0, 30) || 'KhoDe'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download bundle file
  const handleDownloadFile = () => {
    if (!bundle) return;
    downloadShareBundleFile(bundle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {isBankMode || exams.length > 1
                  ? 'Chia sẻ kho đề thi'
                  : 'Chia sẻ đề thi'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tạo link trực tiếp hoặc mã QR để người nhận làm bài ngay không cần cài đặt
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

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Exam Selector (if more than 1 exam available) */}
          {exams.length > 1 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-500" />
                  Chọn đề muốn chia sẻ ({selectedIds.length}/{exams.length})
                </span>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium underline underline-offset-2"
                >
                  {selectedIds.length === exams.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>

              {/* Scrollable list of exams with checkboxes */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {exams.map((ex) => {
                  const isChecked = selectedIds.includes(ex.id);
                  return (
                    <label
                      key={ex.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border ${
                        isChecked
                          ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 font-medium'
                          : 'bg-transparent border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-700/40 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleExam(ex.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-slate-800 focus:ring-slate-500 w-4 h-4"
                        />
                        <span className="truncate">{ex.title}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                        {ex.questions.length} câu
                      </span>
                    </label>
                  );
                })}
              </div>

              {selectedIds.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Vui lòng chọn ít nhất 1 đề thi để chia sẻ.
                </p>
              )}
            </div>
          )}

          {/* If single exam or selected summary */}
          {selectedExams.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-100/70 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/40">
              <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>
                  {selectedExams.length === 1
                    ? selectedExams[0].title
                    : `Gói ${selectedExams.length} đề thi`}
                </span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                Tổng cộng {totalQuestions} câu hỏi
              </span>
              {selectedExams.length === 1 && selectedExams[0].durationMinutes > 0 && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedExams[0].durationMinutes} phút
                  </span>
                </>
              )}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('link')}
              className={`pb-2.5 px-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
                activeTab === 'link'
                  ? 'border-slate-800 dark:border-slate-200 text-slate-900 dark:text-slate-100'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <QrCode className="w-4 h-4" />
              Link & Mã QR trực tuyến
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`pb-2.5 px-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
                activeTab === 'file'
                  ? 'border-slate-800 dark:border-slate-200 text-slate-900 dark:text-slate-100'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Download className="w-4 h-4" />
              Xuất tệp gói đề (.json)
            </button>
          </div>

          {/* TAB 1: Online Link & QR Code */}
          {activeTab === 'link' && selectedExams.length > 0 && shareMeta && (
            <div className="space-y-5">
              {/* Link Copy Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Đường dẫn liên kết trực tiếp
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareMeta.url}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-600 dark:text-slate-300 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Đã sao chép!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Sao chép link
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                  <span>Người nhận mở link sẽ xem và làm bài thi ngay tức thì</span>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={handleNativeShare}
                      className="text-slate-600 dark:text-slate-300 hover:underline flex items-center gap-1"
                    >
                      <Share2 className="w-3 h-3" />
                      Gửi qua Zalo/Ứng dụng khác
                    </button>
                  )}
                </div>
              </div>

              {/* QR Code Section */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Mã QR quét để làm bài
                </label>

                {shareMeta.isTooLongForQr ? (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex gap-3 text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-semibold">Nội dung đề thi quá lớn cho mã QR</p>
                      <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-400">
                        Vì gói đề thi gồm {totalQuestions} câu hỏi nên mã QR vượt quá mật độ quét của camera. Bạn hãy sử dụng nút <strong>Sao chép link</strong> ở trên hoặc chuyển sang tab <strong>Xuất tệp gói đề</strong> để gửi nhé.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200/60 shrink-0">
                      {isGeneratingQr ? (
                        <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                          Đang tạo mã QR...
                        </div>
                      ) : qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="QR Code đề thi"
                          className="w-44 h-44 object-contain"
                        />
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                          Không tạo được mã QR
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 text-center sm:text-left flex-1">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          Quét bằng Camera điện thoại
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Học sinh / đồng nghiệp chỉ cần mở camera điện thoại quét mã là bài thi tự động mở ra trên trình duyệt máy họ.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        {qrDataUrl && (
                          <button
                            onClick={handleDownloadQr}
                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Tải ảnh mã QR
                          </button>
                        )}
                        <a
                          href={shareMeta.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Mở thử liên kết
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: File Package */}
          {activeTab === 'file' && selectedExams.length > 0 && bundle && (
            <div className="space-y-4">
              <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Gói tệp đề thi (.json)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Lưu trữ toàn bộ câu hỏi, phương án, đáp án đúng và lời giải thích vào 1 tệp duy nhất. Rất thích hợp để gửi qua Zalo, Email, Google Drive hoặc lưu trữ lâu dài.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {selectedExams.length} đề thi • {totalQuestions} câu hỏi
                  </span>
                  <button
                    onClick={handleDownloadFile}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Tải tệp gói đề thi
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Hướng dẫn người nhận mở tệp:
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
                  <li>Mở Simple Exam trên bất kỳ máy tính hoặc điện thoại nào.</li>
                  <li>Nhấn nút <strong>Thêm</strong> ở góc trên bên phải thư viện đề thi.</li>
                  <li>Chọn <strong>Nhập từ file JSON</strong> và tải tệp vừa gửi lên.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dữ liệu được nén an toàn & trực tiếp trong trình duyệt</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-medium transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
