# Ahorruta — Documento maestro del prototipo

> Nota: `docs/ahorruta-decisions-v1.md` contiene las decisiones posteriores aprobadas y prevalece cuando exista una contradicción con cifras ilustrativas o reglas de este documento.

Estado: prototipo visual validado  
Versión: 1.0  
Fecha: 27 de septiembre de 2026

## 1. Visión

Ahorruta es una aplicación móvil administrativa para organizar dinero sin conectar cuentas bancarias. Permite registrar ingresos, gastos y suscripciones, crear presupuestos y transformar metas personales en planes de ahorro semanales, quincenales o mensuales.

La experiencia debe sentirse como **un Excel inteligente sin las complicaciones de Excel**.

Propuesta de valor:

> Ahorruta convierte lo que quieres lograr en una ruta clara de aportaciones, fechas y próximos pasos.

Eslogan provisional:

> Tu dinero, con destino.

## 2. Principios del producto

1. No se conectan cuentas bancarias.
2. La aplicación no mueve, retiene ni invierte dinero.
3. Toda cifra depende de información introducida por el usuario.
4. Los cálculos monetarios son deterministas, visibles y explicables.
5. La IA puede interpretar lenguaje o voz, pero no decide los resultados matemáticos.
6. La aplicación confirma los datos antes de registrar información ambigua.
7. El lenguaje es sencillo, neutral y sin regaños.
8. Cualquier reajuste requiere confirmación del usuario.

## 3. Usuario inicial

Personas adultas de habla hispana que reciben ingresos semanales, quincenales o mensuales y quieren organizarse sin utilizar hojas de cálculo.

Configuración inicial del prototipo:

- Idioma: español de México.
- Moneda: pesos mexicanos (MXN).
- Zona horaria: America/Mexico_City.
- Formato de cantidades: `$12,500.00`.
- La persona puede elegir si una quincena significa días 15 y último día del mes o periodos consecutivos de 14 días.

## 4. Alcance del MVP

### Incluido

- Registro manual de ingresos y gastos.
- Cuentas administrativas: efectivo, débito, crédito y ahorro.
- Categorías personalizables.
- Presupuesto mensual por categoría.
- Suscripciones y movimientos recurrentes.
- Metas de ahorro con fecha límite.
- Pagos parciales dentro de una meta.
- Aportaciones semanales, quincenales o mensuales.
- Reajuste de una meta cuando se omite una aportación.
- Calendario de pagos, suscripciones y aportaciones.
- Registro por texto o voz con confirmación.
- Resumen mensual.
- Exportación de datos para una versión posterior del MVP, si el tiempo lo permite.

### Fuera de alcance

- Conexiones bancarias.
- Transferencias o pagos.
- Inversiones, créditos o préstamos.
- Compra o venta de productos financieros.
- Asesoría fiscal, legal o de inversión.
- Sincronización automática con tarjetas.
- Cancelación automática de suscripciones.
- Recomendaciones que prometan rendimientos.
- Funciones sociales o comparación entre usuarios.

## 5. Navegación principal

La barra inferior contiene:

1. Inicio.
2. Movimientos.
3. Metas.
4. Calendario.

El perfil y la configuración se abren desde el avatar de Inicio.

## 6. Pantallas aprobadas

### 6.1 Bienvenida

- Logotipo Ahorruta.
- Mensaje: “Tu dinero, con destino”.
- Explicación breve.
- Indicador “Sin conectar tu banco”.
- Botón “Comenzar”.

### 6.2 Configuración inicial

- Moneda.
- Frecuencia y fechas habituales de ingreso.
- Ingreso aproximado.
- Gastos fijos aproximados.
- Saldos administrativos iniciales, opcionales.
- Opción para omitir y completar después.

### 6.3 Inicio

- Disponible estimado.
- Ingresos del periodo.
- Gastos del periodo.
- Cantidad destinada a metas.
- Próximo compromiso.
- Aportación siguiente.
- Botón “Registrar movimiento”.

La pantalla debe aclarar que el disponible es una estimación basada en los datos registrados.

### 6.4 Registrar movimiento

- Tipo: ingreso o gasto.
- Cantidad.
- Categoría.
- Fecha.
- Cuenta administrativa.
- Nota opcional.
- Entrada mediante voz.
- Confirmación antes de guardar cuando exista ambigüedad.

### 6.5 Movimientos

- Resumen mensual de ingresos y gastos.
- Lista cronológica.
- Filtros por tipo, categoría y fecha.
- Edición y eliminación con confirmación.

