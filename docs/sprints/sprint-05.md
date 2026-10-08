# Sprint 5 — Gestión de clientes y registro de pólizas

- **Historias:** HU-08 Editar y desactivar cliente (4 h), HU-09 Buscar clientes (5 h), HU-12
  Registrar póliza (8 h), HU-13 Editar póliza y su estado (4 h) y HU-14 Listar pólizas (3 h) — 24 de
  25 horas de capacidad (tabla 6-1 del backlog).
- **Épicas:** EP-02 (HU-08 y HU-09) y EP-03 (HU-12, HU-13 y HU-14).
- **Rama:** `feat/sprint-05-clientes-polizas` (sin publicar).
- **Fechas:** 05/10/2026 – 09/10/2026 (tabla 6-1 del backlog); verificación ejecutada el
  07/10/2026 sobre la rama del sprint.
- **Ejecución:** OpenCode con agentes coordinados (`.opencode/agents/`, tabla 0.1 del plan).
- **Estado:** criterios de aceptación completados; pendientes de la DoD que dependen de terceros
  (PR, CI en GitHub y aceptación del Product Owner).

> Verificación ejecutada el **07/10/2026** sobre la rama del sprint; reproducible con los comandos
> de la sección 11.

## 1. Objetivo

Cerrar la gestión del cliente (editar contacto sin romper la trazabilidad, desactivar sin borrar y
buscar por identificación o nombre) y el ciclo básico de la póliza (registrar, editar una vigente,
cambiar su estado a VENCIDA o CANCELADA y listar con filtros y orden por vigencia), incluida RN-01
en el registro de pagos. El contrato compartido se congela primero (esquemas Zod y ADR-018); después
el API y la SPA se implementan en paralelo contra él.

## 2. Entregables

| Entregable                                                               | Ubicación                                                                                                                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Esquemas de cliente, póliza, ramo y auditoría; `montoPositivoSchema`     | `packages/shared/src/schemas/{cliente,poliza,ramo,common}.schema.ts`, `constants/{estados,auditoria}.ts`                                |
| ADR-018 Ciclo de vida de la póliza                                       | `docs/adr/ADR-018-ciclo-vida-poliza.md`, `docs/adr/README.md`                                                                           |
| Clientes: edición con identificación fija, desactivar y reactivar        | `apps/api/src/modules/clientes/`                                                                                                        |
| Clientes: búsqueda por palabras, filtro por estado y `_count` sin N+1    | `apps/api/src/modules/clientes/infrastructure/persistence/prisma-clientes.repository.ts`                                                |
| `GET /ramos` de solo lectura                                             | `apps/api/src/modules/polizas/presentation/http/ramos.controller.ts`                                                                    |
| Pólizas: crear, editar, cambiar estado y listar; `DELETE` retirado       | `apps/api/src/modules/polizas/`                                                                                                         |
| RN-01 en el registro de pagos                                            | `apps/api/src/modules/pagos/application/use-cases/pagos.use-cases.ts`, `application/ports/pagos.repository.port.ts`                     |
| Bitácora: acción `CAMBIAR_ESTADO` con `estado` en el detalle             | `apps/api/src/modules/auditoria/domain/registro-auditoria.ts`                                                                           |
| `ClientesPage` con edición, estado, filtro y búsqueda                    | `apps/web/src/features/clientes/pages/ClientesPage.tsx`, `components/FormularioCliente.tsx`                                             |
| `SelectorCliente` (combobox ARIA 1.2 compartido)                         | `apps/web/src/features/clientes/components/SelectorCliente.tsx`                                                                         |
| `PolizasPage` y `FormularioPoliza` con filtros, orden y cambio de estado | `apps/web/src/features/polizas/pages/PolizasPage.tsx`, `components/FormularioPoliza.tsx`                                                |
| e2e del API y Playwright                                                 | `apps/api/test/{clientes,polizas,pagos-rn01,acceso-por-rol,bitacora}.e2e-spec.ts`, `apps/web/e2e/{clientes-polizas,responsive}.spec.ts` |
| Agentes de OpenCode                                                      | `.opencode/agents/{orquestador,contrato-shared,backend-api,frontend-spa,verificador,revisor}.md`                                        |
| Documentación                                                            | `CLAUDE.md`, este informe                                                                                                               |

