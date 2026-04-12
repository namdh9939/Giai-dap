/* ========================================
   APP.JS — Chatbot "Trợ Lý Xây Nhà"
   Khóa học Xây Nhà Lần Đầu
   ======================================== */

// =============================================
// DỮ LIỆU NỘI DUNG — Chỉnh sửa nội dung ở đây
// =============================================
const TOPICS = {
  "hop-dong": {
    icon: "📋",
    title: "Hợp đồng",
    description: "Tư vấn về hợp đồng xây dựng",
    keywords: ["hợp đồng", "ký kết", "điều khoản", "thanh toán", "trọn gói", "nhân công", "bao công", "phạt", "bảo hành", "đặt cọc", "tạm ứng", "nghiệm thu", "bàn giao", "phụ lục", "cam kết"],
    questions: [
      {
        q: "Hợp đồng xây nhà cần có những điều khoản quan trọng nào?",
        keywords: ["điều khoản", "nội dung", "cần có", "gồm gì", "bao gồm", "quan trọng"],
        a: `Một hợp đồng xây nhà chặt chẽ cần đảm bảo các điều khoản sau:

<strong>1. Thông tin các bên</strong>
Họ tên, CMND/CCCD, địa chỉ của chủ nhà và nhà thầu.
Nếu nhà thầu là công ty thì cần có mã số thuế, giấy phép kinh doanh.

<strong>2. Phạm vi công việc</strong>
Mô tả chi tiết từng hạng mục thi công, bản vẽ đính kèm, quy cách vật liệu cụ thể.

<strong>3. Giá trị hợp đồng & phương thức thanh toán</strong>
Tổng giá trị, chia thành bao nhiêu đợt, mỗi đợt thanh toán khi nào, bao nhiêu %.

<strong>4. Tiến độ thi công</strong>
Ngày bắt đầu, ngày hoàn thành, mốc tiến độ từng giai đoạn.

<strong>5. Điều khoản phạt</strong>
Phạt chậm tiến độ, phạt vi phạm chất lượng, phạt đơn phương chấm dứt hợp đồng.

<strong>6. Bảo hành</strong>
Thời gian bảo hành (thường 12–24 tháng), phạm vi bảo hành cụ thể.

<div class="highlight-box">📌 <strong>Lưu ý:</strong> Hợp đồng phải có chữ ký của cả hai bên, có người làm chứng càng tốt. Mỗi bên giữ một bản gốc.</div>`
      },
      {
        q: "Làm sao tránh bị nhà thầu lách hợp đồng?",
        keywords: ["lách", "lừa", "gian", "tránh", "bẫy", "rủi ro", "phòng tránh"],
        a: `Để tránh bị nhà thầu lách hợp đồng, cần lưu ý các điểm sau:

<strong>1. Ghi rõ vật liệu cụ thể</strong>
Không ghi chung chung "gạch ốp lát loại tốt".
Phải ghi cụ thể: hãng sản xuất, mã sản phẩm, kích thước, giá tham chiếu.

<strong>2. Đính kèm bản vẽ chi tiết</strong>
Bản vẽ là phụ lục không thể tách rời của hợp đồng.
Mọi thay đổi phải có biên bản bổ sung được ký lại bởi cả hai bên.

<strong>3. Quy định rõ về phát sinh</strong>
Phát sinh phải có báo giá trước.
Chủ nhà đồng ý bằng văn bản mới được thi công.

<strong>4. Giữ lại 5–10% giá trị hợp đồng</strong>
Chỉ thanh toán hết sau khi kết thúc thời gian bảo hành.

<strong>5. Quyền giám sát</strong>
Ghi rõ trong hợp đồng: chủ nhà hoặc người đại diện có quyền kiểm tra công trình bất cứ lúc nào.

<div class="highlight-box">⚠️ <strong>Quan trọng:</strong> Tuyệt đối không thỏa thuận miệng. Mọi nội dung phải được ghi rõ bằng văn bản.</div>`
      },
      {
        q: "Nên thanh toán cho nhà thầu theo lịch nào?",
        keywords: ["thanh toán", "trả tiền", "đợt", "lịch", "bao nhiêu", "chia", "phần trăm"],
        a: `Lịch thanh toán hợp lý giúp kiểm soát được tiến độ và chất lượng công trình:

<strong>Đợt 1 — 10–15%</strong>
Thanh toán khi ký hợp đồng, để nhà thầu chuẩn bị vật liệu ban đầu.

<strong>Đợt 2 — 20–25%</strong>
Sau khi hoàn thành phần móng. Kiểm tra móng đạt yêu cầu trước khi thanh toán.

<strong>Đợt 3 — 20–25%</strong>
Hoàn thành phần thô (cột, dầm, sàn, mái). Kiểm tra kết cấu kỹ lưỡng.

<strong>Đợt 4 — 20–25%</strong>
Hoàn thành phần hoàn thiện (tô trát, ốp lát, sơn). Kiểm tra chất lượng hoàn thiện.

<strong>Đợt 5 — 5–10%</strong>
Thanh toán sau khi nghiệm thu, bàn giao và giữ lại cho bảo hành.

<div class="highlight-box">📌 <strong>Nguyên tắc:</strong> Luôn thanh toán SAU khi công việc hoàn thành. Không ứng trước quá nhiều. Số tiền thanh toán phải tương xứng với khối lượng công việc thực tế.</div>`
      },
      {
        q: "Hợp đồng trọn gói và hợp đồng nhân công khác nhau như thế nào?",
        keywords: ["trọn gói", "nhân công", "bao công", "khác", "loại", "hình thức", "so sánh"],
        a: `Đây là hai hình thức hợp đồng phổ biến nhất, mỗi loại có ưu nhược điểm riêng:

<strong>Hợp đồng trọn gói (bao công + vật liệu)</strong>
<ul>
<li>Nhà thầu chịu trách nhiệm toàn bộ: nhân công và vật liệu</li>
<li>Chủ nhà chỉ thanh toán một khoản tiền cố định</li>
<li>Ưu điểm: Tiết kiệm thời gian, không phải lo mua vật liệu</li>
<li>Nhược điểm: Khó kiểm soát chất lượng vật liệu, chi phí thường cao hơn 15–20%</li>
</ul>

<strong>Hợp đồng nhân công (chỉ bao công)</strong>
<ul>
<li>Nhà thầu chỉ cung cấp nhân công thi công</li>
<li>Chủ nhà tự chịu trách nhiệm mua vật liệu</li>
<li>Ưu điểm: Kiểm soát được chất lượng vật liệu, tiết kiệm chi phí hơn</li>
<li>Nhược điểm: Tốn nhiều thời gian mua sắm, cần có kiến thức về vật liệu</li>
</ul>

<div class="highlight-box">📌 <strong>Khuyến nghị:</strong> Nếu xây nhà lần đầu và không có nhiều thời gian, nên chọn hợp đồng trọn gói nhưng yêu cầu liệt kê chi tiết vật liệu trong phụ lục hợp đồng.</div>`
      }
    ]
  },

  "phap-ly": {
    icon: "⚖️",
    title: "Pháp lý",
    description: "Thủ tục giấy phép, quy định xây dựng",
    keywords: ["pháp lý", "giấy phép", "phép xây dựng", "sổ đỏ", "sổ hồng", "luật", "quy hoạch", "UBND", "sai phép", "vi phạm", "không phép", "miễn phép", "thủ tục", "hồ sơ"],
    questions: [
      {
        q: "Xây nhà cần những giấy phép gì?",
        keywords: ["giấy phép", "cần gì", "thủ tục", "hồ sơ", "xin phép", "cấp phép"],
        a: `Tùy khu vực và quy mô công trình, hồ sơ xin cấp giấy phép xây dựng bao gồm:

<strong>1. Giấy phép xây dựng</strong>
Bắt buộc cho hầu hết các công trình nhà ở.
Nộp hồ sơ tại UBND quận/huyện hoặc Sở Xây dựng.

<strong>2. Hồ sơ bao gồm</strong>
<ul>
<li>Đơn xin cấp giấy phép xây dựng (theo mẫu)</li>
<li>Giấy chứng nhận quyền sử dụng đất (sổ đỏ / sổ hồng)</li>
<li>Bản vẽ thiết kế xây dựng (do đơn vị có năng lực thiết kế lập)</li>
<li>CMND/CCCD của chủ đất</li>
</ul>

<strong>3. Thời gian xử lý</strong>
15–30 ngày làm việc, tùy địa phương.

<strong>4. Chi phí</strong>
Lệ phí cấp giấy phép khoảng 50.000–100.000 VNĐ.
Chi phí thiết kế bản vẽ tính riêng theo thỏa thuận.

<div class="highlight-box">⚠️ <strong>Cảnh báo:</strong> Xây nhà không phép có thể bị phạt 30–50 triệu đồng và buộc tháo dỡ. Luôn hoàn tất thủ tục trước khi khởi công.</div>`
      },
      {
        q: "Trường hợp nào được miễn giấy phép xây dựng?",
        keywords: ["miễn", "không cần", "không phải xin", "được phép", "ngoại lệ"],
        a: `Theo quy định của Luật Xây dựng, một số trường hợp <strong>không cần xin giấy phép:</strong>

<ul>
<li>Nhà ở riêng lẻ tại khu vực nông thôn (trừ khu bảo tồn, di tích lịch sử)</li>
<li>Nhà ở riêng lẻ dưới 7 tầng thuộc dự án đã được phê duyệt quy hoạch chi tiết 1/500</li>
<li>Sửa chữa, cải tạo bên trong nhà mà không thay đổi kết cấu chịu lực và không thay đổi mặt ngoài công trình</li>
<li>Công trình tạm phục vụ thi công công trình chính</li>
</ul>

<div class="highlight-box">📌 <strong>Lưu ý:</strong> Dù được miễn giấy phép, chủ nhà vẫn phải tuân thủ quy hoạch xây dựng của địa phương (mật độ xây dựng, chiều cao tối đa, khoảng lùi...).</div>`
      },
      {
        q: "Xây nhà sai phép bị xử lý như thế nào?",
        keywords: ["sai phép", "vi phạm", "phạt", "xử lý", "hậu quả", "xây sai", "không phép"],
        a: `Xây dựng sai phép hoặc không phép có thể bị xử lý theo nhiều mức độ:

<strong>1. Phạt tiền</strong>
<ul>
<li>Xây không phép: 30–50 triệu đồng (đối với nhà riêng lẻ)</li>
<li>Xây sai phép: 20–40 triệu đồng</li>
<li>Xây vượt tầng, vượt diện tích: phạt theo mức vi phạm cụ thể</li>
</ul>

<strong>2. Buộc tháo dỡ</strong>
Phần vi phạm phải tháo dỡ nếu không thể điều chỉnh giấy phép.

<strong>3. Đình chỉ thi công</strong>
Tạm dừng toàn bộ công trình cho đến khi xử lý xong vi phạm.

<strong>4. Không được cấp sổ hồng</strong>
Nhà xây sai phép sẽ không được cấp giấy chứng nhận quyền sở hữu.

<div class="highlight-box">⚠️ <strong>Hệ quả nghiêm trọng:</strong> Ngoài bị phạt tiền, nhà sai phép không thể mua bán, chuyển nhượng, hoặc thế chấp ngân hàng. Cần xây đúng phép ngay từ đầu.</div>`
      }
    ]
  },

  "bao-gia": {
    icon: "💰",
    title: "Báo giá thi công",
    description: "Kiểm soát chi phí, đánh giá báo giá",
    keywords: ["báo giá", "chi phí", "giá", "tiền", "dự toán", "ngân sách", "kinh phí", "vốn", "đắt", "rẻ", "đội giá", "phát sinh", "bóc tách", "khối lượng", "đơn giá", "m2", "mét vuông"],
    questions: [
      {
        q: "Làm sao đánh giá bảng báo giá từ nhà thầu?",
        keywords: ["đánh giá", "kiểm tra", "xem xét", "báo giá", "bảng giá", "nhận báo giá"],
        a: `Khi nhận bảng báo giá từ nhà thầu, cần kiểm tra kỹ các yếu tố sau:

<strong>1. Tính đầy đủ</strong>
Báo giá phải liệt kê tất cả hạng mục: từ phá dỡ, đào móng, phần thô, hoàn thiện cho đến dọn dẹp vệ sinh.

<strong>2. Chi tiết vật liệu</strong>
Phải ghi rõ chủng loại, hãng sản xuất, quy cách.
Không chấp nhận ghi chung chung kiểu "xi măng loại tốt".

<strong>3. Đơn giá và khối lượng</strong>
Phải bóc tách khối lượng cụ thể (m², m³, kg).
Không chấp nhận ghi "trọn gói" mà không có bảng chi tiết đi kèm.

<strong>4. So sánh ít nhất 3 báo giá</strong>
Lấy báo giá từ 3 nhà thầu khác nhau để có cơ sở so sánh.
Báo giá quá rẻ so với mặt bằng chung cũng là dấu hiệu cần cảnh giác.

<strong>5. Hạng mục phát sinh</strong>
Hỏi rõ những hạng mục nào KHÔNG nằm trong báo giá và ước tính chi phí phát sinh.

<div class="highlight-box">📌 <strong>Lưu ý:</strong> Báo giá thấp nhất chưa chắc là lựa chọn tốt nhất. Hãy so sánh trên cùng một tiêu chuẩn vật liệu và hạng mục thi công.</div>`
      },
      {
        q: "Chi phí xây nhà gồm những khoản nào?",
        keywords: ["chi phí", "khoản", "gồm", "bao gồm", "tổng", "cấu thành", "hết bao nhiêu"],
        a: `Tổng chi phí xây nhà bao gồm các nhóm chính sau:

<strong>1. Chi phí thiết kế (5–7% tổng chi phí)</strong>
<ul>
<li>Bản vẽ kiến trúc, kết cấu, điện nước</li>
<li>Phí xin cấp giấy phép xây dựng</li>
</ul>

<strong>2. Chi phí phần thô (55–65%)</strong>
<ul>
<li>Móng, cột, dầm, sàn, tường, mái</li>
<li>Vật liệu: xi măng, sắt thép, gạch, cát, đá</li>
</ul>

<strong>3. Chi phí hoàn thiện (25–35%)</strong>
<ul>
<li>Ốp lát, sơn, trần, cửa, thiết bị vệ sinh</li>
<li>Hệ thống điện, nước, thoát nước</li>
</ul>

<strong>4. Chi phí khác (5–10%)</strong>
<ul>
<li>Giám sát công trình (nếu thuê riêng)</li>
<li>Phát sinh, dọn dẹp, kết nối hạ tầng</li>
</ul>

<div class="highlight-box">📌 <strong>Quy tắc:</strong> Luôn dự phòng thêm 10–15% tổng dự toán cho các khoản phát sinh. Ví dụ: dự toán 1 tỷ → chuẩn bị 1,1–1,15 tỷ đồng.</div>`
      },
      {
        q: "Nhà thầu báo giá rất thấp, có nên chọn không?",
        keywords: ["thấp", "rẻ", "rẻ nhất", "giá tốt", "nên chọn", "có nên", "đáng tin"],
        a: `Báo giá thấp bất thường so với mặt bằng chung thường là dấu hiệu cảnh báo. Cần xem xét kỹ trước khi quyết định.

<strong>Những lý do nhà thầu có thể báo giá rẻ:</strong>
<ul>
<li><strong>Bỏ sót hạng mục:</strong> Không tính đầy đủ, sau đó tính "phát sinh" với giá cao hơn</li>
<li><strong>Dùng vật liệu kém:</strong> Ghi chung chung trong hợp đồng rồi sử dụng hàng giá rẻ</li>
<li><strong>Thiếu kinh nghiệm:</strong> Bóc tách khối lượng sai, tính thiếu chi phí thực tế</li>
<li><strong>Thi công ẩu:</strong> Cắt giảm nhân công, rút ngắn quy trình kỹ thuật</li>
</ul>

<strong>Cách xử lý:</strong>
<ul>
<li>Yêu cầu nhà thầu giải trình chi tiết tại sao giá thấp hơn các đơn vị khác</li>
<li>So sánh từng hạng mục cụ thể với báo giá của nhà thầu khác</li>
<li>Kiểm tra thực tế các công trình nhà thầu đã thi công</li>
<li>Nếu chênh lệch trên 15% so với mặt bằng chung — cần đặc biệt cẩn trọng</li>
</ul>

<div class="highlight-box">⚠️ <strong>Nguyên tắc:</strong> Nhà thầu uy tín sẽ có mức giá hợp lý, không quá rẻ cũng không quá đắt. Ưu tiên chất lượng và sự minh bạch hơn giá thành.</div>`
      }
    ]
  },

  "tieu-chuan": {
    icon: "📐",
    title: "Tiêu chuẩn thi công",
    description: "Chất lượng, quy chuẩn kỹ thuật",
    keywords: ["tiêu chuẩn", "chất lượng", "kỹ thuật", "bê tông", "sắt thép", "cốt thép", "điện", "nước", "ống", "thi công", "giám sát", "nghiệm thu", "kiểm tra", "đổ bê tông", "xây tường", "móng", "cột", "dầm", "sàn"],
    questions: [
      {
        q: "Tiêu chuẩn cơ bản khi thi công phần thô là gì?",
        keywords: ["phần thô", "tiêu chuẩn", "cơ bản", "kiểm tra", "giám sát", "yêu cầu"],
        a: `Khi giám sát thi công phần thô, cần kiểm tra kỹ các hạng mục sau:

<strong>1. Phần móng</strong>
<ul>
<li>Đào đúng độ sâu theo thiết kế</li>
<li>Đất nền phải đủ cứng, không bùn nhão</li>
<li>Cốt thép đúng chủng loại và đúng khoảng cách theo bản vẽ</li>
</ul>

<strong>2. Cột và dầm</strong>
<ul>
<li>Thép buộc chặt, đúng số lượng theo bản vẽ kết cấu</li>
<li>Khuôn đổ (cốp pha) phải thẳng đứng, không bị nghiêng</li>
<li>Bê tông đổ liên tục, không để mạch ngừng tùy tiện</li>
</ul>

<strong>3. Tường</strong>
<ul>
<li>Gạch xây thẳng hàng, mạch vữa đều (khoảng 10mm)</li>
<li>Tường phải thẳng đứng (kiểm tra bằng quả dọi hoặc thước thủy)</li>
<li>Gắn râu thép liên kết giữa tường và cột</li>
</ul>

<strong>4. Sàn</strong>
<ul>
<li>Cốt thép sàn đúng chủng loại và khoảng cách thiết kế</li>
<li>Lớp bảo vệ (con kê) đúng quy cách</li>
<li>Bê tông sàn sau khi đổ phải được bảo dưỡng (tưới nước) ít nhất 7 ngày</li>
</ul>

<div class="highlight-box">📌 <strong>Khuyến nghị:</strong> Chụp ảnh chi tiết từng giai đoạn trước khi đổ bê tông. Đây là bằng chứng quan trọng nếu phát sinh tranh chấp về sau.</div>`
      },
      {
        q: "Làm sao kiểm tra chất lượng bê tông?",
        keywords: ["bê tông", "chất lượng", "kiểm tra", "đổ", "mác", "cường độ", "thương phẩm"],
        a: `Bê tông là thành phần quyết định độ bền kết cấu ngôi nhà. Cách kiểm tra theo từng giai đoạn:

<strong>Trước khi đổ bê tông</strong>
<ul>
<li>Yêu cầu bê tông thương phẩm có phiếu xuất kho ghi rõ mác (thường B20–B25 cho nhà phố)</li>
<li>Kiểm tra thời gian vận chuyển: từ trạm trộn đến công trình không quá 90 phút</li>
<li>Tuyệt đối không cho thêm nước vào bê tông tại công trình</li>
</ul>

<strong>Trong khi đổ bê tông</strong>
<ul>
<li>Đầm dùi kỹ lưỡng để bê tông không bị rỗ tổ ong</li>
<li>Đổ liên tục, không bị gián đoạn giữa chừng</li>
<li>Lấy mẫu thử (ép mẫu) để kiểm tra cường độ sau 28 ngày</li>
</ul>

<strong>Sau khi đổ bê tông</strong>
<ul>
<li>Bảo dưỡng bằng cách tưới nước thường xuyên trong 7–14 ngày</li>
<li>Thời gian tháo cốp pha tối thiểu: sàn ≥ 14 ngày, dầm ≥ 21 ngày</li>
<li>Không thi công tiếp lên sàn mới đổ khi bê tông chưa đủ cường độ</li>
</ul>

<div class="highlight-box">⚠️ <strong>Cảnh báo:</strong> Bê tông trộn tay tại công trình thường không đảm bảo chất lượng. Nên sử dụng bê tông thương phẩm cho các kết cấu chịu lực (móng, cột, dầm, sàn).</div>`
      },
      {
        q: "Tiêu chuẩn hệ thống điện nước trong nhà?",
        keywords: ["điện", "nước", "ống", "dây điện", "aptomat", "ổ cắm", "công tắc", "chống thấm"],
        a: `Hệ thống điện nước cần đạt tiêu chuẩn kỹ thuật để đảm bảo an toàn lâu dài:

<strong>Hệ thống điện</strong>
<ul>
<li>Dây điện phải đi trong ống gen luồn trong tường, không đi nổi</li>
<li>Ổ cắm: cách sàn 30–40cm. Công tắc: cách sàn 120–140cm</li>
<li>Phân chia mạch riêng biệt: chiếu sáng, ổ cắm, bếp, máy lạnh, bình nóng lạnh</li>
<li>Bắt buộc lắp: CB (aptomat) tổng + CB từng mạch + CB chống giật (ELCB)</li>
<li>Dây đồng, tiết diện phù hợp: tối thiểu 1,5mm² cho đèn, 2,5mm² cho ổ cắm, 4mm² cho thiết bị công suất lớn</li>
</ul>

<strong>Hệ thống nước</strong>
<ul>
<li>Ống cấp nước sạch: sử dụng ống PPR hoặc ống đồng (không dùng PVC cho nước nóng)</li>
<li>Ống thoát nước: sử dụng ống PVC, độ dốc tối thiểu 2% (2cm mỗi mét chiều dài)</li>
<li>Khu vệ sinh phải có hố ga và bẫy mùi (U-trap hoặc P-trap)</li>
<li>Chống thấm sàn WC, sân thượng, ban công bằng vật liệu chuyên dụng</li>
</ul>

<div class="highlight-box">📌 <strong>Khuyến nghị:</strong> Yêu cầu thợ chụp ảnh toàn bộ đường ống trước khi đổ bê tông hoặc tô trát. Tài liệu này rất cần thiết khi sửa chữa, bảo trì sau này.</div>`
      }
    ]
  },

  "thac-mac": {
    icon: "❓",
    title: "Giải đáp thắc mắc",
    description: "Giải đáp vấn đề phát sinh khi thi công",
    keywords: ["thắc mắc", "hỏi", "phát sinh", "vấn đề", "xử lý", "mưa", "giám sát", "sai bản vẽ", "thi công sai", "thêm tiền", "thuê", "kiểm tra"],
    questions: [
      {
        q: "Nhà thầu xin thêm tiền phát sinh, có nên đưa không?",
        keywords: ["phát sinh", "thêm tiền", "xin thêm", "đưa tiền", "nên đưa", "phải trả"],
        a: `Phát sinh trong quá trình xây dựng là điều bình thường, tuy nhiên cần xử lý đúng cách để bảo vệ quyền lợi:

<strong>Phát sinh HỢP LÝ — nên chấp nhận</strong>
<ul>
<li>Đào móng gặp nền đất yếu, cần gia cố bổ sung</li>
<li>Thay đổi thiết kế do chủ nhà yêu cầu</li>
<li>Giá vật liệu tăng đột biến có hóa đơn, chứng từ chứng minh</li>
<li>Phát hiện vấn đề kỹ thuật không lường trước được</li>
</ul>

<strong>Phát sinh BẤT HỢP LÝ — cần từ chối</strong>
<ul>
<li>Tính thêm chi phí cho hạng mục đã có trong hợp đồng</li>
<li>Đội giá vật liệu không có hóa đơn chứng minh</li>
<li>Yêu cầu thêm tiền vì "khó thi công" — đây là trách nhiệm của nhà thầu</li>
</ul>

<strong>Quy trình xử lý phát sinh đúng chuẩn</strong>
<ol>
<li>Nhà thầu phải thông báo trước bằng văn bản</li>
<li>Lập bảng báo giá phát sinh chi tiết</li>
<li>Chủ nhà xem xét, duyệt và ký xác nhận — chỉ sau đó mới được thi công</li>
<li>Lưu hồ sơ phát sinh riêng biệt, tách khỏi hợp đồng chính</li>
</ol>

<div class="highlight-box">📌 <strong>Khuyến nghị:</strong> Nếu tổng phát sinh vượt 10% giá trị hợp đồng, nên thuê đơn vị giám sát độc lập để kiểm tra tính hợp lý.</div>`
      },
      {
        q: "Phát hiện thi công sai bản vẽ thì xử lý thế nào?",
        keywords: ["sai bản vẽ", "thi công sai", "không đúng", "lệch", "khác thiết kế", "sửa"],
        a: `Khi phát hiện thi công không đúng bản vẽ thiết kế, cần xử lý theo trình tự sau:

<strong>Bước 1 — Ghi nhận bằng chứng</strong>
<ul>
<li>Chụp ảnh hoặc quay video vị trí thi công sai so với bản vẽ</li>
<li>Ghi rõ ngày phát hiện, vị trí cụ thể, mô tả chi tiết sai lệch</li>
</ul>

<strong>Bước 2 — Thông báo nhà thầu bằng văn bản</strong>
<ul>
<li>Gửi tin nhắn hoặc email kèm hình ảnh chứng minh</li>
<li>Yêu cầu tạm dừng thi công hạng mục bị sai</li>
<li>Đề nghị giải trình trong vòng 24–48 giờ</li>
</ul>

<strong>Bước 3 — Họp và quyết định phương án</strong>
<ul>
<li>Sai nhỏ, không ảnh hưởng kết cấu: có thể thỏa thuận sửa chữa</li>
<li>Sai lớn, ảnh hưởng kết cấu chịu lực: bắt buộc đập bỏ và thi công lại</li>
<li>Toàn bộ chi phí sửa chữa do nhà thầu chịu (vì vi phạm hợp đồng)</li>
</ul>

<strong>Bước 4 — Lập biên bản</strong>
<ul>
<li>Biên bản ghi rõ lỗi vi phạm, phương án khắc phục, thời gian hoàn thành</li>
<li>Cả hai bên ký tên xác nhận</li>
</ul>

<div class="highlight-box">⚠️ <strong>Cảnh báo:</strong> Tuyệt đối không bỏ qua lỗi liên quan đến kết cấu chịu lực (sai thép, sai kích thước cột dầm). Đây là vấn đề an toàn sinh mạng.</div>`
      },
      {
        q: "Trời mưa có nên tiếp tục thi công không?",
        keywords: ["mưa", "thời tiết", "nắng", "ẩm", "ướt", "dừng", "tiếp tục"],
        a: `Thời tiết có ảnh hưởng trực tiếp đến chất lượng thi công. Cần phân biệt rõ các trường hợp:

<strong>KHÔNG nên thi công khi mưa</strong>
<ul>
<li><strong>Đổ bê tông:</strong> Mưa làm thay đổi tỷ lệ nước/xi măng, giảm cường độ nghiêm trọng</li>
<li><strong>Sơn:</strong> Bề mặt ẩm khiến sơn bong tróc, không bám dính</li>
<li><strong>Chống thấm:</strong> Bề mặt phải hoàn toàn khô ráo mới thi công được</li>
<li><strong>Hàn thép:</strong> Độ ẩm cao ảnh hưởng đến chất lượng mối hàn</li>
</ul>

<strong>CÓ THỂ thi công khi mưa nhỏ</strong>
<ul>
<li>Xây tường ở khu vực đã có mái che</li>
<li>Thi công nội thất bên trong nhà</li>
<li>Lắp đặt hệ thống điện nước trong nhà</li>
<li>Gia công cốt thép (nếu có mái che)</li>
</ul>

<strong>Biện pháp bảo vệ khi gặp mưa bất ngờ</strong>
<ul>
<li>Che phủ ngay bê tông mới đổ bằng bạt chống thấm</li>
<li>Bơm hết nước đọng ra khỏi hố móng</li>
<li>Bảo quản vật liệu (xi măng, sắt thép) ở nơi khô ráo</li>
</ul>

<div class="highlight-box">📌 <strong>Khuyến nghị:</strong> Theo dõi dự báo thời tiết để lên kế hoạch đổ bê tông vào ngày nắng ráo. Chủ động thông báo nhà thầu dời lịch nếu cần thiết.</div>`
      },
      {
        q: "Có nên thuê giám sát công trình riêng không?",
        keywords: ["giám sát", "thuê giám sát", "kiểm tra", "theo dõi", "giám sát độc lập", "cần thuê"],
        a: `Giám sát công trình là dịch vụ giúp chủ nhà kiểm soát chất lượng thi công. Đây là vấn đề nhiều chủ nhà phân vân.

<strong>Giám sát công trình làm những gì?</strong>
<ul>
<li>Kiểm tra chất lượng vật liệu đầu vào (đúng chủng loại và quy cách)</li>
<li>Giám sát quy trình thi công (đúng kỹ thuật, đúng bản vẽ)</li>
<li>Kiểm tra khối lượng thực tế (phòng tránh khai khống)</li>
<li>Nghiệm thu từng giai đoạn thi công</li>
<li>Tư vấn kỹ thuật cho chủ nhà khi cần</li>
</ul>

<strong>NÊN thuê giám sát khi:</strong>
<ul>
<li>Xây nhà lần đầu, chưa có kinh nghiệm trong lĩnh vực xây dựng</li>
<li>Không có thời gian trực tiếp theo dõi công trình</li>
<li>Công trình có giá trị lớn (trên 1 tỷ đồng)</li>
<li>Hợp tác với nhà thầu lần đầu, chưa có độ tin cậy cao</li>
</ul>

<strong>Chi phí giám sát tham khảo</strong>
<ul>
<li>Thường chiếm 3–5% giá trị xây dựng</li>
<li>Hoặc khoảng 3–7 triệu đồng/tháng tùy quy mô công trình</li>
</ul>

<div class="highlight-box">📌 <strong>Kết luận:</strong> Chi phí giám sát nhỏ hơn rất nhiều so với thiệt hại nếu thi công sai. Đặc biệt với người xây nhà lần đầu, đây là khoản đầu tư rất đáng để cân nhắc.</div>`
      }
    ]
  }
};

