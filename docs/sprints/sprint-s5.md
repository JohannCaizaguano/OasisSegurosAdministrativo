# Sprint S5 — Verificación del cliente, recibo imprimible y cartera

- **Historias:** HU-24 Ver estado de anclaje (4 h), HU-25 Recibo imprimible con QR (6 h), HU-26
  Reintentar recibo fallido (3 h), HT-16 Protección de datos y respuesta a incidentes (3 h), HU-28
  Verificar autenticidad del recibo (10 h), HU-36 Aplicar pagos a cuotas (5 h), HU-20 Listar pagos
  (6 h), HU-38 Cuotas por vencer y vencidas (4 h) y HU-51 Cobertura y condiciones de la póliza (2 h).
- **Épicas:** EP-05 (HU-24, HU-25, HU-26), EP-06 (HU-28), EP-03 (HU-36, HU-38, HU-51), EP-04 (HU-20)
  y EP-07 (HT-16).
- **Rama:** `feat/sprint-s5-verificacion-cartera`; un solo commit y un solo PR.
- **Fechas:** 02/11/2026 – 13/11/2026 (tabla 6-1 del backlog). **Cierre del sprint: 12/11/2026.**
- **Ejecución:** sesión principal con `subagent-driven-development` y los agentes de área de
  `.opencode/agents/`.
- **Estado:** criterios de aceptación cumplidos; T22 (punto de control visual) pendiente del autor y
  PR pendiente.

> Verificación de cierre ejecutada el **22/11/2026**. Todas las cifras de este informe son de esa
> fecha.

## 1. Objetivo

Cerrar el ciclo de la verificación y de la cartera: abrir la verificación del recibo al CLIENTE con
RN-07 y un límite por usuario, reemplazar los códigos de verificación por los cinco resultados de
HU-28, mostrar el estado de anclaje y el recibo imprimible con QR, aplicar los pagos validados a las
cuotas dentro de la transacción de validación, listar y filtrar los pagos desde la URL, y exponer la
cartera por vencer y vencida y la cobertura de la póliza. HT-16 entrega la documentación de
protección de datos y respuesta a incidentes.

## 2. Entregables

| Entregable                                                                               | Ubicación                                                                                                                                                          |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Códigos de verificación, esquemas de recibo, cuota, pago y cartera; `aplicarPagoACuotas` | `packages/shared/src/schemas/`, `packages/shared/src/constants/estados.ts`, `packages/shared/src/dominio/aplicacion-pago.ts`                                       |
| Migración de ramos de Oasis y script de backfill de aplicaciones (D13, D18)              | `apps/api/prisma/migrations/20261026000000_cobertura_ramos_s5/`, `prisma/backfill-aplicaciones.ts`                                                                 |
| Verificación con RN-07 y límite de 30 consultas por minuto                               | `apps/api/src/modules/recibos/application/use-cases/verificar-recibo.use-case.ts`, `verificacion.controller.ts`, `src/common/throttle/limite-por-usuario.guard.ts` |
| Recibo imprimible y reintento del ADMIN                                                  | `apps/api/src/modules/recibos/application/use-cases/{obtener-recibo-imprimible,reintentar-recibo}.use-case.ts`                                                     |
| Aplicación de pagos a cuotas con `FOR UPDATE` y 409 de la carrera del plan               | `apps/api/src/modules/pagos/infrastructure/persistence/prisma-pagos.repository.ts`, `prisma-polizas.repository.ts`                                                 |
| Listado de pagos y cartera                                                               | `apps/api/src/modules/pagos/`, `apps/api/src/modules/polizas/application/use-cases/listar-cartera.use-case.ts`                                                     |
| Cobertura, condiciones y detalle de la póliza                                            | `apps/api/src/modules/polizas/`, `apps/web/src/features/polizas/pages/PolizaDetallePage.tsx`                                                                       |
| SPA: estado de anclaje, imprimible, verificación, cartera y filtros con la URL           | `apps/web/src/features/{recibos,verificacion,cartera,pagos,polizas}/`, `components/ComboboxBusqueda.tsx`, `index.css`                                              |
| e2e del API y Playwright                                                                 | `apps/api/test/{cuotas,verificacion,recibos,pagos,polizas}.e2e-spec.ts`, `apps/web/e2e/{recibos-verificacion,cartera,filtros}.spec.ts`                             |
| HT-16: plan de incidentes, RAT, encargados, EIPD y política v1.0                         | `docs/proteccion-datos/`                                                                                                                                           |
| Documentación                                                                            | `CLAUDE.md`, `apps/api/src/modules/README.md`, `docs/despliegue.md` §6.1                                                                                           |

