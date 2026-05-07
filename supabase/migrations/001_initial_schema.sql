-- ============================================================
-- ChupeteClicker — Initial Schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE rarity_type AS ENUM (
  'comun',
  'poco_comun',
  'medio_raro',
  'raro',
  'ultra_raro',
  'legendario',
  'extraterrestre',
  'en_el_ort'
);

CREATE TYPE listing_status AS ENUM ('active', 'sold', 'cancelled');

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT NOT NULL UNIQUE,
  avatar_url    TEXT,
  level         INTEGER NOT NULL DEFAULT 1,
  xp            INTEGER NOT NULL DEFAULT 0,
  total_clicks  INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT username_length CHECK (char_length(username) BETWEEN 3 AND 24),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_\-]+$')
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _username TEXT;
BEGIN
  _username := COALESCE(
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1)
  );

  -- Ensure uniqueness with suffix if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) LOOP
    _username := _username || floor(random() * 1000)::text;
  END LOOP;

  INSERT INTO public.profiles (id, username)
  VALUES (new.id, _username);

  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at automatically
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ITEMS (catalog)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  rarity           rarity_type NOT NULL,
  description      TEXT,
  image_url        TEXT NOT NULL DEFAULT '',
  base_price_ars   INTEGER NOT NULL DEFAULT 100,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INVENTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS public.inventory (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id      UUID NOT NULL REFERENCES public.items(id),
  float_value  DOUBLE PRECISION NOT NULL CHECK (float_value >= 0 AND float_value <= 1),
  obtained_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_listed    BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_inventory_user_id ON public.inventory(user_id);
CREATE INDEX idx_inventory_item_id ON public.inventory(item_id);

-- ============================================================
-- DROPS (log)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.drops (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id      UUID NOT NULL REFERENCES public.items(id),
  float_value  DOUBLE PRECISION NOT NULL,
  rarity       rarity_type NOT NULL,
  dropped_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drops_user_id ON public.drops(user_id);
CREATE INDEX idx_drops_dropped_at ON public.drops(dropped_at);

-- ============================================================
-- LISTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.listings (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id          UUID NOT NULL REFERENCES public.profiles(id),
  inventory_id       UUID NOT NULL REFERENCES public.inventory(id),
  price_ars          INTEGER NOT NULL CHECK (price_ars > 0),
  status             listing_status NOT NULL DEFAULT 'active',
  mp_preference_id   TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  sold_at            TIMESTAMPTZ
);

CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_seller_id ON public.listings(seller_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id     UUID NOT NULL REFERENCES public.listings(id),
  buyer_id       UUID NOT NULL REFERENCES public.profiles(id),
  seller_id      UUID NOT NULL REFERENCES public.profiles(id),
  price_ars      INTEGER NOT NULL,
  platform_fee   INTEGER NOT NULL,
  mp_payment_id  TEXT NOT NULL,
  completed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_buyer_id ON public.transactions(buyer_id);
CREATE INDEX idx_transactions_seller_id ON public.transactions(seller_id);

-- ============================================================
-- BADGES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.badges (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key          TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  description  TEXT,
  icon_svg     TEXT
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id   UUID NOT NULL REFERENCES public.badges(id),
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);

-- ============================================================
-- SEED DEFAULT BADGES
-- ============================================================

INSERT INTO public.badges (key, name, description, icon_svg)
VALUES
  ('primer_click',    'Primer Clickeo',     'Hiciste tu primer click.',          '🖱️'),
  ('click_100',       'Cien Clicks',        'Clickeaste 100 veces.',             '💯'),
  ('click_1000',      'Mil Clicks',         'Clickeaste 1.000 veces.',           '🔥'),
  ('click_10000',     'Diez Mil Clicks',    'Clickeaste 10.000 veces.',          '⚡'),
  ('nivel_5',         'Nivel 5',            'Llegaste al nivel 5.',              '⭐'),
  ('nivel_10',        'Nivel 10',           'Llegaste al nivel 10.',             '🌟'),
  ('nivel_25',        'Nivel 25',           'Llegaste al nivel 25.',             '💫'),
  ('primer_raro',     'Cazador de Rarezas', 'Conseguiste tu primer Raro.',       '💜'),
  ('primer_legendario','Leyenda',           'Conseguiste tu primer Legendario.', '🟠'),
  ('primer_ort',      'En el Ort',          'Conseguiste un item En el Ort**.',  '💎')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED SAMPLE ITEMS
-- ============================================================

INSERT INTO public.items (name, rarity, description, image_url, base_price_ars)
VALUES
  -- Comun
  ('Chupete Básico',           'comun',          'El clásico chupete de plástico transparente.', '', 50),
  ('Chupete de Silicona',      'comun',          'Suave y resistente.',                           '', 75),
  ('Chupete de Goma',          'comun',          'Viejo y confiable.',                            '', 60),
  -- Poco común
  ('Chupete Pintado',          'poco_comun',     'Con diseño floral.',                            '', 200),
  ('Chupete Fosforescente',    'poco_comun',     'Brilla en la oscuridad.',                       '', 350),
  -- Medio raro
  ('Chupete Dorado',           'medio_raro',     'Bañado en oro de 14k.',                         '', 800),
  ('Chupete de Cristal',       'medio_raro',     'Frágil pero hermoso.',                          '', 1200),
  -- Raro
  ('Chupete Espacial',         'raro',           'Diseño inspirado en la NASA.',                  '', 3500),
  ('Chupete del Che',          'raro',           'Edición limitada revolucionaria.',              '', 4000),
  -- Ultra raro
  ('Chupete Plasma',           'ultra_raro',     'Hecho de plasma condensado.',                   '', 12000),
  ('Chupete Cuántico',         'ultra_raro',     'Existe en dos estados a la vez.',               '', 18000),
  -- Legendario
  ('Chupete del Maradona',     'legendario',     'El chupete de Dios. La mano de Dios.',          '', 50000),
  ('Chupete de Evita',         'legendario',     'Histórico. Irrepetible.',                       '', 60000),
  -- Extraterrestre
  ('Chupete Alienígena',       'extraterrestre', 'No es de este mundo.',                          '', 200000),
  ('Chupete Intergaláctico',   'extraterrestre', 'Vino de las estrellas.',                        '', 250000),
  -- En el ort
  ('El Chupete Original',      'en_el_ort',      'No hay descripción posible. Es único.',         '', 999999)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drops        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges  ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can update
CREATE POLICY "profiles_select_all"   ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Items: anyone can read (catalog)
CREATE POLICY "items_select_all"      ON public.items    FOR SELECT USING (true);

-- Inventory: public read (inventories are visible on profiles & marketplace joins), owner writes
CREATE POLICY "inventory_select_all"  ON public.inventory FOR SELECT USING (true);
CREATE POLICY "inventory_insert_own"  ON public.inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "inventory_update_own"  ON public.inventory FOR UPDATE USING (auth.uid() = user_id);

-- Drops: only owner
CREATE POLICY "drops_select_own"      ON public.drops FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "drops_insert_own"      ON public.drops FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Listings: anyone can read active, owner can insert/update
CREATE POLICY "listings_select_active" ON public.listings FOR SELECT USING (status = 'active' OR auth.uid() = seller_id);
CREATE POLICY "listings_insert_own"    ON public.listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "listings_update_own"    ON public.listings FOR UPDATE USING (auth.uid() = seller_id);

-- Transactions: buyer or seller can read
CREATE POLICY "transactions_select_parties" ON public.transactions
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Badges: anyone can read
CREATE POLICY "badges_select_all"      ON public.badges     FOR SELECT USING (true);
CREATE POLICY "user_badges_select_all" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "user_badges_insert_own" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
