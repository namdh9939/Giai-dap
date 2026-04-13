/* ========================================
   APP.JS — Chatbot "Trợ Lý Xây Nhà" (RAG Edition)
   Khóa học Xây Nhà Lần Đầu
   ======================================== */

// =============================================
// GLOBAL STATE & CONFIG
// =============================================
const BOT_NAME = "Trợ Lý Xây Nhà";
let knowledgeBase = [];

// Auto-import API key from URL param ?key=xxx (1 lần, lưu localStorage, xóa khỏi URL)
(function() {
  const params = new URLSearchParams(window.location.search);
  const keyParam = params.get('key');
  if (keyParam && keyParam.startsWith('AIza')) {
    localStorage.setItem('gemini_api_key', keyParam);
    // Xóa key khỏi URL để không lộ trong history
    window.history.replaceState({}, '', window.location.pathname);
  }
})();

let geminiApiKey = localStorage.getItem('gemini_api_key') || '';
let userData = null;
let currentTopic = null;
let isProcessing = false;
let chatHistory = []; // Bộ nhớ hội thoại (Lưu 6-8 tin nhắn gần nhất)

// Predefined Topics for UI (Matching the original layout)
const UI_TOPICS = {
  "hop-dong": {
    icon: "📋", title: "Hợp đồng", description: "Kinh nghiệm chọn thầu & ký hợp đồng",
    questions: [
      "Làm sao để biết nhà thầu có uy tín và năng lực thực sự?",
      "Hợp đồng thi công cần có những điều khoản phạt nào để bảo vệ chủ nhà?",
      "Quy trình thanh toán theo tiến độ nên chia thành mấy đợt?",
      "Bảo hành công trình sau thi công quy định thế nào?"
    ]
  },
  "bao-gia": {
    icon: "💰", title: "Báo giá thi công", description: "Nhận biết báo giá ảo, bóc tách dư toán",
    questions: [
      "Cách đọc và so sánh các báo giá xây dựng tránh bị lừa?",
      "Những chi phí phát sinh nào là hợp lý và không hợp lý?",
      "Yêu cầu báo giá thi công cần liệt kê những hạng mục nào?",
      "Cách kiểm tra đơn giá vật tư (xi măng, sắt thép, gạch) có hợp lý không?"
    ]
  },
  "tieu-chuan": {
    icon: "📐", title: "Tiêu chuẩn thi công", description: "Quy chuẩn xây dựng, nghiệm thu, giám sát",
    questions: [
      "Các giai đoạn chủ nhà BẮT BUỘC phải có mặt nghiệm thu?",
      "Tiêu chuẩn nghiệm thu bê tông (thí nghiệm slump, nén mẫu) như thế nào?",
      "Cách kiểm tra cốt thép (đường kính, khoảng cách, nối buộc) đúng chuẩn?",
      "Nghiệm thu tường xây: mạch vữa, độ thẳng, chống thấm khu vệ sinh?",
      "Thử áp lực đường ống nước và kiểm tra hệ thống điện âm tường?"
    ]
  },
  "phap-ly": {
    icon: "⚖️", title: "Pháp lý & Thủ tục", description: "Giấy phép xây dựng, hoàn công nhà",
    questions: [
      "Kiểm tra gì trong bản vẽ xin phép để tránh bị đình chỉ?",
      "Thủ tục hoàn công nhà ở cần chuẩn bị những gì?",
      "Quy định về khoảng lùi, mật độ xây dựng, số tầng theo lộ giới?"
    ]
  },
  "thac-mac": {
    icon: "❓", title: "Giải đáp thắc mắc", description: "Phong thủy, ngoại giao hàng xóm, phát sinh",
    questions: [
      "Công tác bóc ranh, ngoại giao hàng xóm nên làm thế nào?",
      "Nghi lễ cúng Động thổ cần chuẩn bị những gì?",
      "Trường hợp mượn tuổi làm lễ Động thổ thì quy trình ra sao?",
      "Quy trình đổ bê tông móng, cột, sàn cần lưu ý gì?"
    ]
  }
};

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

