import React, { useState, useEffect } from 'react';
import type { Exam, AppView, ExamAttempt } from './types';
import {
  getStoredExams,
  saveOrUpdateExam,
  deleteExam,
  duplicateExam,
  recordExamAttempt,
  saveExams,
} from './utils/storage';
import { SAMPLE_EXAMS } from './utils/sampleExams';
import { Navbar } from './components/Navbar';
import { LibraryView } from './components/LibraryView';
import { CreateExamView } from './components/CreateExamView';
import { EditorView } from './components/EditorView';
import { PracticeView } from './components/PracticeView';
import { ExamView } from './components/ExamView';
import { ExamResultView } from './components/ExamResultView';
import { FlashcardView } from './components/FlashcardView';
import { PrintView } from './components/PrintView';
import { ShareModal } from './components/ShareModal';
import { ReceiveShareModal } from './components/ReceiveShareModal';
import { decodeShareBundle, fetchShareBundleById, type ShareBundle } from './utils/shareService';

export const App: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [currentView, setCurrentView] = useState<AppView>('library');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<ExamAttempt | null>(null);
  const [shareTargetExam, setShareTargetExam] = useState<Exam | null>(null);
  const [isSharingBank, setIsSharingBank] = useState(false);
  const [incomingShareBundle, setIncomingShareBundle] = useState<ShareBundle | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('simple_exam_theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('simple_exam_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('simple_exam_theme', 'light');
    }
  }, [isDarkMode]);

  // Load exams on mount and check for shared link in URL
  useEffect(() => {
    const loaded = getStoredExams();
    setExams(loaded);

    // Check for incoming share link in URL (short ID or compressed payload)
    const checkIncomingShare = async () => {
      try {
        const hash = window.location.hash;
        const search = window.location.search;
        const urlParams = new URLSearchParams(search);

        // 1. Check for Short Link ID (#id=... or ?id=... or #s=... or ?s=...)
        let shortId = '';
        if (hash) {
          const idMatch = hash.match(/(?:id|s)=([a-zA-Z0-9_-]+)/i);
          if (idMatch) shortId = idMatch[1];
        }
        if (!shortId) {
          shortId = urlParams.get('id') || urlParams.get('s') || '';
        }

        if (shortId) {
          const bundle = await fetchShareBundleById(shortId);
          if (bundle && bundle.exams.length > 0) {
            setIncomingShareBundle(bundle);
            return;
          }
        }

        // 2. Fallback: Check for client-side compressed share payload (#share=... or ?share=...)
        let payload = '';
        if (hash && hash.includes('share=')) {
          const match = hash.match(/share=([^&]+)/);
          if (match) payload = match[1];
        } else {
          const q = urlParams.get('share');
          if (q) payload = q;
        }

        if (payload) {
          const decoded = decodeShareBundle(payload);
          if (decoded && decoded.exams.length > 0) {
            setIncomingShareBundle(decoded);
          }
        }
      } catch (err) {
        console.warn('Could not parse share payload from URL:', err);
      }
    };

    checkIncomingShare();
  }, []);

  const clearShareUrl = () => {
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {
      window.location.hash = '';
    }
  };

  const refreshExams = () => {
    const loaded = getStoredExams();
    setExams(loaded);
    if (activeExam) {
      const updated = loaded.find((e) => e.id === activeExam.id);
      if (updated) setActiveExam(updated);
    }
  };

  const handleSelectExam = (
    exam: Exam,
    mode: 'practice' | 'exam' | 'flashcard' | 'editor' | 'print'
  ) => {
    setActiveExam(exam);
    setCurrentView(mode as AppView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExamCreated = (newExam: Exam, targetMode: 'practice' | 'editor') => {
    saveOrUpdateExam(newExam);
    refreshExams();
    setActiveExam(newExam);
    setCurrentView(targetMode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveExam = (updatedExam: Exam) => {
    saveOrUpdateExam(updatedExam);
    refreshExams();
    setActiveExam(updatedExam);
  };

  const handleDeleteExam = (id: string) => {
    deleteExam(id);
    refreshExams();
    if (activeExam?.id === id) {
      setActiveExam(null);
      setCurrentView('library');
    }
  };

  const handleDuplicateExam = (id: string) => {
    const duplicated = duplicateExam(id);
    if (duplicated) {
      refreshExams();
    }
  };

  const handleImportExams = (imported: Exam[]) => {
    const merged = [...imported, ...exams.filter((e) => !imported.some((i) => i.id === e.id))];
    saveExams(merged);
    setExams(merged);
  };

  const handleRestoreSamples = () => {
    saveExams(SAMPLE_EXAMS);
    setExams(SAMPLE_EXAMS);
  };

  const handleFinishExam = (attempt: ExamAttempt) => {
    if (activeExam) {
      const updated = recordExamAttempt(activeExam.id, attempt);
      if (updated) {
        setActiveExam(updated);
        refreshExams();
      }
    }
    setActiveAttempt(attempt);
    setCurrentView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenShareExam = (exam: Exam) => {
    setShareTargetExam(exam);
    setIsSharingBank(false);
  };

  const handleOpenShareBank = () => {
    setShareTargetExam(null);
    setIsSharingBank(true);
  };

  const handleCloseShareModal = () => {
    setShareTargetExam(null);
    setIsSharingBank(false);
  };

  const handleReceivePractice = (exam: Exam) => {
    saveOrUpdateExam(exam);
    refreshExams();
    setActiveExam(exam);
    setCurrentView('practice');
    clearShareUrl();
    setIncomingShareBundle(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReceiveTakeExam = (exam: Exam) => {
    saveOrUpdateExam(exam);
    refreshExams();
    setActiveExam(exam);
    setCurrentView('exam');
    clearShareUrl();
    setIncomingShareBundle(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReceiveImportAll = (imported: Exam[]) => {
    const merged = [...imported, ...exams.filter((e) => !imported.some((i) => i.id === e.id))];
    saveExams(merged);
    setExams(merged);
    clearShareUrl();
    setIncomingShareBundle(null);
  };

  const handleCloseReceiveModal = () => {
    clearShareUrl();
    setIncomingShareBundle(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-slate-500/20">
      {/* Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        examTitle={activeExam?.title}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Container */}
      <main className="flex-1 pb-16">
        {currentView === 'library' && (
          <LibraryView
            exams={exams}
            onSelectExam={handleSelectExam}
            onCreateNew={() => {
              setCurrentView('create');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDeleteExam={handleDeleteExam}
            onDuplicateExam={handleDuplicateExam}
            onImportExams={handleImportExams}
            onRestoreSamples={handleRestoreSamples}
            onShareExam={handleOpenShareExam}
            onShareBank={handleOpenShareBank}
          />
        )}

        {currentView === 'create' && (
          <CreateExamView
            onExamCreated={handleExamCreated}
            onCancel={() => setCurrentView('library')}
          />
        )}

        {currentView === 'editor' && activeExam && (
          <EditorView
            exam={activeExam}
            onSave={handleSaveExam}
            onBack={() => setCurrentView('library')}
            onStartPractice={(ex) => {
              setActiveExam(ex);
              setCurrentView('practice');
            }}
            onShare={() => handleOpenShareExam(activeExam)}
          />
        )}

        {currentView === 'practice' && activeExam && (
          <PracticeView
            exam={activeExam}
            onBack={() => setCurrentView('library')}
            onEdit={() => setCurrentView('editor')}
            onShare={() => handleOpenShareExam(activeExam)}
          />
        )}

        {currentView === 'exam' && activeExam && (
          <ExamView
            exam={activeExam}
            onFinishExam={handleFinishExam}
            onExit={() => setCurrentView('library')}
          />
        )}

        {currentView === 'result' && activeExam && activeAttempt && (
          <ExamResultView
            exam={activeExam}
            attempt={activeAttempt}
            onRetake={() => setCurrentView('exam')}
            onBackToLibrary={() => setCurrentView('library')}
            onPrint={() => setCurrentView('print' as AppView)}
          />
        )}

        {currentView === 'flashcard' && activeExam && (
          <FlashcardView
            exam={activeExam}
            onBack={() => setCurrentView('library')}
          />
        )}

        {currentView === ('print' as AppView) && activeExam && (
          <PrintView
            exam={activeExam}
            onBack={() => setCurrentView('library')}
          />
        )}
      </main>

      {/* Share Modal (Share individual exam or full bank) */}
      {(shareTargetExam !== null || isSharingBank) && (
        <ShareModal
          exams={exams}
          initialSelectedExamId={shareTargetExam?.id}
          isBankMode={isSharingBank}
          onClose={handleCloseShareModal}
        />
      )}

      {/* Receive Share Modal (Opened via shared link) */}
      {incomingShareBundle !== null && (
        <ReceiveShareModal
          bundle={incomingShareBundle}
          onImportAndPractice={handleReceivePractice}
          onImportAndTakeExam={handleReceiveTakeExam}
          onImportAll={handleReceiveImportAll}
          onClose={handleCloseReceiveModal}
        />
      )}

      {/* Minimal Footer */}
      <footer className="no-print border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <p className="font-medium">
          Simple Exam • Nền tảng tạo và luyện thi trắc nghiệm
        </p>
      </footer>
    </div>
  );
};

export default App;
