-- ============================================================
-- ChupeteClicker — Leaderboard Functions
-- ============================================================

-- Top collectors: total inventory value per user
CREATE OR REPLACE FUNCTION get_top_collectors(lim INTEGER DEFAULT 10)
RETURNS TABLE(user_id UUID, username TEXT, avatar_url TEXT, level INTEGER, total_value BIGINT)
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT p.id, p.username, p.avatar_url, p.level,
    COALESCE(SUM(it.base_price_ars)::BIGINT, 0) AS total_value
  FROM profiles p
  LEFT JOIN inventory inv ON inv.user_id = p.id
  LEFT JOIN items it ON it.id = inv.item_id
  GROUP BY p.id, p.username, p.avatar_url, p.level
  ORDER BY total_value DESC
  LIMIT lim;
$$;

-- Top traders: total sales volume (credit_transactions reason='sale')
CREATE OR REPLACE FUNCTION get_top_traders(lim INTEGER DEFAULT 10)
RETURNS TABLE(user_id UUID, username TEXT, avatar_url TEXT, level INTEGER, total_volume BIGINT, trade_count BIGINT)
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT p.id, p.username, p.avatar_url, p.level,
    COALESCE(SUM(ct.amount)::BIGINT, 0) AS total_volume,
    COUNT(ct.id)::BIGINT AS trade_count
  FROM profiles p
  JOIN credit_transactions ct ON ct.user_id = p.id AND ct.reason = 'sale'
  GROUP BY p.id, p.username, p.avatar_url, p.level
  HAVING COUNT(ct.id) > 0
  ORDER BY total_volume DESC
  LIMIT lim;
$$;

GRANT EXECUTE ON FUNCTION get_top_collectors TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_top_traders TO anon, authenticated;
