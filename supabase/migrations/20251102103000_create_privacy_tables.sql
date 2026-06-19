create extension if not exists pgcrypto;
-- Device tokens for APNs
create table if not exists public.device_tokens (
    token text primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    bundle_id text not null,
    apns_env text not null default 'prod' check (apns_env in ('prod', 'sandbox')),
    updated_at timestamptz not null default now()
);
alter table public.device_tokens enable row level security;
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'device_tokens'
          and policyname = 'device_tokens_select_own'
    ) then
        create policy device_tokens_select_own on public.device_tokens
            for select to authenticated
            using (user_id = auth.uid());
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'device_tokens'
          and policyname = 'device_tokens_insert_own'
    ) then
        create policy device_tokens_insert_own on public.device_tokens
            for insert to authenticated
            with check (user_id = auth.uid());
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'device_tokens'
          and policyname = 'device_tokens_delete_own'
    ) then
        create policy device_tokens_delete_own on public.device_tokens
            for delete to authenticated
            using (user_id = auth.uid());
    end if;
end
$$;
-- Alert subscriptions
create table if not exists public.alerts_subscriptions (
    user_id uuid not null references auth.users (id) on delete cascade,
    type text not null check (type in ('dark_web', 'phone_exposure', 'address_exposure')),
    enabled boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, type)
);
alter table public.alerts_subscriptions enable row level security;
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'alerts_subscriptions'
          and policyname = 'alerts_subscriptions_select_own'
    ) then
        create policy alerts_subscriptions_select_own on public.alerts_subscriptions
            for select to authenticated
            using (user_id = auth.uid());
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'alerts_subscriptions'
          and policyname = 'alerts_subscriptions_modify_own'
    ) then
        create policy alerts_subscriptions_modify_own on public.alerts_subscriptions
            for all to authenticated
            using (user_id = auth.uid())
            with check (user_id = auth.uid());
    end if;
end
$$;
-- Search history with provider summaries
create table if not exists public.search_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid(),
    query_type text not null,
    payload jsonb not null,
    provider text not null,
    result_summary jsonb,
    created_at timestamptz not null default now()
);
alter table public.search_history enable row level security;
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'search_history'
          and policyname = 'search_history_select_own'
    ) then
        create policy search_history_select_own on public.search_history
            for select to authenticated
            using (user_id = auth.uid());
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'search_history'
          and policyname = 'search_history_insert_own'
    ) then
        create policy search_history_insert_own on public.search_history
            for insert to authenticated
            with check (user_id = auth.uid());
    end if;
end
$$;
-- Exposure records
create table if not exists public.exposures (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    type text not null,
    source text not null,
    identifier text not null,
    first_seen timestamptz not null default now(),
    last_seen timestamptz not null default now(),
    details jsonb not null default '{}'::jsonb,
    constraint exposures_unique unique (user_id, type, identifier)
);
alter table public.exposures enable row level security;
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'exposures'
          and policyname = 'exposures_select_own'
    ) then
        create policy exposures_select_own on public.exposures
            for select to authenticated
            using (user_id = auth.uid());
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'exposures'
          and policyname = 'exposures_insert_own'
    ) then
        create policy exposures_insert_own on public.exposures
            for insert to authenticated
            with check (user_id = auth.uid());
    end if;
end
$$;
create index if not exists exposures_user_idx on public.exposures (user_id, type, identifier);
-- Opt-out job tracking
create table if not exists public.opt_out_jobs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    broker text not null,
    status text not null,
    payload jsonb not null default '{}'::jsonb,
    requested_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    error_text text,
    evidence_url text,
    constraint opt_out_jobs_unique unique (user_id, broker)
);
alter table public.opt_out_jobs enable row level security;
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'opt_out_jobs'
          and policyname = 'opt_out_jobs_select_own'
    ) then
        create policy opt_out_jobs_select_own on public.opt_out_jobs
            for select to authenticated
            using (user_id = auth.uid());
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'opt_out_jobs'
          and policyname = 'opt_out_jobs_insert_own'
    ) then
        create policy opt_out_jobs_insert_own on public.opt_out_jobs
            for insert to authenticated
            with check (user_id = auth.uid());
    end if;
end
$$;
-- Global spam blocklist (read-only to clients)
create table if not exists public.spam_blocklist_global (
    number text primary key,
    reason text,
    confidence int,
    updated_at timestamptz not null default now()
);
alter table public.spam_blocklist_global enable row level security;
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'spam_blocklist_global'
          and policyname = 'spam_blocklist_global_select_all'
    ) then
        create policy spam_blocklist_global_select_all on public.spam_blocklist_global
            for select to authenticated
            using (true);
    end if;
end
$$;
-- User-sourced spam blocklist entries
create table if not exists public.spam_blocklist_user (
    user_id uuid not null references auth.users (id) on delete cascade,
    number text not null,
    reason text,
    created_at timestamptz not null default now(),
    primary key (user_id, number)
);
alter table public.spam_blocklist_user enable row level security;
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'spam_blocklist_user'
          and policyname = 'spam_blocklist_user_select_own'
    ) then
        create policy spam_blocklist_user_select_own on public.spam_blocklist_user
            for select to authenticated
            using (user_id = auth.uid());
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'spam_blocklist_user'
          and policyname = 'spam_blocklist_user_modify_own'
    ) then
        create policy spam_blocklist_user_modify_own on public.spam_blocklist_user
            for all to authenticated
            using (user_id = auth.uid())
            with check (user_id = auth.uid());
    end if;
end
$$;
-- Unclaimed money query log
create table if not exists public.unclaimed_money_queries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid(),
    full_name text not null,
    state text,
    result_count int,
    created_at timestamptz not null default now()
);
alter table public.unclaimed_money_queries enable row level security;
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'unclaimed_money_queries'
          and policyname = 'unclaimed_money_queries_select_own'
    ) then
        create policy unclaimed_money_queries_select_own on public.unclaimed_money_queries
            for select to authenticated
            using (user_id = auth.uid());
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'unclaimed_money_queries'
          and policyname = 'unclaimed_money_queries_insert_own'
    ) then
        create policy unclaimed_money_queries_insert_own on public.unclaimed_money_queries
            for insert to authenticated
            with check (user_id = auth.uid());
    end if;
end
$$;
