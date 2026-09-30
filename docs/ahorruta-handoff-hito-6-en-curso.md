# Ahorruta — Traspaso del Hito 6 en curso

Fecha: 28 de septiembre de 2026

La implementación se detuvo a petición. No hay commit. No se aplicó la migración ni se tocó la base local.

`docs/ahorruta-handoff-hito-6.md` ya estaba sin seguimiento antes de este trabajo. No forma parte de estos cambios.

## Objetivo de las modificaciones

Conectar movimientos reales y el catálogo de categorías a la cuenta, sin mezclarlos con la demostración de Cancún y sin cambiar los motores. La migración nueva, todavía sin aplicar, quita la eliminación en cascada desde categorías y cuentas, siembra el catálogo una sola vez por usuario y protege el gasto ligado a un desembolso.

## Archivos modificados

- `README.md`: el estado dice que el Hito 6 está en local. Esa frase se adelanta: el hito no está cerrado.
- `app/(tabs)/_layout.tsx`: al salir de Movimientos, Registrar, Confirmar, Corregir o Categorías se confirma el borrado pendiente. Registra la pantalla `categorias`.
- `app/(tabs)/inicio.tsx`, `movimientos.tsx`, `registrar.tsx`, `confirmar.tsx`, `corregir.tsx`: sin sesión siguen en la demostración; con correo confirmado usan la cuenta; con sesión sin confirmar piden confirmar el correo.
- `app/(tabs)/categorias.tsx`: pantalla nueva del catálogo. Sin sesión pide entrar.
- `app/_layout.tsx`: el borrador del movimiento real vive en memoria, aparte de la demostración.
- `app/cuenta.tsx`: cada cuenta existente se puede archivar. Guardar el perfil ya no vuelve a activar una cuenta archivada.
- `components/TabBar.tsx`: el aviso de demostración queda en metas, calendario, resumen, presupuestos, voz y perfil, y en todo el recorrido si no hay sesión.
- `components/account/`: pantallas y estados de la cuenta real (inicio, lista, registro, confirmación, corrección, categorías, carga y error).
- `components/movement-draft.tsx`: datos del formulario hasta confirmar.
- `src/persistence/account-repository.ts`: `archiveAccount`.
- `src/persistence/profile-repository.ts`: `updateLastAccount`.
- `src/persistence/category-repository.ts`: leer, crear, renombrar, archivar, eliminar y contar referencias.
- `src/persistence/movement-repository.ts`: leer, crear confirmado, corregir, eliminar y recordar la cuenta.
- `src/persistence/finance.ts`: junta cuentas, categorías, movimientos y perfil.
- `src/persistence/demo-boundary.test.ts`: declara la lista de repositorios que no deben importar la demostración. El bucle que la usa no se escribió.
- `src/movements/validation.ts` y `period.ts`: cantidad, nota, nombre, mes y orden de la lista.
- `src/movements/validation.test.ts`: pruebas de esa validación y del plazo de 5 segundos. No están en el script `npm test`.
- `src/movements/pending-deletion.ts`: oculta la fila y espera 5 segundos antes del `delete`.
- `src/movements/to-ledger.ts`: adapta las filas al motor sin modificarlo.
- `supabase/migrations/20260928120000_hito6_movements_categories.sql`: migración nueva. No se aplicó.
- `supabase/tests/hito5_isolation.test.sql`: la categoría de prueba pasó de «Transporte» a «Peaje de prueba» para no chocar con el catálogo.
- `docs/ahorruta-decisions-v1.md`: Deshacer queda en 5 segundos y sale de las decisiones diferidas.

## Qué está terminado

- El texto de la migración: `on delete restrict` en las cinco llaves, `archived_at`, marca de siembra, catálogo idempotente, recorte de nombre y nota, cantidad mayor que cero, categoría obligatoria también en ingresos, nota de hasta 280 caracteres, protección del gasto de desembolso y borrado ordenado al eliminar al usuario.
- Repositorios de categorías, movimientos, archivo de cuenta y última cuenta.
- El ramal de pantallas reales y la separación visual respecto de la demostración.
- La validación pura y sus pruebas, escritas pero fuera del script de `npm test`.
- El ajuste de nombre en la prueba de aislamiento del Hito 5.

## Qué quedó incompleto

- `components/account/movements.tsx` usa `styles` y no define la hoja de estilos. También importa `StyleSheet` sin usarlo.
- `src/persistence/demo-boundary.test.ts` deja `accountFiles` sin el bucle que debía comprobar esos archivos.
- No existe `supabase/tests/hito6_movements.test.sql`.
- `package.json` no incluye `src/movements/validation.test.ts`.
- La migración no se aplicó. La base local sigue en el Hito 5.
- No hay recorrido manual en el navegador.
- El Hito 6 no está cerrado ni aprobado.

## Decisiones que se asumieron

Se tomó la opción propuesta en el plan, porque la implementación pedía seguirlo:

