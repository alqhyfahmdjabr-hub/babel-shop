begin;

create or replace function public.has_authenticated_email()
returns boolean
language sql
stable
as $$
  select auth.uid() is not null
    and nullif(trim(coalesce(auth.jwt() ->> 'email', '')), '') is not null;
$$;

alter table public.app_settings
  add column if not exists buy_margin_percent numeric(8,4) not null default 0 check (buy_margin_percent >= 0 and buy_margin_percent < 100),
  add column if not exists sell_margin_percent numeric(8,4) not null default 0 check (sell_margin_percent >= 0 and sell_margin_percent < 100);

update public.app_settings
set buy_margin_percent = coalesce(buy_margin_percent, 0),
    sell_margin_percent = coalesce(sell_margin_percent, 0)
where id = 1;

alter table public.app_settings
  drop column if exists calc_method;

create or replace function public.recalculate_gold_prices()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  grams_per_troy_ounce constant numeric := 31.1034768;
  ounce_price_usd numeric(18,6);
  buy_margin_percent numeric(8,4);
  sell_margin_percent numeric(8,4);
  refreshed_at timestamp with time zone := now();
begin
  insert into public.app_settings (id, exchange_rate, buy_margin_percent, sell_margin_percent, updated_at)
  values (1, 3.8000, 0, 0, refreshed_at)
  on conflict (id) do nothing;

  select
    coalesce(s.buy_margin_percent, 0),
    coalesce(s.sell_margin_percent, 0)
  into
    buy_margin_percent,
    sell_margin_percent
  from public.app_settings s
  where s.id = 1;

  select ph.source_price_per_oz
  into ounce_price_usd
  from public.price_history ph
  order by ph.created_at desc, ph.id desc
  limit 1;

  if ounce_price_usd is null or ounce_price_usd <= 0 then
    return jsonb_build_object(
      'updated', false,
      'reason', 'missing_price_history'
    );
  end if;

  insert into public.prices (karat, buy, sell, updated_at)
  select
    v.karat,
    round(((ounce_price_usd / grams_per_troy_ounce) * (v.karat / 24.0) * (1 - (buy_margin_percent / 100.0)))::numeric, 6)::double precision,
    round(((ounce_price_usd / grams_per_troy_ounce) * (v.karat / 24.0) * (1 + (sell_margin_percent / 100.0)))::numeric, 6)::double precision,
    refreshed_at
  from (values (18), (21), (24)) as v(karat)
  on conflict (karat) do update
  set buy = excluded.buy,
      sell = excluded.sell,
      updated_at = excluded.updated_at;

  return jsonb_build_object(
    'updated', true,
    'ounce_price_usd', ounce_price_usd,
    'buy_margin_percent', buy_margin_percent,
    'sell_margin_percent', sell_margin_percent,
    'updated_at', refreshed_at
  );
end;
$$;

create or replace function public.apply_gold_price_snapshot(
  p_source_price_per_oz numeric,
  p_source text default 'goldpricez',
  p_raw_payload jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  grams_per_troy_ounce constant numeric := 31.1034768;
  ounce_price_usd numeric(18,6) := round(p_source_price_per_oz::numeric, 6);
  buy_margin_percent numeric(8,4);
  sell_margin_percent numeric(8,4);
  created_at_ts timestamp with time zone := now();
begin
  if ounce_price_usd is null or ounce_price_usd <= 0 then
    raise exception 'source ounce price must be greater than zero';
  end if;

  insert into public.app_settings (id, exchange_rate, buy_margin_percent, sell_margin_percent, updated_at)
  values (1, 3.8000, 0, 0, created_at_ts)
  on conflict (id) do nothing;

  select
    coalesce(s.buy_margin_percent, 0),
    coalesce(s.sell_margin_percent, 0)
  into
    buy_margin_percent,
    sell_margin_percent
  from public.app_settings s
  where s.id = 1;

  insert into public.price_history (
    karat,
    source_price_per_oz,
    price_per_gram,
    buy,
    sell,
    currency,
    source,
    raw_payload,
    created_at
  )
  select
    v.karat,
    ounce_price_usd,
    round(((ounce_price_usd / grams_per_troy_ounce) * (v.karat / 24.0))::numeric, 6),
    round(((ounce_price_usd / grams_per_troy_ounce) * (v.karat / 24.0) * (1 - (buy_margin_percent / 100.0)))::numeric, 6),
    round(((ounce_price_usd / grams_per_troy_ounce) * (v.karat / 24.0) * (1 + (sell_margin_percent / 100.0)))::numeric, 6),
    'USD',
    coalesce(nullif(trim(p_source), ''), 'goldpricez'),
    p_raw_payload,
    created_at_ts
  from (values (18), (21), (24)) as v(karat);

  perform public.recalculate_gold_prices();

  return jsonb_build_object(
    'applied', true,
    'source', coalesce(nullif(trim(p_source), ''), 'goldpricez'),
    'ounce_price_usd', ounce_price_usd,
    'created_at', created_at_ts
  );
end;
$$;

create or replace function public.app_settings_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.refresh_gold_prices_after_app_settings_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_gold_prices();
  return null;
end;
$$;

drop trigger if exists trg_app_settings_set_updated_at on public.app_settings;
create trigger trg_app_settings_set_updated_at
before update on public.app_settings
for each row
execute function public.app_settings_set_updated_at();

drop trigger if exists trg_app_settings_refresh_prices on public.app_settings;
create trigger trg_app_settings_refresh_prices
after insert or update on public.app_settings
for each statement
execute function public.refresh_gold_prices_after_app_settings_change();

revoke select on table public.prices from anon;
revoke select on table public.app_settings from anon;

drop policy if exists prices_select_public on public.prices;
drop policy if exists prices_select_authenticated_email on public.prices;
create policy prices_select_authenticated_email
on public.prices
as permissive
for select
to authenticated
using (public.has_authenticated_email());

drop policy if exists price_history_select_authenticated on public.price_history;
drop policy if exists price_history_select_authenticated_email on public.price_history;
create policy price_history_select_authenticated_email
on public.price_history
as permissive
for select
to authenticated
using (public.has_authenticated_email());

drop policy if exists app_settings_select_public on public.app_settings;
drop policy if exists app_settings_select_authenticated_email on public.app_settings;
create policy app_settings_select_authenticated_email
on public.app_settings
as permissive
for select
to authenticated
using (public.has_authenticated_email());

revoke all on function public.recalculate_gold_prices() from public, anon, authenticated;
revoke all on function public.apply_gold_price_snapshot(numeric, text, jsonb) from public, anon, authenticated;
grant execute on function public.recalculate_gold_prices() to service_role;
grant execute on function public.apply_gold_price_snapshot(numeric, text, jsonb) to service_role;

select public.recalculate_gold_prices();

commit;
