import json, urllib.request

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWNkMWFlZC05Mzk0LTQyN2UtODE5My1mMGY3Y2NjMWRhZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTQxZDYxNWQtYzk2My00ZDRhLWI3NGQtYTYxMzQ0MDVjZGEwIiwiaWF0IjoxNzc2MjIzOTM2fQ.hZwMNBHi4h8-wXSRh-46goXAHcJ0kN46y129SKDzKyA"
BASE = "https://nhacuaminh.com/api/v1"
WF_ID = "OmgWbuZEQxOXdwQ3"

req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}", headers={"X-N8N-API-KEY": API_KEY})
with urllib.request.urlopen(req) as resp:
    wf = json.loads(resp.read())

for node in wf['nodes']:
    if node['name'] == '3. Prompt':
        code = node['parameters']['jsCode']
        start = code.find("const systemPrompt = `")
        end = code.find("`;", start) + 2

        new_prompt = r"""const systemPrompt = `B\u1ea1n l\u00e0 CHUY\u00caN GIA x\u00e2y d\u1ef1ng cho CH\u1ee6 \u0110\u1ea6U T\u01af.

CH\u1ee6 \u0110\u1ec0: ${data.topic}

2 NGU\u1ed2N: TRI TH\u1ee8C (b\u00ean d\u01b0\u1edbi, m\u1ed7i chunk \u0111\u00e1nh d\u1ea5u [T\u00ean file]) + FILE KH\u00c1CH (n\u1ebfu c\u00f3).

FORMAT TR\u1ea2 L\u1edcI:
ANSWER: [c\u00e2u tr\u1ea3 l\u1eddi ch\u00ednh \u2014 \u0111\u00e2y l\u00e0 ph\u1ea7n duy nh\u1ea5t kh\u00e1ch th\u1ea5y]
NO_DATA: [th\u00f4ng tin kh\u00e1ch h\u1ecfi m\u00e0 kh\u00f4ng c\u00f3 trong t\u00e0i li\u1ec7u]
---FOLLOWUP---
- c\u00e2u h\u1ecfi 1
- c\u00e2u h\u1ecfi 2

QUY T\u1eaeC S\u1ed0 1 \u2014 KH\u00d4NG B\u1ecaA:
- S\u1ed1 (%, VN\u0110, ng\u00e0y): PH\u1ea2I copy t\u1eeb TRI TH\u1ee8C. Section marker [T\u00ean file] cho bi\u1ebft s\u1ed1 t\u1eeb \u0111\u00e2u.
- Th\u1ee9 t\u1ef1: \u0111\u00fang nh\u01b0 t\u00e0i li\u1ec7u. KH\u00d4NG s\u1eafp l\u1ea1i.
- "..." \u2192 "do hai b\u00ean th\u1ecfa thu\u1eadn khi k\u00fd".
- KH\u00d4NG c\u00f3 \u2192 ghi v\u00e0o NO_DATA.

QUY T\u1eaeC S\u1ed0 2 \u2014 GI\u1ea2I PH\u00c1P:
- \u0110\u01afA GI\u1ea2I PH\u00c1P TR\u1ef0C TI\u1ebePP. L\u00e0m h\u1ed9 kh\u00e1ch.
- C\u1ea4M: "\u0110i\u1ec3m h\u1ee3p l\u00fd", "L\u01b0u \u00fd", "Khuy\u1ebfn ngh\u1ecb", "N\u00ean ki\u1ec3m tra".
- Xin file \u2192 "Li\u00ean h\u1ec7 Hotline: ${hotline}".
- KH\u00d4NG URL/link. Ph\u00e1p l\u00fd \u2192 Q\u0110 56/2021.

KHI KH\u00c1CH G\u1eecI FILE: PH\u00c2N T\u00cdCH + SO S\u00c1NH v\u1edbi t\u00e0i li\u1ec7u m\u1eabu.
K\u1ef8 THU\u1eacT (case study): \u0111\u01b0\u1ee3c t\u01b0 v\u1ea5n nh\u01b0ng KH\u00d4NG b\u1ecba \u0111\u01a1n gi\u00e1/chi ph\u00ed/%.

"em"/"anh ch\u1ecb". **bold** s\u1ed1 li\u1ec7u. Max 400 t\u1eeb. K\u1ebft b\u1eb1ng 1 c\u00e2u h\u1ecfi.`;"""

        code = code[:start] + new_prompt + code[end:]
        node['parameters']['jsCode'] = code
        print("Prompt updated: bỏ DATA_USED khỏi output")

settings = {"executionOrder": "v1"}
update = json.dumps({
    "name": wf["name"], "nodes": wf["nodes"],
    "connections": wf["connections"], "settings": settings
}).encode('utf-8')

req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}", data=update,
    headers={"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"}, method="PUT")
try:
    with urllib.request.urlopen(req) as resp:
        print(f"Updated, active: {json.loads(resp.read())['active']}")
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode('utf-8','replace')[:300]}")
