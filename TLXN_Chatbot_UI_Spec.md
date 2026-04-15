# UI Improvement Spec — Trợ Lý Xây Nhà Chatbot

> Tài liệu này mô tả chi tiết tất cả thay đổi cần thực hiện trên giao diện chatbot TLXN.
> Mục đích: dùng để vibe coding (Cursor / Windsurf / v0).

---

## THAY ĐỔI 1 — THU GỌN SIDEBAR

### Vấn đề hiện tại
Sidebar đang chiếm khoảng 25% chiều rộng màn hình với chỉ 4–5 mục menu và logo. Điều này khiến vùng chat bị thu hẹp không cần thiết, đặc biệt trên màn hình nhỏ hoặc thiết bị mobile.

### Yêu cầu thay đổi

**Trạng thái mặc định (collapsed):**
- Sidebar thu nhỏ xuống còn **50–56px chiều rộng**
- Chỉ hiển thị icon của từng mục menu, không hiển thị text label
- Logo thu gọn thành icon nhà (🏠 hoặc icon SVG tương đương)
- Vùng chat chiếm phần còn lại (~95% chiều rộng)

**Trạng thái mở rộng (expanded):**
- Khi user hover vào sidebar (desktop) hoặc click nút hamburger → sidebar mở rộng ra ~220px
- Hiển thị đầy đủ icon + text label như hiện tại
- Có animation slide transition mượt mà (200–300ms ease)
- Click bên ngoài sidebar → tự động thu gọn lại

**Mobile (màn hình < 768px):**
- Sidebar ẩn hoàn toàn theo mặc định (display: none)
- Hiển thị nút hamburger (☰) ở góc trên bên trái header
- Click hamburger → sidebar trượt ra từ trái (drawer pattern), overlay đè lên vùng chat
- Click overlay hoặc click lại hamburger → sidebar đóng lại

**Các menu item trong sidebar (giữ nguyên):**
- Hợp đồng
- Báo giá thi công
- Tiêu chuẩn thi công
- Pháp lý & Thủ tục
- Giải đáp thắc mắc

---

## THAY ĐỔI 2 — THÊM CHIP GỢI Ý CÂU HỎI NHANH

### Vấn đề hiện tại
Ô input chỉ có placeholder text "Nhập câu hỏi của bạn...". Người dùng mới, không rành công nghệ, không biết mình được phép hỏi gì — gây ma sát ngay từ đầu.

### Yêu cầu thay đổi

**Vị trí:** Hiển thị phía trên ô input, cách ô input 8–10px

**Hình thức:** Các chip (pill button) nằm ngang, có thể scroll ngang nếu quá nhiều

**Thiết kế chip:**
- Background: màu tối nhẹ hơn background chính (ví dụ rgba trắng 8–10%)
- Border: 0.5–1px solid màu trắng/vàng với opacity thấp (~20%)
- Text: màu trắng hoặc xám nhạt, font-size 13–14px
- Border-radius: 999px (pill shape)
- Padding: 6px 14px
- Hover: background sáng hơn, border đậm hơn, cursor pointer
- Click: chip biến mất (hoặc toàn bộ chip bar ẩn đi) → nội dung chip tự điền vào ô input và gửi ngay

**Nội dung chip (mặc định theo từng chủ đề):**

Khi chưa chọn chủ đề nào (màn hình khởi đầu), hiển thị chip chung:
- "Hợp đồng thi công cần có những điều khoản nào?"
- "Tạm ứng cho nhà thầu bao nhiêu % là hợp lý?"
- "Khi nào cần nghiệm thu từng phần?"
- "Báo giá thi công cần kiểm tra những gì?"

Khi user đã chọn một chủ đề trong sidebar (ví dụ "Hợp đồng"), chips thay đổi thành câu hỏi liên quan chủ đề đó:
- "Hợp đồng trọn gói và hợp đồng nhân công khác nhau thế nào?"
- "Điều khoản phạt vi phạm nên ghi như thế nào?"
- "Có cần công chứng hợp đồng thi công không?"

