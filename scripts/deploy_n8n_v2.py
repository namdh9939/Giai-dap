import json, urllib.request

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWNkMWFlZC05Mzk0LTQyN2UtODE5My1mMGY3Y2NjMWRhZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTQxZDYxNWQtYzk2My00ZDRhLWI3NGQtYTYxMzQ0MDVjZGEwIiwiaWF0IjoxNzc2MjIzOTM2fQ.hZwMNBHi4h8-wXSRh-46goXAHcJ0kN46y129SKDzKyA"
BASE = "https://nhacuaminh.com/api/v1"
WF_ID = "OmgWbuZEQxOXdwQ3"
CLAUDE_KEY = "CLAUDE_API_KEY_REMOVED"

# Load all KB files
kb_data = {}
for topic, fn in [('hop_dong','kb_hop_dong.json'),('bao_gia','kb_bao_gia.json'),('tieu_chuan','kb_tieu_chuan.json'),('phap_ly','kb_phap_ly.json'),('thac_mac','kb_thac_mac.json')]:
    with open(fn, 'r', encoding='utf-8') as f:
        kb_data[topic] = json.load(f)
    print(f"  {topic}: {len(kb_data[topic])} chunks")

# Merge ALL KB into one big array with topic tag
all_chunks = []
for topic, chunks in kb_data.items():
    for c in chunks:
        c['_topic'] = topic
        all_chunks.append(c)
print(f"Total: {len(all_chunks)} chunks")

# Escape for JS string embedding
kb_json_str = json.dumps(all_chunks, ensure_ascii=True)
print(f"JSON size: {len(kb_json_str)//1024}KB (ensure_ascii=True to avoid encoding issues)")

# Build the ALL-IN-ONE search node code
SEARCH_CODE = '''// === KNOWLEDGE BASE (embedded directly) ===
const KB_DATA = ''' + kb_json_str + ''';

// === INPUT ===
const webhook = $('1. Webhook Chat').first().json.body;
const query = String(webhook.query || '');
const topic = String(webhook.topic || '');
const topicFile = String(webhook.topic_file || 'hop_dong');
const history = String(webhook.history || '');
const sessionId = String(webhook.sessionId || 'default');
const imageData = webhook.imageData || null;
const imageMime = webhook.imageMime || null;
const fileText = webhook.fileText ? String(webhook.fileText) : null;
const fileName = webhook.fileName ? String(webhook.fileName) : null;

// === FILTER by topic ===
const topicChunks = KB_DATA.filter(c => c._topic === topicFile);

// === SEARCH ===
const searchTerms = query.toLowerCase().split(/\\s+/).filter(t => t.length > 1);
const scored = topicChunks.map(chunk => {
  if (!chunk || !chunk.content) return null;
  let score = 0;
  const cl = chunk.content.toLowerCase();
  searchTerms.forEach(term => { if (cl.includes(term)) score += 10; });
  if (chunk.keywords) chunk.keywords.forEach(kw => {
    if (query.toLowerCase().includes(kw.toLowerCase())) score += 20;
  });
  if (/\\d[\\d,.]+\\s*(VN\\u0110|\\u0111\\u1ed3ng)/i.test(chunk.content) && score > 0) score += 30;
  if (/\\d+%/.test(chunk.content) && score > 0) score += 20;
  return { ...chunk, score };
}).filter(c => c && c.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

// === BUILD CONTEXT (max 8000 chars) ===
let context = '';
let totalLen = 0;
for (const c of scored) {
  if (totalLen + c.content.length > 8000) break;
  context += c.content + '\\n---\\n';
  totalLen += c.content.length;
}
if (fileText) {
  context = '[Tai lieu khach gui: ' + (fileName || '') + ']:\\n' + fileText.slice(0, 3000) + '\\n---\\n' + context;
}

// === DOCLINKS ===
const docLinks = [...new Set(scored.map(c => {
  const id = c.id || '';
  const match = id.match(/^[a-z-]+_([A-Z][A-Z0-9_]+)\\.docx_part/);
  return match ? match[1] : '';
}))].filter(Boolean).slice(0, 3);

return [{ json: {
  query, topic, context, history, sessionId,
  imageData, imageMime, fileText, fileName,
  kbFound: scored.length, contextLen: totalLen, docLinks,
  totalKB: topicChunks.length
}}];
'''