## 3. Criterios de aceptación — HU-08, HU-09, HU-12, HU-13 y HU-14

| #   | Criterio                                          | Evidencia                                                                                                                                                  |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | HU-08.1 editar datos de contacto                  | `clientes.use-cases.spec.ts`; `clientes.e2e-spec.ts` «edita los datos de contacto…»; `ClientesPage.test.tsx`; `clientes-polizas.spec.ts`                   |
| 2   | HU-08.2 identificación fija con pólizas           | `clientes.use-cases.spec.ts`; `clientes.e2e-spec.ts` «no permite cambiar la identificación…»; `FormularioCliente.test.tsx`                                 |
| 3   | HU-08.3 desactivar no elimina (RN-09)             | `clientes.use-cases.spec.ts`; `clientes.e2e-spec.ts` «desactiva sin borrar…» y «la bitácora registra DESACTIVAR y REACTIVAR»; `clientes-polizas.spec.ts`   |
| 4   | HU-08.4 inactivo fuera del registro de pólizas    | `polizas.use-cases.spec.ts`; `polizas.e2e-spec.ts` «rechaza una póliza para un cliente inactivo»; `SelectorCliente.test.tsx`; `clientes-polizas.spec.ts`   |
| 5   | HU-09.1 búsqueda por identificación o nombre      | `prisma-clientes.repository.spec.ts`; `clientes.e2e-spec.ts` «busca por identificación, por nombre y por "nombre apellido"»; `ClientesPage.test.tsx`       |
| 6   | HU-09.2 paginación de 20 en 20                    | `esquemas-compartidos.spec.ts`; `clientes.e2e-spec.ts` «pagina el listado de 20 en 20»                                                                     |
| 7   | HU-09.3 filtro activos e inactivos                | `esquemas-compartidos.spec.ts`; `clientes.e2e-spec.ts` «desactiva sin borrar…»; `ClientesPage.test.tsx`                                                    |
| 8   | HU-12.1 número único, cliente, aseguradora, ramo… | `polizas.use-cases.spec.ts`; `polizas.e2e-spec.ts` «crea una póliza VIGENTE…» y «rechaza número duplicado y ramo inexistente»; `FormularioPoliza.test.tsx` |
| 9   | HU-12.2 fin posterior al inicio                   | `esquemas-compartidos.spec.ts`; `polizas.e2e-spec.ts` «rechaza fin igual al inicio y primas inválidas»                                                     |
| 10  | HU-12.3 prima > 0 con dos decimales (RN-10)       | `esquemas-compartidos.spec.ts`; `polizas.e2e-spec.ts` (mismo caso: `0` y `1.234` → 400)                                                                    |
| 11  | HU-12.4 nace VIGENTE                              | `polizas.use-cases.spec.ts`; `polizas.e2e-spec.ts` «crea una póliza VIGENTE…»                                                                              |
| 12  | HU-13.1 VENCIDA o CANCELADA con confirmación      | `polizas.use-cases.spec.ts`; `polizas.e2e-spec.ts` «cancela, bloquea cambios posteriores y lo audita»; `PolizasPage.test.tsx`; `clientes-polizas.spec.ts`  |
| 13  | HU-13.2 no vigente sin pagos (RN-01)              | `pagos.use-cases.spec.ts`; `validar-pago.use-case.spec.ts`; `pagos-rn01.e2e-spec.ts` (4 casos); ADR-018                                                    |
| 14  | HU-13.3 prima fija con pagos validados            | `polizas.use-cases.spec.ts`; `polizas.e2e-spec.ts` «bloquea la prima con pagos validados…»; `FormularioPoliza.test.tsx`                                    |
| 15  | HU-14.1 filtros cliente, aseguradora y estado     | `polizas.e2e-spec.ts` «filtra por cliente, aseguradora y estado…»; `PolizasPage.test.tsx`                                                                  |
| 16  | HU-14.2 paginado                                  | `polizas.e2e-spec.ts` (mismo caso con `pageSize` 2)                                                                                                        |
| 17  | HU-14.3 orden por fin de vigencia                 | `polizas.e2e-spec.ts` (`fechaFinAsc`/`fechaFinDesc`); `PolizasPage.test.tsx`; `clientes-polizas.spec.ts`                                                   |
| 18  | Rutas y roles nuevos; `DELETE /polizas/:id` fuera | `acceso-por-rol.e2e-spec.ts` «la matriz cubre las rutas nuevas y no la retirada» (401/403); `polizas.e2e-spec.ts` «DELETE /polizas/:id ya no existe» (404) |
| 19  | `GET /ramos`: 5 ramos del seed, CLIENTE → 403     | `polizas.e2e-spec.ts` «lista los ramos activos del seed y el CLIENTE no accede»                                                                            |
| 20  | Bitácora con `CAMBIAR_ESTADO` y su `estado`       | `bitacora.e2e-spec.ts` «registra el cambio de estado de una póliza…»; `registro-auditoria.spec.ts`                                                         |
| 21  | 360 px con diálogos abiertos                      | `responsive.spec.ts` «sin desborde a 360 px con los diálogos abiertos (HU-08 a HU-12)»                                                                     |

