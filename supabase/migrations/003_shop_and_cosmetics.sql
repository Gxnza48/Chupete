-- ============================================================
-- ChupeteClicker — Shop, Cosmetics & Profile Customization
-- ============================================================

-- ============================================================
-- PROFILES: new cosmetic columns
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_color    TEXT,
  ADD COLUMN IF NOT EXISTS username_color  TEXT;

-- ============================================================
-- INVENTORY: item personalization columns
-- ============================================================

ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS show_in_profile  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nickname         TEXT,
  ADD COLUMN IF NOT EXISTS nickname_bold    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nickname_italic  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nickname_color   TEXT;

-- ============================================================
-- SHOP_ITEMS (catalog of purchasable cosmetics)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shop_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key            TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  description    TEXT,
  type           TEXT NOT NULL CHECK (type IN ('charm', 'frame')),
  icon           TEXT NOT NULL,
  price_credits  INTEGER NOT NULL CHECK (price_credits > 0)
);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shop_items_select_all" ON public.shop_items;
CREATE POLICY "shop_items_select_all" ON public.shop_items FOR SELECT USING (true);

-- ============================================================
-- PROFILE_COSMETICS (user purchases)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profile_cosmetics (
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shop_item_id  UUID NOT NULL REFERENCES public.shop_items(id),
  equipped      BOOLEAN NOT NULL DEFAULT false,
  purchased_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, shop_item_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_cosmetics_user_id ON public.profile_cosmetics(user_id);

ALTER TABLE public.profile_cosmetics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profile_cosmetics_select_all" ON public.profile_cosmetics;
DROP POLICY IF EXISTS "profile_cosmetics_insert_own" ON public.profile_cosmetics;
DROP POLICY IF EXISTS "profile_cosmetics_update_own" ON public.profile_cosmetics;
DROP POLICY IF EXISTS "profile_cosmetics_delete_own" ON public.profile_cosmetics;
CREATE POLICY "profile_cosmetics_select_all"  ON public.profile_cosmetics FOR SELECT USING (true);
CREATE POLICY "profile_cosmetics_insert_own"  ON public.profile_cosmetics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profile_cosmetics_update_own"  ON public.profile_cosmetics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profile_cosmetics_delete_own"  ON public.profile_cosmetics FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FIX: drops RLS — allow public read for global live feed
-- ============================================================

DROP POLICY IF EXISTS "drops_select_own" ON public.drops;
DROP POLICY IF EXISTS "drops_select_all" ON public.drops;
CREATE POLICY "drops_select_all" ON public.drops FOR SELECT USING (true);

-- ============================================================
-- SEED: shop items
-- ============================================================

INSERT INTO public.shop_items (key, name, description, type, icon, price_credits) VALUES
  -- Frames
  ('frame_gold',  'Marco Dorado',    'Un marco brillante de oro. Para los que llegaron lejos.',            'frame', 'gold',  5000),
  ('frame_neon',  'Marco Neón',      'Verde eléctrico. Para los que juegan de noche.',                     'frame', 'neon',  3000),
  ('frame_void',  'Marco Void',      'Oscuro y misterioso. El vacío te envuelve.',                         'frame', 'void',  8000),

  -- Charms
  ('charm_mate',       'Mate',            'El ritual sagrado. Que nunca te falte.',                        'charm', '🧉',    500),
  ('charm_tango',      'Bandoneón',       'La música del alma porteña.',                                   'charm', '🎵',    500),
  ('charm_asado',      'Asado',           'Fuego, carne, amistad.',                                        'charm', '🔥',    500),
  ('charm_pibe',       'Pelota',          'El deporte de todos. La pasión nacional.',                      'charm', '⚽',    750),
  ('charm_luna',       'Luna',            'Para los que clickean de madrugada.',                           'charm', '🌙',    750),
  ('charm_estrella',   'Estrella',        'Brillas entre todos.',                                          'charm', '⭐',    750),
  ('charm_rayo',       'Rayo',            'Velocidad pura. Clickeás sin parar.',                           'charm', '⚡',    1000),
  ('charm_corona',     'Corona',          'La realeza del clicker.',                                       'charm', '👑',    2000),
  ('charm_diamante',   'Diamante',        'Duro e irrompible, como vos.',                                  'charm', '💎',    3000),
  ('charm_ort',        'El Chupete Ort',  'Solo los elegidos lo llevan. Rarísimo.',                        'charm', '🏆',    9999)
ON CONFLICT (key) DO NOTHING;
