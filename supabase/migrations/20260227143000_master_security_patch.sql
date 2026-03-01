-- Master Security Patch
-- Scope:
-- 1) Remove insecure admin-password RPC flow.
-- 2) Rebuild products/prices RLS to eliminate permissive flaws.
-- 3) Lock down exposed history/backup tables with strict RLS.
-- 4) Remove hardcoded bearer-token trigger exposure.

begin;

-- ------------------------------------------------------------
-- A) Secure admin flow: remove insecure RPC + plaintext residue
-- ------------------------------------------------------------
drop function if exists public.verify_admin_password(text);

update public.settings
set value = value - 'password',
    updated_at = now()
where key = 'admin_config'
  and jsonb_typeof(value) = 'object'
  and (value ? 'password');

-- ------------------------------------------------------------
-- B) Remove exposed hardcoded bearer-token trigger
-- ------------------------------------------------------------
drop trigger if exists create_profile_webhook on auth.users;

-- ------------------------------------------------------------
-- C) products: strict write-admin / read-public
-- ------------------------------------------------------------
alter table public.products enable row level security;

revoke all privileges on table public.products from public, anon, authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
  loop
    execute format('drop policy if exists %I on public.products', pol.policyname);
  end loop;
end
$$;

create policy products_select_public
on public.products
as permissive
for select
to anon, authenticated
using (true);

create policy products_insert_admin
on public.products
as permissive
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy products_update_admin
on public.products
as permissive
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy products_delete_admin
on public.products
as permissive
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- ------------------------------------------------------------
-- D) prices: strict write-admin / read-public
-- ------------------------------------------------------------
alter table public.prices enable row level security;

revoke all privileges on table public.prices from public, anon, authenticated;
grant select on table public.prices to anon, authenticated;
grant insert, update, delete on table public.prices to authenticated;

do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'prices'
  loop
    execute format('drop policy if exists %I on public.prices', pol.policyname);
  end loop;
end
$$;

create policy prices_select_public
on public.prices
as permissive
for select
to anon, authenticated
using (true);

create policy prices_insert_admin
on public.prices
as permissive
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy prices_update_admin
on public.prices
as permissive
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy prices_delete_admin
on public.prices
as permissive
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- ------------------------------------------------------------
-- E) Lock down exposed tables: price_history + backups
-- ------------------------------------------------------------
alter table public.price_history enable row level security;
alter table public.backup_orders enable row level security;
alter table public.backup_prices enable row level security;
alter table public.backup_products enable row level security;

revoke all privileges on table public.price_history from public, anon, authenticated;
revoke all privileges on table public.backup_orders from public, anon, authenticated;
revoke all privileges on table public.backup_prices from public, anon, authenticated;
revoke all privileges on table public.backup_products from public, anon, authenticated;

-- Keep read access for authenticated clients to support live ounce display.
grant select on table public.price_history to authenticated;
grant insert, update, delete on table public.price_history to authenticated;

-- Backup tables are admin-only through RLS (no anon exposure).
grant select, insert, update, delete on table public.backup_orders to authenticated;
grant select, insert, update, delete on table public.backup_prices to authenticated;
grant select, insert, update, delete on table public.backup_products to authenticated;

do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('price_history', 'backup_orders', 'backup_prices', 'backup_products')
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end
$$;

-- price_history
create policy price_history_select_authenticated
on public.price_history
as permissive
for select
to authenticated
using (true);

create policy price_history_insert_admin
on public.price_history
as permissive
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy price_history_update_admin
on public.price_history
as permissive
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy price_history_delete_admin
on public.price_history
as permissive
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- backup_orders
create policy backup_orders_select_admin
on public.backup_orders
as permissive
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy backup_orders_insert_admin
on public.backup_orders
as permissive
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy backup_orders_update_admin
on public.backup_orders
as permissive
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy backup_orders_delete_admin
on public.backup_orders
as permissive
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- backup_prices
create policy backup_prices_select_admin
on public.backup_prices
as permissive
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy backup_prices_insert_admin
on public.backup_prices
as permissive
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy backup_prices_update_admin
on public.backup_prices
as permissive
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy backup_prices_delete_admin
on public.backup_prices
as permissive
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- backup_products
create policy backup_products_select_admin
on public.backup_products
as permissive
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy backup_products_insert_admin
on public.backup_products
as permissive
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy backup_products_update_admin
on public.backup_products
as permissive
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy backup_products_delete_admin
on public.backup_products
as permissive
for delete
to authenticated
using (public.is_admin(auth.uid()));

commit;
