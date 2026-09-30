# Ahorruta — Traspaso para continuar el Hito 6

Fecha: 28 de septiembre de 2026

El trabajo se detuvo a petición, antes de cerrar el hito. No hay commit. No se aplicó la migración. No se ejecutó `npx supabase migration up`, `db reset` ni `npx supabase test db`. No se creó un proyecto remoto. No se borraron usuarios locales.

HEAD sigue en `fa1e238` (`fa1e2386415370c4f5889104427db11031ea6952`), en `master`. El Hito 6 no está aprobado.

## Qué quedó implementado

En el árbol de trabajo, sin commit:

- Pantallas de cuenta para inicio, movimientos, registro, confirmación, corrección y categorías. Sin sesión sigue la demostración de Cancún. Con correo sin confirmar se pide confirmarlo. Con sesión confirmada se usa la cuenta.
- Borrador del movimiento real en memoria, aparte de la demostración.
- Deshacer de 5 segundos en cliente: oculta la fila y espera antes del `delete`. Salir de Movimientos, Registrar, Confirmar, Corregir o Categorías confirma el borrado pendiente.
- Repositorios de categorías, movimientos y finanzas. Archivar y reactivar cuenta. Archivar, reactivar, renombrar, crear y eliminar categoría. La eliminación de una categoría usada depende de las llaves `on delete restrict` de la migración, que aún no está en la base.
- Validación pura: cantidad mayor que cero, categoría obligatoria, nota de hasta 280 caracteres, fecha confirmada no futura en `America/Mexico_City`, orden de la lista y cuentas o categorías archivadas que solo siguen disponibles si ya son las del movimiento.
- La hoja de estilos de la lista real y los formularios de registro y corrección ya no copian el estado desde un efecto.
- `docs/ahorruta-decisions-v1.md` recoge las reglas aprobadas. `README.md` dice que el Hito 6 está en desarrollo, no terminado ni aprobado.
- La migración `supabase/migrations/20260928120000_hito6_movements_categories.sql` está escrita y sin seguimiento. Incluye el catálogo aprobado, `archived_at`, siembra única, recorte de nota, cantidad mayor que cero, categoría obligatoria, rechazo de fecha futura en un movimiento confirmado, `on delete restrict` y la protección del gasto ligado a un desembolso. Esa protección no cede si la sesión autenticada asigna la variable reservada al Hito 8.
- `supabase/tests/hito6_movements.test.sql` está escrito, con `plan(54)`, y no se ejecutó.
- La prueba de aislamiento del Hito 5 usa «Peaje de prueba» y fechas pasadas (`2026-09-01`) en los gastos confirmados de muestra, para no chocar con el catálogo ni con la regla de fecha futura cuando esa migración se aplique.

## Qué reglas aprobadas ya están reflejadas

Están en el código o en la migración sin aplicar. La base local no las tiene todavía.

- Deshacer dura 5 segundos. Está en el cliente y en las decisiones. Las dos pruebas que lo cubren no llegan a ejecutarse: Node rechaza `clearTimeout` en `mock.timers.enable`.
- Ingresos y gastos requieren categoría. La validación lo exige. La migración añade `movements_category_required`.
- Un movimiento confirmado no puede tener fecha futura en `America/Mexico_City`. Los compromisos futuros siguen fuera, en el Hito 7. La validación lo rechaza y esa prueba de unidad sí pasó. La migración lo rechaza con un disparador. Un movimiento `pendiente` con fecha futura no lo crea esta interfaz; el disparador solo mira el estado `confirmado`.
- La nota admite hasta 280 caracteres. Validación, prueba de unidad y restricción de la migración.
- Categorías y cuentas pueden archivarse y reactivarse. La interfaz y los repositorios lo hacen. `archived_at` llega con la migración.
- Archivar no elimina movimientos ni otro historial. La interfaz no borra filas al archivar. La migración cambia las llaves a `on delete restrict`.
- La lista va de lo más reciente a lo más antiguo. La prueba de unidad pasó.
- Un movimiento ligado a una meta no se edita ni se elimina desde Movimientos. La pantalla lo deja en solo lectura. La migración bloquea el `update` y el `delete`, también si la sesión autenticada intenta abrir la variable del Hito 8.
- La demostración de Cancún permanece separada. Las pruebas de frontera de los cuatro repositorios pasaron.
- Catálogo de ingreso: Nómina, Honorarios, Ventas o negocio, Reembolso y Otro ingreso.
- Catálogo de gasto: Comida, Transporte, Vivienda, Servicios, Salud, Educación, Suscripciones, Entretenimiento, Personal y Otros.
- Las categorías se crean, renombran, archivan y reactivan.
- Una categoría sin referencias puede eliminarse. Una utilizada solo puede archivarse. El conteo de referencias está en el cliente. El rechazo al borrar queda en las llaves de la migración y en `supabase/tests/hito6_movements.test.sql`, sin ejecutar.
- Los nombres no se duplican dentro del mismo tipo, ignorando mayúsculas y espacios exteriores. El índice único y el recorte están en la migración. Un nombre archivado sigue ocupado.

## Qué pertenece a 6A Datos, 6B Interfaz y 6C Validación

Corte propuesto. No se implementó como tres entregas separadas. El árbol ya mezcla las tres.

