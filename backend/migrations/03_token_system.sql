--user_tokens table
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own token balance
CREATE POLICY "Users can view own tokens"
ON user_tokens FOR SELECT
USING (auth.uid() = user_id);

-- Service role can do everything (backend uses service key)
CREATE POLICY "Service role full access"
ON user_tokens FOR ALL
USING (true)
WITH CHECK (true);

-- 2. Create token_transactions table for history
CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive = credit, negative = debit
  type TEXT NOT NULL, -- 'signup_bonus', 'generate', 'chat', 'purchase'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON token_transactions FOR SELECT
USING (auth.uid() = user_id);

-- 3. Auto-create token row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_tokens (user_id, balance)
  VALUES (NEW.id, 40)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.token_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 40, 'signup_bonus', 'Welcome bonus - 40 free tokens');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created_tokens ON auth.users;
CREATE TRIGGER on_auth_user_created_tokens
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_tokens();

-- 4. Create payments table for Razorpay orders
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  amount INTEGER NOT NULL, -- in paise
  tokens INTEGER NOT NULL, -- tokens purchased
  status TEXT NOT NULL DEFAULT 'created', -- created, paid, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
ON payments FOR SELECT
USING (auth.uid() = user_id);

-- 5. Update trigger for user_tokens
CREATE TRIGGER update_user_tokens_modtime
BEFORE UPDATE ON user_tokens
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