## 4. Definición de Terminado (§2.3 del backlog)

| Ítem                                                        | Estado   | Nota                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cumple todos sus criterios de aceptación                    | ✅       | Sección 3.                                                                                                                                                                                                                                                        |
| Pruebas automatizadas y CI en verde                         | ✅ local | 30 contratos + 174 API (39 suites) + 148 SPA (17 archivos) + 162 e2e del API (11 suites) + 11 de Playwright; `lint`, Prettier, `typecheck`, `deps:check`, `deps:check:negativo` y build en verde. El CI se ejecuta al abrir el PR: no se publica desde el agente. |
| Código integrado en la rama principal mediante pull request | ⏳       | El usuario hace push y abre el PR.                                                                                                                                                                                                                                |
| Funciona en el entorno de desarrollo con Docker Compose     | ✅       | PostgreSQL 17 y Redis 7 con `compose.dev.yaml` (cliente `docker.exe`); nodo Hardhat en contenedor; dev:chain, migrate + seed, e2e y Playwright contra esos contenedores.                                                                                          |
| Documentación afectada actualizada                          | ✅       | ADR-018, `docs/adr/README.md`, `CLAUDE.md` y este informe. `apps/api/src/modules/README.md` no lista las acciones de auditoría, así que no requería cambios.                                                                                                      |
| El Product Owner la aceptó en la revisión del sprint        | ⏳       | Pendiente de la revisión semanal.                                                                                                                                                                                                                                 |

## 5. Versiones exactas

Sin altas de dependencias: el sprint solo usó lo ya instalado (shadcn/ui, Radix, TanStack Query,
RHF, Zod). Tras la revisión se retiró `@tanstack/react-table`, que seguía instalada sin uso desde
HT-04. Se mantienen Node.js 24, pnpm 12.3.4, NestJS 11.2.6, Prisma 7.10.0, TypeScript 6.0.3,
Zod 4.6.5, React 19.3 y Playwright 1.63.

## 6. Decisiones y discrepancias

**Decisiones (ADR):** ADR-018 fija el ciclo de vida de la póliza (nace VIGENTE; solo una vigente
cambia a VENCIDA o CANCELADA, ambos terminales; renovar es crear otra póliza; sin borrado; los
bloqueos de edición y RN-01). El informe pide al autor agregarlo a la tabla 11-1.

**Discrepancias entre los documentos y la realidad:**

1. `crearPolizaSchema` cambió la entrada de `ramo: string` (código o nombre) a `ramoId: uuid` y ya
   no acepta `estado`: la SPA usa el `Select` del catálogo (`GET /ramos`) y la póliza siempre nace
   VIGENTE (D9).
2. Se retiró `DELETE /polizas/:id` con su caso de uso y su método de repositorio (D13, RN-09); el
   API responde 404 y la matriz de acceso/cobertura lo verifica.
3. RN-01 se aplicó ya en `CrearPagoUseCase` (D14) y también en `ValidarPagoUseCase` —si la póliza
   se cancela entre el registro y la validación, la validación responde 422 y no emite recibo—
   aunque el registro de pagos de la SPA llegue con HU-16 (S6); era el criterio de HU-13 con
   evidencia en este sprint.
