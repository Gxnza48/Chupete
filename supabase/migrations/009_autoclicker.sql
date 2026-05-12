-- ============================================================
-- ChupeteClicker — Autoclicker System
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS autoclicker_until        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS autoclicker_last_claimed TIMESTAMPTZ;

-- Autoclicker rate: clicks per second while active (1 by default)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS autoclicker_rate INTEGER NOT NULL DEFAULT 1;