- El `delete` espera 5 segundos. Deshacer cancela ese plazo. Otro borrado confirma el anterior. Salir de Movimientos confirma el pendiente. Si el proceso muere antes, el movimiento sigue.
- La base rechaza cantidad cero y exige categoría también en un ingreso. `nonneg_cents` y los motores no cambian.
- Catálogo: Nómina, Honorarios y Otro ingreso; Comida, Transporte, Hogar, Servicios, Salud, Educación, Personal y Otros. Sin «Ahorro» y sin «Suscripciones».
- Un nombre archivado sigue ocupado. No hay reactivar.
- La pantalla solo archiva cuentas. La política de borrado de la base no se quitó.
- Con sesión confirmada, Inicio usa el libro real y la reserva queda en cero. Metas, calendario, presupuestos, resumen y voz siguen en la demostración.
- Se acepta cualquier fecha civil válida, incluida una futura. El movimiento manual queda confirmado.
- La lista va de lo más reciente a lo más antiguo.
- La nota se recorta a 280 caracteres.
- Un movimiento con `goal_disbursement_id` no se edita ni se elimina, salvo la variable de transacción reservada al Hito 8.
- Sin sesión se ve Cancún. Con sesión sin confirmar se pide confirmar el correo y no se muestran las cifras de la demostración.

## Resultados exactos de las comprobaciones

`git diff --check` terminó con código 0. No señaló espacios ni conflictos. Git avisó que, en la próxima escritura, cambiará LF por CRLF en varios archivos ya modificados. Eso no es un fallo de `--check`.

`npm test` terminó con código 0. Ejecutó el script actual, sin `src/movements/validation.test.ts`.

```text
ℹ tests 56
ℹ suites 14
ℹ pass 56
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2650.5078
```

`npm run lint` terminó con código 1.

```text
✖ 5 problems (3 errors, 2 warnings)
```

- `components/account/correct.tsx:40` error `react-hooks/set-state-in-effect`
- `components/account/register.tsx:30` error `react-hooks/set-state-in-effect`
- `components/account/register.tsx:45` error `react-hooks/set-state-in-effect`
- `components/account/movements.tsx:3` warning `StyleSheet` sin usar
- `src/persistence/demo-boundary.test.ts:6` warning `accountFiles` sin usar

`npm run typecheck` terminó con código 2.

```text
components/account/correct.tsx(103,30): error TS18048: 'movement' is possibly 'undefined'.
components/account/correct.tsx(106,32): error TS18048: 'movement' is possibly 'undefined'.
components/account/correct.tsx(118,26): error TS18048: 'movement' is possibly 'undefined'.
components/account/movements.tsx(110,20): error TS2304: Cannot find name 'styles'.
components/account/movements.tsx(111,22): error TS2304: Cannot find name 'styles'.
components/account/movements.tsx(116,18): error TS2304: Cannot find name 'styles'.
components/account/movements.tsx(127,18): error TS2304: Cannot find name 'styles'.
components/account/movements.tsx(130,20): error TS2304: Cannot find name 'styles'.
components/account/movements.tsx(135,18): error TS2304: Cannot find name 'styles'.
components/account/movements.tsx(139,22): error TS2304: Cannot find name 'styles'.
components/account/movements.tsx(144,18): error TS2304: Cannot find name 'styles'.
components/account/movements.tsx(150,22): error TS2304: Cannot find name 'styles'.
components/account/movements.tsx(169,24): error TS2304: Cannot find name 'styles'.
src/movements/validation.test.ts(114,45): error TS2322: Type '"clearTimeout"' is not assignable to type '"setInterval" | "setTimeout" | "setImmediate" | "Date"'.
src/movements/validation.test.ts(134,45): error TS2322: Type '"clearTimeout"' is not assignable to type '"setInterval" | "setTimeout" | "setImmediate" | "Date"'.
```

En los tres comandos de npm apareció el aviso `Unknown env config "devdir"`. No cambió estos códigos de salida.

No se ejecutó `npx supabase migration up` ni `npx supabase test db`.

## Fallos actuales y causa probable

- `styles` no existe porque la lista real se guardó sin la hoja de estilos. El tipo y el lint lo ven; la pantalla no puede compilar.
- `movement` queda posiblemente indefinido dentro de las funciones de guardar y eliminar, aunque el retorno anterior ya lo descartó. El control de flujo de TypeScript no lo conserva en ese cierre.
- `set-state-in-effect` rechaza copiar el movimiento o el borrador, y preseleccionar la última cuenta, desde un efecto.
- `clearTimeout` no está entre las API que el tipo de `mock.timers.enable` acepta en este `@types/node`.
- `accountFiles` quedó declarado cuando se interrumpió la prueba de frontera. No rompe la ejecución de `npm test`.
- Las pruebas nuevas de validación no corrieron: el script de `package.json` no las incluye.
- La prueba SQL del Hito 6 no existe y la migración no está aplicada, así que el aislamiento nuevo no tiene resultado.

## Próxima acción concreta

Corregir primero `components/account/movements.tsx`, `correct.tsx`, `register.tsx` y `src/movements/validation.test.ts` hasta que `npm run typecheck` y `npm run lint` terminen en código 0. Después completar el bucle de `demo-boundary.test.ts`, incluir la prueba de validación en `npm test` y escribir `supabase/tests/hito6_movements.test.sql`. Solo entonces aplicar la migración con `npx supabase migration up`, sin `db reset`, y ejecutar `npx supabase test db`.

## Confirmación

El trabajo sigue sin commit. `git status` muestra los archivos de arriba modificados o sin seguimiento. No se hizo `git add` ni `git commit` en este cierre.
