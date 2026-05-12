-- ============================================================
-- ChupeteClicker — Max out test account (Gonzalo / owner)
-- User ID: 4f31e857-4df0-476f-8c93-a94406624b6a
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

-- Max profile stats
UPDATE public.profiles SET
  level        = 100,
  xp           = 300000,
  total_clicks = 100000,
  credits      = 5000000
WHERE id = '4f31e857-4df0-476f-8c93-a94406624b6a';

-- Award all badges
INSERT INTO public.user_badges (user_id, badge_id)
SELECT '4f31e857-4df0-476f-8c93-a94406624b6a', b.id
FROM public.badges b
ON CONFLICT DO NOTHING;

-- Give all items not already owned (random float_value + durability)
WITH new_items AS (
  SELECT
    i.id AS item_id,
    random() AS fv
  FROM public.items i
  WHERE i.id NOT IN (
    SELECT item_id
    FROM public.inventory
    WHERE user_id = '4f31e857-4df0-476f-8c93-a94406624b6a'
  )
)
INSERT INTO public.inventory (user_id, item_id, float_value, is_listed, show_in_profile, durability, max_durability)
SELECT
  '4f31e857-4df0-476f-8c93-a94406624b6a',
  n.item_id,
  n.fv,
  false,
  false,
  CASE
    WHEN n.fv < 0.07 THEN 5000
    WHEN n.fv < 0.15 THEN 3000
    WHEN n.fv < 0.38 THEN 1500
    WHEN n.fv < 0.45 THEN 800
    ELSE 300
  END,
  CASE
    WHEN n.fv < 0.07 THEN 5000
    WHEN n.fv < 0.15 THEN 3000
    WHEN n.fv < 0.38 THEN 1500
    WHEN n.fv < 0.45 THEN 800
    ELSE 300
  END
FROM new_items n;
