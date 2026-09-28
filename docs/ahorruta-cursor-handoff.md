# Ahorruta — Paquete de entrega para Cursor

Estado: listo para planificación, no para implementación automática  
Fecha: 27 de septiembre de 2026

## 1. Objetivo de este paquete

Este documento permite entregar Ahorruta a Cursor sin perder el alcance aprobado. La primera sesión debe producir únicamente un plan revisable. No debe crear el proyecto, instalar dependencias, escribir código ni modificar archivos.

Documento funcional principal:

- `docs/ahorruta-product-spec.md`
- `docs/ahorruta-decisions-v1.md`

Referencias visuales:

- `docs/ahorruta-assets/visual-01-onboarding-home-goal.png`
- `docs/ahorruta-assets/visual-02-movements-goals.png`
- `docs/ahorruta-assets/visual-03-goal-calendar-adjustment.png`
- `docs/ahorruta-assets/visual-04-subscriptions-voice-summary.png`

Prototipos navegables:

- `prototype/ahorruta-clickable-prototype.html`
- `prototype/ahorruta-navigation-map.html`

## 2. Regla de ubicación

La carpeta actual ya es el espacio independiente de Ahorruta. Durante la fase de planificación contiene solamente documentación, referencias visuales y prototipos.

Cuando se autorice la implementación, el código de la aplicación podrá crearse en esta misma carpeta, pero nunca antes de aprobar el plan técnico y el primer hito.

## 3. Tecnología recomendada

### Aplicación móvil

- Expo y React Native.
- TypeScript con configuración estricta.
- Expo Router para navegación basada en archivos.
- Android e iOS desde una base compartida.
- Expo Go durante las primeras etapas; development build cuando las integraciones nativas lo requieran.

Motivo: Expo Router está diseñado para aplicaciones universales de React Native y permite una estructura de navegación fácil de relacionar con las pantallas del prototipo.

Documentación oficial:

- https://docs.expo.dev/router/introduction/

### Datos y autenticación

- Supabase Auth.
- PostgreSQL de Supabase.
- Row Level Security habilitado en todas las tablas expuestas.
- Cada registro financiero debe pertenecer explícitamente a un usuario.
- Ninguna clave privada puede incluirse en la aplicación móvil.

Documentación oficial:

- https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/database/postgres/row-level-security

### Automatización e integraciones

- n8n: recordatorios, eventos y coordinación entre servicios.
- Zavu: WhatsApp y otros canales de mensajería.
- ElevenLabs: transcripción y respuesta por voz.
- Función segura del servidor: protege las claves de Zavu, ElevenLabs y n8n.

n8n no calcula metas, saldos ni aportaciones. Su responsabilidad es transportar eventos y ejecutar automatizaciones externas.

### Motor financiero

Crear un módulo independiente de funciones puras y deterministas para:

- Saldos administrativos.
- Presupuestos.
- Fechas de aportación.
- Metas sencillas.
- Metas con pagos parciales.
- Aportaciones omitidas.
- Simulación de cambios.
- Viabilidad administrativa.

Este módulo no debe depender de componentes visuales, Supabase, n8n ni modelos de IA. Cada regla requiere pruebas automatizadas antes de conectarse a la interfaz.

## 4. Arquitectura conceptual

```text
Aplicación Expo
├── Interfaz y navegación
├── Estado de sesión
├── Casos de uso
└── Motor financiero determinista
        │
        ├── Supabase Auth
        ├── PostgreSQL + RLS
        └── Funciones seguras del servidor
                 │
                 ├── n8n
                 ├── Zavu
                 └── ElevenLabs
```

Reglas:

- La interfaz nunca contiene fórmulas financieras duplicadas.
- El motor financiero es la única fuente de resultados matemáticos.
- La IA convierte lenguaje natural en datos estructurados.
- Los datos estructurados se validan antes de llegar al motor.
- Ningún movimiento interpretado por IA se guarda sin confirmación.
- Las integraciones externas nunca reciben más información de la necesaria.

## 5. Modelo de datos conceptual

El esquema definitivo debe diseñarse después de revisar los recorridos, pero debe contemplar como mínimo:

### profiles

