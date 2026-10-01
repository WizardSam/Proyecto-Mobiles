# Ahorruta

Aplicación administrativa de finanzas personales para registrar ingresos, gastos y suscripciones, y convertir metas en rutas de ahorro semanales, quincenales o mensuales.

## Estado actual

- Concepto validado.
- Identidad visual aprobada.
- Prototipo navegable disponible.
- Alcance del MVP documentado.
- Hito 1 implementado y aprobado: caparazón visual navegable.
- Hito 2 implementado y aprobado: dinero y fechas.
- Hito 3 implementado y aprobado: saldos y presupuestos.
- Hito 4 implementado y aprobado: motor de metas, reservas y desembolsos.
- Hito 5 implementado y aprobado en local: cuenta con correo y contraseña, confirmación, recuperación, Mi cuenta, borrado y aislamiento. La demostración de Cancún sigue separada de la cuenta.
- Hito 6 implementado, validado y aprobado: movimientos reales, catálogo de categorías por usuario, edición, filtros, archivo y deshacer. La demostración de Cancún sigue separada. Compromisos, metas persistidas y voz quedan para hitos posteriores.
- El proyecto remoto de Supabase todavía no existe.

## Cómo ejecutarlo

```bash
npm install
npm start
npm run web
```

`npm start` abre el servidor de Expo. `npm run web` abre la misma aplicación en el navegador.

## Comprobaciones

```bash
npm test
npm run lint
npm run typecheck
```

`npm test` ejecuta las pruebas de dinero, fechas, saldos, presupuestos, metas y la conversión de centavos. `npx supabase test db` ejecuta el aislamiento entre dos usuarios cuando el entorno local está encendido.

## Documentación

- [Documento maestro](docs/ahorruta-product-spec.md)
- [Decisiones aprobadas](docs/ahorruta-decisions-v1.md)
- [Entrega para Cursor](docs/ahorruta-cursor-handoff.md)
- [Hito 5: cuenta, persistencia y aislamiento](docs/ahorruta-hito-5.md)
- [Cierre del Hito 5](docs/ahorruta-handoff-cierre-hito-5.md)
- [Traspaso para iniciar el Hito 5](docs/ahorruta-chat-handoff-hito-5.md)
- [Referencias visuales](docs/ahorruta-assets)

## Prototipos

- [Prototipo tocable](prototype/ahorruta-clickable-prototype.html)
- [Mapa de navegación](prototype/ahorruta-navigation-map.html)