# Build prompt node (same as before)
PROMPT_CODE = r"""
const data = $('2. KB Search (All Data)').first().json;

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
const systemPrompt = `B\u1ea1n l\u00e0 CHUY\u00caN GIA T\u01af V\u1ea4N X\u00c2Y D\u1ef0NG, t\u01b0 v\u1ea5n tr\u1ef1c ti\u1ebfp cho CH\u1ee6 \u0110\u1ea6U T\u01af.\n\nCH\u1ee6 \u0110\u1ec0: ${data.topic}\n\u2192 CH\u1ec8 tr\u1ea3 l\u1eddi trong ph\u1ea1m vi "${data.topic}". Ngo\u00e0i ch\u1ee7 \u0111\u1ec1 \u2192 nh\u1eafc chuy\u1ec3n. Ngo\u00e0i x\u00e2y nh\u00e0 \u2192 t\u1eeb ch\u1ed1i.\n\nNGUY\u00caN T\u1eaeC:\n1. B\u1eaeT BU\u1ed8C d\u00f9ng S\u1ed0 LI\u1ec6U C\u1ee4 TH\u1ec2 t\u1eeb TRI TH\u1ee8C (VN\u0110, %, ng\u00e0y). KH\u00d4NG b\u1ecba. "\u2026" \u2192 "do hai b\u00ean th\u1ecfa thu\u1eadn".\n2. KH\u00d4NG d\u1eabn ngu\u1ed3n. KH\u00d4NG "Theo \u0110i\u1ec1u X". Tr\u1ea3 l\u1eddi nh\u01b0 ki\u1ebfn th\u1ee9c c\u1ee7a b\u1ea1n.\n3. \u0110\u1ee9ng v\u1ec1 ph\u00eda ch\u1ee7 \u0111\u1ea7u t\u01b0. C\u1ea3nh b\u00e1o r\u1ee7i ro.\n4. Format: **bold** cho quan tr\u1ecdng, g\u1ea1ch \u0111\u1ea7u d\u00f2ng cho danh s\u00e1ch. KH\u00d4NG ## ###. T\u1ed1i \u0111a 300 t\u1eeb.\n5. X\u01b0ng "em", g\u1ecdi "anh/ch\u1ecb".\n6. KH\u00d4NG g\u1eedi URL/link.\n7. Ph\u00e1p l\u00fd \u2192 kh\u00e1i qu\u00e1t + "Hotline: ${hotline}".\n8. K\u1ebft b\u1eb1ng 1 c\u00e2u h\u00e0nh \u0111\u1ed9ng c\u1ee5 th\u1ec3.\n9. SAU N\u1ed8I DUNG, th\u00eam ---FOLLOWUP--- r\u1ed3i 2-3 c\u00e2u h\u1ecfi g\u1ee3i \u00fd (m\u1ed7i c\u00e2u 1 d\u00f2ng, - \u0111\u1ea7u d\u00f2ng).`;

const userMessage = `TRI TH\u1ee8C T\u00c0I LI\u1ec6U:\n${data.context}\n\n${fullHistory ? 'L\u1ecaCH S\u1eec:\n' + fullHistory + '\n\n' : ''}C\u00c2U H\u1eceI: "${data.query}"`;

const userParts = [];
if (data.imageData && data.imageMime) {
  userParts.push({ type: 'image', source: { type: 'base64', media_type: data.imageMime, data: data.imageData } });
}
userParts.push({ type: 'text', text: userMessage });

return [{ json: { systemPrompt, messages: [{ role: 'user', content: userParts }], docLinks: data.docLinks, sessionId, query: data.query }}];
""".strip()

EXTRACT_CODE = r"""
const claudeRes = $('4. Claude AI (Sonnet 4)').first().json;
const promptData = $('3. Build Prompt + Memory').first().json;
let answer = '';

try {
  if (claudeRes.content && claudeRes.content[0]) {
    answer = claudeRes.content[0].text;
  } else {
    answer = 'D\u1ea1, h\u1ec7 th\u1ed1ng \u0111ang b\u1eadn. Anh/ch\u1ecb th\u1eed l\u1ea1i sau nh\u00e9.';
  }
} catch(e) {
  answer = 'D\u1ea1, c\u00f3 l\u1ed7i x\u1ea3y ra. Anh/ch\u1ecb th\u1eed h\u1ecfi l\u1ea1i nh\u00e9.';
}

const staticData = $getWorkflowStaticData('global');
if (!staticData.chatHistory) staticData.chatHistory = {};
const sid = promptData.sessionId || 'default';
if (!staticData.chatHistory[sid]) staticData.chatHistory[sid] = [];
staticData.chatHistory[sid].push({ role: 'Kh\u00e1ch', content: promptData.query });
staticData.chatHistory[sid].push({ role: 'Tr\u1ee3 l\u00fd', content: answer.slice(0, 500) });
if (staticData.chatHistory[sid].length > 10) {
  staticData.chatHistory[sid] = staticData.chatHistory[sid].slice(-10);
}

return [{ json: { answer, docLinks: promptData.docLinks || [] } }];
""".strip()