**Logic hiển thị:**
- Chips chỉ hiển thị khi ô chat trống (chưa có hội thoại) hoặc khi bắt đầu chủ đề mới
- Sau khi user gửi tin nhắn đầu tiên → chip bar ẩn đi để không chiếm diện tích
- Chip bar có thể hiển thị lại nếu user xóa hết nội dung ô input (optional)

---

## THAY ĐỔI 3 — GỢI Ý CÂU HỎI LIÊN QUAN SAU MỖI CÂU TRẢ LỜI

### Vấn đề hiện tại
Sau khi chatbot trả lời, không có gì hướng dẫn user hỏi tiếp. Người dùng đọc xong thường thoát hoặc không biết khám phá sâu hơn.

### Yêu cầu thay đổi

**Vị trí:** Cuối mỗi câu trả lời của bot, bên dưới nội dung chính

**Thiết kế:**
- Có một đường kẻ ngang mỏng phân cách (border-top 0.5px, màu trắng opacity 15%)
- Text nhỏ: "Bạn có thể hỏi thêm:" — màu xám nhạt, font-size 12px
- Phía dưới là 2–3 chip câu hỏi liên quan (thiết kế tương tự chip gợi ý đầu vào ở Thay đổi 2)
- Chip nằm wrap (không scroll ngang) vì nằm trong bubble chat

**Nội dung chip liên quan:** Do AI sinh ra tự động dựa trên nội dung câu trả lời vừa rồi. Không hardcode — mỗi câu trả lời sẽ đi kèm 2–3 follow-up question tương ứng.

**Cách implement:**
- Khi gọi API chatbot, yêu cầu response trả về thêm field `followUpQuestions: string[]` (mảng 2–3 câu hỏi gợi ý)
- Hoặc thêm vào cuối system prompt: "Cuối mỗi câu trả lời, thêm dòng phân cách `---FOLLOWUP---` rồi liệt kê 2–3 câu hỏi gợi ý, mỗi câu một dòng"
- Frontend parse ra và render thành chip

**Click chip follow-up:** Tương tự chip gợi ý đầu vào — nội dung tự điền vào ô input và gửi ngay

---

## THAY ĐỔI 4 — CẢI THIỆN FORMAT CÂU TRẢ LỜI

### Vấn đề hiện tại
Câu trả lời hiện tại render dưới dạng plain text với ký hiệu `##` và số thứ tự. Người không rành công nghệ thấy rối, khó biết đâu là thông tin quan trọng, không scan được nhanh.

### Yêu cầu thay đổi

**Cách 1 — Chỉnh System Prompt (không cần đụng UI):**

Thêm vào system prompt của chatbot đoạn sau:

```
Khi trả lời, hãy format theo quy tắc sau:
- Dùng markdown chuẩn: **bold** cho thông tin quan trọng, dấu gạch đầu dòng (-) cho danh sách
- KHÔNG dùng ký hiệu ## hay ### — thay bằng in đậm toàn bộ dòng tiêu đề
- Mỗi nhóm thông tin cách nhau bằng một dòng trống
- Số % và con số cụ thể luôn in đậm
- Câu trả lời ngắn gọn, không quá 300 từ
- Kết thúc bằng 1 câu tóm tắt hành động cụ thể cho chủ nhà
```

**Cách 2 — Chỉnh CSS render markdown (nếu đang dùng markdown renderer):**

Các style cần điều chỉnh trong component render nội dung chat:

```
h2, h3 (nếu có):
  - font-size: 13–14px (không để quá to)
  - color: màu vàng accent hiện tại (#f0c040 hoặc tương đương)
  - margin-bottom: 6px
  - font-weight: 600

strong / bold:
  - color: trắng hoặc vàng nhạt (không để màu mặc định)

ul / li:
  - padding-left: 16px
  - line-height: 1.6
  - margin-bottom: 4px

p (đoạn văn):
  - margin-bottom: 8px
  - line-height: 1.65
  - font-size: 14px

Khoảng cách giữa các section:
  - Thêm margin-top: 12px trước mỗi h2/h3
```