4. La tabla 6-1 de la arquitectura dice NestJS 12 y se usa 11 (limitación conocida desde S1).
5. Un `PATCH /polizas/:id` que envía las dos fechas invertidas responde **400** (lo corta el
   `superRefine` del esquema); el 422 `VALIDACION` de `fechaFin` cubre solo una fecha suelta contra
   la guardada. Se documenta el contrato tal como quedó (nota m5 de la revisión).
6. La búsqueda de clientes no es insensible a tildes (`ILIKE` sin `unaccent`): deuda anotada con un
   comentario `ponytail:` en el repositorio (D8).
7. Al guardar una póliza, el caso de uso no escribe `estado`: confía en el `@default(VIGENTE)` del
   esquema Prisma, única fuente del valor (desvío anotado en la revisión de Fase 2).

## 7. Impedimentos y observaciones

- **Fase paralela (API y SPA).** Funcionó como previó el plan: el contrato se cerró en la Fase 1 y
  ninguno de los dos agentes esperó al otro. El único punto de contacto externo, `GET /ramos`
  (arreglo plano `[{ id, codigo, nombre }]`), se había anotado como supuesto en la nota de la SPA y
  coincidió con el API real; no hubo que realinear nada.
- **Conflictos entre fronteras.** El `verificador` encontró un bug de producto del combobox
  (Escape cerraba el `Dialog` además de la lista) y lo dejó en rojo como evidencia; el orquestador
  lo devolvió a `frontend-spa`, que lo corrigió con `onEscapeKeyDown` + `defaultPrevented` en
  `PolizasPage.tsx` y una prueba de Vitest nueva. La re-verificación quedó 161/161 y 11/11.
- **Rondas de revisión.** Una ronda del `revisor` (1 bloqueante, 5 menores, 3 deudas) y una única
  ronda de confirmación, que aprobó sin hallazgos nuevos. El bloqueante era `PATCH /polizas/:id`
  con `aseguradoraId` inexistente: `P2003` sin traducir → 500; se corrigió validando la aseguradora
  en el caso de uso (404), con prueba rojo→verde.
- **Revisión posterior al commit.** Una segunda lectura del commit `9513b94` dejó 8 hallazgos
  (ninguno bloqueante); se corrigieron todos y se re-verificó:
  - RN-01 también al validar el pago (`ValidarPagoUseCase`): una póliza cancelada entre el registro
    y la validación devuelve 422 y no emite recibo; con unitarias y un caso e2e nuevo.
  - Escrituras condicionales en el repositorio de pólizas (`updateMany` con `estado: 'VIGENTE'` y,
    si viaja la prima, `pagos: { none: VALIDADO }`): una carrera responde 409 `POLIZA_MODIFICADA`
    en vez de aplicar un cambio sobre datos ya obsoletos.
  - El `PATCH` valida ramo y aseguradora solo si cambian (un catálogo desactivado en S15 no romperá
    la edición de otros campos).
  - `numeroDuplicado` vive una sola vez en `polizas/domain/errores.ts`; el caso de uso y el
    repositorio lo importan.
  - Un solo `CambiarActivoClienteUseCase.ejecutar(id, activo)` reemplaza los dos casos de uso
    gemelos de desactivar y reactivar.
  - `FormularioPoliza` usa un componente `Campo` para los siete campos (ids y `aria-describedby`
    consistentes) y `manejarError` solo asigna errores a campos montados; el resto va a toast.
  - `SelectorCliente` ya no sincroniza con `useRef` + `useEffect`: `PolizasPage` lo remonta con una
    `key` al limpiar filtros y el diálogo lo desmonta al cerrarse.
  - Se retiró `@tanstack/react-table` (no se usaba).
  - Cierre tras las correcciones: 174 API (39 suites), 148 SPA, 162 e2e del API y 11 de Playwright,
    con `lint`, Prettier, `typecheck`, `deps:check`, `deps:check:negativo` y build en verde; commit
    `fix(repo): atender los hallazgos de la revisión del sprint 5`.