### 6.6 Suscripciones

- Total mensual estimado.
- Nombre, cantidad, frecuencia y siguiente cobro.
- Próximos cobros.
- Enlace al calendario.
- La aplicación no cancela servicios.

### 6.7 Presupuestos

- Límite por categoría.
- Cantidad utilizada y restante.
- Alertas al alcanzar 80% y 100%.
- Mensajes informativos, nunca culpabilizantes.

### 6.8 Lista de metas

- Nombre e imagen o icono.
- Cantidad actual y cantidad objetivo.
- Porcentaje de progreso.
- Próxima aportación.
- Estado: en ruta, adelantada, atrasada o necesita ajustes.

### 6.9 Crear meta

- Nombre.
- Cantidad total.
- Cantidad ya ahorrada.
- Fecha límite.
- Frecuencia de aportación.
- Pagos parciales opcionales.
- Vista previa antes de confirmar.

### 6.10 Detalle de meta

- Progreso total.
- Próxima aportación.
- Cronología de pagos parciales.
- Historial de aportaciones.
- Botón “Registrar aportación”.
- Opción “Simular cambios”.

### 6.11 Reajustar ruta

Cuando se omite una aportación, se presentan alternativas:

- Aumentar próximas aportaciones.
- Mover la fecha de la meta.
- Reducir el presupuesto total.
- Decidir después.

Ningún cambio se aplica sin confirmación.

### 6.12 Calendario

- Aportaciones.
- Pagos parciales.
- Suscripciones.
- Gastos e ingresos recurrentes.
- Distinción visual entre compromisos y aportaciones.

### 6.13 Registro por voz

- Activación explícita del micrófono.
- Transcripción visible.
- Interpretación estructurada.
- Confirmación antes de registrar.
- Corrección de datos individuales.

### 6.14 Resumen mensual

- Ingresos.
- Gastos.
- Cantidad destinada a metas.
- Distribución por categorías.
- Comparación con el mes anterior.
- Cumplimiento de aportaciones.

## 7. Recorridos principales

### Recorrido A: registrar un gasto

Inicio → Registrar movimiento → Gasto → Completar datos → Confirmar → Inicio actualizado.

### Recorrido B: crear una meta

Metas → Nueva meta → Datos generales → Pagos parciales → Frecuencia → Vista previa → Crear mi ruta → Detalle.

### Recorrido C: omitir una aportación

Detalle de meta → Aportación vencida → Recalcular → Comparar alternativas → Confirmar o decidir después.

### Recorrido D: registrar mediante voz

Registrar movimiento → Micrófono → Transcripción → Interpretación → Confirmar o corregir → Guardar.

### Recorrido E: revisar el mes

Inicio → Resumen mensual → Categoría → Movimientos filtrados.

## 8. Reglas de cálculo

Todos los cálculos usan precisión de centavos. El redondeo mostrado al usuario se realiza a dos decimales.

### 8.1 Saldo administrativo

Por cuenta:

`saldo actual = saldo inicial + ingresos - gastos + transferencias recibidas - transferencias enviadas`

Las transferencias entre cuentas propias no modifican el saldo total del usuario.

### 8.2 Disponible estimado

`disponible estimado = saldo administrativo total - cantidades marcadas como apartadas para metas`

La interfaz debe indicar que el resultado solo es correcto si los registros manuales están actualizados. Los compromisos futuros se muestran por separado y no se descuentan hasta que se registren o el usuario decida reservarlos.

### 8.3 Presupuesto por categoría

`restante = límite del periodo - gastos confirmados de la categoría`

Estados:

- Menos de 80%: normal.
- Entre 80% y 99.99%: próximo al límite.
- 100% o más: límite alcanzado o excedido.

### 8.4 Meta sencilla

`pendiente = máximo(0, cantidad objetivo - cantidad ahorrada)`

`aportación recomendada = pendiente / número de fechas de aportación disponibles`

Las fechas disponibles incluyen únicamente fechas posteriores al momento del cálculo y no posteriores a la fecha límite. Si no existen fechas disponibles y queda dinero pendiente, la meta es inviable bajo la configuración actual.

### 8.5 Meta con pagos parciales

Los pagos se ordenan por fecha ascendente. El plan debe asegurar primero el pago más cercano.

Para cada fecha parcial:

1. Calcular la cantidad acumulada requerida hasta esa fecha.
2. Restar el ahorro ya disponible para la meta.
3. Distribuir el faltante entre las fechas de aportación disponibles antes del vencimiento.
4. Después de cubrir ese compromiso, continuar con el siguiente.

