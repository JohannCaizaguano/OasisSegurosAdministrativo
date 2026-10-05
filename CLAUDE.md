# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Las reglas del proyecto (fuente de verdad, stack, comandos, skills, convenciones, alcance y DoD)
están en `AGENTS.md`, importado arriba. Este archivo agrega el mapa técnico que solo se obtiene
leyendo varios archivos.

## Procesos y flujo principal

- **Un código, dos procesos** en `apps/api`: `src/main.ts` levanta el HTTP (`AppModule`) y
  `src/worker.ts` el worker (`WorkerModule`, sin HTTP salvo el exportador de `/metrics` en
  `WORKER_METRICS_PORT`). `pnpm dev` arranca ambos con `concurrently`. Solo el worker importa
  `CuentaOperadoraModule` (wallet de firma) y valida `OPERATOR_PRIVATE_KEY` con
  `validateWorkerEnv`; el esquema del API no la conoce y el API solo lee el contrato.
- **Ciclo del recibo (outbox, ADR-005):**
  1. `PATCH /api/v1/pagos/:id/validar` (exige `confirmado: true`) → `ValidarPagoUseCase`.
  2. `PrismaPagosRepository.validarYCrearRecibo` marca el pago VALIDADO y crea el recibo
     PENDIENTE_ANCLAJE en una sola `$transaction`.
  3. Tras el commit se encola el job `anclar-recibo` en la cola `anclaje-recibos` con
     `jobId = reciboId`.
  4. `AnclajeProcessor` (concurrencia 1; 5 intentos con backoff exponencial definidos en
     `QueueModule`) ejecuta `AnclarReciboUseCase`, idempotente: se sincroniza con la cadena antes
     de enviar `registrar` y pasa ENVIADO → ANCLADO. En el último intento fallido marca FALLIDO.
  5. `BarridoPendientesTask` reencola cada 30 s los PENDIENTE_ANCLAJE con más de 60 s.
  6. `POST /api/v1/recibos/:id/anular` marca ANULADO y, si estaba anclado, encola `anular-recibo`;
     el worker llama a `anular()` en el contrato.
- **Hash y privacidad (ADR-004):** `domain/payload-recibo.ts` arma el JSON canónico (RFC 8785);
  `hashRecibo = keccak256(sal ‖ payload)` con una sal de 32 bytes que solo vive en PostgreSQL, e
  `idOnchain = keccak256(uuid)`. La verificación pública
  (`GET /api/v1/public/recibos/:codigo/verificacion`) recalcula el hash desde la base y lo compara
  con `verificar()`; los resultados posibles están en `ESTADOS_VERIFICACION` de `@oasis/shared`.

## API: tubería de cada petición

- Guards globales en este orden: `ThrottlerGuard` → `JwtAuthGuard` (todo exige JWT salvo
  `@Public()`) → `RolesGuard` (`@Roles(...)` en clase o handler). El usuario llega con
  `@UsuarioActual()` (`common/auth/decorators.ts`).
- Toda mutación declara `@Auditar(accion, entidad)` (`common/auditoria/`);
  `AuditoriaInterceptor`, global y declarado en `AuditoriaModule`, inserta en
  `BitacoraAuditoria` tras la respuesta exitosa. La tabla es de solo inserción (trigger
  `bitacora_solo_insercion`).
- Las entradas se validan con `ZodBody`/`ZodParam`/`ZodQuery` y los esquemas de `@oasis/shared`.
- Los errores de dominio (`shared-kernel/domain-error.ts`) se traducen a HTTP en
  `AllExceptionsFilter` con un formato único
  (`statusCode, code, message, details, requestId, timestamp, path`).
- `trust proxy = 1` (Caddy): `req.ip` y `req.secure` son los reales. Prefijo global `api/v1`,
  salvo `/metrics`.
- Los casos de uso son clases planas sin decoradores; cada `*.module.ts` los instancia con
  `useFactory` + `inject` por token `Symbol`. Un módulo reutiliza otro importándolo (por ejemplo,
  `PagosModule` importa `RecibosModule` para usar `EmitirReciboUseCase` y `COLA_ANCLAJE`).

## Configuración y datos

