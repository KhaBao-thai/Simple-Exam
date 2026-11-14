import type { Exam } from '../types';

export const SAMPLE_EXAMS: Exam[] = [
  {
    id: 'sample-math-1',
    title: 'Toán học & Tư duy Logic (Có công thức LaTeX)',
    description: 'Bộ câu hỏi trắc nghiệm Toán học với công thức toán học đẹp mắt và lời giải chi tiết.',
    sourceFileName: 'De_thi_Toan_Logic.pdf',
    createdAt: Date.now() - 3600000 * 24 * 2,
    updatedAt: Date.now() - 3600000 * 24 * 2,
    durationMinutes: 15,
    tags: ['Toán học', 'Logic', 'Mẫu'],
    questions: [
      {
        id: 'q1',
        number: 1,
        text: 'Nghiệm của phương trình bậc hai $x^2 - 5x + 6 = 0$ là:',
        options: [
          { id: 'q1-a', key: 'A', text: '$x = 1$ hoặc $x = 6$' },
          { id: 'q1-b', key: 'B', text: '$x = 2$ hoặc $x = 3$' },
          { id: 'q1-c', key: 'C', text: '$x = -2$ hoặc $x = -3$' },
          { id: 'q1-d', key: 'D', text: '$x = 0$ hoặc $x = 5$' },
        ],
        correctOptionId: 'q1-b',
        explanation: 'Ta có $\\Delta = (-5)^2 - 4(1)(6) = 25 - 24 = 1 > 0$. Do đó phương trình có hai nghiệm phân biệt: $x_1 = \\frac{5+1}{2} = 3$ và $x_2 = \\frac{5-1}{2} = 2$.',
      },
      {
        id: 'q2',
        number: 2,
        text: 'Đạo hàm của hàm số $f(x) = \\sin(2x) + e^{3x}$ tại $x = 0$ bằng bao nhiêu?',
        options: [
          { id: 'q2-a', key: 'A', text: '$2$' },
          { id: 'q2-b', key: 'B', text: '$3$' },
          { id: 'q2-c', key: 'C', text: '$5$' },
          { id: 'q2-d', key: 'D', text: '$1$' },
        ],
        correctOptionId: 'q2-c',
        explanation: '$f\'(x) = 2\\cos(2x) + 3e^{3x}$. Thay $x = 0$: $f\'(0) = 2\\cos(0) + 3e^0 = 2(1) + 3(1) = 5$.',
      },
      {
        id: 'q3',
        number: 3,
        text: 'Trong một lớp học có 20 nam và 15 nữ. Chọn ngẫu nhiên 2 học sinh. Xác suất để chọn được 1 nam và 1 nữ là:',
        options: [
          { id: 'q3-a', key: 'A', text: '$\\frac{20}{595}$' },
          { id: 'q3-b', key: 'B', text: '$\\frac{20}{35}$' },
          { id: 'q3-c', key: 'C', text: '$\\frac{20}{39}$' },
          { id: 'q3-d', key: 'D', text: '$\\frac{300}{595} = \\frac{60}{119}$' },
        ],
        correctOptionId: 'q3-d',
        explanation: 'Số phần tử không gian mẫu: $n(\\Omega) = C_{35}^2 = \\frac{35 \\times 34}{2} = 595$. Số cách chọn 1 nam và 1 nữ: $C_{20}^1 \\times C_{15}^1 = 20 \\times 15 = 300$. Xác suất $P = \\frac{300}{595} = \\frac{60}{119}$.',
      },
      {
        id: 'q4',
        number: 4,
        text: 'Tích phân xác định $I = \\int_{0}^{1} (3x^2 + 2x) \\, dx$ có giá trị là:',
        options: [
          { id: 'q4-a', key: 'A', text: '$1$' },
          { id: 'q4-b', key: 'B', text: '$2$' },
          { id: 'q4-c', key: 'C', text: '$3$' },
          { id: 'q4-d', key: 'D', text: '$\\frac{5}{2}$' },
        ],
        correctOptionId: 'q4-b',
        explanation: '$I = [x^3 + x^2]_0^1 = (1^3 + 1^2) - 0 = 2$.',
      },
      {
        id: 'q5',
        number: 5,
        text: 'Cho ma trận vuông cấp 2 $A = \\begin{pmatrix} 2 & 1 \\\\ 4 & 3 \\end{pmatrix}$. Định thức $\\det(A)$ bằng:',
        options: [
          { id: 'q5-a', key: 'A', text: '$2$' },
          { id: 'q5-b', key: 'B', text: '$-2$' },
          { id: 'q5-c', key: 'C', text: '$10$' },
          { id: 'q5-d', key: 'D', text: '$6$' },
        ],
        correctOptionId: 'q5-a',
        explanation: '$\\det(A) = (2)(3) - (1)(4) = 6 - 4 = 2$.',
      }
    ]
  },
  {
    id: 'sample-english-1',
    title: 'English Grammar & Vocabulary Mastery',
    description: 'Bộ câu hỏi trắc nghiệm tiếng Anh thông dụng, kiểm tra ngữ pháp và từ vựng cơ bản đến nâng cao.',
    sourceFileName: 'English_Practice_Test.docx',
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 12,
    durationMinutes: 10,
    tags: ['English', 'Grammar', 'Vocabulary'],
    questions: [
      {
        id: 'eng1',
        number: 1,
        text: 'If I _______ earlier, I would not have missed the important flight to Tokyo.',
        options: [
          { id: 'eng1-a', key: 'A', text: 'woke up' },
          { id: 'eng1-b', key: 'B', text: 'had woken up' },
          { id: 'eng1-c', key: 'C', text: 'would wake up' },
          { id: 'eng1-d', key: 'D', text: 'have woken up' },
        ],
        correctOptionId: 'eng1-b',
        explanation: 'Đây là câu điều kiện loại 3 (Third Conditional) diễn tả một giả định trái ngược với quá khứ. Cấu trúc: If + S + had + V3/ed, S + would/could + have + V3/ed.',
      },
      {
        id: 'eng2',
        number: 2,
        text: 'The climate committee suggested that every member _______ the new emissions policy by Friday.',
        options: [
          { id: 'eng2-a', key: 'A', text: 'review' },
          { id: 'eng2-b', key: 'B', text: 'reviews' },
          { id: 'eng2-c', key: 'C', text: 'reviewed' },
          { id: 'eng2-d', key: 'D', text: 'has reviewed' },
        ],
        correctOptionId: 'eng2-a',
        explanation: 'Cấu trúc giả định thức (Subjunctive mood) với động từ "suggest": S + suggest + that + S + (should) + V-bare. Do đó dùng động từ nguyên thể "review".',
      },
      {
        id: 'eng3',
        number: 3,
        text: 'She decided to take the new managerial role _______ the salary was slightly lower.',
        options: [
          { id: 'eng3-a', key: 'A', text: 'despite' },
          { id: 'eng3-b', key: 'B', text: 'in spite of' },
          { id: 'eng3-c', key: 'C', text: 'although' },
          { id: 'eng3-d', key: 'D', text: 'because of' },
        ],
        correctOptionId: 'eng3-c',
        explanation: 'Sau chỗ trống là một mệnh đề hoàn chỉnh (the salary was slightly lower), và thể hiện sự tương phản nên dùng liên từ "although". "Despite" và "in spite of" đi với danh từ/cụm danh từ.',
      },
      {
        id: 'eng4',
        number: 4,
        text: 'Hardly _______ the room when the telephone started ringing loudly.',
        options: [
          { id: 'eng4-a', key: 'A', text: 'I had entered' },
          { id: 'eng4-b', key: 'B', text: 'had I entered' },
          { id: 'eng4-c', key: 'C', text: 'did I enter' },
          { id: 'eng4-d', key: 'D', text: 'I entered' },
        ],
        correctOptionId: 'eng4-b',
        explanation: 'Cấu trúc đảo ngữ: Hardly + had + S + V3/ed + when + S + V2/ed (Vừa mới... thì...).',
      }
    ]
  }
];
