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
     `reinicio-worker.e2e-spec.ts` demuestra que un worker cerrado a mitad del anclaje y uno
     nuevo dejan cada recibo con un solo evento `ReciboRegistrado`.
  6. `POST /api/v1/recibos/:id/anular` marca ANULADO y, si estaba anclado, encola `anular-recibo`;
     el worker llama a `anular()` en el contrato.
- **Tareas del worker (S4):** `VencimientoCuotasTask` (`@Cron('5 0 * * *')` en
  `America/Guayaquil`) ejecuta `MarcarCuotasVencidasUseCase`, que marca VENCIDA toda cuota
  PENDIENTE o PARCIAL vencida antes de hoy en un `updateMany` idempotente. `SaldoOperadoraTask`
  lee el saldo al arrancar y cada 5 min, escribe `operadora:saldo` en Redis (TTL 15 min), publica
  `oasis_operadora_saldo_pol` y, bajo `UMBRAL_SALDO_OPERADORA_POL` (solo en el entorno del worker,
  `umbralSaldoOperadoraDelEntorno`), un `warn` `saldo-operadora-bajo`. El API solo lee la llave en
  `GET /operadora/saldo` (ADMIN); sin llave responde `{ disponible: false }`. El worker registra
  estas tareas con proveedores propios, sin importar los controladores de `PolizasModule`.
- **Hash y privacidad (ADR-004):** `domain/payload-recibo.ts` arma el JSON canónico (RFC 8785);
  `hashRecibo = keccak256(sal ‖ payload)` con una sal de 32 bytes que solo vive en PostgreSQL, e
  `idOnchain = keccak256(uuid)`. La verificación (`GET /api/v1/recibos/:codigo/verificacion`)
  recalcula el hash desde la base y lo compara con `verificar()`; los resultados posibles están en
  `ESTADOS_VERIFICACION` de `@oasis/shared`. Hoy es solo del personal; HU-28 (S5) la abre al
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

## Clientes y pólizas (S3)

- `GET /ramos` (ADMIN y OPERADOR) sirve el `Select` de ramo del formulario de póliza y devuelve
  los ramos activos `{ id, codigo, nombre }` ordenados por nombre, sin paginación. El catálogo se
  administra en HU-46 (S9): hoy es de solo lectura.
- Ciclo de vida de la póliza (ADR-018): nace VIGENTE; `POST /polizas/:id/estado` solo acepta
  VIGENTE → VENCIDA o CANCELADA (ambos terminales) y queda en la bitácora como `CAMBIAR_ESTADO`;
  `PATCH /polizas/:id` solo edita pólizas VIGENTE y no admite `clienteId` ni `estado`; la prima no
  cambia si hay pagos VALIDADOS; `DELETE` no existe (RN-09). Renovar es crear una póliza nueva.
- RN-01 vive en `CrearPagoUseCase`: póliza inexistente → 404 y no VIGENTE → 422
  `POLIZA_NO_VIGENTE`, antes de resolver el método de pago.

## Pagos y plan de cuotas (S4)

- RN-01 y RN-02 se exigen al registrar y otra vez al validar (`exigirPolizaVigente` y
  `exigirMontoDentroDelSaldo` en `pagos.use-cases.ts`). El saldo es
  `primaTotal − Σ pagos VALIDADOS` (`saldoPoliza`, con `aggregate`); el error lleva
  `details: { campo: 'monto', motivo: 'MONTO_SUPERA_SALDO', saldo }`. Dos validaciones
  simultáneas aún pueden pasar las dos hasta HU-36 (S5), marcado con `ponytail:`.
- La referencia es obligatoria y única por póliza (`@@unique([polizaId, referencia])`): el `P2002`
  sale como 409 `REFERENCIA_DUPLICADA`. El rechazo guarda `rechazadoPorId`/`rechazadoEn`, nunca
  los campos de la validación. `Pago.puedeEditarse()` existe aunque no haya edición (D9).
- Los códigos de negocio viajan en `details.motivo` (el `code` es `REGLA_NEGOCIO`, `CONFLICTO`…);
  la SPA los pinta bajo el campo de `details.campo`.
