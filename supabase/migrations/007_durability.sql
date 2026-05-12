-- ============================================================
-- ChupeteClicker — Durability System
-- ============================================================

-- durability: remaining uses, NULL = unbreakable (legacy items)
-- max_durability: total uses when new
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS durability     INTEGER,
  ADD COLUMN IF NOT EXISTS max_durability INTEGER;

-- Click multiplier credits per click for equipped legendary+
-- Stored on profiles to avoid per-click DB joins
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS click_credits_bonus INTEGER NOT NULL DEFAULT 0;