## 3. Criterios de aceptación y evidencia

### HU-24 Ver estado de anclaje

| Criterio                  | Evidencia                                                                                                                | Estado |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| Insignia de color y texto | `EstadoInsignia.test.tsx` («el texto es el nombre accesible…»); `RecibosPage.test.tsx`                                   | ✅     |
| Enlace al explorador      | `LineaTiempoAnclaje.test.tsx` («enlaza la transacción en una pestaña nueva y segura»); `recibos-verificacion.spec.ts:70` | ✅     |
| Fechas de envío y anclaje | `LineaTiempoAnclaje.test.tsx` («…con fecha y hora de Ecuador»)                                                           | ✅     |
| Actualización cada 10 s   | `RecibosPage.test.tsx:62` y `ReciboDetallePage.test.tsx:55` (temporizadores falsos); `recibos-verificacion.spec.ts:70`   | ✅     |

### HU-25 Recibo imprimible con QR

| Criterio                              | Evidencia                                                                                                         | Estado |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------ |
| Póliza, monto, fecha, código y estado | `ReciboImprimible.test.tsx:16`; `apps/api/test/recibos.e2e-spec.ts:175`                                           | ✅     |
| QR a la ruta con sesión               | `ReciboImprimible.test.tsx:28`; `TarjetaVerificacion.test.tsx:14`; `recibos-verificacion.spec.ts:154`             | ✅     |
| Imprimir o guardar PDF                | `ReciboImprimiblePage.test.tsx:65` (`window.print`); `recibos-verificacion.spec.ts:146` (`emulateMedia('print')`) | ✅     |
| Sin sal ni datos internos             | `apps/api/test/recibos.e2e-spec.ts:175`; `ReciboImprimible.test.tsx:39`                                           | ✅     |

### HU-26 Reintentar recibo fallido

| Criterio                               | Evidencia                                                                                   | Estado |
| -------------------------------------- | ------------------------------------------------------------------------------------------- | ------ |
| Solo ADMIN y solo FALLIDO              | `apps/api/test/recibos.e2e-spec.ts:240,284,297`; `ReciboDetallePage.test.tsx:107,116`       | ✅     |
| Vuelve a PENDIENTE_ANCLAJE y se encola | `recibos.e2e-spec.ts:240`; `outbox.use-cases.spec.ts`                                       | ✅     |
| Quién ejecutó el reintento             | `recibos.e2e-spec.ts:240` (bitácora); `ReciboDetallePage.test.tsx:123` («Último reintento») | ✅     |

### HT-16 Protección de datos y respuesta a incidentes

| Criterio                                            | Evidencia                                                                    | Estado |
| --------------------------------------------------- | ---------------------------------------------------------------------------- | ------ |
| Plan de incidentes, roles, contención y SISPDP      | `docs/proteccion-datos/plan-respuesta-incidentes.md`                         | ✅     |
| Plantilla de comunicación al titular                | `docs/proteccion-datos/plantilla-comunicacion-titular.md`                    | ✅     |
| RAT y encargados con plazos                         | `docs/proteccion-datos/registro-actividades-tratamiento.md`, `encargados.md` | ✅     |
| Insumos técnicos de la EIPD                         | `docs/proteccion-datos/insumos-eipd.md`                                      | ✅     |
| Política de tratamiento v1.0 para revisión de Oasis | `docs/proteccion-datos/politica-tratamiento-datos-v1.0.md`                   | ✅     |

