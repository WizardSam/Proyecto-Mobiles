# Ahorruta — Traspaso del Subhito 6C

Fecha: 28 de septiembre de 2026

Los Subhitos 6A y 6B quedan aceptados. El recorrido manual no se hizo. El Hito 6 completo sigue sin aprobación. No hay commit.

HEAD sigue en `fa1e238` (`fa1e2386415370c4f5889104427db11031ea6952`), en `master`. El árbol de trabajo del Hito 6 sigue fuera de ese commit.

## Estado aprobado

6A — Datos quedó aplicado en la base local y aceptado. La migración, los repositorios, las restricciones y `supabase/tests/hito6_movements.test.sql` forman parte de ese corte.

6B — Interfaz quedó aceptado. Cubre inicio real, lista y filtros, registro y confirmación, corrección y eliminación, deshacer de 5 segundos, categorías, archivo y reactivación de cuentas, estados de carga, vacío y error, y la separación visual respecto de la demostración.

Queda fuera de este hito: compromisos, calendario real, resumen mensual de la cuenta, metas persistidas y voz.

## Base y migración

`supabase/migrations/20260928120000_hito6_movements_categories.sql` está aplicada. `supabase_migrations.schema_migrations` contiene:

- `20260927220000` `hito5_financial_schema`
- `20260927234500` `hito5_disbursement_match`
- `20260928120000` `hito6_movements_categories`

No uses `db reset`. No vuelvas a aplicar migraciones ya registradas. No crees un proyecto remoto.

El catálogo inicial se siembra una sola vez, al confirmar el correo. Un nombre archivado sigue ocupado. Las cinco llaves de categoría y de cuenta quedan en `on delete restrict`.

## Usuarios locales que deben conservarse

| Correo | Estado al cerrar 6A |
| --- | --- |
| `hito5-beto@example.com` | Confirmado. Catálogo sembrado, 15 categorías. |
| `hito5-sin-confirmar@example.com` | Sin confirmar. Sin catálogo y sin categorías. |

La contraseña de ambos sigue siendo la de la implementación. No está escrita en el repositorio. No la cambies, no la anotes en el traspaso y no uses la recuperación para sustituirla. Si falta la de Beto, detente y pregunta.

`lalal@gmail.com` y `hito5-ana@example.com` ya se borraron en el Hito 5. Los correos de `supabase/tests/` existen solo dentro de una transacción que termina en `rollback`.

## Direcciones locales

La validación manual del Hito 5 usó la app web en `http://127.0.0.1:8081`. Este corte no abrió el navegador ni comprobó si ese proceso sigue en marcha. Si el puerto está libre, arranca con `npm run web` y usa la dirección que imprima Expo.

| Servicio | Dirección |
| --- | --- |
| App web | `http://127.0.0.1:8081`, o la que imprima `npm run web` |
| Studio | `http://127.0.0.1:54323` |
| Bandeja de correo | `http://127.0.0.1:54324` |

La API sigue en `http://127.0.0.1:54321` y la base en `127.0.0.1:54322`. Si un puerto no responde, `npx supabase status` basta. No hace falta `supabase start` mientras esos contenedores sigan sanos.

## Recorrido manual

Hazlo en el navegador, con la app web. Anota el texto visible cuando un paso falle. No borres cuentas, no cambies contraseñas y no crees metas, compromisos ni movimientos ligados a una meta.

### 1. Cancún sin sesión

1. Cierra la sesión si hubiera una abierta.
2. En la pantalla inicial, el texto debe decir: «El recorrido de Cancún vive solo en este dispositivo. No inicia sesión y no se copia a una cuenta real.»
3. Entra a Inicio por **Comenzar**. Deben verse el viaje a Cancún y el aviso de la barra: «Demostración local. No se guarda en tu cuenta.»
4. Abre Movimientos, Registrar y Confirmar. Las cifras son las de la demostración.
5. Abre Categorías. Debe pedir entrar y decir que la demostración no guarda categorías.

### 2. Correo sin confirmar

1. En **Entrar a mi cuenta**, usa `hito5-sin-confirmar@example.com` con su contraseña actual.
2. El aviso esperado es «Confirma tu correo antes de entrar.»
3. La sesión no queda abierta. Inicio sigue en la demostración de Cancún y no muestra movimientos de Beto.

### 3. Inicio con la cuenta confirmada

