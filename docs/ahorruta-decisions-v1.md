# Ahorruta — Decisiones aprobadas para el MVP

Estado: aprobadas para iniciar el Hito 1  
Fecha: 27 de septiembre de 2026

Este documento prevalece cuando exista una contradicción con cifras ilustrativas o reglas anteriores del prototipo.

## Disponible y cuentas

- `saldo de cuenta = saldo inicial + ingresos - gastos`
- `saldo total = suma de cuentas activas`
- `reserva total = suma de la reserva actual de todas las metas`
- `disponible estimado = saldo total - reserva total`
- Ingresos, gastos y aportaciones del mes se muestran como flujos separados.
- El anillo de 70% no forma parte del MVP.
- Las cuentas iniciales son efectivo, débito y ahorro.
- Las transferencias y las tarjetas de crédito quedan fuera del MVP.

## Metas, reservas y pagos

- Una aportación reserva dinero para una meta; no es ingreso, gasto ni transferencia.
- El ahorro inicial y las aportaciones aumentan la reserva.
- Un desembolso es un gasto vinculado con una meta y uno de sus hitos.
- El desembolso disminuye el saldo de la cuenta y la reserva por la misma cantidad.
- El disponible no se descuenta dos veces.
- El progreso incluye lo reservado actualmente y lo ya utilizado para pagar hitos.

Invariantes:

- `reserva = ahorro inicial + aportaciones + aportaciones inmediatas - desembolsos`
- `utilizado = desembolsos`
- `progreso = reserva + utilizado`
- `pendiente = máximo(0, objetivo - progreso)`
- `0 <= reserva <= progreso`
- Una aportación mantiene el saldo, aumenta reserva y progreso, y reduce disponible.
- Un gasto ordinario reduce saldo y disponible; no modifica reserva.
- Un desembolso reduce saldo y reserva por igual; mantiene disponible y progreso.
- Un hito puede recibir varios desembolsos.
- Si un pago supera el importe pendiente del hito, hay que elegir entre aumentar el hito o separar el excedente como gasto ordinario.

El modelo debe contemplar:

- Ahorro inicial de la meta.
- Aportaciones.
- Hitos o pagos parciales.
- Desembolsos vinculados con un hito.
- Versiones confirmadas del plan.
- Entradas del calendario generadas por el motor.

Las cifras `$1,250`, `$1,375` y `$28,750` de las referencias visuales son ilustrativas. El motor determina los resultados reales.

## Fechas y frecuencias

- Zona inicial: `America/Mexico_City`.
- Una fecha que cae hoy permanece disponible hasta terminar el día local.
- Semanal: día de la semana elegido por el usuario.
- Quincena de calendario: día 15 y último día del mes.
- Cada 14 días: primera fecha elegida más periodos civiles de 14 días.
- Mensual: mismo día del mes o último día disponible.
- Los centavos sobrantes se reparten empezando por las fechas más próximas.
- La fecha del ejemplo de Cancún es 30 de mayo de 2027.
- La interfaz muestra la próxima aportación real y explica cuándo las etapas futuras tienen cantidades diferentes.

## Reajustes

- Aumentar aportaciones: conservar objetivo y fecha, y redistribuir entre fechas restantes.
- Mover fecha: proponer la primera fecha que permita mantener la aportación anterior.
- Reducir presupuesto: calcular el máximo alcanzable manteniendo fecha y aportación.
- Simular no modifica el plan.
- Solo confirmar crea una nueva versión.
- Decidir después conserva la versión vigente.

## Movimientos y recurrentes

