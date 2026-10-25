# Sprint S4 — Plan de implementación

- **Historias:** HT-13 Implementación del sistema de diseño (25 h, deuda de S3), HU-16 Registrar
  pago (8 h), HU-18 Validar pago (5 h), HU-19 Rechazar pago (3 h), HU-35 Definir el plan de cuotas
  (6 h), HU-37 Vencimiento automático de cuotas (3 h), HT-14 Seguridad de la cadena de suministro
  (3 h), HU-22 Emitir recibo digital (6 h), HU-23 Anclar recibo en Polygon con reintentos (14 h),
  HU-42 Monitorear el saldo de la cuenta operadora (3 h) y HT-15 Seguridad del contrato y de la
  cuenta operadora (3 h).
- **Horas:** 79 h de backlog (54 de S4 + 25 de HT-13). El informe reporta solo las horas de backlog
  (D1).
- **Épicas:** EP-07 (HT-13, HT-14), EP-04 (HU-16, HU-18, HU-19), EP-03 (HU-35, HU-37) y EP-05
  (HU-22, HU-23, HU-42, HT-15).
- **Fechas:** 19/10/2026 – 30/10/2026 (tabla 6-1 del backlog). El plan se acordó el 23/10 y se
  reestructuró el 24/10/2026.
- **Dos etapas secuenciales (D23):**
  - **Etapa A — Sistema de diseño (HT-13):** termina con tu visto bueno visual y el **commit 1**.
    Meta: 27/10.
  - **Etapa B — Pagos, cuotas, recibos y seguridad (el resto):** termina con una pausa de revisión
    visual y el **commit 2**. Meta: 30/10.
- **Rama:** `feat/sprint-s4-pagos-recibos` (una sola, con los dos commits y un solo PR).
- **Ejecuta:** la sesión principal con `subagent-driven-development` y los agentes de área de
  `.opencode/agents/` (sección 0.1).
- **Decisiones acordadas con el desarrollador:** 23/10 y 24/10/2026, en sesiones de grilling
  (sección 2).

Este documento es el Sprint Backlog de S4. Las reglas generales están en `AGENTS.md`, el mapa
técnico en `CLAUDE.md` y las reglas de los módulos del API en `apps/api/src/modules/README.md`.
Cada agente lee los tres antes de empezar. La fuente de verdad está en `docs/referencia/`, que no se
edita: si algo de este plan la contradice, gana la referencia; detente y repórtalo.

**Cómo leer las tareas.** Cada tarea indica su **agente**, sus **archivos**, sus **skills**, el
comportamiento esperado, los casos borde, las pruebas que se escriben primero y su verificación. Los
bloques **Ejemplo (orientativo)** muestran la forma o la parte delicada; se adaptan al código real.

## 0. Reglas de ejecución

1. La sesión principal ejecuta la **Etapa A completa** (A0 → A1 → A2 → A3 → A4) y solo con el visto
   bueno del desarrollador pasa a la **Etapa B** (B0 → B1 → B2 → B3 → B4 → B5). Ningún agente
   arranca una fase por su cuenta.
2. TDD en toda lógica nueva (`test-driven-development`): primero la prueba en rojo, luego el código.
   Antes de cerrar una fase, la sesión principal usa `verification-before-completion` y guarda la
   salida en el ledger.
3. Cada agente invoca al empezar las skills de su tarea en el orden de `AGENTS.md`: proceso →
   tecnología → `ponytail` decide el tamaño.
4. Tras cambiar `packages/shared/src`: `pnpm --filter @oasis/shared build` y borrar
   `apps/web/node_modules/.vite`.
5. Nunca se edita `docs/referencia/`.
6. **Dos commits**, uno al cierre de cada etapa (T8 y T32), hechos por la sesión principal, sin
   líneas de atribución. Antes, `git config user.name` debe ser `JohannCaizaguano`. **Sin push ni
   PR**: los hace el usuario.
7. No se adelanta trabajo de otros sprints; lo que exceda el alcance va como deuda al informe. La
   Etapa A **no** adelanta pantallas de la Etapa B.
8. Comentarios solo para el porqué no obvio. Simplificaciones deliberadas con `ponytail:` (techo y
   salida).
9. En las fases paralelas cada agente compila y prueba **solo su paquete** (`pnpm --filter …`);
   nadie ejecuta `pnpm -r build` ni `pnpm install` hasta que la sesión principal cierre la fase.
10. Las dependencias nuevas las instala **la sesión principal** al empezar la etapa que las usa
    (T0.3 y T9.2): los agentes no editan `package.json` ni el lockfile.
11. **Puntos de control con el desarrollador (D23):** al cierre de cada etapa la sesión principal se
    detiene, presenta las capturas y espera su respuesta. Sin un «aprobado» explícito no hay commit
    ni se continúa; si pide ajustes, los reparte al dueño, repite los cierres afectados y vuelve a
    presentar.

### 0.1 Agentes y coordinación

| Agente                | Edita                                                                                               | Etapa A    | Etapa B          |
| --------------------- | --------------------------------------------------------------------------------------------------- | ---------- | ---------------- |
| sesión principal      | archivos raíz (`package.json`, `.lintstagedrc.json`, `renovate.json`, `.secretlintrc.json`), ledger | T0, T7, T8 | T9, T22, T30–T32 |
| `contrato-shared`     | `packages/shared/src/` (salvo `abi/`), `apps/web/src/contratos/`                                    | T1         | T10–T12          |
| `documentacion`       | `docs/` (salvo `referencia/`), `CLAUDE.md`, `AGENTS.md`, READMEs                                    | T7         | T13, T31         |
| `backend-api`         | `apps/api/src/`, `apps/api/prisma/`                                                                 | —          | T14–T20          |
| `contrato-blockchain` | `packages/contracts/`                                                                               | —          | T21              |
| `infra`               | `infra/`, `compose.*.yaml`, `Dockerfile`, `Caddyfile`, `.github/`                                   | —          | T22              |
| `frontend-spa`        | `apps/web/src/` (salvo `contratos/`)                                                                | T2–T5      | T23–T25          |
| `verificador`         | `apps/api/test/`, `apps/web/e2e/`                                                                   | T6         | T26–T27          |
| `revisor`             | nada (solo su nota del ledger)                                                                      | T7         | T28              |

```text
ETAPA A — Sistema de diseño (HT-13)
Fase A0  sesión principal ── T0 entorno, rama, dependencias de la Etapa A, línea base, deuda
Fase A1  contrato-shared ── T1 estados de cuota
Fase A2  frontend-spa ── T2 → T3 → T4 → T5
Fase A3  verificador ── T6 diseno.spec.ts          revisor ── T7 (tras T6; máx. 1 ronda)
Fase A4  documentacion ── T7.doc · sesión principal ── T8 DoD A, capturas, visto bueno, commit 1
         ── PUNTO DE CONTROL 1: sin «aprobado» no se pasa a la Etapa B ──

ETAPA B — Pagos, cuotas, recibos y seguridad
Fase B0  sesión principal ── T9 línea base sobre el commit 1, dependencias de la Etapa B
Fase B1  contrato-shared ── T10 → T11 → T12          documentacion ── T13 (en paralelo)
Fase B2  ┌ backend-api ── T14 → T15 → T16 → T17 → T18 → T19 → T20
         ├ contrato-blockchain ── T21
         └ infra + sesión principal ── T22
Fase B3  frontend-spa ── T23 → T24 → T25
Fase B4  verificador ── T26 → T27 · revisor ── T28 → dueños corrigen → revisor confirma (máx. 1 ronda)
Fase B5  sesión principal ── T29 DoD B, T30 capturas y visto bueno · documentacion ── T31 ·
         sesión principal ── T32 informe y commit 2
         ── PUNTO DE CONTROL 2: sin «aprobado» no hay commit 2 ──
```

**Por qué la SPA va después del backend en la Etapa B.** Las pantallas de B3 consumen los endpoints
y los errores reales de B2; así `frontend-spa` no trabaja contra supuestos y la e2e de B4 cubre
ambos lados a la vez.

**Traspasos.** Cada agente cierra su tarea con una nota en `.superpowers/sdd/sprint-s4-plan/<agente>.md`
(qué hizo, salida resumida de sus comandos, desvíos con su motivo y lo que necesita el siguiente) y
responde a la sesión principal con un resumen corto. La sesión principal pasa a cada agente el
resumen de las notas que le afectan.

**Fronteras.** Si un agente necesita un cambio fuera de su carpeta, no lo hace: lo anota y la sesión
principal relanza al dueño. Si el `verificador` encuentra un bug de producto, deja la prueba en rojo
como evidencia.

**Frenos.** Si una decisión de la sección 2 deja de ser viable, la sesión principal se detiene e
invoca `grilling` con su recomendación. Los agentes no reabren decisiones.

### 0.2 Skills por tarea

| Momento                         | Agente                | Skills                                                                                                                                                       |
| ------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Todo el sprint                  | sesión principal      | `subagent-driven-development`, `ponytail`, `verification-before-completion`; `grilling` solo como freno                                                      |
| Toda lógica nueva               | todos                 | `test-driven-development`                                                                                                                                    |
| Fallo o prueba roja inesperada  | todos                 | `systematic-debugging`                                                                                                                                       |
| T1, T10–T12 esquemas y dominio  | `contrato-shared`     | `zod`, `typescript-advanced-types`, `vitest`                                                                                                                 |
| T7.doc, T13 y T31 documentación | `documentacion`       | `humanizador-es` al final de cada documento                                                                                                                  |
| T2–T5 sistema de diseño         | `frontend-spa`        | `impeccable` (`craft`/`polish`/`audit`), `frontend-design`, `tailwind-v4-shadcn`, `tailwind-css-patterns`, `shadcn`, `accessibility`, `composition-patterns` |
| T6 y T27 Playwright             | `verificador`         | `playwright-best-practices`                                                                                                                                  |
| T7 y T28 revisión               | `revisor`             | `ponytail-review`, `accessibility`, `impeccable` (`audit`)                                                                                                   |
| T14 migración y seed            | `backend-api`         | `prisma-cli`, `prisma-client-api`                                                                                                                            |
| T15–T20 API y worker            | `backend-api`         | `nestjs-best-practices`, `nodejs-best-practices`, `nodejs-backend-patterns`, `prisma-client-api`                                                             |
| T21 contrato                    | `contrato-blockchain` | (sin skill de tecnología; NatSpec obligatorio)                                                                                                               |
| T22 CI                          | `infra`               | `bash-defensive-patterns` si escribe scripts                                                                                                                 |
| T23–T25 pantallas nuevas        | `frontend-spa`        | `react-best-practices`, `react-hook-form`, `zod`, `shadcn`, `impeccable` (`harden`), `accessibility`, `vitest`                                               |
| T26 e2e del API                 | `verificador`         | `nestjs-best-practices`, `prisma-client-api`                                                                                                                 |

**`impeccable` en este sprint.** Manda `apps/web/DESIGN.md`; el sidecar es
`apps/web/.impeccable/design.json` y el contexto `apps/web/PRODUCT.md`. **No** se ejecuta `init` ni
`document` (el sistema ya está documentado). El prototipo (`docs/diseno/prototipo/index.html`) es
referencia visual y de comportamiento; si discrepa con DESIGN.md, gana DESIGN.md.

**Sin worktrees ni commits por tarea.** El ledger vive en `.superpowers/sdd/sprint-s4-plan/`
(ignorado por git), igual que las capturas (`.superpowers/sdd/sprint-s4-plan/capturas/`). Si
`finishing-a-development-branch` ofrece opciones, elige "conservar la rama tal cual".

## 1. Alcance

### Etapa A

#### HT-13 — Sistema de diseño Claroscuro (RNF-20, RNF-26)

