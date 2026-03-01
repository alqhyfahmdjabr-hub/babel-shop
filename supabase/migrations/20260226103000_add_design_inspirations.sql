-- Build-Your-Piece Studio
-- Admin-managed inspiration images metadata (files stay in existing 'products' bucket).

create table if not exists public.design_inspirations (
  id uuid primary key default extensions.uuid_generate_v4(),
  title text not null,
  piece_type text not null default 'general',
  image_url text not null,
  storage_path text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid default public.current_auth_uid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint design_inspirations_title_not_blank check (char_length(trim(title)) > 0),
  constraint design_inspirations_image_url_not_blank check (char_length(trim(image_url)) > 0),
  constraint design_inspirations_storage_path_not_blank check (char_length(trim(storage_path)) > 0),
  constraint design_inspirations_created_by_fkey
    foreign key (created_by) references auth.users (id) on delete set null
);

create index if not exists idx_design_inspirations_active_sort
  on public.design_inspirations (is_active, sort_order, created_at desc);

create index if not exists idx_design_inspirations_piece_type
  on public.design_inspirations (piece_type);

alter table public.design_inspirations enable row level security;

grant select, insert, update, delete on table public.design_inspirations to authenticated;
grant all on table public.design_inspirations to service_role;

drop policy if exists "design_inspirations_select_active_or_admin" on public.design_inspirations;
create policy "design_inspirations_select_active_or_admin"
on public.design_inspirations
as permissive
for select
to authenticated
using ((is_active = true) or public.is_admin(auth.uid()));

drop policy if exists "design_inspirations_insert_admin_only" on public.design_inspirations;
create policy "design_inspirations_insert_admin_only"
on public.design_inspirations
as permissive
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "design_inspirations_update_admin_only" on public.design_inspirations;
create policy "design_inspirations_update_admin_only"
on public.design_inspirations
as permissive
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "design_inspirations_delete_admin_only" on public.design_inspirations;
create policy "design_inspirations_delete_admin_only"
on public.design_inspirations
as permissive
for delete
to authenticated
using (public.is_admin(auth.uid()));

drop trigger if exists update_design_inspirations_updated_at on public.design_inspirations;
create trigger update_design_inspirations_updated_at
before update on public.design_inspirations
for each row
execute function public.update_updated_at_column();
