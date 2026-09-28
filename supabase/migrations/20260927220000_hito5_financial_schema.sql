-- Hito 5: perfil, finanzas y aislamiento.
-- El motor de la app sigue calculando saldo, reserva, progreso, calendario y viabilidad.
-- Esta base guarda hechos. No los recalcula.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;
grant usage on schema private to supabase_auth_admin;

-- Mismo tope que Number.MAX_SAFE_INTEGER, el rango que acepta src/money.ts.
create domain public.nonneg_cents as bigint
  constraint nonneg_cents_range check (value >= 0 and value <= 9007199254740991);

create domain public.positive_cents as bigint
  constraint positive_cents_range check (value > 0 and value <= 9007199254740991);

create domain public.signed_cents as bigint
  constraint signed_cents_range check (value >= -9007199254740991 and value <= 9007199254740991);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  currency text not null default 'MXN',
  timezone text not null default 'America/Mexico_City',
  income_frequency text,
  income_weekday text,
  income_anchor_date date,
  expected_income_cents public.nonneg_cents,
  estimated_expense_cents public.nonneg_cents,
  tracking_started_on date,
  last_account_id uuid,
  created_at timestamptz not null default now(),
  constraint profiles_currency_mxn check (currency = 'MXN'),
  constraint profiles_timezone_mexico check (timezone = 'America/Mexico_City'),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) <= 80),
  constraint profiles_income_frequency check (
    income_frequency is null
    or income_frequency in ('semanal', 'quincena-calendario', 'cada-14-dias', 'mensual')
  ),
  constraint profiles_income_weekday check (
    income_weekday is null
    or income_weekday in ('domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado')
  ),
  constraint profiles_income_shape check (
    (
      income_frequency is null
      and income_weekday is null
      and income_anchor_date is null
    )
    or (
      income_frequency = 'semanal'
      and income_weekday is not null
      and income_anchor_date is null
    )
    or (
      income_frequency = 'quincena-calendario'
      and income_weekday is null
      and income_anchor_date is null
    )
    or (
      income_frequency = 'cada-14-dias'
      and income_weekday is null
      and income_anchor_date is not null
    )
    or (
      income_frequency = 'mensual'
      and income_weekday is null
      and income_anchor_date is null
    )
  )
);

comment on table public.profiles is
  'El propietario es profiles.id = auth.users.id. No existe una columna user_id.';

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null,
  opening_balance_cents public.signed_cents not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint accounts_kind check (kind in ('efectivo', 'debito', 'ahorro')),
  constraint accounts_name check (char_length(btrim(name)) > 0),
  constraint accounts_id_user unique (id, user_id)
);

create index accounts_user_id_idx on public.accounts (user_id);

alter table public.profiles
  add constraint profiles_last_account_same_user
  foreign key (last_account_id, id)
  references public.accounts (id, user_id)
  deferrable initially deferred;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null,
  icon text,
  color_token text,
  created_at timestamptz not null default now(),
  constraint categories_kind check (kind in ('ingreso', 'gasto')),
  constraint categories_name check (char_length(btrim(name)) > 0),
  constraint categories_id_user unique (id, user_id)
);

create index categories_user_id_idx on public.categories (user_id);

create table public.movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null,
  category_id uuid,
  kind text not null,
  amount_cents public.nonneg_cents not null,
  status text not null,
  occurred_on date not null,
  note text,
  goal_disbursement_id uuid,
  created_at timestamptz not null default now(),
  constraint movements_kind check (kind in ('ingreso', 'gasto')),
  constraint movements_status check (status in ('confirmado', 'pendiente')),
  constraint movements_expense_category check (kind <> 'gasto' or category_id is not null),
  constraint movements_disbursement_shape check (
    goal_disbursement_id is null
    or (kind = 'gasto' and status = 'confirmado')
  ),
  constraint movements_id_user unique (id, user_id),
  constraint movements_account_same_user
    foreign key (account_id, user_id)
    references public.accounts (id, user_id)
    on delete cascade,
  constraint movements_category_same_user
    foreign key (category_id, user_id)
    references public.categories (id, user_id)
    on delete cascade
);