- Los tokens de color, tipografía, radios, alturas de control y movimiento de la propuesta aprobada
  reemplazan la paleta provisional, y ningún componente usa colores fuera de ellos.
- Las fuentes se sirven desde el mismo origen, sin CDN de terceros, y el isologo aparece en la
  navegación y en el inicio de sesión.
- La navegación del personal y el encabezado siguen el diseño aprobado; en el teléfono, el cliente
  navega con una barra inferior.
- Los estados de pago, recibo, póliza, cliente y verificación se muestran con un único componente
  que combina icono, texto y color, y que las cuotas reutilizan desde HU-35.
- Las pantallas existentes (inicio de sesión, inicio, pagos, recibos, verificación, clientes,
  pólizas, aseguradoras, usuarios, bitácora y cambio de contraseña) usan el sistema de diseño sin
  cambiar su comportamiento.
- Contraste AA y foco visible; objetivos táctiles del portal ≥ 44 px; nada desborda a 360 px.

### Etapa B

#### HU-16 — Registrar pago (RF-17)

- Se registran póliza, monto, fecha, método y referencia.
- El catálogo de métodos de pago incluye Débito bancario.
- Se valida que la póliza esté vigente y que el monto no supere el saldo (RN-01, RN-02).
- El pago se guarda en estado REGISTRADO y se registra qué usuario lo creó.

#### HU-18 — Validar pago (RF-19, RF-24)

- Solo se valida un pago REGISTRADO (RN-03); se registran usuario y fecha de validación.
- Un pago validado no se puede editar.
- La acción pide confirmación y toma como máximo tres acciones desde el listado.

#### HU-19 — Rechazar pago (RF-20, RF-24)

- El motivo es obligatorio; RECHAZADO es final y no genera recibo.
- Se registran el usuario y la fecha del rechazo; el cliente ve el motivo en su portal.

#### HU-35 — Plan de cuotas (RF-40)

- Se define el número de cuotas y el sistema propone valores y fechas mensuales editables.
- La suma de las cuotas es igual a la prima total (RN-15).
- Cada cuota tiene número, valor, fecha de vencimiento y estado; una póliza de pago único tiene una
  sola cuota.

#### HU-37 — Vencimiento automático de cuotas (RF-42)

- Tarea diaria a las 00:05 que marca VENCIDA la cuota no pagada cuya fecha ya pasó (RN-14).
- Una póliza con cuotas vencidas se muestra en mora (RN-16); la tarea registra su ejecución en logs.

#### HT-14 — Cadena de suministro (RNF-32 a RNF-34)

- Renovate agrupado, alertas de vulnerabilidad inmediatas y acciones fijadas por SHA
  (`helpers:pinGitHubActionDigestsToSemver`).
- La CI falla con `pnpm audit --audit-level=high` en dependencias de producción.
- Semgrep CE (`p/typescript`, `p/nodejs`, `p/owasp-top-ten`) sobre API y SPA; falla ante severidad
  alta.
- gitleaks revisa todo el historial en la CI; secretlint bloquea secretos en cada commit con
  lint-staged.
- zizmor sin hallazgos altos y permisos mínimos por job.

#### HU-22 — Emitir recibo digital (RF-25)

- Pago VALIDADO y recibo PENDIENTE_ANCLAJE en la misma transacción; código aleatorio de ≥ 10
  caracteres (RN-12); `keccak256(sal ‖ JSON canónico)` con sal de 32 bytes; ningún dato personal en
  la cadena (RN-06); exactamente un recibo por pago validado (RN-04).

#### HU-23 — Anclaje con reintentos (RF-26 a RF-28)

- El API responde antes de la confirmación en la cadena; worker con concurrencia 1 y
  `jobId = reciboId`; hasta 5 reintentos con espera creciente y luego FALLIDO; barrido cada 30 s de
  pendientes con más de 60 s; si el worker se detiene y reinicia, cada recibo se ancla una sola vez;
  se guardan txHash, bloque, gasUsed, creadoEn, enviadoEn y ancladoEn.

#### HU-42 — Saldo de la cuenta operadora (RF-47)

- El panel del administrador muestra el saldo; el umbral es configurable; bajo el umbral se muestra
  una alerta y se registra en los logs.

#### HT-15 — Seguridad del contrato y de la cuenta operadora (RNF-11, RNF-42)

- `DEFAULT_ADMIN_ROLE` en una cuenta distinta de la operadora que no reside en el servidor.
- Las pruebas demuestran que solo `REGISTRADOR_ROLE` registra y anula, y que solo el administrador
  pausa, otorga y revoca roles.
- Un procedimiento probado en el nodo local rota la cuenta operadora y pausa el registro ante una
  filtración.

### Fuera de alcance (no implementar)

- Estado de anclaje con sondeo de 10 s, recibo imprimible, botón de reintento y verificación del
  CLIENTE (HU-24, HU-25, HU-26, HU-28: S5). HT-13 solo cambia el aspecto de esas pantallas.
- Aplicar pagos a cuotas (HU-36, S5): en S4 `Cuota.valorPagado` no cambia al validar.
- Listado de pagos con filtro por cliente y orden "por validar primero" (HU-20, S5).
- Saldo visible en la póliza y en el portal (HU-15, S6): en S4 el saldo solo se calcula para RN-02.
- Anulación con motivo (HU-27, S6): no se toca `AnularReciboUseCase`.
- Mesa de validación con documento a la izquierda (HU-17 y HU-50, S7): en S4 se valida desde la fila.
- Contadores del límite de tasa en Redis (HT-08, S8).
- Ejecutar en Amoy la transferencia del administrador (acción del autor, sección 15).

## 2. Decisiones tomadas (no reabrir)

