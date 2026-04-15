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
let chatHistory = [];

// Lịch sử conversations
let conversations = JSON.parse(localStorage.getItem('xnld_conversations') || '[]');
let currentConvId = null;

// 5 Chủ đề — mapping sang KB file
const UI_TOPICS = {
  "hop-dong": {
    icon: "📋", title: "Hợp đồng & Pháp lý",
    description: "HĐ thi công, thiết kế, vật tư, pháp lý xây dựng",
    kb_file: "kb_1_hopdong",
    keywords: ["hợp đồng", "thanh toán", "phạt", "bảo hành", "pháp lý", "giấy phép", "hoàn công"],
    questions: [
      "Hợp đồng thi công phần thô gồm những điều khoản chính nào?",
      "Mức phạt vi phạm hợp đồng cụ thể bao nhiêu?",
      "Tiến độ thanh toán chia thành mấy đợt?",
      "Quy định bảo hành công trình sau thi công?"
    ]
  },
  "bao-gia": {
    icon: "💰", title: "Báo giá & Dự toán",
    description: "Dự toán, ngân sách, đơn giá, phụ lục báo giá",
    kb_file: "kb_2_baogia",
    keywords: ["báo giá", "dự toán", "ngân sách", "chi phí", "đơn giá", "vật tư"],
    questions: [
      "Khai toán ngân sách xây nhà gồm những hạng mục nào?",
      "Báo giá thi công phần thô tính theo diện tích thế nào?",
      "Dự toán vật tư hoàn thiện gồm những khoản gì?"
    ]
  },
  "tieu-chuan": {
    icon: "📐", title: "Tiêu chuẩn thi công",
    description: "Quy chuẩn, nghiệm thu, checklist, kiểm tra",
    kb_file: "kb_3_tieuchuan",
    keywords: ["tiêu chuẩn", "nghiệm thu", "kiểm tra", "bê tông", "cốt thép", "tường", "điện", "nước"],
    questions: [
      "Chủ nhà cần có mặt ở những giai đoạn nào?",
      "Kiểm tra vật tư sắt thép trước khi thi công?",
      "Nghiệm thu tường xây cần kiểm tra gì?",
      "Kiểm tra hệ thống ống cấp thoát nước?"
    ]
  },
  "lua-chon": {
    icon: "🏗️", title: "Lựa chọn nhà thầu & Thiết kế",
    description: "Đánh giá, so sánh, chọn nhà thầu và đơn vị thiết kế",
    kb_file: "kb_4_luachon",
    keywords: ["nhà thầu", "thiết kế", "lựa chọn", "đánh giá", "năng lực", "kinh nghiệm"],
    questions: [
      "Tiêu chí đánh giá nhà thầu xây dựng gồm những gì?",
      "Cách chọn đơn vị thiết kế uy tín?",
      "Checklist phỏng vấn nhà thầu trước khi ký HĐ?"
    ]
  },
  "phong-thuy": {
    icon: "📿", title: "Phong thủy & Nghi lễ",
    description: "Cúng động thổ, nhập trạch, mượn tuổi",
    kb_file: "kb_5_phongtuy",
    keywords: ["cúng", "động thổ", "nhập trạch", "phong thủy", "mượn tuổi", "nghi lễ"],
    questions: [
      "Cúng động thổ cho người được tuổi chuẩn bị gì?",
      "Cúng động thổ mượn tuổi quy trình ra sao?",
      "Lễ nhập trạch cần chuẩn bị những gì?"
    ]
  }
};

// Detect topic từ keywords trong câu hỏi
function detectTopic(query) {
  const q = query.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;
  for (const [key, topic] of Object.entries(UI_TOPICS)) {
    let score = 0;
    topic.keywords.forEach(kw => { if (q.includes(kw)) score += 1; });
    if (score > bestScore) { bestScore = score; bestMatch = key; }
  }
  return bestScore > 0 ? bestMatch : null;
}

// Conversation management
function saveConversation() {
  if (!currentConvId || chatHistory.length === 0) return;
  const conv = {
    id: currentConvId,
    topic: currentTopic,
    topicTitle: currentTopic ? UI_TOPICS[currentTopic].title : 'Chung',
    messages: [...chatHistory],
    timestamp: new Date().toISOString()
  };
  const idx = conversations.findIndex(c => c.id === currentConvId);
  if (idx >= 0) conversations[idx] = conv;
  else conversations.unshift(conv);
  if (conversations.length > 20) conversations = conversations.slice(0, 20);
  localStorage.setItem('xnld_conversations', JSON.stringify(conversations));
}

