import re

def main():
    new_topics = r'''const TOPICS = {
  "hop-dong": {
    icon: "📋",
    title: "Hợp đồng",
    description: "Kinh nghiệm chọn thầu & ký hợp đồng",
    keywords: ["hợp đồng", "ký kết", "nhà thầu", "chọn thầu", "phạt", "an toàn lao động", "thanh toán", "tạm ứng", "phụ lục", "trách nhiệm", "so sánh"],
    questions: [
      {
        q: "Làm sao để biết nhà thầu có uy tín và năng lực thực sự hay không?",
        keywords: ["uy tín", "năng lực", "chọn thầu", "đánh giá", "kinh nghiệm", "nhà thầu", "công ty"],
        a: `Dạ, để đánh giá năng lực một nhà thầu Xây Dựng, anh/chị tuyệt đối không chỉ nghe họ tư vấn mà cần kiểm chứng qua các bước sau:\n
<strong>1. Kiểm tra Pháp nhân & Kinh nghiệm:</strong>
<ul>
<li>Yêu cầu cho xem Giấy phép kinh doanh, Chứng chỉ năng lực hoạt động xây dựng (tối thiểu hạng III).</li>
<li>Hỏi số năm kinh nghiệm (ưu tiên trên 5 năm) và đề nghị xem hồ sơ năng lực của các công trình tương tự đã hoàn thành.</li>
</ul>\n
<strong>2. Đánh giá Nhân sự trực tiếp:</strong>
<ul>
<li>Hỏi cấu trúc thợ: Thợ là công nhân trực thuộc công ty hay là tổ đội khoán bên ngoài? (Nên chọn công ty có thợ nội bộ để dễ quản lý).</li>
<li>Xin gặp trực tiếp Kỹ sư Chỉ huy trưởng - người sẽ ăn ngủ tại công trình nhà anh/chị.</li>
</ul>\n
<strong>3. Khảo sát công trình thực tế (BẮT BUỘC):</strong>
<ul>
<li>Xin địa chỉ 1-2 công trình họ đang thi công. Đến bất ngờ không báo trước để xem: Biển báo có chuyên nghiệp không? Vật tư sắp xếp có gọn gàng không? Công nhân có mặc đồ bảo hộ không?</li>
<li>Hỏi dò hàng xóm quanh công trình: Kỹ sư có nhậu nhẹt chửi bới không? Công ty có nợ tiền vật tư, nợ lương thợ bao giờ chưa?</li>
<li>Hỏi chủ nhà công trình đó: Nhà thầu có đàng hoàng, báo cáo thường xuyên và không kỳ kèo bớt xén không?</li>
</ul>\n
<div class="highlight-box">📌 <strong>Tuyệt chiêu:</strong> Báo giá rẻ nhất chưa chắc tốt nhất. Đừng chọn nhà thầu chỉ vì giá thấp, hãy chọn nhà thầu có hợp đồng minh bạch và trả lời rõ ràng được mọi thắc mắc của anh/chị.</div>`
      },
      {
        q: "Hợp đồng thi công cần có những điều khoản phạt nào để tránh rủi ro?",
        keywords: ["phạt", "điều khoản", "an toàn", "rủi ro", "chậm trễ", "tiến độ", "thuốc", "rác"],
        a: `Dạ, hợp đồng là "vũ khí" bảo vệ chủ nhà. Chắc chắn anh/chị phải yêu cầu đưa các Điều Khoản Phạt cực kỳ chi tiết này vào phụ lục hợp đồng:\n
<strong>1. Phạt Tiến độ & Vật tư:</strong>
<ul>
<li><strong>Chậm tiến độ:</strong> Phạt 1.000.000 VNĐ/ngày cho mỗi ngày trễ hẹn (hoặc một tỷ lệ % nhất định theo giá trị hợp đồng).</li>
<li><strong>Tráo đổi vật tư:</strong> Tuyệt đối nghiêm cấm việc tự ý thay đổi chủng loại vật liệu. Nếu vi phạm, phạt ngay lập tức (VD: 20.000.000 VNĐ/lần), buộc tháo dỡ toàn bộ phần thi công sai và chịu hoàn toàn chi phí khắc phục.</li>
</ul>\n
<strong>2. Phạt An toàn lao động & Vệ sinh:</strong>
<ul>
<li>Hút thuốc, uống rượu, ăn nhậu tại công trình: Phạt 1.000.000 VNĐ/lần và đình chỉ thợ vi phạm.</li>
<li>Không đội mũ bảo hộ, dây đai an toàn: Phạt 300.000 VNĐ/lần/người.</li>
<li>Đi vệ sinh bừa bãi sai chỗ, xả rác bẩn trong công trình: Phạt 300.000 - 500.000 VNĐ/lần và trừ thẳng vào đợt thanh toán kế tiếp.</li>
</ul>\n
<strong>3. Chấm dứt hợp đồng đơn phương:</strong>
<ul>
<li>Trong trường hợp xảy ra tai nạn lao động nghiêm trọng do lỗi chủ quan của nhà thầu mà không khai báo, chủ nhà có quyền <strong>chấm dứt hợp đồng ngay lập tức</strong> và không thanh toán công nợ còn lại.</li>
</ul>\n
<div class="highlight-box">⚠️ <strong>Lưu ý:</strong> Tai nạn lao động tại công trình là trách nhiệm của nhà thầu. Hợp đồng phải ghi rõ "Nhà thầu chịu 100% trách nhiệm về pháp lý, đạo lý và tài chính với công nhân của mình".</div>`
      },
      {
        q: "Việc thanh toán và bảo hành nên quy định phân chia thế nào cho an toàn?",
        keywords: ["thanh toán", "bảo hành", "chia tiền", "giữ tiền", "tạm ứng"],
        a: `Dạ, để nắm "đằng chuôi", việc chia đợt thanh toán phải bám sát theo khối lượng thi công thực tế:\n
<strong>1. Về tiến độ thanh toán:</strong>
<ul>
<li>Chỉ thanh toán <strong>SAU KHI</strong> đã nghiệm thu đạt yêu cầu của mỗi đợt. (Ví dụ: đổ xong móng, kiểm tra đạt mới trả tiền đợt móng).</li>
<li>Không bao giờ ứng trước một khoản tiền quá lớn (VD không quá 10 - 15% tổng giá trị).</li>
</ul>\n
<strong>2. Khoản giữ lại (Giữ chân):</strong>
<ul>
<li>Tuyệt đối phải giữ lại <strong>5% giá trị hợp đồng</strong> trong ít nhất 30 ngày (đối với gói vật tư) hoặc 12-24 tháng (đối với gói thầu thi công) để làm chi phí <b>bảo hành công trình</b>.</li>
<li>Điều khoản bảo hành: Nếu báo lỗi mà nhà thầu không đến sửa chữa trong vòng 5 ngày, anh/chị có quyền thuê đơn vị khác vào sửa và trừ thẳng chi phí đó vào 5% tiền giữ lại này.</li>
</ul>\n
<div class="highlight-box">📌 <strong>Kinh nghiệm:</strong> Trong trường hợp nhà thầu cam kết bảo hành nhưng "bỏ của chạy lấy người", khoản 5% giữ lại này chính là tiền để anh/chị dự phòng tìm thợ khác sửa chữa.</div>`
      }
    ]
  },

  "bao-gia": {
    icon: "💰",
    title: "Báo giá thi công",
    description: "Nhận biết báo giá ảo, bóc tách dư toán",
    keywords: ["báo giá", "giá", "dự toán", "tiền", "phát sinh", "m2", "chi phí"],
    questions: [
      {
        q: "Làm sao để đọc và so sánh các báo giá xây dựng, tránh bị lừa?",
        keywords: ["đọc báo giá", "so sánh", "tránh lừa", "thấp", "rẻ", "m2"],
        a: `Dạ, nhìn bảng báo giá anh/chị đừng chỉ nhìn vào con số "Tổng tiền" cuối cùng. Cần phân tích theo 3 tiêu chí sau:\n
<strong>1. Đừng so sánh dựa trên "Đơn giá m²":</strong>
<ul>
<li>Mỗi nhà thầu có cách tính m² khác nhau (có nơi tính móng 30%, có nơi tính 50%; mái ngói có chỗ tính 70%, chỗ tính 100%). Giá m² rẻ nhưng hệ số tính diện tích cao thì tổng tiền vẫn đắt.</li>
</ul>\n
<strong>2. Bóc tách chi tiết (Dự toán chi tiết):</strong>
<ul>
<li>Báo giá phải rõ ràng khối lượng từng phần: Bao nhiêu bao xi măng, bao nhiêu khối cát, bao nhiêu mét khối bê tông.</li>
<li>Nhà thầu nào chỉ quăng cho anh/chị 1 cục "Trọn gói phần thô: 1 tỷ" mà không có diễn giải khối lượng là đánh trượt ngay.</li>
</ul>\n
<strong>3. Xác định rõ Thương hiệu & Quy cách vật tư:</strong>
<ul>
<li>Không chấp nhận chữ "Cáp điện CADIVI loại tốt" hay "Thép Hòa Phát". Phải ghi rõ tiết diện cáp (2.5mm hay 4mm), thép là CB300 hay CB400. Nhãn hiệu xi măng (Insee, Hà Tiên) xây hay đổ bê tông đều phải rạch ròi.</li>
</ul>\n
<div class="highlight-box">⚠️ <strong>Cảnh báo:</strong> Nếu nhà thầu bỏ giá thấp hơn thị trường 15-20%, họ chắc chắn sẽ: 1. Sử dụng vật liệu kém chất lượng; 2. Bỏ chạy giữa chừng; 3. Cài cắm phát sinh về sau.</div>`
      },
      {
        q: "Những chi phí phát sinh nào là hợp lý và không hợp lý?",
        keywords: ["phát sinh", "dội giá", "đội vốn", "thêm tiền", "phí ngầm"],
        a: `Dạ, anh/chị cần phân biệt rõ trắng đen trong vấn đề phát sinh để tránh tranh cãi:\n
<strong>Phát sinh CHẤP NHẬN ĐƯỢC (Hợp lý):</strong>
<ul>
<li>Do anh/chị thay đổi thiết kế so với ban đầu (VD: muốn xây thêm ban công, đổi gỗ thường sang gỗ gõ đỏ).</li>
<li>Do khảo sát móng gặp sự cố nền đất quá yếu, cần đóng thêm cừ tràm hoặc khoan cọc sâu hơn dự kiến (phải có biên bản xác nhận trước khi làm).</li>
</ul>\n
<strong>Phát sinh TỪ CHỐI THANH TOÁN (Không hợp lý):</strong>
<ul>
<li>Nhà thầu bóc tách khối lượng bị thiếu lúc làm dự toán ban đầu, giờ đòi thêm tiền thép, tiền xi măng. (Lỗi của nhà thầu).</li>
<li>Nhà thầu kêu "cái này thi công khó quá" nên đòi thêm tiền nhân công cục bộ. Dứt khoát không trả.</li>
</ul>\n
<div class="highlight-box">📌 <strong>Khắc cốt ghi tâm:</strong> Mọi phát sinh (dù 100 ngàn) cũng phải được báo giá trước bằng văn bản, Chủ nhà ký duyệt đồng ý thì mới được phép thi công. Thi công xong mới báo giá thì quyết không trả!</div>`
      }
    ]
  },

  "tieu-chuan": {
    icon: "📐",
    title: "Tiêu chuẩn thi công",
    description: "Các chuẩn mực xây, tô, giám sát kỹ thuật",
    keywords: ["tiêu chuẩn", "kiểm tra", "kỹ thuật", "chất lượng", "bê tông", "móng", "xây tường", "chống thấm", "nghiệm thu", "cọc", "điện nước", "mep", "giám sát"],
    questions: [
      {
        q: "Những giai đoạn nào chủ nhà BẮT BUỘC phải có mặt tại công trình?",
        keywords: ["có mặt", "đến xem", "phải đến", "quan trọng", "giai đoạn", "nghiệm thu"],
        a: `Dạ, dù anh/chị có thuê Giám sát nhưng tuyệt đối không được giao khoán trắng. Có 5 mốc quan trọng nhất BẮT BUỘC phải đích thân có mặt kiểm tra:\n
<strong>1. Đo đạc ranh giới & xác định cốt nền:</strong> Trực tiếp có mặt cùng địa chính và hàng xóm để tránh lấn ranh. Chốt cao độ nền nhà so với mặt đường để tránh ngập nước.
<strong>2. Ép cọc / Khoan nhồi:</strong> Phải đứng xem ép cọc để đảm bảo cọc khoan đủ sâu, máy ép đủ đối trọng. Dưới móng là khu vực "chôn tiền", sai 1 ly không thể sửa.
<strong>3. Nghiệm thu sắt thép trước TẤT CẢ các lần đổ bê tông:</strong> (Móng, Cột, Dầm, Sàn). Phải xuống đếm số lượng thép chủ, khoảng cách thép đai, và cục kê bê tông trước khi xe bồn tới.
<strong>4. Test áp lực ống nước ngầm & Test chống thấm:</strong> Phải xem tận mắt nhà vệ sinh ngâm nước 48 tiếng không thấm, và hệ thống ống nước chịu được áp lực cao không rò rỉ rồi mới cho phép lấp đất hoặc cán nền.
<strong>5. Lúc tô trát & đi điện âm:</strong> Đến xem vị trí thực tế của các ổ cắm, công tắc xem công năng có tiện vói tay hay bị đồ nội thất che khuất không.\n
<div class="highlight-box">📌 <strong>Mẹo:</strong> Tại các mốc quan trọng, hãy cầm điện thoại quay video lại toàn cảnh. Đây là bằng chứng vô giá nếu sau trát mà tường nứt hay nước rỉ.</div>`
      },
      {
        q: "Làm sao để nghiệm thu vách tường xây chuẩn, không bị nứt xé về sau?",
        keywords: ["nứt tường", "xây gạch", "gạch đinh", "lưới chống nứt", "chống thấm tường", "tô tường"],
        a: `Dạ, để tường nhà chắc chắn, chống thấm tốt và không bị nứt chân chim, anh/chị giám sát thợ làm đúng 4 tiêu chuẩn sau:\n
<strong>1. Nguyên tắc gạch đinh chốt chặn:</strong>
<ul>
<li>Tối thiểu <strong>2 lớp gạch đinh</strong> tại chân tường bao (để chống thấm ngược).</li>
<li>Nhà vệ sinh bắt buộc xây chân tường bằng <strong>1-5 lớp gạch đinh</strong>, kết hợp gờ bê tông cao 30cm để khóa nước mặn.</li>
<li>Đỉnh tường (nơi giáp với dầm/trần) phải chèn bằng gạch đinh quay ngang để khóa chặt.</li>
</ul>\n
<strong>2. Đóng lưới thép chống nứt:</strong>
<ul>
<li>TẤT CẢ các vị trí giao nhau giữa hai loại vật liệu (Giao giữa Cột bê tông và Tường gạch, giữa Dầm và Tường) ĐỀU PHẢI đóng lưới mắt cáo chống nứt trước khi tô trát vữa.</li>
<li>Các đường cắt rãnh đi từ 2 ống điện trở lên đều phải dán lưới.</li>
</ul>\n
<strong>3. Bổ trụ bê tông:</strong>
<ul>
<li>Với các bức tường kéo dài liên tục trên 4 mét, yêu cầu thợ phải đổ cấy thêm một trụ bê tông cốt thép ở giữa để giằng tường, tránh rung lắc nứt mẻ.</li>
</ul>\n
<strong>4. Bảo dưỡng tường:</strong>
<ul>
<li>Gạch phải được tưới nước trước khi xây. Xây xong và tô xong phải bảo dưỡng ẩm để vữa không bị nứt răng cưa.</li>
</ul>`
      },
      {
        q: "Lưu ý gì về hệ thống ống điện, cấp thoát nước âm tường?",
        keywords: ["điện nước", "mep", "cấp thoát nước", "ống pvc", "ppr", "ổ cắm", "thoát hôi"],
        a: `Dạ, hệ thống MEP (Điện, Nước) là mạch máu của ngôi nhà. Sai móng hoặc sai MEP đều "đau đớn" như nhau vì phải đục nát nhà ra để sửa. Anh/chị cần bắt thợ tuân thủ:\n
<strong>1. Hệ thống Nước:</strong>
<ul>
<li>Bắt buộc sử dụng con thỏ (P-Trap/U-Trap) chống hôi cho Lavabo, Hố ga, và lỗ thoát sàn nhà vệ sinh. Nếu nhà có mùi hôi như cống, 99% là thiếu con thỏ ở ống thoát D90.</li>
<li>Phân loại ống: Ống thoát bồn cầu bắt buộc đi trục riêng (D114). Dùng ống PPR cấp nước. Thử áp suất 2-3 tiếng trước khi trát tường.</li>
</ul>\n
<strong>2. Hệ thống Điện:</strong>
<ul>
<li>Sử dụng tiết diện dây chuẩn: Tối thiểu 1.5mm cho chiếu sáng; 2.5mm cho ổ cắm; 4mm cho các đường trục dọc. Thiết bị vệ sinh như Máy Nước Nóng bắt buộc có dây nối tiếp địa chống giật (D16 mạ đồng cắm sâu mặt đất).</li>
<li>Phải có ổ cắm chờ cho các tính năng hiện đại ở vị trí hẹp: Ở gầm bàn bếp (cho khoang rác/máy nước), khe rèm (rèm tự động), bệ xí (bàn cầu thông minh).</li>
<li>Toàn bộ dây âm tường phải nằm gọn trong ống gen cứng (ruột gà chỉ dùng trên trần thạch cao).</li>
</ul>`
      }
    ]
  },

  "phap-ly": {
    icon: "⚖️",
    title: "Pháp lý & Thủ tục",
    description: "Giấy phép xây dựng, hoàn công nhà",
    keywords: ["pháp lý", "giấy phép", "sổ hồng", "sổ đỏ", "thủ tục", "quản lý đô thị", "chỉ giới", "mật độ", "thẩm mỹ", "ban công"],
    questions: [
      {
        q: "Khi kiểm tra hồ sơ bản vẽ xin phép, cần lưu ý kiểm tra những thông số pháp lý nào?",
        keywords: ["bản vẽ xin phép", "chỉ giới", "khoảng lùi", "thông số"],
        a: `Dạ, khi nhận bản vẽ thiết kế từ phía kiến trúc sư hoặc dịch vụ xin phép, anh/chị cần rà soát lại ngay những chỉ số pháp lý "tử huyệt" này để tránh bị chính quyền đình chỉ lúc thi công:\n
<strong>1. Chỉ giới xây dựng & Khoảng lùi:</strong>
<ul>
<li>Nhà đã chừa đủ khoảng lùi sân trước/sân sau theo cập nhật quy hoạch của Quận chưa? (Ví dụ: lô giới đường 10m phải lùi 2m).</li>
<li>Ban công vươn ra khỏi mặt tiền tối đa bao nhiêu mét? (Tùy lộ giới đường, dao động 0m, 0.9m, 1.2m hoặc 1.4m). Và tuyệt đối ban công vươn ra không được làm buồng ở.</li>
</ul>\n
<strong>2. Chiều cao & Mật độ xây dựng:</strong>
<ul>
<li>Cote 0.0 (chiều cao tầng trệt) có phù hợp với vỉa hè hiện trạng không? Tổng chiều cao ngôi nhà có vượt quy định trần của khu vực không?</li>
<li>Giếng trời có chừa đúng phần trăm mật độ xây dựng mà quy định bắt buộc phải bỏ trống không?</li>
</ul>\n
<div class="highlight-box">⚠️ <strong>Lời khuyên:</strong> Hãy yêu cầu Kiến trúc sư cầm bản vẽ hiện trạng, áp vào Sổ Hồng để đối chiếu với luật đất đai tại phường/chi nhánh văn phòng đăng ký đất đai trước khi ra bản vẽ chốt.</div>`
      }
    ]
  },

  "thac-mac": {
    icon: "❓",
    title: "Giải đáp thắc mắc",
    description: "Giải đáp phát sinh thực tế khi thi công",
    keywords: ["thắc mắc", "hỏi thêm", "giải đáp", "hoàn thiện", "vệ sinh", "chống thấm", "lát gạch", "động thổ", "nhập trạch", "phong thủy", "cúng"],
    questions: [
      {
        q: "Công tác bóc ranh, ngoại giao hàng xóm nên thực hiện thế nào?",
        keywords: ["hàng xóm", "biên bản", "xính xích", "ngoại giao", "tranh chấp", "ranh nhà"],
        a: `Dạ, việc "ngoại giao hàng xóm" là tối quan trọng ở giai đoạn đầu để sau này công việc hanh thông:\n
<strong>1. Hình ảnh lưu vết hiện trạng:</strong>
<ul>
<li>Anh/chị hãy nhờ nhà thầu và Kỹ sư chụp ảnh cận cảnh, quay video bức tường, tình trạng nứt/thấm (nếu có) của các nhà giáp ranh trước khi ép cọc, đào móng.</li>
<li>Nên lập Biên bản hoặc có một tờ đối chiếu trình tổ trưởng dân phố và đưa hàng xóm ký xác nhận. Việc này để phong tỏa rủi ro họ "bắt đền" các vết nứt nhà họ vốn đã có sẵn từ trước.</li>
</ul>\n
<strong>2. Quà cáp nhỏ ngoại giao:</strong>
<ul>
<li>Tiến hành thông báo, gửi giỏ trái cây nhờ hàng xóm thông cảm vì tiếng ồn, xe cộ, bụi bặm trong thời gian ép cọc.</li>
<li>Cũng thiết lập một kênh liên lạc mượt mà với nhà bên cạnh để nếu có vật tư rớt sang, họ báo cho mình thay vì gọi chính quyền.</li>
</ul>`
      },
      {
        q: "Nghi lễ cúng Động thổ và cúng Nhập trạch nên chuẩn bị gì?",
        keywords: ["động thổ", "nhập trạch", "cúng", "phong thủy", "tâm linh", "mượn tuổi", "nghi lễ"],
        a: `Dạ, nếu anh/chị lưu tâm về mặt tâm linh, đây là hướng dẫn cơ bản cho hai nghi lễ quan trọng của ngôi nhà:\n
<strong>1. Lễ Cúng Động Thổ (Bắt đầu xây):</strong>
<ul>
<li>Ngày giờ: Nên tham khảo chuyên gia phong thủy, chọn ngày Hoàng Đạo sinh khí, tránh Can chi tứ hành xung.</li>
<li>Trường hợp mượn tuổi: Cần chuẩn bị "Giấy bán nhà tượng trưng" giá 99.000đ. Người được mượn tuổi sẽ là người khấn vái và dùng cuốc bổ 5-7 nhát vào viên gạch móng đầu tiên. Anh/chị (chủ nhà thật) phải lánh đi chỗ khác cách xa tối thiểu 50 mét.</li>
</ul>\n
<strong>2. Lễ Cúng Nhập Trạch (Về nhà mới):</strong>
<ul>
<li>Là nghi lễ "đăng ký hộ khẩu" với Thành hoàng, Thần tài Thổ địa rước vong linh về nhà mới an vị.</li>
<li>Cần chuẩn bị bếp gas mini bật lửa sưởi ấm, đun siêu nước cho nó sùng sục trào sinh khí. Vợ chồng mang theo chiếu đang nằm, và đi các bước nhẹ nhàng vào nhà sáng sủa, bật quạt thổi khí thông suốt.</li>
<li>Không dùng chổi cũ sweep nhà mới. Mọi thứ nên mua mới tinh tươm để đón tài lộc anh/chị nhé.</li>
</ul>`
      }
    ]
  }
};'''

    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex expression to match const TOPICS = { ... };
    pattern = re.compile(r'const TOPICS = \{[\s\S]*?\n};\n')
    
    if pattern.search(content):
        # We append a trailing newline correctly
        new_content = pattern.sub(new_topics + '\n', content)
        with open('app.js', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Replaced TOPICS successfully.")
    else:
        print("Could not find TOPICS block.")
        
if __name__ == '__main__':
    main()