- Los tipos de movimiento son ingreso y gasto.
- Las aportaciones se registran desde la meta.
- La cuenta predeterminada es la última utilizada; en el primer registro se elige una.
- Deshacer permanece visible 5 segundos. El borrado en la base espera ese plazo o a que la persona salga de Movimientos. Si la aplicación se cierra antes, el movimiento sigue.
- Un ingreso y un gasto requieren categoría.
- Un movimiento confirmado no puede tener una fecha posterior a hoy en `America/Mexico_City`. Los compromisos futuros pertenecen al Hito 7.
- La nota admite hasta 280 caracteres.
- Las categorías y las cuentas pueden archivarse y reactivarse. Archivar no elimina movimientos ni otro historial.
- La lista de movimientos va de lo más reciente a lo más antiguo.
- Un movimiento ligado a una meta no se edita ni se elimina desde Movimientos.
- La demostración de Cancún permanece separada de la cuenta.
- El catálogo inicial de ingreso es Nómina, Honorarios, Ventas o negocio, Reembolso y Otro ingreso.
- El catálogo inicial de gasto es Comida, Transporte, Vivienda, Servicios, Salud, Educación, Suscripciones, Entretenimiento, Personal y Otros.
- Una categoría puede crearse, renombrarse, archivarse y reactivarse.
- Una categoría sin referencias puede eliminarse. Una categoría ya utilizada solo puede archivarse.
- Los nombres de categoría no se duplican dentro del mismo tipo, ignorando mayúsculas y espacios exteriores. Un nombre archivado sigue ocupado.
- Suscripciones, renta y otros recurrentes son compromisos pendientes.
- Un compromiso solo crea un gasto cuando la persona lo confirma.
- El avatar abre Perfil.
- El resumen mensual tiene acceso propio desde Inicio.

## Viabilidad

Antes de existir historial:

`capacidad = ingreso esperado - gasto total estimado - aportaciones de otras metas`

- Las suscripciones detallan el gasto estimado, pero no se vuelven a restar.
- Con al menos un mes completo, el promedio observado se muestra como estimación alternativa.
- La viabilidad es informativa y no impide crear la meta.

## Pago superior a la reserva

- La reserva nunca puede quedar negativa.
- Si un desembolso supera la reserva, se calcula la cantidad no cubierta.
- Antes de confirmarlo se debe advertir y solicitar autorización para utilizar el disponible.
- Al confirmarlo, la cantidad no cubierta se registra como una aportación inmediata y luego se realiza el desembolso.
- Si el disponible no alcanza, el pago puede registrarse porque representa algo que realmente ocurrió, pero el disponible proyectado queda negativo y se genera una advertencia.
- Si el pago supera el importe pendiente del hito, debe elegirse entre aumentar el hito o separar el excedente como gasto ordinario.

## Historial observado

- Solo se consideran meses calendario completos.
- Un mes parcial no participa en el promedio.
- Después del primer mes completo se puede mostrar una estimación provisional.
- Debe indicarse cuántos meses completos fueron utilizados.
- La estimación observada no reemplaza automáticamente la configuración declarada.
- La viabilidad continúa siendo informativa y nunca bloquea una meta.

## Seguridad y privacidad

- La primera versión con datos reales exige cuenta.
- El MVP utiliza únicamente MXN.
- Row Level Security protege todas las tablas financieras.
- Las claves privadas viven únicamente en funciones seguras del servidor.
- ElevenLabs, Zavu y n8n no calculan saldos ni aportaciones.
- El audio se elimina al terminar la transcripción.
- Borrar una cuenta es definitivo y requiere confirmación reforzada.
- La exportación queda fuera del primer núcleo.

## Hitos

1. Cascarón visual con datos ficticios.
2. Dinero y fechas.
3. Saldos y presupuestos.
4. Motor de metas, reservas y desembolsos.
5. Cuenta, persistencia y aislamiento.
6. Movimientos reales.
7. Compromisos, calendario y resumen.
8. Metas persistidas.
9. Voz.
10. n8n y Zavu.
11. Cierre del MVP.

Cada hito requiere aprobación independiente.

## Decisiones todavía diferidas

No bloquean el Hito 4:

- Antes del Hito 10: decidir dónde se alojará n8n.
