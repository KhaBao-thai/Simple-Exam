import React from 'react';
import type { AppView } from '../types';
import { Logo } from './Logo';
import { BookOpen, Plus, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  examTitle?: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  examTitle,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors no-print">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand with custom Logo */}
        <div
          onClick={() => onNavigate('library')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <Logo size={34} className="transition-transform group-hover:scale-105" />
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-white tracking-tight leading-none text-base">
              Simple Exam
            </span>
          </div>
        </div>

        {/* Current exam title if navigating */}
        {examTitle && currentView !== 'library' && currentView !== 'create' && currentView !== 'settings' && (
          <div className="hidden md:flex items-center gap-2 max-w-md truncate text-sm text-slate-500 dark:text-slate-400 font-medium">
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="truncate text-slate-800 dark:text-slate-200">{examTitle}</span>
          </div>
        )}

        {/* Unified Nav Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('library')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              currentView === 'library'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Thư viện</span>
          </button>

          <button
            onClick={() => onNavigate('create')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              currentView === 'create'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tạo đề mới</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Dark / Light toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
