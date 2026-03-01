create extension if not exists "pg_cron" with schema "pg_catalog";

create schema if not exists "util";


  create table "public"."backup_orders" (
    "id" uuid not null,
    "phone" text,
    "weight" double precision,
    "imageUrl" text,
    "notes" text,
    "date" text,
    "status" text,
    "image_url" text,
    "user_id" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
      );



  create table "public"."backup_prices" (
    "karat" integer,
    "buy" double precision,
    "sell" double precision,
    "updated_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "id" uuid not null default extensions.uuid_generate_v4()
      );



  create table "public"."backup_products" (
    "id" uuid not null,
    "name" text,
    "category" text,
    "weight" double precision,
    "priceEstimate" double precision,
    "imageUrl" text,
    "description" text,
    "karat" integer,
    "image_url" text,
    "updated_at" timestamp with time zone
      );



  create table "public"."orders" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "phone" text not null,
    "weight" double precision not null,
    "imageUrl" text not null,
    "notes" text,
    "date" text not null,
    "status" text default 'new'::text,
    "user_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."orders" enable row level security;


  create table "public"."price_history" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "karat" integer not null,
    "source_price_per_oz" numeric(18,6) not null,
    "price_per_gram" numeric(18,6) not null,
    "buy" numeric(18,6) not null,
    "sell" numeric(18,6) not null,
    "currency" text not null default 'USD'::text,
    "source" text,
    "raw_payload" jsonb,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."prices" (
    "karat" integer not null,
    "buy" double precision default 0,
    "sell" double precision default 0,
    "updated_at" timestamp with time zone default timezone('utc'::text, now()),
    "created_at" timestamp with time zone default now()
      );


alter table "public"."prices" enable row level security;


  create table "public"."products" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "category" text not null,
    "weight" double precision not null,
    "priceEstimate" double precision not null,
    "imageUrl" text not null,
    "description" text,
    "karat" integer not null,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."products" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "role" text default 'user'::text,
    "full_name" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."settings" (
    "key" text not null,
    "value" jsonb not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."settings" enable row level security;

CREATE UNIQUE INDEX backup_orders_pkey ON public.backup_orders USING btree (id);

CREATE UNIQUE INDEX backup_prices_pkey ON public.backup_prices USING btree (id);

CREATE UNIQUE INDEX backup_products_pkey ON public.backup_products USING btree (id);

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at);

CREATE INDEX idx_orders_date ON public.orders USING btree (date);

CREATE INDEX idx_orders_status ON public.orders USING btree (status);

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);

CREATE INDEX idx_price_history_created_at ON public.price_history USING btree (created_at);

CREATE INDEX idx_prices_karat ON public.prices USING btree (karat);

CREATE INDEX idx_products_category ON public.products USING btree (category);

CREATE INDEX idx_products_karat ON public.products USING btree (karat);

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);

CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);

CREATE UNIQUE INDEX price_history_pkey ON public.price_history USING btree (id);

CREATE UNIQUE INDEX prices_karat_unique_idx ON public.prices USING btree (karat);

CREATE UNIQUE INDEX prices_pkey ON public.prices USING btree (karat);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX settings_pkey ON public.settings USING btree (key);

CREATE UNIQUE INDEX uq_profiles_email ON public.profiles USING btree (email);

alter table "public"."backup_orders" add constraint "backup_orders_pkey" PRIMARY KEY using index "backup_orders_pkey";

alter table "public"."backup_prices" add constraint "backup_prices_pkey" PRIMARY KEY using index "backup_prices_pkey";

alter table "public"."backup_products" add constraint "backup_products_pkey" PRIMARY KEY using index "backup_products_pkey";

alter table "public"."orders" add constraint "orders_pkey" PRIMARY KEY using index "orders_pkey";

alter table "public"."price_history" add constraint "price_history_pkey" PRIMARY KEY using index "price_history_pkey";

