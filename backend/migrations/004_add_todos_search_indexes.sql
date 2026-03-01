CREATE INDEX IF NOT EXISTS idx_todos_user_created_id ON todos (user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_todos_tags_gin ON todos USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_todos_search_tsv ON todos USING GIN (
  to_tsvector('simple', title || ' ' || description)
);
