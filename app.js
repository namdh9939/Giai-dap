/* ========================================
   APP.JS — Chatbot "Trợ Lý Xây Nhà" (RAG Edition)
   Khóa học Xây Nhà Lần Đầu
   ======================================== */

// =============================================
// GLOBAL STATE & CONFIG
// =============================================
const BOT_NAME = "Trợ Lý Xây Nhà";
const N8N_WEBHOOK = "https://nhacuaminh.com/webhook/chat-xaynha";

// PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}
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
// DATA (file URL map for doc links)
// =============================================
let fileUrlMap = {};

async function loadFileUrlMap() {
  try {
    fileUrlMap = await fetch('file_urls.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));
    console.log("File URLs loaded:", Object.keys(fileUrlMap).length);
  } catch (e) { /* ignore */ }
}

// =============================================
// AI ENGINE — Gọi n8n Webhook (Claude AI backend)
// =============================================
const TOPIC_FILE_MAP = {
  'hop-dong': 'hop_dong',
  'bao-gia': 'bao_gia',
  'tieu-chuan': 'tieu_chuan',
  'phap-ly': 'phap_ly',
  'thac-mac': 'thac_mac'
};

async function askAI(query, options = {}) {
  const { fileText, fileName, imageData, imageMime } = options;

  const topicName = currentTopic && UI_TOPICS[currentTopic] ? UI_TOPICS[currentTopic].title : 'chung';
  const topicFile = TOPIC_FILE_MAP[currentTopic] || 'hop_dong';
  const historyText = chatHistory.map(m => `${m.role === 'user' ? 'Khách' : 'Trợ lý'}: ${m.content}`).join('\n');

  const payload = {
    query,
    topic: topicName,
    topic_file: topicFile,
    history: historyText,
    fileText: fileText || null,
    fileName: fileName || null,
    imageData: imageData || null,
    imageMime: imageMime || null
  };

  try {
    const res = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const answer = data.answer || 'Dạ, em chưa tìm được câu trả lời. Anh/chị thử hỏi lại nhé.';

    // Cập nhật lịch sử
    chatHistory.push({ role: 'user', content: query });
    chatHistory.push({ role: 'model', content: answer });
    if (chatHistory.length > 8) chatHistory.splice(0, 2);

    // Trả về cả answer và docLinks (nếu có)
    return { answer, docLinks: data.docLinks || [] };
  } catch (err) {
    console.error('n8n error:', err);
    return { answer: 'Dạ, hệ thống đang bận. Anh/chị thử lại sau ít giây nhé.', docLinks: [] };
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
// FILE UPLOAD SYSTEM
// =============================================
let pendingFile = null; // { name, type, data, textContent, base64 }

// Xử lý 1 file (dùng chung cho input, drag-drop, paste)
async function processFile(file) {
  const preview = document.getElementById('file-preview');
  const previewName = document.getElementById('file-preview-name');
  const previewIcon = document.getElementById('file-preview-icon');

  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    addBotMessage('Dạ, file quá lớn (tối đa 10MB). Anh/chị chọn file nhỏ hơn nhé.');
    return;
  }

  const ext = file.name.split('.').pop().toLowerCase();
  const iconMap = { pdf: '📄', xlsx: '📊', xls: '📊', docx: '📝', doc: '📝', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️' };
  previewIcon.textContent = iconMap[ext] || '📎';
  previewName.textContent = file.name;
  preview.classList.remove('hidden');

  pendingFile = { name: file.name, type: ext, data: file, textContent: null, base64: null };

  try {
    if (file.type.startsWith('image/')) {
      // Đọc ảnh thành base64 — dùng Promise để chờ xong mới cho gửi
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      if (pendingFile) pendingFile.base64 = base64;
    } else if (ext === 'pdf') {
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
      const arrayBuf = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuf, { type: 'array' });
      let text = '';
      wb.SheetNames.forEach(name => { text += `[${name}]\n` + XLSX.utils.sheet_to_csv(wb.Sheets[name]) + '\n'; });
      pendingFile.textContent = text.slice(0, 8000);
    } else if (ext === 'docx' || ext === 'doc') {
      const arrayBuf = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuf });
      pendingFile.textContent = result.value.slice(0, 8000);
    }
  } catch (err) {
    console.warn('File parse error:', err);
    if (pendingFile) pendingFile.textContent = `[Không thể đọc file ${file.name}]`;
  }
}

function clearPendingFile() {
  pendingFile = null;
  document.getElementById('file-upload').value = '';
  document.getElementById('file-preview').classList.add('hidden');
}