- 6A Datos: la migración, los repositorios, las restricciones SQL y `supabase/tests/hito6_movements.test.sql`.
- 6B Interfaz: pantallas de cuenta, movimientos, registro, corrección, categorías y la separación visual de la demostración.
- 6C Validación: lint, typecheck, `npm test`, la prueba manual en el navegador y el cierre, sin marcar el hito como aprobado.

## Qué está incompleto

- La migración no está aplicada. La base local no se consultó en este corte.
- `supabase/tests/hito6_movements.test.sql` no se ejecutó.
- `npm test` falla en dos pruebas de deshacer. El arreglo de dejar solo `setTimeout` en `options.apis` no se escribió. En Node v24.21.0, `clearTimeout` dentro de `apis` lanza `ERR_INVALID_ARG_VALUE`. Un ensayo aparte, fuera del archivo, mostró que simular solo `setTimeout` sí deja que `clearTimeout` cancele ese temporizador. Ese ensayo no quedó en el repositorio.
- No hay recorrido manual en el navegador.
- No se corrió `npx expo-doctor` en este corte.
- El Hito 6 no está cerrado ni aprobado.

## Estado de la migración y de la base local

`supabase/migrations/20260928120000_hito6_movements_categories.sql` aparece sin seguimiento. No forma parte de `fa1e238`. Este corte no la aplicó y no preguntó a la base. El traspaso anterior ya decía que la base local seguía en el Hito 5.

HEAD: `fa1e2386415370c4f5889104427db11031ea6952`.

## Archivos modificados y sin seguimiento

Salida real de `git status --short` en este corte. Los directorios `components/account/` y `src/movements/` salen colapsados.

```text
 M README.md
 M app/(tabs)/_layout.tsx
 M app/(tabs)/confirmar.tsx
 M app/(tabs)/corregir.tsx
 M app/(tabs)/inicio.tsx
 M app/(tabs)/movimientos.tsx
 M app/(tabs)/registrar.tsx
 M app/_layout.tsx
 M app/cuenta.tsx
 M components/TabBar.tsx
 M docs/ahorruta-decisions-v1.md
 M package.json
 M src/persistence/account-repository.ts
 M src/persistence/demo-boundary.test.ts
 M src/persistence/profile-repository.ts
 M supabase/tests/hito5_isolation.test.sql
?? app/(tabs)/categorias.tsx
?? components/account/
?? components/movement-draft.tsx
?? docs/ahorruta-handoff-hito-6-en-curso.md
?? docs/ahorruta-handoff-hito-6.md
?? src/movements/
?? src/persistence/category-repository.ts
?? src/persistence/finance.ts
?? src/persistence/movement-repository.ts
?? supabase/migrations/20260928120000_hito6_movements_categories.sql
?? supabase/tests/hito6_movements.test.sql
```

`docs/ahorruta-handoff-hito-6.md` ya estaba sin seguimiento antes de este trabajo. Este archivo, `docs/ahorruta-handoff-hito-6-siguiente.md`, se crea después de esa lectura y también quedará sin seguimiento.

Nada está en el índice. No hubo `git add` ni `git commit`.

## Resultados exactos de pruebas, lint y typecheck

`git diff --check` terminó con código 0. No señaló espacios ni conflictos. Git avisó que, en la próxima escritura, cambiará LF por CRLF en varios archivos ya modificados. Eso no es un fallo de `--check`.

`npm test` terminó con código 1.

```text
ℹ tests 72
ℹ suites 14
ℹ pass 70
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1383.2825
```

Los dos fallos están en `src/movements/validation.test.ts`:

- `deshacer dentro de los 5 segundos no borra y salir sí confirma`
- `al eliminar otro movimiento se confirma el anterior`

Los dos lanzan `TypeError [ERR_INVALID_ARG_VALUE]` en `enableUndoTimers`, línea 160: `The property 'options.apis' option clearTimeout is not supported. Received 'clearTimeout'`.

`npm run lint` terminó con código 0. `expo lint` no imprimió problemas.

`npm run typecheck` terminó con código 0. `tsc --noEmit` no imprimió errores.

En los tres comandos de npm apareció el aviso `Unknown env config "devdir"`. No cambió estos códigos de salida.

No se ejecutó `npx expo-doctor` ni ningún comando de Supabase.

## Próxima acción concreta

Empieza por 6A Datos, porque la migración sigue sin aplicar.

1. Corrige solo el mock de deshacer: en `enableUndoTimers`, pasa `apis: ['setTimeout']` y quita `clearTimeout`. No cambies la duración ni el comportamiento. Vuelve a correr `npm test` y confirma código 0.
2. Relee `supabase/migrations/20260928120000_hito6_movements_categories.sql` y `supabase/tests/hito6_movements.test.sql`.
3. Aplica únicamente esa migración con `npx supabase migration up`. No uses `db reset`. No borres `hito5-beto@example.com` ni `hito5-sin-confirmar@example.com`. No crees un proyecto remoto.
4. Ejecuta `npx supabase test db`.
5. Deja 6B como está, salvo un fallo que salga de esas pruebas.
6. 6C queda para después: recorrido manual en el navegador y el cierre. No marques el Hito 6 como aprobado.

## Checkpoint

No hay checkpoint que commitear. El cierre del Hito 5 en `fa1e238` está intacto y el árbol de trabajo no se revirtió, pero `npm test` termina en código 1. Lint y typecheck terminan en código 0. La migración sigue fuera de la base. No se hizo commit.