1. Entra con `hito5-beto@example.com` y su contraseña actual.
2. Inicio debe decir que los números salen de la cuenta. El disponible, los ingresos y los gastos salen de sus registros. La cantidad para metas queda en cero.
3. La barra de Inicio, Movimientos, Registrar, Confirmar, Corregir y Categorías no muestra el aviso de demostración.
4. **Ver resumen mensual** dice que el resumen de la cuenta llega después y que esa pantalla no muestra cifras de la demostración. Ahí no aparecen `$8,450`, `$12,000`, `$5,000` ni «Viaje a Cancún».
5. Metas, Calendario, Presupuestos, Voz y Perfil siguen en la demostración y la barra los marca así. Vuelve a Inicio al terminar.

### 4. Categorías iniciales

En Categorías, con la sesión de Beto, el catálogo sembrado es este. Son 15 nombres.

Ingreso: Nómina, Honorarios, Ventas o negocio, Reembolso, Otro ingreso.

Gasto: Comida, Transporte, Vivienda, Servicios, Salud, Educación, Suscripciones, Entretenimiento, Personal, Otros.

### 5. Crear, renombrar, archivar, reactivar y eliminar

Usa un nombre nuevo, por ejemplo «Prueba 6C». No borres las 15 categorías sembradas.

1. Créala como gasto. El aviso de nombre repetido, si lo provocas con «comida», dice «Ya tienes una categoría con ese nombre.»
2. Renómbrala a «Prueba 6C bis» y comprueba el nombre nuevo.
3. Archívala. Debe decir que conserva su historial y que no aparece al crear movimientos.
4. Reactívala. Vuelve a poder elegirse al registrar un gasto.
5. Elimínala. Puede eliminarse porque no tiene movimientos, presupuestos ni compromisos.
6. Abre Comida, que ya puede tener historial o, si todavía no, créale después un gasto y vuelve aquí. Con historial, el texto dice «Tiene historial, así que no se puede eliminar.» Archivar y reactivar siguen disponibles.

### 6. Archivar y reactivar una cuenta

En Mi cuenta, con el correo confirmado:

1. Si efectivo, débito o ahorro todavía no existen, escribe un saldo inicial y pulsa **Guardar**. El aviso es «Perfil guardado.»
2. Pulsa **Archivar** en una cuenta que ya exista. El aviso dice que quedó archivada y que sus movimientos siguen en la lista.
3. En Registrar, esa cuenta no se ofrece para un movimiento nuevo. Si todas quedaron archivadas, el formulario dice que hay que reactivar una en Mi cuenta.
4. Vuelve a Mi cuenta y pulsa **Reactivar**. El aviso dice que volvió a estar activa y que su historial no cambió.
5. Registrar vuelve a ofrecerla.

### 7. Registrar un ingreso y un gasto

1. Registra un gasto de hoy, en `America/Mexico_City`, con cantidad mayor que cero, una categoría de gasto, una cuenta activa y una nota reconocible. La fecha usa `AAAA-MM-DD`. Hoy, en esta fecha de traspaso, es `2026-09-28`.
2. **Revisar gasto** lleva a Confirmar. **Confirmar y guardar** vuelve a Inicio.
3. Repite el camino con un ingreso y una categoría de ingreso.
4. En Movimientos, ambos aparecen en el mes de su fecha, el ingreso en verde y el gasto en coral, del más reciente al más antiguo.

### 8. Cantidad cero y fecha futura

En Registrar, antes de guardar:

1. Cantidad `$0.00`. El aviso es «La cantidad debe ser mayor que cero.»
2. Fecha `2026-09-29`, o cualquier día posterior a hoy en Ciudad de México. El aviso es «Un movimiento confirmado no puede tener fecha futura.»
3. Ninguno de los dos queda en la lista ni en Inicio.

### 9. Persistencia

1. Cierra la sesión.
2. La pantalla inicial vuelve a decir que el recorrido de Cancún vive solo en el dispositivo.
3. Entra otra vez como Beto.
4. El ingreso, el gasto, las categorías y la cuenta reactivada siguen. La demostración no los reemplazó.

### 10. Filtros y meses vacíos

En Movimientos:

1. **Ingresos** muestra el ingreso y oculta el gasto. **Gastos** hace lo contrario. **Todos** muestra ambos.
2. El filtro de categoría y la búsqueda por nota dejan ver solo lo que coincide.
3. Con un filtro que no coincide, el texto es «Ningún movimiento coincide con la búsqueda o el filtro.»
4. Cambia a un mes sin registros. El texto es «No hay movimientos en este mes.»

### 11. Editar

