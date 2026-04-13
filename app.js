/* ========================================
   APP.JS — Chatbot "Trợ Lý Xây Nhà" (RAG Edition)
   Khóa học Xây Nhà Lần Đầu
   ======================================== */

// =============================================
// GLOBAL STATE & CONFIG
// =============================================
const BOT_NAME = "Trợ Lý Xây Nhà";

// PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}
let knowledgeBase = [];

// Auto-import API keys from URL params (1 lần, lưu localStorage, xóa khỏi URL)
(function() {
  const params = new URLSearchParams(window.location.search);
  const groqKey = params.get('groq');
  const geminiKey = params.get('key');
  if (groqKey) localStorage.setItem('groq_api_key', groqKey);
  if (geminiKey && geminiKey.startsWith('AIza')) localStorage.setItem('gemini_api_key', geminiKey);
  if (groqKey || geminiKey) window.history.replaceState({}, '', window.location.pathname);
})();

let groqApiKey = localStorage.getItem('groq_api_key') || '';
let geminiApiKey = localStorage.getItem('gemini_api_key') || '';
let userData = null;
let currentTopic = null;
let isProcessing = false;
let chatHistory = []; // Bộ nhớ hội thoại (Lưu 6-8 tin nhắn gần nhất)

// Predefined Topics for UI (Matching the original layout)
const UI_TOPICS = {
  "hop-dong": {
    icon: "📋", title: "Hợp đồng", description: "Chọn thầu, ký hợp đồng, thanh toán",
    questions: [
      "Hợp đồng thi công phần thô gồm những điều khoản chính nào?",
      "Điều khoản phạt vi phạm hợp đồng quy định mức phạt bao nhiêu?",
      "Tiến độ thanh toán theo hợp đồng chia thành mấy đợt?",
      "Quy định bảo hành công trình sau khi hoàn thành?",
      "Hợp đồng cung cấp vật tư cần lưu ý những gì?"
    ]
  },
  "bao-gia": {
    icon: "💰", title: "Báo giá thi công", description: "Dự toán, ngân sách, đơn giá",
    questions: [
      "Khai toán ngân sách xây nhà gồm những hạng mục nào?",
      "Báo giá thi công phần thô tính theo diện tích như thế nào?",
      "Dự toán vật tư hoàn thiện gồm những khoản gì?",
      "Nhóm mua vật tư chung có những loại nào?"
    ]
  },
  "tieu-chuan": {
    icon: "📐", title: "Tiêu chuẩn thi công", description: "Nghiệm thu, kiểm tra, giám sát",
    questions: [
      "Chủ nhà cần có mặt tại công trình ở những giai đoạn nào?",
      "Kiểm tra an toàn lao động tại công trình cần những gì?",
      "Kiểm tra vật tư sắt thép trước khi thi công ra sao?",
      "Nghiệm thu tường xây cần kiểm tra những tiêu chí nào?",
      "Kiểm tra hệ thống ống cấp thoát nước trước khi đổ bê tông?"
    ]
  },
  "phap-ly": {
    icon: "⚖️", title: "Pháp lý & Thủ tục", description: "Giấy phép, hoàn công",
    questions: [
      "Thủ tục xin giấy phép xây dựng cần chuẩn bị gì?",
      "Quy định khoảng lùi, mật độ, số tầng theo lộ giới?",
      "Hoàn công nhà ở cần những thủ tục gì?"
    ]
  },
  "thac-mac": {
    icon: "❓", title: "Giải đáp thắc mắc", description: "Phong thủy, nghi lễ, phát sinh",
    questions: [
      "Cúng động thổ cho người được tuổi chuẩn bị những gì?",
      "Cúng động thổ mượn tuổi quy trình ra sao?",
      "Bàn giao mặt bằng và ngoại giao hàng xóm nên làm thế nào?"
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

let fileUrlMap = {}; // source name -> { file, url }

async function loadKnowledgeBase() {
  try {
    const [kbResults, urlMap] = await Promise.all([
      Promise.all(Object.values(KB_FILES).map(file =>
        fetch(file).then(r => r.ok ? r.json() : []).catch(() => [])
      )),
      fetch('file_urls.json').then(r => r.ok ? r.json() : {}).catch(() => ({}))
    ]);
    knowledgeBase = kbResults.flat();
    fileUrlMap = urlMap;
    console.log("KB loaded:", knowledgeBase.length, "chunks. File URLs:", Object.keys(fileUrlMap).length);
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

  // CHỈ tìm trong KB đúng chủ đề đang chọn
  const topicFilter = currentTopic || '';
  const filtered = topicFilter
    ? knowledgeBase.filter(c => c.id.includes(topicFilter))
    : knowledgeBase;

  const scoredData = filtered.map(chunk => {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();

    searchTerms.forEach(term => {
      if (contentLower.includes(term)) score += 10;
    });

    if (chunk.keywords) {
      chunk.keywords.forEach(kw => {
        if (normalizedQuery.includes(kw.toLowerCase())) score += 20;
      });
    }

    // BOOST chunks có số liệu cụ thể
    const hasData = /\d+%|\d[\d,.]+\s*(VNĐ|đồng|ngày|tháng|lần|mm|cm|m2|m²)|\bđiều\s+\d+\b/i.test(chunk.content);
    if (hasData && score > 0) score += 25;

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
// AI ENGINE — Groq (chính) + Gemini (dự phòng)
// =============================================
function buildPromptAndContext(userQuery, contextChunks) {
  // Context — giới hạn 6000 ký tự
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
    contextText = "Không tìm thấy quy định cụ thể trong tài liệu tri thức.";
  }

  const historyText = chatHistory.length > 0
    ? chatHistory.map(m => `${m.role === 'user' ? 'Khách' : 'Trợ lý'}: ${m.content}`).join('\n')
    : "";

  const userCourse = userData ? userData.course : '';
  const hotline = userCourse === 'tu-kiem-soat' ? '0981 982 029' : '0902 982 029';
  const hasImages = contextChunks.some(c => c.images && c.images.length > 0);

  // Tên chủ đề hiện tại
  const topicName = currentTopic && UI_TOPICS[currentTopic] ? UI_TOPICS[currentTopic].title : 'chung';

  const systemPrompt = `Bạn là CHUYÊN GIA TƯ VẤN XÂY DỰNG, đang tư vấn trực tiếp cho CHỦ ĐẦU TƯ (người bỏ tiền xây nhà).

CHỦ ĐỀ: ${topicName}
→ CHỈ trả lời trong phạm vi "${topicName}". Câu hỏi chủ đề khác → nhắc chuyển chủ đề.
→ Câu hỏi NGOÀI lĩnh vực xây nhà → từ chối: "Em chỉ hỗ trợ các vấn đề liên quan đến xây dựng nhà ở ạ."

NGUYÊN TẮC:
1. Trả lời CỤ THỂ: đưa ra số liệu (%, VNĐ, ngày, mức phạt) trực tiếp. KHÔNG bịa. Nếu dữ liệu ghi "…" → "mức do hai bên thỏa thuận khi ký".
2. KHÔNG dẫn nguồn. KHÔNG nói "Theo Điều X", "Theo tài liệu Y", "Theo quy định Z". Trả lời trực tiếp như kiến thức của chính bạn.
3. Đứng về phía chủ đầu tư. Cảnh báo rủi ro khi cần.
4. HTML (<strong>, <ul>, <li>) trình bày rõ ràng.
5. Xưng "em", gọi "anh/chị".
6. KHÔNG gửi URL/link.
7. Pháp lý, tranh chấp → khái quát + "Hotline: ${hotline}".
8. Kết thúc bằng 1 câu hỏi dẫn dắt trong cùng chủ đề.${hasImages ? '\n9. Hệ thống gửi hình minh họa kèm theo.' : ''}`;

  const userMessage = `TRI THỨC TÀI LIỆU:\n${contextText}\n\n${historyText ? 'LỊCH SỬ:\n' + historyText + '\n\n' : ''}CÂU HỎI: "${userQuery}"`;

  return { systemPrompt, userMessage };
}

// --- GROQ API (Llama 3.3 70B — nhanh, ổn định) ---
async function callGroq(systemPrompt, userMessage) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 1024,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`Groq ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// --- GEMINI API (dự phòng) ---
async function callGemini(systemPrompt, userMessage) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt + '\n\n' + userMessage }] }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.2 }
    })
  });

  if (!response.ok) throw new Error(`Gemini ${response.status}`);

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error('Empty response');

  return data.candidates[0].content.parts[0].text;
}

// --- MAIN: Groq trước, Gemini fallback ---
async function askAI(userQuery, contextChunks) {
  if (!groqApiKey && !geminiApiKey) {
    return "Dạ, anh/chị cần cài đặt API Key trước. Nhấn nút 🔑 bên phải để nhập key nhé.";
  }

  const { systemPrompt, userMessage } = buildPromptAndContext(userQuery, contextChunks);

  // Thử Groq trước (nhanh, ổn định)
  if (groqApiKey) {
    try {
      const result = await callGroq(systemPrompt, userMessage);
      console.log('AI engine: Groq');
      chatHistory.push({ role: 'user', content: userQuery });
      chatHistory.push({ role: 'model', content: result });
      if (chatHistory.length > 8) chatHistory.splice(0, 2);
      return result;
    } catch (err) {
      console.warn('Groq failed:', err.message);
    }
  }

  // Fallback sang Gemini
  if (geminiApiKey) {
    try {
      const result = await callGemini(systemPrompt, userMessage);
      console.log('AI engine: Gemini (fallback)');
      chatHistory.push({ role: 'user', content: userQuery });
      chatHistory.push({ role: 'model', content: result });
      if (chatHistory.length > 8) chatHistory.splice(0, 2);
      return result;
    } catch (err) {
      console.warn('Gemini failed:', err.message);
    }
  }

  return "Dạ, cả hai server AI đều đang bận. Anh/chị thử lại sau 30 giây nhé.";
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
// FILE UPLOAD SYSTEM
// =============================================
let pendingFile = null; // { name, type, data, textContent, base64 }

function setupFileUpload() {
  const fileInput = document.getElementById('file-upload');
  const btnAttach = document.getElementById('btn-attach');
  const preview = document.getElementById('file-preview');
  const previewName = document.getElementById('file-preview-name');
  const previewIcon = document.getElementById('file-preview-icon');
  const previewRemove = document.getElementById('file-preview-remove');

  btnAttach.addEventListener('click', () => fileInput.click());

  previewRemove.addEventListener('click', () => {
    pendingFile = null;
    fileInput.value = '';
    preview.classList.add('hidden');
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      addBotMessage('Dạ, file quá lớn (tối đa 10MB). Anh/chị chọn file nhỏ hơn nhé.');
      fileInput.value = '';
      return;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    const iconMap = { pdf: '📄', xlsx: '📊', xls: '📊', docx: '📝', doc: '📝', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️' };
    const icon = iconMap[ext] || '📎';
    const isImage = file.type.startsWith('image/');

    previewIcon.textContent = icon;
    previewName.textContent = file.name;
    preview.classList.remove('hidden');

    pendingFile = { name: file.name, type: ext, data: file, textContent: null, base64: null };

    try {
      if (isImage) {
        // Đọc ảnh thành base64 để gửi Gemini Vision
        const reader = new FileReader();
        reader.onload = () => { pendingFile.base64 = reader.result.split(',')[1]; };
        reader.readAsDataURL(file);
      } else if (ext === 'pdf') {
        // Trích xuất text từ PDF
        const arrayBuf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
        let text = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
        pendingFile.textContent = text.slice(0, 8000);
      } else if (ext === 'xlsx' || ext === 'xls') {
        // Trích xuất text từ Excel
        const arrayBuf = await file.arrayBuffer();
        const wb = XLSX.read(arrayBuf, { type: 'array' });
        let text = '';
        wb.SheetNames.forEach(name => {
          const ws = wb.Sheets[name];
          text += `[${name}]\n` + XLSX.utils.sheet_to_csv(ws) + '\n';
        });
        pendingFile.textContent = text.slice(0, 8000);
      } else if (ext === 'docx' || ext === 'doc') {
        // Trích xuất text từ Word
        const arrayBuf = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuf });
        pendingFile.textContent = result.value.slice(0, 8000);
      }
    } catch (err) {
      console.warn('File parse error:', err);
      pendingFile.textContent = `[Không thể đọc file ${file.name}]`;
    }
  });
}

// Gọi Gemini Vision API cho ảnh
async function analyzeImageWithGemini(base64Data, mimeType, userQuery) {
  if (!geminiApiKey) return null;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `Bạn là chuyên gia xây dựng. Phân tích hình ảnh này và trả lời câu hỏi của chủ đầu tư. Trả lời bằng tiếng Việt, dùng HTML (<strong>, <ul>, <li>). Xưng "em", gọi "anh/chị".\n\nCâu hỏi: ${userQuery || 'Phân tích hình ảnh này giúp em'}` },
            { inlineData: { mimeType: mimeType, data: base64Data } }
          ]
        }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.3 }
      })
    });
    const data = await res.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
  } catch (err) {
    console.warn('Gemini Vision error:', err);
  }
  return null;
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
  const hasFile = !!pendingFile;

  if (!text && !hasFile) return;
  if (isProcessing) return;

  // Bắt buộc chọn chủ đề trước khi chat
  if (!currentTopic) {
    if (text) addUserMessage(text);
    addBotMessage('Dạ, anh/chị vui lòng <strong>chọn 1 chủ đề</strong> trước để em tư vấn chính xác nhé.');
    return;
  }

  isProcessing = true;
  chatInput.value = '';

  // Hiển thị tin nhắn user + file preview
  const userText = text || `[Gửi file: ${pendingFile?.name}]`;
  addUserMessage(userText);

  // Nếu có ảnh, hiện thumbnail trong chat
  if (hasFile && pendingFile.base64) {
    const imgHtml = `<img src="data:image/${pendingFile.type};base64,${pendingFile.base64}" class="msg-uploaded-image" alt="${pendingFile.name}">`;
    addBotMessage(imgHtml, false);
  }
  if (hasFile && !pendingFile.base64 && pendingFile.name) {
    addUserMessage(`<span class="file-badge">📎 ${pendingFile.name}</span>`);
  }

  // Clear file preview
  const currentFile = pendingFile;
  pendingFile = null;
  document.getElementById('file-upload').value = '';
  document.getElementById('file-preview').classList.add('hidden');

  closeSuggestions();
  clearQuickReplies();
  showTyping();

  let response = '';
  let relevantChunks = [];

  try {
    if (currentFile && currentFile.base64) {
      const mimeType = `image/${currentFile.type === 'jpg' ? 'jpeg' : currentFile.type}`;
      response = await analyzeImageWithGemini(currentFile.base64, mimeType, text);
      if (!response) response = "Dạ, em không thể phân tích hình ảnh lúc này. Anh/chị thử mô tả bằng văn bản giúp em nhé.";
    } else if (currentFile && currentFile.textContent) {
      relevantChunks = searchRelevantChunks(text || currentFile.name);
      const fakeChunk = { source: currentFile.name, page: 1, content: currentFile.textContent, keywords: [], images: [] };
      response = await askAI(text || `Phân tích tài liệu "${currentFile.name}"`, [fakeChunk, ...relevantChunks]);
    } else {
      relevantChunks = searchRelevantChunks(text);
      response = await askAI(text, relevantChunks);
    }
  } catch (err) {
    console.error('Chat error:', err);
    response = "Dạ, có lỗi xảy ra. Anh/chị thử hỏi lại nhé.";
  } finally {
    // LUÔN reset trạng thái dù lỗi hay không
    hideTyping();
    if (response) addBotMessage(response);

    // Link tài liệu liên quan + hình ảnh minh họa
    try {
      if (relevantChunks.length > 0) {
        renderDocLinks(relevantChunks);
        if (currentTopic === 'tieu-chuan' || (text && text.match(/tiêu chuẩn|nghiệm thu|bê tông|cốt thép|tường xây|ống nước|điện/i))) {
          renderRelatedImages(relevantChunks);
        }
      }
    } catch (e) { /* ignore */ }

    // Hiện lại nút câu hỏi gợi ý
    if (currentTopic) {
      renderQuestionButtons(currentTopic);
    } else {
      renderTopicButtons();
    }
    isProcessing = false;
  }
}

function renderDocLinks(chunks) {
  // Tìm file tài liệu liên quan từ chunks đã dùng
  const links = [];
  const seen = new Set();
  for (const chunk of chunks) {
    const source = chunk.source;
    if (seen.has(source)) continue;
    // Tìm trong fileUrlMap
    if (fileUrlMap[source]) {
      seen.add(source);
      links.push({ name: source, url: fileUrlMap[source].url, file: fileUrlMap[source].file });
    }
  }
  if (links.length === 0) return;

  const html = `
    <div class="doc-links">
      <div class="doc-links-label">📎 Tài liệu liên quan:</div>
      ${links.slice(0, 3).map(l => {
        const ext = l.file.split('.').pop().toLowerCase();
        const icon = ext === 'pdf' ? '📄' : ext === 'xlsx' || ext === 'xls' ? '📊' : ext === 'docx' ? '📝' : ext === 'jpg' || ext === 'jpeg' ? '🖼️' : '📎';
        return `<a href="${l.url}" target="_blank" class="doc-link-item" download>${icon} ${l.name}</a>`;
      }).join('')}
    </div>
  `;
  addBotMessage(html, false);
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

  // Hiện key hiện tại (ưu tiên Groq)
  if (groqApiKey) {
    input.value = groqApiKey;
  } else if (geminiApiKey) {
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

    try {
      // Detect key type: Groq (gsk_) vs Gemini (AIza)
      if (key.startsWith('gsk_')) {
        // Test Groq key
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'test' }], max_tokens: 5 })
        });
        if (!res.ok) { status.textContent = 'Groq Key không hợp lệ.'; status.className = 'apikey-status error'; return; }
        groqApiKey = key;
        localStorage.setItem('groq_api_key', key);
        status.textContent = 'Groq API — Kích hoạt thành công!';
      } else if (key.startsWith('AIza')) {
        // Test Gemini key
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'test' }] }], generationConfig: { maxOutputTokens: 5 } })
        });
        const data = await res.json();
        if (data.error) { status.textContent = 'Gemini Key lỗi: ' + data.error.message; status.className = 'apikey-status error'; return; }
        geminiApiKey = key;
        localStorage.setItem('gemini_api_key', key);
        status.textContent = 'Gemini API — Kích hoạt thành công!';
      } else {
        status.textContent = 'Key không đúng định dạng (Groq: gsk_... / Gemini: AIza...)';
        status.className = 'apikey-status error';
        return;
      }

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
  const hasKey = !!(groqApiKey || geminiApiKey);
  const label = groqApiKey ? 'Groq' : geminiApiKey ? 'Gemini' : '';
  // Update sidebar button
  const btn = document.getElementById('btn-apikey');
  if (btn) {
    btn.classList.toggle('active', hasKey);
    btn.title = hasKey ? `${label} API đã kích hoạt` : 'Chưa có API Key';
  }
  // Update FAB button
  const fab = document.getElementById('fab-apikey');
  if (fab) {
    fab.classList.toggle('active', hasKey);
    fab.title = hasKey ? `${label} API đã kích hoạt` : 'Nhấn để cài API Key';
  }
}

async function initChat() {
  renderSidebar();
  renderDocsPopup();
  setupFabButtons();
  setupFileUpload();
  setupApiKeyModal();
  updateApiKeyButton();
  renderTopicButtons();
  setupChatInput();
  await loadKnowledgeBase();

  const firstName = userData ? userData.name.split(' ').pop() : 'bạn';

  addBotMessage(`Chào <strong>${firstName}</strong>! Em là chuyên gia tư vấn xây dựng, sẵn sàng hỗ trợ anh/chị.

Anh/chị vui lòng <strong>chọn 1 chủ đề</strong> bên dưới để em tư vấn chính xác nhé:`);
  renderTopicButtons();
}

document.addEventListener('DOMContentLoaded', () => {
  checkExistingUser();
});