- **Entorno.** Docker Desktop estaba apagado al empezar la Fase 3; se arrancó desde Windows y se
  levantó `compose.dev.yaml` con `docker.exe` (la distro WSL no tiene cliente `docker`). El nodo
  Hardhat del contenedor ocupa 8545, así que `start-servicios.mjs` de Playwright se sustituyó por
  API y worker lanzados a mano para que `reuseExistingServer` los reuse. `CONTRACT_ADDRESS` no está
  definido en el entorno de WSL, así que no pisó el `.env`. Antes de los e2e del API se detuvo el
  worker (evita la carrera de doble anclaje en `idempotencia-anclaje`) y `bull:anclaje-recibos:*` se
  limpió con el worker detenido.
- El `revisor` no tuvo `shell`: revisó por lectura del árbol y las notas, y el orquestador confirmó
  con `git status` que no hay archivos tocados fuera de las fronteras de la tabla 0.1.
- El hook `pre-commit` (lint-staged) no se ejecutó con `--no-verify`: el commit se hizo con
  `lint`, `format:check`, `typecheck` y pruebas del monorepo en verde.

## 8. Deuda y trabajo fuera de alcance (para sprints siguientes)

- Desactivar un cliente no toca su `Usuario` ni sus sesiones (HU-05, S10).
- Búsqueda insensible a tildes (`unaccent`), con el comentario `ponytail:` correspondiente (D8).
- Ficha del cliente con pólizas y pagos (HU-10, S10) y saldo pendiente (HU-15, S10).
- Registro, validación y rechazo de pagos desde la SPA (HU-16, S6); del módulo de pagos solo se tocó
  RN-01.
- Administrar catálogos (HU-46, S15): `GET /ramos` es de solo lectura.
- Importación desde archivo (HU-34, S13).
- Firefox y WebKit en Playwright (HT-09, S15).
- «Vigencia» no muestra la dirección del orden con un icono (solo `aria-sort`); alias de `Ramo`,
  `OrdenPoliza` y `FiltroEstadoCliente` en `types/index.ts`; `scope="col"` en el componente de
  tabla (pre-existente de S4).

## 9. Acciones del autor

- Agregar **ADR-018** a la tabla 11-1 de `docs/referencia/ARQUITECTURA.md` (el agente no edita
  `docs/referencia/`).
- Aceptación del Product Owner en la revisión del sprint, push y PR.

## 10. Pruebas manuales

Ejecutadas de forma asistida:

- El OPERADOR busca un cliente creado por la prueba, lo edita, lo desactiva con confirmación y
  comprueba que desaparece de "Activos"; en "Nueva póliza" el combobox no lo ofrece; lo reactiva,
  registra una póliza, ordena por vigencia, filtra por estado y cancela la póliza con confirmación
  (la fila deja de ofrecer acciones) — `clientes-polizas.spec.ts`.
- `/clientes` y `/polizas` a 360 px con los diálogos y la lista del combobox abiertos, sin
  `scrollWidth > 360` — `responsive.spec.ts`.
- Teclado en el combobox (↑/↓/Enter/Escape) dentro del diálogo, sin que Escape cierre el diálogo —
  prueba de `clientes-polizas.spec.ts` y `PolizasPage.test.tsx`.
- Por el API (curl, servicio local): desactivar un cliente → no aparece en `ACTIVOS` y
  `POST /polizas` responde 422 `CLIENTE_INACTIVO`; reactivarlo → aparece y la póliza se crea 201
  VIGENTE; cancelar la póliza → 200; un pago sobre ella → 422 `POLIZA_NO_VIGENTE`.

Pendientes de una persona:

- Lector de pantalla sobre las opciones del combobox (`aria-activedescendant`), la ayuda de
  identificación bloqueada y los errores por campo de los formularios.

## 11. Cómo verificar

```bash
# Calidad (sin infraestructura)
pnpm install --frozen-lockfile
pnpm -r build && pnpm -r lint && pnpm format:check && pnpm -r typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test                       # 30 contratos + 174 API + 148 SPA

# Infraestructura (PostgreSQL y Redis con compose; nodo Hardhat aparte)
docker compose -f compose.dev.yaml up -d
pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy   # sin migraciones nuevas
pnpm --filter @oasis/api seed
pnpm test:e2e                   # 11 suites, 162 pruebas
pnpm --filter @oasis/web test:e2e   # Playwright: 11 pruebas
```