- Plan de cuotas (ADR-020): toda póliza nace con una cuota por la prima (`create` anidado).
  `PUT /polizas/:id/cuotas` reemplaza el plan en una `$transaction` que vuelve a exigir VIGENTE y
  cero pagos VALIDADOS (único borrado del sistema); el dominio `PlanCuotas` valida la suma
  (RN-15, `PLAN_NO_CUADRA`) y la vigencia (`PLAN_FUERA_DE_VIGENCIA`). Editar la prima o la vigencia
  ajusta el plan en la misma transacción (D13): una cuota sigue a la prima y al inicio; N cuotas
  se recalculan con `proponerPlanCuotas` y conservan sus fechas.
- `proponerPlanCuotas`, `sumarMontos` y `fechaEnGuayaquil` viven en `@oasis/shared/dominio`: toda
  aritmética de dinero va en centavos enteros y "hoy" es la fecha de Guayaquil.
- Mora (RN-16): `enMora` sale del `_count` de cuotas VENCIDAS en la misma consulta de la póliza.

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
  salvo `TransaccionPagoLinea` (ADR-014), que HU-48 habría agregado (HU-48 se retiró del alcance); no tiene borrados en cascada
  (RN-09). `Usuario.nombre` es una columna con el nombre visible de cada cuenta (S2), que auth lee
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
  `ETHERSCAN_API_KEY`, y `ADMIN_FRIA_PRIVATE_KEY` solo en la laptop del autor), nunca en un `.env`.
  Pasos en `docs/despliegue.md` §4.
- Administración en frío (HT-15, ADR-021): la lógica está en `scripts/administracion.ts`
  (`transferirAdmin`, `rotarOperadora`), probada con el nodo en proceso en
  `test/administracion.test.ts`. Los envoltorios `transferir-admin.ts` y `rotar-operadora.ts` se
  ejecutan con `node` (no con `hardhat run`, que rechaza opciones propias como `--pausar`) y por
  eso los imports relativos llevan `.ts` (`allowImportingTsExtensions`). Se lanzan con
  `pnpm --filter @oasis/contracts <script>`: con `node` desde la raíz, Hardhat no halla su
  configuración (HHE3).

## SPA

- Diseño Claroscuro (ADR-019): tokens y reglas en `apps/web/DESIGN.md`, contexto de producto en
  `apps/web/PRODUCT.md` y prototipo navegable en `docs/diseno/prototipo/`. Los tokens viven en
  `src/index.css` (correspondencia con shadcn/ui en `docs/diseno/README.md`); `--color-*: initial`
  anula la paleta de Tailwind, así que `bg-red-500` o `bg-white` no generan CSS. El punto de corte
  `riel:` es 760 px.
- Rutas y protección por rol en `src/app/router.tsx` (`RutaProtegida roles={[...]}`).
  `components/layout/AppLayout.tsx` elige la navegación según el rol: el personal ve
  `RielPersonal` (menú `ENLACES`, 92 px en la noche; barra superior desplazable bajo 760 px) y el
  CLIENTE, una cabecera con `MenuUsuario` y `BarraInferiorCliente`, cuyas pestañas Pólizas y
  Recibos son anclas `/#polizas` y `/#pagos` del `PanelCliente`. Las páginas con sesión ponen su
  título con `Encabezado` (el `h1`, con las acciones como `children`).
- Todo estado se muestra con `components/EstadoInsignia.tsx` (`dominio` + `estado`). El vocabulario
  está en `components/estados.ts`, tipado contra los enums de `@oasis/shared`: omitir un estado
  rompe el `typecheck`. El texto es el nombre accesible y el código técnico queda en
  `data-estado`, que es lo que leen las pruebas.
- Montos y fechas se formatean solo con `lib/format.ts` (`formatearMoneda`, `formatearFecha`,
  `formatearFechaHoraEcuador`, `acortarHash`); las fechas sin hora salen en `dd/mm/aaaa` sin
  pasar por `Date`.
- `lib/api-client.ts` envía el access token y, ante un 401, renueva la sesión una sola vez,
  deduplicada en la pestaña y serializada entre pestañas con Web Locks; si no puede, cierra la
  sesión con el motivo `expirada`, que el login muestra.
