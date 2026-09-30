-- Hito 6: movimientos reales y catálogo por usuario.
-- No reescribe filas históricas. Quitar la cascada solo cambia qué pasa al borrar.

alter table public.categories
  add column archived_at timestamptz;

comment on column public.categories.archived_at is
  'Nulo significa activa. Archivada conserva el historial y no se ofrece al crear movimientos.';

alter table public.profiles
  add column default_categories_seeded_at timestamptz;

comment on column public.profiles.default_categories_seeded_at is
  'Marca que el catálogo inicial ya se creó una vez, después de confirmar el correo. El cliente no puede cambiarla.';

create or replace function private.protect_profile_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'No se puede cambiar el identificador.';
  end if;

  if new.currency is distinct from old.currency
     or new.timezone is distinct from old.timezone
     or new.created_at is distinct from old.created_at then
    raise exception 'No se puede cambiar la moneda, la zona horaria ni la fecha de creación.';
  end if;

  if (select auth.uid()) is not null
     and new.default_categories_seeded_at is distinct from old.default_categories_seeded_at then
    raise exception 'No se puede cambiar el catálogo inicial.';
  end if;

  if new.display_name is not null then
    new.display_name := btrim(new.display_name);
    if char_length(new.display_name) = 0 then
      new.display_name := null;
    end if;
  end if;

  if (select auth.uid()) is not null and not private.email_is_confirmed() then
    if new.income_frequency is distinct from old.income_frequency
       or new.income_weekday is distinct from old.income_weekday
       or new.income_anchor_date is distinct from old.income_anchor_date
       or new.expected_income_cents is distinct from old.expected_income_cents
       or new.estimated_expense_cents is distinct from old.estimated_expense_cents
       or new.tracking_started_on is distinct from old.tracking_started_on
       or new.last_account_id is distinct from old.last_account_id then
      raise exception 'Confirma tu correo antes de guardar datos financieros.';
    end if;
  end if;

  return new;
end;
$$;

create function private.normalize_category_name()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.name := btrim(new.name);
  return new;
end;
$$;

create trigger categories_normalize_name
  before insert or update of name on public.categories
  for each row
  execute function private.normalize_category_name();

create unique index categories_name_per_kind_idx
  on public.categories (user_id, kind, lower(name));

create function private.normalize_movement_note()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.note is not null then
    new.note := btrim(new.note);
    if char_length(new.note) = 0 then
      new.note := null;
    end if;
  end if;
  return new;
end;
$$;

create trigger movements_normalize_note
  before insert or update of note on public.movements
  for each row
  execute function private.normalize_movement_note();

alter table public.movements
  drop constraint movements_expense_category;

alter table public.movements
  add constraint movements_amount_positive check (amount_cents > 0);

alter table public.movements
  add constraint movements_category_required check (category_id is not null);

alter table public.movements
  add constraint movements_note_length check (note is null or char_length(note) <= 280);

alter table public.movements drop constraint movements_account_same_user;
alter table public.movements
  add constraint movements_account_same_user
  foreign key (account_id, user_id)
  references public.accounts (id, user_id)
  on delete restrict;

alter table public.movements drop constraint movements_category_same_user;
alter table public.movements
  add constraint movements_category_same_user
  foreign key (category_id, user_id)
  references public.categories (id, user_id)
  on delete restrict;

alter table public.budgets drop constraint budgets_category_same_user;
alter table public.budgets
  add constraint budgets_category_same_user
  foreign key (category_id, user_id)
  references public.categories (id, user_id)
  on delete restrict;

alter table public.recurring_commitments drop constraint recurring_commitments_category_same_user;
alter table public.recurring_commitments
  add constraint recurring_commitments_category_same_user
  foreign key (category_id, user_id)
  references public.categories (id, user_id)
  on delete restrict;

alter table public.goal_disbursements drop constraint goal_disbursements_account_same_user;
alter table public.goal_disbursements
  add constraint goal_disbursements_account_same_user
  foreign key (account_id, user_id)
  references public.accounts (id, user_id)
  on delete restrict;

-- Siembra solo con el correo confirmado, y una sola vez.
-- security definer escribe fuera de RLS: no se otorga al cliente.
create function private.seed_default_categories(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and (select auth.uid()) is distinct from target then
    raise exception 'No se puede sembrar el catálogo de otra persona.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(target::text));

  if exists (
    select 1
    from public.profiles
    where profiles.id = target
      and profiles.default_categories_seeded_at is not null
  ) then
    return;
  end if;

  if not exists (
    select 1
    from auth.users
    where users.id = target
      and users.email_confirmed_at is not null
  ) then
    return;
  end if;

  if not exists (
    select 1
    from public.profiles
    where profiles.id = target
  ) then
    return;
  end if;

  insert into public.categories (user_id, name, kind)
  select target, seed.name, seed.kind
  from (
    values
      ('Nómina', 'ingreso'),
      ('Honorarios', 'ingreso'),
      ('Ventas o negocio', 'ingreso'),
      ('Reembolso', 'ingreso'),
      ('Otro ingreso', 'ingreso'),
      ('Comida', 'gasto'),
      ('Transporte', 'gasto'),
      ('Vivienda', 'gasto'),
      ('Servicios', 'gasto'),
      ('Salud', 'gasto'),
      ('Educación', 'gasto'),
      ('Suscripciones', 'gasto'),
      ('Entretenimiento', 'gasto'),
      ('Personal', 'gasto'),
      ('Otros', 'gasto')
  ) as seed(name, kind)
  where not exists (
    select 1
    from public.categories as existing
    where existing.user_id = target
      and existing.kind = seed.kind
      and lower(existing.name) = lower(seed.name)
  );

  update public.profiles
  set default_categories_seeded_at = now()
  where profiles.id = target
    and profiles.default_categories_seeded_at is null;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, currency, timezone)
  values (new.id, 'MXN', 'America/Mexico_City');

  if new.email_confirmed_at is not null then
    perform private.seed_default_categories(new.id);
  end if;

  return new;
