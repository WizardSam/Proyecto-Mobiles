begin;

select plan(55);

create or replace function pg_temp.make_user(
  uid uuid,
  email text,
  confirmed boolean,
  metadata jsonb
)
returns void
language plpgsql
as $$
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    uid,
    'authenticated',
    'authenticated',
    email,
    'test-password-hash',
    case when confirmed then now() else null end,
    '{"provider":"email","providers":["email"]}'::jsonb,
    metadata,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
end;
$$;

select pg_temp.make_user(
  '11111111-1111-4111-8111-111111111111',
  'ana@example.com',
  true,
  '{}'::jsonb
);
select pg_temp.make_user(
  '22222222-2222-4222-8222-222222222222',
  'beto@example.com',
  true,
  '{}'::jsonb
);
select pg_temp.make_user(
  '33333333-3333-4333-8333-333333333333',
  'caro@example.com',
  false,
  '{}'::jsonb
);
select pg_temp.make_user(
  '44444444-4444-4444-8444-444444444444',
  'dano@example.com',
  true,
  '{"currency":"USD","timezone":"UTC","id":"00000000-0000-0000-0000-000000000099"}'::jsonb
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'user_id'
  ),
  'profiles no tiene columna user_id'
);

select results_eq(
  $$select currency, timezone from public.profiles where id = '11111111-1111-4111-8111-111111111111'$$,
  $$values ('MXN'::text, 'America/Mexico_City'::text)$$,
  'el perfil de Ana nace en MXN y America/Mexico_City'
);

select results_eq(
  $$select id::text, currency, timezone from public.profiles where id = '44444444-4444-4444-8444-444444444444'$$,
  $$values ('44444444-4444-4444-8444-444444444444', 'MXN', 'America/Mexico_City')$$,
  'el perfil ignora moneda, zona e identificador enviados por el cliente'
);

select ok(
  (
    select expected_income_cents is null
      and estimated_expense_cents is null
      and income_frequency is null
      and tracking_started_on is null
      and last_account_id is null
    from public.profiles
    where id = '33333333-3333-4333-8333-333333333333'
  ),
  'el perfil sin confirmar no trae datos financieros'
);

select ok(
  not exists (
    select 1
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'delete_own_account'
  ),
  'borrar la cuenta no es una función SQL pública'
);

select ok(
  not has_table_privilege('anon', 'public.profiles', 'select')
  and not has_table_privilege('anon', 'public.profiles', 'insert')
  and not has_table_privilege('anon', 'public.profiles', 'update')
  and not has_table_privilege('anon', 'public.profiles', 'delete')
  and not has_table_privilege('anon', 'public.accounts', 'select')
  and not has_table_privilege('anon', 'public.categories', 'select')
  and not has_table_privilege('anon', 'public.movements', 'select')
  and not has_table_privilege('anon', 'public.budgets', 'select')
  and not has_table_privilege('anon', 'public.recurring_commitments', 'select')
  and not has_table_privilege('anon', 'public.goals', 'select')
  and not has_table_privilege('anon', 'public.goal_versions', 'select')
  and not has_table_privilege('anon', 'public.goal_milestones', 'select')
  and not has_table_privilege('anon', 'public.goal_contributions', 'select')
  and not has_table_privilege('anon', 'public.goal_disbursements', 'select')
  and not has_table_privilege('anon', 'public.goal_immediate_contributions', 'select')
  and not has_table_privilege('anon', 'public.goal_omitted_dates', 'select'),
  'anon no lee ni escribe las tablas financieras'
);

select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'insert')
  and not has_table_privilege('authenticated', 'public.profiles', 'delete'),
  'la app no inserta ni borra perfiles directamente'
);

select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  $$update public.profiles set display_name = 'Caro' where id = auth.uid()$$,
  'sin confirmar el correo se puede cambiar el nombre visible'
);

select results_eq(
  $$select display_name from public.profiles where id = auth.uid()$$,
  array['Caro'::text],
  'el nombre visible quedó guardado'
);

select throws_ok(
  $$update public.profiles set expected_income_cents = 100 where id = auth.uid()$$,
  'P0001',
  null,
  'sin confirmar no se guarda el ingreso esperado'
);

select throws_ok(
  $$update public.profiles set estimated_expense_cents = 100 where id = auth.uid()$$,
  'P0001',
  null,
  'sin confirmar no se guarda el gasto estimado'
);

select throws_ok(
  $$update public.profiles set income_frequency = 'mensual' where id = auth.uid()$$,
  'P0001',
  null,
  'sin confirmar no se guarda la frecuencia de ingreso'
);

select throws_ok(
  $$update public.profiles set tracking_started_on = '2026-09-01' where id = auth.uid()$$,
  'P0001',
  null,
  'sin confirmar no se guarda el inicio del seguimiento'
);

