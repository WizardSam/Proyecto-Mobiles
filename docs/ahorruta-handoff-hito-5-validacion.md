# Ahorruta — Validación del Hito 5

Fecha: 27 de septiembre de 2026

Este documento cierra la revisión del Hito 5. No abre el Hito 6 ni un proyecto remoto. La validación manual de la interfaz no se hizo.

## Estado actual

El Hito 5 está implementado en local y revisado. No hay proyecto remoto de Supabase. No hay repositorio git en esta carpeta. Nada se ha confirmado con un commit.

Incluye:

- Cuenta con correo y contraseña. Sin acceso anónimo, redes sociales ni enlace mágico en la interfaz.
- Confirmación de correo antes de guardar datos financieros. Antes, la política solo deja cambiar el nombre visible.
- Recuperación de contraseña y pantalla para definir una contraseña nueva.
- Perfil con `profiles.id = auth.users.id`, sin columna `user_id`.
- Sesión en el cliente de Supabase para Expo, con almacenamiento local del dispositivo.
- Esquema financiero en migraciones, con RLS, llaves compuestas y centavos `bigint`.
- `recurring_commitments` para suscripciones, renta y otros pagos recurrentes.
- Hechos de meta guardados una sola vez, con `introduced_in_version`.
- Hitos y parámetros de plan por versión confirmada.
- Demostración de Cancún separada, identificada como local y sin copia automática a la cuenta.
- Función de servidor `delete-account`: reautentica la contraseña, exige `ELIMINAR` y borra solo al usuario autenticado.
- Pruebas de aislamiento entre dos usuarios.
- Variables públicas en `.env.example` y `.env.local`. La clave secreta no está en el código de la app.
- Documentación de uso en `docs/ahorruta-hito-5.md`.

Los motores `src/money.ts`, `src/dates.ts`, `src/ledger.ts`, `src/goals.ts` y `src/observed.ts` no cambiaron sus reglas.

La interfaz de movimientos, compromisos y metas sigue en la demostración. Eso corresponde a los Hitos 6, 7 y 8. No se exportó una función para rehidratar metas. No se sembró el catálogo de categorías.

Moneda MXN y zona `America/Mexico_City`, fijas. Cantidades en centavos enteros, tope `9007199254740991`. Ocultar cantidades sigue siendo local al dispositivo. Textos de autenticación en español de México.

## Correcciones ya realizadas

En la revisión posterior a `docs/ahorruta-handoff-hito-5-continuacion.md`:

- El conversor de centavos acepta el entero que PostgREST devuelve como número JSON y también el mismo entero en texto. Sigue rechazando decimales y cantidades fuera del rango seguro. Sin esto, volver a abrir un perfil con montos fallaba.
- El borrado envía la frase en mayúsculas. El botón ya se activaba con `eliminar`, pero el servidor solo acepta `ELIMINAR`.
- Guardar en Mi cuenta espera a que el perfil termine de cargar. Una frecuencia vacía ya no se muestra ni se guarda como semanal. Si se elige una última cuenta sin saldo inicial, la pantalla pide ese saldo. Después de guardar, los saldos mostrados salen de la base.
- El disparador diferido del desembolso revisa solo el desembolso de la transacción y exige que su gasto coincida en cuenta, monto y fecha. Antes revisaba los desembolsos de todos los usuarios y no volvía a comprobar el monto si el desembolso cambiaba.
- El perfil de la demostración ya no dice que la cuenta real todavía no existe. Aclara que esa confirmación no borra la cuenta y que la eliminación definitiva está en Mi cuenta.

La primera pasada de `npm run lint` falló por un `setState` sincrónico en el efecto de carga. Eso se corrigió antes de repetir el lint.

## Resultados de las pruebas

Repetidas al cerrar la revisión, después de las correcciones:

| Comando | Resultado |
| --- | --- |
| `npm test` | 56 pruebas aprobadas, 0 fallos |
| `npm run lint` | Sin errores, código 0 |
| `npm run typecheck` | Sin errores, código 0 |
| `npx supabase migration up` | Aplicó `20260927234500_hito5_disbursement_match.sql` |
| `npx supabase test db` | 55 pruebas aprobadas |

`npm test` incluye las pruebas de los motores, las de centavos y las de la frontera de la demostración. `npx supabase test db` es el aislamiento entre dos usuarios, el correo sin confirmar, el rango de centavos, el desembolso y el borrado en cascada. Esas pruebas usan usuarios dentro de una transacción que se revierte. No dejan cuentas en la base local.

De la sesión de implementación, ya registrada en el traspaso anterior y no repetida ahora:

| Comando | Resultado |
| --- | --- |
| `npm test` | 54 pruebas aprobadas, antes de las dos pruebas nuevas de centavos |
| `npx supabase test db` | 53 pruebas, después de corregir el conteo del plan |
| POST local a `/functions/v1/delete-account` sin sesión | HTTP 401 |
| Borrado local | Contraseña incorrecta: 401. Frase incorrecta: 400. Contraseña y `ELIMINAR`: 200. El otro usuario siguió pudiendo entrar |

Aparece el aviso de npm `Unknown env config "devdir"`. No bloqueó los comandos.

## Servicios locales

Al cerrar la revisión seguían en marcha, sanos o en ejecución. No se reinició Docker.

De Ahorruta:

| Servicio | Dirección |
| --- | --- |
| API, Auth y funciones | `http://127.0.0.1:54321` |
| Base PostgreSQL 17 | `127.0.0.1:54322` |
| Studio | `http://127.0.0.1:54323` |
| Bandeja de correo | `http://127.0.0.1:54324` |