### HU-28 Verificar autenticidad del recibo

| Criterio                            | Evidencia                                                                                                               | Estado |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------ |
| Exige sesión y vuelve tras el login | `apps/api/test/verificacion.e2e-spec.ts:148`; `VerificacionPage.test.tsx`; `recibos-verificacion.spec.ts:154`           | ✅     |
| Recalcula y compara el hash         | `verificar-recibo.use-case.spec.ts:81,92`; `verificacion.e2e-spec.ts:207,224`                                           | ✅     |
| Cinco resultados                    | `verificar-recibo.use-case.spec.ts:81-146`; `verificacion.e2e-spec.ts:155,169,195,207,238`; `VerificacionPage.test.tsx` | ✅     |
| Enlace al explorador                | `verificacion.e2e-spec.ts:207`                                                                                          | ✅     |
| RN-07: recibo ajeno = no encontrado | `verificar-recibo.use-case.spec.ts:187,201,215`; `verificacion.e2e-spec.ts:258`                                         | ✅     |
| 30 por minuto por usuario           | `limite-por-usuario.guard.spec.ts:35`; `verificacion.e2e-spec.ts:275` (429 con `Retry-After`)                           | ✅     |

### HU-36 Aplicar pagos a cuotas

| Criterio                              | Evidencia                                                                                                   | Estado |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ |
| Orden de vencimiento (RN-13)          | `apps/web/src/contratos/aplicacion-pago.spec.ts:35,86`; `apps/api/test/cuotas.e2e-spec.ts:277`              | ✅     |
| Cuota cubierta en parte queda PARCIAL | `aplicacion-pago.spec.ts:35,53`; `cuotas.e2e-spec.ts:277`; `prisma-pagos-aplicacion.repository.spec.ts:105` | ✅     |
| Cuota cubierta del todo queda PAGADA  | `aplicacion-pago.spec.ts:48,66`; `cuotas.e2e-spec.ts:296`                                                   | ✅     |
| Detalle en el pago y en la póliza     | `cuotas.e2e-spec.ts:330`; `DetallePagoSheet.test.tsx`; `PolizaDetallePage.test.tsx:119`                     | ✅     |
| Carrera de validaciones (D12)         | `prisma-pagos-aplicacion.repository.spec.ts:95,142,155`; `cuotas.e2e-spec.ts:375`                           | ✅     |

### HU-20 Listar pagos

| Criterio                                    | Evidencia                                                                                        | Estado |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ |
| Filtros por estado, fecha, póliza y cliente | `apps/api/test/pagos.e2e-spec.ts:274,294`; `PagosPage.test.tsx:226,271`; `filtros.spec.ts:67,92` | ✅     |
| Por validar primero                         | `pagos.e2e-spec.ts:274`                                                                          | ✅     |
| Paginado con el total del filtro            | `pagos.e2e-spec.ts:308`; `PagosPage.test.tsx:284`                                                | ✅     |

### HU-38 Cuotas por vencer y vencidas

| Criterio                                  | Evidencia                                                                 | Estado |
| ----------------------------------------- | ------------------------------------------------------------------------- | ------ |
| Próximos 7 días y vencidas                | `listar-cartera.use-case.spec.ts:44,54`; `cuotas.e2e-spec.ts:631,653,662` | ✅     |
| Filtros por cliente, aseguradora y fechas | `cuotas.e2e-spec.ts:669`; `CarteraPage.test.tsx:116,136`                  | ✅     |
| Columnas y días de atraso                 | `CarteraPage.test.tsx:74,91`; `cartera.spec.ts:12`                        | ✅     |

### HU-51 Cobertura y condiciones de la póliza