1. Abre el gasto creado en el paso 7.
2. Cambia la nota o la cantidad por otro valor mayor que cero y una fecha de hoy o anterior.
3. **Guardar corrección** vuelve a la lista con el dato nuevo.
4. Sal de la sesión, entra de nuevo y comprueba que el cambio sigue.

### 12. Eliminar, deshacer y confirmar la otra eliminación

Necesitas los dos movimientos del paso 7.

1. En el gasto, pulsa **Eliminar movimiento** y después **Eliminar**.
2. La lista lo oculta y muestra «Movimiento eliminado» y «Puedes deshacerlo durante unos segundos.»
3. Pulsa **Deshacer** antes de 5 segundos. El gasto vuelve y no se borra de la base.
4. Elimínalo otra vez. Antes de que pasen 5 segundos, elimina también el ingreso. El gasto queda borrado de verdad y el aviso de deshacer pasa al ingreso.
5. Espera 5 segundos sin pulsar **Deshacer**, o sal a Inicio. El ingreso también queda borrado.
6. Entra de nuevo a Movimientos. Ninguno de los dos reaparece.

El aviso de deshacer también se ve en Registrar, Confirmar, Corregir y Categorías. Salir de esas cinco pantallas confirma el borrado pendiente.

### 13. Gasto ligado a una meta

Las filas de desembolso de `supabase/tests/hito6_movements.test.sql` se revierten con la transacción. No son un dato local de Beto.

1. En Studio, revisa si algún movimiento de `hito5-beto@example.com` tiene `goal_disbursement_id`.
2. Si existe, ábrelo desde Movimientos. El título es «Pago de meta», el subtítulo dice «Solo lectura» y la pantalla explica que desde Movimientos no se edita ni se elimina. No hay campos ni botón de eliminar.
3. Si no existe, anótalo y sigue. No crees una meta ni un desembolso para fabricar el caso.

## Resultados automatizados

Quedaron así al aceptar 6B, el 28 de septiembre de 2026, después de las correcciones de la interfaz. No se repitieron en este traspaso.

`git diff --check` terminó con código 0. Git avisó que, en la próxima escritura, cambiará LF por CRLF en varios archivos ya modificados. Eso no es un fallo de `--check`.

`npm test` terminó con código 0.

```text
ℹ tests 73
ℹ suites 14
ℹ pass 73
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2078.2518
```

`npm run lint` terminó con código 0. `expo lint` no imprimió problemas.

`npm run typecheck` terminó con código 0. `tsc --noEmit` no imprimió errores.

`npx expo-doctor` terminó con código 0. Pasó 21 de 21 comprobaciones.

`npx supabase test db` terminó con código 0.

```text
/Users/samGD/OneDrive/Documentos/Proyectos P/Ahorruta/supabase/tests/hito5_isolation.test.sql .. ok
/Users/samGD/OneDrive/Documentos/Proyectos P/Ahorruta/supabase/tests/hito6_movements.test.sql .. ok
All tests successful.
Files=2, Tests=123,  2 wallclock secs ( 0.14 usr  0.09 sys +  0.10 cusr  0.10 csys = 0.43 CPU)
Result: PASS
```

En los comandos de npm apareció el aviso `Unknown env config "devdir"`. No cambió estos códigos de salida.

## Cierre después de la validación

1. Anota el resultado de cada paso, con el texto visible si algo falla.
2. Si un paso falla por la interfaz o por su integración con los repositorios, corrige solo ese defecto. Repite el paso y, si el código cambió, vuelve a ejecutar `git diff --check`, `npm test`, `npm run lint`, `npm run typecheck`, `npx expo-doctor` y `npx supabase test db`.
3. Conserva a `hito5-beto@example.com` y a `hito5-sin-confirmar@example.com`. No cambies sus contraseñas.
4. No uses `db reset`, no crees un proyecto remoto y no avances a compromisos, metas persistidas ni al Hito 7.
5. Con el recorrido anotado, deja el Hito 6 sin marcar como aprobado. El commit espera a que se pida.

## Mensaje para el siguiente chat

```text
Lee docs/ahorruta-handoff-hito-6c.md y el recorrido que describe.
6A y 6B están aceptados. El Hito 6 completo no está aprobado. HEAD sigue en fa1e238 y no hay commit.
Haz solo la validación manual en el navegador. No cambies código salvo un defecto que veas en ese recorrido.
No uses db reset. No borres ni cambies la contraseña de hito5-beto@example.com ni de hito5-sin-confirmar@example.com.
No crees metas ni desembolsos para fabricar el caso de solo lectura.
No marques el Hito 6 como aprobado y no hagas commit hasta que se pida.
```
