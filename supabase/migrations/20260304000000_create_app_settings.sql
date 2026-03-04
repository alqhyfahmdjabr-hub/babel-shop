-- Create global app settings table for frontend display logic.
-- This table stores:
-- 1) exchange_rate: USD -> SAR conversion rate
-- 2) calc_method: how client computes/displays karat prices

create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  exchange_rate numeric(10,4) not null default 3.8000 check (exchange_rate > 0),
  calc_method text not null default 'db_prices' check (calc_method in ('db_prices', 'from_ounce')),
  updated_at timestamp with time zone not null default now()
);

alter table public.app_settings enable row level security;

grant select on table public.app_settings to anon, authenticated;
grant insert, update, delete on table public.app_settings to authenticated;

drop policy if exists app_settings_select_public on public.app_settings;
create policy app_settings_select_public
on public.app_settings
for select
to anon, authenticated
using (true);

drop policy if exists app_settings_insert_admin on public.app_settings;
create policy app_settings_insert_admin
on public.app_settings
for insert
to authenticated
with check ((select public.is_admin((select auth.uid() as uid)) as is_admin));

drop policy if exists app_settings_update_admin on public.app_settings;
create policy app_settings_update_admin
on public.app_settings
for update
to authenticated
using ((select public.is_admin((select auth.uid() as uid)) as is_admin))
with check ((select public.is_admin((select auth.uid() as uid)) as is_admin));

drop policy if exists app_settings_delete_admin on public.app_settings;
create policy app_settings_delete_admin
on public.app_settings
for delete
to authenticated
using ((select public.is_admin((select auth.uid() as uid)) as is_admin));

insert into public.app_settings (id, exchange_rate, calc_method)
values (1, 3.8000, 'db_prices')
on conflict (id) do nothing;