// =============================================
// CHATBOT ENGINE
// =============================================
const BOT_NAME = "Trợ Lý Xây Nhà";

// DOM Elements — Chat
const chatMessages = document.getElementById('chat-messages');
const quickReplies = document.getElementById('quick-replies');
const typingIndicator = document.getElementById('typing-indicator');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const sidebarTopics = document.getElementById('sidebar-topics');
const headerSubtitle = document.getElementById('header-subtitle');

// DOM Elements — Registration
const registerScreen = document.getElementById('register-screen');
const registerForm = document.getElementById('register-form');
const appContainer = document.getElementById('app');
const inputName = document.getElementById('input-name');
const inputPhone = document.getElementById('input-phone');
const inputCourse = document.getElementById('input-course');
const inputClass = document.getElementById('input-class');
const classGroup = document.getElementById('class-group');

// State
let currentTopic = null;
let messageCount = 0;
let userData = null;
let isProcessing = false;

// =============================================
// REGISTRATION LOGIC
// =============================================
function getCourseName(value) {
  if (value === 'tu-kiem-soat') return 'Tự Kiểm Soát Xây Nhà';
  if (value === 'xay-nha-lan-dau') return 'Xây Nhà Lần Đầu';
  return '';
}

inputCourse.addEventListener('change', () => {
  if (inputCourse.value === 'tu-kiem-soat') {
    classGroup.classList.remove('hidden');
    classGroup.classList.add('show');
    inputClass.setAttribute('required', '');
  } else {
    classGroup.classList.add('hidden');
    classGroup.classList.remove('show');
    inputClass.removeAttribute('required');
    inputClass.value = '';
    clearFieldError('class');
  }
});

