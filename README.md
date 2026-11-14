# Simple Exam — Nền tảng Tạo & Luyện tập Trắc nghiệm Thông minh

Ứng dụng web chuyên nghiệp cho phép chuyển đổi tệp tài liệu **PDF, Word (.docx), hoặc văn bản thô** thành các bộ đề trắc nghiệm hoàn chỉnh, tối giản và thông minh với giao diện thẩm mỹ cao.

---

## 🌟 Điểm nổi bật & Tính năng chính

### 1. Phân tích & Tự động tạo đề từ tệp tin đa định dạng
- **Hỗ trợ định dạng**: PDF (`.pdf`), Word (`.docx`), Văn bản thuần (`.txt`, `.md`), hoặc **Dán văn bản trực tiếp**.
- **Thuật toán xử lý tiếng Việt thông minh**: Tự động khôi phục các âm tiết bị đứt đoạn do mã hóa font trong PDF scan/Word.
- **Bộ nhận diện chuẩn xác (Smart Parser)**:
  - Tự động nhận diện câu hỏi (`Câu 1`, `Question 1`, `1.`, `1)`...).
  - Nhận diện phương án lựa chọn (`A.`, `B.`, `C.`, `D.`).
  - Tự động bắt đáp án có sẵn từ dấu sao (`*A.`), ghi chú `(Đúng)`, dòng đáp án riêng (`Đáp án: A`), hoặc Bảng đáp án ở cuối tài liệu.

### 2. Tích hợp AI (Google Gemini 3.5 Flash)
- **Tự động giải câu hỏi chưa có đáp án**: Phân tích đề bài, giải thích chuẩn khoa học và chọn đáp án chính xác.
- **Hoàn toàn miễn phí**: Sử dụng định mức Free Tier của Google AI Studio (1.500 lượt/ngày), không tốn chi phí cho cá nhân và nhóm nhỏ.
- **Bảo mật**: Khóa API lưu trực tiếp trên trình duyệt của bạn (LocalStorage), không qua máy chủ trung gian.

### 3. Chế độ "Luyện tập ngay" (Instant Feedback Practice)
- Bấm chọn phương án, hệ thống lập tức hiển thị Đúng/Sai kèm đáp án chuẩn.
- Hỗ trợ phím tắt siêu tốc: `A`, `B`, `C`, `D` hoặc `1`, `2`, `3`, `4`, và phím mũi tên `→` để sang câu tiếp theo.
- Hiển thị công thức toán học và khoa học với KaTeX ($x^2$, $\frac{a}{b}$, $\text{FEV}_1/\text{FVC}$).

### 4. Chế độ Thi thử tính giờ (Exam Mode)
- Đồng hồ đếm ngược với cảnh báo thời gian.
- Bảng câu hỏi trực quan (Question Palette): Đã làm, Chưa làm, Đánh dấu xem lại.
- Báo cáo kết quả chi tiết, thống kê tỷ lệ % và lọc riêng câu làm sai để ôn tập.

### 5. Chia sẻ đề thi & Toàn bộ kho đề (Share Exam & Bank)
- **Chia sẻ qua Link trực tiếp**: Nén toàn bộ đề thi vào đường link URL, mở ra làm bài ngay không cần tạo tài khoản.
- **Mã QR trực quan**: Tự động tạo mã QR độ nét cao để học sinh quét camera điện thoại làm bài tức thì. Có nút tải ảnh QR để dán vào slide bài giảng.
- **Gói tệp đề thi (.json)**: Xuất hoặc nhập gói đề dễ dàng qua Zalo, Email, Google Classroom.

### 6. Trình biên tập linh hoạt (Editor)
- Sửa câu hỏi, sửa phương án, đổi đáp án đúng 1 chạm.
- Thêm/bớt phương án, xáo trộn câu hỏi ngẫu nhiên.
- Tùy chọn thêm hoặc ẩn lời giải thích/ghi chú gọn gàng.

### 7. Thẻ ghi nhớ (Flashcard) & In ấn chuẩn A4 (Print)
- Lật thẻ 3D ôn tập nhanh.
- Xuất bản in đề thi học sinh hoặc bản in kèm đáp án & lời giải chi tiết.
- Giao diện Sáng / Tối (Light & Dark mode) đồng bộ.

---

## 🛠️ Công nghệ sử dụng
- **React 19** + **TypeScript**
- **Vite 8**
- **Tailwind CSS v4**
- **KaTeX** (Hiển thị công thức toán)
- **PDF.js** & **Mammoth.js** (Trích xuất PDF/Word)
- **LZ-String** & **QRCode** (Nén URL & tạo mã QR chia sẻ)
- **Canvas-Confetti** & **Lucide React**

---

## 🚀 Khởi chạy dự án

```bash
# Cài đặt các gói phụ thuộc
npm install

# Chạy môi trường phát triển (Dev)
npm run dev

# Đóng gói sản phẩm (Build Production)
npm run build
```