function setupFileUpload() {
  const fileInput = document.getElementById('file-upload');
  const btnAttach = document.getElementById('btn-attach');
  const previewRemove = document.getElementById('file-preview-remove');
  const chatPanel = document.querySelector('.chat-panel');

  // 1. Nút đính kèm
  btnAttach.addEventListener('click', () => fileInput.click());
  previewRemove.addEventListener('click', clearPendingFile);
  fileInput.addEventListener('change', (e) => { if (e.target.files[0]) processFile(e.target.files[0]); });

  // 2. Drag & Drop vào khung chat
  chatPanel.addEventListener('dragover', (e) => {
    e.preventDefault();
    chatPanel.classList.add('drag-over');
  });
  chatPanel.addEventListener('dragleave', (e) => {
    e.preventDefault();
    chatPanel.classList.remove('drag-over');
  });
  chatPanel.addEventListener('drop', (e) => {
    e.preventDefault();
    chatPanel.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  });

  // 3. Paste ảnh từ clipboard (Ctrl+V / Cmd+V)
  document.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // Đặt tên cho ảnh paste
          const ext = file.type.split('/')[1] || 'png';
          const namedFile = new File([file], `paste_${Date.now()}.${ext}`, { type: file.type });
          processFile(namedFile);
        }
        return;
      }
    }
  });
}

// Gọi Gemini Vision API cho ảnh
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

  // Hiển thị tin nhắn user
  const userText = text || `[Gửi file: ${pendingFile?.name}]`;
  addUserMessage(userText);

  // Hiện thumbnail ảnh trong chat
  if (hasFile && pendingFile.base64) {
    const imgHtml = `<img src="data:image/${pendingFile.type};base64,${pendingFile.base64}" class="msg-uploaded-image" alt="${pendingFile.name}">`;
    addBotMessage(imgHtml, false);
  }
  if (hasFile && !pendingFile.base64 && pendingFile.name) {
    addUserMessage(`<span class="file-badge">📎 ${pendingFile.name}</span>`);
  }

  // Lấy file data rồi clear preview
  const currentFile = pendingFile;
  clearPendingFile();
  closeSuggestions();
  clearQuickReplies();
  showTyping();

  try {
    // Chuẩn bị options cho n8n
    const aiOptions = {};
    if (currentFile && currentFile.base64) {
      const mimeType = `image/${currentFile.type === 'jpg' ? 'jpeg' : currentFile.type}`;
      aiOptions.imageData = currentFile.base64;
      aiOptions.imageMime = mimeType;
    }
    if (currentFile && currentFile.textContent) {
      aiOptions.fileText = currentFile.textContent;
      aiOptions.fileName = currentFile.name;
    }

    // Gọi n8n webhook
    const result = await askAI(text || `Phân tích file "${currentFile?.name || ''}"`, aiOptions);

    hideTyping();
    addBotMessage(result.answer);

    // Hiện link tài liệu liên quan (từ n8n trả về)
    if (result.docLinks && result.docLinks.length > 0) {
      renderDocLinksFromNames(result.docLinks);
    }
  } catch (err) {
    console.error('Chat error:', err);
    hideTyping();
    addBotMessage("Dạ, có lỗi xảy ra. Anh/chị thử hỏi lại nhé.");
  } finally {
    if (currentTopic) {
      renderQuestionButtons(currentTopic);
    } else {
      renderTopicButtons();
    }
    isProcessing = false;
  }
}

// Map ASCII ID từ n8n → tên đẹp + URL
const DOC_DISPLAY_MAP = {
  'HOP_DONG_CHINH_NHA_THAU_PHU_2025': { name: 'HĐ Nhà thầu phụ 2025', key: 'HOP_DONG_CHINH_NHA_THAU_PHU_2025' },
  'HOP_DONG_CUNG_CAP_VAT_TU': { name: 'HĐ Cung cấp vật tư', key: 'HOP_DONG_CUNG_CAP_VAT_TU' },
  'BIEN_BAN_LAM_VIEC': { name: 'Biên bản làm việc', key: 'BIEN_BAN_LAM_VIEC' },
  'PHU_LUC_HOP_DONG_SAT': { name: 'Phụ lục HĐ Sắt', key: 'PHU_LUC_HOP_DONG_SAT' },
  'PHU_LUC_HOP_DONG_DA_HOA_CUONG': { name: 'Phụ lục HĐ Đá hoa cương', key: 'PHU_LUC_HOP_DONG_DA_HOA_CUONG' },
};

function renderDocLinksFromNames(sourceIds) {
  const links = [];
  for (const id of sourceIds) {
    const display = DOC_DISPLAY_MAP[id];
    if (display && fileUrlMap[display.key]) {
      links.push({ name: display.name, url: fileUrlMap[display.key].url, file: fileUrlMap[display.key].file });
    } else if (fileUrlMap[id]) {
      links.push({ name: id, url: fileUrlMap[id].url, file: fileUrlMap[id].file });
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
async function initChat() {
  renderSidebar();
  renderDocsPopup();
  setupFabButtons();
  setupFileUpload();
  renderTopicButtons();
  setupChatInput();
  await loadFileUrlMap();

  const firstName = userData ? userData.name.split(' ').pop() : 'bạn';

  addBotMessage(`Chào <strong>${firstName}</strong>! Em là chuyên gia tư vấn xây dựng, sẵn sàng hỗ trợ anh/chị.

Anh/chị vui lòng <strong>chọn 1 chủ đề</strong> bên dưới để em tư vấn chính xác nhé:`);
  renderTopicButtons();
}

document.addEventListener('DOMContentLoaded', () => {
  checkExistingUser();
});
