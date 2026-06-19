create table if not exists public.search_opt_outs (
    user_id uuid primary key,
    opt_out boolean not null default true,
    source_client text,
    requested_at timestamptz not null default now(),
    lifted_at timestamptz
);
