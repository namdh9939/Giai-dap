import json, urllib.request

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWNkMWFlZC05Mzk0LTQyN2UtODE5My1mMGY3Y2NjMWRhZjUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTQxZDYxNWQtYzk2My00ZDRhLWI3NGQtYTYxMzQ0MDVjZGEwIiwiaWF0IjoxNzc2MjIzOTM2fQ.hZwMNBHi4h8-wXSRh-46goXAHcJ0kN46y129SKDzKyA"
BASE = "https://nhacuaminh.com/api/v1"
WF_ID = "OmgWbuZEQxOXdwQ3"

req = urllib.request.Request(f"{BASE}/workflows/{WF_ID}", headers={"X-N8N-API-KEY": API_KEY})
with urllib.request.urlopen(req) as resp:
    wf = json.loads(resp.read())

# Get Claude key
CLAUDE_KEY = ''
for node in wf['nodes']:
    if 'Claude' in node['name']:
        for p in node.get('parameters',{}).get('headerParameters',{}).get('parameters',[]):
            if p['name'] == 'x-api-key' and len(p['value']) > 20:
                CLAUDE_KEY = p['value']
print(f"Claude key: {'found' if CLAUDE_KEY else 'NOT FOUND'}")

# Update Claude node — add prompt caching + anthropic-beta header
for node in wf['nodes']:
    if 'Claude' in node['name']:
        headers = node['parameters']['headerParameters']['parameters']

        # Add anthropic-beta header for prompt caching
        has_beta = any(h['name'] == 'anthropic-beta' for h in headers)
        if not has_beta:
            headers.append({"name": "anthropic-beta", "value": "prompt-caching-2024-07-31"})
            print("Added anthropic-beta header for prompt caching")

        # Update JSON body to use cache_control on system prompt
        node['parameters']['jsonBody'] = '={\n  "model": "claude-sonnet-4-20250514",\n  "max_tokens": 1500,\n  "system": [{"type": "text", "text": {{ JSON.stringify($json.systemPrompt) }}, "cache_control": {"type": "ephemeral"}}],\n  "messages": {{ JSON.stringify($json.messages) }}\n}'
        print("Updated Claude body with cache_control on system prompt")

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
        print(f"Updated, active: {json.loads(resp.read())['active']}")
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode('utf-8','replace')[:300]}")