create unique index movements_one_disbursement_idx
  on public.movements (goal_disbursement_id)
  where goal_disbursement_id is not null;

create index movements_user_id_idx on public.movements (user_id);

comment on column public.movements.goal_disbursement_id is
  'Un desembolso produce un solo gasto confirmado. La aportación inmediata no tiene movimiento. En el Hito 8, el desembolso y este gasto se insertan en la misma transacción: primero el desembolso y después el movimiento. Un disparador diferido rechaza la transacción si el desembolso queda sin ese gasto.';

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null,
  period_start date not null,
  period_end date not null,
  limit_cents public.nonneg_cents not null,
  created_at timestamptz not null default now(),
  constraint budgets_period check (period_end >= period_start),
  constraint budgets_id_user unique (id, user_id),
  constraint budgets_category_same_user
    foreign key (category_id, user_id)
    references public.categories (id, user_id)
    on delete cascade
);

create index budgets_user_id_idx on public.budgets (user_id);

-- Suscripciones, renta y otros pagos recurrentes. No crea un gasto hasta confirmarse.
create table public.recurring_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount_cents public.positive_cents not null,
  frequency text not null,
  next_occurrence_on date not null,
  category_id uuid not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint recurring_commitments_name check (char_length(btrim(name)) > 0),
  constraint recurring_commitments_frequency check (
    frequency in ('semanal', 'quincena-calendario', 'cada-14-dias', 'mensual')
  ),
  constraint recurring_commitments_id_user unique (id, user_id),
  constraint recurring_commitments_category_same_user
    foreign key (category_id, user_id)
    references public.categories (id, user_id)
    on delete cascade
);

create index recurring_commitments_user_id_idx on public.recurring_commitments (user_id);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint goals_name check (char_length(btrim(name)) > 0),
  constraint goals_id_user unique (id, user_id)
);

create index goals_user_id_idx on public.goals (user_id);

create table public.goal_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null,
  version integer not null,
  target_cents public.nonneg_cents not null,
  opening_savings_cents public.nonneg_cents not null,
  frequency_kind text not null,
  frequency_weekday text,
  frequency_first_date date,
  frequency_day integer,
  from_date date not null,
  deadline date not null,
  created_at timestamptz not null default now(),
  constraint goal_versions_version_positive check (version >= 1),
  constraint goal_versions_deadline check (deadline >= from_date),
  constraint goal_versions_frequency_kind check (
    frequency_kind in ('semanal', 'quincena-calendario', 'cada-14-dias', 'mensual')
  ),
  constraint goal_versions_frequency_weekday check (
    frequency_weekday is null
    or frequency_weekday in ('domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado')
  ),
  constraint goal_versions_frequency_day check (
    frequency_day is null or (frequency_day >= 1 and frequency_day <= 31)
  ),
  constraint goal_versions_frequency_shape check (
    (
      frequency_kind = 'semanal'
      and frequency_weekday is not null
      and frequency_first_date is null
      and frequency_day is null
    )
    or (
      frequency_kind = 'quincena-calendario'
      and frequency_weekday is null
      and frequency_first_date is null
      and frequency_day is null
    )
    or (
      frequency_kind = 'cada-14-dias'
      and frequency_weekday is null
      and frequency_first_date is not null
      and frequency_day is null
    )
    or (
      frequency_kind = 'mensual'
      and frequency_weekday is null
      and frequency_first_date is null
      and frequency_day is not null
    )
  ),
  constraint goal_versions_id_user unique (id, user_id),
  constraint goal_versions_goal_version unique (goal_id, version),
  constraint goal_versions_goal_version_user unique (goal_id, version, user_id),
  constraint goal_versions_identity unique (id, goal_id, version, user_id),
  constraint goal_versions_goal_same_user
    foreign key (goal_id, user_id)
    references public.goals (id, user_id)
    on delete cascade
);

