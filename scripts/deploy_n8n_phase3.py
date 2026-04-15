"""
Phase 3: Deploy n8n workflow with:
- Supabase vector search (thay keyword search)
- Claude with prompt caching
- Verify agent (check answer vs KB)

Usage:
  python scripts/deploy_n8n_phase3.py --supabase-url=xxx --supabase-key=xxx

Requires: SUPABASE_URL, SUPABASE_KEY (anon key for search)
"""

import json, urllib.request, sys, os

N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWNkMWFlZC05Mzk0LTQyN2UtODE5My1mMGY3Y2NjMWRhZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTQxZDYxNWQtYzk2My00ZDRhLWI3NGQtYTYxMzQ0MDVjZGEwIiwiaWF0IjoxNzc2MjIzOTM2fQ.hZwMNBHi4h8-wXSRh-46goXAHcJ0kN46y129SKDzKyA"
BASE = "https://nhacuaminh.com/api/v1"
WF_ID = "OmgWbuZEQxOXdwQ3"

SUPABASE_URL = ''
SUPABASE_KEY = ''  # anon key

for arg in sys.argv[1:]:
    if arg.startswith('--supabase-url='): SUPABASE_URL = arg.split('=',1)[1]
    if arg.startswith('--supabase-key='): SUPABASE_KEY = arg.split('=',1)[1]

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Cần: --supabase-url=xxx --supabase-key=xxx")
    print("Lấy từ Supabase Dashboard → Settings → API")
    sys.exit(1)

# Get existing Claude key
req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}", headers={"X-N8N-API-KEY": N8N_API_KEY})
with urllib.request.urlopen(req) as resp:
    wf = json.loads(resp.read())

CLAUDE_KEY = ''
for node in wf['nodes']:
    if 'Claude' in node['name']:
        for p in node.get('parameters',{}).get('headerParameters',{}).get('parameters',[]):
            if p['name'] == 'x-api-key' and len(p['value']) > 20:
                CLAUDE_KEY = p['value']
print(f"Claude key: {'found' if CLAUDE_KEY else 'NOT FOUND'}")

# Node 2: Supabase Vector Search
SEARCH_CODE = f"""
const webhook = $('1. Webhook').first().json.body;
const query = String(webhook.query || '');
const topic = String(webhook.topic || '');
const topicFile = String(webhook.topic_file || '').replace('kb_','').replace(/\\d+_/,'');
const history = String(webhook.history || '');
const sessionId = String(webhook.sessionId || 'default');
const imageData = webhook.imageData || null;
const imageMime = webhook.imageMime || null;
const fileText = webhook.fileText ? String(webhook.fileText) : null;
const fileName = webhook.fileName ? String(webhook.fileName) : null;

// Get embedding for query via OpenAI
// (n8n sẽ gọi OpenAI embeddings)
let embedding = null;
try {{
  const embRes = await this.helpers.httpRequest({{
    url: 'https://api.openai.com/v1/embeddings',
    method: 'POST',
    headers: {{ 'Authorization': 'Bearer ' + $env.OPENAI_API_KEY, 'Content-Type': 'application/json' }},
    body: JSON.stringify({{ model: 'text-embedding-3-small', input: query }})
  }});
  embedding = embRes.data[0].embedding;
}} catch(e) {{ console.log('Embedding error:', e.message); }}

// Search Supabase
let chunks = [];
if (embedding) {{
  try {{
    const searchRes = await this.helpers.httpRequest({{
      url: '{SUPABASE_URL}/rest/v1/rpc/match_chunks',
      method: 'POST',
      headers: {{
        'apikey': '{SUPABASE_KEY}',
        'Authorization': 'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
      }},
      body: JSON.stringify({{
        query_embedding: embedding,
        match_topic: topicFile || null,
        match_count: 8
      }})
    }});
    chunks = searchRes || [];
  }} catch(e) {{ console.log('Supabase error:', e.message); }}
}}

// Build context
let context = '';
let totalLen = 0;
for (const c of chunks) {{
  const section = c.section ? '[' + c.section + '] ' : '';
  const entry = section + c.content;
  if (totalLen + entry.length > 8000) break;
  context += entry + '\\n---\\n';
  totalLen += entry.length;
}}
if (fileText) context = '[File khach gui: ' + (fileName||'') + ']:\\n' + fileText.slice(0,3000) + '\\n---\\n' + context;

return [{{ json: {{ query, topic, context, history, sessionId, imageData, imageMime, fileText, fileName, kbFound: chunks.length, contextLen: totalLen }} }}];
"""

print(f"\\nSearch code ready ({len(SEARCH_CODE)} chars)")
print(f"Supabase URL: {SUPABASE_URL}")
print("\\nReady to deploy. Run with --deploy flag to execute.")

if '--deploy' not in sys.argv:
    sys.exit(0)

# Build full workflow... (similar to deploy_n8n_v3.py but with Supabase search)
print("\\nDeploying Phase 3 workflow...")
# TODO: Build and deploy when Supabase credentials are provided
