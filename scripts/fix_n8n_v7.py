import json, urllib.request

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWNkMWFlZC05Mzk0LTQyN2UtODE5My1mMGY3Y2NjMWRhZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTQxZDYxNWQtYzk2My00ZDRhLWI3NGQtYTYxMzQ0MDVjZGEwIiwiaWF0IjoxNzc2MjIzOTM2fQ.hZwMNBHi4h8-wXSRh-46goXAHcJ0kN46y129SKDzKyA"
BASE = "https://nhacuaminh.com/api/v1"
WF_ID = "OmgWbuZEQxOXdwQ3"

req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}", headers={"X-N8N-API-KEY": API_KEY})
with urllib.request.urlopen(req) as resp:
    wf = json.loads(resp.read())

for node in wf['nodes']:
    if node['name'] == '3. Build Prompt + Memory':
        code = node['parameters']['jsCode']
        start = code.find("const systemPrompt = `")
        end = code.find("`;", start) + 2

        new_prompt = r"""const systemPrompt = `B\u1ea1n l\u00e0 CHUY\u00caN GIA GI\u1ea2I QUY\u1ebeTT v\u1ea5n \u0111\u1ec1 x\u00e2y d\u1ef1ng cho CH\u1ee6 \u0110\u1ea6U T\u01af.

B\u1ea1n c\u00f3 2 NGU\u1ed2N D\u1eee LI\u1ec6U:
1. T\u00c0I LI\u1ec6U M\u1eaaU (ti\u00eau chu\u1ea9n thi c\u00f4ng, h\u1ee3p \u0111\u1ed3ng m\u1eabu, checklist) = TRI TH\u1ee8C T\u00c0I LI\u1ec6U b\u00ean d\u01b0\u1edbi.
2. FILE KH\u00c1CH G\u1eecI (n\u1ebfu c\u00f3) = ph\u1ea7n \u0111\u01b0\u1ee3c \u0111\u00e1nh d\u1ea5u [T\u00e0i li\u1ec7u kh\u00e1ch g\u1eedi] trong TRI TH\u1ee8C.

KHI KH\u00c1CH G\u1eecI FILE:
- \u0110\u1eccc v\u00e0 PH\u00c2N T\u00cdCH n\u1ed9i dung file kh\u00e1ch g\u1eedi.
- SO S\u00c1NH v\u1edbi t\u00e0i li\u1ec7u m\u1eabu \u0111\u1ec3 ch\u1ec9 ra: \u0111i\u1ec3m t\u1ed1t, \u0111i\u1ec3m thi\u1ebfu, \u0111i\u1ec3m kh\u00e1c bi\u1ec7t.
- VD: "H\u0110 c\u1ee7a anh/ch\u1ecb ph\u1ea1t ch\u1eadm ti\u1ebfn \u0111\u1ed9 5.000.000 VN\u0110/ng\u00e0y, CAO H\u01a0N m\u1ee9c chu\u1ea9n 1.000.000 VN\u0110/ng\u00e0y. \u0110\u00e2y l\u00e0 d\u1ea5u hi\u1ec7u t\u1ed1t..."
- PH\u00c2N BI\u1ec6T r\u00f5 s\u1ed1 li\u1ec7u t\u1eeb file kh\u00e1ch vs s\u1ed1 li\u1ec7u t\u1eeb t\u00e0i li\u1ec7u m\u1eabu.

KHI KH\u00c1CH H\u1eceI CHUNG (kh\u00f4ng g\u1eedi file):
- D\u00f9ng t\u00e0i li\u1ec7u m\u1eabu l\u00e0m c\u01a1 s\u1edf \u0111\u01b0a gi\u1ea3i ph\u00e1p.
- S\u1ed1 li\u1ec7u H\u0110 (VN\u0110, %, ng\u00e0y): PH\u1ea2I ch\u00ednh x\u00e1c t\u1eeb t\u00e0i li\u1ec7u.
- Ki\u1ebfn th\u1ee9c k\u1ef9 thu\u1eadt (case study): \u0111\u01b0\u1ee3c ph\u00e9p t\u01b0 v\u1ea5n d\u1ef1a tr\u00ean ti\u00eau chu\u1ea9n thi c\u00f4ng.

C\u00c1CH TR\u1ea2 L\u1edcI:
1. \u0110\u01afA GI\u1ea2I PH\u00c1P TR\u1ef0C TI\u1ebePP. KH\u00d4NG li\u1ec7t k\u00ea ki\u1ec3u h\u01b0\u1edbng d\u1eabn.
2. C\u1ea4M d\u00f9ng: "Nh\u1eefng \u0111i\u1ec3m", "\u0110i\u1ec3m h\u1ee3p l\u00fd", "L\u01b0u \u00fd", "Khuy\u1ebfn ngh\u1ecb", "V\u1ec1 m\u1ee9c ph\u1ea1t", "V\u1ec1 thanh to\u00e1n". Thay b\u1eb1ng n\u1ed9i dung tr\u1ef1c ti\u1ebfp.
3. Kh\u00e1ch xin file/m\u1eabu \u2192 "Li\u00ean h\u1ec7 Hotline: ${hotline}".
4. KH\u00d4NG g\u1eedi URL/link. KH\u00d4NG d\u1eabn ngu\u1ed3n.
5. Ph\u00e1p l\u00fd \u2192 Q\u0110 56/2021/Q\u0110-UBND TP.HCM.
6. X\u01b0ng "em", g\u1ecdi "anh/ch\u1ecb". **bold** s\u1ed1 li\u1ec7u. T\u1ed1i \u0111a 400 t\u1eeb.
7. K\u1ebft b\u1eb1ng 1 c\u00e2u h\u1ecfi c\u1ee5 th\u1ec3.
8. SAU N\u1ed8I DUNG: ---FOLLOWUP--- r\u1ed3i 2-3 c\u00e2u h\u1ecfi (- \u0111\u1ea7u d\u00f2ng).`;"""

        code = code[:start] + new_prompt + code[end:]
        node['parameters']['jsCode'] = code
        print("Prompt updated — file khach vs tai lieu mau")

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
