/* ========================================
   APP.JS — Chatbot "Trợ Lý Xây Nhà" (RAG Edition)
   Khóa học Xây Nhà Lần Đầu
   ======================================== */

// =============================================
// GLOBAL STATE & CONFIG
// =============================================
const BOT_NAME = "Trợ Lý Xây Nhà";
const CONFIG_API_KEY = ""; // <--- CHƯA CÀI ĐẶT API KEY
let knowledgeBase = [];
let geminiApiKey = CONFIG_API_KEY;
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
      "Hợp đồng thi công cần có những điều khoản phạt nào?",
      "Thanh toán và bảo hành quy định thế nào cho an toàn?"
    ]
  },
  "bao-gia": { 
    icon: "💰", title: "Báo giá thi công", description: "Nhận biết báo giá ảo, bóc tách dư toán",
    questions: [
      "Cách đọc và so sánh các báo giá xây dựng tránh bị lừa?",
      "Những chi phí phát sinh nào là hợp lý và không hợp lý?",
      "Cách bóc tách dự toán chi tiết cho nhà phố?"
    ]
  },
  "tieu-chuan": { 
    icon: "📐", title: "Tiêu chuẩn thi công", description: "Các chuẩn mực xây, tô, giám sát",
    questions: [
      "Các giai đoạn chủ nhà BẮT BUỘC phải có mặt?",
      "Cách nghiệm thu vách tường xây chuẩn, không bị nứt?",
      "Lưu ý về hệ thống ống điện, cấp thoát nước âm tường?"
    ]
  },
  "phap-ly": { 
    icon: "⚖️", title: "Pháp lý & Thủ tục", description: "Giấy phép xây dựng, hoàn công nhà",
    questions: [
      "Kiểm tra gì trong bản vẽ xin phép để tránh bị đình chỉ?",
      "Thủ tục hoàn công nhà ở cần chuẩn bị những gì?",
      "Cách xử lý khi hàng xóm khiếu nại về ranh đất?"
    ]
  },
  "thac-mac": { 
    icon: "❓", title: "Giải đáp thắc mắc", description: "Giải đáp phát sinh thực tế khi thi công",
    questions: [
      "Công tác bóc ranh, ngoại giao hàng xóm nên làm thế nào?",
      "Nghi lễ cúng Động thổ và cúng Nhập trạch chuẩn bị gì?",
      "Cách xử lý khi tường bị thấm ngược từ nhà hàng xóm?"
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
    // Images: ![alt](url)
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<div class="msg-image-container"><img src="$2" alt="$1" class="msg-image" onclick="window.open(\'$2\', \'_blank\')"></div>')
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Lists: * item
    .replace(/^\* (.*)/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n/g, '<br>');
    
  // Wrap list items
  if (html.includes('<li>')) {
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  }
  return html;
}

// =============================================
// DATA LOADING
// =============================================
async function loadKnowledgeBase() {
  try {
    const response = await fetch('knowledge_base.json');
    if (!response.ok) throw new Error("Failed to load knowledge base");
    knowledgeBase = await response.json();
    console.log("Knowledge Base loaded:", knowledgeBase.length, "chunks");
  } catch (error) {
    console.error("Error loading knowledge base:", error);
    addBotMessage("⚠️ Lỗi: Không thể tải cơ sở dữ liệu tri thức. Vui lòng kiểm tra lại file knowledge_base.json.");
  }
}

// =============================================
// SEARCH ENGINE (Simple Semantic/Keyword Search)
// =============================================
function searchRelevantChunks(query, limit = 5) {
  const normalizedQuery = query.toLowerCase();
  const searchTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 2);
  
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

    // Boost if matches source topic
    if (currentTopic && chunk.id.includes(currentTopic)) score += 5;

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

  // Chuẩn bị Context từ tài liệu
  const contextText = contextChunks.length > 0
    ? contextChunks.map(c => `[Nguồn: ${c.source}, Trang: ${c.page}]\nNội dung: ${c.content}`).join('\n\n---\n\n')
    : "Không tìm thấy quy định cụ thể trong tài liệu tri thức cho câu hỏi này.";

  // Chuẩn bị Lịch sử hội thoại để Agent có "bộ nhớ"
  const historyText = chatHistory.length > 0
    ? chatHistory.map(m => `${m.role === 'user' ? 'Khách' : 'Trợ lý'}: ${m.content}`).join('\n')
    : "Đây là câu hỏi đầu tiên của khách.";

  const prompt = `Bạn là "Trợ Lý Xây Nhà", một AI Consulting Agent chuyên nghiệp.
Nhiệm vụ của bạn là tư vấn dựa trên TRI THỨC TÀI LIỆU và NGỮ CẢNH HỘI THOẠI.

TRI THỨC TÀI LIỆU:
${contextText}

LỊCH SỬ TRÒ CHUYỆN:
${historyText}

HƯỚNG DẪN TƯ DUY (AGENTIC RULES):
1. KẾT NỐI NGỮ CẢNH: Nếu khách hỏi những câu như "Tại sao?", "Còn phần đó thì sao?", hãy nhìn vào Lịch sử trò chuyện để biết khách đang nói về vấn đề gì.
2. PHONG CÁCH TƯ VẤN: Trả lời thân thiện ("Dạ", "Em", "Anh/Chị"). Không trả lời quá ngắn gọn kiểu máy móc, hãy giải thích lý do.
3. TRÍCH DẪN: Luôn kèm [Tên File, Trang X] nếu thông tin có trong tài liệu.
4. CHỦ ĐỘNG:
   - Nếu tài liệu không đủ thông tin, hãy nói rõ và đưa ra lời khuyên dựa trên kinh nghiệm xây dựng thực tế (nhưng nhắc khách tham khảo thêm KS/KTS).
   - Nếu câu hỏi quá chung chung, hãy ĐẶT CÂU HỎI NGƯỢC LẠI để làm rõ (VD: "Anh định xây nhà mấy tầng để em tư vấn kỹ hơn?").
5. ĐỊNH DẠNG: Sử dụng HTML (<strong>, <ul>, <li>) để trình bày đẹp mắt. KHÔNG sử dụng Markdown hình ảnh.
6. KẾT THÚC: Luôn kết thúc câu trả lời bằng 1 gợi ý hoặc câu hỏi tiếp theo để dẫn dắt khách (VD: "Anh/chị có muốn em tư vấn thêm về phần thanh toán không ạ?").

CÂU HỎI HIỆN TẠI: "${userQuery}"`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

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
          maxOutputTokens: 2048,
          temperature: 0.7
        }
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Rate limit (429) — auto retry 1 lần sau 2 giây
      if (response.status === 429 && retryCount < 1) {
        await new Promise(r => setTimeout(r, 2000));
        return askGemini(userQuery, contextChunks, retryCount + 1);
      }
      // Server error (500/503) — auto retry 1 lần
      if ((response.status >= 500) && retryCount < 1) {
        await new Promise(r => setTimeout(r, 1500));
        return askGemini(userQuery, contextChunks, retryCount + 1);
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
  clearQuickReplies();
  showTyping();
  
  // RAG Pipeline
  const relevantChunks = searchRelevantChunks(text);
  const response = await askGemini(text, relevantChunks);
  
  hideTyping();
  addBotMessage(response);
  
  // Only show citations if AI responded successfully (doesn't start with ⚠️)
  if (!response.startsWith("⚠️") && relevantChunks.length > 0 && geminiApiKey) {
    renderCitations(relevantChunks);
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

async function initChat() {
  renderSidebar();
  renderTopicButtons();
  setupChatInput();
  await loadKnowledgeBase();
  
  const firstName = userData ? userData.name.split(' ').pop() : 'bạn';
  addBotMessage(`Chào mừng <strong>${firstName}</strong> quay trở lại. Em đã sẵn sàng hỗ trợ tra cứu quy chuẩn xây dựng cho anh/chị.`);
}

document.addEventListener('DOMContentLoaded', () => {
  checkExistingUser();
});
