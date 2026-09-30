# Ahorruta — Traspaso del Subhito 6A

Fecha: 28 de septiembre de 2026

El Subhito 6A — Datos quedó aplicado en la base local. No hay commit. No se usó `db reset`. No se creó un proyecto remoto. No se borraron usuarios locales ni se modificaron sus contraseñas. No se recorrió la interfaz. El Hito 6 no está aprobado.

HEAD sigue en `fa1e238` (`fa1e2386415370c4f5889104427db11031ea6952`), en `master`.

## Estado de 6A

La migración `supabase/migrations/20260928120000_hito6_movements_categories.sql` está aplicada en la base local. `supabase_migrations.schema_migrations` contiene:

- `20260927220000` `hito5_financial_schema`
- `20260927234500` `hito5_disbursement_match`
- `20260928120000` `hito6_movements_categories`

El catálogo solo se crea con el correo confirmado, y una sola vez.

- `private.seed_default_categories(uuid)` no inserta nada si `auth.users.email_confirmed_at` es nulo. Si `profiles.default_categories_seeded_at` ya tiene valor, regresa sin duplicar. Un candado de transacción y el índice único de nombre cubren una segunda llamada simultánea. Si la sesión trae `auth.uid()` y no es el usuario objetivo, lanza `No se puede sembrar el catálogo de otra persona.` y no escribe.
- `private.handle_new_user()` crea el perfil y siembra solo cuando el alta ya trae `email_confirmed_at`. Una cuenta nueva sin correo confirmado no recibe categorías.
- El disparador `on_auth_user_email_confirmed` siembra cuando `email_confirmed_at` pasa de nulo a un instante. Confirmar otra vez no vuelve a crear el catálogo.
- El relleno de la migración recorre solo perfiles ya confirmados y sin marca. `hito5-sin-confirmar@example.com` no entró.
- `EXECUTE` de la siembra y del disparador de confirmación está revocado para `public`, `anon`, `authenticated` y `service_role`. Solo `supabase_auth_admin` lo tiene, además del dueño. El esquema `private` no está en la API. El cliente no puede sembrar categorías de otra persona.

Después de aplicarla, sin imprimir contraseñas:

| Correo | Confirmado | Catálogo sembrado | Categorías | Bytes de la contraseña |
| --- | --- | --- | --- | --- |
| `hito5-beto@example.com` | sí | sí | 15 | 60 |
| `hito5-sin-confirmar@example.com` | no | no | 0 | 60 |

Las cinco llaves quedaron `on delete restrict`: movimientos por cuenta, movimientos por categoría, presupuestos por categoría, compromisos por categoría y desembolsos por cuenta.

`supabase/tests/hito6_movements.test.sql` pide `plan(68)`. Las 54 comprobaciones anteriores siguen. Se añadieron el usuario local sin confirmar, el alta sin correo, la confirmación posterior y que el cliente no ejecuta la siembra ni, aunque se le otorgara, la usa contra otra persona.

pgTAP 1.3.3 compara `SQLERRM` completo. Seis pruebas esperaban un fragmento y la primera ejecución de `npx supabase test db` las marcó mal aunque la excepción era la correcta. El texto esperado quedó igual al mensaje completo. No cambió el comportamiento de la base.

Las dos pruebas de Deshacer en `src/movements/validation.test.ts` usan `apis: ['setTimeout']`. El plazo sigue en 5 segundos.

## Resultados exactos

`npm test`, antes de aplicar la migración, terminó con código 0.

```text
ℹ tests 72
ℹ suites 14
ℹ pass 72
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1273.2413
```

`npx supabase migration up` terminó con código 0. Aplicó solo `20260928120000_hito6_movements_categories.sql`.

La primera `npx supabase test db` terminó con código 1: `hito5_isolation.test.sql` en ok y 6 fallos de 68 en `hito6_movements.test.sql` (pruebas 20, 27, 56, 57, 58 y 64), por la igualdad estricta del mensaje. Tras corregir esos textos, la segunda ejecución terminó con código 0.

```text
/Users/samGD/OneDrive/Documentos/Proyectos P/Ahorruta/supabase/tests/hito5_isolation.test.sql .. ok
/Users/samGD/OneDrive/Documentos/Proyectos P/Ahorruta/supabase/tests/hito6_movements.test.sql .. ok
All tests successful.
Files=2, Tests=123,  0 wallclock secs ( 0.07 usr  0.05 sys +  0.04 cusr  0.05 csys =  0.21 CPU)
Result: PASS
```

`npm test`, después de la migración y de las pruebas SQL, terminó con código 0.

```text
ℹ tests 72
ℹ suites 14
ℹ pass 72
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1458.5736
```

`npm run lint` terminó con código 0. `expo lint` no imprimió problemas.

`npm run typecheck` terminó con código 0. `tsc --noEmit` no imprimió errores.

En los comandos de npm apareció el aviso `Unknown env config "devdir"`. No cambió estos códigos de salida.

No se ejecutó `npx expo-doctor`. No hubo recorrido manual.

## Archivos pendientes de la interfaz

6B no se continuó. Estas pantallas siguen en el árbol, sin commit, y no se modificaron en este corte:

- `app/(tabs)/_layout.tsx`
- `app/(tabs)/inicio.tsx`
- `app/(tabs)/movimientos.tsx`
- `app/(tabs)/registrar.tsx`
- `app/(tabs)/confirmar.tsx`
- `app/(tabs)/corregir.tsx`
- `app/(tabs)/categorias.tsx`
- `app/_layout.tsx`
- `app/cuenta.tsx`
- `components/TabBar.tsx`
- `components/account/`
- `components/movement-draft.tsx`

También siguen sin commit, y no son la interfaz: `README.md`, `docs/ahorruta-decisions-v1.md`, `package.json`, los repositorios en `src/persistence/`, `src/movements/`, `supabase/tests/hito5_isolation.test.sql`, la migración y `supabase/tests/hito6_movements.test.sql`. Los traspasos `docs/ahorruta-handoff-hito-6.md`, `docs/ahorruta-handoff-hito-6-en-curso.md` y `docs/ahorruta-handoff-hito-6-siguiente.md` siguen sin seguimiento. Este archivo también queda sin seguimiento.

Nada está en el índice. No hubo `git add` ni `git commit`.

## Próxima acción

El siguiente corte es el Subhito 6C: recorrido manual en el navegador de la cuenta confirmada, de la cuenta sin confirmar y de la demostración sin sesión. No marques el Hito 6 como aprobado. No hagas commit hasta que se pida.
