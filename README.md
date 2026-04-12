# Trợ Lý Xây Nhà - Chatbot Tư Vấn
Dự án Web App Chatbot dành cho học viên khóa học "Xây Nhà Lần Đầu" và "Tự Kiểm Soát Xây Nhà". Ứng dụng cung cấp trợ lý ảo chuyên nghiệp giải đáp 5 vấn đề cốt lõi nhất trước và trong quá trình xây dựng.

## 🚀 Tính năng nổi bật
1. **Form Đăng Ký Học Viên**: 
   - Kiểm tra Regex số điện thoại VN và độ dài tên tối thiểu.
   - Ẩn/hiện trường "Lớp học" động theo khóa học đã chọn.
   - Ghi nhớ học viên bằng `localStorage`.
2. **Luồng Chat Thông Minh & Cấu Trúc**:
   - Giao diện Dark Mode Glassmorphism cao cấp, typography tiếng Việt rõ ràng.
   - Chatbot tự động chào hỏi bằng tên người dùng.
   - 5 chủ đề chuyên sâu: **Hợp đồng, Pháp lý, Báo giá thi công, Tiêu chuẩn thi công, Giải đáp thắc mắc**.
3. **Keyword Matching & Topic Guard**:
   - Bot có thể trả lời thông qua nút bấm (Quick Replies) hoặc bằng cách người dùng **gõ nhập liệu (Free-text input)**.
   - **Topic Guard**: Nếu đang trong chủ đề "Hợp đồng" mà gõ các từ khoá của "Báo giá", bot sẽ cảnh báo hỏi sai chủ đề và điều hướng người dùng sang đúng thư mục để nhận báo giá hoặc vào mục thắc mắc chung.
4. **Responsive Layouts**:
   - **Mobile / Tablet (Dọc)**: Khung chat kéo dãn toàn màn hình quen thuộc.
   - **PC / Laptop (Ngang)**: Chia màn hình làm 2 khu vực: Sidebar cố định bên trái (chọn chủ đề) và cửa sổ chat tương tác bên phải.

## 📁 Cấu trúc thư mục
- `index.html`: Giao diện HTML tĩnh gồm form đăng ký và bộ khung Chat UI.
- `style.css`: Quy chuẩn thiết kế (Variables), Animations, Responsive breakpoints.
- `app.js`: Logic kiểm tra localStorage, Form Validate, Data (Nội dung tư vấn) và điều hướng Chatbot.
- `.github/workflows/static.yml`: Cấu hình tự động đẩy website thành Live Github Pages.

## 📝 Cách cập nhật nội dung kiến thức
Toàn bộ dữ liệu của Chatbot được quản lý tĩnh ở đầu file `app.js` trong Object `TOPICS`. Bạn chỉ việc mở `app.js` và chỉnh sửa hoặc thêm thuộc tính để nội dung được tự động kết nạp vào bot.
Mỗi câu hỏi có:
- `q:` (Câu hỏi hiển thị)
- `keywords:` (Danh sách từ khóa để nhận diện câu hỏi này nếu người dùng gõ text)
- `a:` (Câu trả lời, hỗ trợ các thẻ HTML như `<strong>`, `<ul>`, v.v..) 

## 🔧 Triển khai (Deployment)
Dự án hiện đã được setup **GitHub Actions**. Ngay khi bạn Commit & Push bất kỳ sửa đổi nào, Github sẽ tự động biên dịch lại và cập nhật trên trang Github Pages cá nhân của bạn.