function setFieldError(fieldName, message) {
  const errorEl = document.getElementById(`error-${fieldName}`);
  const inputEl = document.getElementById(`input-${fieldName}`);
  if (errorEl) errorEl.textContent = message;
  if (inputEl) inputEl.classList.add('error');
}

function clearFieldError(fieldName) {
  const errorEl = document.getElementById(`error-${fieldName}`);
  const inputEl = document.getElementById(`input-${fieldName}`);
  if (errorEl) errorEl.textContent = '';
  if (inputEl) inputEl.classList.remove('error');
}

['name', 'phone', 'course', 'class'].forEach(field => {
  const el = document.getElementById(`input-${field}`);
  if (el) {
    el.addEventListener('input', () => clearFieldError(field));
    el.addEventListener('change', () => clearFieldError(field));
  }
});

function validateForm() {
  let valid = true;
  const name = inputName.value.trim();
  if (!name) { setFieldError('name', 'Vui lòng nhập họ và tên'); valid = false; }
  else if (name.length < 2) { setFieldError('name', 'Họ tên phải có ít nhất 2 ký tự'); valid = false; }
  else { clearFieldError('name'); }

  const phone = inputPhone.value.trim().replace(/\s+/g, '');
  const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
  if (!phone) { setFieldError('phone', 'Vui lòng nhập số điện thoại'); valid = false; }
  else if (!phoneRegex.test(phone)) { setFieldError('phone', 'Số điện thoại không hợp lệ (VD: 0901234567)'); valid = false; }
  else { clearFieldError('phone'); }

  if (!inputCourse.value) { setFieldError('course', 'Vui lòng chọn khóa học'); valid = false; }
  else { clearFieldError('course'); }

  if (inputCourse.value === 'tu-kiem-soat' && !inputClass.value.trim()) {
    setFieldError('class', 'Vui lòng nhập lớp học (VD: K15)'); valid = false;
  } else { clearFieldError('class'); }

  return valid;
}

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validateForm()) return;
  userData = {
    name: inputName.value.trim(),
    phone: inputPhone.value.trim(),
    course: inputCourse.value,
    courseName: getCourseName(inputCourse.value),
    className: inputCourse.value === 'tu-kiem-soat' ? inputClass.value.trim() : null,
    registeredAt: new Date().toISOString()
  };
  localStorage.setItem('xnld_user', JSON.stringify(userData));
  registerScreen.classList.add('hidden');
  appContainer.classList.remove('hidden');
  initChat();
});