end;
$$;

create function private.handle_user_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    perform private.seed_default_categories(new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  execute function private.handle_user_email_confirmed();

-- Quien ya confirmó antes de esta migración recibe el catálogo una vez.
-- Quien sigue sin confirmar no entra en el bucle, y la función tampoco lo siembra.
do $$
declare
  profile_id uuid;
begin
  for profile_id in
    select profiles.id
    from public.profiles
    join auth.users on auth.users.id = profiles.id
    where auth.users.email_confirmed_at is not null
      and profiles.default_categories_seeded_at is null
  loop
    perform private.seed_default_categories(profile_id);
  end loop;
end;
$$;

create function private.confirmed_movement_date_allowed()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  today date := (timezone('America/Mexico_City', clock_timestamp()))::date;
begin
  if new.status = 'confirmado' and new.occurred_on > today then
    raise exception 'Un movimiento confirmado no puede tener fecha futura.';
  end if;
  return new;
end;
$$;

create trigger movements_reject_future_confirmed
  before insert or update of status, occurred_on on public.movements
  for each row
  execute function private.confirmed_movement_date_allowed();

create function private.protect_disbursement_movement()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  locked boolean := current_user in ('anon', 'authenticated', 'authenticator')
    or current_setting('ahorruta.goal_movement', true) is distinct from 'allow';
begin
  if tg_op = 'DELETE' then
    if old.goal_disbursement_id is not null and locked then
      raise exception 'Este gasto pertenece a una meta. Se corrige desde la meta.';
    end if;
    return old;
  end if;

  if (old.goal_disbursement_id is not null or new.goal_disbursement_id is not null) and locked then
    raise exception 'Este gasto pertenece a una meta. Se corrige desde la meta.';
  end if;

  return new;
end;
$$;

create trigger movements_protect_disbursement
  before update or delete on public.movements
  for each row
  execute function private.protect_disbursement_movement();

create function private.clear_last_account_when_archived()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.active and not new.active then
    update public.profiles
    set last_account_id = null
    where profiles.id = new.user_id
      and profiles.last_account_id = new.id;
  end if;
  return new;
end;
$$;

create trigger accounts_clear_last_when_archived
  before update of active on public.accounts
  for each row
  execute function private.clear_last_account_when_archived();

-- Borra primero los hijos que impedirían la cascada del usuario.
-- La app sigue borrando la cuenta solo por delete-account.
create function private.delete_user_financial_children()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('ahorruta.goal_movement', 'allow', true);
  delete from public.movements where movements.user_id = old.id;
  delete from public.budgets where budgets.user_id = old.id;
  delete from public.recurring_commitments where recurring_commitments.user_id = old.id;
  delete from public.goal_immediate_contributions where goal_immediate_contributions.user_id = old.id;
  delete from public.goal_disbursements where goal_disbursements.user_id = old.id;
  return old;
end;
$$;

create trigger on_auth_user_delete_financial_children
  before delete on auth.users
  for each row
  execute function private.delete_user_financial_children();

revoke all on function private.normalize_category_name() from public;
revoke all on function private.normalize_movement_note() from public;
revoke all on function private.seed_default_categories(uuid) from public, anon, authenticated, service_role;
revoke all on function private.handle_user_email_confirmed() from public, anon, authenticated, service_role;
revoke all on function private.confirmed_movement_date_allowed() from public;
revoke all on function private.protect_disbursement_movement() from public;
revoke all on function private.clear_last_account_when_archived() from public;
revoke all on function private.delete_user_financial_children() from public;

grant execute on function private.normalize_category_name() to authenticated;
grant execute on function private.normalize_movement_note() to authenticated;
grant execute on function private.confirmed_movement_date_allowed() to authenticated;
grant execute on function private.protect_disbursement_movement() to authenticated;
grant execute on function private.clear_last_account_when_archived() to authenticated;
grant execute on function private.seed_default_categories(uuid) to supabase_auth_admin;
grant execute on function private.handle_user_email_confirmed() to supabase_auth_admin;
grant execute on function private.delete_user_financial_children() to supabase_auth_admin;
