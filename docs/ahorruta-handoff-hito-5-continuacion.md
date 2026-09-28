# Ahorruta — Continuación del Hito 5

Fecha: 27 de septiembre de 2026

Este documento cierra la sesión de implementación. No abre el Hito 6 ni un proyecto remoto.

## Qué quedó terminado

El Hito 5 aprobado está implementado en local:

- Autenticación con correo y contraseña, sin acceso anónimo, redes sociales ni enlace mágico.
- Confirmación de correo antes de guardar datos financieros.
- Recuperación de contraseña y pantalla para definir una contraseña nueva.
- Perfil con `profiles.id = auth.users.id`, sin columna `user_id`.
- Sesión en el cliente de Supabase para Expo.
- Esquema financiero completo en una migración, con RLS, llaves compuestas y centavos `bigint`.
- `recurring_commitments` para suscripciones, renta y otros pagos recurrentes.
- Hechos de meta (aportaciones, aportaciones inmediatas, desembolsos y fechas omitidas) guardados una sola vez, con `introduced_in_version`.
- Hitos y parámetros de plan por versión confirmada.
- Demostración de Cancún separada, identificada como local y sin copia automática a la cuenta.
- Función de servidor `delete-account`: reautentica la contraseña, exige `ELIMINAR` y borra solo al usuario autenticado.
- Pruebas de aislamiento entre dos usuarios.
- Variables públicas en `.env.example`. La clave secreta no está en el código de la app.
- Documentación de uso en `docs/ahorruta-hito-5.md`.

Los motores `src/money.ts`, `src/dates.ts`, `src/ledger.ts`, `src/goals.ts` y `src/observed.ts` no cambiaron sus reglas.

## Qué quedó incompleto o sin verificar

- No existe proyecto remoto de Supabase. Así estaba aprobado.
- No hay repositorio git en esta carpeta (`git status` respondió que no es un repositorio). Nada se ha confirmado con un commit.
- La interfaz de movimientos, compromisos y metas sigue en la demostración. Eso corresponde a los Hitos 6, 7 y 8.
- No se exportó una función para rehidratar metas. Queda para el Hito 8.
- No se sembró el catálogo de categorías.
- No se recorrió la interfaz de autenticación en el navegador ni en un teléfono.
- No se abrió en un dispositivo el enlace real de confirmación ni el de recuperación.
- `npx supabase functions list` intentó usar la API remota y falló por falta de token. No se inició sesión remota. La función local sí respondió por HTTP.
- Quedó en la base local el usuario de prueba `hito5-beto@example.com`. `hito5-ana@example.com` se borró con la función. No se limpió a Beto en esta sesión.
- La carpeta no tiene `.git`, así que no se pudo comprobar con `git check-ignore` que `.env.local` quede fuera de un commit. El archivo está listado en `.gitignore`.

## Archivos creados

- `supabase/config.toml`
- `supabase/migrations/20260927220000_hito5_financial_schema.sql`
- `supabase/tests/hito5_isolation.test.sql`
- `supabase/functions/delete-account/index.ts`
- `supabase/templates/confirmation.html`
- `supabase/templates/recovery.html`
- `src/persistence/database-cents.ts`
- `src/persistence/database-cents.test.ts`
- `src/persistence/demo-boundary.test.ts`
- `src/persistence/supabase-client.ts`
- `src/persistence/auth-messages.ts`
- `src/persistence/profile-repository.ts`
- `src/persistence/account-repository.ts`
- `src/persistence/delete-account.ts`
- `components/session-state.tsx`
- `app/entrar.tsx`
- `app/crear-cuenta.tsx`
- `app/recuperar.tsx`
- `app/restablecer.tsx`
- `app/correo-confirmado.tsx`
- `app/cuenta.tsx`
- `docs/ahorruta-hito-5.md`
- `.env.example`
- `.env.local` (local, ignorado; solo URL y clave publicable)
- `docs/ahorruta-handoff-hito-5-continuacion.md`

## Archivos modificados

- `package.json`
- `package-lock.json`
- `app.json`
- `app/_layout.tsx`
- `app/index.tsx`
- `app/configuracion.tsx`
- `app/(tabs)/perfil.tsx`
- `components/TabBar.tsx`
- `components/ui/primitives.tsx`
- `components/demo-state.tsx`
- `tsconfig.json`
- `eslint.config.js`
- `.gitignore`
- `README.md`

`supabase init` también generó `supabase/.temp/`. Esa carpeta está en `.gitignore` y contiene claves locales de demostración. No debe versionarse.

## Migración

Una sola, en este orden:

1. `supabase/migrations/20260927220000_hito5_financial_schema.sql`

`npx supabase start` la aplicó al arrancar la base local.

## Dependencias instaladas

De desarrollo, versión exacta:

- `supabase@2.118.0`

De la app, con `npx expo install`:

- `@supabase/supabase-js@^2.117.2`
- `react-native-url-polyfill@^4.0.0`
- `expo-sqlite@~57.0.3`
- `expo-linking` ya estaba en el proyecto (`~57.0.11`)

`app.json` quedó con el plugin `expo-sqlite`.

