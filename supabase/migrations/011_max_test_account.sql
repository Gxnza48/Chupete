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