function checkExistingUser() {
  const saved = localStorage.getItem('xnld_user');
  if (saved) {
    try {
      userData = JSON.parse(saved);
      registerScreen.classList.add('hidden');
      appContainer.classList.remove('hidden');
      initChat();
      return true;
    } catch (e) { localStorage.removeItem('xnld_user'); }
  }
  return false;
}

// =============================================
// KEYWORD MATCHING ENGINE
// =============================================
function normalizeText(text) {
  return text.toLowerCase().trim();
}

function calculateMatchScore(userText, keywords) {
  const normalized = normalizeText(userText);
  let score = 0;
  for (const keyword of keywords) {
    if (normalized.includes(normalizeText(keyword))) {
      score += keyword.length; // longer keyword matches = higher relevance
    }
  }
  return score;
}

function findBestMatchInTopic(userText, topicKey) {
  const topic = TOPICS[topicKey];
  let bestScore = 0;
  let bestIndex = -1;

  topic.questions.forEach((item, index) => {
    const score = calculateMatchScore(userText, item.keywords);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return { score: bestScore, index: bestIndex };
}

function findMatchingTopic(userText) {
  let bestTopic = null;
  let bestScore = 0;

  Object.keys(TOPICS).forEach(key => {
    const score = calculateMatchScore(userText, TOPICS[key].keywords);
    if (score > bestScore) {
      bestScore = score;
      bestTopic = key;
    }
  });

  return { topicKey: bestTopic, score: bestScore };
}

function checkIfOffTopic(userText, currentTopicKey) {
  if (!currentTopicKey || currentTopicKey === 'thac-mac') return false;

  const currentScore = calculateMatchScore(userText, TOPICS[currentTopicKey].keywords);
  // Also check question-level keywords in current topic
  let questionScore = 0;
  TOPICS[currentTopicKey].questions.forEach(q => {
    questionScore = Math.max(questionScore, calculateMatchScore(userText, q.keywords));
  });

  const totalCurrentScore = currentScore + questionScore;

  // Check other topics
  let bestOtherScore = 0;
  let bestOtherTopic = null;
  Object.keys(TOPICS).forEach(key => {
    if (key === currentTopicKey) return;
    const score = calculateMatchScore(userText, TOPICS[key].keywords);
    if (score > bestOtherScore) {
      bestOtherScore = score;
      bestOtherTopic = key;
    }
  });

  // If another topic scores significantly higher, it's off-topic
  if (bestOtherScore > totalCurrentScore && bestOtherScore > 3) {
    return { offTopic: true, suggestedTopic: bestOtherTopic };
  }

  return false;
}

// =============================================
// FREE TEXT INPUT HANDLING
// =============================================
function setupChatInput() {
  chatSendBtn.addEventListener('click', handleSendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });
}

async function handleSendMessage() {
  const text = chatInput.value.trim();
  if (!text || isProcessing) return;

  isProcessing = true;
  chatInput.value = '';

  // Show user message
  addUserMessage(text);
  clearQuickReplies();

  // Typing indicator
  showTyping();
  await delay(800 + Math.random() * 600);
  hideTyping();

  // Process the message
  if (!currentTopic) {
    // No topic selected — try to route to a topic
    await handleMainMenuInput(text);
  } else {
    // Inside a topic — check if on-topic
    await handleTopicInput(text);
  }

  isProcessing = false;
}

async function handleMainMenuInput(text) {
  const match = findMatchingTopic(text);

  if (match.score > 3) {
    // Found a matching topic, select it
    currentTopic = match.topicKey;
    const topic = TOPICS[match.topicKey];
    updateSidebarActive();
    updateHeaderSubtitle();

    // Try to find a matching question within the topic
    const questionMatch = findBestMatchInTopic(text, match.topicKey);

    if (questionMatch.score > 3) {
      // Direct answer
      addBotMessage(`Câu hỏi của bạn thuộc chủ đề <strong>${topic.title}</strong>. Dưới đây là thông tin liên quan:`);
      showTyping();
      await delay(600);
      hideTyping();
      addBotMessage(topic.questions[questionMatch.index].a);
      await delay(300);
      renderAfterAnswerButtons(match.topicKey);
    } else {
      // Show topic questions
      addBotMessage(`Câu hỏi của bạn liên quan đến chủ đề <strong>${topic.title}</strong>.\n\nDưới đây là các câu hỏi phổ biến mà bạn có thể tham khảo, hoặc bạn có thể tiếp tục nhập câu hỏi cụ thể:`);
      renderQuestionButtons(match.topicKey);
    }
  } else {
    // No clear match — show main menu
    addBotMessage(`Hiện tại, hệ thống hỗ trợ tư vấn 5 chủ đề chính bên dưới.\n\nBạn vui lòng chọn chủ đề phù hợp hoặc nhập câu hỏi chi tiết hơn để được giải đáp chính xác:`);
    renderTopicButtons();
  }
}

async function handleTopicInput(text) {
  // Check if off-topic
  const offTopicCheck = checkIfOffTopic(text, currentTopic);

  if (offTopicCheck && offTopicCheck.offTopic) {
    const suggestedTopicName = TOPICS[offTopicCheck.suggestedTopic]
      ? TOPICS[offTopicCheck.suggestedTopic].title
      : 'Giải đáp thắc mắc';

    addBotMessage(`Câu hỏi này không thuộc phạm vi chủ đề <strong>${TOPICS[currentTopic].title}</strong> mà bạn đang theo dõi.\n\nNội dung này có vẻ liên quan đến chủ đề <strong>${suggestedTopicName}</strong>. Để được giải đáp chính xác, bạn vui lòng chuyển sang mục <strong>Giải đáp thắc mắc</strong> hoặc quay lại menu chính để chọn đúng chủ đề.`);

    // Show redirect buttons
    clearQuickReplies();
    const navGroup = document.createElement('div');
    navGroup.className = 'nav-btn-group';

    const thacMacBtn = document.createElement('button');
    thacMacBtn.className = 'nav-btn';
    thacMacBtn.innerHTML = '❓ Chuyển sang Giải đáp thắc mắc';
    thacMacBtn.addEventListener('click', () => switchToTopic('thac-mac'));
    navGroup.appendChild(thacMacBtn);

    const menuBtn = document.createElement('button');
    menuBtn.className = 'nav-btn';
    menuBtn.innerHTML = '🏠 Quay lại menu chính';
    menuBtn.addEventListener('click', goToMainMenu);
    navGroup.appendChild(menuBtn);

    quickReplies.appendChild(navGroup);
    return;
  }

  // On-topic — try to match a specific question
  const questionMatch = findBestMatchInTopic(text, currentTopic);

  if (questionMatch.score > 3) {
    addBotMessage(TOPICS[currentTopic].questions[questionMatch.index].a);
    await delay(300);
    renderAfterAnswerButtons(currentTopic);
  } else {
    // No specific match — show suggestions
    addBotMessage(`Hiện tại, hệ thống không tìm thấy nội dung phù hợp chính xác với câu hỏi của bạn trong chủ đề <strong>${TOPICS[currentTopic].title}</strong>.\n\nBạn có thể tham khảo các câu hỏi phổ biến bên dưới, hoặc nhập lại câu hỏi với từ khóa cụ thể hơn:`);
    renderQuestionButtons(currentTopic);
  }
}

async function switchToTopic(topicKey) {
  currentTopic = topicKey;
  const topic = TOPICS[topicKey];

  addUserMessage(`${topic.icon} ${topic.title}`);
  clearQuickReplies();
  updateSidebarActive();
  updateHeaderSubtitle();

  showTyping();
  await delay(500);
  hideTyping();

  addBotMessage(`Bạn đã chuyển sang chủ đề <strong>${topic.title}</strong>.\n\nDưới đây là các câu hỏi phổ biến. Bạn có thể chọn hoặc nhập trực tiếp câu hỏi của mình:`);
  renderQuestionButtons(topicKey);
}

// =============================================
// UTILITY FUNCTIONS
// =============================================
function getTimeString() {
  const now = new Date();
  return now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: 'smooth'
    });
  });
}