# Build workflow
workflow = {
  "name": "Trợ Lý Xây Nhà - Claude AI",
  "nodes": [
    {
      "parameters": {"httpMethod":"POST","path":"chat-xaynha","responseMode":"responseNode","options":{}},
      "id":"n1","name":"1. Webhook Chat","type":"n8n-nodes-base.webhook","typeVersion":2,"position":[200,340],"webhookId":"chat-xaynha"
    },
    {
      "parameters": {"jsCode": SEARCH_CODE},
      "id":"n2","name":"2. KB Search (All Data)","type":"n8n-nodes-base.code","typeVersion":2,"position":[500,340]
    },
    {
      "parameters": {"jsCode": PROMPT_CODE},
      "id":"n3","name":"3. Build Prompt + Memory","type":"n8n-nodes-base.code","typeVersion":2,"position":[800,340]
    },
    {
      "parameters": {
        "url":"https://api.anthropic.com/v1/messages","method":"POST","sendHeaders":True,
        "headerParameters":{"parameters":[
          {"name":"x-api-key","value":CLAUDE_KEY},
          {"name":"anthropic-version","value":"2023-06-01"},
          {"name":"content-type","value":"application/json"}
        ]},
        "sendBody":True,"specifyBody":"json",
        "jsonBody":"={\n  \"model\": \"claude-sonnet-4-20250514\",\n  \"max_tokens\": 1500,\n  \"system\": {{ JSON.stringify($json.systemPrompt) }},\n  \"messages\": {{ JSON.stringify($json.messages) }}\n}",
        "options":{"timeout":45000}
      },
      "id":"n4","name":"4. Claude AI (Sonnet 4)","type":"n8n-nodes-base.httpRequest","typeVersion":4.2,"position":[1100,340]
    },
    {
      "parameters": {"jsCode": EXTRACT_CODE},
      "id":"n5","name":"5. Save Memory + Extract","type":"n8n-nodes-base.code","typeVersion":2,"position":[1400,340]
    },
    {
      "parameters": {
        "respondWith":"json",
        "responseBody":"={{ JSON.stringify({ answer: $json.answer, docLinks: $json.docLinks }) }}",
        "options":{"responseHeaders":{"entries":[
          {"name":"Access-Control-Allow-Origin","value":"*"},
          {"name":"Access-Control-Allow-Headers","value":"Content-Type"}
        ]}}
      },
      "id":"n6","name":"6. Respond to App","type":"n8n-nodes-base.respondToWebhook","typeVersion":1.1,"position":[1700,340]
    }
  ],
  "connections": {
    "1. Webhook Chat":{"main":[[{"node":"2. KB Search (All Data)","type":"main","index":0}]]},
    "2. KB Search (All Data)":{"main":[[{"node":"3. Build Prompt + Memory","type":"main","index":0}]]},
    "3. Build Prompt + Memory":{"main":[[{"node":"4. Claude AI (Sonnet 4)","type":"main","index":0}]]},
    "4. Claude AI (Sonnet 4)":{"main":[[{"node":"5. Save Memory + Extract","type":"main","index":0}]]},
    "5. Save Memory + Extract":{"main":[[{"node":"6. Respond to App","type":"main","index":0}]]}
  },
  "settings": {"executionOrder": "v1"}
}

# Deploy
print(f"\nDeploying workflow ({len(json.dumps(workflow))//1024}KB)...")
data = json.dumps(workflow).encode('utf-8')
req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}", data=data,
    headers={"X-N8N-API-KEY":API_KEY,"Content-Type":"application/json"}, method="PUT")
try:
    with urllib.request.urlopen(req) as resp:
        r = json.loads(resp.read())
        print(f"Updated: {len(r['nodes'])} nodes, active: {r['active']}")
        for n in r['nodes']:
            print(f"  {n['name']}")
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode('utf-8','replace')[:500]}")

# Activate
try:
    req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}/activate", headers={"X-N8N-API-KEY":API_KEY}, method="POST")
    with urllib.request.urlopen(req) as resp:
        print(f"Activated: {json.loads(resp.read())['active']}")
except Exception as e:
    print(f"Activate error: {e}")
