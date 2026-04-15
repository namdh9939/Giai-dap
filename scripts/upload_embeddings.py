"""
Upload KB chunks với embeddings vào Supabase pgvector.
Dùng OpenAI embeddings API (text-embedding-3-small, 1536 dims).

Usage:
  python scripts/upload_embeddings.py --supabase-url=https://xxx.supabase.co --supabase-key=xxx --openai-key=xxx

Hoặc dùng biến môi trường:
  SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY
"""

import json, os, sys, urllib.request, time

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')  # service_role key
OPENAI_KEY = os.environ.get('OPENAI_API_KEY', '')

# Parse args
for arg in sys.argv[1:]:
    if arg.startswith('--supabase-url='): SUPABASE_URL = arg.split('=',1)[1]
    if arg.startswith('--supabase-key='): SUPABASE_KEY = arg.split('=',1)[1]
    if arg.startswith('--openai-key='): OPENAI_KEY = arg.split('=',1)[1]

if not all([SUPABASE_URL, SUPABASE_KEY, OPENAI_KEY]):
    print("Missing: SUPABASE_URL, SUPABASE_KEY, or OPENAI_API_KEY")
    print("Usage: python scripts/upload_embeddings.py --supabase-url=... --supabase-key=... --openai-key=...")
    sys.exit(1)

# Load all KB files
all_chunks = []
for fn in ['kb_1_hopdong.json','kb_2_baogia.json','kb_3_tieuchuan.json','kb_4_luachon.json','kb_5_phongtuy.json']:
    with open(fn, 'r', encoding='utf-8') as f:
        data = json.load(f)
    all_chunks.extend(data)
    print(f"  {fn}: {len(data)} chunks")
print(f"Total: {len(all_chunks)} chunks")

# Generate embeddings in batches
def get_embeddings(texts, batch_size=20):
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        data = json.dumps({
            "model": "text-embedding-3-small",
            "input": batch
        }).encode()
        req = urllib.request.Request(
            "https://api.openai.com/v1/embeddings",
            data=data,
            headers={
                "Authorization": f"Bearer {OPENAI_KEY}",
                "Content-Type": "application/json"
            }
        )
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
        for item in result['data']:
            all_embeddings.append(item['embedding'])
        print(f"  Embedded {min(i+batch_size, len(texts))}/{len(texts)}")
        time.sleep(0.5)  # Rate limit
    return all_embeddings

# Prepare texts
texts = [c.get('content', '')[:2000] for c in all_chunks]
print("\nGenerating embeddings...")
embeddings = get_embeddings(texts)
print(f"Got {len(embeddings)} embeddings")

# Upload to Supabase
print("\nUploading to Supabase...")
uploaded = 0
errors = 0

for i, (chunk, emb) in enumerate(zip(all_chunks, embeddings)):
    row = {
        "chunk_id": chunk.get('id', f'chunk_{i}'),
        "topic": chunk.get('_topic', ''),
        "section": chunk.get('_section', ''),
        "source": chunk.get('source', ''),
        "page": chunk.get('page', 0),
        "content": chunk.get('content', ''),
        "keywords": chunk.get('keywords', []),
        "embedding": emb
    }

    data = json.dumps(row).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/kb_chunks",
        data=data,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            uploaded += 1
    except urllib.error.HTTPError as e:
        errors += 1
        if errors <= 3:
            print(f"  Error {i}: {e.read().decode()[:200]}")

    if (i+1) % 50 == 0:
        print(f"  Uploaded {i+1}/{len(all_chunks)}")

print(f"\nDone: {uploaded} uploaded, {errors} errors")