function startNewConversation(topicKey) {
  // Save current conversation
  saveConversation();
  // Start new
  currentConvId = 'conv_' + Date.now();
  currentTopic = topicKey;
  chatHistory = [];
  chatMessages.innerHTML = '';
  const topic = UI_TOPICS[topicKey];
  addBotMessage(`Anh/chị đã chọn chủ đề <strong>${topic.title}</strong>. Em sẵn sàng tư vấn ạ!`);
}

function switchTopic(newTopicKey) {
  saveConversation();
  startNewConversation(newTopicKey);
}

// Typewriter effect — hiện text từng phần
function typewriterEffect(element, html) {
  element.innerHTML = '';
  // Chia HTML thành chunks nhỏ (mỗi 3-5 ký tự)
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const fullText = tempDiv.innerHTML;
  let i = 0;
  const chunkSize = 4;
  const interval = setInterval(() => {
    i += chunkSize;
    if (i >= fullText.length) {
      element.innerHTML = fullText;
      clearInterval(interval);
      scrollToBottom();
    } else {
      // Tìm vị trí an toàn (không cắt giữa tag HTML)
      let end = i;
      if (fullText[end - 1] === '<' || fullText.substring(end - 5, end).includes('<')) {
        const nextClose = fullText.indexOf('>', end);
        if (nextClose !== -1) end = nextClose + 1;
      }
      element.innerHTML = fullText.substring(0, end);
      scrollToBottom();
    }
  }, 15);
}

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
  const topicFile = currentTopic && UI_TOPICS[currentTopic] ? UI_TOPICS[currentTopic].kb_file : 'kb_1_hopdong';
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
// FILE UPLOAD SYSTEM (Multi-file)
// =============================================
let pendingFiles = []; // Array of { name, type, base64, textContent }
const ICON_MAP = { pdf:'📄', xlsx:'📊', xls:'📊', docx:'📝', doc:'📝', jpg:'🖼️', jpeg:'🖼️', png:'🖼️', gif:'🖼️', webp:'🖼️' };

async function processFile(file) {
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    addBotMessage('Dạ, file quá lớn (tối đa 10MB). Anh/chị chọn file nhỏ hơn nhé.');
    return;
  }
  if (pendingFiles.length >= 10) {
    addBotMessage('Dạ, tối đa 10 file mỗi lần. Anh/chị gửi đi rồi đính kèm tiếp nhé.');
    return;
  }

  const ext = file.name.split('.').pop().toLowerCase();
  const entry = { name: file.name, type: ext, base64: null, textContent: null };

  try {
    if (file.type.startsWith('image/')) {
      // Resize ảnh xuống max 1200px để không vượt giới hạn Claude API
      entry.base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const MAX = 1200;
            let w = img.width, h = img.height;
            if (w > MAX || h > MAX) {
              const ratio = Math.min(MAX / w, MAX / h);
              w = Math.round(w * ratio);
              h = Math.round(h * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
          };
          img.onerror = reject;
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
      entry.type = 'jpeg'; // sau resize luôn là jpeg
    } else if (ext === 'pdf') {
      const arrayBuf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
      let text = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
      entry.textContent = text.slice(0, 5000);
    } else if (ext === 'xlsx' || ext === 'xls') {
      const arrayBuf = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuf, { type: 'array' });
      let text = '';
      wb.SheetNames.forEach(name => { text += `[${name}]\n` + XLSX.utils.sheet_to_csv(wb.Sheets[name]) + '\n'; });
      entry.textContent = text.slice(0, 5000);
    } else if (ext === 'docx' || ext === 'doc') {
      const arrayBuf = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuf });
      entry.textContent = result.value.slice(0, 5000);
    }
  } catch (err) {
    console.warn('File parse error:', err);
    entry.textContent = `[Không thể đọc file ${file.name}]`;
  }

  pendingFiles.push(entry);
  renderFilePreviewList();
}

function renderFilePreviewList() {
  const container = document.getElementById('file-preview-list');
  if (!container) return;
  container.innerHTML = '';
  pendingFiles.forEach((f, idx) => {
    const div = document.createElement('div');
    div.className = 'file-preview';
    div.innerHTML = `
      <div class="file-preview-info">
        <span class="file-preview-icon">${ICON_MAP[f.type] || '📎'}</span>
        <span class="file-preview-name">${f.name}</span>
      </div>
      <button class="file-preview-remove" data-idx="${idx}">&times;</button>
    `;
    div.querySelector('.file-preview-remove').addEventListener('click', () => {
      pendingFiles.splice(idx, 1);
      renderFilePreviewList();
    });
    container.appendChild(div);
  });
}

function clearPendingFiles() {
  pendingFiles = [];
  document.getElementById('file-upload').value = '';
  const container = document.getElementById('file-preview-list');
  if (container) container.innerHTML = '';
}