| #   | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Motivo                                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Se mantienen las fechas de la tabla 6-1. El sprint lo ejecutan agentes de IA, así que el tiempo de ejecución no limita el alcance: entran todas las historias. El informe reporta **solo las horas de backlog** (79 h por historia, sección 18); no se estiman ni se reportan horas reales. HT-13 entra como deuda de S3. Si algo no cierra el 30/10, pasa a la holgura de S5 en el orden de contingencia de la sección 16 y se informa.                                                                                                                                                                                                                                                            | Grilling del 23/10 y del 24/10; el backlog no se edita.                                                                                                         |
| D2  | HT-13 se hace **completa en la Etapa A**, antes que cualquier pantalla nueva. La deuda visual de S3 entra en HT-13: icono de dirección en «Vigencia», `scope="col"` en `components/ui/table.tsx` y los alias `Ramo`, `OrdenPoliza` y `FiltroEstadoCliente` de `types/index.ts` reemplazados por los tipos de `@oasis/shared`.                                                                                                                                                                                                                                                                                                                                                                       | Evita rehacer pantallas; la deuda toca los mismos archivos.                                                                                                     |
| D3  | Fuentes con `@fontsource-variable/outfit` y `@fontsource-variable/figtree` (mismo origen). Isologo desde `docs/diseno/prototipo/logo.png` copiado a `apps/web/src/assets/isologo-oasis.png` (optimizado, con `alt="Oasis Seguros"`). Iconos con `lucide-react` (ya instalado).                                                                                                                                                                                                                                                                                                                                                                                                                      | Criterio de HT-13 (sin CDN de terceros); sin dependencias nuevas de iconos.                                                                                     |
| D4  | Un único `EstadoInsignia` (`apps/web/src/components/EstadoInsignia.tsx`) recibe `dominio` y `estado`; el vocabulario vive en `components/estados.ts` como `Record<Dominio, Record<Estado, { tono, icono, texto }>>` tipado con las constantes de `@oasis/shared`, de modo que el `typecheck` falla si falta un estado. Dominios: `pago`, `recibo`, `poliza`, `cliente`, `verificacion`, `cuota`, `cuenta`. Cinco tonos: éxito, proceso, aviso, error y neutro (DESIGN.md). El dominio `cuota` necesita `ESTADOS_CUOTA` en `@oasis/shared`, que la Etapa A agrega (T1) con los valores del enum `EstadoCuota` que ya existe en Prisma.                                                               | The Three Signals Rule; un solo lugar para el vocabulario; las cuotas de la Etapa B lo reutilizan sin tocar el componente.                                      |
| D5  | Métodos de pago: se agrega `DEBITO_BANCARIO` («Débito bancario») a `METODOS_PAGO` y al seed (upsert idempotente). Los demás se conservan.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | HU-16.                                                                                                                                                          |
| D6  | `crearPagoSchema`: `monto` con `montoPositivoSchema` (> 0, dos decimales); `referencia` **obligatoria** (1 a 100 caracteres, recortada); `fechaPago` no futura (fecha de Guayaquil). Unicidad `@@unique([polizaId, referencia])` en `Pago`: repetirla → 409 `REFERENCIA_DUPLICADA` con `details: { campo: 'referencia' }`, también por `P2002`.                                                                                                                                                                                                                                                                                                                                                     | HU-16 la exige; adelanta RN-22 a nivel de base para que HU-50 no tenga que migrar datos (confirmado el 24/10).                                                  |
| D7  | **Saldo** de la póliza = `primaTotal − Σ pagos VALIDADOS`. RN-02 se exige al **registrar** (monto ≤ saldo) y otra vez al **validar** (monto ≤ saldo en ese momento), igual que RN-01. Error: 422 `MONTO_SUPERA_SALDO` con `details: { campo: 'monto', saldo: '518.40' }`. El saldo se calcula con `aggregate` en el repositorio (método `saldoPoliza(polizaId)`), sin N+1. Dos validaciones **simultáneas** sobre la misma póliza aún pueden pasar las dos: se marca con `ponytail:` y se cierra en S5 (HU-36), que bloquea las cuotas con `FOR UPDATE` dentro de la transacción de validación.                                                                                                     | Dos pagos registrados podrían sumar más que la prima: la segunda comprobación lo impide (confirmado el 24/10).                                                  |
| D8  | Rechazo: columnas nuevas `Pago.rechazadoPorId` (relación `PagoRechazadoPor`) y `Pago.rechazadoEn`. La migración mueve a ellas los `validadoPorId`/`validadoEn` de los pagos RECHAZADOS y los pone en `NULL`. La respuesta `Pago` suma `rechazadoPorId` y `rechazadoEn`. `/mis-pagos` ya devuelve `motivoRechazo`; `PanelCliente` lo muestra.                                                                                                                                                                                                                                                                                                                                                        | HU-19 pide registrar usuario y fecha del rechazo sin reutilizar campos de la validación.                                                                        |
| D9  | "Un pago validado no se puede editar": no existe edición de pagos; el dominio `Pago` expone `puedeEditarse()` (solo REGISTRADO) y una prueba de rutas confirma que no hay `PATCH /pagos/:id` ni `PUT`. Si en el futuro se agrega edición, la regla ya existe.                                                                                                                                                                                                                                                                                                                                                                                                                                       | Evidencia del criterio sin construir funcionalidad sin uso.                                                                                                     |
| D10 | Validar desde el listado en **tres acciones**: (1) botón «Validar» de la fila, (2) casilla/confirmación en el diálogo con el resumen del pago, (3) «Validar y emitir recibo» (oro). Rechazar: botón de contorno rojo → diálogo con chips de motivos frecuentes y texto obligatorio (5 a 300) → «Rechazar pago» (rojo sólido).                                                                                                                                                                                                                                                                                                                                                                       | HU-18 y DESIGN.md (Buttons, Chips).                                                                                                                             |
| D11 | **Plan de cuotas** (ADR-020): toda póliza nace con **una cuota** por la prima total, con vencimiento en `fechaInicio`, en la misma transacción que la crea. La migración crea esa cuota para las pólizas existentes. `PUT /polizas/:id/cuotas` reemplaza el plan completo solo si la póliza está VIGENTE y **no tiene pagos VALIDADOS** (si no → 422 `PLAN_CON_PAGOS_VALIDADOS`); suma = prima (RN-15, si no → 422 `PLAN_NO_CUADRA` con `details: { suma, prima }`); de 1 a 24 cuotas; números 1..N consecutivos; fechas estrictamente crecientes dentro de `[fechaInicio, fechaFin]`. `GET /polizas/:id/cuotas` devuelve el plan. Auditado como `MODIFICAR` sobre `PlanCuotas`.                    | Pago único por defecto; el saldo y la mora (HU-15, HU-37) siempre tienen cuotas sobre las que operar (confirmado el 24/10).                                     |
| D12 | Propuesta del plan: función pura `proponerPlanCuotas(prima, n, fechaInicio)` en `packages/shared/src/dominio/cuotas.ts` (la usan la SPA para proponer y el API en pruebas). Valores en centavos enteros: `floor(prima/n)` y la **última cuota absorbe el residuo**; fechas mensuales desde `fechaInicio`, recortando al último día del mes (31/01 → 28/02 → 31/03).                                                                                                                                                                                                                                                                                                                                 | Sin aritmética de coma flotante; las fechas de fin de mes no se desbordan.                                                                                      |
| D13 | Editar la prima (`PATCH /polizas/:id`, ya bloqueado con pagos VALIDADOS por ADR-018): con plan de una cuota, la cuota toma la nueva prima; con plan de N cuotas, se **recalcula** con `proponerPlanCuotas(primaNueva, N, fechaInicio)` y se conservan las fechas actuales. La SPA lo advierte antes de guardar. Cambiar `fechaInicio`/`fechaFin` con un plan cuyas fechas quedan fuera de la vigencia → 422 `PLAN_FUERA_DE_VIGENCIA`.                                                                                                                                                                                                                                                               | RN-15 se mantiene siempre sin que el operador tenga que rehacer el plan a mano (confirmado el 24/10).                                                           |
| D14 | **Vencimiento (HU-37)**: `MarcarCuotasVencidasUseCase` en el módulo `polizas`, disparado por `VencimientoCuotasTask` en el worker con `@Cron('5 0 * * *', { timeZone: 'America/Guayaquil' })`. Marca VENCIDA toda cuota PENDIENTE o PARCIAL con `fechaVencimiento < hoy` (fecha de Guayaquil, por `ClockPort`) en un solo `updateMany`. Es idempotente y se pone al día sola si el worker estuvo apagado. Log `info` con `{ tarea: 'vencimiento-cuotas', actualizadas, duracionMs }`; en error, log `error` y la siguiente ejecución reintenta.                                                                                                                                                     | RN-14; un cron perdido no deja cuotas sin marcar.                                                                                                               |
| D15 | **Mora (RN-16)**: la respuesta de póliza suma `enMora: boolean` (existe alguna cuota VENCIDA), calculado con `_count` filtrado en la misma consulta. `PolizasPage` muestra la insignia «En mora» (tono error) junto al estado.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Sin N+1 (`AGENTS.md`).                                                                                                                                          |
| D16 | HU-22 y HU-23 ya existen (sección 3). Se completan con: prueba unitaria de `EmitirReciboUseCase` (código ≥ 10, sal de 32 bytes, payload sin datos personales) y prueba e2e de **reinicio del worker** (T26). ADR-007 (API y worker como procesos y contenedores separados) ya está redactada. No se reescribe código que ya cumple.                                                                                                                                                                                                                                                                                                                                                                 | Evidencia por criterio sin retrabajo.                                                                                                                           |
| D17 | **Saldo de la operadora (HU-42)**: `SaldoOperadoraTask` en el worker (`@Interval(300_000)` y una vez al arrancar) lee el saldo con `getBalance` y escribe en Redis `operadora:saldo` = `{ wei, pol, umbralPol, bajoUmbral, actualizadoEn }` con TTL de 15 min; publica la métrica `oasis_operadora_saldo_pol` (gauge) y, bajo el umbral, un log `warn` `{ evento: 'saldo-operadora-bajo', pol, umbralPol }`. El umbral es `UMBRAL_SALDO_OPERADORA_POL` (por defecto `0.5`) en `validateWorkerEnv`. El API expone `GET /operadora/saldo` (solo ADMIN, sin auditoría) que lee la llave; sin llave → `{ disponible: false }`. El API **no** recibe la dirección ni la clave.                           | ADR-006: solo el worker conoce la cuenta; la métrica sirve después para las alertas de HT-07.                                                                   |
| D18 | **Administrador del contrato (HT-15, ADR-021)**: billetera fría (cuenta que nunca toca el servidor). Scripts `transferir-admin.ts` (`grantRole(DEFAULT_ADMIN_ROLE, fria)` + `renounceRole` del desplegador, con comprobación previa de que la fría quedó admin) y `rotar-operadora.ts` (`grantRole(REGISTRADOR_ROLE, nueva)` → `revokeRole(REGISTRADOR_ROLE, anterior)`, opción `--pausar`). Ambos se prueban en el nodo local con `node:test` + viem. Ejecutarlos en Amoy es acción del autor (D24).                                                                                                                                                                                               | Un solo firmante real: una Safe 2/2 no agrega seguridad.                                                                                                        |
| D19 | **HT-14**: Renovate como app de GitHub con `renovate.json` (`config:recommended`, `helpers:pinGitHubActionDigestsToSemver`, `:semanticCommits`, grupos por ecosistema, `vulnerabilityAlerts` sin horario, horario semanal para el resto, `rangeStrategy: pin` en devDependencies). Job `seguridad` en `ci.yml` con `pnpm audit --prod --audit-level=high`, Semgrep (imagen `semgrep/semgrep`, `--severity ERROR --error`), gitleaks (binario con `fetch-depth: 0`) y zizmor (`--min-severity high`). Cada job declara `permissions` propios. Las acciones existentes se fijan por SHA en este mismo sprint. secretlint en lint-staged con `@secretlint/secretlint-rule-preset-recommend`.           | Criterios literales; el pin inicial no espera al primer PR de Renovate.                                                                                         |
| D20 | Estados de verificación, CLIENTE en la verificación, `payloadCanonico` fuera del detalle y ramos reales **no** se tocan en S4 (S5). ADR-014 ya figura como **retirada** por el backlog v1.5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Regla de alcance; acuerdo del grilling.                                                                                                                         |
| D21 | Pruebas por etapa. **Etapa A:** Vitest de `EstadoInsignia` (exhaustivo) y de la navegación; las Vitest existentes en verde sin tocar sus aserciones de comportamiento; Playwright `diseno.spec.ts` (axe AA, foco, 44 px, 360 px y fuentes del mismo origen en las 11 pantallas). **Etapa B:** TDD de esquemas, `proponerPlanCuotas`, dominio de plan de cuotas, casos de uso nuevos y tareas del worker; e2e `pagos`, `cuotas`, `operadora` y `reinicio-worker`; Vitest de `FormularioPago`, diálogos de validar y rechazar, `PlanCuotasDialog` y panel de saldo; Playwright `pagos-cuotas.spec.ts` y `diseno.spec.ts` extendido a las pantallas nuevas. Solo Chromium (Firefox y WebKit en HT-09). | Evidencia por criterio (sección 17); cada commit queda verde por sí solo.                                                                                       |
| D22 | Las e2e que validan, rechazan o cambian planes **crean su propia póliza**; nunca alteran la del seed, que `flujo-anclaje` e `idempotencia-anclaje` buscan con `findFirst({ estado: 'VIGENTE' })`. Como la referencia ahora es única por póliza, cada prueba genera su referencia con `randomUUID()`.                                                                                                                                                                                                                                                                                                                                                                                                | Corridas repetibles.                                                                                                                                            |
| D23 | **Dos etapas secuenciales estrictas** en la misma rama: la Etapa A (HT-13) se cierra por completo (pruebas, revisión, DoD, capturas al lado del prototipo y visto bueno del desarrollador) y se confirma como **commit 1** antes de que empiece cualquier tarea de la Etapa B. La Etapa B cierra con una **segunda pausa** de capturas de las pantallas nuevas y el **commit 2**. Un solo PR con los dos commits, que abre el desarrollador.                                                                                                                                                                                                                                                        | Grilling del 24/10: el diseño es lo más subjetivo del sprint; si requiere ajustes, no hay que rehacer nada de la Etapa B, y cada commit es un bloque revisable. |
| D24 | **Acciones del desarrollador**, con fecha límite el 30/10 y lista de verificación en el informe: (1) instalar la app de Renovate en el repositorio; (2) crear la billetera fría (cuenta nueva de MetaMask u otra billetera, sin otro uso, con la frase semilla solo en papel); (3) ejecutar en Amoy `transferir-admin.ts` hacia ella y anotar el txHash. El criterio HT-15.1 se da por cumplido con el paso 3; hasta entonces el informe lo marca como pendiente del autor.                                                                                                                                                                                                                         | Requieren su cuenta de GitHub y su billetera (grilling del 24/10).                                                                                              |

## 3. Estado de partida (verificado el 23/10/2026)

- **Pagos (`apps/api/src/modules/pagos/`):** `POST /pagos` con RN-01 (`exigirPolizaVigente`),
  `registradoPorId` y estado REGISTRADO; falta RN-02, Débito bancario y la referencia obligatoria.
  `PATCH :id/validar` (`ValidarPagoUseCase`, con spec) exige `confirmado: true` y llama a
  `validarYCrearRecibo` en una transacción. `PATCH :id/rechazar` exige motivo de 5 a 300, pero
  `PrismaPagosRepository.rechazar` guarda el autor en `validadoPorId`/`validadoEn`. `GET /pagos`
  filtra por estado, póliza, fechas y `q`. `/mis-pagos` devuelve `motivoRechazo`.
- **Recibos (`apps/api/src/modules/recibos/`):** `EmitirReciboUseCase` (código `RC-` + 12 hex, sal de
  32 bytes, payload canónico sin datos personales, `pagoId @unique`), `AnclajeProcessor`
  (concurrencia 1), `jobId = reciboId`, 5 intentos con backoff (`QueueModule`), `BarridoPendientesTask`
  (30 s / 60 s), txHash, bloque, gas y marcas de tiempo. e2e `flujo-anclaje` e `idempotencia-anclaje`.
  Falta la prueba unitaria de emisión y la de reinicio del worker.
- **Cuotas:** el esquema tiene `Cuota` (`valorPagado`, `estado` con el enum `EstadoCuota`,
  `@@unique([polizaId, numero])`, índice `[estado, fechaVencimiento]`) y `AplicacionPago`, sin
  código que los use. Las pólizas existentes no tienen cuotas.
- **Worker:** `WorkerModule` con `ScheduleModule.forRoot()`, `AnclajeProcessor` y
  `BarridoPendientesTask`; `CuentaOperadoraModule` solo aquí.
- **Contrato:** pruebas de `pause`/`unpause`, `REGISTRADOR_ROLE` y administrador;
  `scripts/grant-registrador.ts`; `ignition/parameters/amoy.json` vacío (el admin es el desplegador);
  nota de rotación en `docs/despliegue.md`.
- **CI:** `ci.yml` con `permissions: contents: read` global, acciones por etiqueta (`@v5`, `@v4`) y
  Slither; no hay Renovate, auditoría, Semgrep, gitleaks, zizmor ni secretlint
  (`.lintstagedrc.json` solo tiene Prettier y ESLint).
- **SPA:** `index.css` con la paleta oklch provisional de shadcn y fuentes del sistema; no hay
  isologo, barra inferior ni componente de estado; `badge.tsx` de shadcn se usa con colores sueltos.
  Páginas: `LoginPage`, `CambiarContrasenaPage`, `DashboardPage` (con `PanelPersonal` y
  `PanelCliente`), `PagosPage`, `RecibosPage`, `ReciboDetallePage`, `VerificacionPage`,
  `ClientesPage`, `PolizasPage`, `AseguradorasPage`, `UsuariosPage` y `BitacoraPage`. `PagosPage`
  ya tiene `ConfirmarPagoDialog` para validar.