| Criterio                                             | Evidencia                                                                                                   | Estado |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ |
| Texto de hasta 2 000 caracteres                      | `apps/api/test/polizas.e2e-spec.ts:383`; `FormularioPoliza.test.tsx:141,154`                                | ✅     |
| Se captura al registrar y al editar                  | `FormularioPoliza.test.tsx:163,183`; `polizas.e2e-spec.ts:362,392`                                          | ✅     |
| El detalle muestra cobertura, condiciones y vigencia | `PolizaDetallePage.test.tsx:101`; `cartera.spec.ts:12`                                                      | ✅     |
| Catálogo de ramos de Oasis                           | `apps/api/prisma/migrations/20261026000000_cobertura_ramos_s5/migration.sql`; `polizas.e2e-spec.ts:195,352` | ✅     |

## 4. Definición de Terminado

| Punto                                     | Resultado                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`          | ✅ «Already up to date».                                                                                                                                                                                                                                                                                                                 |
| `pnpm -r build`                           | ✅ Chunk único de la SPA: 862,09 kB (262,29 kB gzip); aviso de chunk > 500 kB.                                                                                                                                                                                                                                                           |
| `pnpm lint`                               | ✅ 0 errores; 3 warnings preexistentes de `react-refresh` (`router.tsx` y `main.tsx`).                                                                                                                                                                                                                                                   |
| `pnpm format:check`                       | ✅ «All matched files use Prettier code style!».                                                                                                                                                                                                                                                                                         |
| `pnpm typecheck`                          | ✅ Los cuatro paquetes.                                                                                                                                                                                                                                                                                                                  |
| `pnpm deps:check`                         | ✅ Sin violaciones (277 módulos, 1002 dependencias).                                                                                                                                                                                                                                                                                     |
| `pnpm deps:check:negativo`                | ✅ La regla hexagonal falla cuando debe.                                                                                                                                                                                                                                                                                                 |
| `pnpm test`                               | ✅ Contratos 42 (21 Solidity + 21 `node:test`), API 60 suites/310 pruebas, SPA 52 archivos/421 pruebas.                                                                                                                                                                                                                                  |
| `pnpm --filter @oasis/api test:e2e`       | ✅ 17 suites/240 pruebas (51,341 s).                                                                                                                                                                                                                                                                                                     |
| Corrida acotada del verificador (Q16–Q18) | ✅ 2 suites/33 pruebas (15,018 s), sin respuestas 500.                                                                                                                                                                                                                                                                                   |
| `pnpm --filter @oasis/web test:e2e`       | ✅ 58/58 (3,7 min).                                                                                                                                                                                                                                                                                                                      |
| Docker Compose                            | ✅ postgres, redis y hardhat arriba; postgres y redis «healthy»; `docker compose config` sin errores.                                                                                                                                                                                                                                    |
| `pnpm dev:chain`, migraciones al día      | ✅ Contrato `0x5FbDB2315678afecb367f032d93F642f64180aa3`.                                                                                                                                                                                                                                                                                |
| `seed` dos veces                          | ✅ Idempotente: 906 clientes, 1067 pólizas, 7 pagos validados, 2 rechazados y 650 recibos.                                                                                                                                                                                                                                               |
| `backfill-aplicaciones.ts` dos veces      | ✅ 0 y 0 pagos por aplicar.                                                                                                                                                                                                                                                                                                              |
| `pnpm audit --prod --audit-level=high`    | ✅ **exit 0** tras retirar de `auditConfig` las excepciones de body-parser y multer (D26 d) y fijar con `overrides` las versiones corregidas: body-parser 2.4.0, multer 2.5.0 y effect 3.22.4. Quedan 9 avisos (2 bajas, 5 moderadas, 2 altas); las 2 altas son las excepciones documentadas de mysql2 y deepmerge-ts del CLI de Prisma. |
| PR y aceptación del Product Owner         | ⏳ Pendientes del autor.                                                                                                                                                                                                                                                                                                                 |

**Nota de proceso.** La suite de la SPA tuvo un falso rojo intermitente de jsdom (las esperas de
Testing Library de 1 s no alcanzaban bajo carga). Se estabilizó con
`configure({ asyncUtilTimeout: 3000 })` en `apps/web/src/test/setup.ts`, sin cambios de producto; tres
corridas consecutivas quedaron en 421/421. El primer intento de Playwright falló por falta del
binario de Chromium (entorno, no producto); tras `playwright install chromium`, 58/58.

## 5. Versiones exactas de las dependencias nuevas

Sin dependencias nuevas: `qrcode.react` (`^4.2.0`) ya estaba instalada desde antes del sprint. Al
retirar las excepciones de auditoría se fijaron con `overrides` en `pnpm-workspace.yaml` tres versiones
corregidas de dependencias transitivas, publicadas hace más de dos semanas: `body-parser` 2.4.0
(Express), `multer` 2.5.0 (NestJS) y `effect` 3.22.4 (`@prisma/config` y `@hookform/resolvers`). No se
tocó `package.json`; el cambio está en `pnpm-workspace.yaml` y el lockfile.

## 6. Decisiones y discrepancias

- **D1 · Arrastre de S4.** El T0 ejecutó el arrastre de la deuda de S4 antes de la Fase 1; lo que
  entró quedó registrado en D26.
- **D2 · Códigos de verificación.** `ESTADOS_VERIFICACION` = `AUTENTICO`, `NO_COINCIDE`, `EN_PROCESO`,
  `ANULADO` y `NO_ENCONTRADO`; el orden de decisión de `VerificarReciboUseCase` es el del plan.
- **D3 · CLIENTE y RN-07.** La verificación admite ADMIN, OPERADOR y CLIENTE; con el CLIENTE, el
  recibo ajeno responde exactamente como uno inexistente (mismo cuerpo, mismo 200 y sin consultar la
  cadena) y omite `hashOnchain` y `contractAddress`.
- **D4 · Límite por usuario.** `LimitePorUsuarioGuard` permite 30 consultas por minuto por
  `usuario.id` y responde 429 `DEMASIADAS_CONSULTAS` con `Retry-After`; el storage sigue en memoria
  (HT-08, S8).
- **D5 · Lenguaje llano.** El CLIENTE no ve hashes ni tecnicismos; el personal los ve en «Detalles
  técnicos», plegado por defecto.
- **D6 · Sal y payload fuera de la API.** El detalle del recibo ya no expone `payloadCanonico` ni la
  sal; el payload queda en la base para la verificación.
- **D7 · Recibo imprimible.** `reciboImprimibleSchema` sin sal, payload ni hashes, con identificación
  enmascarada (`******4065`); `GET /recibos/:id/imprimible` (personal) y
  `GET /mis-recibos/:id/imprimible` (CLIENTE; ajeno → 404).
- **D8 · Vista imprimible.** `ReciboImprimiblePage` compartida por las dos rutas, QR a
  `/recibos/verificar/<codigo>` y `@media print` A4 vertical con márgenes de 15 mm.
- **D9 · HU-24.** Sondeo cada 10 s mientras haya un recibo en curso, línea de tiempo del anclaje y
  enlace «Ver transacción» al explorador.
- **D10 · HU-26.** Botón «Reintentar anclaje» solo para ADMIN y solo con FALLIDO, auditado como
  `REINTENTAR`; el detalle lee «Último reintento» de la bitácora. La ruta real es `/bitacora`, no
  `/auditoria`.
- **D11 · Aplicación.** Cuota cubierta del todo → PAGADA; cubierta en parte → PARCIAL si aún no
  vence; una cuota **VENCIDA** abonada en parte **sigue VENCIDA** hasta cubrirse.
- **D12 · Bloqueo de cuotas.** La aplicación corre dentro de `validarYCrearRecibo` con
  `SELECT … FOR UPDATE` sobre las cuotas, la comprobación definitiva de RN-02 con las cuotas
  bloqueadas y una `AplicacionPago` por cuota tocada. Dos validaciones simultáneas se serializan.
- **D13 · Invariante.** Por póliza, Σ `Cuota.valorPagado` = Σ pagos VALIDADOS; los pagos validados en
  S4 se aplicaron una vez con `prisma/backfill-aplicaciones.ts` (idempotente, documentado en
  `docs/despliegue.md` §6.1).
- **D14 · Detalle de la aplicación.** `GET /pagos/:id` devuelve las aplicaciones y el recibo;
  `GET /polizas/:id/cuotas` devuelve las de cada cuota. La SPA muestra el detalle del pago en un
  `Sheet` y las aplicaciones en la póliza.
- **D15 · HU-20.** Filtros de `PagosPage` en la URL, orden por estado (REGISTRADO primero) y fecha
  descendente, y total del filtro sobre la tabla.
- **D16 · Cartera.** `GET /cuotas` con `vista=POR_VENCER|VENCIDAS|TODAS` (por defecto `TODAS`), «hoy»
  de Guayaquil sin depender del cron, `pendiente` y `diasAtraso`, y orden por vencimiento y número.
- **D17 · HU-51.** Columnas `cobertura` y `condiciones` (TEXT, opcionales, 2 000 caracteres),
  capturadas al registrar y al editar, y `PolizaDetallePage` con la vigencia, el plan y los pagos.
- **D18 · Ramos de Oasis.** La migración deja activos VIDA, ASISTENCIA_MEDICA, VEHICULOS,
  EQUIPOS_ELECTRONICOS, AEREO_DRONES y EQUIPOS_MAQUINARIA, y desactiva SALUD, INCENDIO y FIANZAS; las
  pólizas existentes se conservan (RN-09) y el seed usa los mismos códigos.
- **D19 y D20 · HT-16.** Política v1.0 como borrador para Oasis y los seis documentos de
  `docs/proteccion-datos/`; las citas legales de la LOPDP quedan «a validar por Oasis».
- **D21 · Punto de control.** Capturas a 1280 y 360 px antes del commit y espera del «aprobado» del
  autor (T22).
- **D22 · Horas.** El informe reporta solo horas de backlog, nunca horas reales (sección 8).
- **D23 · Pruebas.** TDD de la aplicación, la verificación, el guard del límite, la cartera y la
  máscara; e2e de `cuotas`, `verificacion`, `recibos`, `pagos` y `polizas`; Playwright de
  `recibos-verificacion`, `cartera`, `filtros` y `diseno` extendido.
- **D24 · `aplicarPagoACuotas` en `@oasis/shared`.** La función vive en `@oasis/shared/dominio` (no en
  `modules/pagos/domain/`), la importan el API y la SPA, y la vista previa del pago la usa con
  `GET /polizas/:id/cuotas`.
- **D25 · Componentes compartidos.** `LineaTiempo`, `RamoEtiqueta` y `LeyendaEstados` se reutilizan
  en las pantallas nuevas; las descripciones de `estados.ts` usan los códigos de D2.
- **D26 · Deuda que entra y queda.** Entraron las validaciones simultáneas (D12), los errores de Zod
  en dos tandas, la píldora de pendientes del riel y las excepciones de `pnpm audit` (D26 d). Quedan
  fuera, con su techo documentado, el ancla `/#polizas` en frío (HU-29), la recuperación de
  contraseña (HU-31), «Recordar este equipo», la búsqueda sin `unaccent` y las demás carreras
  administrativas.
