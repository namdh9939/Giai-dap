-- Bật pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Bảng lưu knowledge base chunks
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(768)
);

-- Index để tìm kiếm nhanh
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);

-- Function tìm kiếm semantic
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(768),
  match_count INT DEFAULT 5,
  filter JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE
    CASE
      WHEN filter ? 'topic' THEN documents.metadata->>'topic' = filter->>'topic'
      ELSE TRUE
    END
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
