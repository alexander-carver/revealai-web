ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS billing_provider TEXT NOT NULL DEFAULT 'stripe'
    CHECK (billing_provider IN ('stripe', 'whop')),
  ADD COLUMN IF NOT EXISTS whop_user_id TEXT,
  ADD COLUMN IF NOT EXISTS whop_membership_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS billing_manage_url TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_provider
  ON subscriptions(billing_provider);

CREATE INDEX IF NOT EXISTS idx_subscriptions_whop_user_id
  ON subscriptions(whop_user_id);
