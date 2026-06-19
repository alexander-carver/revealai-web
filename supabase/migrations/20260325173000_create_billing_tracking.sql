create extension if not exists pgcrypto;
create table if not exists public.billing_subscriptions (
    id uuid primary key default gen_random_uuid(),
    external_user_id text not null,
    entitlement text not null default 'pro',
    source text not null default 'stripe',
    stripe_customer_id text,
    stripe_subscription_id text unique,
    stripe_price_id text,
    stripe_product_id text,
    stripe_status text not null default 'unknown',
    is_active boolean not null default false,
    cancel_at_period_end boolean not null default false,
    amount_cents integer,
    currency text,
    current_period_start timestamptz,
    current_period_end timestamptz,
    trial_end timestamptz,
    first_paid_at timestamptz,
    last_paid_at timestamptz,
    meta_conversion_sent_at timestamptz,
    latest_invoice_id text,
    latest_checkout_session_id text,
    customer_email text,
    metadata jsonb not null default '{}'::jsonb,
    last_payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists billing_subscriptions_external_user_idx
    on public.billing_subscriptions (external_user_id, is_active);
create index if not exists billing_subscriptions_customer_idx
    on public.billing_subscriptions (stripe_customer_id);
alter table public.billing_subscriptions enable row level security;
create table if not exists public.billing_webhook_events (
    stripe_event_id text primary key,
    stripe_event_type text not null,
    status text not null default 'processing'
        check (status in ('processing', 'processed', 'ignored', 'failed')),
    livemode boolean not null default false,
    external_user_id text,
    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_invoice_id text,
    meta_event_name text,
    meta_event_id text,
    meta_response jsonb,
    error_text text,
    payload jsonb not null default '{}'::jsonb,
    processed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists billing_webhook_events_subscription_idx
    on public.billing_webhook_events (stripe_subscription_id, created_at desc);
create index if not exists billing_webhook_events_external_user_idx
    on public.billing_webhook_events (external_user_id, created_at desc);
alter table public.billing_webhook_events enable row level security;