// =============================================
// MESSAGE RENDERING
// =============================================
function addBotMessage(htmlContent, showAvatar = true) {
  messageCount++;
  const row = document.createElement('div');
  row.className = 'message-row bot';
  row.style.animationDelay = '0.1s';

  const avatarHtml = showAvatar
    ? '<div class="msg-avatar">🏠</div>'
    : '<div class="msg-avatar" style="visibility:hidden">🏠</div>';

  row.innerHTML = `
    ${avatarHtml}
    <div>
      <div class="message-bubble">${htmlContent}</div>
      <div class="message-time">${getTimeString()}</div>
    </div>
  `;

  chatMessages.appendChild(row);
  scrollToBottom();
}

function addUserMessage(text) {
  messageCount++;
  const row = document.createElement('div');
  row.className = 'message-row user';

  row.innerHTML = `
    <div>
      <div class="message-bubble">${text}</div>
      <div class="message-time">${getTimeString()}</div>
    </div>
  `;

  chatMessages.appendChild(row);
  scrollToBottom();
}

// =============================================
// TYPING INDICATOR
// =============================================
function showTyping() {
  typingIndicator.classList.remove('hidden');
  scrollToBottom();
}

function hideTyping() {
  typingIndicator.classList.add('hidden');
}

// =============================================
// QUICK REPLY BUTTONS
// =============================================
function clearQuickReplies() {
  quickReplies.innerHTML = '';
}

