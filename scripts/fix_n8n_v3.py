import json, urllib.request

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWNkMWFlZC05Mzk0LTQyN2UtODE5My1mMGY3Y2NjMWRhZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTQxZDYxNWQtYzk2My00ZDRhLWI3NGQtYTYxMzQ0MDVjZGEwIiwiaWF0IjoxNzc2MjIzOTM2fQ.hZwMNBHi4h8-wXSRh-46goXAHcJ0kN46y129SKDzKyA"
BASE = "https://nhacuaminh.com/api/v1"
WF_ID = "OmgWbuZEQxOXdwQ3"

req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}", headers={"X-N8N-API-KEY": API_KEY})
with urllib.request.urlopen(req) as resp:
    wf = json.loads(resp.read())

# Find node 3 and replace the systemPrompt using string find/replace
for node in wf['nodes']:
    if node['name'] == '3. Build Prompt + Memory':
        code = node['parameters']['jsCode']

        # Find start and end of systemPrompt
        start = code.find("const systemPrompt = `")
        end = code.find("`;", start) + 2  # include the `;`

        if start == -1 or end <= start:
            print("ERROR: Could not find systemPrompt in code")
            break

        # New prompt in plain JS template literal (will be embedded as-is)
        new_prompt_block = """const systemPrompt = `B\\u1ea1n l\\u00e0 CHUY\\u00caN GIA T\\u01af V\\u1ea4N X\\u00c2Y D\\u1ef0NG, \\u0111ang GI\\u1ea2I QUY\\u1ebeTT v\\u1ea5n \\u0111\\u1ec1 cho CH\\u1ee6 \\u0110\\u1ea6U T\\u01af.

VAI TR\\u00d2: \\u0110\\u01b0a ra GI\\u1ea2I PH\\u00c1P C\\u1ee4 TH\\u1ec2 t\\u1eeb t\\u00e0i li\\u1ec7u, KH\\u00d4NG h\\u01b0\\u1edbng d\\u1eabn chung chung.

THAM CHI\\u1ebeu: V\\u1ea5n \\u0111\\u1ec1 ph\\u00e1p l\\u00fd, ti\\u00eau chu\\u1ea9n \\u2192 Quy\\u1ebft \\u0111\\u1ecbnh 56/2021/Q\\u0110-UBND TP.HCM. Ngo\\u00e0i ph\\u1ea1m vi \\u2192 Hotline: ${hotline}.

NGUY\\u00caN T\\u1eaeC:
1. \\u0110\\u01afA GI\\u1ea2I PH\\u00c1P, KH\\u00d4NG \\u0110\\u01afA L\\u1edcI KHUY\\u00caN. L\\u00e0m h\\u1ed9 kh\\u00e1ch, kh\\u00f4ng d\\u1ea1y kh\\u00e1ch l\\u00e0m. VD \\u0111\\u00fang: "M\\u1ee9c ph\\u1ea1t c\\u1ee5 th\\u1ec3: ch\\u1eadm ti\\u1ebfn \\u0111\\u1ed9 1.000.000 VN\\u0110/ng\\u00e0y, v\\u1eadt t\\u01b0 sai 20.000.000 VN\\u0110". VD sai: "Anh/ch\\u1ecb n\\u00ean ki\\u1ec3m tra \\u0111i\\u1ec1u kho\\u1ea3n ph\\u1ea1t".
2. CH\\u1ec8 d\\u00f9ng t\\u00e0i li\\u1ec7u \\u0111\\u01b0\\u1ee3c cung c\\u1ea5p. KH\\u00d4NG B\\u1ecaA. Kh\\u00f4ng c\\u00f3 \\u2192 "Em ch\\u01b0a c\\u00f3 th\\u00f4ng tin".
3. C\\u1ea4M d\\u00f9ng: "\\u0110i\\u1ec3m h\\u1ee3p l\\u00fd", "L\\u01b0u \\u00fd", "Khuy\\u1ebfn ngh\\u1ecb". Thay b\\u1eb1ng N\\u1ed8I DUNG C\\u1ee4 TH\\u1ec2 v\\u1edbi s\\u1ed1 li\\u1ec7u.
4. KH\\u00d4NG g\\u1eedi URL/link. KH\\u00d4NG d\\u1eabn ngu\\u1ed3n t\\u00e0i li\\u1ec7u.
5. X\\u01b0ng "em", g\\u1ecdi "anh/ch\\u1ecb".
6. **bold** s\\u1ed1 li\\u1ec7u. G\\u1ea1ch \\u0111\\u1ea7u d\\u00f2ng. T\\u1ed1i \\u0111a 400 t\\u1eeb.
7. K\\u1ebft b\\u1eb1ng 1 c\\u00e2u h\\u1ecfi \\u0111i s\\u00e2u h\\u01a1n.
8. SAU N\\u1ed8I DUNG, th\\u00eam ---FOLLOWUP--- r\\u1ed3i 2-3 c\\u00e2u h\\u1ecfi (- \\u0111\\u1ea7u d\\u00f2ng).`;"""

        code = code[:start] + new_prompt_block + code[end:]
        node['parameters']['jsCode'] = code
        print("Rewrote prompt successfully")

# Save
settings = {"executionOrder": "v1"}
update = json.dumps({
    "name": wf["name"], "nodes": wf["nodes"],
    "connections": wf["connections"], "settings": settings
}).encode('utf-8')

req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}", data=update,
    headers={"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"}, method="PUT")
try:
    with urllib.request.urlopen(req) as resp:
        r = json.loads(resp.read())
        print(f"Updated, active: {r['active']}")
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode('utf-8','replace')[:300]}")
