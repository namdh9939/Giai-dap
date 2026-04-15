import json, urllib.request

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWNkMWFlZC05Mzk0LTQyN2UtODE5My1mMGY3Y2NjMWRhZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTQxZDYxNWQtYzk2My00ZDRhLWI3NGQtYTYxMzQ0MDVjZGEwIiwiaWF0IjoxNzc2MjIzOTM2fQ.hZwMNBHi4h8-wXSRh-46goXAHcJ0kN46y129SKDzKyA"
BASE = "https://nhacuaminh.com/api/v1"
WF_ID = "OmgWbuZEQxOXdwQ3"

# Load KB
all_chunks = []
for fn in ['kb_1_hopdong.json','kb_2_baogia.json','kb_3_tieuchuan.json','kb_4_luachon.json','kb_5_phongtuy.json']:
    with open(fn, 'r', encoding='utf-8') as f:
        data = json.load(f)
    all_chunks.extend(data)
    print(f"  {fn}: {len(data)} chunks")

kb_json = json.dumps(all_chunks, ensure_ascii=True)
print(f"Total: {len(all_chunks)} chunks, {len(kb_json)//1024}KB")

# Get Claude key from existing workflow
req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}", headers={"X-N8N-API-KEY": API_KEY})
with urllib.request.urlopen(req) as resp:
    wf = json.loads(resp.read())

CLAUDE_KEY = ''
for node in wf['nodes']:
    if 'Claude' in node['name']:
        for p in node.get('parameters',{}).get('headerParameters',{}).get('parameters',[]):
            if p['name'] == 'x-api-key' and len(p['value']) > 20:
                CLAUDE_KEY = p['value']
print(f"Claude key: {'found' if CLAUDE_KEY else 'NOT FOUND'}")

# ============================================
# NODE 2: SEARCH with synonym + bigram + section
# ============================================
SEARCH_CODE = 'const KB_DATA = ' + kb_json + ''';\n
// SYNONYM MAP
const SYNONYMS = {
  "thanh toan":["tam ung","dat coc","giai ngan","tra tien","dot thanh toan","chuyen khoan"],
  "phat":["che tai","vi pham","boi thuong","muc phat"],
  "bao hanh":["sua chua","khac phuc","loi thi cong"],
  "nghiem thu":["kiem tra","ban giao","xac nhan","bien ban"],
  "tien do":["thoi gian","giai doan","lich thi cong"],
  "vat tu":["vat lieu","xi mang","sat thep","gach","son","thiet bi"],
  "thiet ke":["ban ve","kien truc","3d","phoi canh","mat bang"],
  "be tong":["do be tong","slump","nen mau","cot thep","cop pha","van khuon"],
  "tuong":["xay tuong","to tuong","trat","mach vua"],
  "dien nuoc":["ong nuoc","cap thoat","mep","ong dien","ap luc"],
  "mong":["ep coc","dao mong","coc be tong"],
  "an toan":["bao ho","mu bao ho","lao dong"],
  "bao gia":["don gia","du toan","chi phi","ngan sach"],
  "chon nha thau":["danh gia","nang luc","kinh nghiem"],
  "phong thuy":["cung","dong tho","nhap trach","muon tuoi"]
};

// Remove Vietnamese diacritics for matching
function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[\\u0111\\u0110]/g,'d').toLowerCase();
}

const webhook = $('1. Webhook').first().json.body;
const query = String(webhook.query || '');
const topic = String(webhook.topic || '');
const topicFile = String(webhook.topic_file || '');
const history = String(webhook.history || '');
const sessionId = String(webhook.sessionId || 'default');
const imageData = webhook.imageData || null;
const imageMime = webhook.imageMime || null;
const fileText = webhook.fileText ? String(webhook.fileText) : null;
const fileName = webhook.fileName ? String(webhook.fileName) : null;

// Expand query with synonyms
const queryNorm = removeDiacritics(query);
let expandedTerms = queryNorm.split(/\\s+/).filter(t => t.length > 1);

// Add synonym matches
for (const [main, syns] of Object.entries(SYNONYMS)) {
  if (queryNorm.includes(main)) {
    expandedTerms.push(...syns.flatMap(s => s.split(' ')));
  }
  for (const syn of syns) {
    if (queryNorm.includes(syn)) {
      expandedTerms.push(...main.split(' '));
    }
  }
}
expandedTerms = [...new Set(expandedTerms)];

// Filter by topic
const topicKey = topicFile.replace('kb_','').replace(/\\d+_/,'');
const topicChunks = topicKey ? KB_DATA.filter(c => c._topic === topicKey || (c._topic || '').includes(topicKey)) : KB_DATA;
const searchPool = topicChunks.length > 0 ? topicChunks : KB_DATA;

// Score chunks
const scored = searchPool.map(chunk => {
  if (!chunk || !chunk.content) return null;
  let score = 0;
  const cl = removeDiacritics(chunk.content);

  // Term matching (expanded with synonyms)
  expandedTerms.forEach(term => { if (cl.includes(term)) score += 10; });

  // Bigram matching (2-word phrases)
  const queryWords = queryNorm.split(/\\s+/);
  for (let i = 0; i < queryWords.length - 1; i++) {
    const bigram = queryWords[i] + ' ' + queryWords[i+1];
    if (cl.includes(bigram)) score += 25;
  }

  // Keyword matching
  if (chunk.keywords) chunk.keywords.forEach(kw => {
    if (queryNorm.includes(removeDiacritics(kw))) score += 20;
  });

  // Boost: has numbers
  if (/\\d[\\d,.]+\\s*(VN|dong)/i.test(chunk.content) && score > 0) score += 30;
  if (/\\d+%/.test(chunk.content) && score > 0) score += 20;

  return { ...chunk, score };
}).filter(c => c && c.score > 0).sort((a, b) => b.score - a.score).slice(0, 12);

// Build context with section markers
let context = '';
let totalLen = 0;
for (const c of scored) {
  const entry = c.content;
  if (totalLen + entry.length > 10000) break;
  context += entry + '\\n---\\n';
  totalLen += entry.length;
}
if (fileText) context = '[File khach gui: ' + (fileName||'') + ']:\\n' + fileText.slice(0,3000) + '\\n---\\n' + context;

return [{ json: { query, topic, context, history, sessionId, imageData, imageMime, fileText, fileName, kbFound: scored.length, contextLen: totalLen, expandedTerms: expandedTerms.length }}];'''