function renderTopicButtons() {
  clearQuickReplies();

  Object.keys(TOPICS).forEach(key => {
    const topic = TOPICS[key];
    const btn = document.createElement('button');
    btn.className = 'topic-btn';
    btn.setAttribute('aria-label', `Chọn chủ đề: ${topic.title}`);
    btn.innerHTML = `
      <span class="btn-icon">${topic.icon}</span>
      <span class="btn-content">
        <span class="btn-title">${topic.title}</span>
        <span class="btn-desc">${topic.description}</span>
      </span>
    `;
    btn.addEventListener('click', () => selectTopic(key));
    quickReplies.appendChild(btn);
  });
}

function renderQuestionButtons(topicKey) {
  clearQuickReplies();

  const topic = TOPICS[topicKey];
  topic.questions.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = 'question-btn';
    btn.setAttribute('aria-label', item.q);
    btn.textContent = item.q;
    btn.addEventListener('click', () => selectQuestion(topicKey, index));
    quickReplies.appendChild(btn);
  });

  const navGroup = document.createElement('div');
  navGroup.className = 'nav-btn-group';

  const backBtn = document.createElement('button');
  backBtn.className = 'nav-btn';
  backBtn.innerHTML = '← Quay lại menu chính';
  backBtn.addEventListener('click', goToMainMenu);
  navGroup.appendChild(backBtn);

  quickReplies.appendChild(navGroup);
}

