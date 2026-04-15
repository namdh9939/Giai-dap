import json, urllib.request

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWNkMWFlZC05Mzk0LTQyN2UtODE5My1mMGY3Y2NjMWRhZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTQxZDYxNWQtYzk2My00ZDRhLWI3NGQtYTYxMzQ0MDVjZGEwIiwiaWF0IjoxNzc2MjIzOTM2fQ.hZwMNBHi4h8-wXSRh-46goXAHcJ0kN46y129SKDzKyA"
BASE = "https://nhacuaminh.com/api/v1"
WF_ID = "OmgWbuZEQxOXdwQ3"
CLAUDE_KEY = "CLAUDE_API_KEY_REMOVED"

SEARCH_CODE = r"""
const webhook = $('1. Webhook Chat').first().json.body;
const query = webhook.query || '';
const topic = webhook.topic || '';
const history = webhook.history || '';
const sessionId = webhook.sessionId || 'default';
const imageData = webhook.imageData || null;
const imageMime = webhook.imageMime || null;
const fileText = webhook.fileText || null;
const fileName = webhook.fileName || null;
const topicFile = webhook.topic_file || 'hop_dong';

let kbChunks = [];
try {
  const raw = $('2. Knowledge Base (GitHub)').first().json;
  if (Array.isArray(raw)) kbChunks = raw;
  else {
    const allItems = $('2. Knowledge Base (GitHub)').all();
    kbChunks = allItems.map(i => i.json).filter(c => c && c.content);
  }
} catch(e) {}

if (kbChunks.length === 0) {
  try {
    const url = `https://raw.githubusercontent.com/namdh9939/Giai-dap/main/kb_${topicFile}.json`;
    const response = await this.helpers.httpRequest({ url, method: 'GET', encoding: 'utf-8' });
    kbChunks = typeof response === 'string' ? JSON.parse(response) : (Array.isArray(response) ? response : []);
  } catch(e) {}
}

const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
const scored = kbChunks.map(chunk => {
  if (!chunk || !chunk.content) return null;
  let score = 0;
  const cl = chunk.content.toLowerCase();
  searchTerms.forEach(term => { if (cl.includes(term)) score += 10; });
  if (chunk.keywords) chunk.keywords.forEach(kw => { if (query.toLowerCase().includes(kw.toLowerCase())) score += 20; });
  if (/\d[\d,.]+\s*(VNĐ|đồng)/i.test(chunk.content) && score > 0) score += 30;
  if (/\d+%/.test(chunk.content) && score > 0) score += 20;
  if (/ĐIỀU\s+\d+/i.test(chunk.content) && score > 0) score += 15;
  return { ...chunk, score };
}).filter(c => c && c.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

let context = '';
let totalLen = 0;
for (const c of scored) {
  if (totalLen + c.content.length > 8000) break;
  context += c.content + '\n---\n';
  totalLen += c.content.length;
}
if (fileText) context = `[Tài liệu khách gửi: ${fileName}]:\n${fileText.slice(0,3000)}\n---\n` + context;

const docLinks = [...new Set(scored.map(c => {
  const id = c.id || '';
  const match = id.match(/^[a-z-]+_([A-Z][A-Z0-9_]+)\.docx_part/);
  return match ? match[1] : '';
}))].filter(Boolean).slice(0, 3);

return [{ json: { query, topic, context, history, sessionId, imageData, imageMime, fileText, fileName, kbFound: scored.length, contextLen: totalLen, docLinks }}];
""".strip()

PROMPT_CODE = r"""
const data = $('3. Search Context').first().json;

const staticData = $getWorkflowStaticData('global');
if (!staticData.chatHistory) staticData.chatHistory = {};
const sessionId = data.sessionId || 'default';
if (!staticData.chatHistory[sessionId]) staticData.chatHistory[sessionId] = [];
const memHistory = staticData.chatHistory[sessionId];

let fullHistory = data.history || '';
if (memHistory.length > 0 && !fullHistory) {
  fullHistory = memHistory.map(m => `${m.role}: ${m.content.slice(0,200)}`).join('\n');
}

const hotline = '0902 982 029';
const systemPrompt = `Bạn là CHUYÊN GIA TƯ VẤN XÂY DỰNG, tư vấn trực tiếp cho CHỦ ĐẦU TƯ.\n\nCHỦ ĐỀ: ${data.topic}\n→ CHỈ trả lời trong phạm vi "${data.topic}". Ngoài chủ đề → nhắc chuyển. Ngoài xây nhà → từ chối.\n\nNGUYÊN TẮC:\n1. BẮT BUỘC dùng SỐ LIỆU CỤ THỂ từ TRI THỨC (VNĐ, %, ngày). KHÔNG bịa. "…" → "do hai bên thỏa thuận".\n2. KHÔNG dẫn nguồn. KHÔNG "Theo Điều X". Trả lời như kiến thức của bạn.\n3. Đứng về phía chủ đầu tư. Cảnh báo rủi ro.\n4. Format: **bold** cho quan trọng, gạch đầu dòng cho danh sách. KHÔNG ## ###. Tối đa 300 từ.\n5. Xưng "em", gọi "anh/chị".\n6. KHÔNG gửi URL/link.\n7. Pháp lý → khái quát + "Hotline: ${hotline}".\n8. Kết bằng 1 câu hành động cụ thể.\n9. SAU NỘI DUNG, thêm ---FOLLOWUP--- rồi 2-3 câu hỏi gợi ý (mỗi câu 1 dòng, - đầu dòng).`;

const userMessage = `TRI THỨC TÀI LIỆU:\n${data.context}\n\n${fullHistory ? 'LỊCH SỬ:\n' + fullHistory + '\n\n' : ''}CÂU HỎI: "${data.query}"`;

const userParts = [];
if (data.imageData && data.imageMime) {
  userParts.push({ type: 'image', source: { type: 'base64', media_type: data.imageMime, data: data.imageData } });
}
userParts.push({ type: 'text', text: userMessage });

return [{ json: { systemPrompt, messages: [{ role: 'user', content: userParts }], docLinks: data.docLinks, sessionId, query: data.query }}];
""".strip()