- **Shared:** `METODOS_PAGO = ['TRANSFERENCIA', 'DEPOSITO', 'EFECTIVO', 'TARJETA']`; no hay
  constantes ni esquemas de cuotas. Cliente y usuario no tienen constante de estado (son el booleano
  `activo`).
- **Seed:** métodos sin Débito bancario; una póliza VIGENTE de ramo VEHICULOS con pagos de ejemplo.
- **ADR:** ADR-007, ADR-020 y ADR-021 ya están redactadas (23/10/2026) y la tabla 11-1 de la
  arquitectura las incluye; ADR-014 figura como retirada.
- **Entorno (informes de S1 a S3):** `pnpm` es el binario de Windows aunque se invoque desde WSL; si
  Windows define `CONTRACT_ADDRESS`, pisa el `.env`; limpia `bull:anclaje-recibos:*` con el worker
  detenido; WSL no tiene cliente `docker` (se usa `docker.exe` con Docker Desktop encendido); el
  `git status` muestra ~450 archivos con solo cambio de modo (T0.1).

---

# ETAPA A — Sistema de diseño (HT-13)

## 4. Fase A0 — Preparación (sesión principal)

### T0. Entorno, rama, dependencias de la Etapa A, línea base y deuda por confirmar

1. **Modo de archivo:** `git config core.fileMode false` y comprobar que `git status --short` queda
   vacío (o solo con cambios reales). Sin commit.
2. **Rama** `feat/sprint-s4-pagos-recibos` desde `main` actualizado. Si `main` tiene cambios sin
   commit del desarrollador (por ejemplo en `docs/referencia/` o en estos planes), **no** se
   descartan ni se incluyen: se detiene y se le pregunta cómo proceder.
3. **Dependencias de la Etapa A** (un solo `pnpm install`):
   - `apps/web`: `@fontsource-variable/outfit`, `@fontsource-variable/figtree`;
     devDependency `@axe-core/playwright`.
   - Fija versiones exactas con al menos dos semanas de antigüedad y anótalas en el ledger.
4. **Línea base:** `pnpm install --frozen-lockfile`, `pnpm -r build`, `pnpm -r typecheck`,
   `pnpm test`; totales en `.superpowers/sdd/sprint-s4-plan/principal.md`. Si algo está rojo, detente.
5. **Deuda por confirmar** (informes de S2 y S3): comprobar en el código y anotar en el ledger si
   siguen abiertas: (a) errores de Zod que llegan en dos tandas al formulario de cliente;
   (b) `razonSocial = ''` guardado en lugar de `NULL`. Si (a) sigue abierta y es de interfaz, se suma
   a T5; si (b) sigue abierta, se suma a T15 (Etapa B). Si su arreglo no es de una línea, va como
   deuda al informe con su sprint destino.

## 5. Fase A1 — Estados de cuota (`contrato-shared`)

### T1. `ESTADOS_CUOTA` (`contrato-shared`, HT-13; TDD)

- **Archivos:** `packages/shared/src/constants/estados.ts`, `index.ts` si no reexporta todo, y su
  prueba.
- **Cambio:** `ESTADOS_CUOTA = ['PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA'] as const` y
  `type EstadoCuota`, en el mismo orden que el enum `EstadoCuota` de `schema.prisma`.
- **Pruebas primero:** la constante coincide con el enum de Prisma (lista literal en la prueba, con
  un comentario que remite al esquema).
- **Cierre (sesión principal):** `pnpm --filter @oasis/shared build` y `test`; borrar
  `apps/web/node_modules/.vite`.

## 6. Fase A2 — Sistema de diseño en la SPA (`frontend-spa`)

Una sola línea de trabajo, en orden: T2 → T3 → T4 → T5. Tokens, botones, campos e insignia primero,
porque cambian todas las pantallas a la vez; después, las pantallas una por una, en orden de uso.

### T2. Tokens, fuentes e isologo (`frontend-spa`, HT-13)

- **Archivos:** `apps/web/src/index.css`, `src/main.tsx` (imports de Fontsource si no van en el CSS),
  `src/assets/isologo-oasis.png`, `components/ui/*.tsx` que tengan colores sueltos.
- **Tokens:** los de `docs/diseno/README.md` §«Tokens para `apps/web/src/index.css`» en `:root` y
  su `@theme inline`, más radios (`--radius-sm` 6, `md` 8, `lg` 12, `xl` 16), alturas de control
  (`--control-h` 44, `--input-h` 48, `--login-h` 56), tipografía (Outfit para display/títulos/cifras
  con `font-variant-numeric: tabular-nums`, Figtree para cuerpo) y movimiento (120–150 ms, `ease-out`;
  `prefers-reduced-motion` las anula).
- **Regla:** ningún componente usa colores fuera de los tokens. Verificación con
  `rg -n "(#[0-9a-fA-F]{3,8}|oklch\(|rgb\(|bg-(red|green|blue|yellow|gray|slate)-)" apps/web/src --glob '!index.css'`
  sin resultados (salvo los `rgba` de sombra documentados en DESIGN.md, que se mueven a variables).
- **Botones** (`button.tsx`): variantes `primary` (degradado oro, sombra de acción dorada),
  `secondary` (papel), `quiet` (arena), `danger-outline`, `danger` y `link`; altura mínima 44 px.
- **Campos** (`input.tsx`, `select.tsx`): 48 px, texto de 16 px, foco de 2 px en tinta noche con
  anillo `rgba(226,173,91,.38)`, error con borde rojo y mensaje `role="alert"`.

### T3. Navegación y encabezado (`frontend-spa`, HT-13; TDD)

- **Archivos:** `components/layout/AppLayout.tsx` (+test), `components/layout/RielPersonal.tsx`,
  `components/layout/BarraInferiorCliente.tsx`, `components/layout/Encabezado.tsx` (nuevos si el
  layout crece; si no, dentro de `AppLayout`).
- **Personal:** riel de 92 px en noche del oasis con isologo arriba, ítems de 56 px (icono 22 px en
  arena tenue, etiqueta de 12 px), activo en noche alta con icono y texto en oro, `aria-current="page"`;
  avatar con menú del usuario al pie. A 760 px el riel pasa a barra superior horizontal con
  desplazamiento.
- **Cliente (teléfono):** barra inferior de papel con 4 pestañas (Inicio, Pólizas, Recibos, Cuenta),
  icono de 22 px y etiqueta de 12 px, activa en café de enlace y 700, objetivos ≥ 44 px. En S4 las
  pestañas sin página aún (Pólizas, Recibos) apuntan a las secciones existentes del `PanelCliente`
  (anclas) y «Cuenta» a cambiar contraseña; HU-29 (S6) les da sus páginas.
- **Encabezado de página:** título (headline 30 px), frase de contexto y acciones a la derecha.
- **Pruebas primero (Vitest):** el ítem activo tiene `aria-current`; el CLIENTE ve la barra inferior
  y no el riel; el OPERADOR no ve los ítems de ADMIN; navegación por teclado (Tab y Enter).

### T4. `EstadoInsignia` (`frontend-spa`, HT-13; TDD)

- **Archivos:** `components/EstadoInsignia.tsx`, `components/estados.ts`, `EstadoInsignia.test.tsx`;
  reemplaza los `Badge` de estado en todas las páginas.
- **Vocabulario** (DESIGN.md §Insignias): pago (Por validar · Validado · Rechazado), recibo
  (En proceso · Verificable · Requiere atención · Anulado; PENDIENTE_ANCLAJE y ENVIADO → En proceso,
  ANCLADO → Verificable, FALLIDO → Requiere atención), póliza (Vigente · Vencida · Cancelada, más
  «En mora», que la Etapa B empieza a usar), cliente (Activo · Desactivado), cuota (Pendiente · Pago
  parcial · Pagada · Vencida, con `ESTADOS_CUOTA` de T1), verificación (con los códigos actuales:
  VALIDO → Auténtico, HASH_INCONSISTENTE → No coincide, NO_ANCLADO → En proceso, ANULADO → Anulado,
  NO_ENCONTRADO → No encontrado; S5 renombra los códigos), cuenta (Activa · Desactivada, para
  `UsuariosPage`).
- Cada estado usa siempre el mismo icono de `lucide-react`; el icono es `aria-hidden` y el texto es
  el nombre accesible.
- **Pruebas primero:** cada estado de cada dominio renderiza texto e icono; tono correcto por clase;
  el mapa es exhaustivo (prueba que recorre `ESTADOS_*` de `@oasis/shared`).

### T5. Pantallas existentes en Claroscuro (`frontend-spa`, HT-13)

- **Pantallas, en este orden:** inicio de sesión (fotografía del oasis
  `docs/diseno/prototipo/oasis.jpg` copiada a `src/assets/` con velo medido, isologo, título display,
  formulario de 480 px máx., botón de 56 px), inicio (`PanelPersonal` con «The Task First Rule»:
  cifra «Por validar» en panel de noche; `PanelCliente` con héroe del portal), pagos, recibos y su
  detalle, verificación, clientes, pólizas, aseguradoras, usuarios, bitácora y cambio de contraseña.
- **Sin cambiar comportamiento:** las pruebas Vitest existentes deben pasar sin tocar sus
  aserciones de comportamiento (solo selectores de estilo, si alguno dependía de clases).
- **Deuda de S3 (D2):** `scope="col"` en `TableHead` de `components/ui/table.tsx`; icono de
  dirección en «Vigencia» (`ArrowUp`/`ArrowDown` `aria-hidden`, con `aria-sort` intacto); retirar
  los alias de `types/index.ts` y usar los tipos de `@oasis/shared`.
- **Formato:** montos con `Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })` y
  fechas `dd/mm/aaaa`, en un único `lib/formato.ts` (si ya existe, se reutiliza).
- **Verificación:** `impeccable audit` y `polish` sobre las 11 pantallas; anota en la nota de
  traspaso las diferencias deliberadas con el prototipo y su motivo.

**Cierre de la Fase A2 (sesión principal):** `pnpm --filter @oasis/web lint`, `typecheck`, `test` y
`build`; `pnpm format:check`. Salida al ledger.

## 7. Fase A3 — Evidencia y revisión de la Etapa A

### T6. `diseno.spec.ts` (`verificador`, HT-13)

- Infraestructura arriba (`compose.dev.yaml`, nodo Hardhat, `pnpm dev:chain`, `migrate deploy`,
  `seed`).
- **`apps/web/e2e/diseno.spec.ts`:** para cada una de las 11 pantallas, con el rol que corresponde:
  `AxeBuilder().withTags(['wcag2a', 'wcag2aa'])` sin violaciones; foco visible al tabular (el
  elemento enfocado tiene `outline` o `box-shadow` no nulos); a 360 px `scrollWidth <= 360`; en el
  portal del CLIENTE, cada objetivo interactivo mide ≥ 44 × 44 px (`boundingBox`); las fuentes se
  piden al mismo origen (`page.on('request')` sin dominios externos).
- Estructura la lista de pantallas como un arreglo `{ nombre, ruta, rol }` para que la Etapa B solo
  agregue entradas (T27).
- `responsive.spec.ts` y los demás specs existentes siguen en verde.

### T7. Revisión de la Etapa A (`revisor`) y documentación (`documentacion`)

- **`revisor`:** revisa el diff de la Etapa A contra D2 a D4, el criterio HT-13, DESIGN.md,
  `AGENTS.md`, `ponytail-review`, `accessibility` e `impeccable audit`. Puntos de atención: ningún
  color fuera de tokens, la regla del oro (una acción dorada por vista), `EstadoInsignia` en todas
  las pantallas (ningún `Badge` de estado suelto), contraste AA de los textos sobre noche y sobre la
  fotografía, foco visible, `aria-current` y que ningún comportamiento cambió. La sesión principal
  reparte los hallazgos **bloqueantes** y los **menores** dentro del alcance; una ronda de
  confirmación como máximo.