# ============================================
# NODE 3: PROMPT with structured output
# ============================================
PROMPT_CODE = r"""
const data = $('2. Search').first().json;
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
const systemPrompt = `B\u1ea1n l\u00e0 CHUY\u00caN GIA x\u00e2y d\u1ef1ng cho CH\u1ee6 \u0110\u1ea6U T\u01af.

CH\u1ee6 \u0110\u1ec0: ${data.topic}

2 NGU\u1ed2N: TRI TH\u1ee8C (b\u00ean d\u01b0\u1edbi) + FILE KH\u00c1CH (n\u1ebfu c\u00f3).

QUY T\u1eaeC S\u1ed0 1 - TR\u1ea2 L\u1edcI C\u00d3 C\u1ea4U TR\u00daC:
Tr\u1ea3 l\u1eddi theo format:
ANSWER: [c\u00e2u tr\u1ea3 l\u1eddi ch\u00ednh]
DATA_USED: [li\u1ec7t k\u00ea m\u1ed7i s\u1ed1 li\u1ec7u \u0111\u00e3 d\u00f9ng v\u00e0 ngu\u1ed3n - VD: "1.000.000 VN\u0110/ng\u00e0y [H\u0110 Thi c\u00f4ng]"]
NO_DATA: [li\u1ec7t k\u00ea th\u00f4ng tin kh\u00e1ch h\u1ecfi m\u00e0 kh\u00f4ng c\u00f3 trong t\u00e0i li\u1ec7u]

QUY T\u1eaeC S\u1ed0 2 - KH\u00d4NG B\u1ecaA:
- M\u1ecdi s\u1ed1 (%, VN\u0110, ng\u00e0y, l\u1ea7n) PH\u1ea2I copy t\u1eeb TRI TH\u1ee8C. Chunk n\u00e0o ch\u1ee9a s\u1ed1 \u0111\u00f3 \u0111\u01b0\u1ee3c \u0111\u00e1nh d\u1ea5u [T\u00ean file] \u1edf \u0111\u1ea7u.
- Th\u1ee9 t\u1ef1: \u0111\u00fang nh\u01b0 t\u00e0i li\u1ec7u. KH\u00d4NG s\u1eafp l\u1ea1i.
- "..." \u2192 "do hai b\u00ean th\u1ecfa thu\u1eadn".
- KH\u00d4NG t\u00ecm th\u1ea5y \u2192 ghi v\u00e0o NO_DATA + "Li\u00ean h\u1ec7 Hotline: ${hotline}".

KHI KH\u00c1CH G\u1eecI FILE: PH\u00c2N T\u00cdCH + SO S\u00c1NH v\u1edbi t\u00e0i li\u1ec7u m\u1eabu. Ch\u1ec9 r\u00f5 kh\u00e1c bi\u1ec7t.
K\u1ef8 THU\u1eacT (case study): \u0111\u01b0\u1ee3c t\u01b0 v\u1ea5n nh\u01b0ng KH\u00d4NG b\u1ecba \u0111\u01a1n gi\u00e1/%.

PHONG C\u00c1CH:
- GI\u1ea2I PH\u00c1P TR\u1ef0C TI\u1ebePP. C\u1ea4M: "\u0110i\u1ec3m h\u1ee3p l\u00fd", "L\u01b0u \u00fd", "Khuy\u1ebfn ngh\u1ecb".
- Xin file \u2192 Hotline: ${hotline}.
- KH\u00d4NG URL/link. Ph\u00e1p l\u00fd \u2192 Q\u0110 56/2021.
- "em"/"anh ch\u1ecb". **bold** s\u1ed1. Max 400 t\u1eeb.
- K\u1ebft b\u1eb1ng 1 c\u00e2u h\u1ecfi.
- SAU ANSWER: ---FOLLOWUP--- + 2-3 c\u00e2u h\u1ecfi.`;

const userMessage = `TRI TH\u1ee8C:\n${data.context}\n\n${fullHistory ? 'L\u1ecaCH S\u1eec:\n' + fullHistory + '\n\n' : ''}C\u00c2U H\u1eceI: "${data.query}"`;
const userParts = [];
if (data.imageData && data.imageMime) {
  userParts.push({ type: 'image', source: { type: 'base64', media_type: data.imageMime, data: data.imageData } });
}
userParts.push({ type: 'text', text: userMessage });
return [{ json: { systemPrompt, messages: [{ role: 'user', content: userParts }], sessionId, query: data.query }}];
""".strip()

