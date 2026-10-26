# Sprint S5 — Qué falta

Corte del 26/10/2026 en la rama `feat/sprint-s5-verificacion-cartera`. El plan es
[sprint-s5-plan.md](sprint-s5-plan.md) (decisiones D1–D26). Este documento se borra cuando se
escriba `sprint-s5.md` (T24).

## 1. Estado

- **Hecho:** T0 (arrastre, rama, línea base, zod `4.6.6`, errores de Zod en dos tandas), T1–T4,
  T5–T11 (API), T12–T17 (SPA), T18–T19 (e2e y Playwright) y la revisión T20 sin bloqueantes. D10
  (`GET /bitacora` con `entidad` y `entidadId`) quedó cerrado de punta a punta.
- **Última verificación en verde** (`pnpm -r build`, `lint`, `typecheck`, `test`, `deps:check`,
  `format:check`): API 60 suites, 304 pruebas y 2 `todo`; SPA 52 archivos, 413 pruebas y 4 `todo`.
- **e2e:** la última corrida completa fue antes de las correcciones de T20 (API 233 de 234,
  Playwright 53 de 55). Después se arreglaron los dos bugs de producto que la dejaron en rojo y
  pasaron `verificacion`, `pagos`, `recibos` y, en Playwright, `claridad` y `pagos-cuotas`. **No hay
  corrida completa posterior**: Docker Desktop no respondía al cortar.
- **Decisiones del desarrollador (25 y 26/10), para el informe como precisiones:** D11 por fecha
  (`aplicarPagoACuotas(cuotas, monto, hoy)`); D17 al editar, el vacío borra (`null`); Q16, Q17 y Q18
  (sección 2).

## 2. Código pendiente

Las pruebas de estos puntos ya están escritas como `it.todo`; al implementarlos se convierten en
`it` y se ponen en rojo primero.

| #   | Qué                                                                                                                                                                                                                                                                                                                     | Dueño          | Pruebas `todo`                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | **Q16.** `reemplazarCuotas` (`PUT /polizas/:id/cuotas`) y el PATCH de prima o vigencia toman `FOR UPDATE` sobre las cuotas y recuentan los pagos VALIDADOS después del bloqueo; si cambió, 409 `POLIZA_MODIFICADA` y nunca un 500 por la FK.                                                                            | `backend-api`  | `prisma-polizas.repository.spec.ts`: las dos de «Q16»                                                               |
| 2   | **Q17.** `VerificarReciboUseCase`: un recibo ANULADO en la base responde ANULADO sin consultar la cadena (hoy da 502 con el RPC caído). El orden de D2 no cambia.                                                                                                                                                       | `backend-api`  | Falta escribirla (espía de la cadena que no se llama)                                                               |
| 3   | **Q18.** `GET /cuotas` excluye las cuotas de pólizas no VIGENTES (`poliza: { estado: 'VIGENTE' }` en el `where` de `listarCartera`).                                                                                                                                                                                    | `backend-api`  | Falta escribirla                                                                                                    |
| 4   | **Menor 5 de T20.** Al recargar con `?polizaId=` o `?clienteId=`, los combobox de Pagos y Cartera muestran la etiqueta del valor (con `polizasApi.obtener` y un `clientesApi.obtener` que falta). El filtro de Pagos busca pólizas de cualquier estado; el formulario de pago sigue con VIGENTES (RN-01), con una prop. | `frontend-spa` | `PagosPage.test.tsx` (3: `?polizaId=`, `?clienteId=`, póliza cancelada) y `CarteraPage.test.tsx` (1: `?clienteId=`) |

## 3. Verificación pendiente

1. Levantar la infraestructura (activar la integración WSL de Docker Desktop):
   `pnpm dev:infra`, `pnpm dev:chain`, `pnpm --filter @oasis/api exec prisma migrate deploy`.
   El nodo Hardhat nuevo no conserva el contrato: `dev:chain` lo redespliega.