- **`documentacion` (T7.doc):** `CLAUDE.md` §SPA (tokens aplicados en `index.css`, `EstadoInsignia`
  y `components/estados.ts`, riel del personal y barra inferior del cliente, `lib/formato.ts`) y
  `docs/diseno/README.md` si la correspondencia de tokens cambió durante la implementación.

## 8. Fase A4 — Cierre de la Etapa A (sesión principal)

### T8. DoD A, capturas, visto bueno y commit 1

1. **DoD de la etapa:**

   ```bash
   pnpm install --frozen-lockfile
   pnpm -r build && pnpm -r lint && pnpm format:check && pnpm -r typecheck
   pnpm deps:check && pnpm deps:check:negativo
   pnpm test
   pnpm test:e2e                       # el API no cambió: debe seguir en verde
   pnpm --filter @oasis/web test:e2e   # incluye diseno.spec.ts
   ```

2. **Capturas** con un script de Playwright temporal en `.superpowers/sdd/sprint-s4-plan/` (no se
   versiona): las 11 pantallas de la SPA y sus equivalentes del prototipo
   (`docs/diseno/prototipo/index.html`), a 1280 y 360 px, guardadas en `capturas/etapa-a/` con
   nombres pareados (`pagos-spa-1280.png`, `pagos-prototipo-1280.png`). Las pantallas sin
   equivalente en el prototipo se capturan solas.
3. **Punto de control 1:** la sesión principal se detiene y presenta al desarrollador la lista de
   capturas pareadas (rutas absolutas), las diferencias deliberadas de T5 y el resultado de la DoD.
   Espera «aprobado» o una lista de ajustes. Con ajustes, relanza a `frontend-spa`, repite el cierre
   de A2, T6 y esta tarea, y vuelve a presentar.
4. **Commit 1** (solo con «aprobado»). Revisa con `git status` que no entren `.env`,
   `.superpowers/`, `.agents/`, `.claude/`, `*.docx` ni `ignition/deployments/chain-31337`:

   ```bash
   git add -A
   git commit -F - <<'EOF'
   feat(web): implementar el sistema de diseño Claroscuro

   - Tokens de color, tipografía, radios, alturas y movimiento en index.css; fuentes del mismo origen.
   - Isologo, riel del personal, barra inferior del cliente y encabezado de página.
   - EstadoInsignia único para pagos, recibos, pólizas, clientes, cuentas, cuotas y verificación.
   - Las 11 pantallas existentes en Claroscuro sin cambio de comportamiento; deuda visual de S3.
   - diseno.spec.ts: axe AA, foco visible, 44 px y 360 px.

   Refs: HT-13
   EOF
   ```

---

# ETAPA B — Pagos, cuotas, recibos y seguridad

## 9. Fase B0 — Preparación (sesión principal)

### T9. Línea base y dependencias de la Etapa B

1. Confirma que el commit 1 está en la rama y que `git status` está limpio.
2. **Dependencias de la Etapa B:** devDependencies raíz `secretlint` y
   `@secretlint/secretlint-rule-preset-recommend` (versiones exactas con al menos dos semanas,
   anotadas en el ledger).
3. **Línea base:** `pnpm -r build`, `pnpm -r typecheck`, `pnpm test`; totales en el ledger.

## 10. Fase B1 — Contratos compartidos y ADR (`contrato-shared` y `documentacion` en paralelo)

### T10. Esquemas de pago (`contrato-shared`, HU-16, HU-18, HU-19; TDD)

- **Archivos:** `packages/shared/src/constants/estados.ts`, `schemas/pago.schema.ts`,
  `schemas/common.schema.ts` si hace falta, pruebas en `packages/shared/src/**/*.spec.ts` (o el
  archivo de pruebas existente de esquemas).
- **Cambios:**
  - `METODOS_PAGO` suma `DEBITO_BANCARIO` (D5) y una constante
    `ETIQUETAS_METODO_PAGO: Record<MetodoPago, string>` con «Débito bancario», «Transferencia»,
    «Depósito», «Efectivo» y «Tarjeta».
  - `crearPagoSchema` según D6 (monto positivo, referencia obligatoria, fecha no futura con un
    `refine` que compara contra la fecha local de Guayaquil, recibida como función inyectable o
    calculada con `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' })`).
  - `pagoSchema` suma `rechazadoPorId` y `rechazadoEn` (`nullish`).
  - Constante `MOTIVOS_RECHAZO_FRECUENTES` (chips de D10): «El monto no coincide con la
    notificación», «La referencia no corresponde», «Pago duplicado», «La póliza no corresponde».
- **Pruebas primero:** referencia vacía o de 101 caracteres → error; monto `0` y `-1` → error;
  `10.555` → error; fecha de mañana → error; `DEBITO_BANCARIO` aceptado.

### T11. Esquemas y dominio de cuotas (`contrato-shared`, HU-35, HU-37; TDD)

- **Archivos:** `schemas/cuota.schema.ts` (nuevo), `dominio/cuotas.ts` (nuevo), `index.ts`,
  `schemas/poliza.schema.ts` (`enMora`). `ESTADOS_CUOTA` ya existe (T1).
- **Esquemas:**
  - `cuotaSchema`: `{ id, numero, valor, valorPagado, fechaVencimiento, estado }`.
  - `definirPlanCuotasSchema`: `{ cuotas: [{ numero, valor, fechaVencimiento }] }` con 1 a 24
    elementos, `valor` con `montoPositivoSchema`, números consecutivos desde 1 y fechas
    estrictamente crecientes (`superRefine` con `path` al elemento que falla). La suma contra la
    prima y la vigencia se validan en el API (D11), porque el esquema no conoce la póliza.
  - `polizaSchema` suma `enMora: boolean` (D15).
- **Dominio:** `proponerPlanCuotas(prima: string, n: number, fechaInicio: string)` según D12 y
  `sumarMontos(valores: string[]): string` en centavos enteros.
- **Pruebas primero:** `proponerPlanCuotas('100.00', 3, '2026-01-31')` → `33.33, 33.33, 33.34` con
  fechas `2026-01-31, 2026-02-28, 2026-03-31`; `n = 1` → una cuota igual a la prima; `n = 0` o
  `n = 25` → error; la suma de la propuesta es siempre igual a la prima (prueba con varias primas,
  incluido `0.05` con `n = 3` → error porque una cuota sería `0.00`: el dominio exige que cada cuota
  sea ≥ `0.01`).

**Ejemplo (orientativo):**

```ts
export function proponerPlanCuotas(prima: string, n: number, fechaInicio: string) {
  const total = aCentavos(prima);
  if (!Number.isInteger(n) || n < 1 || n > 24 || total < n) {
    throw new RangeError('Número de cuotas inválido para la prima');
  }
  const base = Math.floor(total / n);
  return Array.from({ length: n }, (_, i) => ({
    numero: i + 1,
    valor: aMonto(i === n - 1 ? total - base * (n - 1) : base),
    fechaVencimiento: sumarMesesRecortando(fechaInicio, i),
  }));
}
```

### T12. Esquema del saldo de la operadora (`contrato-shared`, HU-42)

- `schemas/operadora.schema.ts`: `saldoOperadoraSchema` como unión discriminada por `disponible`:
  `{ disponible: true, pol: string, umbralPol: string, bajoUmbral: boolean, actualizadoEn }` |
  `{ disponible: false }`.
- **Pruebas primero:** ambas variantes parsean; `pol` sin formato decimal → error.

### T13. Contraste de ADR (`documentacion`, HU-23, HU-35, HT-15)

ADR-007, ADR-020 y ADR-021 ya están redactadas y registradas. En esta tarea solo se **contrastan**
con las decisiones D7, D11 a D18 y, si el plan las precisó, se ajustan (sin cambiar su número ni su
decisión). Si una decisión cambia de verdad durante la etapa, se corrige el ADR en T31.

**Cierre de la Fase B1 (sesión principal):** `pnpm --filter @oasis/shared build`,
`pnpm --filter @oasis/shared test`, borrar `apps/web/node_modules/.vite`; resumen de las notas para
la Fase B2.

## 11. Fase B2 — API, worker, contrato y CI en paralelo

Tres carriles en un mismo mensaje: `backend-api` (T14–T20), `contrato-blockchain` (T21) e `infra`
(T22, con su parte raíz a cargo de la sesión principal). Cada uno prueba solo su paquete.

### T14. Migración y seed (`backend-api`, HU-16, HU-19, HU-35)

- **Archivos:** `apps/api/prisma/schema.prisma`, `prisma/migrations/<fecha>_pagos_cuotas_s4/`,
  `prisma/seed.ts`.
- **Esquema:**
  - `Pago`: `rechazadoPorId String? @db.Uuid`, `rechazadoEn DateTime?`, relación
    `rechazadoPor Usuario? @relation("PagoRechazadoPor", …)` (y su lado inverso en `Usuario`),
    `@@index([rechazadoPorId])`, `@@unique([polizaId, referencia])`.
- **Migración** (`prisma migrate dev --create-only`, luego editar el SQL):
  1. Columnas y relación nuevas.
  2. `UPDATE "Pago" SET "rechazadoPorId" = "validadoPorId", "rechazadoEn" = "validadoEn",
"validadoPorId" = NULL, "validadoEn" = NULL WHERE estado = 'RECHAZADO';`
  3. Antes del índice único, resolver duplicados de `(polizaId, referencia)` existentes en datos de
     desarrollo agregando el sufijo `-<n>` a los repetidos (consulta con `ROW_NUMBER()`); anotar en
     el informe si hubo alguno.
  4. Backfill de cuotas: `INSERT INTO "Cuota" (id, "polizaId", numero, valor, "fechaVencimiento",
estado, "updatedAt") SELECT gen_random_uuid(), p.id, 1, p."primaTotal", p."fechaInicio",
'PENDIENTE', now() FROM "Poliza" p WHERE NOT EXISTS (SELECT 1 FROM "Cuota" c WHERE c."polizaId"
= p.id);`
- **Seed:** upsert de `DEBITO_BANCARIO` («Débito bancario»); la póliza del seed se crea con su cuota
  única (mismo camino que el caso de uso o `create` anidado). Sigue siendo idempotente.
- **Verificación:** `pnpm --filter @oasis/api exec prisma migrate dev` sobre una base con datos del
  seed anterior, luego `seed` dos veces sin errores; `prisma migrate diff` sin deriva.

### T15. Registrar, validar y rechazar (`backend-api`, HU-16, HU-18, HU-19; TDD)

- **Archivos:** `modules/pagos/application/use-cases/pagos.use-cases.ts`,
  `validar-pago.use-case.ts`, `application/ports/pagos.repository.port.ts`, `domain/pago.ts`,
  `infrastructure/persistence/prisma-pagos.repository.ts`, `presentation/http/pagos.controller.ts` y
  sus specs.
- **Comportamiento:**
  - `PagosRepositoryPort.saldoPoliza(polizaId): Promise<string | null>` (D7).
  - `exigirMontoDentroDelSaldo(pagos, polizaId, monto)` junto a `exigirPolizaVigente`, usada por
    `CrearPagoUseCase` (tras RN-01) y por `ValidarPagoUseCase` (tras RN-03 y RN-01).
  - `crear` traduce `P2002` sobre `polizaId_referencia` a `ConflictoError` con
    `REFERENCIA_DUPLICADA` (D6).
  - `rechazar` escribe `rechazadoPorId`/`rechazadoEn` (D8).
  - `Pago.puedeEditarse()` (D9).
  - El controlador devuelve `rechazadoPorId` y `rechazadoEn`.
