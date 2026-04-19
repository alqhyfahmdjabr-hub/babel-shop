begin;

create or replace function public.try_parse_timestamptz(input_text text)
returns timestamp with time zone
language plpgsql
as $$
begin
  if input_text is null or btrim(input_text) = '' then
    return null;
  end if;

  return input_text::timestamptz;
exception
  when others then
    return null;
end;
$$;

alter table public.orders
  alter column "date" drop default;

alter table public.orders
  alter column "date" type timestamp with time zone
  using coalesce(
    public.try_parse_timestamptz("date"),
    created_at,
    now()
  );

alter table public.orders
  alter column "date" set default now();

alter table public.orders
  alter column "date" set not null;

alter table public.orders
  alter column status set default 'new';

update public.orders
set status = 'new'
where status is null
   or btrim(status) = '';

alter table public.orders
  alter column status set not null;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (
    status in (
      'new',
      'pending',
      'processing',
      'completed',
      'delivered',
      'cancelled'
    )
  );

create index if not exists idx_orders_user_date
  on public.orders (user_id, "date" desc);

create index if not exists idx_orders_status_date
  on public.orders (status, "date" desc);

do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'orders'
  loop
    execute format('drop policy if exists %I on public.orders', pol.policyname);
  end loop;
end
$$;

revoke all privileges on table public.orders from public, anon, authenticated;
grant select, insert, update, delete on table public.orders to authenticated;

create policy orders_select_own_or_admin
on public.orders
as permissive
for select
to authenticated
using (
  auth.uid() is not null
  and (
    public.is_admin(auth.uid())
    or auth.uid() = user_id
  )
);

create policy orders_insert_own_or_admin
on public.orders
as permissive
for insert
to authenticated
with check (
  auth.uid() is not null
  and (
    public.is_admin(auth.uid())
    or auth.uid() = user_id
  )
);

create policy orders_update_admin_only
on public.orders
as permissive
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy orders_delete_admin_only
on public.orders
as permissive
for delete
to authenticated
using (public.is_admin(auth.uid()));

create or replace function public.cancel_own_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  update public.orders
  set status = 'cancelled',
      updated_at = now()
  where id = p_order_id
    and user_id = auth.uid()
    and ("date" at time zone 'Asia/Riyadh')::date = (now() at time zone 'Asia/Riyadh')::date
    and status in ('new', 'pending');

  if not found then
    raise exception 'order cannot be cancelled';
  end if;
end;
$$;

revoke all on function public.cancel_own_order(uuid) from public, anon;
grant execute on function public.cancel_own_order(uuid) to authenticated;

drop function if exists public.try_parse_timestamptz(text);

commit;
