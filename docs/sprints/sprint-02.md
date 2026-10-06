# Sprint 2 — Contrato en Amoy y bitácora de auditoría

- **Historias:** HT-02 Contrato inteligente RegistroRecibos (18 h) y HU-45 Bitácora de auditoría
  (6 h) — 24 de 25 horas de capacidad.
- **Épicas:** EP-05 Recibos y blockchain, y EP-09 Reportes y auditoría.
- **Rama:** `feat/sprint-02-contrato-bitacora` (sin publicar).
- **Fechas reales:** 01/10/2026 – 05/10/2026; el despliegue en Amoy se firmó el 05/10/2026.
- **Estado:** criterios de aceptación completados; pendientes de la DoD que dependen de terceros
  (PR, CI en GitHub y aceptación del Product Owner).

> Verificación ejecutada el **05/10/2026** sobre la rama del sprint; reproducible con los comandos
> de la sección 12.

## 1. Objetivo

Cerrar HT-02 con el contrato `RegistroRecibos` congelado, probado y analizado, y **desplegado y
verificado en Amoy** con un hash de prueba registrado por la cuenta operadora; y cerrar HU-45 con
la bitácora de auditoría de solo inserción, capturada de forma declarativa y consultable por el
ADMIN en el API y en la SPA.

## 2. Entregables

| Entregable                                                                     | Ubicación                                                                                                                   |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 30 pruebas del contrato (18 Solidity + 12 viem), con errores exactos y eventos | `packages/contracts/test/RegistroRecibos.t.sol`, `.test.ts`                                                                 |
| Reportes de cobertura y gas regenerados                                        | `packages/contracts/REPORTE-COBERTURA.md`, `REPORTE-GAS.md`                                                                 |
| Slither sobre el archivo del contrato (`fail_on: medium`)                      | `packages/contracts/slither.config.json`, job `slither` de `.github/workflows/ci.yml`                                       |
| Red `amoyOperador` y scripts de operación                                      | `packages/contracts/hardhat.config.ts`, `scripts/cuentas.ts`, `scripts/grant-registrador.ts`, `scripts/registrar-prueba.ts` |
| Despliegue de Ignition versionado                                              | `packages/contracts/ignition/deployments/chain-80002/`                                                                      |
| Catálogo y esquemas compartidos de auditoría                                   | `packages/shared/src/constants/auditoria.ts`, `schemas/auditoria.schema.ts`                                                 |
| Módulo hexagonal `auditoria`                                                   | `apps/api/src/modules/auditoria/`                                                                                           |
| Decorador e interceptor global                                                 | `apps/api/src/common/auditoria/auditar.decorator.ts`, `.../auditoria.interceptor.ts`                                        |
| Migración de solo inserción (RN-17)                                            | `apps/api/prisma/migrations/20261001213141_bitacora_solo_insercion/`                                                        |
| `GET /api/v1/bitacora` (ADMIN, con filtros)                                    | `apps/api/src/modules/auditoria/presentation/http/bitacora.controller.ts`                                                   |
| Página "Bitácora" (ADMIN)                                                      | `apps/web/src/features/auditoria/`, `router.tsx`, `AppLayout.tsx`                                                           |
| ADR-008 y ADR-013                                                              | `docs/adr/ADR-008-contrato-inmutable.md`, `docs/adr/ADR-013-bitacora-auditoria.md`                                          |
| Documentación                                                                  | `docs/despliegue.md`, `README.md`, `CLAUDE.md`, `apps/api/src/modules/README.md`                                            |

## 3. Criterios de aceptación — HT-02