- **Casos borde:** validar un pago cuya póliza ya no tiene saldo (otro pago se validó antes) → 422
  `MONTO_SUPERA_SALDO`; validar un RECHAZADO o VALIDADO → 422 (RN-03); rechazar un VALIDADO → 422;
  monto exactamente igual al saldo → se acepta.
- **Pruebas primero** (`pagos.use-cases.spec.ts`, `validar-pago.use-case.spec.ts`): cada caso borde,
  más "registra `registradoPorId`" y "rechazar guarda autor y fecha del rechazo sin tocar
  `validadoPorId`".
- Si T0.5 dejó abierta la deuda de `razonSocial = ''`, su arreglo de una línea va aquí.

### T16. Plan de cuotas (`backend-api`, HU-35; TDD)

- **Archivos:** `modules/polizas/domain/plan-cuotas.ts` (nuevo), `domain/errores.ts`,
  `application/ports/polizas.repository.port.ts`, `application/use-cases/cuotas.use-cases.ts`
  (nuevo: `ObtenerPlanCuotasUseCase`, `DefinirPlanCuotasUseCase`),
  `application/use-cases/polizas.use-cases.ts` (crear con cuota única, D13 al editar),
  `infrastructure/persistence/prisma-polizas.repository.ts`,
  `presentation/http/cuotas.controller.ts` (nuevo), `polizas.module.ts`.
- **Endpoints:** `GET /polizas/:id/cuotas` (ADMIN, OPERADOR) y `PUT /polizas/:id/cuotas` (ADMIN,
  OPERADOR, `@Auditar('MODIFICAR', 'PlanCuotas')`, `@HttpCode(200)`), con `ZodBody(definirPlanCuotasSchema)`.
- **Dominio `PlanCuotas`:** `validarContra(poliza)` aplica D11 (suma = prima, fechas en vigencia);
  `recalcularParaPrima(primaNueva)` aplica D13. Toda la aritmética en centavos.
- **Persistencia:** reemplazar el plan es `deleteMany` de las cuotas de la póliza + `createMany`
  dentro de una `$transaction`, **solo** si no hay pagos VALIDADOS (comprobado dentro de la misma
  transacción para evitar la carrera con una validación). Es el único borrado permitido: las cuotas
  sin aplicaciones no son evidencia (RN-09 protege pagos y recibos); se marca con
  `ponytail:` (techo: reemplazo completo; salida: versionar planes si el negocio pide historial).
- **Pruebas primero:** crear póliza → 1 cuota igual a la prima con vencimiento `fechaInicio`; plan
  de 3 que suma la prima → 200; que no cuadra → 422 `PLAN_NO_CUADRA` con `suma` y `prima`; fecha
  fuera de vigencia → 422; póliza CANCELADA → 422 `POLIZA_NO_VIGENTE`; con un pago VALIDADO → 422
  `PLAN_CON_PAGOS_VALIDADOS`; editar prima con plan de 3 → se recalcula y sigue cuadrando.

### T17. Vencimiento y mora (`backend-api`, HU-37; TDD)

- **Archivos:** `modules/polizas/application/use-cases/marcar-cuotas-vencidas.use-case.ts` (+spec),
  `modules/polizas/infrastructure/schedule/vencimiento-cuotas.task.ts`, `worker.module.ts` (registra
  la tarea y el proveedor del caso de uso, sin importar los controladores de `PolizasModule`: crea un
  `PolizasWorkerModule` o registra el proveedor con `useFactory` como `RecibosModule`), repositorio
  de pólizas (`marcarCuotasVencidas(hoy)` y `enMora` en `listar`/`obtener`).
- **Comportamiento:** D14 y D15. La fecha "hoy" sale de `ClockPort` convertida a Guayaquil
  (`shared-kernel`), nunca de `new Date()` directo.
- **Pruebas primero:** con reloj fijo en `2026-10-24T05:10Z` (00:10 en Guayaquil) marca la cuota
  con vencimiento `2026-10-23` y no la de `2026-10-24`; no toca PAGADA; una PARCIAL vencida pasa a
  VENCIDA conservando `valorPagado`; dos ejecuciones seguidas → la segunda actualiza 0; el log
  incluye `actualizadas`; la póliza con una cuota VENCIDA responde `enMora: true`.

### T18. Emisión y anclaje: evidencia faltante (`backend-api`, HU-22, HU-23; TDD)

- **Archivos:** `modules/recibos/application/use-cases/emitir-recibo.use-case.spec.ts` (nuevo) y,
  si hace falta, renombrar textos viejos de `outbox.use-cases.spec.ts:163` y `:231` («endpoint
  público», «respuesta pública») por «verificación con sesión» (ADR-015).
- **Pruebas:** código `^RC-[0-9A-F]{12}$` (≥ 10, RN-12), sal de 32 bytes distinta en dos emisiones,
  `hashRecibo = keccak256(sal ‖ payload)`, el payload no contiene nombres, identificación, correo ni
  teléfono del cliente (RN-06), `idOnchain = keccak256(uuid)`.
- No se cambia código de producción salvo que una prueba demuestre un defecto (en ese caso, se anota
  en la nota de traspaso).

### T19. Saldo de la operadora (`backend-api`, HU-42; TDD)

- **Archivos:** `config/env.schema.ts` (solo en `validateWorkerEnv`:
  `UMBRAL_SALDO_OPERADORA_POL`, decimal positivo, por defecto `0.5`),
  `infrastructure/blockchain/saldo-operadora.task.ts` (worker),
  `modules/recibos/application/ports/saldo-operadora.port.ts` (lectura desde Redis),
  `modules/recibos/infrastructure/…/redis-saldo-operadora.adapter.ts`,
  `modules/recibos/presentation/http/operadora.controller.ts` (`GET /operadora/saldo`,
  `@Roles('ADMIN')`), `worker.module.ts`, `recibos.module.ts`. `.env.worker.example` es un archivo
  raíz: lo edita la sesión principal en T22.
- **Comportamiento:** D17. Conversión de wei a POL con `formatEther` de viem (string). La tarea
  nunca lanza: un error de RPC se registra como `warn` y conserva el último valor hasta su TTL.
- **Pruebas primero:** saldo `0.4` con umbral `0.5` → `bajoUmbral: true` y log `warn`; `0.6` → sin
  log; RPC caído → no escribe y registra; el controlador devuelve `{ disponible: false }` sin llave.

### T20. Cobertura de auditoría y rutas (`backend-api`)

- `auditoria-cobertura.spec.ts` y `roles-cobertura.spec.ts` incluyen `CuotasController.definir` y
  `OperadoraController.saldo` (este último exento de `@Auditar` por ser lectura).
- **Cierre de carril:** `pnpm --filter @oasis/api lint`, `typecheck`, `test` y `pnpm deps:check`.

### T21. Seguridad del contrato (`contrato-blockchain`, HT-15; TDD)

- **Archivos:** `packages/contracts/scripts/transferir-admin.ts`, `scripts/rotar-operadora.ts`,
  `test/administracion.test.ts` (node:test + viem, nodo en proceso de Hardhat), y las pruebas
  Solidity que falten en `test/*.t.sol`.
- **Matriz de roles (pruebas):** solo `REGISTRADOR_ROLE` llama a `registrar` y `anular`; solo
  `DEFAULT_ADMIN_ROLE` llama a `pause`, `unpause`, `grantRole` y `revokeRole`; la cuenta operadora
  no puede otorgarse roles a sí misma; tras `transferir-admin`, el desplegador ya no es admin y la
  fría sí.
- **Rotación probada:** escenario completo en el nodo local: operadora A registra → `rotar-operadora`
  a B con `--pausar` → A ya no registra (revierte), `registrar` revierte por pausa → la fría
  `unpause` → B registra.
- **Scripts:** leen la red y las cuentas de `hardhat keystore` o de argumentos; nunca de un `.env`.
  Imprimen cada transacción y verifican el estado final con `hasRole`. `transferir-admin.ts` pide
  confirmación interactiva antes de `renounceRole` en una red distinta de la local (es irreversible).
- No se cambia `RegistroRecibos.sol` (ADR-008): si se cambiara, el ABI se regeneraría con
  `export-abi`.
- **Verificación:** `pnpm --filter @oasis/contracts test` y `reporte` (≥ 90 % de líneas).

### T22. Cadena de suministro (`infra` + sesión principal, HT-14)

- **`infra`** edita `.github/workflows/ci.yml` y `deploy.yml`:
  - fija **todas** las acciones por SHA con comentario de versión (`uses: actions/checkout@<sha> #
v5.x.y`);
  - quita el `permissions` global por uno mínimo **por job** (`contents: read`; `security-events:
write` solo si se sube SARIF);
  - job `seguridad` con `pnpm audit --prod --audit-level=high`, Semgrep
    (`semgrep scan --config p/typescript --config p/nodejs --config p/owasp-top-ten --severity
ERROR --error apps/api/src apps/web/src`), gitleaks sobre todo el historial (`fetch-depth: 0`,
    binario de la release oficial verificado por checksum) y zizmor
    (`uvx zizmor --min-severity high .github/workflows`);
  - `persist-credentials: false` en cada `checkout` (hallazgo habitual de zizmor).
- **Sesión principal** (archivos raíz): `renovate.json` (D19), `.secretlintrc.json` con el preset
  recomendado, `.lintstagedrc.json` con `"*": "secretlint"` antes de Prettier,
  `.env.worker.example` con `UMBRAL_SALDO_OPERADORA_POL=0.5`.
- **Pruebas manuales:** un commit de prueba (sin empujar, y deshecho después) con una clave falsa
  tipo `AKIA…` debe fallar en el hook; `gitleaks detect` local sobre el historial; `zizmor` local
  sin hallazgos altos; si `pnpm audit` o Semgrep reportan algo alto hoy, se corrige (actualización
  puntual) o se documenta la excepción con su motivo en `.semgrepignore`/`pnpm.auditConfig`.
- **Acción del autor:** instalar la app de Renovate (D24).

**Cierre de la Fase B2 (sesión principal):** `pnpm -r build`, `pnpm -r lint`, `pnpm format:check`,
`pnpm -r typecheck`, `pnpm deps:check && pnpm deps:check:negativo`, `pnpm test`. Salida al ledger y
resumen para `frontend-spa`: endpoints, códigos de error y forma exacta de las respuestas nuevas.

## 12. Fase B3 — Pantallas nuevas (`frontend-spa`)

Nacen con los componentes de la Etapa A (`EstadoInsignia`, botones, campos, encabezado) y consumen
los endpoints reales de B2.

### T23. Registrar, validar y rechazar pagos en la SPA (`frontend-spa`, HU-16, HU-18, HU-19; TDD)

- **Archivos:** `features/pagos/pages/PagosPage.tsx` (+test), `features/pagos/components/FormularioPago.tsx`,
  `SelectorPoliza.tsx` (combobox con el patrón de `SelectorCliente`: `GET /polizas?q=&estado=VIGENTE&pageSize=20`,
  debounce de 300 ms), `ValidarPagoDialog.tsx` (sustituye o amplía `ConfirmarPagoDialog`),
  `RechazarPagoDialog.tsx`, `features/pagos/api.ts`, `features/dashboard/components/PanelCliente.tsx`.
- **Formulario:** póliza, monto, fecha (por defecto hoy), método (Débito bancario primero) y
  referencia, con `react-hook-form` + `zodResolver(crearPagoSchema)`. Errores del API por campo:
  `MONTO_SUPERA_SALDO` → «Supera el saldo pendiente ($518,40).» bajo el monto;
  `REFERENCIA_DUPLICADA` → bajo la referencia; `POLIZA_NO_VIGENTE` → bajo la póliza.