# ============================================
# NODE 5: EXTRACT + PARSE STRUCTURED OUTPUT
# ============================================
EXTRACT_CODE = r"""
const claudeRes = $('4. Claude').first().json;
const promptData = $('3. Prompt').first().json;
let rawAnswer = '';
try {
  if (claudeRes.content && claudeRes.content[0]) rawAnswer = claudeRes.content[0].text;
  else rawAnswer = 'ANSWER: D\u1ea1, h\u1ec7 th\u1ed1ng \u0111ang b\u1eadn. Th\u1eed l\u1ea1i sau nh\u00e9.';
} catch(e) { rawAnswer = 'ANSWER: C\u00f3 l\u1ed7i. Th\u1eed l\u1ea1i nh\u00e9.'; }

// Parse structured output
let answer = rawAnswer;
let dataUsed = [];
let noData = [];

// Extract ANSWER section
const answerMatch = rawAnswer.match(/ANSWER:\s*([\s\S]*?)(?=DATA_USED:|NO_DATA:|---FOLLOWUP---|$)/i);
if (answerMatch) answer = answerMatch[1].trim();

// Extract DATA_USED
const dataMatch = rawAnswer.match(/DATA_USED:\s*([\s\S]*?)(?=NO_DATA:|---FOLLOWUP---|$)/i);
if (dataMatch) {
  dataUsed = dataMatch[1].trim().split('\n').filter(l => l.trim()).map(l => l.replace(/^[-*]\s*/,'').trim());
}

// Extract NO_DATA
const noDataMatch = rawAnswer.match(/NO_DATA:\s*([\s\S]*?)(?=---FOLLOWUP---|$)/i);
if (noDataMatch) {
  noData = noDataMatch[1].trim().split('\n').filter(l => l.trim()).map(l => l.replace(/^[-*]\s*/,'').trim());
}

// Clean banned phrases
answer = answer.replace(/\*\*C\u1ea6N L\u01afU \u00dd[^*]*\*\*/gi, '');
answer = answer.replace(/\*\*NH\u1eeeNG \u0110I\u1ec2M[^*]*\*\*/gi, '');
answer = answer.replace(/\*\*KHUY\u1ebaN NGH\u1eca[^*]*\*\*/gi, '');

// Memory
const staticData = $getWorkflowStaticData('global');
if (!staticData.chatHistory) staticData.chatHistory = {};
const sid = promptData.sessionId || 'default';
if (!staticData.chatHistory[sid]) staticData.chatHistory[sid] = [];
staticData.chatHistory[sid].push({ role: 'Kh\u00e1ch', content: promptData.query });
staticData.chatHistory[sid].push({ role: 'Tr\u1ee3 l\u00fd', content: answer.slice(0, 500) });
if (staticData.chatHistory[sid].length > 10) staticData.chatHistory[sid] = staticData.chatHistory[sid].slice(-10);

return [{ json: { answer, dataUsed, noData } }];
""".strip()