| #   | Criterio                                                                                                         | Evidencia                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `registrar` solo con `REGISTRADOR_ROLE`; rechaza identificadores repetidos y hash cero; emite `ReciboRegistrado` | Pruebas con los errores exactos (`AccessControlUnauthorizedAccount`, `ReciboYaRegistrado`, `IdReciboInvalido`, `HashReciboInvalido`) y aserción del evento; 30 pruebas en verde. |
| 2   | `anular`, `verificar`, `pause` y `unpause` funcionan según los roles                                             | Incluye `unpause` sin admin y anular con el contrato pausado (la pausa solo detiene registros nuevos, arquitectura §5.4).                                                        |
| 3   | Cobertura ≥ 90 % y reporte de gas por función                                                                    | `REPORTE-COBERTURA.md`: 100 % de líneas (23/23); `REPORTE-GAS.md`: `registrar` 78 411–78 423 (media 78 417); en Amoy, 84 242 (RNF-07: ≤ 100 000).                                |
| 4   | Slither sin hallazgos de severidad alta                                                                          | `0 result(s) found` con `fail_on: medium` (más estricto que RNF-14); job `slither` del CI.                                                                                       |
| 5   | Desplegado y verificado en Amoy, con script que registra un hash de prueba                                       | Sección 7: dirección, PolygonScan `#code`, Sourcify y salida de `registrar-prueba` (idempotente en la segunda ejecución).                                                        |
| 6   | El ABI tipado se exporta a `packages/shared`                                                                     | `export-abi` → 32 entradas y `git diff --exit-code packages/shared/src/abi` sin cambios; control de deriva en CI.                                                                |

## 4. Criterios de aceptación — HU-45

| #   | Criterio                                                                                            | Evidencia                                                                                                                                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Se registran creación, modificación, validación, rechazo, anulación, inicio de sesión e importación | `auditoria-cobertura.spec.ts` exige `@Auditar` en los 15 handlers de mutación; e2e de bitácora (7 casos) y aserción `VALIDAR` en `flujo-anclaje`. `IMPORTAR` queda declarada en el catálogo y la prueba de cobertura obligará a instrumentarla en S13. |
| 2   | Cada registro guarda usuario, fecha, IP, entidad afectada y acción                                  | Columnas de `BitacoraAuditoria`; e2e caso 1 (inicio de sesión con usuario, IP y ruta).                                                                                                                                                                 |
| 3   | Los registros no se modifican ni eliminan desde la aplicación (RN-17)                               | Trigger de PostgreSQL para UPDATE, DELETE y TRUNCATE; el puerto solo ofrece `registrar` y `listar`; e2e caso 7 comprueba los tres rechazos y que la fila queda intacta.                                                                                |
| 4   | El ADMIN consulta la bitácora con filtros por usuario, acción y fecha                               | `GET /api/v1/bitacora` con fechas de Ecuador (UTC−5); e2e casos 4 a 6 (filtros, rango invertido → 400, OPERADOR → 403); página `/bitácora` con sus 3 pruebas de Vitest.                                                                                |

## 5. Definición de Terminado (§2.3 del backlog)

| Ítem                                                        | Estado   | Nota                                                                                                                                                                                          |
| ----------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cumple todos sus criterios de aceptación                    | ✅       | Secciones 3 y 4.                                                                                                                                                                              |
| Pruebas automatizadas y CI en verde                         | ✅ local | 30 contratos + 76 API (14 suites) + 36 SPA + 17 e2e del API (4 suites) + 1 de Playwright; Slither 0 hallazgos. El CI se ejecuta al abrir el PR: esta entrega no se publica desde el agente.   |
| Código integrado en la rama principal mediante pull request | ⏳       | El usuario hace push y abre el PR.                                                                                                                                                            |
| Funciona en el entorno de desarrollo con Docker Compose     | ✅       | PostgreSQL 17 y Redis 7 con `compose.dev.yaml` (cliente `docker.exe`); migración, seed, e2e y Playwright contra esos contenedores. El nodo Hardhat corre nativo, como permite el plan (§9.1). |
| Documentación afectada actualizada                          | ✅       | `README.md`, `CLAUDE.md`, `docs/adr/` (ADR-008, ADR-013), `docs/despliegue.md`, `apps/api/src/modules/README.md` y este informe.                                                              |
| El Product Owner la aceptó en la revisión del sprint        | ⏳       | Pendiente de la revisión semanal.                                                                                                                                                             |

## 6. Versiones exactas

