begin;

-- Schedule periodic price refresh via pg_cron.
-- Depends on util.invoke_update_gold_prices_secure() which posts to the Edge Function.
-- IMPORTANT: The Vault secret "cron_update_gold.x_cron_secret" must exist and match the Edge Function CRON_SECRET.

do $do$
declare
  existing_job_id integer;
begin
  -- If pg_cron isn't installed/available, don't fail the migration.
  if to_regclass('cron.job') is null then
    raise notice 'pg_cron not available; skipping gold price scheduling';
    return;
  end if;

  -- If the invoker function isn't present, don't fail the migration.
  if to_regproc('util.invoke_update_gold_prices_secure') is null then
    raise notice 'util.invoke_update_gold_prices_secure() not found; skipping gold price scheduling';
    return;
  end if;

  -- Avoid duplicating the job on re-runs.
  select j.jobid
    into existing_job_id
  from cron.job j
  where j.jobname = 'update_gold_prices_every_5_min'
  limit 1;

  if existing_job_id is null then
    perform cron.schedule(
      'update_gold_prices_every_5_min',
      '*/5 * * * *',
      $cmd$select util.invoke_update_gold_prices_secure();$cmd$
    );
  end if;
end
$do$;

commit;