function renderAfterAnswerButtons(topicKey) {
  clearQuickReplies();

  const navGroup = document.createElement('div');
  navGroup.className = 'nav-btn-group';

  const moreBtn = document.createElement('button');
  moreBtn.className = 'nav-btn';
  moreBtn.innerHTML = '📋 Xem thêm câu hỏi về ' + TOPICS[topicKey].title;
  moreBtn.addEventListener('click', () => backToTopic(topicKey));
  navGroup.appendChild(moreBtn);

  const menuBtn = document.createElement('button');
  menuBtn.className = 'nav-btn';
  menuBtn.innerHTML = '🏠 Quay lại menu chính';
  menuBtn.addEventListener('click', goToMainMenu);
  navGroup.appendChild(menuBtn);

  quickReplies.appendChild(navGroup);
}

// =============================================
// CHAT FLOW ACTIONS
// =============================================
async function selectTopic(topicKey) {
  const topic = TOPICS[topicKey];
  currentTopic = topicKey;

  addUserMessage(`${topic.icon} ${topic.title}`);
  clearQuickReplies();
  updateSidebarActive();
  updateHeaderSubtitle();

  showTyping();
  await delay(600 + Math.random() * 400);
  hideTyping();

  addBotMessage(`Bạn đã chọn chủ đề <strong>${topic.title}</strong>.\n\nDưới đây là các câu hỏi phổ biến mà nhiều học viên quan tâm. Bạn có thể chọn hoặc nhập trực tiếp câu hỏi của mình:`);

  renderQuestionButtons(topicKey);
}