Esto puede producir aportaciones diferentes por etapa. La interfaz debe explicar por qué una aportación sube o baja.

### 8.6 Aportación omitida

- La cantidad pendiente no cambia.
- La fecha omitida se elimina de las fechas disponibles.
- El faltante se redistribuye entre las fechas restantes.
- Si ya no existen fechas suficientes, se muestran alternativas sin seleccionar ninguna automáticamente.

### 8.7 Aportación adicional

Una aportación superior a la recomendada reduce el pendiente y recalcula las aportaciones futuras. El usuario puede elegir mantener la aportación original para terminar antes.

### 8.8 Viabilidad administrativa

Si el usuario proporciona ingresos y gastos esperados:

`capacidad estimada = ingresos esperados - gastos fijos - presupuestos variables - otras aportaciones planeadas`

Si la aportación requerida supera la capacidad estimada, Ahorruta muestra la diferencia y alternativas. No bloquea la creación de la meta.

## 9. Responsabilidad de la IA

La IA puede:

- Interpretar “Gasté $350 en gasolina ayer”.
- Proponer una categoría.
- Detectar datos faltantes.
- Resumir información ya calculada.
- Explicar una ruta en lenguaje sencillo.

La IA no puede:

- Inventar movimientos o cantidades.
- Calcular aportaciones sustituyendo el motor determinista.
- Guardar datos ambiguos sin confirmación.
- Mover dinero.
- Dar asesoría de inversión, fiscal o crediticia.

## 10. Integraciones futuras del prototipo

### ElevenLabs

- Entrada y respuesta por voz.
- Lectura breve de próximos compromisos.
- Confirmación oral antes de registrar.

### Zavu

- Registro y consulta mediante WhatsApp.
- Recordatorios de aportaciones y suscripciones.
- Uso exclusivo de datos autorizados por el usuario.

### n8n

- Orquestar recordatorios y canales.
- Recibir eventos de Zavu.
- Solicitar transcripción o síntesis de voz.
- Enviar datos estructurados a la aplicación.
- Nunca sustituir las reglas centrales de cálculo.

## 11. Privacidad mínima

- No solicitar credenciales bancarias.
- Explicar qué datos se guardan y para qué.
- Permitir corregir y eliminar registros.
- Permitir eliminar la cuenta y sus datos.
- Solicitar permiso antes de utilizar el micrófono.
- No usar datos financieros reales durante demostraciones.
- Ocultar cantidades sensibles en notificaciones configurables.

## 12. Criterios de aceptación del prototipo

El prototipo se considera aprobado cuando una persona puede, sin instrucciones externas:

1. Registrar un gasto.
2. Corregir un movimiento.
3. Crear una meta con fecha y cantidad.
4. Agregar al menos un pago parcial.
5. Comprender cuánto debe aportar y cuándo.
6. Registrar una aportación.
7. Entender qué sucede al omitirla.
8. Elegir conscientemente una opción de reajuste.
9. Encontrar una suscripción y su siguiente cobro.
10. Identificar que Ahorruta no está conectada a su banco.

## 13. Métricas para una prueba futura

- Porcentaje que completa el registro de un gasto sin ayuda.
- Porcentaje que crea una meta sin ayuda.
- Tiempo necesario para comprender la aportación recomendada.
- Errores al distinguir saldo, disponible y ahorro apartado.
- Personas que entienden que las cifras dependen de registros manuales.
- Intención de volver a utilizar la aplicación.
- Intención de pagar, probada por separado de la aprobación visual.

## 14. Identidad visual aprobada

- Nombre: Ahorruta.
- Eslogan: “Tu dinero, con destino”.
- Personalidad: cercana, clara, tranquila y motivadora.
- Color principal: verde azulado profundo.
- Colores secundarios: menta suave y amarillo cálido.
- Fondos: blanco cálido.
- Componentes: tarjetas redondeadas, iconos lineales y botones amplios.
- Recurso visual: rutas, destinos, mapas y señales.
- Evitar: apariencia bancaria, tablas densas, gráficas de inversión, lenguaje culpabilizante y saturación visual.

## 15. Punto de congelación del prototipo

Las funciones anteriores conforman el alcance aprobado. Toda función nueva se registra como una propuesta para una versión posterior y no se agrega automáticamente al MVP.

El siguiente entregable después de este documento será un mapa navegable de las pantallas. El desarrollo comienza únicamente después de aprobar ese mapa y las reglas de cálculo.