create index goal_versions_user_id_idx on public.goal_versions (user_id);

comment on table public.goal_versions is
  'Parámetros confirmados de una versión. Para reconstruir la versión V: esta fila, sus hitos y los hechos de la meta con introduced_in_version <= V. Reserva, progreso, calendario y viabilidad no se guardan.';

create table public.goal_milestones (
  goal_version_id uuid not null,
  milestone_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  planned_cents public.positive_cents not null,
  due_on date not null,
  created_at timestamptz not null default now(),
  primary key (goal_version_id, milestone_id),
  constraint goal_milestones_name check (char_length(btrim(name)) > 0),
  constraint goal_milestones_version_user unique (goal_version_id, milestone_id, user_id),
  constraint goal_milestones_version_same_user
    foreign key (goal_version_id, user_id)
    references public.goal_versions (id, user_id)
    on delete cascade
);

create index goal_milestones_user_id_idx on public.goal_milestones (user_id);

comment on table public.goal_milestones is
  'Copia de los hitos de una versión confirmada. El identificador del hito se conserva entre versiones; el importe planeado puede cambiar en una versión nueva.';

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null,
  introduced_in_version integer not null,
  amount_cents public.positive_cents not null,
  occurred_on date not null,
  created_at timestamptz not null default now(),
  constraint goal_contributions_id_user unique (id, user_id),
  constraint goal_contributions_goal_same_user
    foreign key (goal_id, user_id)
    references public.goals (id, user_id)
    on delete cascade,
  constraint goal_contributions_version_same_user
    foreign key (goal_id, introduced_in_version, user_id)
    references public.goal_versions (goal_id, version, user_id)
    on delete cascade
);

create index goal_contributions_user_id_idx on public.goal_contributions (user_id);

comment on table public.goal_contributions is
  'Hecho histórico único de la meta. No se duplica en cada versión. introduced_in_version indica desde qué versión participa.';

create table public.goal_disbursements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null,
  goal_version_id uuid not null,
  introduced_in_version integer not null,
  milestone_id uuid not null,
  account_id uuid not null,
  amount_cents public.positive_cents not null,
  occurred_on date not null,
  created_at timestamptz not null default now(),
  constraint goal_disbursements_id_user unique (id, user_id),
  constraint goal_disbursements_goal_same_user
    foreign key (goal_id, user_id)
    references public.goals (id, user_id)
    on delete cascade,
  constraint goal_disbursements_version_identity
    foreign key (goal_version_id, goal_id, introduced_in_version, user_id)
    references public.goal_versions (id, goal_id, version, user_id)
    on delete cascade,
  constraint goal_disbursements_milestone_same_user
    foreign key (goal_version_id, milestone_id, user_id)
    references public.goal_milestones (goal_version_id, milestone_id, user_id)
    on delete cascade,
  constraint goal_disbursements_account_same_user
    foreign key (account_id, user_id)
    references public.accounts (id, user_id)
    on delete cascade
);

create index goal_disbursements_user_id_idx on public.goal_disbursements (user_id);

comment on table public.goal_disbursements is
  'Hecho histórico único. Produce un solo gasto confirmado en movements. La aportación inmediata, si hace falta, es otra fila y no un movimiento.';

create table public.goal_immediate_contributions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null,
  introduced_in_version integer not null,
  disbursement_id uuid not null,
  amount_cents public.positive_cents not null,
  occurred_on date not null,
  created_at timestamptz not null default now(),
  constraint goal_immediate_contributions_id check (char_length(btrim(id)) > 0),
  constraint goal_immediate_contributions_id_user unique (id, user_id),
  constraint goal_immediate_contributions_one_per_disbursement unique (disbursement_id),
  constraint goal_immediate_contributions_goal_same_user
    foreign key (goal_id, user_id)
    references public.goals (id, user_id)
    on delete cascade,
  constraint goal_immediate_contributions_version_same_user
    foreign key (goal_id, introduced_in_version, user_id)
    references public.goal_versions (goal_id, version, user_id)
    on delete cascade,
  constraint goal_immediate_contributions_disbursement_same_user
    foreign key (disbursement_id, user_id)
    references public.goal_disbursements (id, user_id)
    on delete cascade
);

