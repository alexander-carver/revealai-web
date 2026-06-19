alter table if exists public.search_opt_outs enable row level security;
do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'search_opt_outs'
          and policyname = 'search_opt_outs_select_own'
    ) then
        create policy search_opt_outs_select_own on public.search_opt_outs
            for select
            to authenticated
            using (user_id = auth.uid());
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'search_opt_outs'
          and policyname = 'search_opt_outs_insert_own'
    ) then
        create policy search_opt_outs_insert_own on public.search_opt_outs
            for insert
            to authenticated
            with check (user_id = auth.uid());
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'search_opt_outs'
          and policyname = 'search_opt_outs_update_own'
    ) then
        create policy search_opt_outs_update_own on public.search_opt_outs
            for update
            to authenticated
            using (user_id = auth.uid())
            with check (user_id = auth.uid());
    end if;
end
$$;