// =============================================
// UTILS
// =============================================
function markdownToHtml(text) {
  if (!text) return "";
  let html = text
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<div class="msg-image-container"><img src="$2" alt="$1" class="msg-image" onclick="window.open(\'$2\', \'_blank\')"></div>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\* (.*)/gm, '<li>$1</li>');
    
  // Xử lý xuống dòng, nhưng bỏ qua xuống dòng liền trước/sau các thẻ ul/li để tránh tạo khoảng trắng dư
  html = html.replace(/\n(?!\s*<(li|\/ul)>)/g, '<br>');
  
  // Wrap các thẻ <li> liên tiếp bằng <ul>
  html = html.replace(/(<li>.*?<\/li>)(?=(?:<br>)?\s*<li|(?![ \S\s]*?<li>))/gs, function(match) {
        return `<ul>${match.replace(/<br>/g, '')}</ul>`;
  });
  
  return html.replace(/<\/ul><ul>/g, ''); // Gộp các ul liền kề
}

// =============================================
// DATA LOADING (5 topic-specific knowledge bases)
// =============================================
const KB_FILES = {
  'hop-dong': 'kb_hop_dong.json',
  'bao-gia': 'kb_bao_gia.json',
  'tieu-chuan': 'kb_tieu_chuan.json',
  'phap-ly': 'kb_phap_ly.json',
  'thac-mac': 'kb_thac_mac.json'
};

async function loadKnowledgeBase() {
  try {
    const allPromises = Object.values(KB_FILES).map(file =>
      fetch(file).then(r => r.ok ? r.json() : []).catch(() => [])
    );
    const results = await Promise.all(allPromises);
    knowledgeBase = results.flat();
    console.log("Knowledge Base loaded:", knowledgeBase.length, "chunks from 5 files");
  } catch (error) {
    console.error("Error loading knowledge base:", error);
  }
}