function setupFileUpload() {
  const fileInput = document.getElementById('file-upload');
  const btnAttach = document.getElementById('btn-attach');
  const chatPanel = document.querySelector('.chat-panel');

  // 1. Nút đính kèm (multi-file)
  btnAttach.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (e) => {
    for (const file of e.target.files) { await processFile(file); }
    fileInput.value = '';
  });

  // 2. Drag & Drop (multi-file)
  chatPanel.addEventListener('dragover', (e) => { e.preventDefault(); chatPanel.classList.add('drag-over'); });
  chatPanel.addEventListener('dragleave', (e) => { e.preventDefault(); chatPanel.classList.remove('drag-over'); });
  chatPanel.addEventListener('drop', async (e) => {
    e.preventDefault();
    chatPanel.classList.remove('drag-over');
    for (const file of e.dataTransfer.files) { await processFile(file); }
  });

  // 3. Paste ảnh (thêm vào danh sách)
  document.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const ext = file.type.split('/')[1] || 'png';
          processFile(new File([file], `paste_${Date.now()}.${ext}`, { type: file.type }));
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
  // Guard: click event truyền PointerEvent thay vì string
  const text = (typeof predefinedQuery === 'string' ? predefinedQuery : '') || chatInput.value.trim();
  const hasFiles = pendingFiles.length > 0;

  if (!text && !hasFiles) return;
  if (isProcessing) return;

  // Bắt buộc chọn chủ đề
  if (!currentTopic) {
    if (text) addUserMessage(text);
    addBotMessage('Dạ, anh/chị vui lòng <strong>chọn 1 chủ đề</strong> bên trên để em tư vấn chính xác nhé.');
    return;
  }

  // Detect off-topic → gợi ý chuyển
  if (text) {
    const detectedTopic = detectTopic(text);
    if (detectedTopic && detectedTopic !== currentTopic) {
      const suggestedTitle = UI_TOPICS[detectedTopic].title;
      const currentTitle = UI_TOPICS[currentTopic].title;
      addUserMessage(text);
      addBotMessage(`Vấn đề này thuộc chủ đề <strong>${suggestedTitle}</strong>, hiện anh/chị đang ở <strong>${currentTitle}</strong>.<br><br><button class="switch-topic-btn" onclick="switchTopic('${detectedTopic}')">Chuyển sang ${suggestedTitle}</button> <button class="stay-topic-btn" onclick="this.parentElement.style.display='none'">Tiếp tục ở đây</button>`);
      return;
    }
  }

  isProcessing = true;

  try {
    chatInput.value = '';

    // Lấy files rồi clear ngay
    const currentFiles = [...pendingFiles];
    const fileNames = currentFiles.map(f => f.name);
    clearPendingFiles();

    // Hiển thị tin nhắn user
    addUserMessage(text || `[Gửi ${currentFiles.length} file]`);

    // Hiện badges file (không hiện ảnh base64 lớn trong chat để tránh crash)
    currentFiles.forEach(f => {
      const icon = f.base64 ? '🖼️' : '📎';
      addUserMessage(`<span class="file-badge">${icon} ${f.name}</span>`);
    });

    showTyping();

    // Gộp files thành options cho n8n
    const aiOptions = {};
    const imageFile = currentFiles.find(f => f.base64);
    if (imageFile) {
      aiOptions.imageData = imageFile.base64;
      aiOptions.imageMime = `image/${imageFile.type === 'jpg' ? 'jpeg' : imageFile.type}`;
    }

    const textParts = currentFiles.filter(f => f.textContent).map(f => `[${f.name}]:\n${f.textContent}`);
    if (textParts.length > 0) {
      aiOptions.fileText = textParts.join('\n\n---\n\n').slice(0, 12000);
      aiOptions.fileName = fileNames.join(', ');
    }

    const query = text || `Phân tích ${currentFiles.length} file: ${fileNames.join(', ')}`;
    const result = await askAI(query, aiOptions);

    hideTyping();
    addBotMessage(result.answer || '', true, true);
  } catch (err) {
    console.error('Chat error:', err);
    hideTyping();
    addBotMessage("Dạ, có lỗi xảy ra. Anh/chị thử hỏi lại nhé.");
  } finally {
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


function addBotMessage(content, showAvatar = true, animate = false) {
  const row = document.createElement('div');
  row.className = 'message-row bot';
  const avatarHtml = showAvatar ? '<div class="msg-avatar"><img src="assets/bot-avatar.png" alt="" class="avatar-img"></div>' : '<div class="msg-avatar" style="visibility:hidden"></div>';
  const htmlContent = markdownToHtml(content);

  row.innerHTML = `
    ${avatarHtml}
    <div>
      <div class="message-bubble"></div>
      <div class="message-time">${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  `;
  chatMessages.appendChild(row);

  const bubble = row.querySelector('.message-bubble');
  if (animate && content.length > 20) {
    // Typewriter effect
    typewriterEffect(bubble, htmlContent);
  } else {
    bubble.innerHTML = htmlContent;
  }
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
function clearQuickReplies() { if (quickReplies) quickReplies.innerHTML = ''; }
function scrollToBottom() { chatMessages.scrollTop = chatMessages.scrollHeight; }

// =============================================
// FAB TOGGLE BUTTONS
// =============================================
let suggestionsOpen = false;
let docsOpen = false;

function toggleSuggestions() {
  if (!quickReplies) return;
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
  if (suggestionsOpen && quickReplies) {
    suggestionsOpen = false;
    quickReplies.classList.add('hidden');
    const fabBtn = document.getElementById('fab-suggestions');
    if (fabBtn) fabBtn.classList.remove('active');
  }
}

function renderTopicButtons() {
  if (!quickReplies) return;
  clearQuickReplies();
  currentTopic = null;
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
  if (!quickReplies) return;
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
  REFERENCE_DOCS.forEach(doc => {
    const groupEl = document.createElement('div');
    groupEl.className = 'sidebar-doc-group';
    groupEl.innerHTML = `<div class="sidebar-doc-group-title">${doc.icon} ${doc.group}</div>`;
    doc.items.forEach(name => {
      const item = document.createElement('div');
      item.className = 'sidebar-doc-item';
      item.textContent = name;
      groupEl.appendChild(item);
    });
    sidebarTopics.appendChild(groupEl);
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
function renderTopicSelector() {
  const html = Object.entries(UI_TOPICS).map(([key, topic]) =>
    `<button class="topic-select-btn" onclick="startNewConversation('${key}')">
      <span class="topic-select-icon">${topic.icon}</span>
      <span class="topic-select-content">
        <strong>${topic.title}</strong>
        <small>${topic.description}</small>
      </span>
    </button>`
  ).join('');
  addBotMessage(html);
}

// History Panel
function setupHistoryPanel() {
  const btnHistory = document.getElementById('btn-history');
  const btnNew = document.getElementById('btn-new-conv');
  const panel = document.getElementById('history-panel');
  const closeBtn = document.getElementById('history-close');

  if (btnHistory) btnHistory.addEventListener('click', () => {
    renderHistoryList();
    panel.classList.toggle('hidden');
  });
  if (closeBtn) closeBtn.addEventListener('click', () => panel.classList.add('hidden'));
  if (btnNew) btnNew.addEventListener('click', () => {
    saveConversation();
    currentTopic = null;
    currentConvId = null;
    chatHistory = [];
    chatMessages.innerHTML = '';
    const firstName = userData ? userData.name.split(' ').pop() : 'bạn';
    addBotMessage(`Chào <strong>${firstName}</strong>! Chọn chủ đề để bắt đầu:`);
    renderTopicSelector();
  });
}

function renderHistoryList() {
  const list = document.getElementById('history-list');
  if (!list) return;
  list.innerHTML = '';
  if (conversations.length === 0) {
    list.innerHTML = '<p class="history-empty">Chưa có lịch sử tư vấn</p>';
    return;
  }
  conversations.forEach(conv => {
    const div = document.createElement('div');
    div.className = 'history-item';
    const date = new Date(conv.timestamp).toLocaleDateString('vi-VN');
    const preview = conv.messages[0] ? conv.messages[0].content.slice(0, 60) + '...' : '';
    div.innerHTML = `
      <div class="history-item-title">${conv.topicTitle}</div>
      <div class="history-item-preview">${preview}</div>
      <div class="history-item-date">${date}</div>
    `;
    div.addEventListener('click', () => loadConversation(conv));
    list.appendChild(div);
  });
}

function loadConversation(conv) {
  saveConversation();
  currentConvId = conv.id;
  currentTopic = conv.topic;
  chatHistory = [...conv.messages];
  chatMessages.innerHTML = '';
  // Replay messages
  conv.messages.forEach(m => {
    if (m.role === 'user' || m.role === 'Khách') addUserMessage(m.content);
    else addBotMessage(m.content);
  });
  document.getElementById('history-panel').classList.add('hidden');
}

async function initChat() {
  renderSidebar();
  setupFileUpload();
  setupChatInput();
  setupHistoryPanel();
  await loadFileUrlMap();

  const firstName = userData ? userData.name.split(' ').pop() : 'bạn';

  addBotMessage(`Chào <strong>${firstName}</strong>! Em là chuyên gia tư vấn xây dựng.

Anh/chị vui lòng <strong>chọn 1 chủ đề</strong> để em tư vấn chính xác nhé:`);
  renderTopicSelector();
}

document.addEventListener('DOMContentLoaded', () => {
  checkExistingUser();
});
