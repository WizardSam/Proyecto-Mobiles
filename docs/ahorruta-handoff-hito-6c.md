# Ahorruta — Traspaso del Subhito 6C

Fecha original: 28 de septiembre de 2026
Validación manual actualizada: 30 de septiembre de 2026

Los Subhitos 6A, 6B y 6C quedan aceptados. El recorrido manual se completó con las salvedades documentadas abajo. El Hito 6 completo queda aprobado por el usuario el 30 de septiembre de 2026.

El repositorio cambió durante la validación. El cierre parte de `0caa71d` (`0caa71d2885fa654077ff34a18bb8c0fa0c323f8`), rama `main`, alineada entonces con `origin/main`. El Hito 6 entró al historial en `3d145a6` (`Avanza el Hito 6 con movimientos reales y el catálogo de categorías por usuario`). La corrección final de `components/account/confirm.tsx`, esta actualización del traspaso y el estado del README forman el cierre aprobado.

## Resultado del recorrido manual

La validación se hizo en `http://localhost:8082` con `hito6-valida@example.com`, creada y confirmada solo para este recorrido. Su contraseña no está escrita en el repositorio ni en este documento. Los usuarios protegidos `hito5-beto@example.com` y `hito5-sin-confirmar@example.com` no se modificaron.

Pasaron estas comprobaciones:

- La demostración de Cancún permanece separada y marcada como local.
- La cuenta confirmada conserva nombre, configuración, saldos y última cuenta utilizada.
- Se sembraron exactamente 5 categorías de ingreso y 10 de gasto.
- Crear, renombrar, archivar, reactivar y eliminar una categoría sin historial funcionó.
- Una categoría con historial mostró «Tiene historial, así que no se puede eliminar.» y no presentó el botón Eliminar.
- Archivar Ahorro lo quitó de Registrar; reactivarlo lo devolvió.
- Se registraron un gasto y un ingreso reales. Inicio, Movimientos, colores, orden y saldo respondieron a ambos.
- Cantidad cero y fecha futura se rechazaron con los textos aprobados.
- Cerrar sesión y volver a entrar conservó movimientos, cuentas, categorías y una corrección de importe.
- Filtros por tipo, búsqueda, estado sin coincidencias y mes vacío funcionaron.
- Editar un gasto de 350 a 400 pesos persistió después de volver a entrar.
- Deshacer antes de 5 segundos restauró el gasto. Dejar vencer el plazo lo borró. El aviso también apareció en Registrar y salir a Inicio confirmó el borrado pendiente.
- El resumen de la cuenta no mostró cifras de Cancún. Metas y Calendario siguieron marcadas como demostración.
- No había movimientos con `goal_disbursement_id` ni para Beto ni para la cuenta de validación. La prueba manual de «Pago de meta» quedó no aplicable; no se fabricaron metas ni desembolsos.

No se repitió el acceso del correo sin confirmar porque no estaba disponible su contraseña y el traspaso prohíbe cambiarla. Las pruebas SQL siguen cubriendo ese aislamiento. Tampoco se provocó manualmente el nombre de categoría duplicado. La secuencia exacta de reemplazar un borrado pendiente con un segundo borrado queda cubierta por las pruebas automatizadas.

Al terminar, los dos movimientos de prueba y la categoría temporal ya estaban eliminados. `hito6-valida@example.com` conserva Efectivo en 0, Débito en 5,000 como predeterminada y Ahorro en 0, las tres activas, además del catálogo inicial de 15 categorías.

## Defectos encontrados y corregidos durante 6C

- La barra inferior agrupaba los iconos a la derecha. Ahora distribuye las cuatro pestañas en una fila completa.
- La configuración local no permitía los retornos de autenticación del puerto 8082. `supabase/config.toml` incluye confirmación y recuperación para `localhost` y `127.0.0.1` en ese puerto.
- Los campos dentro de tarjetas blancas no se distinguían. Los campos compartidos tienen borde visible.
- El navegador colocó el correo en el saldo de Ahorro. Los campos financieros y de categorías desactivan ese autocompletado.
- Mi cuenta escribía Efectivo y Débito antes de descubrir un saldo posterior inválido. Ahora valida todos los saldos antes de escribir cualquiera y da un mensaje que identifica la cuenta.
- Los intentos fallidos anteriores habían creado cinco copias sin movimientos solo en `hito6-valida@example.com`. Se conservaron las tres cuentas correctas y se eliminaron, con autorización, dos Efectivos y tres Débitos sobrantes. No se tocó otro usuario.
- Confirmar conservaba el indicador interno de «ya guardado» al iniciar un segundo movimiento y omitía el ingreso. Ahora la protección contra doble guardado queda ligada a la revisión del borrador; gasto e ingreso consecutivos se persisten por separado. Esta corrección está en `components/account/confirm.tsx` y forma parte del cierre aprobado.

## Verificación posterior a las correcciones

| Comprobación | Resultado |
| --- | --- |
| `git diff --check` | Código 0 |
| `npm test` | 73 pruebas, 0 fallos |
| `npm run lint` | Código 0 |
| `npm run typecheck` | Código 0 |
| `npx supabase test db` | 123 pruebas, PASS |
| `npx expo-doctor` | 20/21; solo pide los parches `expo` 57.0.26, `expo-constants` 57.0.20 y `expo-router` 57.0.24 |

No se actualizaron dependencias durante 6C. Esa actualización debe decidirse aparte. Supabase local volvió a quedar saludable después de reabrir Docker Desktop, y Expo quedó servido en el puerto 8082 con apertura automática del navegador desactivada para esta sesión.

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

1. El Hito 6 queda aprobado con el recorrido y las salvedades de este documento.
2. Conserva a `hito5-beto@example.com`, `hito5-sin-confirmar@example.com` y `hito6-valida@example.com`. No cambies sus contraseñas.
3. No uses `db reset` y no crees un proyecto remoto de Supabase sin una decisión nueva.
4. Las actualizaciones de parche sugeridas por Expo Doctor se aplazaron de forma explícita y no bloquean este cierre.
5. No avances a compromisos, metas persistidas ni al Hito 7 sin un plan y una aprobación independientes.

## Mensaje para el siguiente chat

```text
Lee docs/ahorruta-handoff-hito-6c.md y el recorrido que describe.
6A, 6B y 6C están aceptados. El Hito 6 completo está aprobado y su validación manual ya terminó.
Parte del cierre de Hito 6 y prepara un plan separado antes de cualquier Hito 7.
No uses db reset. No borres ni cambies la contraseña de hito5-beto@example.com, hito5-sin-confirmar@example.com ni hito6-valida@example.com.
No crees metas ni desembolsos para fabricar el caso de solo lectura.
Las actualizaciones de parche de Expo quedaron aplazadas; no las mezcles con otro hito sin una decisión nueva.
```