// =============================================
// SEARCH ENGINE (Keyword + Data Priority)
// =============================================
function searchRelevantChunks(query, limit = 8) {
  const normalizedQuery = query.toLowerCase();
  const searchTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 1);

  const scoredData = knowledgeBase.map(chunk => {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();

    // Core Keyword Matching
    searchTerms.forEach(term => {
      if (contentLower.includes(term)) score += 10;
    });

    // Smart Keywords Matching
    if (chunk.keywords) {
      chunk.keywords.forEach(kw => {
        if (normalizedQuery.includes(kw.toLowerCase())) score += 20;
      });
    }

    // Boost if matches current topic
    if (currentTopic && chunk.id.includes(currentTopic)) score += 15;

    // BOOST chunks có số liệu cụ thể (%, VNĐ, ngày, tháng)
    const hasData = /\d+%|\d[\d,.]+\s*(VNĐ|đồng|ngày|tháng|lần|mm|cm|m2|m²)|\bđiều\s+\d+\b/i.test(chunk.content);
    if (hasData && score > 0) score += 25;

    // BOOST chunks có cấu trúc điều khoản (Điều X, Khoản Y)
    const hasClause = /ĐIỀU\s+\d+|Khoản\s+\d+|Mục\s+\d+|Bước\s+\d+/i.test(chunk.content);
    if (hasClause && score > 0) score += 15;

    return { ...chunk, score };
  });

  return scoredData
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// =============================================
// GEMINI API INTEGRATION
// =============================================
async function askGemini(userQuery, contextChunks, retryCount = 0) {
  if (!geminiApiKey) return "Dạ, hệ thống đang bảo trì. Anh/chị vui lòng quay lại sau ít phút nhé.";

  // Chuẩn bị Context từ tài liệu — giới hạn 6000 ký tự để tránh vượt quota
  let contextText = "";
  if (contextChunks.length > 0) {
    let totalLen = 0;
    const selected = [];
    for (const c of contextChunks) {
      const entry = `[${c.source}, P${c.page}]: ${c.content}`;
      if (totalLen + entry.length > 6000) break;
      selected.push(entry);
      totalLen += entry.length;
    }
    contextText = selected.join('\n---\n');
  } else {
    contextText = "Không tìm thấy quy định cụ thể trong tài liệu tri thức cho câu hỏi này.";
  }

  // Chuẩn bị Lịch sử hội thoại để Agent có "bộ nhớ"
  const historyText = chatHistory.length > 0
    ? chatHistory.map(m => `${m.role === 'user' ? 'Khách' : 'Trợ lý'}: ${m.content}`).join('\n')
    : "Đây là câu hỏi đầu tiên của Quý khách.";

  // Xác định khóa học của user để chọn hotline phù hợp
  const userCourse = userData ? userData.course : '';
  const hotline = userCourse === 'tu-kiem-soat' ? '0981 982 029' : '0902 982 029';

  // Kiểm tra có hình ảnh trong context không
  const hasImages = contextChunks.some(c => c.images && c.images.length > 0);

  const prompt = `Bạn là "Trợ Lý Xây Nhà" — chatbot chuyên hỗ trợ học viên khóa học Xây Nhà Lần Đầu (XNLĐ) và Tự Kiểm Soát Xây Nhà (TKSXN) giải đáp thắc mắc trong quá trình xây dựng.

## Vai trò
- Bạn là trợ lý thân thiện, am hiểu kỹ thuật xây dựng dân dụng
- Trả lời dựa trên kiến thức đã được cung cấp trong TRI THỨC TÀI LIỆU
- Luôn đứng về phía quyền lợi của chủ nhà

## Nguyên tắc trả lời

1. **BẮT BUỘC TRÍCH DẪN SỐ LIỆU CỤ THỂ:**
   - ĐỌC KỸ TRI THỨC TÀI LIỆU bên dưới. Tìm mọi con số, tỷ lệ %, mức phạt VNĐ, số ngày, điều khoản cụ thể.
   - VIẾT LẠI thành câu trả lời hoàn chỉnh VỚI ĐẦY ĐỦ SỐ LIỆU cho khách đọc trực tiếp.
   - VD đúng: "Phạt chậm tiến độ: 1% giá trị HĐ/ngày, tối đa 8%. Bảo hành 12 tháng."
   - VD sai: "Nhà thầu sẽ bị phạt theo quy định trong hợp đồng."
   - KHÔNG BAO GIỜ nói "xem file X", "tham khảo tài liệu Y". Khách KHÔNG có file.
   - KHÔNG BỊA SỐ LIỆU. Chỉ dùng số liệu có trong TRI THỨC TÀI LIỆU bên dưới. Nếu tài liệu ghi "…" (chưa điền) thì nói rõ "mức cụ thể do hai bên thỏa thuận khi ký".

2. **Cấu trúc:** Dùng HTML (<strong>, <ul>, <li>) để trình bày rõ ràng. Chia thành các mục, đánh số.

3. **Giọng văn:** Xưng "em", gọi "anh/chị". Thân thiện, chuyên nghiệp.

4. **Ngoài phạm vi:** → "Câu hỏi này em cần chuyển đến đội ngũ chuyên môn. Hotline: ${hotline}"

5. **TUYỆT ĐỐI KHÔNG:** Không gửi URL/link. Không dẫn tên file/biểu mẫu. Không nói "xem thêm tại...".

6. **Kết thúc:** Luôn kết bằng 1 câu hỏi dẫn dắt tiếp.
${hasImages ? '\n7. **Hình ảnh:** Hệ thống sẽ tự động gửi hình minh họa kèm theo.' : ''}

## TRI THỨC TÀI LIỆU:
${contextText}

## LỊCH SỬ HỘI THOẠI:
${historyText}

## CÂU HỎI: "${userQuery}"`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000); 

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
        ],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.2,
          topP: 0.8
        }
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.warn(`Gemini HTTP ${response.status}:`, errBody);
      // Rate limit (429) — auto retry 1 lần sau 3 giây
      if (response.status === 429 && retryCount < 2) {
        await new Promise(r => setTimeout(r, 3000));
        return askGemini(userQuery, contextChunks, retryCount + 1);
      }
      // Server error (500/503) — auto retry 1 lần
      if ((response.status >= 500) && retryCount < 1) {
        await new Promise(r => setTimeout(r, 2000));
        return askGemini(userQuery, contextChunks, retryCount + 1);
      }
      if (response.status === 403) {
        return "Dạ, API Key đã hết hạn. Anh/chị vui lòng cập nhật key mới (nhấn nút chìa khóa bên phải).";
      }
      return "Dạ, hệ thống đang bận. Anh/chị thử hỏi lại sau ít giây nhé.";
    }

    const data = await response.json();

    // Kiểm tra lỗi API trả về trong body
    if (data.error) {
      console.warn("Gemini API error:", data.error);
      return "Dạ, hệ thống đang bận. Anh/chị thử hỏi lại sau ít giây nhé.";
    }

    // Kiểm tra candidates tồn tại và có nội dung
    if (!data.candidates || data.candidates.length === 0) {
      console.warn("Gemini: no candidates returned", data);
      return "Dạ, em chưa tìm được câu trả lời phù hợp. Anh/chị thử diễn đạt lại câu hỏi giúp em nhé.";
    }

    const candidate = data.candidates[0];

    // Kiểm tra bị chặn bởi safety filter
    if (candidate.finishReason === "SAFETY" || !candidate.content) {
      console.warn("Gemini: blocked by safety filter", candidate);
      return "Dạ, câu hỏi này em chưa thể trả lời được. Anh/chị thử hỏi cụ thể hơn về xây dựng nhé.";
    }

    // Trích xuất text an toàn
    const parts = candidate.content.parts;
    if (!parts || parts.length === 0 || !parts[0].text) {
      return "Dạ, em chưa tìm được câu trả lời phù hợp. Anh/chị thử hỏi lại nhé.";
    }

    const botResponse = parts[0].text;

    // CẬP NHẬT BỘ NHỚ (GIỮ 8 TIN NHẮN GẦN NHẤT)
    chatHistory.push({ role: 'user', content: userQuery });
    chatHistory.push({ role: 'model', content: botResponse });
    if (chatHistory.length > 8) chatHistory.splice(0, 2);

    return botResponse;

  } catch (error) {
    clearTimeout(timeoutId);

    // Timeout / mất mạng — retry 1 lần
    if (error.name === 'AbortError') {
      if (retryCount < 1) return askGemini(userQuery, contextChunks, retryCount + 1);
      return "Dạ, server đang phản hồi chậm. Anh/chị thử lại sau ít giây nhé.";
    }

    // Lỗi mạng — retry 1 lần
    if (retryCount < 1) {
      await new Promise(r => setTimeout(r, 1000));
      return askGemini(userQuery, contextChunks, retryCount + 1);
    }

    return "Dạ, kết nối mạng đang không ổn định. Anh/chị kiểm tra WiFi rồi thử lại nhé.";
  }
}

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
  }
});

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  // Simplified validation for brevity
  if (!inputName.value || !inputPhone.value || !inputCourse.value) {
    alert("Vui lòng nhập đầy đủ thông tin.");
    return;
  }
  
  userData = {
    name: inputName.value.trim(),
    phone: inputPhone.value.trim(),
    course: inputCourse.value,
    courseName: getCourseName(inputCourse.value),
    className: inputClass.value.trim(),
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
    userData = JSON.parse(saved);
    registerScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
    initChat();
    return true;
  }
  return false;
}

