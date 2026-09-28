# Ahorruta — Hito 5: cuenta, persistencia y aislamiento

Estado: aprobado en local.  
No hay proyecto remoto de Supabase.

## Qué incluye

- Cuenta con correo y contraseña, confirmación de correo y recuperación de contraseña.
- Perfil cuyo identificador es `profiles.id = auth.users.id`.
- Esquema financiero completo, con Row Level Security.
- Demostración de Cancún separada de la cuenta real.
- Borrado definitivo mediante la función de servidor `delete-account`.
- Pruebas de aislamiento entre dos usuarios.

Los motores `src/money.ts`, `src/dates.ts`, `src/ledger.ts`, `src/goals.ts` y `src/observed.ts` no cambian sus reglas. La base guarda hechos. Saldo, disponible, reserva, progreso, calendario, viabilidad y promedios se siguen calculando en esos módulos.

## Entorno local

Requisitos: Docker en marcha y la CLI del proyecto.

```bash
npx supabase start
npx supabase test db
npm test
npm run lint
npm run typecheck
```

`npx supabase status` muestra la URL y la clave publicable. Cópialas a `.env.local`:

```text
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

La clave secreta de servicio no va en la app, ni en `.env.local`, ni en el repositorio. La función de borrado la recibe del entorno de Supabase en el servidor.

En la web, la sesión usa el `localStorage` del navegador. En el dispositivo sigue `expo-sqlite`. Metro trata `.wasm` como recurso.

En la web, la confirmación y la recuperación regresan a la misma pestaña, en `/correo-confirmado` y `/restablecer`. En el teléfono siguen `ahorruta://correo-confirmado` y `ahorruta://restablecer`. Las direcciones web del entorno local están en `additional_redirect_urls`.

Un enlace caducado permanece en **Nueva contraseña** y dice que hay que pedir otro. El aviso de un borrado fallido aparece junto a **Borrar mi cuenta**.

Los correos locales no salen a internet. La bandeja está en el puerto que indica `npx supabase status`, normalmente `http://127.0.0.1:54324`.

## Correo y perfil

Antes de confirmar el correo, la persona solo puede cambiar su nombre visible. La política `profiles_update` y el disparador `private.protect_profile_fields` impiden modificar ingreso esperado, gasto estimado, frecuencia, inicio del seguimiento, última cuenta, moneda, zona horaria e identificador.

El perfil se crea con `private.handle_new_user`, con `search_path` vacío y permisos mínimos. Escribe el identificador de `auth.users`, MXN y `America/Mexico_City`. Ignora moneda, zona e identificadores que mande el cliente.

La moneda y la zona siguen fijas después de confirmar el correo. El resto de los datos financieros del perfil ya se puede completar.

## Reconstrucción de una meta

Para la versión `V`:

1. La identidad está en `goals`.
2. Los parámetros están en la fila `goal_versions` con `version = V`.
3. Los hitos están en `goal_milestones` de esa versión.
4. Aportaciones, aportaciones inmediatas, desembolsos y fechas omitidas se leen una sola vez, con `introduced_in_version <= V`.

Esos datos de entrada alimentan al motor. La base no tiene columnas para los resultados calculados.

## Desembolso y movimiento

Una aportación inmediata no crea un movimiento. El desembolso produce un solo gasto confirmado: `movements.goal_disbursement_id` es único y la fila debe ser un gasto confirmado de la misma cuenta, monto y fecha.

En el Hito 8, la confirmación del desembolso y la inserción de ese único movimiento deben ejecutarse en la misma transacción. El orden es: primero el desembolso y después el movimiento. Un disparador diferido rechaza la transacción si el desembolso queda sin ese gasto. Este hito no conecta esa operación a la interfaz.

## Borrado

`supabase/functions/delete-account` comprueba la sesión, vuelve a verificar la contraseña, exige la frase `ELIMINAR` y borra solo al usuario autenticado con la clave secreta. No hay una función SQL pública para borrar la cuenta.

## Aislamiento

`supabase/tests/hito5_isolation.test.sql` cubre perfiles, cuentas, categorías, movimientos, presupuestos, compromisos recurrentes, metas, versiones y tablas descendientes. También cubre el correo sin confirmar, el rango de centavos y el borrado en cascada de un usuario sin afectar al otro.

`recurring_commitments` representa suscripciones, renta y otros pagos recurrentes. No se siembran categorías: eso queda para el Hito 6.