- `config/env.schema.ts` valida el entorno con Zod (falla listando todas las variables inválidas)
  y `AppConfig` lo expone tipado. Los `.env` se resuelven desde el directorio del proceso: primero
  `apps/api/.env` y luego el `.env` raíz. `prisma.config.ts` hace lo mismo porque Prisma 7 no carga
  `.env` por sí solo.
- El cliente de Prisma se genera en `apps/api/src/generated/prisma` (no versionado) con
  `pnpm --filter @oasis/api build` o `pnpm --filter @oasis/api exec prisma generate`. El esquema ya
  contiene el modelo completo de la arquitectura, incluidas tablas de historias futuras (ADR-010),
  y no tiene borrados en cascada (RN-09).
- `@oasis/shared` se consume compilado (`dist/`, CommonJS): tras cambiar `packages/shared/src`,
  ejecuta `pnpm --filter @oasis/shared build` para que el API y la SPA vean el cambio.

## Contrato

- Hardhat 3 con dos perfiles: `default` (pruebas, cobertura y gas) y `production` (optimizador;
  lo usan `deploy:local` y `deploy:amoy`).
- Pruebas en Solidity (`test/*.t.sol`, forge-std) y en `node:test` + viem (`test/*.test.ts`).
  `pnpm --filter @oasis/contracts reporte` exige ≥ 90 % de líneas y regenera
  `REPORTE-COBERTURA.md` y `REPORTE-GAS.md`, que no se editan a mano.
- `pnpm dev:chain` despliega con Ignition en `localhost:8545`, otorga `REGISTRADOR_ROLE` a la
  cuenta #1 de Hardhat y escribe `CONTRACT_ADDRESS`, `OPERATOR_PRIVATE_KEY`, `CHAIN_ID`, `RPC_URL`
  y `EXPLORER_BASE_URL` en `apps/api/.env`.
- Para Amoy, los secretos van en `hardhat keystore` (`DEPLOYER_PRIVATE_KEY`, `AMOY_RPC_URL`,
  `ETHERSCAN_API_KEY`), nunca en un `.env`. Pasos en `docs/despliegue.md` §4.

## SPA

- Rutas y protección por rol en `src/app/router.tsx` (`RutaProtegida roles={[...]}`); el menú
  lateral se filtra por rol en `components/layout/AppLayout.tsx`. Una página nueva se registra en
  ambos.
- `lib/api-client.ts` envía el access token y, ante un 401, renueva la sesión una sola vez
  (deduplicada) con la cookie y reintenta.
- En desarrollo, Vite redirige `/api` a `:3000`, igual que Caddy en producción.

## Pruebas: detalles que no están en AGENTS.md

- Los e2e del API crean la app en proceso desde `AppModule`, así que deben repetir
  `cookieParser()` y `setGlobalPrefix('api/v1', { exclude: ['metrics'] })`; los flujos con
  anclaje levantan `WorkerModule` en el mismo proceso. Usuarios del seed: `admin@oasis.com` /
  `Admin.Oasis1`, `operador@oasis.com` / `Operador.Oasis1` y `cliente@oasis.com` /
  `Cliente.Oasis1`.
- Playwright arranca `apps/api/test/start-servicios.mjs` (nodo Hardhat, `dev:chain`, API y
  worker) y el `pnpm dev` de la SPA, y reutiliza los servidores que ya estén corriendo.
- `pnpm deps:check:negativo` demuestra que la regla hexagonal falla cuando debe.

## Trampas conocidas

- No subir a NestJS 12 (solo ESM; el API es CommonJS) ni a TypeScript 7 (sin soporte en
  `typescript-eslint` ni `ts-jest`). Detalle en `docs/sprints/sprint-01.md` §7.
- pnpm 12: los binarios de un paquete se ejecutan con `pnpm --filter <pkg> exec <bin>`.
- Prettier respeta `.gitignore` y `.prettierignore`: cualquier archivo no ignorado, aunque no esté
  versionado, entra en `pnpm format:check`.
- Además de los scopes de `AGENTS.md`, commitlint admite `docker` y `release`
  (`commitlint.config.mjs`), con encabezados de hasta 100 caracteres. El hook `pre-commit` corre
  Prettier y ESLint con `--fix` mediante lint-staged.