| Componente                         | Versión                                                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Node.js                            | 24 en CI (`.nvmrc`, `engines >=24 <27`); la verificación usó 26.7.0 (Node de Windows que ejecuta pnpm) y en WSL había 22.22.1 |
| pnpm                               | 12.3.4 (`packageManager`)                                                                                                     |
| Hardhat                            | 3.18.0                                                                                                                        |
| hardhat-ignition / hardhat-verify  | 3.1.8 / 3.1.1                                                                                                                 |
| OpenZeppelin Contracts             | 5.6.1                                                                                                                         |
| solc                               | 0.8.28                                                                                                                        |
| Slither                            | 0.11.6                                                                                                                        |
| NestJS / Prisma / TypeScript / Zod | 11.2.6 / 7.10.0 / 6.0.3 / 4.6.5 (sin cambios desde S1)                                                                        |

## 7. Despliegue en Amoy

| Elemento                              | Valor                                                                                                                                                                                                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dirección del contrato                | `0x8B35226ee6A233dFe76F91940A7Ae2a4cA69F60b`                                                                                                                                                                                                                                              |
| Despliegue (admin)                    | tx `0x9d8f6508df047d6f357d79a7684032f43c04ff7dad7075e94190b368d990d7c6` · bloque 49 418 753 · gas 566 793 · ≈ 0,018137 POL                                                                                                                                                                |
| Cuenta admin (`DEFAULT_ADMIN_ROLE`)   | `0xf0992d47ac1fe44067b5ccf367024d8f6957e897`                                                                                                                                                                                                                                              |
| Cuenta operadora (`REGISTRADOR_ROLE`) | `0x07132217d5c7b412673bc997ba11bf0adf1044ac`                                                                                                                                                                                                                                              |
| `grantRole` (admin)                   | tx `0xa24269adef57eedcc2b2c0304536daae7afb605a48b7481a5256dfcd60edeb0b` · bloque 49 419 132 · gas 61 557 · ≈ 0,002499 POL                                                                                                                                                                 |
| Hash de prueba (operadora)            | id `0x5d9af3a7c29ff8fe131f8b148d3dbbc9ba4622b8d645b4baf1768b9dd25dc713` · hash `0xb7edceb7d880d50fec76179abb819eb6ab73ddbf1dd3b305b3d6d0a2204c6553` · tx `0xeec28204772749f55fedcea46ae7e41851192a0ccf964cc713e3dc6dd800e0fb` · bloque 49 419 171 · gas 84 242 · 0,002688372831655118 POL |
| `verificar(id)`                       | `existe=true`, `hash=0xb7edceb7…`, `registradoEn=2026-10-05T23:06:45.000Z`, `anulado=false`                                                                                                                                                                                               |
| Código verificado                     | [PolygonScan](https://amoy.polygonscan.com/address/0x8B35226ee6A233dFe76F91940A7Ae2a4cA69F60b#code) y [Sourcify](https://sourcify.dev/server/repo-ui/80002/0x8B35226ee6A233dFe76F91940A7Ae2a4cA69F60b)                                                                                    |

El costo total del sprint en Amoy fue ≈ 0,0233 POL (despliegue + rol + registro), dentro del
presupuesto de ≈ 0,055 POL. El gas real de `registrar` (84 242) cumple RNF-07 con margen. El
error `HHE80027` de Blockscout durante `ignition verify` es esperado: Amoy no tiene Blockscout
configurado; PolygonScan y Sourcify sí verifican.

## 8. Decisiones y discrepancias

**Decisiones (ADR):** ADR-008 (contrato inmutable, sin proxy) y ADR-013 (bitácora declarativa y de
solo inserción).

**Discrepancias entre los documentos y la realidad:**

1. La matriz 8-1 del ERS v1.2 asigna HT-02 a S1 y HT-03 a S0; manda el backlog: HT-02 es de S2.
2. `rpc-amoy.polygon.technology` ya no resuelve (verificado el 01/10/2026): la documentación cita
   `https://polygon-amoy-bor-rpc.publicnode.com`.
3. En Slither 0.11.6 la clave válida es `fail_on`, no `fail_medium`; además se analiza el archivo
   del contrato y no el proyecto Hardhat (los tests Foundry rompen `crytic-compile`).
4. `construirDetalle` no agrega `campos` cuando el cuerpo no tiene claves; el pseudocódigo del plan
   los habría guardado vacíos, pero su caso de prueba pide omitirlos.
5. No había Node 24 en la máquina de verificación: `pnpm` es el binario de Windows y ejecuta los
   scripts con el Node de Windows (26.7.0, dentro de `engines >=24 <27`); el CI fija 24 con
   `.nvmrc`.
6. A 360 px el contenedor de la tabla de Bitácora lleva `min-w-0`: sin él, el `min-content` de la
   tabla estira la pista del grid y el `overflow-x-auto` interno no actúa.

## 9. Impedimentos y observaciones

- El faucet de Alchemy exige saldo en mainnet; QuickNode y ETHGlobal no lo exigen.
- `hardhat ignition verify chain-80002` necesita `--network amoy`; sin él apunta a la red local 31337.
- **WSL:** las variables exportadas en la shell no llegan al `pnpm` de Windows; hay que pasarlas
  por `WSLENV` (documentado en `docs/despliegue.md`).
- La máquina de verificación tenía `CONTRACT_ADDRESS` como variable de entorno de Windows
  (residuo del despliegue en Amoy): pisa el `.env` local en los procesos de pnpm. La DoD se
  ejecutó pasando la dirección local por `WSLENV`; conviene eliminarla del sistema.
- Los trabajos de anclaje de las pruebas con Amoy quedaron en la cola de Redis y el worker los
  reintentó durante la primera corrida de Playwright; se limpió `bull:anclaje-recibos:*` antes de
  la corrida final.
- Vite no invalida el prebundle de un paquete del workspace cuando cambia su `dist`: tras agregar
  los exports de auditoría a `@oasis/shared` hubo que borrar `apps/web/node_modules/.vite`. No
  afecta a un clon limpio ni al CI.
- En Windows, `pnpm dev` arranca el watcher del worker con EPERM al recompilar (la carpeta `dist`
  está bloqueada) y el worker sale; API y SPA siguen. Los e2e y Playwright arrancan el worker
  desde `dist` y funcionan.

## 10. Deuda y trabajo fuera de alcance (para sprints siguientes)

- Instrumentar la importación (`IMPORTAR`) en S13; la prueba de cobertura fallará hasta entonces.
- Registrar el motivo de la anulación y su hash en la cadena (HU-27, S11).
- Si algún día existe un segundo contrato, verificar con la dirección guardada en cada recibo
  (ADR-008).
- Presupuesto de POL para las pruebas de carga de S16: cada recibo anclado costó ≈ 0,0027 POL.
- ADR-007 (S7) y el resto del trabajo planificado para otros sprints.
- El layout de la SPA desborda en horizontal a 360 px en el resto de páginas (/, /pagos,
  /recibos); Bitácora quedó corregida y el resto es deuda de UI previa a este sprint.

## 11. Cómo verificar

```bash
# Calidad (sin infraestructura)
pnpm install --frozen-lockfile
pnpm -r build && pnpm -r lint && pnpm format:check && pnpm -r typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test                       # 30 contratos + 76 API + 36 SPA
pnpm --filter @oasis/contracts reporte
pnpm --filter @oasis/contracts export-abi && git diff --exit-code packages/shared/src/abi

# Infraestructura (PostgreSQL y Redis con compose; nodo Hardhat aparte)
docker compose -f compose.dev.yaml up -d postgres redis
pnpm --filter @oasis/contracts exec hardhat node --hostname 127.0.0.1 &
pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy
pnpm --filter @oasis/api seed
pnpm test:e2e                   # 4 suites, 17 pruebas
CONTRACT_ADDRESS=$(grep '^CONTRACT_ADDRESS=' apps/api/.env | cut -d= -f2) \
  pnpm --filter @oasis/contracts exec hardhat run scripts/registrar-prueba.ts --network localhost
pnpm --filter @oasis/web test:e2e   # Playwright: 1 prueba
```

`registrar-prueba` se ejecuta dos veces: la primera registra y la segunda informa que el recibo ya
existía. Si el entorno define `CONTRACT_ADDRESS` a nivel de sistema, pásalo por `WSLENV` para que
el proceso de Windows use la dirección local.