create index goal_immediate_contributions_user_id_idx on public.goal_immediate_contributions (user_id);

comment on table public.goal_immediate_contributions is
  'Hecho histórico único. No se convierte en movimiento. El identificador conserva el texto que produce el motor.';

create table public.goal_omitted_dates (
  goal_id uuid not null,
  omitted_on date not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  introduced_in_version integer not null,
  created_at timestamptz not null default now(),
  primary key (goal_id, omitted_on),
  constraint goal_omitted_dates_goal_same_user
    foreign key (goal_id, user_id)
    references public.goals (id, user_id)
    on delete cascade,
  constraint goal_omitted_dates_version_same_user
    foreign key (goal_id, introduced_in_version, user_id)
    references public.goal_versions (goal_id, version, user_id)
    on delete cascade
);

create index goal_omitted_dates_user_id_idx on public.goal_omitted_dates (user_id);

comment on table public.goal_omitted_dates is
  'Fecha omitida, guardada una sola vez y ligada a la versión en la que se introdujo.';

alter table public.movements
  add constraint movements_disbursement_same_user
  foreign key (goal_disbursement_id, user_id)
  references public.goal_disbursements (id, user_id)
  on delete cascade;

-- Funciones internas. No borran cuentas y no forman parte de la API pública.

create function private.email_is_confirmed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where id = (select auth.uid())
      and email_confirmed_at is not null
  );
$$;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, currency, timezone)
  values (new.id, 'MXN', 'America/Mexico_City');
  return new;
end;
$$;

create function private.protect_profile_fields()
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

create function private.prevent_user_id_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'No se puede cambiar el propietario.';
  end if;
  return new;
end;
$$;

create function private.clear_last_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set last_account_id = null
  where id = old.user_id
    and last_account_id = old.id;
  return old;
end;
$$;

create function private.enforce_milestone_total()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  version_id uuid;
  total bigint;
  target bigint;
begin
  if tg_table_name = 'goal_versions' then
    version_id := new.id;
    target := new.target_cents;
  else
    version_id := coalesce(new.goal_version_id, old.goal_version_id);
    select goal_versions.target_cents
      into target
    from public.goal_versions
    where goal_versions.id = version_id;
  end if;

  select coalesce(sum(goal_milestones.planned_cents), 0)
    into total
  from public.goal_milestones
  where goal_milestones.goal_version_id = version_id;

  if total > target then
    raise exception 'La suma de los hitos supera el objetivo.';
  end if;

  return coalesce(new, old);
end;
$$;

create function private.movement_matches_disbursement()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.goal_disbursement_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.goal_disbursements
    where goal_disbursements.id = new.goal_disbursement_id
      and goal_disbursements.user_id = new.user_id
      and goal_disbursements.account_id = new.account_id
      and goal_disbursements.amount_cents = new.amount_cents
      and goal_disbursements.occurred_on = new.occurred_on
  ) then
    raise exception 'El gasto del desembolso debe coincidir en cuenta, monto y fecha.';
  end if;

  return new;
end;
$$;

create function private.assert_disbursements_have_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.goal_disbursements
    where not exists (
      select 1
      from public.movements
      where movements.goal_disbursement_id = goal_disbursements.id
        and movements.user_id = goal_disbursements.user_id
        and movements.kind = 'gasto'
        and movements.status = 'confirmado'
    )
  ) then
    raise exception 'El desembolso y su único gasto deben guardarse en la misma transacción.';
  end if;

  return null;
end;
$$;

revoke all on function private.email_is_confirmed() from public;
revoke all on function private.handle_new_user() from public;
revoke all on function private.protect_profile_fields() from public;
revoke all on function private.prevent_user_id_change() from public;
revoke all on function private.clear_last_account() from public;
revoke all on function private.enforce_milestone_total() from public;
revoke all on function private.movement_matches_disbursement() from public;
revoke all on function private.assert_disbursements_have_movement() from public;