- **Validar (D10):** tres acciones; tras validar, toast con el código del recibo y enlace a su
  detalle. **Rechazar:** chips de `MOTIVOS_RECHAZO_FRECUENTES` que rellenan el texto (editable),
  contador 5–300.
- **Portal:** `PanelCliente` muestra el motivo bajo el pago RECHAZADO.
- **Pruebas primero:** el formulario no envía sin referencia; muestra el error de saldo del API en
  el campo; validar se completa en 3 clics desde la fila (contar `userEvent.click`); rechazar sin
  motivo no habilita el botón; el CLIENTE ve el motivo.

### T24. Plan de cuotas y mora en la SPA (`frontend-spa`, HU-35, HU-37; TDD)

- **Archivos:** `features/polizas/components/PlanCuotasDialog.tsx` (+test), `features/polizas/api.ts`,
  `PolizasPage.tsx`, `FormularioPoliza.tsx` (aviso de D13 al cambiar la prima con plan de N cuotas).
- **Diálogo:** muestra el plan actual (número, valor, vencimiento, `EstadoInsignia` de cuota);
  «Cambiar plan» → número de cuotas → «Proponer» (`proponerPlanCuotas`) → filas editables
  (`useFieldArray`) con suma en vivo contra la prima («Faltan $0,02» / «Cuadra») → «Guardar plan»
  deshabilitado mientras no cuadre. Solo lectura con pagos validados (mensaje que explica por qué).
- **Mora:** `PolizasPage` muestra «En mora» con `EstadoInsignia`.
- **Pruebas primero:** proponer 3 cuotas de 100 → 33,33/33,33/33,34; editar una a 30 → «Faltan
  $3,33» y botón deshabilitado; con pagos validados el diálogo es de solo lectura; error 422 del API
  se muestra.

### T25. Salud del anclaje en el inicio del ADMIN (`frontend-spa`, HU-42; TDD)

- **Archivos:** `features/dashboard/components/SaludAnclaje.tsx` (+test), `PanelPersonal.tsx`,
  `features/dashboard/api.ts`.
- Panel de noche (DESIGN.md §Administración): saldo en cifra dorada de 40 px, barra contra el umbral
  (rojo claro `#f3a59d` como token si está por debajo), aviso con icono y texto «Saldo bajo: recargue
  la cuenta operadora» cuando `bajoUmbral`; «Sin datos del saldo» si `disponible: false`. Solo ADMIN
  (`useQuery` con `refetchInterval` de 60 s).
- **Pruebas primero:** bajo umbral muestra el aviso con texto (no solo color); OPERADOR no ve el
  panel; sin datos muestra el estado vacío.

**Cierre de la Fase B3 (sesión principal):** `pnpm --filter @oasis/web lint`, `typecheck`, `test` y
`build`. Salida al ledger.

## 13. Fase B4 — Evidencia y revisión de la Etapa B

Infraestructura arriba (`compose.dev.yaml`, nodo Hardhat, `pnpm dev:chain`, `migrate deploy`,
`seed`). Antes de las e2e del API, detén el worker de desarrollo y limpia `bull:anclaje-recibos:*`.

### T26. e2e del API (`verificador`)

- **`pagos.e2e-spec.ts`** (nuevo; absorbe `pagos-rn01.e2e-spec.ts` o lo deja intacto):
  1. registrar con Débito bancario → 201 REGISTRADO con `registradoPorId` del operador (HU-16);
  2. sin referencia → 400; referencia repetida en la misma póliza → 409 `REFERENCIA_DUPLICADA`; la
     misma referencia en otra póliza → 201;
  3. monto > saldo → 422 `MONTO_SUPERA_SALDO` con `saldo`; monto = saldo → 201 (RN-02);
  4. dos pagos registrados que juntos superan la prima: validar el primero → 200; el segundo → 422
     `MONTO_SUPERA_SALDO` (D7);
  5. validar → 200 con `validadoPorId` y `validadoEn`, recibo PENDIENTE_ANCLAJE en la misma
     respuesta; validar otra vez → 422 (RN-03); no existe `PATCH /pagos/:id` (404) (HU-18);
  6. rechazar sin motivo → 400; con motivo → 200 con `rechazadoPorId`, `rechazadoEn` y
     `validadoPorId` nulo; no hay recibo para ese pago; validar un RECHAZADO → 422; `/mis-pagos` del
     CLIENTE dueño devuelve el `motivoRechazo` (HU-19).
- **`cuotas.e2e-spec.ts`** (nuevo): póliza nueva → 1 cuota; `PUT` de 3 que cuadra → 200 y bitácora
  `MODIFICAR`/`PlanCuotas`; que no cuadra → 422; con pago validado → 422; CLIENTE → 403; HU-37:
  ejecutar `MarcarCuotasVencidasUseCase` desde el contexto con un `ClockPort` falso → la cuota
  vencida queda VENCIDA y `GET /polizas/:id` responde `enMora: true`.
- **`operadora.e2e-spec.ts`** (nuevo): con la llave de Redis escrita por la prueba → 200 con el
  saldo; sin llave → `{ disponible: false }`; OPERADOR → 403.
- **`reinicio-worker.e2e-spec.ts`** (nuevo, HU-23.5): validar 10 pagos (escenario EC-04 de la
  arquitectura); levantar `WorkerModule`; cerrarlo (`app.close()`) en cuanto el primer recibo pase a
  ENVIADO; levantar otro `WorkerModule`; esperar a que los 10 estén ANCLADOS; comprobar en el
  contrato que cada `idOnchain` tiene **un solo** evento `ReciboRegistrado` (`getContractEvents`) y
  que `intentos` no supera 5. Esperas por condición (sondeo de la base), nunca por tiempo fijo.
- `acceso-por-rol.e2e-spec.ts` descubre las rutas nuevas; actualiza la matriz esperada
  (`/polizas/:id/cuotas`, `/operadora/saldo`).

### T27. Playwright de la Etapa B (`verificador`)

- **`pagos-cuotas.spec.ts`:** el operador registra un pago con Débito bancario, lo valida en tres
  acciones desde el listado y ve el código del recibo; registra otro y lo rechaza con un chip de
  motivo; el CLIENTE entra y ve el motivo; el operador define un plan de 3 cuotas y ve «Cuadra».
- **`diseno.spec.ts`:** agrega a la lista de T6 el formulario de pago, los diálogos de validar y
  rechazar, `PlanCuotasDialog` y el inicio del ADMIN con el panel de saldo.
- `responsive.spec.ts` y los demás specs siguen en verde.

### T28. Revisión de la Etapa B (`revisor` y dueños)

- El `revisor` revisa el diff de la Etapa B (desde el commit 1) contra la sección 2, los criterios
  de la sección 1, `AGENTS.md`, `ponytail-review`, `accessibility` e `impeccable audit` de las
  pantallas nuevas. Puntos de atención: RN-02 en ambos momentos, transacción del reemplazo del plan,
  zona horaria del cron, la regla del oro en los diálogos, permisos por job y SHAs en la CI, y que
  ningún script de administración lea secretos de un `.env`.
- La sesión principal reparte los hallazgos **bloqueantes** por dueño; los **menores** dentro del
  alcance también se corrigen; lo de fuera de alcance va como deuda. Una ronda de confirmación como
  máximo; después se repiten los cierres de B2, B3 y B4.

## 14. Fase B5 — Cierre de la Etapa B y del sprint

### T29. Definición de Terminado (sesión principal)

```bash
pnpm install --frozen-lockfile
pnpm -r build && pnpm -r lint && pnpm format:check && pnpm -r typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test                                             # contratos, shared, API y SPA
pnpm --filter @oasis/contracts reporte                # ≥ 90 % de líneas
docker.exe compose -f compose.dev.yaml up -d
pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy   # migración pagos_cuotas_s4
pnpm --filter @oasis/api seed
pnpm test:e2e
pnpm --filter @oasis/web test:e2e
```

Pruebas manuales (resultado en el informe):

- El operador registra, valida y rechaza pagos con teclado solamente.
- Con lector de pantalla: `EstadoInsignia` anuncia el texto; el error de saldo se anuncia al
  aparecer; el riel anuncia la página actual.
- El ADMIN ve el saldo de la operadora; con `UMBRAL_SALDO_OPERADORA_POL=1000` en el worker ve el
  aviso y el log `warn`.

### T30. Capturas y punto de control 2 (sesión principal)

1. Con el script de T8, captura a 1280 y 360 px: el formulario de pago con un error de saldo, los
   diálogos de validar y rechazar (con un chip elegido), el toast con el código del recibo, el motivo
   en el portal del CLIENTE, `PlanCuotasDialog` en sus tres estados (actual, editando con «Faltan» y
   «Cuadra», solo lectura), la insignia «En mora» en pólizas y el panel de saldo del ADMIN (normal,
   bajo el umbral y sin datos). Guárdalas en `capturas/etapa-b/`.
2. **Punto de control 2:** presenta las capturas (rutas absolutas) y el resultado de T29. Espera
   «aprobado» o ajustes; con ajustes, relanza al dueño, repite los cierres afectados y vuelve a
   presentar.

### T31. Documentación (`documentacion`)

- **`CLAUDE.md`:** plan de cuotas y saldo (ADR-020), RN-02 en registro y validación, vencimiento a
  las 00:05 en el worker, `GET /operadora/saldo` y la llave `operadora:saldo`, job `seguridad` de la
  CI y secretlint en lint-staged.
- **`apps/api/src/modules/README.md`:** `PlanCuotas` como entidad auditada; `/operadora/saldo`
  exento de `@Auditar`.
- **`docs/despliegue.md`:** procedimiento de transferencia del administrador y de rotación de la
  operadora (comandos de T21, pasos de pausa ante filtración) y la variable
  `UMBRAL_SALDO_OPERADORA_POL`.
- **ADR:** ajustes que T13 o la ejecución hayan dejado pendientes.
- **`docs/sprints/README.md`:** fila de S4 (plan e informe).

### T32. Informe y commit 2 (sesión principal)

Crea `docs/sprints/sprint-s4.md` con la estructura de `sprint-05.md`:

1. Encabezado (historias, épicas, rama, fechas, los dos commits y estado).
2. Objetivo.
3. Entregables con su ubicación, separados por etapa.
4. Criterios de cada historia con su evidencia (sección 17).
5. Definición de Terminado (tabla de estado) de cada etapa.
6. Versiones de las dependencias nuevas.
7. Decisiones y discrepancias: ADR-007, ADR-020, ADR-021, ADR-014 retirada; RN-22 adelantada a la
   base (D6); saldo por pagos validados (D7) y su equivalencia con las cuotas a partir de HU-36;
   reemplazo de cuotas como único borrado; ejecución en dos etapas con puntos de control (D23).
8. Impedimentos y observaciones: la primera semana del sprint sin avance y cómo se absorbió; ajustes
   pedidos en los puntos de control.
9. **Horas: solo las de backlog por historia** (sección 18, D1).
10. Deuda y fuera de alcance, con sprint destino.
11. Acciones del autor (D24) como lista de verificación, con su estado al cierre.
12. Pruebas manuales y «Cómo verificar» (comandos de T29).

Revisa con `git status` que no entren `.env`, `.superpowers/`, `.agents/`, `.claude/`, `*.docx` ni
`ignition/deployments/chain-31337`. Commit 2, sin atribuciones (solo con el «aprobado» de T30):