- **Q16 · Carrera del plan.** `PUT /polizas/:id/cuotas` y el `PATCH` que cambia prima o vigencia
  bloquean las cuotas y recuentan los pagos VALIDADOS; si el recuento cambió responden **409
  `POLIZA_MODIFICADA`** (`CONFLICTO`) y nunca el 500 de la FK. El **422 `PLAN_CON_PAGOS_VALIDADOS`**
  sigue saliendo del caso de uso cuando los pagos ya estaban al leer la póliza.
- **Q17 · ANULADO sin cadena.** Un recibo anulado en la base responde `ANULADO` sin llamar al registro
  de recibos, aunque el RPC esté caído; `hashOnchain` queda `null` y al CLIENTE se le omite.
- **Q18 · Cartera solo de pólizas VIGENTES.** `GET /cuotas` excluye CANCELADAS y VENCIDAS en el
  `where` de la consulta y del conteo, combinado con los filtros de cliente y aseguradora.
- **`ajustarCuotas` en sitio.** Al cambiar la vigencia se actualizan las cuotas existentes en la misma
  transacción (no se recrean): la recreación daba 500 por la FK de `AplicacionPago` y perdía
  `valorPagado`.
- **`jobId` de la anulación.** BullMQ rechaza `:` en los identificadores; el job de anulación usa
  `anular-<id>`. El orden guardar → encolar queda como deuda de HU-27 (S6).
