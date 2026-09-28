# Ahorruta — Cierre documental del Hito 5

Fecha: 28 de septiembre de 2026

El Hito 5 queda aprobado. Este documento registra el cierre local. No abre el Hito 6 y no crea un proyecto remoto.

## Estado actual del repositorio

Repositorio git local en esta carpeta, rama `master`. No hay remoto. Nada se ha publicado.

El último commit es el punto de recuperación anterior a la validación manual. Después de ese commit, la validación dejó cambios sin confirmar. Hay que incluirlos en el commit de cierre, no descartarlos.

Archivos modificados:

- `app/crear-cuenta.tsx`
- `app/cuenta.tsx`
- `app/recuperar.tsx`
- `app/restablecer.tsx`
- `components/session-state.tsx`
- `src/persistence/supabase-client.ts`
- `supabase/config.toml`

Archivos nuevos:

- `metro.config.js`
- `src/persistence/auth-redirect.ts`
- `src/persistence/install-device-storage.ts`
- `src/persistence/install-device-storage.web.ts`

Esos cambios salieron de la validación:

- En la web, la sesión usa el `localStorage` del navegador. En el dispositivo sigue `expo-sqlite`. Metro trata `.wasm` como recurso.
- En la web, la confirmación y la recuperación regresan a `http://127.0.0.1:8081` o a `http://localhost:8081`, en `/correo-confirmado` y `/restablecer`. En el teléfono siguen `ahorruta://correo-confirmado` y `ahorruta://restablecer`. Esas direcciones web están en `additional_redirect_urls`.
- Un enlace caducado ya no manda a **Entrar** sin aviso. **Nueva contraseña** dice que hay que pedir otro.
- El aviso de borrado aparece junto a **Borrar mi cuenta**.

`.env.local` y `supabase/.temp/` siguen ignorados. La clave secreta no está en el código de la app.

Durante la validación se reinició el entorno local de Supabase para cargar las direcciones nuevas. La base se restauró desde la copia de ese arranque. No se creó un proyecto remoto.

La app web de esta validación quedó en `http://127.0.0.1:8081`. API en `http://127.0.0.1:54321`. Bandeja en `http://127.0.0.1:54324`.

## Commit local más reciente

```text
5215623f9446a0eb0c8172aa0cff72aade0b27ed
5215623
Deja un punto local para volver al Hito 5 revisado si la validación manual de autenticación exige un arreglo.
Samuel García Delgado
2026-09-27 23:26:36 -0600
```

Ese commit no incluye las correcciones de la validación ni este documento.

## Verificación del cierre

Ejecutada el 28 de septiembre de 2026 sobre el árbol que ya incluye las correcciones de la validación manual. El entorno local seguía en marcha. No se reinició Docker ni se creó un proyecto remoto.

| Comando | Resultado |
| --- | --- |
| `npm test` | 56 pruebas aprobadas, 0 fallos |
| `npm run lint` | Sin errores, código 0 |
| `npm run typecheck` | Sin errores, código 0 |
| `npx supabase test db` | 55 pruebas aprobadas |

`git check-ignore -v` confirma que `.env.local` y `supabase/.temp/` siguen excluidos. Ninguno de los dos está versionado. La clave secreta no entra en este commit.

Aparece el aviso de npm `Unknown env config "devdir"`. No bloqueó los comandos.

## Resultados automatizados anteriores

Siguen siendo los de `docs/ahorruta-handoff-hito-5-validacion.md`, posteriores a las correcciones de esa revisión:

| Comando | Resultado |
| --- | --- |
| `npm test` | 56 pruebas aprobadas, 0 fallos |
| `npm run lint` | Sin errores, código 0 |
| `npm run typecheck` | Sin errores, código 0 |
| `npx supabase migration up` | Aplicó `20260927234500_hito5_disbursement_match.sql` |
| `npx supabase test db` | 55 pruebas aprobadas |

De la implementación, ya registrados y no repetidos en la validación manual:

| Comando | Resultado |
| --- | --- |
| `npm test` | 54 pruebas aprobadas, antes de las dos pruebas nuevas de centavos |
| `npx supabase test db` | 53 pruebas, después de corregir el conteo del plan |
| POST local a `/functions/v1/delete-account` sin sesión | HTTP 401 |
| Borrado local | Contraseña incorrecta: 401. Frase incorrecta: 400. Contraseña y `ELIMINAR`: 200. El otro usuario siguió pudiendo entrar |