// =============================================
// CHAT LOGIC
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

async function handleSendMessage(predefinedQuery = null) {
  const text = predefinedQuery || chatInput.value.trim();
  if (!text || isProcessing) return;

  isProcessing = true;
  chatInput.value = '';

  addUserMessage(text);
  closeSuggestions();
  clearQuickReplies();
  showTyping();
  
  // RAG Pipeline
  const relevantChunks = searchRelevantChunks(text);
  const response = await askGemini(text, relevantChunks);
  
  hideTyping();
  addBotMessage(response);

  // Only show citations if AI responded successfully (not an error message)
  const isErrorResponse = response.startsWith("Dạ, hệ thống") || response.startsWith("Dạ, server") || response.startsWith("Dạ, kết nối") || response.startsWith("Dạ, câu hỏi này");
  if (!isErrorResponse && relevantChunks.length > 0 && geminiApiKey) {
    // Gửi kèm hình ảnh minh họa nếu topic là tiêu chuẩn thi công
    if (currentTopic === 'tieu-chuan' || text.match(/tiêu chuẩn|nghiệm thu|bê tông|cốt thép|tường xây|ống nước|điện/i)) {
      renderRelatedImages(relevantChunks);
    }
  }

  // After AI answers, show "Back to Topics" if we were in a topic
  if (currentTopic) {
    renderQuestionButtons(currentTopic);
  } else {
    renderTopicButtons();
  }
  isProcessing = false;
}

