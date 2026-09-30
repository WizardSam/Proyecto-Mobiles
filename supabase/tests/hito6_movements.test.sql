begin;

select plan(68);

create or replace function pg_temp.make_user(
  uid uuid,
  email text,
  confirmed boolean
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
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
end;
$$;

select ok(
  not exists (
    select 1
    from public.profiles
    join auth.users on auth.users.id = profiles.id
    where auth.users.email_confirmed_at is not null
      and profiles.default_categories_seeded_at is null
  ),
  'los usuarios que ya estaban confirmados tienen el catálogo sembrado'
);

select ok(
  exists (
    select 1
    from auth.users
    where email = 'hito5-sin-confirmar@example.com'
      and email_confirmed_at is null
  ),
  'hito5-sin-confirmar@example.com sigue sin confirmar'
);

select is(
  (
    select count(*)::int
    from public.categories
    join auth.users on auth.users.id = categories.user_id
    where auth.users.email = 'hito5-sin-confirmar@example.com'
  ),
  0,
  'hito5-sin-confirmar@example.com permanece sin categorías financieras'
);

select ok(
  (
    select profiles.default_categories_seeded_at is null
    from public.profiles
    join auth.users on auth.users.id = profiles.id
    where auth.users.email = 'hito5-sin-confirmar@example.com'
  ),
  'hito5-sin-confirmar@example.com no queda marcado como sembrado'
);

select pg_temp.make_user(
  '55555555-5555-4555-8555-555555555555',
  'hito6-ana@example.com',
  true
);
select pg_temp.make_user(
  '66666666-6666-4666-8666-666666666666',
  'hito6-beto@example.com',
  true
);
select pg_temp.make_user(
  '77777777-7777-4777-8777-777777777777',
  'hito6-sin-confirmar@example.com',
  false
);

insert into public.accounts (id, user_id, name, kind, opening_balance_cents)
values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  '77777777-7777-4777-8777-777777777777',
  'Efectivo',
  'efectivo',
  0
);

select is(
  (
    select count(*)::int
    from public.categories
    where user_id = '77777777-7777-4777-8777-777777777777'
  ),
  0,
  'registrar una cuenta sin correo confirmado no siembra categorías'
);

select ok(
  (
    select default_categories_seeded_at is null
    from public.profiles
    where id = '77777777-7777-4777-8777-777777777777'
  ),
  'sin confirmar el catálogo no queda marcado'
);

select lives_ok(
  $$select private.seed_default_categories('77777777-7777-4777-8777-777777777777')$$,
  'sembrar a quien no confirmó no falla'
);

select is(
  (
    select count(*)::int
    from public.categories
    where user_id = '77777777-7777-4777-8777-777777777777'
  ),
  0,
  'esa siembra no crea categorías'
);

select pg_temp.make_user(
  '88888888-8888-4888-8888-888888888888',
  'hito6-confirma-despues@example.com',
  false
);

select is(
  (
    select count(*)::int
    from public.categories
    where user_id = '88888888-8888-4888-8888-888888888888'
  ),
  0,
  'antes de confirmar el correo no hay catálogo'
);

update auth.users
set email_confirmed_at = now()
where id = '88888888-8888-4888-8888-888888888888';

select is(
  (
    select count(*)::int
    from public.categories
    where user_id = '88888888-8888-4888-8888-888888888888'
  ),
  15,
  'confirmar el correo crea el catálogo una sola vez'
);

select ok(
  (
    select default_categories_seeded_at is not null
    from public.profiles
    where id = '88888888-8888-4888-8888-888888888888'
  ),
  'confirmar el correo marca el catálogo'
);

update auth.users
set email_confirmed_at = now()
where id = '88888888-8888-4888-8888-888888888888';

select is(
  (
    select count(*)::int
    from public.categories
    where user_id = '88888888-8888-4888-8888-888888888888'
  ),
  15,
  'volver a confirmar el correo no duplica el catálogo'
);