# Build workflow
workflow = {
  "name": "Trợ Lý Xây Nhà - Claude AI v3",
  "nodes": [
    {"parameters":{"httpMethod":"POST","path":"chat-xaynha","responseMode":"responseNode","options":{}},"id":"n1","name":"1. Webhook","type":"n8n-nodes-base.webhook","typeVersion":2,"position":[200,340],"webhookId":"chat-xaynha"},
    {"parameters":{"jsCode":SEARCH_CODE},"id":"n2","name":"2. Search","type":"n8n-nodes-base.code","typeVersion":2,"position":[500,340]},
    {"parameters":{"jsCode":PROMPT_CODE},"id":"n3","name":"3. Prompt","type":"n8n-nodes-base.code","typeVersion":2,"position":[800,340]},
    {"parameters":{"url":"https://api.anthropic.com/v1/messages","method":"POST","sendHeaders":True,"headerParameters":{"parameters":[{"name":"x-api-key","value":CLAUDE_KEY},{"name":"anthropic-version","value":"2023-06-01"},{"name":"content-type","value":"application/json"}]},"sendBody":True,"specifyBody":"json","jsonBody":"={\n  \"model\": \"claude-sonnet-4-20250514\",\n  \"max_tokens\": 2000,\n  \"system\": {{ JSON.stringify($json.systemPrompt) }},\n  \"messages\": {{ JSON.stringify($json.messages) }}\n}","options":{"timeout":45000}},"id":"n4","name":"4. Claude","type":"n8n-nodes-base.httpRequest","typeVersion":4.2,"position":[1100,340]},
    {"parameters":{"jsCode":EXTRACT_CODE},"id":"n5","name":"5. Extract","type":"n8n-nodes-base.code","typeVersion":2,"position":[1400,340]},
    {"parameters":{"respondWith":"json","responseBody":"={{ JSON.stringify({ answer: $json.answer, dataUsed: $json.dataUsed, noData: $json.noData }) }}","options":{"responseHeaders":{"entries":[{"name":"Access-Control-Allow-Origin","value":"*"},{"name":"Access-Control-Allow-Headers","value":"Content-Type"}]}}},"id":"n6","name":"6. Respond","type":"n8n-nodes-base.respondToWebhook","typeVersion":1.1,"position":[1700,340]}
  ],
  "connections": {
    "1. Webhook":{"main":[[{"node":"2. Search","type":"main","index":0}]]},
    "2. Search":{"main":[[{"node":"3. Prompt","type":"main","index":0}]]},
    "3. Prompt":{"main":[[{"node":"4. Claude","type":"main","index":0}]]},
    "4. Claude":{"main":[[{"node":"5. Extract","type":"main","index":0}]]},
    "5. Extract":{"main":[[{"node":"6. Respond","type":"main","index":0}]]}
  },
  "settings":{"executionOrder":"v1"}
}

# Deploy
data = json.dumps(workflow).encode('utf-8')
print(f"\nDeploying {len(data)//1024}KB...")
req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}", data=data, headers={"X-N8N-API-KEY":API_KEY,"Content-Type":"application/json"}, method="PUT")
try:
    with urllib.request.urlopen(req) as resp:
        r = json.loads(resp.read())
        print(f"Updated: {len(r['nodes'])} nodes, active: {r['active']}")
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode('utf-8','replace')[:300]}")

try:
    req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}/activate", headers={"X-N8N-API-KEY":API_KEY}, method="POST")
    with urllib.request.urlopen(req) as resp:
        print(f"Activated: {json.loads(resp.read())['active']}")
except: pass