function renderCitations(chunks) {
  // Loại bỏ trùng lặp nguồn
  const uniqueSources = [];
  const seen = new Set();
  chunks.forEach(c => {
    const key = `${c.source}_${c.page}`;
    if (!seen.has(key)) { seen.add(key); uniqueSources.push(c); }
  });

  const citationHtml = `
    <div class="citation">
      <div class="citation-header">📚 Nguồn tham khảo</div>
      ${uniqueSources.map(c => `
        <div class="citation-item">
          <span class="citation-icon">📄</span>
          <div class="citation-content">
            <span class="citation-source">${c.source}</span>
            <span class="citation-page">Trang ${c.page}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  addBotMessage(citationHtml, false);
}

function renderRelatedImages(chunks) {
  // Collect unique images from relevant chunks (max 4 images)
  const images = [];
  const seen = new Set();
  for (const chunk of chunks) {
    if (chunk.images && chunk.images.length > 0) {
      for (const imgPath of chunk.images) {
        if (!seen.has(imgPath) && images.length < 4) {
          seen.add(imgPath);
          images.push({ path: imgPath, source: chunk.source, page: chunk.page });
        }
      }
    }
  }
  if (images.length === 0) return;

  const imagesHtml = `
    <div class="msg-images-grid">
      <div class="msg-images-label">Hình ảnh minh họa từ tài liệu:</div>
      ${images.map(img => `
        <div class="msg-image-item">
          <img src="${img.path}" alt="Trang ${img.page}" class="msg-image" onclick="window.open('${img.path}', '_blank')" loading="lazy">
          <span class="msg-image-caption">${img.source} — Trang ${img.page}</span>
        </div>
      `).join('')}
    </div>
  `;
  addBotMessage(imagesHtml, false);
}

function addBotMessage(content, showAvatar = true) {
  const row = document.createElement('div');
  row.className = 'message-row bot';
  const avatarHtml = showAvatar ? '<div class="msg-avatar">🏠</div>' : '<div class="msg-avatar" style="visibility:hidden">🏠</div>';

  row.innerHTML = `
    ${avatarHtml}
    <div>
      <div class="message-bubble">${markdownToHtml(content)}</div>
      <div class="message-time">${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  `;
  chatMessages.appendChild(row);
  scrollToBottom();
}

function addUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'message-row user';
  row.innerHTML = `
    <div>
      <div class="message-bubble">${text}</div>
      <div class="message-time">${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  `;
  chatMessages.appendChild(row);
  scrollToBottom();
}

function showTyping() { typingIndicator.classList.remove('hidden'); scrollToBottom(); }
function hideTyping() { typingIndicator.classList.add('hidden'); }
function clearQuickReplies() { quickReplies.innerHTML = ''; }
function scrollToBottom() { chatMessages.scrollTop = chatMessages.scrollHeight; }

// =============================================
// FAB TOGGLE BUTTONS
// =============================================
let suggestionsOpen = false;
let docsOpen = false;

function toggleSuggestions() {
  suggestionsOpen = !suggestionsOpen;
  const fabBtn = document.getElementById('fab-suggestions');
  if (suggestionsOpen) {
    quickReplies.classList.remove('hidden');
    fabBtn.classList.add('active');
    // Đóng docs nếu đang mở
    if (docsOpen) toggleDocs();
  } else {
    quickReplies.classList.add('hidden');
    fabBtn.classList.remove('active');
  }
}

function toggleDocs() {
  docsOpen = !docsOpen;
  const popup = document.getElementById('docs-popup');
  const fabBtn = document.getElementById('fab-docs');
  if (docsOpen) {
    popup.classList.remove('hidden');
    fabBtn.classList.add('active');
    // Đóng suggestions nếu đang mở
    if (suggestionsOpen) toggleSuggestions();
  } else {
    popup.classList.add('hidden');
    fabBtn.classList.remove('active');
  }
}

function closeSuggestions() {
  if (suggestionsOpen) {
    suggestionsOpen = false;
    quickReplies.classList.add('hidden');
    const fabBtn = document.getElementById('fab-suggestions');
    if (fabBtn) fabBtn.classList.remove('active');
  }
}