- **Auditoría de dependencias (D26 d).** Se retiraron de `auditConfig` las excepciones de body-parser y
  multer al ser la fecha del cierre posterior al 05/11/2026, y se fijaron con `overrides` las versiones
  corregidas (body-parser 2.4.0, multer 2.5.0 y effect 3.22.4). `pnpm audit --prod --audit-level=high`
  queda en verde; se mantienen las excepciones de mysql2 y deepmerge-ts porque llegan por el CLI de
  Prisma.

## 7. Impedimentos y observaciones

- **Docker Desktop sin integración WSL.** Los contenedores se manejaron con `docker.exe` desde WSL. Los
  contenedores se detuvieron una vez y hubo que reiniciarlos antes de las corridas.
- **Limpieza de la cola antes de las e2e.** Se borraron las claves `bull:anclaje-recibos:*` de Redis
  antes de las corridas del API para no arrastrar jobs del worker en proceso.
- **Falso rojo de la SPA.** Un fallo intermitente de jsdom en `FormularioPago.test.tsx` no era de
  producto: las esperas de Testing Library de 1 s no alcanzaban bajo carga. Se estabilizó con
  `configure({ asyncUtilTimeout: 3000 })` en `apps/web/src/test/setup.ts` (sin cambios de producto) y
  tres corridas consecutivas quedaron en 421/421.