Aparece el aviso de npm `Unknown env config "devdir"`. No bloqueó los comandos.

## Validación manual

Hecha en el navegador, en `http://127.0.0.1:8081`, el 28 de septiembre de 2026. La cuenta usada para el recorrido completo fue `lalal@gmail.com`. El correo se quedó en la bandeja local.

1. El puerto 8081 servía un Expo de esta misma carpeta arrancado a las 12:26. Mostraba una compilación anterior: solo **Comenzar**, y `/entrar` no existía. Se detuvo ese proceso y otro Expo de la misma carpeta en el puerto 8082. Con la caché limpia, la pantalla inicial muestra **Entrar a mi cuenta** y `/entrar` muestra el formulario y **Crear cuenta**.
2. Registro de `lalal@gmail.com`. La pantalla dijo que había que revisar el correo y que hasta confirmar no se guarda información financiera.
3. El enlace de la bandeja empieza en `http://127.0.0.1:54321`. Al abrirlo, el navegador quedó en una página vacía: el regreso era `ahorruta://` y no entra en la pestaña web. El primer uso confirmó la cuenta en el servidor. El enlace era de un solo uso.
4. Después de entrar con correo y contraseña, **Mi cuenta** dejó guardar nombre, frecuencia mensual, ingreso, gasto, inicio del seguimiento y saldos de efectivo, débito y ahorro. El aviso fue **Perfil guardado**.
5. Al cerrar sesión, la pantalla inicial sigue diciendo: «El recorrido de Cancún vive solo en este dispositivo. No inicia sesión y no se copia a una cuenta real.» Al volver a entrar, los datos guardados seguían.
6. `hito5-sin-confirmar@example.com` no obtuvo sesión. El aviso fue **Confirma tu correo antes de entrar**. No se guardaron datos financieros. **Mi cuenta**, donde están el nombre y el reenvío, no se alcanzó sin sesión.
7. La recuperación de `lalal@gmail.com` envió el correo. Windows pidió abrir `ahorruta://restablecer` en otra aplicación. Ese código caducó antes de canjearse en la web y la pantalla saltó a **Entrar**. Con el regreso corregido a la propia pestaña, **Nueva contraseña** apareció, la contraseña nueva se guardó y el siguiente inicio de sesión entró a **Mi cuenta** con los mismos datos.
8. Borrado de `lalal@gmail.com`: `BORRAR` dejó **Borrar mi cuenta** apagado. Con `ELIMINAR` y una contraseña incorrecta, el servidor respondió 401 y el aviso visible quedó **La contraseña no coincide**. Con la contraseña real y `ELIMINAR`, la app volvió a la pantalla principal. Esa cuenta ya no deja iniciar sesión y ya no está en `auth.users`.

No se sembraron categorías ni se conectaron movimientos, compromisos o metas reales.

Quedó sin recorrido visual el inicio de sesión de `hito5-beto@example.com`: la contraseña de la implementación no está anotada y no se cambió. La base muestra que el borrado de la otra cuenta no lo eliminó.

## Usuarios locales que permanecen

| Correo | Estado |
| --- | --- |
| `hito5-beto@example.com` | Confirmado, con perfil. No borrarlo. |
| `hito5-sin-confirmar@example.com` | Sin confirmar, con perfil. Sirve como cuenta que no puede entrar. |

`lalal@gmail.com` se borró en la validación. `hito5-ana@example.com` ya se había borrado en la implementación. Los correos `ana@example.com`, `beto@example.com`, `caro@example.com` y `dano@example.com` solo existen dentro de la prueba SQL que termina en `rollback`.

## Cierre

Este commit, en `master` y sin remoto, incluye las correcciones de la validación manual, `README.md`, `docs/ahorruta-hito-5.md` y este documento. No se publica.

`README.md` y `docs/ahorruta-hito-5.md` describen el Hito 5 aprobado: cuenta local, confirmación, recuperación, **Mi cuenta**, borrado, demostración separada y ausencia de proyecto remoto.

No se sembraron categorías ni se conectaron movimientos, compromisos o metas. No se borró a `hito5-beto@example.com` ni se cambió su contraseña.

El traspaso `docs/ahorruta-handoff-hito-6.md` queda fuera de este commit, para revisión. No implementa el Hito 6.