alter table "public"."prices" add constraint "prices_pkey" PRIMARY KEY using index "prices_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."settings" add constraint "settings_pkey" PRIMARY KEY using index "settings_pkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.current_auth_uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if not exists (select 1 from public.profiles p where p.id = NEW.id) then
    insert into public.profiles (id, email, full_name, role, created_at)
    values (
      NEW.id,
      NEW.email,
      coalesce(
        NEW.raw_user_meta_data->>'full_name',
        NEW.user_metadata->>'full_name',
        ''
      ),
      'user',
      now()
    );
  end if;
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT (role = 'admin') FROM public.profiles WHERE id = user_uuid LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.profiles_prevent_role_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    -- If role changed, block the update
    IF (NEW.role IS DISTINCT FROM OLD.role) THEN
      RAISE EXCEPTION 'Direct updates to "role" are not allowed; use admin flow';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id uuid, new_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- التحقق من أن المستخدم الحالي هو admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can change roles';
  END IF;
  
  -- التحقق من الرتبة الجديدة صالحة
  IF new_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be user or admin';
  END IF;
  
  -- تحديث الرتبة
  UPDATE profiles 
  SET role = new_role, updated_at = NOW() 
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_admin_password(input_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  correct_password TEXT;
BEGIN
  -- جلب كلمة المرور من جدول الإعدادات من حقل القيمة (JSON)
  SELECT value->>'password' INTO correct_password
  FROM settings
  WHERE key = 'admin_config';

  -- مقارنة الكلمة التي أدخلها المستخدم بالكلمة الصحيحة في القاعدة
  IF input_password = correct_password THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION util.invoke_update_gold_prices_secure()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  req_id bigint;
  project_url text;
  secret_text text;
  url text;
  headers jsonb;
begin
  -- Build the Edge Function URL using known project ref
  project_url := 'https://ulibmcqfuemefekyvrqj.supabase.co';
  url := project_url || '/functions/v1/update-gold-prices';

  -- Read cron secret from vault (decrypted)
  select decrypted_secret into secret_text
  from vault.decrypted_secrets
  where name = 'cron_update_gold.x_cron_secret'
  limit 1;

  if secret_text is null then
    raise exception 'cron secret not found in vault: cron_update_gold.x_cron_secret';
  end if;

  -- Build headers including x-cron-secret and Authorization Bearer using the same secret.
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', secret_text,
    'Authorization', 'Bearer ' || secret_text
  );

  -- Create an asynchronous HTTP POST request with empty JSON body (Edge Function expects POST)
  req_id := net.http_post(
    url := url,
    body := '{}'::jsonb,
    headers := headers,
    timeout_milliseconds := 15000
  );

  -- Log request id for visibility
  raise notice 'pg_net enqueued request id=% to %', req_id, url;
end;
$function$
;

grant delete on table "public"."backup_orders" to "anon";

grant insert on table "public"."backup_orders" to "anon";

grant references on table "public"."backup_orders" to "anon";

grant select on table "public"."backup_orders" to "anon";

grant trigger on table "public"."backup_orders" to "anon";

grant truncate on table "public"."backup_orders" to "anon";

grant update on table "public"."backup_orders" to "anon";

grant delete on table "public"."backup_orders" to "authenticated";

grant insert on table "public"."backup_orders" to "authenticated";

grant references on table "public"."backup_orders" to "authenticated";

grant select on table "public"."backup_orders" to "authenticated";

grant trigger on table "public"."backup_orders" to "authenticated";

grant truncate on table "public"."backup_orders" to "authenticated";

grant update on table "public"."backup_orders" to "authenticated";

grant delete on table "public"."backup_orders" to "service_role";

grant insert on table "public"."backup_orders" to "service_role";

grant references on table "public"."backup_orders" to "service_role";

grant select on table "public"."backup_orders" to "service_role";

grant trigger on table "public"."backup_orders" to "service_role";

grant truncate on table "public"."backup_orders" to "service_role";

grant update on table "public"."backup_orders" to "service_role";

grant delete on table "public"."backup_prices" to "anon";

grant insert on table "public"."backup_prices" to "anon";

grant references on table "public"."backup_prices" to "anon";

grant select on table "public"."backup_prices" to "anon";

