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
  `idOnchain = keccak256(uuid)`. La verificación (`GET /api/v1/recibos/:codigo/verificacion`)
  recalcula el hash desde la base y lo compara con `verificar()`; los resultados posibles están en
  `ESTADOS_VERIFICACION` de `@oasis/shared`. Hoy es solo del personal; HU-28 (S8) la abre al
  CLIENTE para sus recibos, con 30 consultas por minuto por usuario (ADR-015).

## API: tubería de cada petición

- Guards globales en este orden: `ThrottlerGuard` → `JwtAuthGuard` (JWT válido y sesión viva en
  Redis; `@Public()` lo omite) → `RolesGuard` (niega si el handler o la clase no declaran
  `@Roles(...)`). El usuario llega con `@UsuarioActual()` (`common/auth/decorators.ts`), con su
  `sid`.
- La auditoría de mutaciones se instrumenta con `@Auditar(accion, entidad)` (`common/auditoria/`);
  `AuditoriaInterceptor`, global y declarado en `AuditoriaModule`, inserta en `BitacoraAuditoria`
  tras la respuesta exitosa. La tabla es de solo inserción (trigger `bitacora_solo_insercion`).
- El middleware `sinCache` (`common/middleware/`, aplicado en `AppModule.configure`) pone
  `Cache-Control: no-store` en toda respuesta, incluidos los rechazos de los guards.
- Las entradas se validan con `ZodBody`/`ZodParam`/`ZodQuery` y los esquemas de `@oasis/shared`.
- Los errores de dominio (`shared-kernel/domain-error.ts`) se traducen a HTTP en
  `AllExceptionsFilter` con un formato único
  (`statusCode, code, message, details, requestId, timestamp, path`).
- `trust proxy = 1` (Caddy): `req.ip` y `req.secure` son los reales. Prefijo global `api/v1`,
  salvo `/metrics`.
- Los casos de uso son clases planas sin decoradores; cada `*.module.ts` los instancia con
  `useFactory` + `inject` por token `Symbol`. Un módulo reutiliza otro importándolo (por ejemplo,
  `PagosModule` importa `RecibosModule` para usar `EmitirReciboUseCase` y `COLA_ANCLAJE`).

## Clientes y pólizas (S5)

- `GET /ramos` (ADMIN y OPERADOR) sirve el `Select` de ramo del formulario de póliza y devuelve
  los ramos activos `{ id, codigo, nombre }` ordenados por nombre, sin paginación. El catálogo se
  administra en HU-46 (S15): hoy es de solo lectura.
- Ciclo de vida de la póliza (ADR-018): nace VIGENTE; `POST /polizas/:id/estado` solo acepta
  VIGENTE → VENCIDA o CANCELADA (ambos terminales) y queda en la bitácora como `CAMBIAR_ESTADO`;
  `PATCH /polizas/:id` solo edita pólizas VIGENTE y no admite `clienteId` ni `estado`; la prima no
  cambia si hay pagos VALIDADOS; `DELETE` no existe (RN-09). Renovar es crear una póliza nueva.
- RN-01 vive en `CrearPagoUseCase`: póliza inexistente → 404 y no VIGENTE → 422
  `POLIZA_NO_VIGENTE`, antes de resolver el método de pago (el registro completo de pagos es
  HU-16, S6).

## Sesiones (ADR-016)

- La llave `sesion:<usuarioId>:<sid>` guarda en Redis el `jti` vigente con TTL
  `TTL_SESION_SEGUNDOS` de `@oasis/shared`; ambos tokens llevan el `sid`.
- `JwtEstrategia` hace `EXPIRE` en cada petición: 401 si la llave no existe y 502 si Redis no
  responde en 2 s (`shared-kernel/tiempo-limite.ts`).
- `cerrarTodas(usuarioId)` recorre con `SCAN` y borra todas las sesiones del usuario; lo usan
  desactivar, cambiar el rol y restablecer la contraseña (HU-04).
- La rotación del refresco es un script Lua en `RedisAlmacenSesionesAdapter` que conserva el `exp`
  de la familia y revoca la sesión ante un `jti` reutilizado.
