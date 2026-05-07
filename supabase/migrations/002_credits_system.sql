-- Add credits to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0;

-- Create credit_transactions table for audit log
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive = earned, negative = spent
  reason TEXT NOT NULL, -- 'level_up', 'click_milestone', 'rare_drop', 'sale', 'purchase'
  ref_id TEXT, -- optional reference (listing_id, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_tx_user_id ON public.credit_transactions(user_id);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_tx_select_own" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "credit_tx_insert_service" ON public.credit_transactions FOR INSERT WITH CHECK (true);

-- Change listings price column to credits
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS price_credits INTEGER;
-- We'll keep price_ars for now and use price_credits going forward