select throws_ok(
  $$update public.profiles set currency = 'USD' where id = auth.uid()$$,
  'P0001',
  null,
  'sin confirmar no se cambia la moneda'
);

select throws_ok(
  $$update public.profiles set timezone = 'UTC' where id = auth.uid()$$,
  'P0001',
  null,
  'sin confirmar no se cambia la zona horaria'
);

select throws_ok(
  $$insert into public.accounts (user_id, name, kind, opening_balance_cents)
    values (auth.uid(), 'Efectivo', 'efectivo', 0)$$,
  '42501',
  null,
  'sin confirmar no se guarda una cuenta'
);

select throws_ok(
  $$insert into public.goals (user_id, name) values (auth.uid(), 'Viaje')$$,
  '42501',
  null,
  'sin confirmar no se guarda una meta'
);

reset role;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  $$insert into public.accounts (id, user_id, name, kind, opening_balance_cents)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      auth.uid(),
      'Efectivo',
      'efectivo',
      150000
    )$$,
  'con el correo confirmado Ana guarda su cuenta'
);

select lives_ok(
  $$insert into public.categories (id, user_id, name, kind)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', auth.uid(), 'Peaje de prueba', 'gasto')$$,
  'Ana guarda una categoría'
);

select lives_ok(
  $$insert into public.recurring_commitments (
      user_id, name, amount_cents, frequency, next_occurrence_on, category_id
    ) values (
      auth.uid(),
      'Renta',
      800000,
      'mensual',
      '2026-10-01',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'
    )$$,
  'un compromiso recurrente puede ser la renta, no solo una suscripción'
);

select throws_ok(
  $$insert into public.accounts (user_id, name, kind, opening_balance_cents)
    values ('22222222-2222-4222-8222-222222222222', 'Ajena', 'debito', 0)$$,
  '42501',
  null,
  'Ana no inserta una cuenta de Beto'
);

select throws_ok(
  $$update public.accounts
    set user_id = '22222222-2222-4222-8222-222222222222'
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'$$,
  'P0001',
  null,
  'Ana no cambia el propietario de su cuenta'
);

select throws_ok(
  $$insert into public.accounts (user_id, name, kind, opening_balance_cents)
    values (auth.uid(), 'Tope', 'ahorro', 9007199254740992)$$,
  '23514',
  null,
  'un centavo fuera del entero seguro se rechaza'
);

select lives_ok(
  $$insert into public.goals (id, user_id, name)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', auth.uid(), 'Cancún real')$$,
  'Ana crea una meta real, distinta de la demostración'
);

select lives_ok(
  $$insert into public.goal_versions (
      id, user_id, goal_id, version, target_cents, opening_savings_cents,
      frequency_kind, frequency_weekday, from_date, deadline
    ) values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
      auth.uid(),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      1,
      3000000,
      0,
      'semanal',
      'viernes',
      '2026-10-01',
      '2027-05-30'
    )$$,
  'Ana confirma la versión 1'
);

select lives_ok(
  $$insert into public.goal_milestones (
      goal_version_id, milestone_id, user_id, name, planned_cents, due_on
    ) values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
      auth.uid(),
      'Anticipo',
      100000,
      '2026-12-01'
    )$$,
  'la versión 1 guarda su hito'
);

select lives_ok(
  $$insert into public.goal_contributions (
      id, user_id, goal_id, introduced_in_version, amount_cents, occurred_on
    ) values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
      auth.uid(),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      1,
      25000,
      '2026-10-03'
    )$$,
  'la aportación se guarda una vez, en la versión 1'
);

select lives_ok(
  $$insert into public.goal_versions (
      id, user_id, goal_id, version, target_cents, opening_savings_cents,
      frequency_kind, frequency_weekday, from_date, deadline
    ) values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
      auth.uid(),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      2,
      2800000,
      0,
      'semanal',
      'viernes',
      '2026-10-01',
      '2027-05-30'
    )$$,
  'Ana confirma la versión 2 sin copiar la aportación'
);

select lives_ok(
  $$insert into public.goal_milestones (
      goal_version_id, milestone_id, user_id, name, planned_cents, due_on
    ) values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
      auth.uid(),
      'Anticipo',
      150000,
      '2026-12-01'
    )$$,
  'la versión 2 reconstruye el hito con su propio importe'
);

select is(
  (select count(*)::int from public.goal_contributions where goal_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
  1,
  'la aportación no se duplicó en la versión 2'
);

select results_eq(
  $$select planned_cents::text
    from public.goal_milestones
    where milestone_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6'
    order by goal_version_id$$,
  array['100000', '150000'],
  'cada versión conserva el importe de su hito'
);

select is(
  (
    select count(*)::int
    from public.goal_contributions
    where goal_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'
      and introduced_in_version <= 2
  ),
  1,
  'la versión 2 incluye la aportación histórica sin copiarla'
);

select lives_ok(
  $$insert into public.goal_disbursements (
      id, user_id, goal_id, goal_version_id, introduced_in_version,
      milestone_id, account_id, amount_cents, occurred_on
    ) values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8',
      auth.uid(),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
      1,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      40000,
      '2026-09-01'
    )$$,
  'Ana registra un desembolso'
);