select is(
  (
    select count(*)::int
    from public.categories
    where user_id = '55555555-5555-4555-8555-555555555555'
      and kind = 'ingreso'
      and name in ('Nómina', 'Honorarios', 'Ventas o negocio', 'Reembolso', 'Otro ingreso')
  ),
  5,
  'el catálogo de ingreso trae Nómina, Honorarios, Ventas o negocio, Reembolso y Otro ingreso'
);

select is(
  (
    select count(*)::int
    from public.categories
    where user_id = '55555555-5555-4555-8555-555555555555'
      and kind = 'ingreso'
  ),
  5,
  'Ana no recibe ingresos de más'
);

select is(
  (
    select count(*)::int
    from public.categories
    where user_id = '55555555-5555-4555-8555-555555555555'
      and kind = 'gasto'
      and name in (
        'Comida', 'Transporte', 'Vivienda', 'Servicios', 'Salud',
        'Educación', 'Suscripciones', 'Entretenimiento', 'Personal', 'Otros'
      )
  ),
  10,
  'el catálogo de gasto trae las diez categorías aprobadas'
);

select is(
  (
    select count(*)::int
    from public.categories
    where user_id = '55555555-5555-4555-8555-555555555555'
      and kind = 'gasto'
  ),
  10,
  'Ana no recibe gastos de más'
);

select ok(
  (
    select default_categories_seeded_at is not null
    from public.profiles
    where id = '55555555-5555-4555-8555-555555555555'
  ),
  'el catálogo queda marcado como sembrado'
);

select lives_ok(
  $$select private.seed_default_categories('55555555-5555-4555-8555-555555555555')$$,
  'sembrar otra vez no falla'
);

select is(
  (
    select count(*)::int
    from public.categories
    where user_id = '55555555-5555-4555-8555-555555555555'
  ),
  15,
  'la segunda siembra no duplica categorías'
);

select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}',
  true
);
set local role authenticated;

select throws_ok(
  $$update public.profiles
    set default_categories_seeded_at = null
    where id = auth.uid()$$,
  'P0001',
  'No se puede cambiar el catálogo inicial.',
  'Ana no cambia la marca del catálogo'
);

select throws_ok(
  $$insert into public.categories (user_id, name, kind)
    values (auth.uid(), 'comida', 'gasto')$$,
  '23505',
  null,
  'el nombre no se repite en el mismo tipo aunque cambie la mayúscula'
);

select throws_ok(
  $$insert into public.categories (user_id, name, kind)
    values (auth.uid(), '  COMIDA  ', 'gasto')$$,
  '23505',
  null,
  'el nombre no se repite aunque traiga espacios exteriores'
);

select lives_ok(
  $$insert into public.categories (id, user_id, name, kind)
    values (
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc9',
      auth.uid(),
      'Comida',
      'ingreso'
    )$$,
  'el mismo nombre puede existir en el otro tipo'
);

select lives_ok(
  $$insert into public.accounts (id, user_id, name, kind, opening_balance_cents)
    values (
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      auth.uid(),
      'Débito',
      'debito',
      0
    )$$,
  'Ana guarda la cuenta del movimiento'
);

select lives_ok(
  $$insert into public.movements (
      id, user_id, account_id, category_id, kind, amount_cents, status, occurred_on, note
    )
    select
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
      auth.uid(),
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      categories.id,
      'gasto',
      2500,
      'confirmado',
      '2026-09-01',
      '  café  '
    from public.categories
    where categories.user_id = auth.uid()
      and categories.name = 'Comida'
      and categories.kind = 'gasto'$$,
  'Ana guarda un gasto confirmado de un día pasado'
);

select is(
  (
    select note
    from public.movements
    where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'
  ),
  'café',
  'la nota se recorta y conserva el texto interior'
);

select throws_ok(
  format(
    $$insert into public.movements (
        user_id, account_id, category_id, kind, amount_cents, status, occurred_on
      )
      select
        auth.uid(),
        'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
        categories.id,
        'gasto',
        100,
        'confirmado',
        %L
      from public.categories
      where categories.user_id = auth.uid()
        and categories.name = 'Comida'
        and categories.kind = 'gasto'$$,
    (timezone('America/Mexico_City', clock_timestamp()))::date + 1
  ),
  'P0001',
  'Un movimiento confirmado no puede tener fecha futura.',
  'un movimiento confirmado rechaza el día siguiente en America/Mexico_City'
);