- `id`
- `user_id`
- `display_name`
- `currency`
- `timezone`
- `income_frequency`
- `fortnight_mode`

### accounts

- `id`
- `user_id`
- `name`
- `type`
- `opening_balance`
- `is_archived`

### categories

- `id`
- `user_id`
- `name`
- `kind`
- `icon`
- `color_token`

### transactions

- `id`
- `user_id`
- `account_id`
- `category_id`
- `type`
- `amount`
- `occurred_on`
- `note`
- `source`
- `status`

### budgets

- `id`
- `user_id`
- `category_id`
- `period_start`
- `period_end`
- `limit_amount`

### subscriptions

- `id`
- `user_id`
- `name`
- `amount`
- `frequency`
- `next_charge_on`
- `category_id`
- `is_active`

### goals

- `id`
- `user_id`
- `name`
- `target_amount`
- `saved_amount`
- `target_date`
- `contribution_frequency`
- `status`

### goal_milestones

- `id`
- `goal_id`
- `name`
- `amount`
- `due_on`
- `position`

### goal_contributions

- `id`
- `goal_id`
- `amount`
- `contributed_on`
- `source`

### reminders

- `id`
- `user_id`
- `entity_type`
- `entity_id`
- `scheduled_for`
- `channel`
- `status`

Todas las cantidades monetarias deben almacenarse de manera que se eviten errores de coma flotante. Cursor debe proponer y justificar la estrategia exacta antes de implementarla.

## 6. Orden recomendado de construcción

### Etapa 0 — Planificación

Entregables:

- Inventario de requisitos.
- Decisiones abiertas.
- Arquitectura propuesta.
- Mapa de rutas.
- Modelo de datos.
- Plan de pruebas.
- Riesgos.
- Hitos pequeños y verificables.

No escribir código.

### Etapa 1 — Aplicación visual con datos ficticios

- Proyecto independiente.
- Tema visual de Ahorruta.
- Navegación inferior.
- Pantallas aprobadas.
- Datos ficticios del viaje a Cancún.
- Recorrido visual completo.

No conectar Supabase ni servicios externos todavía.

### Etapa 2 — Motor financiero

- Definir cantidades monetarias y fechas.
- Implementar funciones puras.
- Probar metas sencillas y pagos parciales.
- Probar aportaciones omitidas.
- Probar semanas, quincenas y meses.
- Probar zonas horarias y cierres de mes.

No continuar si las pruebas fallan.

### Etapa 3 — Persistencia y autenticación

- Supabase Auth.
- Migraciones de base de datos.
- RLS por usuario.
- Operaciones de lectura y escritura.
- Eliminación y exportación de datos.

### Etapa 4 — Funciones principales

- Movimientos.
- Cuentas administrativas.
- Categorías.
- Presupuestos.
- Suscripciones.
- Calendario.
- Resumen mensual.

### Etapa 5 — Metas

- Crear y editar metas.
- Pagos parciales.
- Registrar aportaciones.
- Recalcular rutas.
- Simular cambios.
- Confirmar reajustes.

### Etapa 6 — Voz

- Permiso de micrófono.
- Transcripción.
- Datos estructurados.
- Pantalla de confirmación.
- Corrección de datos ambiguos.
- Protección de claves en servidor.

### Etapa 7 — Zavu y n8n

- Entorno de prueba.
- Mensajes ficticios.
- Recordatorios.
- Registro por WhatsApp con confirmación.
- Idempotencia para impedir movimientos duplicados.
- Registro de errores y reintentos.

### Etapa 8 — Verificación

- Accesibilidad.
- Privacidad.
- Pruebas de navegación.
- Pruebas del motor financiero.
- Pruebas con conexión inestable.
- Revisión de textos.
- Validación en Android e iOS.

## 7. Condiciones obligatorias para Cursor

Cursor no puede:

- Agregar conexiones bancarias.
- Agregar inversiones, créditos o préstamos.
- Cambiar el alcance sin señalarlo.
- Usar IA para hacer cálculos monetarios.
- Colocar claves privadas en código móvil.
- Crear todo el producto en una sola etapa.
- Instalar dependencias sin explicar su necesidad.
- Avanzar a otra etapa con verificaciones fallidas.
- Reemplazar el diseño aprobado por una plantilla genérica.
- Comenzar a implementar dentro de esta carpeta antes de aprobar el plan técnico.

