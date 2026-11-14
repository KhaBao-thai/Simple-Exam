import React, { useState } from 'react';
import type { AISettings } from '../types';
import { getAISettings, saveAISettings } from '../utils/storage';
import {
  Sparkles,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cpu,
  ShieldCheck,
  Save,
  X
} from 'lucide-react';

interface AISettingsModalProps {
  onClose: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<AISettings>(getAISettings());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = () => {
    saveAISettings(settings);
    onClose();
  };

  const handleTestConnection = async () => {
    if (!settings.geminiApiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Vui lòng nhập API Key trước khi kiểm tra.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.geminiApiKey.trim()}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Trả về đúng chữ "OK"' }] }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mã phản hồi (${response.status}): ${errorText}`);
      }

      setTestResult({
        success: true,
        message: 'Kết nối thành công! Gemini API đã sẵn sàng hoạt động.',
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Thông báo: ${err.message || 'Không thể kết nối đến máy chủ API.'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Cài đặt Tích hợp AI (Google Gemini)
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-5 space-y-5">
          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Google Gemini API Key</span>
              </label>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-slate-600 dark:text-slate-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Lấy API Key từ Google</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <input
              type="text"
              value={settings.geminiApiKey}
              onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
              placeholder="Nhập API Key của bạn..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500"
            />

            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Khóa API được lưu cục bộ trên trình duyệt của bạn để tự động giải đề khi cần.</span>
            </p>
          </div>

          {/* Model selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>Mô hình AI</span>
            </label>

            <select
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Khuyên dùng - Nhanh, chuẩn xác & Miễn phí)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Cực kỳ ổn định & Miễn phí)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash (Tốc độ thế hệ mới)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Suy luận chuyên sâu & Phức tạp)</option>
            </select>
          </div>

          {/* Test connection status message */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-700 dark:text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Kiểm tra kết nối</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
            >
              Đóng
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu cài đặt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