2. Con el worker detenido, borrar las llaves `bull:anclaje-recibos:*` de Redis.
3. `pnpm --filter @oasis/api test:e2e` y `pnpm --filter @oasis/web test:e2e` completos.
4. `verificador` agrega un e2e para Q16 (validar y reemplazar el plan a la vez), Q17 (ANULADO sin
   cadena) y Q18 (la póliza cancelada sale de la cartera).
5. `revisor`: una ronda de confirmación de los seis menores y de Q16–Q18.

## 4. Cierre del sprint

- **T21 · DoD.** `lint`, `typecheck`, `deps:check`, `test`, `build`, e2e y Compose en verde.
  `pnpm audit --prod --audit-level=high`: las excepciones de body-parser y multer
  (GHSA-27r3-jxmh-p828 y GHSA-q7qp-rjg7-q26m) se retiran solo si la fecha real es igual o posterior
  al 05/11/2026; si no, pasan a S6 como deuda (D26 d).
- **T22 · Punto de control.** Capturas a 1280 y 360 px de `/cartera`, `/polizas/:id`,
  `/recibos/:id/imprimir`, `/portal/recibos/:id`, la verificación del CLIENTE y los filtros de Pagos
  con la píldora del riel. Esperar el «aprobado» del desarrollador. Nadie vio la interfaz renderizada
  todavía.
- **T23 · Documentación** (`documentacion`): `CLAUDE.md` (verificación del CLIENTE y su límite,
  aplicación de pagos a cuotas, cartera, cobertura de la póliza, recibo imprimible),
  `apps/api/src/modules/README.md` (rutas de lectura nuevas exentas de `@Auditar`) y
  `docs/despliegue.md` (`backfill-aplicaciones.ts`, D13). Un ADR solo si una decisión lo pide.
- **T24 · Informe** `docs/sprints/sprint-s5.md` (43 h de backlog, D22): evidencia por criterio,
  desvíos, deuda con sprint destino y acciones del autor. Luego un commit final y el PR.

## 5. Desvíos y deuda para el informe

- `ajustarCuotas` actualiza las cuotas en sitio al editar la vigencia: la recreación daba 500 por
  la FK de `AplicacionPago` y perdía `valorPagado`.
- `pagoClienteSchema` y `aplicarPagoACuotas` nacieron en `@oasis/shared` (el plan decía que ya
  existían); T8 no crea `modules/pagos/domain/aplicacion-pago.ts` (D24).
- D10: la ruta real es `/bitacora`, no `/auditoria`.
- Anular un recibo ANCLADO daba 500 por el `jobId` `anular:<id>` (BullMQ 6 rechaza `:`); ahora
  `anular-<id>`. El orden guardar → encolar de la anulación pasa a HU-27 (S6).
- Chunk de la SPA: 860,97 kB (259,41 kB gzip) frente a 825,31 kB (253,05 kB) al cierre de S4.
- `GET /pagos` del personal carga `recibo` sin usarlo (un join de más por página).
- La verificación del CLIENTE no tiene entrada en `BarraInferiorCliente`: HU-29 (S6).
- `ARQUITECTURA.md` desactualizada: Alchemy frente a PublicNode, PayPhone en §2 y la tabla 4-1, y la
  tabla 6-1 sin las sesiones en Redis. No se editó.
- `ponytail-review` y `ponytail` no están instaladas: las reglas se aplicaron a mano.

## 6. Acciones del autor

- De S4 ([sprint-s4.md](sprint-s4.md) §10): billetera fría, `transferir-admin` en Amoy (cierra
  HT-15.1), pruebas manuales con teclado y lector de pantalla, y presentación al Product Owner.
- De HT-16 ([proteccion-datos](../proteccion-datos/)): Oasis completa RUC, domicilio, delegado de
  protección de datos, contactos, bases de legitimación, plazos de conservación, ubicación de los
  encargados y fecha de vigencia; revisión de la política antes del 16/11.
- Validar las citas de la LOPDP, marcadas «a validar por Oasis».