select lives_ok(
  $$insert into public.movements (
      id, user_id, account_id, category_id, kind, amount_cents, status,
      occurred_on, goal_disbursement_id
    ) values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9',
      auth.uid(),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      'gasto',
      40000,
      'confirmado',
      '2026-09-01',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8'
    )$$,
  'el desembolso produce un gasto confirmado'
);

select throws_ok(
  $$insert into public.movements (
      user_id, account_id, category_id, kind, amount_cents, status,
      occurred_on, goal_disbursement_id
    ) values (
      auth.uid(),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      'gasto',
      40000,
      'confirmado',
      '2026-09-01',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8'
    )$$,
  '23505',
  null,
  'el mismo desembolso no admite un segundo movimiento'
);

select lives_ok(
  $$update public.goal_disbursements
      set amount_cents = 40001
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8'$$,
  'el cambio de monto del desembolso queda pendiente de su gasto'
);

select throws_ok(
  $$set constraints all immediate$$,
  'P0001',
  null,
  'el desembolso debe coincidir en cuenta, monto y fecha con su gasto'
);

update public.goal_disbursements
  set amount_cents = 40000
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8';

select lives_ok(
  $$insert into public.goal_immediate_contributions (
      id, user_id, goal_id, introduced_in_version, disbursement_id, amount_cents, occurred_on
    ) values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8:inmediata',
      auth.uid(),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      1,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8',
      10000,
      '2026-12-01'
    )$$,
  'la aportación inmediata se guarda como hecho de la meta'
);

select is(
  (select count(*)::int from public.movements where goal_disbursement_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8'),
  1,
  'la aportación inmediata no crea otro movimiento'
);

select lives_ok(
  $$insert into public.goal_disbursements (
      id, user_id, goal_id, goal_version_id, introduced_in_version,
      milestone_id, account_id, amount_cents, occurred_on
    ) values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10',
      auth.uid(),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
      1,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      5000,
      '2026-12-02'
    )$$,
  'se puede insertar el desembolso antes de su gasto, dentro de la transacción'
);

select throws_ok(
  $$set constraints all immediate$$,
  'P0001',
  null,
  'la transacción exige el gasto único del desembolso antes de cerrarse'
);

delete from public.goal_disbursements
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10';

reset role;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  $$insert into public.accounts (id, user_id, name, kind, opening_balance_cents)
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      auth.uid(),
      'Débito',
      'debito',
      0
    )$$,
  'Beto guarda su propia cuenta'
);

select is_empty(
  $$select id from public.accounts where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'$$,
  'Beto no lee la cuenta de Ana'
);

select is_empty(
  $$select id from public.profiles where id = '11111111-1111-4111-8111-111111111111'$$,
  'Beto no lee el perfil de Ana'
);

select is_empty(
  $$select id from public.goals where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'$$,
  'Beto no lee la meta de Ana'
);

select is_empty(
  $$select id from public.goal_versions where goal_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'$$,
  'Beto no lee las versiones de Ana'
);

select is_empty(
  $$select milestone_id from public.goal_milestones where user_id = '11111111-1111-4111-8111-111111111111'$$,
  'Beto no lee los hitos de Ana'
);

select is_empty(
  $$update public.accounts set name = 'Robada' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' returning id$$,
  'Beto no modifica la cuenta de Ana'
);

select is_empty(
  $$delete from public.goal_contributions where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7' returning id$$,
  'Beto no borra la aportación de Ana'
);

select throws_ok(
  $$insert into public.movements (
      user_id, account_id, category_id, kind, amount_cents, status, occurred_on
    ) values (
      auth.uid(),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      'gasto',
      100,
      'confirmado',
      '2026-09-01'
    )$$,
  '23503',
  null,
  'Beto no cuelga un movimiento de la cuenta de Ana'
);

reset role;

delete from auth.users where id = '11111111-1111-4111-8111-111111111111';

select is_empty(
  $$select id from public.profiles where id = '11111111-1111-4111-8111-111111111111'$$,
  'borrar a Ana elimina su perfil'
);

select is_empty(
  $$select id from public.accounts where user_id = '11111111-1111-4111-8111-111111111111'$$,
  'borrar a Ana elimina sus cuentas'
);

select is_empty(
  $$select id from public.goals where user_id = '11111111-1111-4111-8111-111111111111'$$,
  'borrar a Ana elimina sus metas'
);

select is(
  (select count(*)::int from public.accounts where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'),
  1,
  'la cuenta de Beto sigue después de borrar a Ana'
);

select is(
  (select count(*)::int from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  1,
  'el perfil de Beto sigue después de borrar a Ana'
);

select * from finish();

rollback;
