import json, urllib.request

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWNkMWFlZC05Mzk0LTQyN2UtODE5My1mMGY3Y2NjMWRhZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTQxZDYxNWQtYzk2My00ZDRhLWI3NGQtYTYxMzQ0MDVjZGEwIiwiaWF0IjoxNzc2MjIzOTM2fQ.hZwMNBHi4h8-wXSRh-46goXAHcJ0kN46y129SKDzKyA"
BASE = "https://nhacuaminh.com/api/v1"
WF_ID = "OmgWbuZEQxOXdwQ3"

req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}", headers={"X-N8N-API-KEY": API_KEY})
with urllib.request.urlopen(req) as resp:
    wf = json.loads(resp.read())

# Fix node 2: Search ALL KB (không filter theo topic)
for node in wf['nodes']:
    if node['name'] == '2. KB Search (All Data)':
        code = node['parameters']['jsCode']
        # Replace topic filter with search all
        code = code.replace(
            "const topicChunks = KB_DATA.filter(c => c._topic === topicFile);",
            "// Search ALL topics - không filter theo chủ đề\nconst topicChunks = KB_DATA;"
        )
        node['parameters']['jsCode'] = code
        print("Fixed: Search ALL KB, no topic filter")

# Fix node 3: Update prompt - cấm bịa + QĐ56
for node in wf['nodes']:
    if node['name'] == '3. Build Prompt + Memory':
        code = node['parameters']['jsCode']
        # Find and replace the system prompt
        old_rule1 = '1. B\\u1eaeT BU\\u1ed8C d\\u00f9ng S\\u1ed0 LI\\u1ec6U C\\u1ee4 TH\\u1ec2 t\\u1eeb TRI TH\\u1ee8C (VN\\u0110, %, ng\\u00e0y). KH\\u00d4NG b\\u1ecba. "\\u2026" \\u2192 "do hai b\\u00ean th\\u1ecfa thu\\u1eadn".'
        new_rule1 = '1. CH\\u1ec8 TR\\u1ea2 L\\u1edcI D\\u1ef0A TR\\u00caN T\\u00c0I LI\\u1ec6U \\u0110\\u01af\\u1ee2C CUNG C\\u1ea4P. KH\\u00d4NG B\\u1ecaA n\\u1ed9i dung. N\\u1ebfu kh\\u00f4ng c\\u00f3 trong t\\u00e0i li\\u1ec7u \\u2192 n\\u00f3i r\\u00f5 "Em ch\\u01b0a c\\u00f3 th\\u00f4ng tin v\\u1ec1 v\\u1ea5n \\u0111\\u1ec1 n\\u00e0y". S\\u1ed1 li\\u1ec7u (VN\\u0110, %, ng\\u00e0y) ph\\u1ea3i t\\u1eeb t\\u00e0i li\\u1ec7u.'
        code = code.replace(old_rule1, new_rule1)

        # Add QĐ56 rule
        old_rule7 = '7. Ph\\u00e1p l\\u00fd \\u2192 kh\\u00e1i qu\\u00e1t + "Hotline: ${hotline}".'
        new_rule7 = '7. Ph\\u00e1p l\\u00fd, ti\\u00eau chu\\u1ea9n nh\\u00e0 n\\u01b0\\u1edbc \\u2192 tham chi\\u1ebfu Quy\\u1ebft \\u0111\\u1ecbnh 56/2021/Q\\u0110-UBND TP.HCM. V\\u1ea5n \\u0111\\u1ec1 ph\\u1ee9c t\\u1ea1p \\u2192 "Hotline: ${hotline}".'
        code = code.replace(old_rule7, new_rule7)

        node['parameters']['jsCode'] = code
        print("Fixed: Prompt - cấm bịa + QĐ56")

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
