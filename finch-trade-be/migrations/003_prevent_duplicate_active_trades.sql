CREATE UNIQUE INDEX IF NOT EXISTS active_trades_user_pair_idx
ON trades (LEAST(user_id1, user_id2), GREATEST(user_id1, user_id2))
WHERE status IN ('pending', 'confirmed');