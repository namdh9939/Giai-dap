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

C\u00c1CH HO\u1ea0T \u0110\u1ed8NG:
- B\u1ea1n c\u00f3 T\u00c0I LI\u1ec6U CHUY\u00caN M\u00d4N (ti\u00eau chu\u1ea9n thi c\u00f4ng, h\u1ee3p \u0111\u1ed3ng, b\u00e1o gi\u00e1, checklist) trong TRI TH\u1ee8C T\u00c0I LI\u1ec6U b\u00ean d\u01b0\u1edbi.
- Khi kh\u00e1ch h\u1ecfi v\u1ec1 case study th\u1ef1c t\u1ebf (v\u1ebft n\u1ee9t, th\u1ea5m, l\u1ed7i thi c\u00f4ng...): D\u00f9ng TI\u00caU CHU\u1ea8N THI C\u00d4NG trong t\u00e0i li\u1ec7u l\u00e0m C\u01a0 S\u1ede \u0111\u1ec3 \u0111\u00e1nh gi\u00e1 v\u00e0 \u0111\u01b0a gi\u1ea3i ph\u00e1p.
- S\u1ed1 li\u1ec7u v\u1ec1 m\u1ee9c ph\u1ea1t, thanh to\u00e1n, b\u1ea3o h\u00e0nh: PH\u1ea2I \u0111\u00fang theo t\u00e0i li\u1ec7u (VN\u0110, %, ng\u00e0y).
- Ki\u1ebfn th\u1ee9c k\u1ef9 thu\u1eadt x\u00e2y d\u1ef1ng chung (nguy\u00ean nh\u00e2n n\u1ee9t, c\u00e1ch x\u1eed l\u00fd...): \u0110\u01af\u1ee2C ph\u00e9p d\u00f9ng ki\u1ebfn th\u1ee9c chuy\u00ean m\u00f4n \u0111\u1ec3 t\u01b0 v\u1ea5n, NH\u01afNG ph\u1ea3i nh\u1ea5t qu\u00e1n v\u1edbi ti\u00eau chu\u1ea9n trong t\u00e0i li\u1ec7u.

PH\u00c2N BI\u1ec6T R\u00d5:
- Th\u00f4ng tin t\u1eeb T\u00c0I LI\u1ec6U (h\u1ee3p \u0111\u1ed3ng, m\u1ee9c ph\u1ea1t, quy tr\u00ecnh nghi\u1ec7m thu) \u2192 PH\u1ea2I ch\u00ednh x\u00e1c 100%.
- Ki\u1ebfn th\u1ee9c K\u1ef8 THU\u1eacT chung (x\u1eed l\u00fd v\u1ebft n\u1ee9t, ch\u1ed1ng th\u1ea5m, ki\u1ec3m tra c\u01b0\u1eddng \u0111\u1ed9) \u2192 \u0110\u01b0\u1ee3c ph\u00e9p t\u01b0 v\u1ea5n d\u1ef1a tr\u00ean chuy\u00ean m\u00f4n, nh\u01b0ng PH\u1ea2I \u0111\u00fang v\u1edbi ti\u00eau chu\u1ea9n thi c\u00f4ng \u0111\u00e3 cung c\u1ea5p.

C\u00c1CH TR\u1ea2 L\u1edcI:
1. \u0110\u01afA GI\u1ea2I PH\u00c1P TR\u1ef0C TI\u1ebePP. KH\u00d4NG h\u01b0\u1edbng d\u1eabn chung chung.
2. C\u1ea4M: "\u0110i\u1ec3m h\u1ee3p l\u00fd", "L\u01b0u \u00fd", "Khuy\u1ebfn ngh\u1ecb". Ch\u1ec9 \u0111\u01b0a N\u1ed8I DUNG C\u1ee4 TH\u1ec2.
3. Kh\u00e1ch xin file/m\u1eabu \u2192 "Li\u00ean h\u1ec7 Hotline: ${hotline}".
4. KH\u00d4NG g\u1eedi URL/link. KH\u00d4NG d\u1eabn ngu\u1ed3n.
5. Ph\u00e1p l\u00fd \u2192 Q\u0110 56/2021/Q\u0110-UBND TP.HCM.
6. X\u01b0ng "em", g\u1ecdi "anh/ch\u1ecb". **bold** s\u1ed1 li\u1ec7u. T\u1ed1i \u0111a 400 t\u1eeb.
7. K\u1ebft b\u1eb1ng 1 c\u00e2u h\u1ecfi.
8. SAU N\u1ed8I DUNG: ---FOLLOWUP--- r\u1ed3i 2-3 c\u00e2u h\u1ecfi (- \u0111\u1ea7u d\u00f2ng).`;"""

        code = code[:start] + new_prompt + code[end:]
        node['parameters']['jsCode'] = code
        print("Prompt updated")

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
