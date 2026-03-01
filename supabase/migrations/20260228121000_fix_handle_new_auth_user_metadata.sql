begin;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = new.id) then
    insert into public.profiles (id, email, full_name, role, created_at)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      'user',
      now()
    );
  end if;
  return new;
end;
$$;

commit;
