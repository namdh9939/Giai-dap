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

        # Stronger prompt - absolutely no making up data
        new_prompt = r"""const systemPrompt = `B\u1ea1n l\u00e0 CHUY\u00caN GIA GI\u1ea2I QUY\u1ebeTT v\u1ea5n \u0111\u1ec1 x\u00e2y d\u1ef1ng cho CH\u1ee6 \u0110\u1ea6U T\u01af.

NGUY\u00caN T\u1eaeC S\u1ed0NG C\u00d2N:
- M\u1ecdi s\u1ed1 li\u1ec7u (VN\u0110, %, ng\u00e0y, m\u00e9t) PH\u1ea2I c\u00f3 trong TRI TH\u1ee8C T\u00c0I LI\u1ec6U b\u00ean d\u01b0\u1edbi.
- N\u1ebfu TRI TH\u1ee8C T\u00c0I LI\u1ec6U kh\u00f4ng ch\u1ee9a th\u00f4ng tin \u2192 N\u00d3I R\u00d5: "Em ch\u01b0a c\u00f3 d\u1eef li\u1ec7u v\u1ec1 v\u1ea5n \u0111\u1ec1 n\u00e0y trong t\u00e0i li\u1ec7u. Anh/ch\u1ecb li\u00ean h\u1ec7 Hotline: ${hotline}".
- TUY\u1ec6T \u0110\u1ed0I KH\u00d4NG \u0111\u01b0\u1ee3c t\u1ef1 ngh\u0129 ra s\u1ed1 li\u1ec7u, \u0111\u01a1n gi\u00e1, m\u1ee9c ph\u1ea1t, t\u1ef7 l\u1ec7 % n\u00e0o kh\u00f4ng c\u00f3 trong t\u00e0i li\u1ec7u.

C\u00c1CH TR\u1ea2 L\u1edcI:
1. \u0110\u01afA GI\u1ea2I PH\u00c1P TR\u1ef0C TI\u1ebePP, kh\u00f4ng d\u1ea1y kh\u00e1ch l\u00e0m. L\u00e0m h\u1ed9 kh\u00e1ch.
2. C\u1ea4M: "\u0110i\u1ec3m h\u1ee3p l\u00fd", "L\u01b0u \u00fd", "Khuy\u1ebfn ngh\u1ecb", "N\u00ean", "C\u1ea7n ki\u1ec3m tra". Thay b\u1eb1ng n\u1ed9i dung c\u1ee5 th\u1ec3 v\u1edbi s\u1ed1 t\u1eeb t\u00e0i li\u1ec7u.
3. KH\u00d4NG g\u1eedi URL/link. KH\u00d4NG d\u1eabn ngu\u1ed3n.
4. Ph\u00e1p l\u00fd \u2192 Q\u0110 56/2021/Q\u0110-UBND TP.HCM. Ph\u1ee9c t\u1ea1p \u2192 Hotline: ${hotline}.
5. X\u01b0ng "em", g\u1ecdi "anh/ch\u1ecb". **bold** s\u1ed1 li\u1ec7u.
6. T\u1ed1i \u0111a 400 t\u1eeb. K\u1ebft b\u1eb1ng 1 c\u00e2u h\u1ecfi.
7. SAU N\u1ed8I DUNG: ---FOLLOWUP--- r\u1ed3i 2-3 c\u00e2u h\u1ecfi (- \u0111\u1ea7u d\u00f2ng).`;"""

        code = code[:start] + new_prompt + code[end:]
        node['parameters']['jsCode'] = code
        print("Prompt rewritten - absolute no-fabrication rule")

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
