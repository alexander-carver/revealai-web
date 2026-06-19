alter table public.billing_subscriptions
    add column if not exists meta_trial_start_sent_at timestamptz;