grant trigger on table "public"."backup_prices" to "anon";

grant truncate on table "public"."backup_prices" to "anon";

grant update on table "public"."backup_prices" to "anon";

grant delete on table "public"."backup_prices" to "authenticated";

grant insert on table "public"."backup_prices" to "authenticated";

grant references on table "public"."backup_prices" to "authenticated";

grant select on table "public"."backup_prices" to "authenticated";

grant trigger on table "public"."backup_prices" to "authenticated";

grant truncate on table "public"."backup_prices" to "authenticated";

grant update on table "public"."backup_prices" to "authenticated";

grant delete on table "public"."backup_prices" to "service_role";

grant insert on table "public"."backup_prices" to "service_role";

grant references on table "public"."backup_prices" to "service_role";

grant select on table "public"."backup_prices" to "service_role";

grant trigger on table "public"."backup_prices" to "service_role";

grant truncate on table "public"."backup_prices" to "service_role";

grant update on table "public"."backup_prices" to "service_role";

grant delete on table "public"."backup_products" to "anon";

grant insert on table "public"."backup_products" to "anon";

grant references on table "public"."backup_products" to "anon";

grant select on table "public"."backup_products" to "anon";

grant trigger on table "public"."backup_products" to "anon";

grant truncate on table "public"."backup_products" to "anon";

grant update on table "public"."backup_products" to "anon";

grant delete on table "public"."backup_products" to "authenticated";

grant insert on table "public"."backup_products" to "authenticated";

grant references on table "public"."backup_products" to "authenticated";

grant select on table "public"."backup_products" to "authenticated";

grant trigger on table "public"."backup_products" to "authenticated";

grant truncate on table "public"."backup_products" to "authenticated";

grant update on table "public"."backup_products" to "authenticated";

grant delete on table "public"."backup_products" to "service_role";

grant insert on table "public"."backup_products" to "service_role";

grant references on table "public"."backup_products" to "service_role";

grant select on table "public"."backup_products" to "service_role";

grant trigger on table "public"."backup_products" to "service_role";

grant truncate on table "public"."backup_products" to "service_role";

grant update on table "public"."backup_products" to "service_role";

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant references on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant trigger on table "public"."orders" to "anon";

grant truncate on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant references on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant trigger on table "public"."orders" to "authenticated";

grant truncate on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."price_history" to "anon";

grant insert on table "public"."price_history" to "anon";

grant references on table "public"."price_history" to "anon";

grant select on table "public"."price_history" to "anon";

grant trigger on table "public"."price_history" to "anon";

grant truncate on table "public"."price_history" to "anon";

grant update on table "public"."price_history" to "anon";

grant delete on table "public"."price_history" to "authenticated";

grant insert on table "public"."price_history" to "authenticated";

grant references on table "public"."price_history" to "authenticated";

grant select on table "public"."price_history" to "authenticated";

grant trigger on table "public"."price_history" to "authenticated";

grant truncate on table "public"."price_history" to "authenticated";

grant update on table "public"."price_history" to "authenticated";

grant delete on table "public"."price_history" to "service_role";

grant insert on table "public"."price_history" to "service_role";

grant references on table "public"."price_history" to "service_role";

grant select on table "public"."price_history" to "service_role";

grant trigger on table "public"."price_history" to "service_role";

grant truncate on table "public"."price_history" to "service_role";

grant update on table "public"."price_history" to "service_role";

grant delete on table "public"."prices" to "anon";

grant insert on table "public"."prices" to "anon";

grant references on table "public"."prices" to "anon";

grant select on table "public"."prices" to "anon";

grant trigger on table "public"."prices" to "anon";

grant truncate on table "public"."prices" to "anon";

grant update on table "public"."prices" to "anon";

grant delete on table "public"."prices" to "authenticated";

grant insert on table "public"."prices" to "authenticated";

grant references on table "public"."prices" to "authenticated";

grant select on table "public"."prices" to "authenticated";

grant trigger on table "public"."prices" to "authenticated";

grant truncate on table "public"."prices" to "authenticated";

