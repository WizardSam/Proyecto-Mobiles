# Ahorruta — Traspaso para iniciar el Hito 6

Fecha: 28 de septiembre de 2026

Este documento prepara el siguiente chat. No implementa el Hito 6. Queda fuera del commit de cierre, para revisión.

## Estado aprobado

- Hito 1 aprobado: caparazón visual navegable.
- Hito 2 aprobado: dinero en centavos enteros y fechas civiles.
- Hito 3 aprobado: saldos, presupuestos y viabilidad.
- Hito 4 aprobado: metas, reservas, hitos, desembolsos, reajustes e historial observado.
- Hito 5 aprobado en local: cuenta, confirmación, recuperación, Mi cuenta, borrado y aislamiento.
- La demostración de Cancún sigue separada de la cuenta. No se copia sola.
- No hay proyecto remoto de Supabase. Nada se ha publicado.

El cierre local es `fa1e238` (`fa1e2386415370c4f5889104427db11031ea6952`), en `master`, sin remoto:

```text
Cierra el Hito 5 aprobado en local e incorpora las correcciones de la validación manual de autenticación.
Samuel García Delgado
2026-09-28 00:50:35 -0600
```

El punto anterior es `5215623`.

## Verificación del cierre

Hecha el 28 de septiembre de 2026, con el entorno local ya en marcha. No se reinició Docker.

| Comando | Resultado |
| --- | --- |
| `npm test` | 56 pruebas aprobadas, 0 fallos |
| `npm run lint` | Sin errores, código 0 |
| `npm run typecheck` | Sin errores, código 0 |
| `npx supabase test db` | 55 pruebas aprobadas |

`.env.local` y `supabase/.temp/` siguen ignorados. La clave secreta no está en el repositorio.

Aparece el aviso de npm `Unknown env config "devdir"`. No bloqueó los comandos.

API en `http://127.0.0.1:54321`. Bandeja en `http://127.0.0.1:54324`. Studio en `http://127.0.0.1:54323`. Base en `127.0.0.1:54322`.

## Fuente de verdad

Leer antes de proponer o realizar cambios:

1. `docs/ahorruta-decisions-v1.md`
2. `docs/ahorruta-product-spec.md`
3. `docs/ahorruta-cursor-handoff.md`
4. `README.md`
5. `docs/ahorruta-hito-5.md`
6. `docs/ahorruta-handoff-cierre-hito-5.md`

Cuando exista una contradicción, `docs/ahorruta-decisions-v1.md` prevalece.

## Lo que ya existe

Los motores `src/money.ts`, `src/dates.ts`, `src/ledger.ts`, `src/goals.ts` y `src/observed.ts` calculan saldo, disponible, reserva, progreso, calendario, viabilidad y promedios. La base guarda hechos. Esas reglas no cambian.

El esquema ya tiene, con RLS y centavos enteros:

- `accounts`: efectivo, débito y ahorro.
- `categories`: por usuario, de ingreso o de gasto. No hay catálogo sembrado.
- `movements`: ingreso o gasto, cuenta, categoría, fecha, nota y estado. Un gasto exige categoría.
- `budgets` y `recurring_commitments`. Esas pantallas siguen en la demostración.

La interfaz de movimientos, compromisos y metas sigue en `constants/demo.ts` y `components/demo-state.tsx`. Registrar, listar, corregir y confirmar un movimiento todavía no escriben en la base.

En la web, la sesión usa el `localStorage` del navegador. En el dispositivo sigue `expo-sqlite`. La confirmación y la recuperación regresan a la misma pestaña en la web, y a `ahorruta://` en el teléfono.

## Usuarios locales que permanecen

| Correo | Estado |
| --- | --- |
| `hito5-beto@example.com` | Confirmado, con perfil. No borrarlo ni cambiar su contraseña. |
| `hito5-sin-confirmar@example.com` | Sin confirmar. Sirve como cuenta que no puede entrar. |

## Decisiones que el siguiente chat debe respetar

- Los tipos de movimiento son ingreso y gasto. Una aportación no es un movimiento.
- La cuenta predeterminada es la última utilizada. En el primer registro se elige una.
- Cantidades en centavos enteros, tope `9007199254740991`. Moneda MXN y zona `America/Mexico_City`, fijas.
- La demostración de Cancún permanece local, identificada y sin copia a la cuenta.
- Ocultar cantidades sigue siendo local al dispositivo.
- Textos en español de México.
- No crear ni enlazar un proyecto remoto de Supabase.
- No cambiar las reglas de los motores.
- No borrar ni cambiar la contraseña de `hito5-beto@example.com`.

El Hito 6 es movimientos reales. El catálogo de categorías forma parte de ese trabajo: la tabla existe y no está sembrada.

Quedan fuera de este hito:

- Compromisos, calendario y resumen. Eso es el Hito 7.
- Metas persistidas y el gasto único del desembolso en la misma transacción. Eso es el Hito 8.
- Voz. Eso es el Hito 9.

## Decisión todavía abierta

Antes de implementar el Hito 6 hay que definir cuánto tiempo permanece visible la opción de deshacer. Hoy, en la demostración, **Deshacer** solo cancela la confirmación de un borrado antes de salir de esa pantalla. No hay una duración aprobada. No inventarla.

## Siguiente fase

Hito 6: movimientos reales.

Antes de escribir código, preparar un plan y detenerse para aprobación. El plan debe cubrir:

- Catálogo de categorías de ingreso y de gasto, por usuario.
- Registro de un ingreso o un gasto real: cantidad, categoría, fecha, cuenta y nota opcional.
- Lista, filtros, edición y eliminación con confirmación.
- Cómo el deshacer usa la duración que se apruebe.
- Cómo la demostración de Cancún sigue separada mientras la cuenta guarda movimientos reales.
- Pruebas de aislamiento: un usuario no lee ni modifica los movimientos ni las categorías del otro.

No instalar dependencias, no sembrar datos y no escribir migraciones hasta que ese plan esté aprobado.

## Mensaje inicial recomendado para el chat nuevo

```text
Lee docs/ahorruta-handoff-hito-6.md y los documentos que señala.
El Hito 5 está aprobado y cerrado en local, en fa1e238. No hay proyecto remoto.
Prepara un plan para el Hito 6: movimientos reales y catálogo de categorías.
No escribas código, no siembres datos y no crees servicios externos.
La duración visible de deshacer sigue sin definirse: señálala y detente después del plan.
No borres ni cambies la contraseña de hito5-beto@example.com.
No avances a los Hitos 7, 8 o 9.
```