select lives_ok(
  format(
    $$insert into public.movements (
        user_id, account_id, category_id, kind, amount_cents, status, occurred_on
      )
      select
        auth.uid(),
        'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
        categories.id,
        'ingreso',
        5000,
        'confirmado',
        %L
      from public.categories
      where categories.user_id = auth.uid()
        and categories.name = 'Nómina'
        and categories.kind = 'ingreso'$$,
    (timezone('America/Mexico_City', clock_timestamp()))::date
  ),
  'un ingreso confirmado de hoy sí se guarda y exige categoría'
);

select throws_ok(
  $$insert into public.movements (
      user_id, account_id, category_id, kind, amount_cents, status, occurred_on
    ) values (
      auth.uid(),
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      null,
      'ingreso',
      100,
      'confirmado',
      '2026-09-01'
    )$$,
  '23514',
  null,
  'un ingreso sin categoría se rechaza'
);

select throws_ok(
  $$insert into public.movements (
      user_id, account_id, category_id, kind, amount_cents, status, occurred_on
    )
    select
      auth.uid(),
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      categories.id,
      'gasto',
      0,
      'confirmado',
      '2026-09-01'
    from public.categories
    where categories.user_id = auth.uid()
      and categories.name = 'Comida'
      and categories.kind = 'gasto'$$,
  '23514',
  null,
  'una cantidad de cero se rechaza'
);

select throws_ok(
  $$insert into public.movements (
      user_id, account_id, category_id, kind, amount_cents, status, occurred_on, note
    )
    select
      auth.uid(),
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      categories.id,
      'gasto',
      100,
      'confirmado',
      '2026-09-01',
      repeat('a', 281)
    from public.categories
    where categories.user_id = auth.uid()
      and categories.name = 'Comida'
      and categories.kind = 'gasto'$$,
  '23514',
  null,
  'una nota de 281 caracteres se rechaza'
);

select lives_ok(
  $$insert into public.movements (
      id, user_id, account_id, category_id, kind, amount_cents, status, occurred_on, note
    )
    select
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc4',
      auth.uid(),
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      categories.id,
      'gasto',
      100,
      'confirmado',
      '2026-09-01',
      '   '
    from public.categories
    where categories.user_id = auth.uid()
      and categories.name = 'Comida'
      and categories.kind = 'gasto'$$,
  'una nota en blanco se acepta'
);

select ok(
  (
    select note is null
    from public.movements
    where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc4'
  ),
  'una nota en blanco se guarda nula'
);

select lives_ok(
  $$update public.categories
    set archived_at = now()
    where user_id = auth.uid()
      and name = 'Comida'
      and kind = 'gasto'$$,
  'Ana archiva Comida'
);

select is(
  (
    select count(*)::int
    from public.movements
    where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'
  ),
  1,
  'archivar la categoría no borra el movimiento'
);

select throws_ok(
  $$insert into public.categories (user_id, name, kind)
    values (auth.uid(), 'Comida', 'gasto')$$,
  '23505',
  null,
  'el nombre archivado sigue ocupado'
);

select lives_ok(
  $$update public.categories
    set archived_at = null
    where user_id = auth.uid()
      and name = 'Comida'
      and kind = 'gasto'$$,
  'Ana reactiva Comida'
);

select is(
  (
    select count(*)::int
    from public.movements
    where category_id = (
      select id
      from public.categories
      where user_id = auth.uid()
        and name = 'Comida'
        and kind = 'gasto'
    )
  ),
  2,
  'reactivar la categoría conserva sus movimientos'
);

select throws_ok(
  $$delete from public.categories
    where user_id = auth.uid()
      and name = 'Comida'
      and kind = 'gasto'$$,
  '23503',
  null,
  'una categoría con movimientos no se elimina'
);