async function selectQuestion(topicKey, questionIndex) {
  const topic = TOPICS[topicKey];
  const item = topic.questions[questionIndex];

  addUserMessage(item.q);
  clearQuickReplies();

  showTyping();
  await delay(1000 + Math.random() * 800);
  hideTyping();

  addBotMessage(item.a);

  await delay(300);
  renderAfterAnswerButtons(topicKey);
}

async function backToTopic(topicKey) {
  addUserMessage(`Xem thêm câu hỏi về ${TOPICS[topicKey].title}`);
  clearQuickReplies();

  showTyping();
  await delay(400);
  hideTyping();

  addBotMessage('Dưới đây là các câu hỏi phổ biến. Bạn cũng có thể nhập trực tiếp câu hỏi của mình:');
  renderQuestionButtons(topicKey);
}

async function goToMainMenu() {
  currentTopic = null;
  addUserMessage('🏠 Quay lại menu chính');
  clearQuickReplies();
  updateSidebarActive();
  updateHeaderSubtitle();

  showTyping();
  await delay(400);
  hideTyping();

  addBotMessage('Bạn muốn tìm hiểu thêm chủ đề nào? Vui lòng chọn bên dưới hoặc nhập câu hỏi trực tiếp:');
  renderTopicButtons();
}

// =============================================
// SIDEBAR (Desktop)
// =============================================
function renderSidebar() {
  if (!sidebarTopics) return;
  sidebarTopics.innerHTML = '';

  Object.keys(TOPICS).forEach(key => {
    const topic = TOPICS[key];
    const btn = document.createElement('button');
    btn.className = 'sidebar-topic-btn';
    btn.setAttribute('data-topic', key);
    btn.innerHTML = `
      <span class="stb-icon">${topic.icon}</span>
      <span class="stb-label">
        <span class="stb-title">${topic.title}</span>
        <span class="stb-desc">${topic.description}</span>
      </span>
    `;
    btn.addEventListener('click', () => selectTopic(key));
    sidebarTopics.appendChild(btn);
  });
}

function updateSidebarActive() {
  if (!sidebarTopics) return;
  const buttons = sidebarTopics.querySelectorAll('.sidebar-topic-btn');
  buttons.forEach(btn => {
    const topicKey = btn.getAttribute('data-topic');
    if (topicKey === currentTopic) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function updateHeaderSubtitle() {
  if (!headerSubtitle) return;
  if (currentTopic && TOPICS[currentTopic]) {
    headerSubtitle.textContent = TOPICS[currentTopic].title;
  } else {
    headerSubtitle.textContent = 'Khóa học Xây Nhà Lần Đầu';
  }
}

// =============================================
// INITIALIZATION
// =============================================
function getWelcomeMessage() {
  const firstName = userData ? userData.name.split(' ').pop() : 'bạn';
  return `Xin chào <strong>${firstName}</strong>.\n\nChào mừng bạn đến với <strong>Trợ Lý Xây Nhà</strong> — công cụ tư vấn dành riêng cho học viên.\n\nHệ thống hỗ trợ giải đáp 5 chủ đề quan trọng khi xây nhà. Bạn có thể chọn chủ đề bên dưới hoặc nhập trực tiếp câu hỏi:`;
}

async function initChat() {
  // Render sidebar for desktop
  renderSidebar();

  await delay(500);
  showTyping();
  await delay(800);
  hideTyping();

  addBotMessage(getWelcomeMessage());
  renderTopicButtons();

  // Setup free text input
  setupChatInput();
}

// Start the app
document.addEventListener('DOMContentLoaded', () => {
  checkExistingUser();
});