Cursor debe:

- Mantener cambios pequeños y revisables.
- Explicar decisiones importantes en lenguaje sencillo.
- Presentar alternativas cuando exista una decisión real.
- Probar cada regla monetaria.
- Usar datos ficticios durante el desarrollo.
- Esperar aprobación entre etapas.
- Actualizar la documentación conforme se tomen decisiones.

## 8. Criterios de aceptación por hito

Cada hito debe indicar:

1. Qué comportamiento entrega.
2. Qué archivos modificaría.
3. Qué pruebas lo verifican.
4. Qué se puede revisar visualmente.
5. Qué riesgos permanecen.
6. Qué no incluye todavía.

Un hito no está completo solamente porque la aplicación compile.

## 9. Prompt inicial para Cursor

Abrir Cursor en **Ask**, que es el modo de lectura y planificación sin cambios automáticos. Después pegar el siguiente prompt:

```text
Estamos preparando Ahorruta, una aplicación móvil administrativa de finanzas personales. En esta sesión debes trabajar únicamente como arquitecto de producto y software.

NO escribas código.
NO crees, edites ni elimines archivos.
NO ejecutes instalaciones.
NO inicialices un proyecto.
NO modifiques ningún archivo durante esta sesión de planificación.

Lee completamente estos documentos y referencias:

- docs/ahorruta-product-spec.md
- docs/ahorruta-cursor-handoff.md
- docs/ahorruta-assets/visual-01-onboarding-home-goal.png
- docs/ahorruta-assets/visual-02-movements-goals.png
- docs/ahorruta-assets/visual-03-goal-calendar-adjustment.png
- docs/ahorruta-assets/visual-04-subscriptions-voice-summary.png

La carpeta actual es el espacio independiente de Ahorruta. Por ahora contiene únicamente documentación, referencias visuales y prototipos. No empieces a implementar hasta recibir autorización explícita.

Tecnología propuesta, todavía sujeta a revisión:

- Expo + React Native + TypeScript.
- Expo Router.
- Supabase Auth + PostgreSQL + Row Level Security.
- Motor financiero determinista e independiente.
- n8n para automatizaciones externas.
- Zavu para mensajería.
- ElevenLabs para voz.

Entrega exclusivamente un plan que contenga:

1. Resumen de tu comprensión del producto.
2. Contradicciones o decisiones pendientes.
3. Arquitectura recomendada y responsabilidades de cada capa.
4. Mapa propuesto de rutas y pantallas.
5. Modelo de datos conceptual con relaciones.
6. Diseño del motor financiero y límites de la IA.
7. Estrategia de seguridad y Row Level Security.
8. Estrategia para proteger claves de servicios externos.
9. Plan de pruebas, especialmente para dinero, fechas y quincenas.
10. Hitos pequeños con criterios de aceptación.
11. Riesgos técnicos y de producto.
12. Preguntas que debo responder antes de implementar.

No asumas que una recomendación está aprobada. Señala claramente cada decisión que requiera confirmación. Termina el plan y espera mi autorización. No escribas código después del plan.
```

## 10. Qué debe hacer el usuario

1. Abrir este repositorio en Cursor solamente para que lea la documentación.
2. Elegir modo Ask.
3. Pegar el prompt anterior.
4. Revisar las preguntas y decisiones pendientes.
5. No aceptar todavía creación de archivos o instalaciones.
6. Traer el plan resultante a Codex para una segunda revisión.
7. Solo después de aprobarlo, crear un repositorio independiente para Ahorruta.

## 11. Primera decisión antes de programar

Antes de autorizar la implementación debe elegirse una estrategia:

- **Cuenta obligatoria desde el inicio:** facilita sincronización y WhatsApp, pero añade fricción.
- **Modo local primero y cuenta opcional:** facilita probar la app, pero complica sincronización posterior.

Recomendación provisional: prototipo técnico con datos ficticios y sin cuenta; primera versión funcional con cuenta, sincronización y RLS antes de introducir Zavu o WhatsApp.
