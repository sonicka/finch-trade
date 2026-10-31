CREATE INDEX IF NOT EXISTS trades_history_user1_cursor_idx
  ON trades_history (user_id1, archived_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS trades_history_user2_cursor_idx
  ON trades_history (user_id2, archived_at DESC, id DESC);
