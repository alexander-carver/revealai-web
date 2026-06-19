create extension if not exists pgcrypto;
create table if not exists public.search_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid(),
    query text not null,
    created_at timestamptz not null default now()
);
alter table public.search_logs enable row level security;
do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'search_logs'
          and policyname = 'insert_own'
    ) then
        create policy insert_own on public.search_logs
            for insert
            to authenticated
            with check (auth.uid() = user_id);
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'search_logs'
          and policyname = 'select_own'
    ) then
        create policy select_own on public.search_logs
            for select
            to authenticated
            using (auth.uid() = user_id);
    end if;
end
$$;
alter table if exists public.search_opt_outs enable row level security;
do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'search_opt_outs'
          and policyname = 'select_opt_out_self'
    ) then
        create policy select_opt_out_self on public.search_opt_outs
            for select
            to authenticated
            using (user_id = auth.uid());
    end if;
end
$$;
