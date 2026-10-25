# Sprint S4 — Sistema de diseño, pagos, cuotas, recibos anclados y seguridad

- **Historias:** HT-13 Sistema de diseño (deuda de S3), HU-16 Registrar pago, HU-18 Validar pago,
  HU-19 Rechazar pago, HU-35 Plan de cuotas, HU-37 Vencimiento automático de cuotas, HT-14 Cadena de
  suministro, HU-22 Emitir recibo digital, HU-23 Anclaje con reintentos, HU-42 Saldo de la cuenta
  operadora y HT-15 Seguridad del contrato y de la cuenta operadora.
- **Épicas:** EP-07 (HT-13, HT-14), EP-04 (HU-16, HU-18, HU-19), EP-03 (HU-35, HU-37) y EP-05
  (HU-22, HU-23, HU-42, HT-15).
- **Rama:** `feat/sprint-s4-pagos-recibos`.
- **Fechas:** 19/10/2026 – 30/10/2026 (tabla 6-1 del backlog).
- **Commits:** `545441f` Etapa A (HT-13, integrada en `main` con el PR #9), `8b2931e` deuda de la
  Etapa A y el commit de la Etapa B.
- **Ejecución:** sesión principal de Claude Code en un contenedor en la nube, en línea
  (`executing-plans`), con las skills de `AGENTS.md`.
- **Estado:** criterios de aceptación cumplidos salvo HT-15.1, que se cierra cuando el autor ejecute
  en Amoy la transferencia del administrador (D24). La deuda de la Etapa A y la Etapa B se integran
  en `main` con un PR nuevo y merge tras la CI en verde, a pedido del autor en el punto de control 2.
  Pendiente: aceptación del Product Owner.

> Verificación de la Etapa B ejecutada el **25/10/2026**; reproducible con los comandos de la
> sección 12.

## 1. Objetivo

Aplicar el sistema de diseño Claroscuro a toda la SPA (Etapa A) y cerrar el ciclo del pago: registro
con Débito bancario y RN-02, validación en tres acciones con recibo, rechazo con autor propio, plan
de cuotas con vencimiento diario y mora, saldo de la cuenta operadora, seguridad de la cadena de
suministro y administración del contrato en frío (Etapa B).

## 2. Entregables

### Etapa A (HT-13)

| Entregable                                                     | Ubicación                                                             |
| -------------------------------------------------------------- | --------------------------------------------------------------------- |
| Tokens, fuentes del mismo origen, isologo y animaciones        | `apps/web/src/index.css`, `src/assets/`                               |
| Riel del personal, barra inferior del cliente y encabezado     | `apps/web/src/components/layout/`                                     |
| `EstadoInsignia` único con su vocabulario                      | `apps/web/src/components/EstadoInsignia.tsx`, `components/estados.ts` |
| Las 11 pantallas en Claroscuro                                 | `apps/web/src/features/*/pages/`                                      |
| `diseno.spec.ts` (axe AA, foco, 44 px, 360 px, mismo origen)   | `apps/web/e2e/diseno.spec.ts`                                         |
| Deuda: espera de animaciones antes de axe; `design.json` nuevo | `apps/web/e2e/diseno.spec.ts`, `apps/web/.impeccable/design.json`     |

### Etapa B

| Entregable                                                                    | Ubicación                                                                                                                              |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Esquemas de pago, cuota y saldo; `proponerPlanCuotas`, `fechaEnGuayaquil`     | `packages/shared/src/schemas/{pago,cuota,operadora,poliza}.schema.ts`, `src/dominio/`                                                  |
| Migración `pagos_cuotas_s4` (rechazo, referencia única, cuota única)          | `apps/api/prisma/migrations/20261025060000_pagos_cuotas_s4/`, `prisma/seed.ts`                                                         |
| RN-02 al registrar y al validar; rechazo con autor y fecha propios            | `apps/api/src/modules/pagos/`                                                                                                          |
| Plan de cuotas, D13 al editar la prima o la vigencia, mora                    | `apps/api/src/modules/polizas/domain/plan-cuotas.ts`, `application/use-cases/cuotas.use-cases.ts`                                      |
| Vencimiento diario a las 00:05 de Guayaquil                                   | `apps/api/src/modules/polizas/infrastructure/schedule/vencimiento-cuotas.task.ts`, `src/worker.module.ts`                              |
| Saldo de la cuenta operadora (tarea, Redis, métrica y `GET /operadora/saldo`) | `apps/api/src/modules/recibos/infrastructure/{blockchain/saldo-operadora.task.ts,redis/}`, `presentation/http/operadora.controller.ts` |
| Corrección del hash del recibo (`keccak256(sal ‖ payload)`)                   | `apps/api/src/modules/recibos/infrastructure/blockchain/viem-hasher-recibos.adapter.ts`                                                |
| Scripts de administración en frío y pruebas de roles                          | `packages/contracts/scripts/{administracion,transferir-admin,rotar-operadora,argumentos}.ts`, `test/administracion.test.ts`            |
| CI: acciones por SHA, permisos por job y job `seguridad`                      | `.github/workflows/{ci,deploy}.yml`                                                                                                    |
| Renovate, secretlint, excepciones de auditoría y de gitleaks                  | `renovate.json`, `.secretlintrc.json`, `.lintstagedrc.json`, `pnpm-workspace.yaml`, `.gitleaksignore`                                  |
| Pantallas: registrar, validar y rechazar pagos; motivo en el portal           | `apps/web/src/features/pagos/`, `features/dashboard/components/PanelCliente.tsx`                                                       |
| Pantallas: plan de cuotas, mora y aviso D13                                   | `apps/web/src/features/polizas/components/PlanCuotasDialog.tsx`, `pages/PolizasPage.tsx`                                               |
| Pantalla: salud del anclaje del ADMIN                                         | `apps/web/src/features/dashboard/components/SaludAnclaje.tsx`                                                                          |
| Combobox y campo compartidos                                                  | `apps/web/src/components/{ComboboxBusqueda,Campo}.tsx`                                                                                 |
| e2e del API y Playwright                                                      | `apps/api/test/{pagos,cuotas,operadora,reinicio-worker}.e2e-spec.ts`, `apps/web/e2e/{pagos-cuotas,diseno}.spec.ts`                     |
| Documentación                                                                 | `CLAUDE.md`, `apps/api/src/modules/README.md`, `docs/despliegue.md` §4.1, §4.2 y §8, ADR-020                                           |

## 3. Criterios de aceptación y evidencia

### HT-13 (Etapa A)

| Criterio                                 | Evidencia                                                                   | Estado |
| ---------------------------------------- | --------------------------------------------------------------------------- | ------ |
| Tokens; ningún color fuera de ellos      | `index.css`; búsqueda de colores sueltos sin resultados                     | ✅     |
| Fuentes del mismo origen e isologo       | `diseno.spec.ts` (sin dominios externos); `AppLayout.test.tsx`              | ✅     |
| Navegación del personal y barra inferior | `AppLayout.test.tsx`; `diseno.spec.ts`                                      | ✅     |
| Componente único de estado               | `EstadoInsignia.test.tsx` (exhaustivo); `PlanCuotasDialog.test.tsx`         | ✅     |
| Pantallas sin cambio de comportamiento   | Vitest existentes en verde; capturas del punto de control 1                 | ✅     |
| AA, foco, 44 px y 360 px                 | `diseno.spec.ts` (18 pantallas con las de la Etapa B); `responsive.spec.ts` | ✅     |

### HU-16 Registrar pago

| Criterio                                  | Evidencia                                                                     | Estado |
| ----------------------------------------- | ----------------------------------------------------------------------------- | ------ |
| Póliza, monto, fecha, método y referencia | `pagos.e2e-spec.ts` caso 1; `FormularioPago.test.tsx`; `pagos-cuotas.spec.ts` | ✅     |
| Débito bancario en el catálogo            | `esquemas-compartidos.spec.ts`; seed; `pagos.e2e-spec.ts` caso 1              | ✅     |
| RN-01 y RN-02                             | `pagos.use-cases.spec.ts`; `pagos.e2e-spec.ts` casos 3 y 4; `pagos-rn01`      | ✅     |
| REGISTRADO y autor                        | `pagos.e2e-spec.ts` caso 1                                                    | ✅     |

### HU-18 Validar pago

| Criterio                            | Evidencia                                                               | Estado |
| ----------------------------------- | ----------------------------------------------------------------------- | ------ |
| Solo un pago REGISTRADO (RN-03)     | `validar-pago.use-case.spec.ts`; `pagos.e2e-spec.ts` caso 5             | ✅     |
| Usuario y fecha de validación       | `pagos.e2e-spec.ts` caso 5                                              | ✅     |
| Un pago validado no se edita        | `pago.spec.ts` (`puedeEditarse`); sin `PATCH`/`PUT /pagos/:id` (caso 5) | ✅     |
| Confirmación y máximo tres acciones | `PagosPage.test.tsx` (tres clics contados); `pagos-cuotas.spec.ts`      | ✅     |

### HU-19 Rechazar pago

| Criterio                    | Evidencia                                                                   | Estado |
| --------------------------- | --------------------------------------------------------------------------- | ------ |
| Motivo obligatorio          | esquema; `pagos.e2e-spec.ts` caso 6; `RechazarPagoDialog.test.tsx`          | ✅     |
| Final y sin recibo          | `pagos.e2e-spec.ts` caso 6                                                  | ✅     |
| Usuario y fecha del rechazo | `prisma-pagos.repository.spec.ts`; `pagos.e2e-spec.ts` caso 6               | ✅     |
| El cliente ve el motivo     | `pagos.e2e-spec.ts` caso 6; `PanelCliente.test.tsx`; `pagos-cuotas.spec.ts` | ✅     |

### HU-35 Plan de cuotas

| Criterio                              | Evidencia                                                 | Estado |
| ------------------------------------- | --------------------------------------------------------- | ------ |
| Número de cuotas y propuesta editable | `cuotas.spec.ts` (shared); `PlanCuotasDialog.test.tsx`    | ✅     |
| Suma igual a la prima (RN-15)         | `plan-cuotas.spec.ts`; `cuotas.e2e-spec.ts`               | ✅     |
| Número, valor, vencimiento y estado   | `cuotaSchema`; `cuotas.e2e-spec.ts`                       | ✅     |
| Pago único = una cuota                | `prisma-polizas.repository.spec.ts`; `cuotas.e2e-spec.ts` | ✅     |

### HU-37 Vencimiento automático

| Criterio                         | Evidencia                                                                                  | Estado |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ------ |
| Tarea diaria a las 00:05 (RN-14) | `marcar-cuotas-vencidas.use-case.spec.ts`; `vencimiento-cuotas.task.spec.ts` (cron y zona) | ✅     |
| Póliza en mora (RN-16)           | `cuotas.e2e-spec.ts`; `PolizasPage.test.tsx`                                               | ✅     |
| Registro de la ejecución en logs | `vencimiento-cuotas.task.spec.ts`                                                          | ✅     |

### HT-14 Cadena de suministro

| Criterio                             | Evidencia                                                                             | Estado |
| ------------------------------------ | ------------------------------------------------------------------------------------- | ------ |
| Renovate agrupado y acciones por SHA | `renovate.json`; `ci.yml` y `deploy.yml` con SHA; instalar la app es acción del autor | ✅     |
| `pnpm audit` alto en producción      | job `seguridad`; corrida local con 5 excepciones documentadas (sección 7)             | ✅     |
| Semgrep CE                           | job `seguridad`; corrida local aproximada (sección 8)                                 | ✅     |
| gitleaks y secretlint                | job `seguridad`; `.lintstagedrc.json`; commit de prueba bloqueado por el hook         | ✅     |
| zizmor y permisos por job            | job `seguridad`; `ci.yml`; zizmor local sin hallazgos altos                           | ✅     |

### HU-22 Emitir recibo y HU-23 Anclaje con reintentos

| Criterio                           | Evidencia                                                                                                               | Estado |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------ |
| HU-22.1 a HU-22.5                  | `emitir-recibo.use-case.spec.ts`; `node-cripto.adapter.spec.ts`; `viem-hasher-recibos.adapter.spec.ts`; `flujo-anclaje` | ✅     |
| HU-23.1 a HU-23.4 y HU-23.6        | `flujo-anclaje`; `idempotencia-anclaje`; `queue.module.ts`; `outbox.use-cases.spec.ts`                                  | ✅     |
| HU-23.5 reinicio sin doble anclaje | `reinicio-worker.e2e-spec.ts` (10 recibos, un evento por recibo, `intentos` ≤ 5)                                        | ✅     |

### HU-42 Saldo de la cuenta operadora

| Criterio                    | Evidencia                                               | Estado |
| --------------------------- | ------------------------------------------------------- | ------ |
| Saldo en el panel del ADMIN | `operadora.e2e-spec.ts`; `SaludAnclaje.test.tsx`        | ✅     |
| Umbral configurable         | `env.schema.spec.ts`; `saldo-operadora.task.spec.ts`    | ✅     |
| Alerta y log bajo el umbral | `saldo-operadora.task.spec.ts`; `SaludAnclaje.test.tsx` | ✅     |

### HT-15 Seguridad del contrato y de la cuenta operadora

| Criterio                  | Evidencia                                                                                    | Estado                 |
| ------------------------- | -------------------------------------------------------------------------------------------- | ---------------------- |
| Admin fuera del servidor  | `administracion.test.ts` (transferir); ADR-021; txHash en Amoy                               | ⏳ pendiente del autor |
| Matriz de roles           | `administracion.test.ts`; `RegistroRecibos.t.sol`                                            | ✅                     |
| Rotación y pausa probadas | `administracion.test.ts`; corrida de los scripts en el nodo local; `docs/despliegue.md` §4.2 | ✅                     |

## 4. Definición de Terminado

| Punto                                           | Etapa A               | Etapa B             |
| ----------------------------------------------- | --------------------- | ------------------- |
| `pnpm install --frozen-lockfile`                | ⚠️ ver sección 8      | ⚠️ ver sección 8    |
| `pnpm -r build`, `lint`, `typecheck`            | ✅                    | ✅                  |
| `pnpm format:check`                             | ✅                    | ✅                  |
| `pnpm deps:check` y `deps:check:negativo`       | ✅                    | ✅                  |
| `pnpm test`                                     | ✅ 30 / 174 / 212     | ✅ 42 / 243 / 266   |
| `pnpm --filter @oasis/contracts reporte`        | —                     | ✅ 100 % de líneas  |
| `pnpm test:e2e`                                 | ✅ 162 (11 suites)    | ✅ 185 (15 suites)  |
| `pnpm --filter @oasis/web test:e2e`             | ✅ 26 (tras la deuda) | ✅ 32               |
| Funciona con Docker Compose (PostgreSQL, Redis) | ✅                    | ✅                  |
| PR y CI en GitHub                               | ✅ PR #9              | PR nuevo con merge  |
| Aceptación del PO                               | pendiente del autor   | pendiente del autor |

## 5. Versiones exactas de las dependencias nuevas

| Paquete                                        | Versión | Publicada  |
| ---------------------------------------------- | ------- | ---------- |
| `secretlint` (raíz, desarrollo)                | 13.0.7  | 03/10/2026 |
| `@secretlint/secretlint-rule-preset-recommend` | 13.0.7  | 03/10/2026 |
| Imagen `semgrep/semgrep` (CI)                  | 1.180.0 | 07/10/2026 |
| gitleaks (binario de la CI, con checksum)      | 8.30.1  | 12/03/2026 |
| zizmor (CI, con `uvx`)                         | 1.30.1  | 09/09/2026 |

Acciones fijadas por SHA: `actions/checkout` v5.1.0, `pnpm/action-setup` v4.4.0,
`actions/setup-node` v5.0.0, `docker/setup-buildx-action` v3.12.0, `docker/build-push-action`
v6.19.2, `docker/login-action` v3.7.0, `appleboy/ssh-action` v1.2.5 y `astral-sh/setup-uv` v6.8.0.
Todas tienen más de dos semanas. La Etapa A agregó `@fontsource-variable/outfit`,
`@fontsource-variable/figtree` y `@axe-core/playwright` (commit `545441f`).

## 6. Decisiones y discrepancias

- **ADR vigentes del sprint:** ADR-007 (API y worker separados), ADR-020 (plan de cuotas y saldo,
  precisada con `PLAN_FUERA_DE_VIGENCIA` y la ventana de S4 en validaciones simultáneas) y ADR-021
  (administración en frío). ADR-014 figura como retirada por el backlog v1.5.
- **RN-22 adelantada a la base (D6):** la referencia es única por póliza con un índice; la migración
  renombró con sufijo `-<n>` las repetidas de desarrollo (en la base local, una: `TRF-0001-2`).
- **Saldo por pagos validados (D7):** `primaTotal − Σ pagos VALIDADOS`. A partir de HU-36 (S5) el
  invariante `Σ Cuota.valorPagado = Σ pagos VALIDADOS` hace equivalentes ambas cifras. Dos
  validaciones simultáneas sobre la misma póliza aún pueden pasar las dos (marcado `ponytail:`).
- **Reemplazo del plan de cuotas** como único borrado del sistema (ADR-020).
- **Ejecución en dos etapas con puntos de control (D23).**
- **Códigos de negocio en `details.motivo`:** `MONTO_SUPERA_SALDO`, `REFERENCIA_DUPLICADA`,
  `PLAN_NO_CUADRA`, etc. viajan en `details.motivo` con `code` `REGLA_NEGOCIO` o `CONFLICTO`, como
  `POLIZA_NO_VIGENTE` desde S3. El plan los escribía como si fueran el `code`.
- **Cuota única y vigencia (D13):** con una cuota, el vencimiento sigue a la nueva `fechaInicio`
  (pago único, como al crear); solo los planes de N cuotas se validan contra la vigencia nueva.
- **Ejemplo del plan corregido (T11):** «0,05 con 3 cuotas → error» no es cierto (0,01 + 0,01 +
  0,03); la prueba usa 0,02 con 3 cuotas.
- **Defecto del hash del recibo (T18):** `ViemHasherRecibosAdapter` concatenaba bytes con texto
  hexadecimal y viem copiaba los caracteres como números: el hash no era `keccak256(sal ‖ payload)`
  y dos payloads distintos podían coincidir (`{` y `}`). Se corrigió con una prueba que fallaba
  antes. En Amoy solo está el hash de prueba de S2, así que ningún recibo real queda inconsistente;
  en desarrollo, un recibo anclado antes del arreglo verificará como «No coincide».
- **Desempate del listado de pagos:** a igual fecha de pago, primero el último registrado, para que
  el pago recién registrado aparezca en la primera página. No es el orden «por validar primero» de
  HU-20 (S5).
- **Scripts de administración con `node`:** `hardhat run` rechaza opciones propias (`--pausar`); los
  scripts reciben las direcciones como argumentos y firman con el keystore. Se lanzan con
  `pnpm --filter @oasis/contracts transferir-admin|rotar-operadora`, porque con `node` desde la raíz
  Hardhat no encuentra su configuración. Se agregó la red `amoyAdmin` (`ADMIN_FRIA_PRIVATE_KEY`) para
  que la billetera fría firme la rotación.
- **Autorrevisión de la Etapa B (T28):** editar una póliza sin cuotas (datos anteriores a S4 que la
  migración no cubriera) fallaba al ajustar el plan; ahora se edita sin plan que ajustar. La fila de
  un pago rechazado muestra la fecha del rechazo. Ambos cambios tienen su prueba.
- **e2e repetibles:** las e2e que validan pagos usan pólizas propias (D22) y la fecha de Guayaquil;
  con RN-02, la póliza del seed se quedaba sin saldo tras unas pocas corridas locales.

## 7. Impedimentos y observaciones

- **Primera semana sin avance:** el plan se acordó el 23/10 y se reestructuró el 24/10; la Etapa A
  y la Etapa B se ejecutaron entre el 24 y el 25/10 con agentes, como prevé D1.
- **Red del contenedor de ejecución:** el proxy negó `codeload.github.com`, `binaries.soliditylang.org`,
  `skills.sh` y `semgrep.dev`. Se reprodujo el tarball de `forge-std` con `git archive` (sha512
  idéntico al lockfile) y se instaló con una ruta temporal, restaurando `package.json` y el lockfile;
  solc 0.8.28 se obtuvo de GitHub verificado por sha256 contra la lista oficial. Por eso
  `pnpm install --frozen-lockfile` no se pudo demostrar en el contenedor; en la CI sí corre.
- **`pnpm audit` con avisos altos sin corrección madura** (R3): zod 4.6.6 (13,5 días),
  body-parser 2.4.0 y multer 2.5.0 (3 días) no cumplen las dos semanas; mysql2 y deepmerge-ts llegan
  por el CLI de Prisma. Quedan en `auditConfig.ignoreGhsas` con revisión el 08/11/2026.
- **gitleaks:** un falso positivo (el marcador de `.env.example`) quedó en `.gitleaksignore`.
- **Semgrep local aproximado:** sin acceso a `semgrep.dev`, se corrió la versión fijada con las
  reglas `typescript` y `javascript` del repositorio público (0 hallazgos ERROR); los paquetes
  `p/typescript`, `p/nodejs` y `p/owasp-top-ten` los corre la CI.
- **Puntos de control:** el 1 se aprobó sin ajustes. Antes de presentar el 2 se corrigió un
  desborde de 76 px de la tabla de pólizas a 1280 px, que cortaba el botón «Cuotas»: la vigencia se
  parte en el guion y cada fecha queda en una línea. El 2 se aprobó sin ajustes el 25/10, con el
  pedido de integrar la rama en `main`.

## 8. Horas de backlog

| Etapa | Historia  |  Horas |
| ----- | --------- | -----: |
| A     | HT-13     |     25 |
| B     | HU-16     |      8 |
| B     | HU-18     |      5 |
| B     | HU-19     |      3 |
| B     | HU-35     |      6 |
| B     | HU-37     |      3 |
| B     | HT-14     |      3 |
| B     | HU-22     |      6 |
| B     | HU-23     |     14 |
| B     | HU-42     |      3 |
| B     | HT-15     |      3 |
|       | **Total** | **79** |

Son las horas del backlog (D1); el informe no reporta horas reales.

## 9. Deuda y fuera de alcance

| Deuda                                                                           | Sprint destino |
| ------------------------------------------------------------------------------- | -------------- |
| Errores de Zod que llegan en dos tandas al formulario de cliente                | S5             |
| Píldora de pendientes del riel                                                  | S5             |
| Ancla `/#polizas` del portal al abrirla en frío                                 | S6             |
| «¿Olvidó su contraseña?» (HU-31)                                                | S7             |
| «Recordar este equipo» (no se implementa; queda registrado)                     | —              |
| Validaciones simultáneas sobre la misma póliza (bloqueo `FOR UPDATE`, HU-36)    | S5             |
| Retirar las excepciones de `pnpm audit` cuando Renovate traiga las correcciones | S5             |

Fuera de alcance, sin cambios: estado de anclaje con sondeo, recibo imprimible, botón de reintento y
verificación del CLIENTE (S5), aplicar pagos a cuotas (HU-36, S5), listado por cliente y «por
validar primero» (HU-20, S5), saldo visible (HU-15, S6), anulación con motivo (HU-27, S6), mesa de
validación (S7) y contadores del límite de tasa en Redis (HT-08, S8).

## 10. Acciones del autor (D24)

- [ ] Instalar la app de Renovate en el repositorio y aprobar su PR de bienvenida.
- [ ] Crear la billetera fría (cuenta nueva sin otro uso, frase semilla solo en papel).
- [ ] Ejecutar en Amoy `pnpm --filter @oasis/contracts transferir-admin` hacia la billetera fría
      (`docs/despliegue.md` §4.1) y anotar aquí los dos txHash. Con esto se cumple HT-15.1.
- [ ] Hacer las pruebas manuales con teclado y lector de pantalla (sección 11).
- [ ] Presentar el sprint al Product Owner el 30/10.

## 11. Pruebas manuales

| Prueba                                                        | Resultado                                                                                                                                                      |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Saldo de la operadora en el panel del ADMIN                   | ✅ Se lee al arrancar el worker; sin la llave de Redis, el panel dice que no hay datos                                                                         |
| Umbral del saldo con el worker                                | ✅ Con 20 000 POL (la cuenta local tiene unos 10 000; 1000 no dispara) aparecen el `warn` `saldo-operadora-bajo` y el aviso en el panel                        |
| Rotación con pausa y transferencia del administrador          | ✅ En el nodo local, con `pnpm --filter @oasis/contracts rotar-operadora … --pausar` y `transferir-admin`, sobre un despliegue de prueba                       |
| Pantallas nuevas a 1280 y 360 px                              | ✅ Capturas revisadas en el punto de control 2                                                                                                                 |
| Registrar, validar y rechazar solo con el teclado             | ⏳ Pendiente del autor. Cubierto en parte por `diseno.spec.ts` (foco visible al tabular en los diálogos nuevos) y el recorrido del riel con el teclado         |
| Lector de pantalla (insignias, error de saldo, página actual) | ⏳ Pendiente del autor: el contenedor no tiene lector de pantalla. Las pruebas leen el nombre accesible de `EstadoInsignia` y el `role="alert"` de los errores |

## 12. Cómo verificar

```bash
pnpm install --frozen-lockfile
pnpm -r build && pnpm -r lint && pnpm format:check && pnpm -r typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test                                             # contratos, API y SPA (shared en la SPA)
pnpm --filter @oasis/contracts reporte                # ≥ 90 % de líneas
docker compose -f compose.dev.yaml up -d postgres redis
pnpm --filter @oasis/contracts exec hardhat node      # en otra terminal
pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy   # incluye pagos_cuotas_s4
pnpm --filter @oasis/api seed
pnpm test:e2e
pnpm --filter @oasis/web test:e2e
```