grant update on table "public"."prices" to "authenticated";

grant delete on table "public"."prices" to "service_role";

grant insert on table "public"."prices" to "service_role";

grant references on table "public"."prices" to "service_role";

grant select on table "public"."prices" to "service_role";

grant trigger on table "public"."prices" to "service_role";

grant truncate on table "public"."prices" to "service_role";

grant update on table "public"."prices" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."settings" to "anon";

grant insert on table "public"."settings" to "anon";

grant references on table "public"."settings" to "anon";

grant select on table "public"."settings" to "anon";

grant trigger on table "public"."settings" to "anon";

grant truncate on table "public"."settings" to "anon";

grant update on table "public"."settings" to "anon";

grant delete on table "public"."settings" to "authenticated";

grant insert on table "public"."settings" to "authenticated";

grant references on table "public"."settings" to "authenticated";

grant select on table "public"."settings" to "authenticated";

grant trigger on table "public"."settings" to "authenticated";

grant truncate on table "public"."settings" to "authenticated";

grant update on table "public"."settings" to "authenticated";

grant delete on table "public"."settings" to "service_role";

grant insert on table "public"."settings" to "service_role";

grant references on table "public"."settings" to "service_role";

grant select on table "public"."settings" to "service_role";

grant trigger on table "public"."settings" to "service_role";

grant truncate on table "public"."settings" to "service_role";

grant update on table "public"."settings" to "service_role";


  create policy "orders_delete_own_or_admin"
  on "public"."orders"
  as permissive
  for delete
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR (( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text)));



  create policy "orders_delete_user"
  on "public"."orders"
  as permissive
  for delete
  to authenticated
using (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (( SELECT public.is_admin(( SELECT auth.uid() AS uid)) AS is_admin) OR (( SELECT auth.uid() AS uid) = user_id))));



  create policy "orders_insert_own_or_admin"
  on "public"."orders"
  as permissive
  for insert
  to authenticated
with check (((user_id = ( SELECT auth.uid() AS uid)) OR (( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text)));



  create policy "orders_insert_user"
  on "public"."orders"
  as permissive
  for insert
  to authenticated
with check (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (( SELECT auth.uid() AS uid) = user_id)));



  create policy "orders_select_own_or_admin"
  on "public"."orders"
  as permissive
  for select
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR (( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text)));



  create policy "orders_select_user"
  on "public"."orders"
  as permissive
  for select
  to authenticated
using (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (( SELECT public.is_admin(( SELECT auth.uid() AS uid)) AS is_admin) OR (( SELECT auth.uid() AS uid) = user_id))));



  create policy "orders_update_own_or_admin"
  on "public"."orders"
  as permissive
  for update
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR (( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text)))
with check (((user_id = ( SELECT auth.uid() AS uid)) OR (( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text)));



  create policy "orders_update_user"
  on "public"."orders"
  as permissive
  for update
  to authenticated
using (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (( SELECT public.is_admin(( SELECT auth.uid() AS uid)) AS is_admin) OR (( SELECT auth.uid() AS uid) = user_id))))
with check (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (( SELECT public.is_admin(( SELECT auth.uid() AS uid)) AS is_admin) OR (( SELECT auth.uid() AS uid) = user_id))));



  create policy "prices_delete_admin_or_authenticated"
  on "public"."prices"
  as permissive
  for delete
  to authenticated