- En la SPA: Web Locks (`oasis-refresco`) serializa el refresco entre pestañas; `useInactividad`
  en `features/auth/hooks.ts` usa las claves `oasis:ultima-actividad` y `oasis:sesion-cerrada`, y
  late a `GET /auth/me` como máximo una vez por minuto.

## Configuración y datos

- `config/env.schema.ts` valida el entorno con Zod (falla listando todas las variables inválidas)
  y `AppConfig` lo expone tipado. Los `.env` se resuelven desde el directorio del proceso: primero
  `apps/api/.env` y luego el `.env` raíz. `prisma.config.ts` hace lo mismo porque Prisma 7 no carga
  `.env` por sí solo.
- El cliente de Prisma se genera en `apps/api/src/generated/prisma` (no versionado) con
  `pnpm --filter @oasis/api build` o `pnpm --filter @oasis/api exec prisma generate`. El esquema ya
  contiene el modelo completo de la arquitectura, incluidas tablas de historias futuras (ADR-010),
  salvo `TransaccionPagoLinea` (ADR-014), que llega con HU-48 en S12; no tiene borrados en cascada
  (RN-09). `Usuario.nombre` es una columna con el nombre visible de cada cuenta (S4), que auth lee
  directamente.
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
  lateral (`ENLACES`) y el menú del usuario viven en `components/layout/AppLayout.tsx`.
- `lib/api-client.ts` envía el access token y, ante un 401, renueva la sesión una sola vez,
  deduplicada en la pestaña y serializada entre pestañas con Web Locks; si no puede, cierra la
  sesión con el motivo `expirada`, que el login muestra.
- En desarrollo, Vite redirige `/api` a `:3000`, igual que Caddy en producción.
- `features/clientes/components/SelectorCliente.tsx` es el combobox ARIA 1.2 compartido (sin
  dependencias): busca en el servidor `GET /clientes?q=…&estado=ACTIVOS&pageSize=20` con debounce
  de 300 ms y lo usan el formulario y el filtro de `PolizasPage`. Dentro de un `Dialog`, el
  `onEscapeKeyDown` del contenido protege la lista abierta del cierre del diálogo.

## Pruebas: detalles que no están en AGENTS.md

- Los e2e del API crean la app en proceso desde `AppModule`, así que deben repetir
  `cookieParser()` y `setGlobalPrefix('api/v1', { exclude: ['metrics'] })`; los flujos con
  anclaje levantan `WorkerModule` en el mismo proceso. Usuarios del seed: `admin@oasis.com` /
  `Admin.Oasis1`, `operador@oasis.com` / `Operador.Oasis1` y `cliente@oasis.com` /
  `Cliente.Oasis1`. Para crear clientes por el API se usa `cedulaValida`/`rucSociedad` de
  `test/identificaciones.ts` (RN-11, ADR-017), nunca valores fijos.
- Los e2e activan `trust proxy` y cada caso envía su `X-Forwarded-For`; Playwright hace lo mismo
  con `page.setExtraHTTPHeaders`. El seed no restablece contraseñas (`update: {}`), así que las
  pruebas que las cambian crean su usuario.
- `test/rutas-declaradas.ts` descubre las rutas del grafo de `AppModule` y alimenta la cobertura de
  `@Roles` y `@Auditar`, además del e2e de acceso por rol.
- Playwright arranca `apps/api/test/start-servicios.mjs` (nodo Hardhat, `dev:chain`, API y
  worker) y el `pnpm dev` de la SPA, y reutiliza los servidores que ya estén corriendo.
- `pnpm deps:check:negativo` demuestra que la regla hexagonal falla cuando debe.

## Trampas conocidas

- No subir a NestJS 12 (solo ESM; el API es CommonJS) ni a TypeScript 7 (sin soporte en
  `typescript-eslint` ni `ts-jest`). Detalle en `docs/sprints/sprint-01.md` §7.
- pnpm 12: los binarios de un paquete se ejecutan con `pnpm --filter <pkg> exec <bin>`.
- Prettier respeta `.gitignore` y `.prettierignore`: cualquier archivo no ignorado, aunque no esté
  versionado, entra en `pnpm format:check`.
