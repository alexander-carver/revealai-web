ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS customer_email TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_email
  ON subscriptions(customer_email);
