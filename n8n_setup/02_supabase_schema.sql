-- Run this in Supabase SQL Editor

-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Table for KB chunks with embeddings
CREATE TABLE IF NOT EXISTS kb_chunks (
  id BIGSERIAL PRIMARY KEY,
  chunk_id TEXT UNIQUE NOT NULL,
  topic TEXT NOT NULL,
  section TEXT,
  source TEXT,
  page INTEGER,
  content TEXT NOT NULL,
  keywords TEXT[],
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Index for fast vector search
CREATE INDEX IF NOT EXISTS kb_chunks_embedding_idx
ON kb_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 20);

-- 4. Index for topic filter
CREATE INDEX IF NOT EXISTS kb_chunks_topic_idx ON kb_chunks (topic);

-- 5. Function: semantic search within a topic
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding VECTOR(1536),
  match_topic TEXT DEFAULT NULL,
  match_count INT DEFAULT 8
)
RETURNS TABLE (
  id BIGINT,
  chunk_id TEXT,
  topic TEXT,
  section TEXT,
  source TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb_chunks.id,
    kb_chunks.chunk_id,
    kb_chunks.topic,
    kb_chunks.section,
    kb_chunks.source,
    kb_chunks.content,
    1 - (kb_chunks.embedding <=> query_embedding) AS similarity
  FROM kb_chunks
  WHERE
    CASE
      WHEN match_topic IS NOT NULL AND match_topic != '' THEN kb_chunks.topic = match_topic
      ELSE TRUE
    END
  ORDER BY kb_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