- **Binario de Chromium ausente.** El primer Playwright completo falló porque faltaba el binario
  (`chromium_headless_shell-1243`); tras `playwright install chromium` la corrida quedó en 58/58.
- **`pnpm audit`.** Con las excepciones de body-parser y multer retiradas, el audit queda en verde solo
  con las versiones corregidas; se fijan con `overrides` (body-parser 2.4.0, multer 2.5.0 y effect
  3.22.4). Las de mysql2 y deepmerge-ts siguen como excepciones del CLI de Prisma.
- **Ramos retirados en una base nueva.** La migración de D18 crea SALUD, INCENDIO y FIANZAS inactivos
  aunque la base no venga del seed anterior; el e2e de HU-51.4 (422 `RAMO_INVALIDO`) necesita que el
  ramo exista.
- **Chunk de la SPA.** 862,09 kB (262,29 kB gzip), por encima del umbral de aviso de 500 kB; deuda sin
  sprint asignado.
- **Deriva de `ARQUITECTURA.md`.** Sigue con Alchemy en lugar de PublicNode, con PayPhone en §2 y en la
  tabla 4-1 (retirado del backlog v1.5) y con la tabla 6-1 sin las sesiones en Redis. No se editó: la
  fuente de verdad solo cambia con una decisión aceptada.

**Trabajo fuera del plan incluido en la rama** (no es una historia del S5):

- **Fase de diseño del 05/11/2026.** Se aprobaron ADR-030 (colores alineados con la landing) y ADR-031
  (diseño final Claroscuro v2), con `apps/web/DESIGN.md`, el prototipo navegable, el PDF de
  `docs/diseno/` y la fila de la tabla 11-1 de `ARQUITECTURA.md` (versión 1.6). `AGENTS.md` y
  `CLAUDE.md` dejan anotado que Claroscuro v2 está aprobado y **no implementado**, con la
  implementación pendiente de planificar.
- **Seed ampliado el 16/11/2026.** Se agregó una cartera de demostración y una bitácora de ejemplo
  (sin cambios de esquema; la última migración sigue siendo la del 26/10). El seed sigue siendo
  idempotente, verificado con dos corridas.

## 8. Horas de backlog

