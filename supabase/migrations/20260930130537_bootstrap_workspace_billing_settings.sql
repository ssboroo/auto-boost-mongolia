-- Keep workspace bootstrap reproducible in source control.
-- Applied to production Supabase on 2026-09-30.

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  workspace uuid;
begin
  insert into public.profiles(user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;

  insert into public.workspaces(owner_id, name)
  values (new.id, 'Үндсэн workspace')
  returning id into workspace;

  insert into public.workspace_members(workspace_id, user_id, role)
  values (workspace, new.id, 'owner');

  insert into public.billing_settings(
    workspace_id,
    service_fee_percent,
    fallback_usd_mnt_rate,
    fallback_rate_date,
    updated_by
  )
  values (
    workspace,
    10,
    3595.21,
    date '2026-09-01',
    new.id
  )
  on conflict (workspace_id) do nothing;

  return new;
end;
$$;