Contenedores: `supabase_db_Ahorruta`, `supabase_auth_Ahorruta`, `supabase_kong_Ahorruta`, `supabase_rest_Ahorruta`, `supabase_inbucket_Ahorruta`, `supabase_studio_Ahorruta`, `supabase_pg_meta_Ahorruta`, `supabase_edge_runtime_Ahorruta`.

También seguían `mysql` y `phpmyadmin`, ajenos a este hito.

Almacenamiento, realtime, analítica y el pooler están apagados en `supabase/config.toml`. No hay proyecto remoto enlazado.

Si hace falta comprobar que siguen vivos, `npx supabase status` basta. No hace falta `supabase start` si esos contenedores siguen sanos.

## Usuarios locales que deben conservarse

- `hito5-beto@example.com`. Quedó de la prueba de borrado de la implementación. No borrarlo durante la validación: sirve para comprobar que eliminar otra cuenta no lo afecta.
- `hito5-ana@example.com` ya se borró con `delete-account`. No hace falta recrearlo para conservar el estado.

Los correos `ana@example.com`, `beto@example.com`, `caro@example.com` y `dano@example.com` solo existen dentro de `supabase/tests/hito5_isolation.test.sql` y la transacción termina en `rollback`.

Las cuentas nuevas de la validación manual deben usar otros correos.

## Archivos y migraciones

Migraciones, en este orden:

1. `supabase/migrations/20260927220000_hito5_financial_schema.sql`
2. `supabase/migrations/20260927234500_hito5_disbursement_match.sql`

La segunda ya está aplicada en la base local.

Relevantes para la validación:

- `supabase/config.toml`
- `supabase/tests/hito5_isolation.test.sql`
- `supabase/functions/delete-account/index.ts`
- `supabase/templates/confirmation.html`
- `supabase/templates/recovery.html`
- `src/persistence/database-cents.ts`
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
- `.env.local`

`supabase/.temp/` está en `.gitignore` y no debe versionarse. `.env.local` también está ignorado.

## Variables

En `.env.local`, sin pegar valores:

```text
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

La clave publicable sale de `npx supabase status`. No usar la clave secreta, ni ponerla en `EXPO_PUBLIC_`, ni copiarla a este documento.

La función `delete-account` lee en el servidor `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`. Esas variables las inyecta el entorno local de Supabase. No viven en la app.

Enlaces de correo ya permitidos:

- `ahorruta://correo-confirmado`
- `ahorruta://restablecer`

## Validación pendiente

No se recorrió la interfaz en el navegador ni en un teléfono. No se abrió un enlace real de confirmación ni de recuperación. Hacerlo en el siguiente chat, sin agregar funcionalidad y sin crear el proyecto remoto.

1. Confirmar que los contenedores de Ahorruta siguen sanos.
2. Arrancar la app con `npm start` o `npm run web`.
3. Registro: crear una cuenta nueva, distinta de Beto. Comprobar que la demostración de Cancún no se copia y que el correo aparece en `http://127.0.0.1:54324`.
4. Confirmación: abrir el enlace del correo. El canje PKCE tiene que ocurrir en el mismo dispositivo que inició el registro. Comprobar que, ya confirmada, Mi cuenta guarda nombre, frecuencia, ingreso, gasto, inicio del seguimiento y saldos de efectivo, débito o ahorro.
5. Persistencia: cerrar sesión, volver a entrar y comprobar que esos datos siguen y que la demostración no cambió.
6. Correo sin confirmar: intentar entrar antes de confirmar y comprobar que no se guardan datos financieros.
7. Recuperación: pedir el enlace, abrirlo en `ahorruta://restablecer` y definir una contraseña nueva. Entrar con esa contraseña.
8. Borrado: en Mi cuenta, contraseña incorrecta, frase distinta de `ELIMINAR` y después contraseña correcta con `ELIMINAR`. Comprobar que esa cuenta ya no entra y que `hito5-beto@example.com` sigue pudiendo entrar.
9. No sembrar categorías ni conectar movimientos, compromisos o metas reales.

## Defectos conocidos

- La confirmación y la recuperación dependen de PKCE. El enlace solo se canjea donde se inició el flujo. En el navegador, `ahorruta://` no abre por sí solo la sesión de la pestaña web.
- Con la confirmación obligatoria, el inicio de sesión no entrega sesión hasta confirmar el correo. La edición del nombre y el reenvío están en Mi cuenta, que pide sesión. Hay que ver en la validación si ese estado se puede alcanzar.
- Si la lectura del perfil falla, Guardar queda desactivado hasta salir y volver a entrar.
- Dejar vacío un saldo ya guardado no lo borra. Al guardar, el formulario vuelve a mostrar el valor de la base.
- `npx supabase functions list` pide token remoto. No usarlo para comprobar la función local.
- Quedan avisos de npm: `Unknown env config "devdir"` y scripts de instalación sin aprobar para `esbuild` y `unrs-resolver`. No bloquearon las pruebas.

## Mensaje para el siguiente chat

```text
Lee docs/ahorruta-handoff-hito-5-validacion.md y docs/ahorruta-hito-5.md.
El Hito 5 está implementado y revisado en local. Falta la validación manual.
No avances a los Hitos 6, 7 u 8.
No crees ni conectes un proyecto remoto de Supabase.
No cambies las reglas de los motores.
No reinstales dependencias ni reinicies Docker si el entorno local sigue en marcha.
No borres al usuario hito5-beto@example.com.
Valida registro, confirmación de correo, recuperación, persistencia y borrado.
Si encuentras un defecto, corrige solo ese defecto.
```