select lives_ok(
  $$insert into public.categories (id, user_id, name, kind)
    values (
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
      auth.uid(),
      'Peaje suelto',
      'gasto'
    )$$,
  'Ana crea una categoría sin referencias'
);

select lives_ok(
  $$delete from public.categories
    where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2'$$,
  'una categoría sin referencias sí se elimina'
);

select lives_ok(
  $$insert into public.categories (id, user_id, name, kind)
    values (
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc5',
      auth.uid(),
      'Renta de prueba',
      'gasto'
    )$$,
  'Ana crea la categoría del compromiso'
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
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc5'
    )$$,
  'el compromiso referencia esa categoría'
);

select throws_ok(
  $$delete from public.categories
    where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5'$$,
  '23503',
  null,
  'una categoría con un compromiso no se elimina'
);

select lives_ok(
  $$update public.categories
    set archived_at = now()
    where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5'$$,
  'esa categoría se archiva y el compromiso sigue'
);

select is(
  (
    select count(*)::int
    from public.recurring_commitments
    where category_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5'
  ),
  1,
  'archivar no borra el compromiso'
);

select lives_ok(
  $$update public.accounts
    set active = false
    where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'$$,
  'Ana archiva la cuenta'
);

select is(
  (
    select count(*)::int
    from public.movements
    where account_id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'
  ),
  3,
  'archivar la cuenta no borra sus movimientos'
);

select lives_ok(
  $$update public.accounts
    set active = true
    where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'$$,
  'Ana reactiva la cuenta'
);

select throws_ok(
  $$delete from public.accounts
    where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1'$$,
  '23503',
  null,
  'una cuenta con movimientos no se elimina'
);

select lives_ok(
  $$insert into public.goals (id, user_id, name)
    values ('cccccccc-cccc-4ccc-8ccc-cccccccccc10', auth.uid(), 'Meta de prueba')$$,
  'Ana crea una meta para el gasto protegido'
);

select lives_ok(
  $$insert into public.goal_versions (
      id, user_id, goal_id, version, target_cents, opening_savings_cents,
      frequency_kind, frequency_weekday, from_date, deadline
    ) values (
      'cccccccc-cccc-4ccc-8ccc-cccccccccc11',
      auth.uid(),
      'cccccccc-cccc-4ccc-8ccc-cccccccccc10',
      1,
      100000,
      0,
      'semanal',
      'viernes',
      '2026-09-01',
      '2026-09-30'
    )$$,
  'la meta tiene una versión'
);

select lives_ok(
  $$insert into public.goal_milestones (
      goal_version_id, milestone_id, user_id, name, planned_cents, due_on
    ) values (
      'cccccccc-cccc-4ccc-8ccc-cccccccccc11',
      'cccccccc-cccc-4ccc-8ccc-cccccccccc12',
      auth.uid(),
      'Anticipo',
      4000,
      '2026-09-01'
    )$$,
  'la versión tiene un hito'
);

select lives_ok(
  $$insert into public.goal_disbursements (
      id, user_id, goal_id, goal_version_id, introduced_in_version,
      milestone_id, account_id, amount_cents, occurred_on
    ) values (
      'cccccccc-cccc-4ccc-8ccc-cccccccccc13',
      auth.uid(),
      'cccccccc-cccc-4ccc-8ccc-cccccccccc10',
      'cccccccc-cccc-4ccc-8ccc-cccccccccc11',
      1,
      'cccccccc-cccc-4ccc-8ccc-cccccccccc12',
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      4000,
      '2026-09-01'
    )$$,
  'Ana registra el desembolso'
);

select lives_ok(
  $$insert into public.movements (
      id, user_id, account_id, category_id, kind, amount_cents, status,
      occurred_on, goal_disbursement_id
    )
    select
      'cccccccc-cccc-4ccc-8ccc-cccccccccc14',
      auth.uid(),
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      categories.id,
      'gasto',
      4000,
      'confirmado',
      '2026-09-01',
      'cccccccc-cccc-4ccc-8ccc-cccccccccc13'
    from public.categories
    where categories.user_id = auth.uid()
      and categories.name = 'Comida'
      and categories.kind = 'gasto'$$,
  'el desembolso produce su gasto confirmado'
);