function renderTopicButtons() {
  clearQuickReplies();
  currentTopic = null; // Reset current topic when at main menu
  Object.keys(UI_TOPICS).forEach(key => {
    const topic = UI_TOPICS[key];
    const btn = document.createElement('button');
    btn.className = 'topic-btn';
    btn.innerHTML = `
      <span class="btn-icon">${topic.icon}</span>
      <span class="btn-content">
        <span class="btn-title">${topic.title}</span>
        <span class="btn-desc">${topic.description}</span>
      </span>
    `;
    btn.addEventListener('click', () => {
      selectTopic(key);
    });
    quickReplies.appendChild(btn);
  });
}

function selectTopic(topicKey) {
  currentTopic = topicKey;
  const topic = UI_TOPICS[topicKey];
  addBotMessage(`Dạ, em đã chọn chủ đề <strong>${topic.title}</strong>. Anh/chị muốn hỏi về nội dung nào dưới đây hay có câu hỏi riêng không ạ?`);
  renderQuestionButtons(topicKey);
}

function renderQuestionButtons(topicKey) {
  clearQuickReplies();
  const topic = UI_TOPICS[topicKey];
  
  // Show suggested questions
  topic.questions.forEach(q => {
    const btn = document.createElement('button');
    btn.className = 'question-btn';
    btn.textContent = q;
    btn.addEventListener('click', () => handleSendMessage(q));
    quickReplies.appendChild(btn);
  });

  // Add "Back to Main Topics" button
  const backBtn = document.createElement('button');
  backBtn.className = 'question-btn back-btn';
  backBtn.innerHTML = `⬅️ Quay lại chủ đề chính`;
  backBtn.addEventListener('click', renderTopicButtons);
  quickReplies.appendChild(backBtn);
}

// Danh sách tài liệu tham khảo (từ thư mục XÂY NHÀ LẦN ĐẦU.COM)
const REFERENCE_DOCS = [
  { icon: "📋", group: "Checklist", items: [
    "Checklist kiểm tra công việc xây nhà",
    "Các giai đoạn CĐT cần có mặt kịp thời",
    "Kiểm tra hồ sơ thiết kế",
    "Đánh giá & Lựa chọn nhà thầu Xây Dựng",
    "Đánh giá & Lựa chọn Thiết Kế"
  ]},
  { icon: "📝", group: "Hợp đồng", items: [
    "HĐ thi công phần thô & NCHT",
    "HĐ thiết kế",
    "HĐ thiết kế nội thất",
    "HĐ cung cấp vật tư",
    "HĐ cung ứng vật tư hoàn thiện",
    "HĐ nhà thầu phụ 2025",
    "Phụ lục HĐ đá hoa cương",
    "Phụ lục HĐ sắt",
    "Biên bản làm việc"
  ]},
  { icon: "💰", group: "Tiền & Dự toán", items: [
    "Dự toán NCM",
    "Dự trù ngân sách xây nhà",
    "Phụ lục HĐ (báo giá → phụ lục)"
  ]},
  { icon: "📿", group: "Phong thủy", items: [
    "Cúng động thổ",
    "Cúng động thổ (mượn tuổi)",
    "Cúng nhập trạch"
  ]},
  { icon: "🛒", group: "Khác", items: [
    "Nhóm mua vật tư"
  ]}
];

function renderSidebar() {
  if (!sidebarTopics) return;
  sidebarTopics.innerHTML = '';
  Object.keys(UI_TOPICS).forEach(key => {
    const topic = UI_TOPICS[key];
    const btn = document.createElement('button');
    btn.className = 'sidebar-topic-btn';
    btn.innerHTML = `
      <span class="stb-icon">${topic.icon}</span>
      <span class="stb-title">${topic.title}</span>
    `;
    btn.addEventListener('click', () => {
      selectTopic(key);
    });
    sidebarTopics.appendChild(btn);
  });
}

