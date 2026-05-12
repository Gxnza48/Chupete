-- ============================================================
-- ChupeteClicker — Max out test account (Gonzalo / owner)
-- Busca el usuario por email y aplica todo dinámicamente.
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar el usuario por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'gonzalobonadeo07@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado con ese email.';
  END IF;

  -- ── Maxear perfil ──────────────────────────────────────────
  UPDATE public.profiles SET
    level        = 100,
    xp           = 300000,
    total_clicks = 100000,
    credits      = 5000000
  WHERE id = v_user_id;

  -- ── Todos los badges ───────────────────────────────────────
  INSERT INTO public.user_badges (user_id, badge_id)
  SELECT v_user_id, b.id
  FROM public.badges b
  ON CONFLICT DO NOTHING;

  -- ── Todos los items que no tiene ──────────────────────────
  INSERT INTO public.inventory
    (user_id, item_id, float_value, is_listed, show_in_profile, durability, max_durability)
  SELECT
    v_user_id,
    sub.item_id,
    sub.fv,
    false,
    false,
    CASE
      WHEN sub.fv < 0.07 THEN 5000
      WHEN sub.fv < 0.15 THEN 3000
      WHEN sub.fv < 0.38 THEN 1500
      WHEN sub.fv < 0.45 THEN 800
      ELSE 300
    END,
    CASE
      WHEN sub.fv < 0.07 THEN 5000
      WHEN sub.fv < 0.15 THEN 3000
      WHEN sub.fv < 0.38 THEN 1500
      WHEN sub.fv < 0.45 THEN 800
      ELSE 300
    END
  FROM (
    SELECT i.id AS item_id, random() AS fv
    FROM public.items i
    WHERE i.id NOT IN (
      SELECT item_id FROM public.inventory WHERE user_id = v_user_id
    )
  ) sub;

  RAISE NOTICE 'Listo! Usuario % maxeado.', v_user_id;
END $$;