```bash
git add -A
git commit -F - <<'EOF'
feat(repo): completar el sprint S4 con pagos, cuotas, recibos anclados y seguridad

- HU-16, HU-18, HU-19: registro con Débito bancario y RN-02, validación en tres acciones y rechazo
  con autor y fecha propios.
- HU-35, HU-37: plan de cuotas con RN-15, cuota única por defecto, vencimiento diario y mora.
- HU-22, HU-23: pruebas de emisión y de reinicio del worker.
- HU-42: saldo de la cuenta operadora con umbral, alerta y métrica.
- HT-14: Renovate, pnpm audit, Semgrep, gitleaks, zizmor, secretlint y acciones fijadas por SHA.
- HT-15: administración en frío y rotación de la operadora probada en el nodo local.
- Docs: CLAUDE.md, despliegue e informe del sprint S4.

Refs: HU-16, HU-18, HU-19, HU-35, HU-37, HT-14, HU-22, HU-23, HU-42, HT-15
EOF
```

Sin push. Mensaje final al usuario: resumen de la verificación, acciones del autor pendientes,
título del PR («Sprint S4: sistema de diseño, pagos, cuotas y recibos anclados») y cuerpo del PR
(resumen por etapa, criterios marcados y pendientes).

---

## 15. Acciones del autor

Las de D24, con fecha límite el 30/10: instalar la app de Renovate y aprobar su PR de bienvenida;
crear la billetera fría; ejecutar en Amoy `transferir-admin.ts` y guardar el txHash en el informe.
Además: aprobar los puntos de control 1 y 2, push, PR y aceptación del Product Owner en la revisión
del 30/10.

## 16. Riesgos

| #   | Riesgo                                                                                   | Respuesta                                                                                                                                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Quedan 5 días hábiles (24/10 → 30/10) y los puntos de control dependen del desarrollador | Metas: punto de control 1 el 27/10 y 2 el 30/10. Si el 29/10 la Etapa B no cierra, se aplica el orden de contingencia: T25 (panel de saldo; la métrica, el log y el endpoint ya cumplen), la parte de T27 sobre `diseno.spec.ts` de pantallas nuevas, y T24 (diálogo de cuotas; el API ya cumple RN-15). Lo recortado pasa a la holgura de S5 y se informa. |
| R2  | El visto bueno de la Etapa A pide varias rondas de ajustes                               | Cada ronda corrige solo lo pedido y repite los cierres afectados; si pasa de dos rondas, se acuerda con el desarrollador qué ajustes quedan como deuda de S5.                                                                                                                                                                                               |
| R3  | `pnpm audit` o Semgrep con hallazgos altos preexistentes                                 | Actualizar la dependencia si es directa; si no, excepción documentada con fecha de revisión.                                                                                                                                                                                                                                                                |
| R4  | La prueba de reinicio del worker es intermitente                                         | Esperas por condición (sondeo de la base), nunca por tiempo fijo; si sigue intermitente, se marca y se investiga con `systematic-debugging`.                                                                                                                                                                                                                |

## 17. Trazabilidad criterio → evidencia

| Criterio                                         | Etapa | Evidencia esperada                                                                     |
| ------------------------------------------------ | ----- | -------------------------------------------------------------------------------------- |
| HT-13.1 tokens, sin colores fuera de ellos       | A     | `index.css`; búsqueda `rg` de T2 sin resultados; `impeccable audit`                    |
| HT-13.2 fuentes del mismo origen e isologo       | A     | `diseno.spec.ts` (sin dominios externos); `AppLayout.test.tsx`; `LoginPage.test.tsx`   |
| HT-13.3 navegación y barra inferior              | A     | `AppLayout.test.tsx`; `diseno.spec.ts`                                                 |
| HT-13.4 componente único de estado               | A, B  | `EstadoInsignia.test.tsx` (exhaustivo); `PlanCuotasDialog.test.tsx`                    |
| HT-13.5 pantallas sin cambio de comportamiento   | A     | Vitest existentes en verde; capturas del punto de control 1                            |
| HT-13.6 AA, foco, 44 px, 360 px                  | A, B  | `diseno.spec.ts`; `responsive.spec.ts`                                                 |
| HU-16.1 póliza, monto, fecha, método, referencia | B     | `pagos.e2e-spec.ts` caso 1; `FormularioPago.test.tsx`                                  |
| HU-16.2 Débito bancario                          | B     | esquema; seed; `pagos.e2e-spec.ts` caso 1                                              |
| HU-16.3 RN-01 y RN-02                            | B     | `pagos.use-cases.spec.ts`; `pagos.e2e-spec.ts` casos 3 y 4; `pagos-rn01`               |
| HU-16.4 REGISTRADO y autor                       | B     | `pagos.e2e-spec.ts` caso 1                                                             |
| HU-18.1 solo REGISTRADO (RN-03)                  | B     | `validar-pago.use-case.spec.ts`; `pagos.e2e-spec.ts` caso 5                            |
| HU-18.2 usuario y fecha                          | B     | `pagos.e2e-spec.ts` caso 5                                                             |
| HU-18.3 validado no editable                     | B     | `pago.spec.ts` (`puedeEditarse`); `pagos.e2e-spec.ts` caso 5                           |
| HU-18.4 confirmación y ≤ 3 acciones              | B     | `PagosPage.test.tsx`; `pagos-cuotas.spec.ts`                                           |
| HU-19.1 motivo obligatorio                       | B     | esquema; `pagos.e2e-spec.ts` caso 6; `RechazarPagoDialog.test.tsx`                     |
| HU-19.2 final y sin recibo                       | B     | `pagos.e2e-spec.ts` caso 6                                                             |
| HU-19.3 usuario y fecha del rechazo              | B     | `pagos.use-cases.spec.ts`; `pagos.e2e-spec.ts` caso 6                                  |
| HU-19.4 motivo en el portal                      | B     | `pagos.e2e-spec.ts` caso 6; `PanelCliente.test.tsx`; `pagos-cuotas.spec.ts`            |
| HU-35.1 número de cuotas y propuesta editable    | B     | `cuotas.spec.ts` (shared); `PlanCuotasDialog.test.tsx`                                 |
| HU-35.2 suma = prima (RN-15)                     | B     | `plan-cuotas.spec.ts`; `cuotas.e2e-spec.ts`                                            |
| HU-35.3 número, valor, fecha y estado            | B     | `cuotaSchema`; `cuotas.e2e-spec.ts`                                                    |
| HU-35.4 pago único = una cuota                   | B     | `polizas.use-cases.spec.ts`; `cuotas.e2e-spec.ts`                                      |
| HU-37.1 tarea 00:05 (RN-14)                      | B     | `marcar-cuotas-vencidas.use-case.spec.ts`; `vencimiento-cuotas.task.ts` (cron y zona)  |
| HU-37.2 póliza en mora (RN-16)                   | B     | `cuotas.e2e-spec.ts`; `PolizasPage.test.tsx`                                           |
| HU-37.3 log de ejecución                         | B     | `marcar-cuotas-vencidas.use-case.spec.ts`                                              |
| HT-14.1 Renovate y SHAs                          | B     | `renovate.json`; `ci.yml`/`deploy.yml` con SHA                                         |
| HT-14.2 pnpm audit                               | B     | job `seguridad`                                                                        |
| HT-14.3 Semgrep                                  | B     | job `seguridad`                                                                        |
| HT-14.4 gitleaks y secretlint                    | B     | job `seguridad`; `.lintstagedrc.json`; prueba manual del hook                          |
| HT-14.5 zizmor y permisos por job                | B     | job `seguridad`; `ci.yml`                                                              |
| HU-22.1 a HU-22.5                                | B     | `emitir-recibo.use-case.spec.ts`; `validar-pago.use-case.spec.ts`; `flujo-anclaje`     |
| HU-23.1 a HU-23.4 y HU-23.6                      | B     | `flujo-anclaje`; `idempotencia-anclaje`; `queue.module.ts`; `outbox.use-cases.spec.ts` |
| HU-23.5 reinicio sin doble anclaje               | B     | `reinicio-worker.e2e-spec.ts`                                                          |
| HU-42.1 saldo en el panel del ADMIN              | B     | `operadora.e2e-spec.ts`; `SaludAnclaje.test.tsx`                                       |
| HU-42.2 umbral configurable                      | B     | `env.schema.spec.ts`; `saldo-operadora.task.spec.ts`                                   |
| HU-42.3 alerta y log                             | B     | `saldo-operadora.task.spec.ts`; `SaludAnclaje.test.tsx`                                |
| HT-15.1 admin fuera del servidor                 | B     | `administracion.test.ts` (transferir); ADR-021; txHash en Amoy (autor, D24)            |
| HT-15.2 matriz de roles                          | B     | `administracion.test.ts`; `test/*.t.sol`                                               |
| HT-15.3 rotación y pausa probadas                | B     | `administracion.test.ts`; `docs/despliegue.md`                                         |

## 18. Horas de backlog

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

Etapa A: 25 h. Etapa B: 54 h. Son las horas del backlog (D1); el informe no reporta horas reales.

## 19. Prompts de arranque

### Etapa A

```text
Eres la sesión principal del Sprint S4 del SRPP. Ejecuta SOLO la Etapa A (HT-13, tareas T0–T8) de
docs/sprints/sprint-s4-plan.md con subagent-driven-development, siguiendo sus reglas (sección 0) y
sus decisiones (sección 2), que no se reabren.

1. Lee AGENTS.md, CLAUDE.md, apps/web/DESIGN.md, docs/diseno/README.md y el plan completo. Invoca
   subagent-driven-development y ponytail. Abre el ledger en .superpowers/sdd/sprint-s4-plan/.
2. Fase A0 (T0): core.fileMode, rama, dependencias de la Etapa A, línea base y deuda por confirmar.
   Si algo está rojo o hay cambios sin commit en main, detente y avísame.
3. Fase A1: @contrato-shared con T1. Cierra la fase.
4. Fase A2: @frontend-spa con T2 → T3 → T4 → T5 (D2–D4). Cierra la fase.
5. Fase A3: @verificador con T6; luego @revisor con T7 y @documentacion con T7.doc. Reparte
   hallazgos; máximo una ronda de confirmación.
6. Fase A4 (T8): DoD, capturas pareadas con el prototipo y DETENTE en el punto de control 1. Sin mi
   «aprobado» no hagas el commit 1 ni empieces la Etapa B.
```

### Etapa B

```text
Eres la sesión principal del Sprint S4 del SRPP. La Etapa A ya está aprobada y confirmada en el
commit 1. Ejecuta la Etapa B (tareas T9–T32) de docs/sprints/sprint-s4-plan.md con
subagent-driven-development, siguiendo sus reglas (sección 0) y sus decisiones (sección 2).

1. Lee AGENTS.md, CLAUDE.md, apps/api/src/modules/README.md y el plan completo. Retoma el ledger de
   .superpowers/sdd/sprint-s4-plan/.
2. Fase B0 (T9): línea base sobre el commit 1 y dependencias de la Etapa B.
3. Fase B1: en un mismo mensaje, @contrato-shared con T10–T12 (D5–D7, D11, D12, D15, D17) y
   @documentacion con T13. Cierra la fase.
4. Fase B2: en un mismo mensaje, @backend-api con T14–T20, @contrato-blockchain con T21 e @infra con
   T22 (y tú haces su parte raíz). Cierra la fase y pasa a @frontend-spa el resumen de la API.
5. Fase B3: @frontend-spa con T23 → T24 → T25. Cierra la fase.
6. Fase B4: @verificador con T26 y T27 (bugs de producto → relanza al dueño con la prueba roja);
   @revisor con T28; máximo una ronda de confirmación.
7. Fase B5: T29 DoD; T30 capturas y DETENTE en el punto de control 2; con mi «aprobado»,
   @documentacion con T31 y tú T32 (informe y commit 2, sin atribuciones y sin push).

Cada agente recibe un mensaje autosuficiente: sus tareas, las decisiones por número, lo que
entregaron los demás y la ruta de su nota. Respeta las fronteras de la tabla 0.1. Si una decisión
deja de ser viable, detente e invoca grilling con tu recomendación. Termina con el resumen y el
cuerpo del PR.
```