grant execute on function private.email_is_confirmed() to authenticated;
grant execute on function private.protect_profile_fields() to authenticated;
grant execute on function private.prevent_user_id_change() to authenticated;
grant execute on function private.clear_last_account() to authenticated, supabase_auth_admin;
grant execute on function private.enforce_milestone_total() to authenticated;
grant execute on function private.movement_matches_disbursement() to authenticated;
grant execute on function private.assert_disbursements_have_movement() to authenticated, supabase_auth_admin;
grant execute on function private.handle_new_user() to supabase_auth_admin;
grant execute on function private.protect_profile_fields() to supabase_auth_admin;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

create trigger profiles_protect_fields
  before update on public.profiles
  for each row
  execute function private.protect_profile_fields();

create trigger accounts_lock_owner
  before update on public.accounts
  for each row
  execute function private.prevent_user_id_change();

create trigger accounts_clear_last_used
  before delete on public.accounts
  for each row
  execute function private.clear_last_account();

create trigger categories_lock_owner
  before update on public.categories
  for each row
  execute function private.prevent_user_id_change();

create trigger movements_lock_owner
  before update on public.movements
  for each row
  execute function private.prevent_user_id_change();

create trigger movements_match_disbursement
  before insert or update on public.movements
  for each row
  execute function private.movement_matches_disbursement();

create trigger budgets_lock_owner
  before update on public.budgets
  for each row
  execute function private.prevent_user_id_change();

create trigger recurring_commitments_lock_owner
  before update on public.recurring_commitments
  for each row
  execute function private.prevent_user_id_change();

create trigger goals_lock_owner
  before update on public.goals
  for each row
  execute function private.prevent_user_id_change();

create trigger goal_versions_lock_owner
  before update on public.goal_versions
  for each row
  execute function private.prevent_user_id_change();

create trigger goal_versions_check_milestones
  after insert or update of target_cents on public.goal_versions
  for each row
  execute function private.enforce_milestone_total();

create trigger goal_milestones_lock_owner
  before update on public.goal_milestones
  for each row
  execute function private.prevent_user_id_change();

create trigger goal_milestones_check_total
  after insert or update or delete on public.goal_milestones
  for each row
  execute function private.enforce_milestone_total();

create trigger goal_contributions_lock_owner
  before update on public.goal_contributions
  for each row
  execute function private.prevent_user_id_change();

create trigger goal_disbursements_lock_owner
  before update on public.goal_disbursements
  for each row
  execute function private.prevent_user_id_change();

create trigger goal_immediate_contributions_lock_owner
  before update on public.goal_immediate_contributions
  for each row
  execute function private.prevent_user_id_change();

create trigger goal_omitted_dates_lock_owner
  before update on public.goal_omitted_dates
  for each row
  execute function private.prevent_user_id_change();

create constraint trigger goal_disbursements_require_movement
  after insert or update on public.goal_disbursements
  deferrable initially deferred
  for each row
  execute function private.assert_disbursements_have_movement();

create constraint trigger movements_keep_disbursement
  after delete on public.movements
  deferrable initially deferred
  for each row
  execute function private.assert_disbursements_have_movement();