function renderDocsPopup() {
  const docsContainer = document.getElementById('docs-popup-list');
  if (!docsContainer) return;
  docsContainer.innerHTML = '';
  REFERENCE_DOCS.forEach(doc => {
    // Group header
    const groupEl = document.createElement('div');
    groupEl.className = 'docs-popup-group';
    groupEl.innerHTML = `<div class="docs-popup-group-title">${doc.icon} ${doc.group}</div>`;
    // Items
    doc.items.forEach(name => {
      const item = document.createElement('div');
      item.className = 'docs-popup-item';
      item.innerHTML = `<span class="docs-popup-item-name" title="${name}">${name}</span>`;
      groupEl.appendChild(item);
    });
    docsContainer.appendChild(groupEl);
  });
}

function setupFabButtons() {
  const fabSuggestions = document.getElementById('fab-suggestions');
  const fabDocs = document.getElementById('fab-docs');
  const fabApikey = document.getElementById('fab-apikey');
  if (fabSuggestions) fabSuggestions.addEventListener('click', toggleSuggestions);
  if (fabDocs) fabDocs.addEventListener('click', toggleDocs);
  if (fabApikey) fabApikey.addEventListener('click', () => {
    const modal = document.getElementById('apikey-modal');
    if (modal) modal.classList.remove('hidden');
  });
}

// =============================================
// API KEY MODAL
// =============================================
function setupApiKeyModal() {
  const btnOpen = document.getElementById('btn-apikey');
  const modal = document.getElementById('apikey-modal');
  const input = document.getElementById('apikey-input');
  const btnSave = document.getElementById('apikey-save');
  const btnClose = document.getElementById('apikey-close');
  const status = document.getElementById('apikey-status');

  if (!btnOpen || !modal) return;

  // Hiện key hiện tại (nếu có)
  if (geminiApiKey) {
    input.value = geminiApiKey;
  }

  btnOpen.addEventListener('click', () => {
    modal.classList.remove('hidden');
    updateApiKeyButton();
  });

  btnClose.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  btnSave.addEventListener('click', async () => {
    const key = input.value.trim();
    if (!key) {
      status.textContent = 'Vui lòng nhập API Key.';
      status.className = 'apikey-status error';
      return;
    }

    status.textContent = 'Đang kiểm tra...';
    status.className = 'apikey-status checking';

    // Test key
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'test' }] }], generationConfig: { maxOutputTokens: 5 } })
      });
      const data = await res.json();

      if (data.error) {
        status.textContent = 'Key không hợp lệ: ' + data.error.message;
        status.className = 'apikey-status error';
        return;
      }

      // Key OK — save
      geminiApiKey = key;
      localStorage.setItem('gemini_api_key', key);
      status.textContent = 'Kích hoạt thành công!';
      status.className = 'apikey-status success';
      updateApiKeyButton();

      setTimeout(() => modal.classList.add('hidden'), 1000);
    } catch (err) {
      status.textContent = 'Lỗi kết nối. Thử lại.';
      status.className = 'apikey-status error';
    }
  });
}

function updateApiKeyButton() {
  // Update sidebar button
  const btn = document.getElementById('btn-apikey');
  if (btn) {
    btn.classList.toggle('active', !!geminiApiKey);
    btn.title = geminiApiKey ? 'API Key đã kích hoạt' : 'Chưa có API Key';
  }
  // Update FAB button
  const fab = document.getElementById('fab-apikey');
  if (fab) {
    fab.classList.toggle('active', !!geminiApiKey);
    fab.title = geminiApiKey ? 'API Key đã kích hoạt' : 'Nhấn để cài API Key';
  }
}

async function initChat() {
  renderSidebar();
  renderDocsPopup();
  setupFabButtons();
  setupApiKeyModal();
  updateApiKeyButton();
  renderTopicButtons();
  setupChatInput();
  await loadKnowledgeBase();

  const firstName = userData ? userData.name.split(' ').pop() : 'bạn';

  if (!geminiApiKey) {
    addBotMessage(`Chào <strong>${firstName}</strong>! Để em có thể tư vấn, anh/chị cần cài đặt <strong>API Key</strong> trước. Nhấn nút ⚙️ <strong>API Key</strong> ở sidebar bên trái nhé.`);
  } else {
    addBotMessage(`Chào mừng <strong>${firstName}</strong> quay trở lại. Em đã sẵn sàng hỗ trợ anh/chị.`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkExistingUser();
});