using (((( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text) OR true));



  create policy "prices_insert_admin"
  on "public"."prices"
  as permissive
  for insert
  to authenticated
with check (((( SELECT auth.uid() AS uid) IS NOT NULL) AND ( SELECT public.is_admin(( SELECT auth.uid() AS uid)) AS is_admin)));



  create policy "prices_insert_admin_or_authenticated"
  on "public"."prices"
  as permissive
  for insert
  to authenticated
with check (((( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text) OR true));



  create policy "prices_select_public"
  on "public"."prices"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "prices_update_admin"
  on "public"."prices"
  as permissive
  for update
  to authenticated
using (((( SELECT auth.uid() AS uid) IS NOT NULL) AND ( SELECT public.is_admin(( SELECT auth.uid() AS uid)) AS is_admin)))
with check (((( SELECT auth.uid() AS uid) IS NOT NULL) AND ( SELECT public.is_admin(( SELECT auth.uid() AS uid)) AS is_admin)));



  create policy "prices_update_admin_or_authenticated"
  on "public"."prices"
  as permissive
  for update
  to authenticated
using (((( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text) OR true))
with check (((( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text) OR true));



  create policy "products_delete_admin_or_authenticated"
  on "public"."products"
  as permissive
  for delete
  to authenticated
using (((( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text) OR true));



  create policy "products_insert_admin_or_authenticated"
  on "public"."products"
  as permissive
  for insert
  to authenticated
with check (((( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text) OR true));



  create policy "products_insert_auth"
  on "public"."products"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) IS NOT NULL));



  create policy "products_public_select"
  on "public"."products"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "products_select_public"
  on "public"."products"
  as permissive
  for select
  to public
using (true);



  create policy "products_update_admin_or_authenticated"
  on "public"."products"
  as permissive
  for update
  to authenticated
using (((( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text) OR true))
with check (((( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text) OR true));



  create policy "products_update_auth"
  on "public"."products"
  as permissive
  for update
  to authenticated
using (((( SELECT auth.uid() AS uid) IS NOT NULL) AND ( SELECT public.is_admin(( SELECT auth.uid() AS uid)) AS is_admin)))
with check (((( SELECT auth.uid() AS uid) IS NOT NULL) AND ( SELECT public.is_admin(( SELECT auth.uid() AS uid)) AS is_admin)));



  create policy "profiles_delete_admin_only"
  on "public"."profiles"
  as permissive
  for delete
  to authenticated
using ((( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text));



  create policy "profiles_insert_own_or_admin"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check (((id = ( SELECT auth.uid() AS uid)) OR (( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text)));



  create policy "profiles_select_own_or_admin"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (((id = ( SELECT auth.uid() AS uid)) OR (( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text)));



  create policy "profiles_update_own_or_admin"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using (((id = ( SELECT auth.uid() AS uid)) OR (( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text)))
with check (((id = ( SELECT auth.uid() AS uid)) OR (( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text)));



  create policy "settings_delete_admin_only"
  on "public"."settings"
  as permissive
  for delete
  to authenticated
using ((( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text));



  create policy "settings_insert_key_or_admin"
  on "public"."settings"
  as permissive
  for insert
  to authenticated
with check (((key IS NOT NULL) AND ((key ~~ 'public.%'::text) OR (( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text))));



  create policy "settings_select_publickey_or_admin"
  on "public"."settings"
  as permissive
  for select
  to authenticated
using (((key ~~ 'public.%'::text) OR (( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text)));



  create policy "settings_update_key_or_admin"
  on "public"."settings"
  as permissive
  for update
  to authenticated
using (((key ~~ 'public.%'::text) OR (( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text)))
with check (((key IS NOT NULL) AND ((key ~~ 'public.%'::text) OR (( SELECT (auth.jwt() ->> 'user_role'::text)) = 'admin'::text))));


CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_prevent_role_change BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_prevent_role_change();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER create_profile_webhook AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://ulibmcqfuemefekyvrqj.supabase.co/functions/v1/create-profile-after-signup', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsaWJtY3FmdWVtZWZla3l2cnFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTMyMjE2OSwiZXhwIjoyMDg0ODk4MTY5fQ.9bMEaIhRdPG5Qe4JTN8Znnuqfu1PwJ4yspCAO3Y8XnI"}', '{}', '5000');

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


  create policy "Admin Delete Products"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'products'::text) AND (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)));



  create policy "Admin Upload Products"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'products'::text) AND (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)));



  create policy "Public View Products"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'products'::text));



  create policy "products_delete_admin"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'products'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))));



  create policy "products_insert_auth"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'products'::text) AND ((name ~~ 'products/%'::text) OR (name ~~ 'requests/%'::text))));



  create policy "products_select_auth"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'products'::text));



  create policy "products_update_admin"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'products'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))));