select throws_ok(
  $$update public.movements
    set note = 'cambio'
    where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccc14'$$,
  'P0001',
  'Este gasto pertenece a una meta. Se corrige desde la meta.',
  'Ana no corrige desde Movimientos el gasto de una meta'
);

select throws_ok(
  $$delete from public.movements
    where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccc14'$$,
  'P0001',
  'Este gasto pertenece a una meta. Se corrige desde la meta.',
  'Ana no elimina desde Movimientos el gasto de una meta'
);

select set_config('ahorruta.goal_movement', 'allow', true);

select throws_ok(
  $$update public.movements
    set note = 'atajo'
    where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccc14'$$,
  'P0001',
  'Este gasto pertenece a una meta. Se corrige desde la meta.',
  'la sesión autenticada no abre el gasto de una meta con la variable reservada'
);

reset role;
select set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666666', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated"}',
  true
);
set local role authenticated;

select is_empty(
  $$select id from public.categories where user_id = '55555555-5555-4555-8555-555555555555'$$,
  'Beto no lee las categorías de Ana'
);

select is_empty(
  $$select id from public.movements where user_id = '55555555-5555-4555-8555-555555555555'$$,
  'Beto no lee los movimientos de Ana'
);

select is_empty(
  $$update public.movements
    set note = 'ajeno'
    where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3'
    returning id$$,
  'Beto no modifica el movimiento de Ana'
);

select is_empty(
  $$delete from public.categories
    where user_id = '55555555-5555-4555-8555-555555555555'
    returning id$$,
  'Beto no elimina las categorías de Ana'
);

select throws_ok(
  $$select private.seed_default_categories('55555555-5555-4555-8555-555555555555')$$,
  '42501',
  null,
  'el cliente no puede sembrar categorías'
);

reset role;
grant execute on function private.seed_default_categories(uuid) to authenticated;
set local role authenticated;

select throws_ok(
  $$select private.seed_default_categories('55555555-5555-4555-8555-555555555555')$$,
  'P0001',
  'No se puede sembrar el catálogo de otra persona.',
  'aunque pudiera ejecutarla, el cliente no siembra el catálogo de otra persona'
);

reset role;
revoke execute on function private.seed_default_categories(uuid) from authenticated;

-- Fila de apoyo para el rechazo RLS. La siembra no la crea.
insert into public.categories (id, user_id, name, kind)
values (
  'dddddddd-dddd-4ddd-8ddd-ddddddddddde',
  '77777777-7777-4777-8777-777777777777',
  'Comida',
  'gasto'
);

reset role;
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777777', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}',
  true
);
set local role authenticated;

select throws_ok(
  $$insert into public.categories (user_id, name, kind)
    values (auth.uid(), 'Extra', 'gasto')$$,
  '42501',
  null,
  'sin confirmar no se crea una categoría'
);

select throws_ok(
  $$insert into public.movements (
      user_id, account_id, category_id, kind, amount_cents, status, occurred_on
    )
    select
      auth.uid(),
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      categories.id,
      'gasto',
      100,
      'confirmado',
      '2026-09-01'
    from public.categories
    where categories.user_id = auth.uid()
      and categories.name = 'Comida'
      and categories.kind = 'gasto'$$,
  '42501',
  null,
  'sin confirmar no se guarda un movimiento'
);

reset role;

delete from auth.users where id = '55555555-5555-4555-8555-555555555555';

select is_empty(
  $$select id from public.movements where user_id = '55555555-5555-4555-8555-555555555555'$$,
  'borrar a Ana elimina sus movimientos sin dejar el historial colgado'
);

select is(
  (
    select count(*)::int
    from public.profiles
    where id = '66666666-6666-4666-8666-666666666666'
  ),
  1,
  'el perfil de Beto sigue después de borrar a Ana'
);

select * from finish();

rollback;