## Comandos y resultados

| Comando | Resultado |
| --- | --- |
| `docker info` | Servidor Docker 29.4.2 |
| `npm install --save-dev --save-exact supabase@2.118.0` | Correcto. Aviso de scripts de instalación no aprobados para `esbuild` y `unrs-resolver` |
| `npx expo install @supabase/supabase-js react-native-url-polyfill expo-sqlite expo-linking` | Correcto |
| `npx supabase init --yes` | Correcto |
| `npx supabase start` | Correcto. Migración aplicada. API en `http://127.0.0.1:54321` |
| `npm test` | 54 pruebas aprobadas, 0 fallos. Incluye las 47 del motor y las nuevas de centavos y de la frontera de la demostración |
| `npm run lint` | Sin errores en la última ejecución |
| `npm run typecheck` | Sin errores (`tsc --noEmit`, salida vacía, código 0) |
| `npx supabase test db` (primer intento) | Falló solo el plan: se anunciaron 52 pruebas y corrieron 53. Las 52 afirmaciones habían pasado |
| `npx supabase test db` (con `plan(53)`) | Correcto. 53 pruebas |
| `npx supabase functions list` | Error `AccessTokenRequiredError`. Pedía login remoto. No se hizo |
| POST local a `/functions/v1/delete-account` sin sesión | HTTP 401 del gateway, la ruta existe |
| Prueba local de borrado | Contraseña incorrecta: 401. Frase incorrecta: 400. Contraseña y `ELIMINAR`: 200. El otro usuario siguió pudiendo entrar |

También aparece el aviso de npm `Unknown env config "devdir"`. No bloqueó los comandos.

## Docker y Supabase local

Docker responde. En la comprobación final había 10 contenedores en marcha.

De Ahorruta, sanos o en ejecución:

- `supabase_db_Ahorruta`
- `supabase_auth_Ahorruta`
- `supabase_kong_Ahorruta`
- `supabase_rest_Ahorruta`
- `supabase_inbucket_Ahorruta` (bandeja en `http://127.0.0.1:54324`)
- `supabase_studio_Ahorruta` (`http://127.0.0.1:54323`)
- `supabase_pg_meta_Ahorruta`
- `supabase_edge_runtime_Ahorruta`

También siguen `mysql` y `phpmyadmin`, ajenos a este hito.

Para caber en la memoria de Docker se dejaron apagados en `supabase/config.toml` almacenamiento, realtime y analítica. Siguen activos la base, Auth, la API, Studio, la bandeja de correo y las funciones.

No hay proyecto remoto enlazado.

## Errores o advertencias pendientes

- El primer `supabase test db` falló por el conteo del plan. Ya quedó corregido y la repetición pasó.
- `supabase functions list` no sirve en local sin token remoto. No usar ese comando para comprobar la función.
- Aviso `DEP0190` al lanzar `npx` con `shell: true` en el script temporal de prueba. El script no forma parte del proyecto.
- Scripts de instalación de npm pendientes de aprobación para `esbuild` y `unrs-resolver`.
- Usuario local de prueba `hito5-beto@example.com` todavía puede existir.
- La app de autenticación no se verificó visualmente.

## Decisiones que el siguiente chat debe respetar

- Correo y contraseña. Sin anónimo, sin redes sociales y sin enlace mágico.
- El correo confirmado es obligatorio antes de guardar finanzas. Antes, solo el nombre visible.
- `profiles.id` es el propietario. Las demás tablas usan `user_id`.
- Moneda MXN y zona `America/Mexico_City`, fijas. El disparador no deja cambiarlas.
- Cantidades en centavos enteros, tope `9007199254740991`. El repositorio convierte el `bigint` textual y rechaza lo que quede fuera.
- La demostración de Cancún es local, está identificada y no se copia a la cuenta.
- No sembrar categorías. Eso es el Hito 6.
- Ocultar cantidades sigue siendo local al dispositivo.
- Textos de autenticación en español de México.
- No crear ni conectar el proyecto remoto hasta un paso separado y aprobado.
- No cambiar las reglas de los motores.
- No avanzar a los Hitos 6, 7 u 8.
- El desembolso y su único gasto confirmado van en la misma transacción cuando se conecten las metas. La aportación inmediata no es un movimiento.
- El borrado es la función de servidor con la clave privada, no una función SQL llamable desde la app.
- La clave secreta no entra al repositorio ni a `EXPO_PUBLIC_`.

## Próxima acción

Revisar el Hito 5 ya implementado. No escribir más funcionalidad ni abrir el proyecto remoto. Si la revisión encuentra un defecto, corregir solo ese defecto.

## Mensaje para el siguiente chat

```text
Lee docs/ahorruta-handoff-hito-5-continuacion.md y docs/ahorruta-hito-5.md.
El Hito 5 está implementado en local y pendiente de mi revisión.
No avances a los Hitos 6, 7 u 8.
No crees ni conectes un proyecto remoto de Supabase.
No cambies las reglas de los motores.
No reinstales dependencias ni reinicies Docker si el entorno local sigue en marcha.
Espera mis observaciones de revisión antes de modificar código.
```