- En desarrollo, Vite redirige `/api` a `:3000`, igual que Caddy en producción.
- `components/ComboboxBusqueda.tsx` es el combobox ARIA 1.2 compartido (sin dependencias): busca
  en el servidor con debounce de 300 ms mediante un hook que recibe por props.
  `SelectorCliente` (clientes activos, formulario y filtro de `PolizasPage`) y `SelectorPoliza`
  (pólizas VIGENTES del formulario de pago, RN-01) lo envuelven. Dentro de un `Dialog`, el
  `onEscapeKeyDown` del contenido protege la lista abierta del cierre del diálogo.
- `components/Campo.tsx` pone label, ayuda y error con su ARIA; lo usan `FormularioPoliza` y
  `FormularioPago`, que llevan el error del API a su campo con `details.campo`.
- Pagos (S4): `ValidarPagoDialog` (resumen, casilla y «Validar y emitir recibo», tres acciones
  desde la fila) y `RechazarPagoDialog` (chips de `MOTIVOS_RECHAZO_FRECUENTES`, contador y botón
  deshabilitado fuera de 5–300). El toast del recibo enlaza a su detalle. `PlanCuotasDialog` se abre
  con el botón «Cuotas» de cada póliza; `SaludAnclaje` solo se monta para el ADMIN.

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
  worker) y el `pnpm dev` de la SPA, y reutiliza los servidores que ya estén corriendo. Si :8545
  ya responde (el nodo de `dev:infra`), lo reutiliza sin redesplegar, para no cambiar
  `CONTRACT_ADDRESS`. En POSIX los hijos comparten el grupo de procesos del lanzador: así el
  `SIGKILL` que Playwright envía al grupo los alcanza y la corrida termina.
- `apps/web/e2e/diseno.spec.ts` recorre el arreglo `PANTALLAS` con axe (`wcag2a`/`wcag2aa`), foco
  visible al tabular, sin desborde a 360 px, recursos del mismo origen y objetivos de 44 × 44 px
  en el portal del CLIENTE. Una pantalla nueva se agrega a `PANTALLAS`.
- `pnpm deps:check:negativo` demuestra que la regla hexagonal falla cuando debe.

## Cadena de suministro (HT-14)

- Las acciones de GitHub van fijadas por SHA con su versión en comentario, con `permissions: {}`
  global y permisos mínimos por job; cada `checkout` usa `persist-credentials: false`. Renovate
  (`renovate.json`) mantiene los SHA y agrupa por ecosistema.
- El job `seguridad` de `ci.yml` corre `pnpm audit --prod --audit-level=high` (excepciones con
  motivo y fecha en `auditConfig` de `pnpm-workspace.yaml`), Semgrep CE, gitleaks sobre todo el
  historial (falsos positivos en `.gitleaksignore`) y zizmor.
- `secretlint` corre en lint-staged sobre todo archivo preparado; `.secretlintrc.json` solo permite
  URLs de PostgreSQL con la contraseña entre `<…>` (ejemplos de la documentación).

## Trampas conocidas

- No subir a NestJS 12 (solo ESM; el API es CommonJS) ni a TypeScript 7 (sin soporte en
  `typescript-eslint` ni `ts-jest`). Detalle en `docs/sprints/sprint-01.md` §7.
- pnpm 12: los binarios de un paquete se ejecutan con `pnpm --filter <pkg> exec <bin>`.
- Prettier respeta `.gitignore` y `.prettierignore`: cualquier archivo no ignorado, aunque no esté
  versionado, entra en `pnpm format:check`.
- En viem, `concat` con tipos mezclados (bytes y hex) cae en `concatBytes` y copia el texto hex
  como números: concatene siempre hex con hex (`ViemHasherRecibosAdapter`).
- Las e2e que crean pagos usan `fechaEnGuayaquil(new Date())`: desde las 19:00 de Ecuador la fecha
  UTC ya es «mañana» y D6 la rechaza. Las que validan pagos usan una póliza propia
  (`test/polizas-de-prueba.ts`, `crearPolizaPropia` en `e2e/ayudas.ts`) para que RN-02 no agote
  la del seed entre corridas.
