# Ahorruta — Traspaso para iniciar el Hito 5

Fecha del traspaso: 27 de septiembre de 2026

## Estado aprobado

- Hito 1 aprobado: caparazón visual navegable en Expo, React Native, TypeScript y Expo Router.
- Hito 2 aprobado: dinero en centavos enteros y fechas civiles.
- Hito 3 aprobado: saldos, presupuestos y viabilidad.
- Hito 4 aprobado: metas, reservas, hitos, desembolsos, reajustes e historial observado.
- La interfaz todavía utiliza datos simulados y estado local.
- No se ha iniciado el Hito 5.

## Verificación más reciente

- `npm test`: 47 pruebas aprobadas.
- `npm run lint`: sin errores.
- `npm run typecheck`: sin errores.
- Los casos adicionales de hitos con la misma fecha, reducción incompatible, fechas fuera de la meta y meses completos vacíos también fueron verificados.

## Fuente de verdad

Leer antes de proponer o realizar cambios:

1. `docs/ahorruta-decisions-v1.md`
2. `docs/ahorruta-product-spec.md`
3. `docs/ahorruta-cursor-handoff.md`
4. `README.md`

Cuando exista una contradicción, `docs/ahorruta-decisions-v1.md` prevalece.

## Motores existentes

- `src/money.ts`: cantidades en centavos enteros.
- `src/dates.ts`: fechas civiles y frecuencias.
- `src/ledger.ts`: saldos, presupuestos y viabilidad.
- `src/goals.ts`: metas, reservas, hitos, aportaciones, desembolsos y reajustes.
- `src/observed.ts`: promedios de meses calendario completos.

Las pruebas correspondientes están junto a cada módulo.

## Decisiones importantes ya aprobadas

- Solo existen cuentas de efectivo, débito y ahorro.
- No hay tarjetas de crédito ni transferencias en el MVP.
- `disponible = saldo total de cuentas activas - reserva total`.
- Una aportación reserva dinero; no es ingreso ni gasto.
- Un desembolso reduce saldo y reserva por la misma cantidad cubierta.
- Si falta reserva, se solicita autorización y se crea una aportación inmediata por la parte no cubierta.
- La reserva nunca queda negativa; el disponible sí puede quedar negativo con advertencia.
- Un pago que supera el pendiente del hito requiere aumentar el hito o separar el excedente como gasto ordinario.
- Los compromisos pendientes no afectan saldos hasta confirmarse.
- Los promedios observados usan meses calendario completos desde el inicio del seguimiento y no reemplazan la configuración declarada.
- La viabilidad es informativa y no impide crear una meta.

## Siguiente fase

Hito 5: cuenta, persistencia y aislamiento.

Antes de implementar, preparar y revisar un plan para:

- Autenticación.
- Esquema de Supabase y migraciones.
- Propiedad de datos por usuario.
- Row Level Security para todas las tablas financieras.
- Manejo seguro de claves y variables de entorno.
- Eliminación definitiva de cuenta con confirmación reforzada.
- Adaptación futura de los motores puros a repositorios persistentes.
- Pruebas de aislamiento entre dos usuarios.

No instalar dependencias, crear el proyecto remoto de Supabase ni escribir migraciones hasta que el plan del Hito 5 sea aprobado.

## Mensaje inicial recomendado para el chat nuevo

Lee `docs/ahorruta-chat-handoff-hito-5.md` y todos los documentos que señala. Revisa también el código y las pruebas existentes. Estamos por comenzar el Hito 5, pero primero necesito un plan técnico de autenticación, persistencia y Row Level Security. No escribas código, no instales dependencias y no crees servicios externos todavía. Señala las decisiones que requieran mi aprobación y detente después del plan.
