-- ============================================================
-- ChupeteClicker — Limited-time Items
-- ============================================================

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS available_from  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_limited      BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.items.available_from  IS 'NULL = always available';
COMMENT ON COLUMN public.items.available_until IS 'NULL = no expiry';
COMMENT ON COLUMN public.items.is_limited      IS 'Display as limited/exclusive item';
