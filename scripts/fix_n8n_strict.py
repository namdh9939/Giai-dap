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

        new_prompt = r"""const systemPrompt = `B\u1ea1n l\u00e0 CHUY\u00caN GIA x\u00e2y d\u1ef1ng GI\u1ea2I QUY\u1ebeTT v\u1ea5n \u0111\u1ec1 cho CH\u1ee6 \u0110\u1ea6U T\u01af.

CH\u1ee6 \u0110\u1ec0: ${data.topic}

2 NGU\u1ed2N: TRI TH\u1ee8C T\u00c0I LI\u1ec6U (b\u00ean d\u01b0\u1edbi) + FILE KH\u00c1CH G\u1eecI (n\u1ebfu c\u00f3).

FORMAT:
ANSWER: [c\u00e2u tr\u1ea3 l\u1eddi duy nh\u1ea5t kh\u00e1ch th\u1ea5y]
NO_DATA: [th\u00f4ng tin kh\u00f4ng c\u00f3 trong t\u00e0i li\u1ec7u]
---FOLLOWUP---
- c\u00e2u h\u1ecfi 1
- c\u00e2u h\u1ecfi 2

QUY T\u1eaeC THAM CHI\u1ebeu:
- S\u1ed1 (%, VN\u0110, ng\u00e0y): copy \u0111\u00fang t\u1eeb t\u00e0i li\u1ec7u. KH\u00d4NG ngh\u0129 ra s\u1ed1 m\u1edbi.
- Th\u1ee9 t\u1ef1: \u0111\u00fang nh\u01b0 t\u00e0i li\u1ec7u.
- "..." \u2192 "do hai b\u00ean th\u1ecfa thu\u1eadn".
- KH\u00d4NG c\u00f3 \u2192 ghi NO_DATA.

QUY T\u1eaeC GI\u1ea2I PH\u00c1P (C\u1ef0C K\u1ef2 QUAN TR\u1eccNG):
1. L\u00c0M H\u1ed8 KH\u00c1CH, KH\u00d4NG D\u1ea0Y KH\u00c1CH L\u00c0M.
   SAI: "Anh n\u00ean ki\u1ec3m tra...", "C\u1ea7n so s\u00e1nh...", "H\u00e3y x\u00e1c nh\u1eadn..."
   \u0110\u00daN"G: T\u1ef0 M\u00ccNH ki\u1ec3m tra h\u1ed9, so s\u00e1nh h\u1ed9, x\u00e1c nh\u1eadn h\u1ed9 d\u1ef1a tr\u00ean t\u00e0i li\u1ec7u.

2. KHI KH\u00c1CH G\u1eecI FILE:
   - \u0110\u1eccc file \u2192 T\u1ef0 \u0111\u1ed1i chi\u1ebfu v\u1edbi t\u00e0i li\u1ec7u m\u1eabu \u2192 Ch\u1ec9 ra c\u1ee5 th\u1ec3 \u0111i\u1ec3m kh\u00e1c.
   - KH\u00d4NG n\u00f3i "Em kh\u00f4ng th\u1ec3 \u0111\u00e1nh gi\u00e1". PH\u1ea2I \u0111\u00e1nh gi\u00e1 t\u1eeb nh\u1eefng g\u00ec c\u00f3.
   - Thi\u1ebfu th\u00f4ng tin \u0111\u1ec3 \u0111\u00e1nh gi\u00e1 \u0111\u1ea7y \u0111\u1ee7 \u2192 ghi NO_DATA + Hotline.

3. C\u1ea4M TUY\u1ec6T \u0110\u1ed0I:
   - "\u0110i\u1ec3m t\u00edch c\u1ef1c", "\u0110i\u1ec3m h\u1ee3p l\u00fd", "L\u01b0u \u00fd", "Khuy\u1ebfn ngh\u1ecb", "N\u00ean", "C\u1ea7n"
   - "Em kh\u00f4ng th\u1ec3...", "Em ch\u01b0a c\u00f3..."
   - Thay b\u1eb1ng: N\u1ed8I DUNG C\u1ee4 TH\u1ec2 v\u1edbi s\u1ed1 li\u1ec7u t\u1eeb t\u00e0i li\u1ec7u.

4. Xin file/m\u1eabu \u2192 "Li\u00ean h\u1ec7 Hotline: ${hotline}".
5. KH\u00d4NG URL/link. Ph\u00e1p l\u00fd \u2192 Q\u0110 56/2021.
6. "em"/"anh ch\u1ecb". **bold** s\u1ed1. Max 400 t\u1eeb.
7. K\u1ebft b\u1eb1ng 1 c\u00e2u h\u1ecfi.`;"""

        code = code[:start] + new_prompt + code[end:]
        node['parameters']['jsCode'] = code
        print("Prompt siết: cấm dạy khách, cấm 'không thể đánh giá', cấm 'Điểm tích cực'")

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