| Historia  |  Horas |
| --------- | -----: |
| HU-24     |      4 |
| HU-25     |      6 |
| HU-26     |      3 |
| HT-16     |      3 |
| HU-28     |     10 |
| HU-36     |      5 |
| HU-20     |      6 |
| HU-38     |      4 |
| HU-51     |      2 |
| **Total** | **43** |

Son las horas del backlog (D22); el informe no reporta horas reales.

## 9. Deuda y fuera de alcance

| Deuda                                                                                    | Sprint destino                 |
| ---------------------------------------------------------------------------------------- | ------------------------------ |
| `GET /pagos` del personal carga `recibo` sin usarlo (un join de más por página)          | S6                             |
| La verificación del CLIENTE no tiene entrada en `BarraInferiorCliente`                   | S6 (HU-29)                     |
| Orden guardar → encolar de la anulación                                                  | S6 (HU-27)                     |
| `cambiarEstado` no bloquea las cuotas (cancelación concurrente con un reemplazo de plan) | S6 (historia de estados/HU-27) |
| Chunk único de la SPA > 500 kB                                                           | Sin sprint asignado            |
| Deriva de `ARQUITECTURA.md` (Alchemy/PublicNode, PayPhone y tabla 6-1 sin sesiones)      | Sin sprint asignado            |
| Implementación de Claroscuro v2                                                          | Pendiente de planificar        |

Fuera de alcance, sin cambios: lista de recibos y saldo en el portal (HU-29 y HU-15, S6), anulación
con motivo (HU-27, S6), correo de validación con el enlace (HU-39, S6), PDF descargable generado en el
servidor (HU-41, S9) y contadores del límite de tasa en Redis (HT-08, S8).

## 10. Acciones del autor

- [ ] **T22 · Punto de control visual.** Capturas a 1280 y 360 px de las pantallas nuevas; no se
      ejecutaron en este encargo. Es el punto de control pendiente.
- [ ] Aprobar el punto de control, hacer push y abrir el PR (preparados, no ejecutados).
- [ ] Aceptación del Product Owner.
- [ ] De S4: crear la billetera fría, ejecutar `transferir-admin` en Amoy para cerrar HT-15.1, hacer
      las pruebas manuales con teclado y lector de pantalla y presentar el sprint al Product Owner.
- [ ] De HT-16: completar los datos de Oasis, revisar la política v1.0 antes del 16/11 y validar las
      citas de la LOPDP marcadas «a validar por Oasis».
- [ ] Revisión del 13/11 con Oasis: pedir los Excel de cartera para HU-34 (S6) y entregar la política
      de tratamiento de datos.

## 11. Pruebas manuales

| Prueba                                                                         | Resultado                                                                                                          |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Imprimir un recibo a PDF A4 y comprobar que cabe en una hoja                   | ⏳ Pendiente del autor: depende del punto de control (T22). `emulateMedia('print')` cubre el CSS de impresión      |
| Escanear el QR con un teléfono en la misma red (`pnpm dev --host`) y verificar | ⏳ Pendiente del autor. La prueba automatizada cubre el QR y el retorno tras el login                              |
| Lector de pantalla en la verificación y en la cartera                          | ⏳ Pendiente del autor. Vitest y Playwright leen nombres accesibles, pero no hay lector en el entorno de ejecución |

No se ejecutaron en este encargo porque dependen del punto de control del autor.

## 12. Cómo verificar

```bash
pnpm install --frozen-lockfile
pnpm -r build && pnpm lint && pnpm format:check && pnpm typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test
docker.exe compose -f compose.dev.yaml up -d          # Docker Desktop sin integración WSL
pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy
pnpm --filter @oasis/api seed
pnpm --filter @oasis/api exec tsx prisma/backfill-aplicaciones.ts
pnpm --filter @oasis/api test:e2e
pnpm --filter @oasis/web exec playwright install chromium
pnpm --filter @oasis/web test:e2e
pnpm audit --prod --audit-level=high
```

`pnpm dev:chain` despliega el contrato en `localhost:8545` y escribe la dirección en
`apps/api/.env`; las demás corridas usan la infraestructura de Compose. El `seed` y el backfill son
idempotentes.
