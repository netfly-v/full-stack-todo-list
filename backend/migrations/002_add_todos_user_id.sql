ALTER TABLE todos
ADD COLUMN user_id INTEGER NOT NULL;

ALTER TABLE todos
ADD CONSTRAINT todos_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX todos_user_id_idx ON todos(user_id);