**Cách 3 — Thêm visual separator giữa các section (optional):**

Nếu muốn visual rõ hơn, wrap mỗi section thành một block riêng với:
- Border-left: 2px solid màu vàng accent
- Padding-left: 10px
- Margin-bottom: 12px
- Background: rgba trắng 4%

---

## THAY ĐỔI 5 — CẢI THIỆN Ô INPUT

### Vấn đề hiện tại
Placeholder hiện tại "Nhập câu hỏi của bạn..." quá chung chung. Nút gửi (icon mũi tên) không đủ nổi bật.

### Yêu cầu thay đổi

**Placeholder text:**
Thay "Nhập câu hỏi của bạn..." bằng text xoay vòng (rotating placeholder) hoặc placeholder cụ thể hơn theo chủ đề đang chọn:

- Mặc định: "Hỏi về hợp đồng, báo giá, tiêu chuẩn thi công..."
- Khi chọn "Hợp đồng": "Ví dụ: Điều khoản bảo hành nên ghi như thế nào?"
- Khi chọn "Báo giá": "Ví dụ: Báo giá 5 triệu/m2 có hợp lý không?"
- Khi chọn "Pháp lý": "Ví dụ: Xây nhà cần xin phép những gì?"

**Nút gửi:**
- Khi ô input trống: nút mờ (opacity 40%), không clickable
- Khi có nội dung: nút sáng đủ màu, có thể click
- Transition: 150ms ease khi chuyển trạng thái

**Phím tắt:**
- Enter → gửi tin nhắn
- Shift + Enter → xuống dòng trong ô input
- Hiện note nhỏ bên dưới ô input (lần đầu dùng): "Nhấn Enter để gửi" — ẩn sau lần đầu tiên gửi tin

---

## THAY ĐỔI 6 — HEADER RÕ RÀNG HƠN

### Vấn đề hiện tại
Hiện không rõ phần header của vùng chat có thông tin gì — người dùng không biết mình đang ở chủ đề nào.

### Yêu cầu thay đổi

**Hiển thị breadcrumb chủ đề đang chọn:**
- Góc trên vùng chat, bên dưới hoặc thay thế header hiện tại
- Format: `Trợ Lý Xây Nhà  ›  Hợp đồng` (nếu đã chọn chủ đề)
- Nếu chưa chọn chủ đề: chỉ hiện `Trợ Lý Xây Nhà`
- Font-size: 13px, màu xám nhạt

**Nút "Cuộc trò chuyện mới":**
- Thêm nút nhỏ ở góc trên bên phải vùng chat
- Label: "+ Hỏi mới" hoặc icon refresh (🔄)
- Click → xóa toàn bộ lịch sử chat hiện tại, trở về màn hình khởi đầu
- Hiện confirmation dialog nhỏ: "Bắt đầu cuộc trò chuyện mới?" [Huỷ] [Xác nhận]

---

## THỨ TỰ ƯU TIÊN TRIỂN KHAI

| Thứ tự | Thay đổi | Độ phức tạp | Impact |
|--------|----------|-------------|--------|
| 1 | Chip gợi ý câu hỏi nhanh (Thay đổi 2) | Thấp | Cao |
| 2 | Cải thiện format câu trả lời — chỉnh prompt (Thay đổi 4, Cách 1) | Rất thấp | Cao |
| 3 | Cải thiện ô input — placeholder + nút gửi (Thay đổi 5) | Thấp | Trung bình |
| 4 | Gợi ý câu hỏi liên quan sau trả lời (Thay đổi 3) | Trung bình | Cao |
| 5 | Thu gọn sidebar (Thay đổi 1) | Trung bình | Trung bình |
| 6 | Header và nút Hỏi mới (Thay đổi 6) | Thấp | Trung bình |

---

*Spec version 1.0 — Nhà Của Mình / TLXN Chatbot*
