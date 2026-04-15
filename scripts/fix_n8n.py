import json, urllib.request

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWNkMWFlZC05Mzk0LTQyN2UtODE5My1mMGY3Y2NjMWRhZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTQxZDYxNWQtYzk2My00ZDRhLWI3NGQtYTYxMzQ0MDVjZGEwIiwiaWF0IjoxNzc2MjIzOTM2fQ.hZwMNBHi4h8-wXSRh-46goXAHcJ0kN46y129SKDzKyA"
BASE = "https://nhacuaminh.com/api/v1"
WF_ID = "OmgWbuZEQxOXdwQ3"

req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}", headers={"X-N8N-API-KEY": API_KEY})
with urllib.request.urlopen(req) as resp:
    wf = json.loads(resp.read())

for node in wf['nodes']:
    if node['name'] == '3. Search Context':
        code = node['parameters']['jsCode']
        code = code.replace(
            "const query = webhook.query || '';",
            "const query = String(webhook.query || '');"
        )
        code = code.replace(
            "const topic = webhook.topic || '';",
            "const topic = String(webhook.topic || '');"
        )
        code = code.replace(
            "const history = webhook.history || '';",
            "const history = String(webhook.history || '');"
        )
        node['parameters']['jsCode'] = code
        print("Fixed Search Context")

# Minimal update payload — only allowed settings fields
settings = {"executionOrder": "v1"}
update = json.dumps({
    "name": wf["name"],
    "nodes": wf["nodes"],
    "connections": wf["connections"],
    "settings": settings
}).encode('utf-8')

req = urllib.request.Request(
    f"{BASE}/workflows/{WF_ID}",
    data=update,
    headers={"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"},
    method="PUT"
)
try:
    with urllib.request.urlopen(req) as resp:
        r = json.loads(resp.read())
        print(f"Updated, active: {r['active']}")
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode()[:300]}")