EXTRACT_CODE = r"""
const claudeRes = $('5. Claude AI (Sonnet 4)').first().json;
const promptData = $('4. Build Prompt + Memory').first().json;
let answer = '';

try {
  if (claudeRes.content && claudeRes.content[0]) {
    answer = claudeRes.content[0].text;
  } else {
    answer = 'Dạ, hệ thống đang bận. Anh/chị thử lại sau nhé.';
  }
} catch(e) {
  answer = 'Dạ, có lỗi xảy ra. Anh/chị thử hỏi lại nhé.';
}

const staticData = $getWorkflowStaticData('global');
if (!staticData.chatHistory) staticData.chatHistory = {};
const sid = promptData.sessionId || 'default';
if (!staticData.chatHistory[sid]) staticData.chatHistory[sid] = [];
staticData.chatHistory[sid].push({ role: 'Khách', content: promptData.query });
staticData.chatHistory[sid].push({ role: 'Trợ lý', content: answer.slice(0, 500) });
if (staticData.chatHistory[sid].length > 10) {
  staticData.chatHistory[sid] = staticData.chatHistory[sid].slice(-10);
}

return [{ json: { answer, docLinks: promptData.docLinks || [] } }];
""".strip()

workflow = {
  "name": "Trợ Lý Xây Nhà - Claude AI",
  "nodes": [
    {"parameters":{"httpMethod":"POST","path":"chat-xaynha","responseMode":"responseNode","options":{}},"id":"n1","name":"1. Webhook Chat","type":"n8n-nodes-base.webhook","typeVersion":2,"position":[200,340],"webhookId":"chat-xaynha"},
    {"parameters":{"url":"=https://raw.githubusercontent.com/namdh9939/Giai-dap/main/kb_{{ $json.body.topic_file }}.json","options":{"timeout":10000},"method":"GET"},"id":"n2","name":"2. Knowledge Base (GitHub)","type":"n8n-nodes-base.httpRequest","typeVersion":4.2,"position":[440,340]},
    {"parameters":{"jsCode":SEARCH_CODE},"id":"n3","name":"3. Search Context","type":"n8n-nodes-base.code","typeVersion":2,"position":[680,340]},
    {"parameters":{"jsCode":PROMPT_CODE},"id":"n4","name":"4. Build Prompt + Memory","type":"n8n-nodes-base.code","typeVersion":2,"position":[920,340]},
    {"parameters":{"url":"https://api.anthropic.com/v1/messages","method":"POST","sendHeaders":True,"headerParameters":{"parameters":[{"name":"x-api-key","value":CLAUDE_KEY},{"name":"anthropic-version","value":"2023-06-01"},{"name":"content-type","value":"application/json"}]},"sendBody":True,"specifyBody":"json","jsonBody":"={\n  \"model\": \"claude-sonnet-4-20250514\",\n  \"max_tokens\": 1500,\n  \"system\": {{ JSON.stringify($json.systemPrompt) }},\n  \"messages\": {{ JSON.stringify($json.messages) }}\n}","options":{"timeout":45000}},"id":"n5","name":"5. Claude AI (Sonnet 4)","type":"n8n-nodes-base.httpRequest","typeVersion":4.2,"position":[1160,340]},
    {"parameters":{"jsCode":EXTRACT_CODE},"id":"n6","name":"6. Save Memory + Extract","type":"n8n-nodes-base.code","typeVersion":2,"position":[1400,340]},
    {"parameters":{"respondWith":"json","responseBody":"={{ JSON.stringify({ answer: $json.answer, docLinks: $json.docLinks }) }}","options":{"responseHeaders":{"entries":[{"name":"Access-Control-Allow-Origin","value":"*"},{"name":"Access-Control-Allow-Headers","value":"Content-Type"}]}}},"id":"n7","name":"7. Respond to App","type":"n8n-nodes-base.respondToWebhook","typeVersion":1.1,"position":[1640,340]}
  ],
  "connections": {
    "1. Webhook Chat":{"main":[[{"node":"2. Knowledge Base (GitHub)","type":"main","index":0}]]},
    "2. Knowledge Base (GitHub)":{"main":[[{"node":"3. Search Context","type":"main","index":0}]]},
    "3. Search Context":{"main":[[{"node":"4. Build Prompt + Memory","type":"main","index":0}]]},
    "4. Build Prompt + Memory":{"main":[[{"node":"5. Claude AI (Sonnet 4)","type":"main","index":0}]]},
    "5. Claude AI (Sonnet 4)":{"main":[[{"node":"6. Save Memory + Extract","type":"main","index":0}]]},
    "6. Save Memory + Extract":{"main":[[{"node":"7. Respond to App","type":"main","index":0}]]}
  },
  "settings":{"executionOrder":"v1"}
}

# Deploy
data = json.dumps(workflow).encode()
req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}", data=data, headers={"X-N8N-API-KEY":API_KEY,"Content-Type":"application/json"}, method="PUT")
with urllib.request.urlopen(req) as resp:
    r = json.loads(resp.read())
    print(f"Updated: {len(r['nodes'])} nodes")
    for n in r['nodes']: print(f"  {n['name']}")
    print(f"Active: {r['active']}")

# Activate
req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}/activate", headers={"X-N8N-API-KEY":API_KEY}, method="POST")
with urllib.request.urlopen(req) as resp:
    print(f"Activated: {json.loads(resp.read())['active']}")