-- RLS

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.movements enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_commitments enable row level security;
alter table public.goals enable row level security;
alter table public.goal_versions enable row level security;
alter table public.goal_milestones enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.goal_disbursements enable row level security;
alter table public.goal_immediate_contributions enable row level security;
alter table public.goal_omitted_dates enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.accounts from anon, authenticated;
revoke all on table public.categories from anon, authenticated;
revoke all on table public.movements from anon, authenticated;
revoke all on table public.budgets from anon, authenticated;
revoke all on table public.recurring_commitments from anon, authenticated;
revoke all on table public.goals from anon, authenticated;
revoke all on table public.goal_versions from anon, authenticated;
revoke all on table public.goal_milestones from anon, authenticated;
revoke all on table public.goal_contributions from anon, authenticated;
revoke all on table public.goal_disbursements from anon, authenticated;
revoke all on table public.goal_immediate_contributions from anon, authenticated;
revoke all on table public.goal_omitted_dates from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.accounts to authenticated;
grant select, insert, update, delete on table public.categories to authenticated;
grant select, insert, update, delete on table public.movements to authenticated;
grant select, insert, update, delete on table public.budgets to authenticated;
grant select, insert, update, delete on table public.recurring_commitments to authenticated;
grant select, insert, update, delete on table public.goals to authenticated;
grant select, insert, update, delete on table public.goal_versions to authenticated;
grant select, insert, update, delete on table public.goal_milestones to authenticated;
grant select, insert, update, delete on table public.goal_contributions to authenticated;
grant select, insert, update, delete on table public.goal_disbursements to authenticated;
grant select, insert, update, delete on table public.goal_immediate_contributions to authenticated;
grant select, insert, update, delete on table public.goal_omitted_dates to authenticated;

create policy profiles_select
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and (
      (select private.email_is_confirmed())
      or (
        currency = 'MXN'
        and timezone = 'America/Mexico_City'
        and income_frequency is null
        and income_weekday is null
        and income_anchor_date is null
        and expected_income_cents is null
        and estimated_expense_cents is null
        and tracking_started_on is null
        and last_account_id is null
      )
    )
  );

create policy accounts_select
  on public.accounts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy accounts_insert
  on public.accounts
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy accounts_update
  on public.accounts
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy accounts_delete
  on public.accounts
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy categories_select
  on public.categories
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy categories_insert
  on public.categories
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy categories_update
  on public.categories
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy categories_delete
  on public.categories
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy movements_select
  on public.movements
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy movements_insert
  on public.movements
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy movements_update
  on public.movements
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy movements_delete
  on public.movements
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy budgets_select
  on public.budgets
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy budgets_insert
  on public.budgets
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy budgets_update
  on public.budgets
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy budgets_delete
  on public.budgets
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy recurring_commitments_select
  on public.recurring_commitments
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy recurring_commitments_insert
  on public.recurring_commitments
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy recurring_commitments_update
  on public.recurring_commitments
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy recurring_commitments_delete
  on public.recurring_commitments
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy goals_select
  on public.goals
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy goals_insert
  on public.goals
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy goals_update
  on public.goals
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy goals_delete
  on public.goals
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy goal_versions_select
  on public.goal_versions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy goal_versions_insert
  on public.goal_versions
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy goal_versions_update
  on public.goal_versions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy goal_versions_delete
  on public.goal_versions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy goal_milestones_select
  on public.goal_milestones
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy goal_milestones_insert
  on public.goal_milestones
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy goal_milestones_update
  on public.goal_milestones
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy goal_milestones_delete
  on public.goal_milestones
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy goal_contributions_select
  on public.goal_contributions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy goal_contributions_insert
  on public.goal_contributions
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy goal_contributions_update
  on public.goal_contributions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy goal_contributions_delete
  on public.goal_contributions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy goal_disbursements_select
  on public.goal_disbursements
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy goal_disbursements_insert
  on public.goal_disbursements
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy goal_disbursements_update
  on public.goal_disbursements
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy goal_disbursements_delete
  on public.goal_disbursements
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy goal_immediate_contributions_select
  on public.goal_immediate_contributions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy goal_immediate_contributions_insert
  on public.goal_immediate_contributions
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy goal_immediate_contributions_update
  on public.goal_immediate_contributions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy goal_immediate_contributions_delete
  on public.goal_immediate_contributions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy goal_omitted_dates_select
  on public.goal_omitted_dates
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy goal_omitted_dates_insert
  on public.goal_omitted_dates
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy goal_omitted_dates_update
  on public.goal_omitted_dates
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (select private.email_is_confirmed())
  );

create policy goal_omitted_dates_delete
  on public.goal_omitted_dates
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
