create table if not exists public.meta_app_contexts (
    external_user_id text primary key,
    advertiser_tracking_enabled boolean not null default false,
    application_tracking_enabled boolean not null default true,
    extinfo jsonb not null default '[]'::jsonb
        check (jsonb_typeof(extinfo) = 'array'),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
alter table public.meta_app_contexts enable row level security;
