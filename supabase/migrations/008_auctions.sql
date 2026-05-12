-- ============================================================
-- ChupeteClicker — Auction System
-- ============================================================

CREATE TABLE IF NOT EXISTS public.auctions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id           UUID NOT NULL REFERENCES public.profiles(id),
  inventory_id        UUID NOT NULL REFERENCES public.inventory(id),
  starting_bid        INTEGER NOT NULL DEFAULT 100,
  current_bid         INTEGER,
  current_bidder_id   UUID REFERENCES public.profiles(id),
  ends_at             TIMESTAMPTZ NOT NULL,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auctions_status      ON public.auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_seller_id   ON public.auctions(seller_id);
CREATE INDEX IF NOT EXISTS idx_auctions_ends_at     ON public.auctions(ends_at);

CREATE TABLE IF NOT EXISTS public.auction_bids (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id  UUID NOT NULL REFERENCES public.auctions(id),
  bidder_id   UUID NOT NULL REFERENCES public.profiles(id),
  amount      INTEGER NOT NULL,
  placed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auction_bids_auction  ON public.auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_bidder   ON public.auction_bids(bidder_id);

ALTER TABLE public.auctions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

-- Auctions: anyone can read active, seller can insert/update own
CREATE POLICY "auctions_select_all"   ON public.auctions FOR SELECT USING (true);
CREATE POLICY "auctions_insert_own"   ON public.auctions FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "auctions_update_own"   ON public.auctions FOR UPDATE USING (auth.uid() = seller_id);

-- Bids: anyone can read, authenticated can insert own
CREATE POLICY "bids_select_all"  ON public.auction_bids FOR SELECT USING (true);
CREATE POLICY "bids_insert_own"  ON public.auction_bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);
