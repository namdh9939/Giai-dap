import json, urllib.request

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWNkMWFlZC05Mzk0LTQyN2UtODE5My1mMGY3Y2NjMWRhZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTQxZDYxNWQtYzk2My00ZDRhLWI3NGQtYTYxMzQ0MDVjZGEwIiwiaWF0IjoxNzc2MjIzOTM2fQ.hZwMNBHi4h8-wXSRh-46goXAHcJ0kN46y129SKDzKyA"
BASE = "https://nhacuaminh.com/api/v1"
WF_ID = "OmgWbuZEQxOXdwQ3"

# Fetch node 5 Extract Answer — add post-processing to remove banned phrases
req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}", headers={"X-N8N-API-KEY": API_KEY})
with urllib.request.urlopen(req) as resp:
    wf = json.loads(resp.read())

for node in wf['nodes']:
    if node['name'] == '5. Save Memory + Extract':
        code = node['parameters']['jsCode']
        # Add cleanup after extracting answer
        old = "return [{ json: { answer, docLinks: promptData.docLinks || [] } }];"
        new = """// Cleanup banned phrases
answer = answer.replace(/\\*\\*C\\u1ea6N L\\u01afU \\u00dd[^*]*\\*\\*/gi, '');
answer = answer.replace(/\\*\\*NH\\u1eeeNG \\u0110I\\u1ec2M[^*]*\\*\\*/gi, '');
answer = answer.replace(/\\*\\*\\u0110I\\u1ec2M H\\u1ee2P L\\u00dd[^*]*\\*\\*/gi, '');
answer = answer.replace(/\\*\\*KHUY\\u1ebaN NGH\\u1eca[^*]*\\*\\*/gi, '');

return [{ json: { answer, docLinks: promptData.docLinks || [] } }];"""
        code = code.replace(old, new)
        node['parameters']['jsCode'] = code
        print("Added post-processing to remove banned phrases")

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
