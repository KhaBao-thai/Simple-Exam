export interface Option {
  id: string;
  key: string; // 'A', 'B', 'C', 'D', etc.
  text: string;
}

export interface Question {
  id: string;
  number: number;
  text: string;
  options: Option[];
  correctOptionId?: string; // id of the correct option
  explanation?: string;
  aiGeneratedAnswer?: boolean;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  date: number;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  userAnswers: Record<string, string>; // questionId -> optionId
  mode: 'practice' | 'exam';
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  sourceFileName?: string;
  createdAt: number;
  updatedAt: number;
  durationMinutes: number; // 0 means untimed
  questions: Question[];
  tags?: string[];
  attempts?: ExamAttempt[];
  bestScore?: {
    score: number;
    total: number;
    percentage: number;
    date: number;
  };
}

export type AppView = 
  | 'library'       // Thư viện đề thi
  | 'create'        // Tải file lên / tạo đề mới
  | 'editor'        // Chỉnh sửa câu hỏi, đáp án, giải thích
  | 'practice'      // Chế độ Luyện tập (chọn câu hỏi có luôn đáp án)
  | 'exam'          // Chế độ Thi tính giờ & nộp bài
  | 'flashcard'     // Chế độ Thẻ ghi nhớ ôn tập
  | 'result'        // Xem lại kết quả thi
  | 'settings';     // Cài đặt AI & giao diện

export interface AISettings {
  geminiApiKey: string;
  model: string;
  autoSolveMissing: boolean;
}
