# Sprint 5 — Plan de implementación

- **Historias:** HU-08 Editar y desactivar cliente (4 h), HU-09 Buscar clientes (5 h), HU-12
  Registrar póliza (8 h), HU-13 Editar póliza y su estado (4 h) y HU-14 Listar pólizas (3 h): 24 de
  25 horas de capacidad.
- **Épicas:** EP-02 (HU-08 y HU-09) y EP-03 (HU-12, HU-13 y HU-14).
- **Fechas:** 05/10/2026 – 09/10/2026 (tabla 6-1 del backlog).
- **Rama:** `feat/sprint-05-clientes-polizas`.
- **Ejecuta:** OpenCode con agentes coordinados (`.opencode/agents/`, sección 0.1) sobre esta
  copia del repositorio.
- **Decisiones acordadas con el desarrollador:** 07/10/2026, en una sesión de grilling (sección 2).

Este documento es el Sprint Backlog del Sprint 5. Las reglas generales están en `AGENTS.md`, el mapa
técnico en `CLAUDE.md` y las reglas de los módulos del API en `apps/api/src/modules/README.md`.
OpenCode solo carga `AGENTS.md`: cada agente lee los otros dos antes de empezar. La fuente de verdad
está en `docs/referencia/`, que no se edita. Si algo de este plan contradice `docs/referencia/`,
gana la referencia: detente y repórtalo.

**Cómo leer las tareas.** Cada tarea indica su **agente** y trae un miniprompt: qué hacer, archivos,
comportamiento, casos borde, pruebas primero y verificación. Cuando ayuda, suma un bloque
**Ejemplo (orientativo)**, que muestra la forma o la parte delicada. No se copia tal cual: adáptalo
al código real.

## 0. Reglas de ejecución

1. El orquestador ejecuta las fases en orden: 0 → 1 → 2 (paralela) → 3 → 4 → 5. Ningún subagente
   arranca una fase por su cuenta.
2. TDD en toda lógica nueva: primero la prueba en rojo y luego el código (`test-driven-development`).
   Antes de cerrar una fase, el orquestador usa `verification-before-completion` y guarda la salida
   en el ledger.
3. Al empezar su tarea, cada agente invoca las skills de su fila (sección 0.2) en el orden de
   `AGENTS.md`: skill de proceso → skill de la tecnología → ponytail decide el tamaño.
4. Tras cambiar `packages/shared/src`, ejecuta `pnpm --filter @oasis/shared build` y borra
   `apps/web/node_modules/.vite` (Vite no invalida el prebundle de un paquete del workspace).
5. Nunca edites `docs/referencia/`.
6. **Un solo commit** al final (sección 13), hecho por el orquestador y sin líneas de atribución
   (`Co-Authored-By`, "Generated with…"). Antes, comprueba que `git config user.name` sea
   `JohannCaizaguano`. **No hagas push ni abras el PR**: los hace el usuario.
7. No adelantes trabajo de otros sprints; lo que quede fuera de alcance va como deuda al informe.
8. Comentarios solo para el porqué no obvio y en español. Las simplificaciones deliberadas llevan un
   comentario `ponytail:` con el techo y la salida.
9. Mientras corre la fase paralela, cada agente compila y prueba **solo su paquete**
   (`pnpm --filter …`); nadie ejecuta `pnpm -r build` ni `pnpm install` hasta que el orquestador
   cierre la fase.

### 0.1 Agentes y coordinación

Los agentes están en `.opencode/agents/`. Heredan el modelo con el que se lanza OpenCode y sus
permisos de edición limitan cada uno a su carpeta (D3).

| Agente            | Modo      | Edita                                                               | Fases | Tareas   |
| ----------------- | --------- | ------------------------------------------------------------------- | ----- | -------- |
| `orquestador`     | primario  | `docs/sprints/`, `CLAUDE.md`, `AGENTS.md`, READMEs, `.superpowers/` | 0–5   | T0, T14  |
| `contrato-shared` | subagente | `packages/shared/src/`, `apps/web/src/contratos/`, `docs/adr/`      | 1     | T1–T3    |
| `backend-api`     | subagente | `apps/api/src/`, `apps/api/prisma/`                                 | 2, 4  | T4–T7    |
| `frontend-spa`    | subagente | `apps/web/src/` (salvo `contratos/`)                                | 2, 4  | T8–T10   |
| `verificador`     | subagente | `apps/api/test/`, `apps/web/e2e/`                                   | 3, 4  | T11, T12 |
| `revisor`         | subagente | nada (solo su nota del ledger)                                      | 4     | T13      |

```text
Fase 0  orquestador ── T0 rama, línea base y ledger
Fase 1  contrato-shared ── T1 → T2 → T3            (secuencial: es el contrato de todos)
Fase 2  ┌ backend-api ── T4 → T5 → T6 → T7         (paralela: dos llamadas `task` en el
        └ frontend-spa ── T8 → T9 → T10             mismo mensaje)
Fase 3  verificador ── T11 → T12
Fase 4  revisor ── T13 → especialistas corrigen → revisor confirma (máx. 1 ronda)
Fase 5  orquestador ── T14 docs, DoD, informe y commit
```

**Traspasos.** Cada subagente termina escribiendo su nota en
`.superpowers/sdd/sprint-05-plan/<agente>.md`, con:

- qué hizo y la salida resumida de sus comandos;
- sus desvíos del plan, con su motivo;
- lo que necesita el siguiente agente.

Después responde al orquestador con un resumen corto. El orquestador pasa al siguiente agente el
resumen de las notas que le afectan: el subagente no ve la conversación del orquestador.

**Bugs entre fronteras.** Si un agente necesita un cambio fuera de su carpeta, no lo hace: lo anota
y se lo devuelve al orquestador, que relanza al dueño de esa carpeta. Si el `verificador` encuentra
un bug de producto, deja la prueba en rojo como evidencia.

**Frenos.** Si una decisión de la sección 2 deja de ser viable, el orquestador se detiene e invoca
`grilling` para planteársela al usuario con su recomendación. Las decisiones no se reabren por
iniciativa de un agente.

### 0.2 Skills por fase

| Momento                               | Agente            | Skills                                                                                                                                                                     |
| ------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Todo el sprint                        | `orquestador`     | `executing-plans`, `ponytail`, `verification-before-completion`; `grilling` solo como freno                                                                                |
| Toda lógica nueva                     | todos             | `test-driven-development`                                                                                                                                                  |
| Un fallo o una prueba roja inesperada | todos             | `systematic-debugging`                                                                                                                                                     |
| Fase 1 (T1 a T3)                      | `contrato-shared` | `zod`, `typescript-advanced-types`, `vitest`                                                                                                                               |
| Fase 2, API (T4 a T7)                 | `backend-api`     | `nestjs-best-practices`, `nodejs-best-practices`, `nodejs-backend-patterns`, `prisma-client-api`                                                                           |
| Fase 2, SPA (T8 a T10)                | `frontend-spa`    | `react-best-practices`, `composition-patterns`, `react-hook-form`, `zod`, `shadcn`, `tailwind-v4-shadcn`, `tailwind-css-patterns`, `impeccable`, `accessibility`, `vitest` |
| Fase 3, API (T11)                     | `verificador`     | `nestjs-best-practices`, `prisma-client-api`                                                                                                                               |
| Fase 3, SPA (T12)                     | `verificador`     | `playwright-best-practices`                                                                                                                                                |
| Fase 4 (T13)                          | `revisor`         | `ponytail-review`, `accessibility`, `impeccable` (`audit`)                                                                                                                 |
| Si Vite sirve un prebundle viejo      | `frontend-spa`    | `vite`                                                                                                                                                                     |

No aplican:

- `brainstorming` y `writing-plans`: el diseño y el plan ya están acordados;
- `prisma-cli`: no hay migración, porque el esquema ya tiene `Cliente.activo`, `Ramo` y
  `EstadoPoliza`;
- `bash-defensive-patterns`, `prisma-postgres`, `prisma-database-setup` y `frontend-design`: no
  hay pantallas desde cero, se extiende el patrón de `ClientesPage`.

**`impeccable` en este sprint:**

- Es refinamiento: conserva los tokens de `index.css` y los componentes shadcn.
- No ejecutes `init` ni `document`.
- Usa `harden` en `FormularioCliente` (modo edición), `FormularioPoliza`, `SelectorCliente` y los
  diálogos de confirmación.
- Usa `audit` y `polish` en `ClientesPage` y `PolizasPage`.

**Superpowers en este sprint:**

- Sin worktrees: todos los agentes trabajan sobre la rama de T0.
- El ledger vive en `.superpowers/sdd/sprint-05-plan/`, que está en `.gitignore`.
- Sin commits por tarea.
- Si `finishing-a-development-branch` ofrece opciones, elige "conservar la rama tal cual".

## 1. Alcance

### HU-08 — Editar y desactivar cliente (RF-09)

- Se pueden editar los datos de contacto.
- La identificación no se puede modificar si el cliente tiene pólizas.
- Desactivar no elimina el registro (RN-09).
- Un cliente inactivo no aparece al registrar nuevas pólizas.

### HU-09 — Buscar clientes (RF-10)

- La búsqueda funciona por identificación o por nombre.
- El listado se pagina de 20 en 20.
- Se puede filtrar por clientes activos e inactivos.

### HU-12 — Registrar póliza (RF-13)

- Se registran número único, cliente, aseguradora, ramo, prima total y vigencia.
- La fecha de fin es posterior a la de inicio.
- La prima es mayor que cero y tiene dos decimales (RN-10).
- La póliza se crea en estado VIGENTE.

### HU-13 — Editar póliza y su estado (RF-14)

- El estado puede cambiar a VENCIDA o CANCELADA con confirmación.
- Una póliza no vigente no admite nuevos pagos (RN-01).
- La prima no se puede editar si la póliza tiene pagos validados.

### HU-14 — Listar pólizas (RF-15)

- Se filtra por cliente, aseguradora y estado.
- El listado está paginado.
- Se puede ordenar por fecha de fin de vigencia.

### Fuera de alcance (no implementar)

- Cuentas de CLIENTE: desactivar un cliente no toca su `Usuario` ni sus sesiones (HU-05, S10).
- Ficha del cliente con pólizas y pagos (HU-10, S10).
- Plan de cuotas, registro, validación y rechazo de pagos desde la SPA (HU-35, HU-16, HU-18 y
  HU-19, S6). Del módulo de pagos solo se toca RN-01 en `CrearPagoUseCase` (D14).
- Saldo pendiente (HU-15, S10).
- Administrar catálogos (HU-46, S15): `GET /ramos` es de solo lectura.
- Importación desde archivo (HU-34, S13).
- Búsqueda insensible a tildes (`unaccent`): deuda (D8).
- Firefox y WebKit en Playwright (HT-09, S15).

## 2. Decisiones tomadas (no reabrir)

| #   | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Motivo                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| D1  | Plan con el formato de S4, ejecutado por OpenCode con agentes coordinados; un solo commit del orquestador, sin atribuciones; push y PR los hace el usuario. Las horas se reportan como las fija el backlog (sin orden de recorte).                                                                                                                                                                                                                                                                       | `AGENTS.md` y preferencia del desarrollador.                                                                    |
| D2  | Alcance: HU-08, HU-09, HU-12, HU-13 y HU-14, más RN-01 en `CrearPagoUseCase` (criterio de HU-13) y el retiro de `DELETE /polizas/:id`.                                                                                                                                                                                                                                                                                                                                                                   | Regla de alcance.                                                                                               |
| D3  | Agentes versionados en `.opencode/agents/`, heredan el modelo: `orquestador` (primario) y los subagentes `contrato-shared`, `backend-api`, `frontend-spa`, `verificador` y `revisor` (solo lectura). Cada uno edita solo su carpeta (tabla 0.1).                                                                                                                                                                                                                                                         | Las carpetas disjuntas son lo que permite la fase paralela sin worktrees.                                       |
| D4  | Coordinación: el contrato primero (Fase 1), luego API y SPA en paralelo, después e2e y revisión. Traspasos por notas en `.superpowers/sdd/sprint-05-plan/`. El revisor hace una ronda y como máximo una de confirmación; lo que quede pendiente va como deuda.                                                                                                                                                                                                                                           | La SPA programa contra el contrato, no contra el API en curso.                                                  |
| D5  | Editar cliente (`PATCH /clientes/:id`): nombres, apellidos, razón social, correo y teléfono siempre, también si el cliente está inactivo. `tipoIdentificacion` e `identificacion` solo si el cliente **no tiene ninguna póliza**, en cualquier estado. Si las tiene y el valor cambia → `ReglaNegocioError` (422) con `details: { campo, motivo: 'IDENTIFICACION_CON_POLIZAS' }`. Reenviar el mismo valor no es un cambio.                                                                               | La identificación es la del recibo; cambiarla rompe la trazabilidad.                                            |
| D6  | `POST /clientes/:id/desactivar` y `/reactivar` (`@HttpCode(200)`, ADMIN y OPERADOR), auditados como `DESACTIVAR` y `REACTIVAR` sobre `Cliente`. Idempotentes: desactivar a uno inactivo devuelve el cliente igual. Responden el cliente. No se toca su `Usuario` ni sus sesiones.                                                                                                                                                                                                                        | Mismo patrón que usuarios (S4); RN-09. La cuenta de cliente es de HU-05.                                        |
| D7  | La respuesta de cliente suma `activo: boolean` y `tienePolizas: boolean`, calculado con `_count` en la misma consulta (sin N+1). La SPA deshabilita tipo e identificación cuando `tienePolizas` es verdadero.                                                                                                                                                                                                                                                                                            | La SPA debe explicar el bloqueo antes del envío.                                                                |
| D8  | `GET /clientes`: `estado=ACTIVOS\|INACTIVOS\|TODOS` (por defecto `ACTIVOS`) y `pageSize` por defecto 20. `q` se divide por espacios: **cada** palabra debe coincidir (`contains`, sin distinguir mayúsculas) con identificación, nombres, apellidos, razón social o correo. La insensibilidad a tildes queda como deuda con un comentario `ponytail:` (techo: ILIKE; salida: extensión `unaccent`).                                                                                                      | "juan pérez" debe encontrar a Juan Pérez aunque nombre y apellido estén en columnas distintas.                  |
| D9  | Crear póliza: `crearPolizaSchema` sin `estado` (siempre VIGENTE) y con `ramoId: uuid` en lugar de `ramo: string`. `fechaFin` **estrictamente** posterior a `fechaInicio`. `primaTotal` > 0 con hasta 2 decimales (`montoPositivoSchema`). Errores (`details: { campo, motivo }`): cliente inexistente → 404; cliente inactivo → 422 `CLIENTE_INACTIVO`; aseguradora inexistente → 404; ramo inexistente o inactivo → 422 `RAMO_INVALIDO`; número repetido → 409 `NUMERO_DUPLICADO`, también por `P2002`. | Criterios literales de HU-12 y HU-08.4; la SPA no es la única defensa.                                          |
| D10 | `GET /ramos` de solo lectura (ADMIN y OPERADOR): ramos activos `{ id, codigo, nombre }` ordenados por nombre, sin paginación. Vive en el módulo `polizas` (`RamosController`). Administrarlos es HU-46.                                                                                                                                                                                                                                                                                                  | El formulario necesita un `Select` estable; texto libre resuelto por nombre es frágil.                          |
| D11 | Editar póliza (`PATCH /polizas/:id`): solo si está VIGENTE (si no → 422 `POLIZA_NO_VIGENTE`). Campos: `numero`, `aseguradoraId`, `ramoId`, `primaTotal`, `fechaInicio` y `fechaFin`; **sin** `clienteId` ni `estado` (el esquema los rechaza). La prima no cambia si hay pagos VALIDADOS → 422 `PRIMA_CON_PAGOS_VALIDADOS`. Si llega una sola fecha, se compara con la guardada. La respuesta suma `tienePagosValidados: boolean` (con `_count` filtrado).                                               | Mover una póliza con pagos o recibos a otro cliente rompe la trazabilidad.                                      |
| D12 | Estado: `POST /polizas/:id/estado` con `{ estado: 'VENCIDA' \| 'CANCELADA' }`, `@HttpCode(200)`, auditado como **`CAMBIAR_ESTADO`** (acción nueva). El detalle de la bitácora guarda `estado` nuevo. Solo VIGENTE → VENCIDA o CANCELADA; los dos son **terminales** (desde otro estado → 422 `POLIZA_NO_VIGENTE`). La SPA pide confirmación con `AlertDialog`. Una renovación es una póliza nueva con otro número.                                                                                       | Una cancelación debe poder encontrarse en la bitácora (HU-45); cuotas y saldo (S6–S10) heredan estados simples. |
| D13 | Se retira `DELETE /polizas/:id` con su caso de uso, el método del repositorio y su entrada en `auditoria-cobertura.spec.ts`.                                                                                                                                                                                                                                                                                                                                                                             | RN-09; como clientes y aseguradoras en S4. CANCELADA cubre el error de registro.                                |
| D14 | RN-01 en `CrearPagoUseCase`: la póliza inexistente → 404; no VIGENTE → 422 `POLIZA_NO_VIGENTE`. Nuevo método `estadoPoliza(polizaId)` en `PagosRepositoryPort`. No se toca nada más de pagos.                                                                                                                                                                                                                                                                                                            | Criterio de HU-13 con evidencia en este sprint; el registro de pagos completo es HU-16 (S6).                    |
| D15 | `GET /polizas`: filtros `clienteId`, `aseguradoraId`, `estado` y `q` (número), paginado (por defecto 20), y `orden=recientes\|fechaFinAsc\|fechaFinDesc` (por defecto `recientes`). La SPA alterna el orden con el encabezado "Vigencia" (`aria-sort`).                                                                                                                                                                                                                                                  | HU-14.                                                                                                          |
| D16 | Selector de cliente: `SelectorCliente`, un combobox ARIA 1.2 hecho con `Input` y una lista (`role="listbox"`), con búsqueda en el servidor (`GET /clientes?q=&estado=ACTIVOS`, debounce de 300 ms y 20 resultados), sin dependencias nuevas. Se usa en el formulario de póliza (solo activos) y como filtro del listado de pólizas.                                                                                                                                                                      | HU-08.4; un `Select` con los primeros 100 deja de servir con más clientes.                                      |
| D17 | ADR-018 "Ciclo de vida de la póliza": estados terminales, renovación como póliza nueva, sin borrado, bloqueos de edición (VIGENTE, prima con pagos validados, cliente fijo) y RN-01. El informe pide al autor agregarlo a la tabla 11-1.                                                                                                                                                                                                                                                                 | Fija reglas que S6–S8 heredan.                                                                                  |
| D18 | Pruebas: TDD de los esquemas y de los casos de uso nuevos; e2e `clientes` ampliado, `polizas` nuevo, `pagos-rn01` (o caso en `flujo-anclaje`), `bitacora` y matriz de `acceso-por-rol` actualizados; Vitest de `ClientesPage`, `FormularioCliente`, `SelectorCliente`, `PolizasPage` y `FormularioPoliza`; Playwright `clientes-polizas.spec.ts` y 360 px de las páginas tocadas, solo Chromium.                                                                                                         | Evidencia por criterio para el informe.                                                                         |
| D19 | Las e2e que cambian el estado de una póliza **crean su propia póliza**; nunca alteran la del seed, que `flujo-anclaje` e `idempotencia-anclaje` buscan con `findFirst({ estado: 'VIGENTE' })`.                                                                                                                                                                                                                                                                                                           | Evita romper el flujo de anclaje entre corridas.                                                                |

## 3. Estado de partida (verificado el 07/10/2026)

- **Clientes:** CRUD sin `DELETE` desde S4. `Cliente.activo` existe en Prisma (`@default(true)`),
  pero ni el dominio, ni el repositorio, ni la respuesta lo usan. `listar` busca `q` como una sola
  cadena en cinco columnas (`OR`), así que "juan pérez" no encuentra nada, y filtra solo por
  `tipoIdentificacion`. `ActualizarClienteUseCase` ya valida RN-11 contra el valor guardado.
- **Pólizas:** CRUD completo desde S1, con `DELETE` (`EliminarPolizaUseCase`, traduce `P2003`).
  `crearPolizaSchema`:
  - acepta `ramo: string`, que `resolverRamoId` resuelve por código o nombre;
  - acepta `estado`, con `VIGENTE` por defecto;
  - permite `fechaFin == fechaInicio`;
  - usa `montoDecimalSchema`, que acepta `0`.

  El `PATCH` acepta cualquier campo, `clienteId` y `estado` incluidos. `listar` filtra por
  `clienteId`, `estado` y `q` (número o ramo) y ordena por `createdAt desc`. El número duplicado
  responde 409 sin `details`. `MisPolizasController` (CLIENTE) usa el mismo `listar`.

- **Pagos:** `CrearPagoUseCase` solo resuelve el método de pago; no mira el estado de la póliza.
- **Ramos:** catálogo `Ramo` sembrado (VIDA, SALUD, VEHICULOS, INCENDIO, FIANZAS); no hay endpoint.
- **Auditoría:** `ACCIONES_AUDITORIA` no tiene `CAMBIAR_ESTADO`. `construirDetalle`
  (`modules/auditoria/domain/registro-auditoria.ts`) solo guarda `campos` en `MODIFICAR`.
  `auditoria-cobertura.spec.ts` tiene un mapa manual con `PolizasController.eliminar`.
  `BitacoraPage` tiene `ETIQUETAS_ACCION: Record<AccionAuditoria, string>`, así que el `typecheck`
  falla si falta la etiqueta nueva.
- **SPA:**
  - `PolizasPage` es solo un listado (`pageSize=100`, sin filtros ni acciones).
  - `features/polizas/api.ts` lista clientes y aseguradoras con `pageSize=100`.
  - `ClientesPage` tiene alta y búsqueda, sin edición ni estado.
  - `TablaDatos.tsx` (S4) da la tabla paginada con carga, error y vacío.
  - Hay `alert-dialog`, pero no `popover` ni `command`.
  - `PanelCliente` muestra `poliza.ramo`: la respuesta conserva `ramo` (nombre) y suma `ramoId`.
- **Pruebas que se rompen con este sprint:**
  - `auditoria-cobertura.spec.ts` (`PolizasController.eliminar`, y las mutaciones nuevas);
  - `acceso-por-rol.e2e-spec.ts`: la matriz descubre rutas desde `rutas-declaradas.ts`, así que
    verifica que el `DELETE` desaparezca y entren `/ramos`, `/estado`, `/desactivar` y
    `/reactivar`;
  - `esquemas-compartidos.spec.ts`, en lo que toque a `crearPolizaSchema` y a los esquemas de
    cliente;
  - cualquier prueba que cree pólizas con `ramo: 'Vehículos'` o con `estado`.
- **Seed:** cliente con cédula `1710034065`, una póliza VIGENTE de ramo VEHICULOS y pagos de
  ejemplo. No se cambia.
- **Migraciones:** no hacen falta: el esquema ya tiene todo lo que este sprint usa.
- **ADR:** el último es ADR-017; el nuevo es ADR-018.
- **Pruebas según el informe de S4:** 30 de contratos, 131 unitarias del API (31 suites), 97 de la
  SPA (14 archivos), 134 e2e del API (9 suites) y 8 de Playwright.
- **Entorno (informes de S2 a S4):**
  - `pnpm` es el binario de Windows aunque se invoque desde WSL.
  - Si Windows define `CONTRACT_ADDRESS`, esa variable pisa el `.env`.
  - Limpia `bull:anclaje-recibos:*` con el worker detenido.
  - El hook `pre-commit` puede fallar con muchos archivos: verifica `lint` y `format:check` del
    monorepo, commitea con `--no-verify` y anótalo.

## 4. Fase 0 — Preparación (`orquestador`, 0,5 h)

### T0. Rama, línea base y ledger

- Si el PR de este plan ya está en `main`, parte de `main`; si no, parte de
  `docs/sprint-05-plan-agentes`. Crea `feat/sprint-05-clientes-polizas`.
- Ejecuta la línea base: `pnpm install --frozen-lockfile`, `pnpm -r build`,
  `pnpm -r typecheck` y `pnpm test`, y guarda los totales en
  `.superpowers/sdd/sprint-05-plan/orquestador.md`. Si algo está rojo antes de empezar, detente y
  repórtalo.
- Comprueba que OpenCode ve los seis agentes (`@` en la TUI) y la skill `grilling` en
  `.agents/skills/`.

## 5. Fase 1 — Contratos compartidos (`contrato-shared`, 2 h)

### T1. Esquemas de cliente (HU-08 y HU-09; TDD, 0,5 h)

- **Archivos:** `packages/shared/src/schemas/cliente.schema.ts`, `constants/estados.ts`,
  `apps/web/src/contratos/esquemas-compartidos.spec.ts`.
- `FILTROS_ESTADO_CLIENTE = ['ACTIVOS', 'INACTIVOS', 'TODOS'] as const` y su esquema.
- `listarClientesQuerySchema` suma `estado` con `.default('ACTIVOS')`.
- `clienteSchema` (respuesta) suma `activo: z.boolean()` y `tienePolizas: z.boolean()`.
- `actualizarClienteSchema` no cambia de forma: la regla de D5 depende de la base y vive en el caso
  de uso.
- **Pruebas primero:**
  - `estado` por defecto es `ACTIVOS`;
  - un `estado` desconocido falla;
  - la respuesta acepta `activo` y `tienePolizas`.

### T2. Esquemas de póliza, ramo y auditoría (HU-12 a HU-14; TDD, 1 h)

- **Archivos:** `schemas/poliza.schema.ts`, `schemas/common.schema.ts`, `schemas/ramo.schema.ts`
  (nuevo) y su export en `index.ts`, `constants/auditoria.ts`, más sus pruebas.
- `montoPositivoSchema = montoDecimalSchema.refine(v => Number(v) > 0, 'La prima debe ser mayor que
cero')` en `common.schema.ts`.
- Base nueva sin `estado` ni `ramo`; con `ramoId: z.uuid()`.
- `validarFechas`: error si `fechaFin <= fechaInicio`, con el mensaje "La fecha de fin debe ser
  posterior a la de inicio".
- `crearPolizaSchema` = base completa + `validarFechas`.
- `actualizarPolizaSchema`: un objeto **estricto** con `numero`, `aseguradoraId`, `ramoId`,
  `primaTotal`, `fechaInicio` y `fechaFin`, todos opcionales, más `validarFechas` y "al menos un
  campo". `clienteId` o `estado` → error de validación.
- `cambiarEstadoPolizaSchema = z.object({ estado: z.enum(['VENCIDA', 'CANCELADA']) })`.
- `polizaSchema` (respuesta): `id`, `numero`, `clienteId`, `aseguradoraId`, `ramoId`, `ramo`
  (nombre), `primaTotal`, `fechaInicio`, `fechaFin`, `estado`, `clienteNombre?`,
  `aseguradoraNombre?`, `tienePagosValidados: boolean`, `createdAt` y `updatedAt`.
- `ORDENES_POLIZA = ['recientes', 'fechaFinAsc', 'fechaFinDesc'] as const`.
  `listarPolizasQuerySchema` suma `aseguradoraId?` y `orden` (`.default('recientes')`).
- `ramoSchema = z.object({ id, codigo, nombre })`.
- `ACCIONES_AUDITORIA` suma `'CAMBIAR_ESTADO'`.
- **Pruebas primero:**
  - prima `0`, `0.00`, `-1` y `1.234` fallan; `0.01` y `1500.5` pasan;
  - fechas iguales fallan;
  - crear con `estado` lo ignora o falla, y la póliza se crea VIGENTE (elige uno y pruébalo);
  - el `PATCH` con `clienteId` o con `estado` falla;
  - `cambiarEstado` con `VIGENTE` falla;
  - `orden` por defecto es `recientes`.

**Ejemplo (orientativo).**

```ts
const camposPoliza = {
  numero: z.string().trim().min(1, 'El número es obligatorio').max(50),
  aseguradoraId: z.uuid('Seleccione una aseguradora'),
  ramoId: z.uuid('Seleccione un ramo'),
  primaTotal: montoPositivoSchema,
  fechaInicio: z.iso.date(),
  fechaFin: z.iso.date(),
};

export const crearPolizaSchema = z
  .object({ ...camposPoliza, clienteId: z.uuid('Seleccione un cliente') })
  .superRefine(validarFechas);

export const actualizarPolizaSchema = z
  .strictObject(camposPoliza)
  .partial()
  .superRefine(validarFechas)
  .refine((v) => Object.keys(v).length > 0, { message: 'Debe enviar al menos un campo' });
```

### T3. ADR-018 (0,5 h)

- `docs/adr/ADR-018-ciclo-vida-poliza.md` con el formato corto (Contexto · Decisión · Alternativas
  · Consecuencias), con el contenido de D9, D11, D12, D13 y D14. Alternativas descartadas:
  - VENCIDA → VIGENTE para renovar;
  - borrar pólizas sin pagos;
  - un cliente editable.
- Agrega la entrada a `docs/adr/README.md`.

**Verificación de la Fase 1** (la ejecuta el agente y la confirma el orquestador):

```bash
pnpm --filter @oasis/shared build && pnpm --filter @oasis/shared lint && pnpm --filter @oasis/shared typecheck
pnpm --filter @oasis/web test src/contratos
```

El `typecheck` del API y de la SPA puede quedar rojo al cerrar la Fase 1 (por ejemplo, el
`ETIQUETAS_ACCION` de la bitácora o `ramo` → `ramoId`): se cierra en la Fase 2. Anota en la nota de
traspaso qué rompe en cada lado.

## 6. Fase 2 — API y SPA en paralelo

El orquestador lanza `backend-api` (T4 a T7) y `frontend-spa` (T8 a T10) en **el mismo mensaje**,
cada uno con la nota de `contrato-shared`. Ninguno espera al otro: la SPA se prueba con la API
simulada (MSW o `fetch` simulado, como las pruebas existentes).

### T4. Clientes: edición, desactivación y búsqueda (`backend-api`, HU-08 y HU-09; TDD, 2 h)

- **Archivos:** `modules/clientes/**` y `modules/auditoria/presentation/http/auditoria-cobertura.spec.ts`.
- **Dominio y respuesta:** `PropsCliente` suma `activo` y `tienePolizas`. El repositorio los lee con
  `include: { _count: { select: { polizas: true } } }` en `buscarPorId`, `listar` y `actualizar`.
- **`ActualizarClienteUseCase` (D5):** si `tipoIdentificacion` o `identificacion` difieren del valor
  guardado (ya normalizados) y `existente.tienePolizas` → `ReglaNegocioError('La identificación no
se puede modificar porque el cliente tiene pólizas', { campo: 'identificacion', motivo:
'IDENTIFICACION_CON_POLIZAS' })`. La regla va antes de RN-11 y del chequeo de duplicado.
- **`DesactivarClienteUseCase` y `ReactivarClienteUseCase` (D6):** 404 si no existe; idempotentes;
  `actualizar(id, { activo })`.
- **Controlador:** `POST :id/desactivar` y `:id/reactivar`, con `@HttpCode(200)` y
  `@Auditar('DESACTIVAR' | 'REACTIVAR', 'Cliente')`. La clase sigue con `@Roles('ADMIN', 'OPERADOR')`.
- **`listar` (D8):** el filtro `estado` se traduce a `activo: true | false | undefined`; `q` se
  divide en palabras y arma `AND: palabras.map(p => ({ OR: [...] }))`; lleva el comentario
  `ponytail:` de tildes.
- **Pruebas primero** (con puertos simulados):
  - con pólizas → 422; con pólizas y el mismo valor → pasa;
  - sin pólizas → cambia;
  - un inactivo se edita;
  - desactivar y reactivar son idempotentes;
  - el repositorio arma el `AND` de palabras (`prisma-clientes.repository.spec.ts`).

### T5. Catálogo de ramos (`backend-api`, HU-12; 0,25 h)

- `PolizasRepositoryPort.listarRamosActivos(): Promise<RamoResumen[]>` (con `codigo`) y
  `buscarRamoActivoPorId(id)`. Se eliminan `buscarRamo(valor)` y `comoCodigo` si quedan sin uso.
- Un `RamosController` en `modules/polizas/presentation/http/`: `GET /ramos` con
  `@Roles('ADMIN', 'OPERADOR')`. Se registra en `PolizasModule`.

### T6. Pólizas: crear, editar, estado y listar (`backend-api`, HU-12 a HU-14; TDD, 3 h)

- **Puerto** (`polizas.repository.port.ts`): `buscarClienteParaPoliza(id): Promise<{ activo:
boolean } | null>`, `existeAseguradora(id)`, `contarPagosValidados(polizaId)` o el campo
  `tienePagosValidados` en la entidad, y `cambiarEstado(id, estado)`. Se quitan `eliminar` y
  `EliminarPolizaUseCase`.
- **`CrearPolizaUseCase` (D9):** valida en este orden: cliente (404 / 422 `CLIENTE_INACTIVO`),
  aseguradora (404), ramo (422 `RAMO_INVALIDO`) y número (409 `NUMERO_DUPLICADO`). Crea en
  VIGENTE. El repositorio traduce `P2002` al mismo 409 (`esConflictoUnico`).
- **`ActualizarPolizaUseCase` (D11):**
  - no VIGENTE → 422 `POLIZA_NO_VIGENTE`;
  - `primaTotal` distinta de la guardada con pagos validados → 422 `PRIMA_CON_PAGOS_VALIDADOS`;
  - fechas finales (las que llegan o las guardadas) con `fin <= inicio` → `ValidacionError` en
    `fechaFin`;
  - número y ramo con las mismas reglas que al crear.
- **`CambiarEstadoPolizaUseCase` (D12):** solo desde VIGENTE; si no, 422 `POLIZA_NO_VIGENTE`.
  Endpoint `POST /polizas/:id/estado`, `@HttpCode(200)`, `@Auditar('CAMBIAR_ESTADO', 'Poliza')`.
- **Bitácora:** `construirDetalle` guarda `estado` del cuerpo cuando la acción es
  `CAMBIAR_ESTADO`, con su prueba en `registro-auditoria.spec.ts`. Actualiza el mapa de
  `auditoria-cobertura.spec.ts`:
  - quita `PolizasController.eliminar`;
  - suma `PolizasController.cambiarEstado`, `ClientesController.desactivar` y
    `ClientesController.reactivar`.
- **`listar` (D15):** filtros `aseguradoraId` y `orden`. Mapeo de `orden`:
  - `recientes` → `createdAt desc`;
  - `fechaFinAsc` → `[{ fechaFin: 'asc' }, { numero: 'asc' }]`;
  - `fechaFinDesc` → lo mismo en descendente.

  `q` busca solo por número. Respuesta con `ramoId`, `ramo` y `tienePagosValidados`, calculado con
  `_count: { select: { pagos: { where: { estado: 'VALIDADO' } } } }`. `MisPolizasController` sigue
  igual, con la forma nueva.

- **Pruebas primero:** un caso por cada error de D9, D11 y D12, más el orden de validación de
  `CrearPolizaUseCase`.

**Ejemplo (orientativo).**

```ts
export class CambiarEstadoPolizaUseCase {
  constructor(private readonly polizas: PolizasRepositoryPort) {}

  async ejecutar(id: string, estado: 'VENCIDA' | 'CANCELADA'): Promise<Poliza> {
    const poliza = await this.polizas.buscarPorId(id);
    if (!poliza) throw new NoEncontradoError('Póliza', id);
    if (poliza.estado !== 'VIGENTE') {
      throw new ReglaNegocioError('Solo una póliza vigente puede cambiar de estado', {
        campo: 'estado',
        motivo: 'POLIZA_NO_VIGENTE',
      });
    }
    return this.polizas.cambiarEstado(id, estado);
  }
}
```

### T7. RN-01 en el registro de pagos (`backend-api`, HU-13; TDD, 0,5 h)

- `PagosRepositoryPort.estadoPoliza(polizaId): Promise<EstadoPoliza | null>` y su implementación
  Prisma (`select: { estado: true }`).
- `CrearPagoUseCase`: `null` → `NoEncontradoError('Póliza', id)`; distinto de VIGENTE →
  `ReglaNegocioError('La póliza no está vigente y no admite pagos (RN-01)', { campo: 'polizaId',
motivo: 'POLIZA_NO_VIGENTE' })`. Va antes de resolver el método de pago.
- **Pruebas primero:** VENCIDA → 422, CANCELADA → 422, inexistente → 404 y VIGENTE crea.

**Verificación de `backend-api`:**

```bash
pnpm --filter @oasis/api build && pnpm --filter @oasis/api lint && pnpm --filter @oasis/api typecheck
pnpm --filter @oasis/api test && pnpm deps:check
```

### T8. `ClientesPage`: estado, búsqueda y edición (`frontend-spa`, HU-08 y HU-09; 2 h)

- **Archivos:** `features/clientes/{api.ts,hooks.ts,pages/ClientesPage.tsx,components/FormularioCliente.tsx}`
  y sus pruebas.
- **Listado:**
  - `TablaDatos` con 20 por página;
  - búsqueda con debounce de 300 ms que vuelve a la página 1;
  - `Select` "Activos / Inactivos / Todos" (por defecto Activos);
  - columna "Estado" con `Badge`.
- **Acciones por fila** (menú): "Editar" (el `Dialog` con `FormularioCliente` en modo edición) y
  "Desactivar" o "Reactivar" (con un `AlertDialog` que explica que el historial se conserva).
  Tras la mutación, `invalidateQueries` y un `toast`.
- **Modo edición:** con `tienePolizas`, tipo e identificación quedan `disabled`, con una ayuda
  "No se puede modificar: el cliente tiene pólizas" enlazada con `aria-describedby`. El 422
  `IDENTIFICACION_CON_POLIZAS` y el 409 se muestran en su campo.
- **Pruebas** (Vitest):
  - filtro y búsqueda envían `estado` y `q`;
  - la edición deshabilita la identificación con `tienePolizas`;
  - desactivar pide confirmación y llama al endpoint;
  - el 422 cae en su campo.

### T9. `SelectorCliente` (`frontend-spa`, HU-08.4 y HU-14; 1 h)

- **Archivo:** `features/clientes/components/SelectorCliente.tsx`, exportado para `polizas`.
- **Patrón ARIA 1.2 de combobox:**
  - un `Input` con `role="combobox"`, `aria-expanded`, `aria-controls` y
    `aria-activedescendant`;
  - una lista `role="listbox"` con opciones `role="option"`;
  - teclas ↑/↓, Enter y Escape;
  - debounce de 300 ms;
  - consulta `GET /clientes?q=…&estado=ACTIVOS&pageSize=20`;
  - muestra "nombre — identificación".
- **Props:** `value: string | undefined` (id), `onChange(id | undefined)`, `id` y
  `aria-invalid`. Con un valor elegido muestra el nombre y permite limpiar.
- Sin dependencias nuevas (D16). Debe funcionar dentro de un `Dialog` y a 360 px.
- **Pruebas:**
  - escribir consulta con `estado=ACTIVOS`;
  - las flechas y Enter eligen;
  - Escape cierra;
  - la lista vacía muestra "Sin resultados".

### T10. `PolizasPage` y `FormularioPoliza` (`frontend-spa`, HU-12 a HU-14; 3 h)

- **Archivos:**
  - `features/polizas/{api.ts,hooks.ts,pages/PolizasPage.tsx,components/FormularioPoliza.tsx}` y
    sus pruebas;
  - `features/auditoria/pages/BitacoraPage.tsx` (etiqueta "Cambio de estado").
- **Listado:**
  - `TablaDatos` paginada;
  - filtros: `SelectorCliente`, aseguradora (`Select`, desde `/aseguradoras`) y estado;
  - el encabezado "Vigencia" es un botón que alterna `fechaFinAsc` y `fechaFinDesc`, con
    `aria-sort`;
  - "Limpiar filtros".
- **"Nueva póliza"** (ADMIN y OPERADOR): `Dialog` con `FormularioPoliza`, que lleva:
  - número;
  - cliente (`SelectorCliente`);
  - aseguradora;
  - ramo (`Select` desde `GET /ramos`);
  - prima (`inputMode="decimal"`);
  - las dos fechas.

  Muestra los errores por campo (409 `NUMERO_DUPLICADO` en número y 422 `CLIENTE_INACTIVO` en
  cliente).

- **Acciones por fila:**
  - "Editar", solo si está VIGENTE: el mismo formulario sin cliente; la prima queda `disabled` con
    una ayuda si `tienePagosValidados`.
  - "Marcar vencida" y "Cancelar póliza", solo si está VIGENTE: un `AlertDialog` que dice que la
    acción es definitiva y que la póliza no admitirá pagos.
- **Pruebas:**
  - el formulario valida prima y fechas con el esquema compartido;
  - la edición sin cliente y con la prima bloqueada;
  - la confirmación del cambio de estado;
  - el orden alterna `aria-sort`;
  - los filtros envían sus parámetros.

**Verificación de `frontend-spa`:**

```bash
rm -rf apps/web/node_modules/.vite
pnpm --filter @oasis/web lint && pnpm --filter @oasis/web typecheck
pnpm --filter @oasis/web test && pnpm --filter @oasis/web build
```

**Cierre de la Fase 2 (orquestador):** `pnpm -r build`, `pnpm -r lint`, `pnpm format:check`,
`pnpm -r typecheck`, `pnpm test`, `pnpm deps:check` y `pnpm deps:check:negativo`. Si el contrato
real del API difiere del que usó la SPA, relanza al agente que se desvió del plan.

## 7. Fase 3 — Evidencia de extremo a extremo (`verificador`, 4 h)

Infraestructura: PostgreSQL y Redis de `compose.dev.yaml`, el nodo Hardhat, `pnpm dev:chain`,
`prisma migrate deploy` y `seed`.

### T11. e2e del API (2,5 h)

- **`clientes.e2e-spec.ts` (ampliar):**
  1. Editar contacto (correo y teléfono) → 200.
  2. Cliente con póliza (créala por el API): cambiar la identificación → 422
     `IDENTIFICACION_CON_POLIZAS`; reenviar la misma → 200.
  3. Desactivar → 200 `activo: false`; el registro sigue en `GET /clientes/:id`; no aparece con el
     estado por defecto, sí con `INACTIVOS` y con `TODOS`; reactivar → aparece.
  4. Búsqueda por identificación, por nombre y por "nombre apellido" (dos palabras).
  5. Paginación: con al menos 21 clientes de un sufijo único, `page=1` trae 20 y `page=2` el
     resto (usa `q` con el sufijo).
  6. La bitácora registra DESACTIVAR y REACTIVAR.
- **`polizas.e2e-spec.ts` (nuevo):**
  1. Crear → 201 VIGENTE, con `ramo` y `ramoId`.
  2. Errores de D9: fin igual a inicio, prima `0` y `1.234`, cliente inactivo (422), número
     duplicado (409 `NUMERO_DUPLICADO`) y ramo inexistente.
  3. `GET /ramos` lista los 5 ramos del seed; el CLIENTE → 403.
  4. Editar VIGENTE → 200; `PATCH` con `clienteId` o `estado` → 400.
  5. Prima con pago VALIDADO (crea el pago con Prisma en estado VALIDADO) → 422
     `PRIMA_CON_PAGOS_VALIDADOS`; editar otra cosa → 200.
  6. `POST /estado` CANCELADA → 200; otra vez, o el `PATCH` → 422 `POLIZA_NO_VIGENTE`; la
     bitácora tiene `CAMBIAR_ESTADO` con `estado` en el detalle.
  7. `DELETE /polizas/:id` → 404.
  8. Filtros `clienteId`, `aseguradoraId` y `estado`; `orden=fechaFinAsc` y `fechaFinDesc`
     ordenados; paginación.
- **RN-01:** `POST /pagos` sobre una póliza VENCIDA o CANCELADA creada por la prueba → 422
  `POLIZA_NO_VIGENTE`.
- **`acceso-por-rol.e2e-spec.ts` y `bitacora.e2e-spec.ts`:** al día con las rutas y acciones
  nuevas.
- Respeta D19: nunca cambies el estado de la póliza del seed.

### T12. Playwright (1,5 h)

- **`apps/web/e2e/clientes-polizas.spec.ts`** (OPERADOR):
  1. Busca un cliente creado por la prueba, lo edita y lo desactiva con confirmación.
  2. En "Nueva póliza", el `SelectorCliente` no muestra al cliente inactivo.
  3. Reactiva al cliente y registra una póliza con él.
  4. Ordena por vigencia y filtra por estado.
  5. Cancela la póliza con confirmación: deja de ofrecer "Editar".
- **`responsive.spec.ts`:** `/clientes` y `/polizas`, con sus diálogos abiertos, sin
  `scrollWidth > 360`.

**Verificación de la Fase 3:**

```bash
pnpm test:e2e
pnpm --filter @oasis/web test:e2e
```

## 8. Fase 4 — Revisión (`revisor` y especialistas, 2 h)

### T13. Revisión y correcciones

- El `revisor` revisa todo el diff (y los archivos nuevos) contra la sección 2, los criterios de la
  sección 1, `AGENTS.md`, `ponytail-review`, `accessibility` e `impeccable` (`audit`).
- El orquestador reparte los hallazgos **bloqueantes** por dueño de carpeta. Los **menores** dentro
  del alcance también se corrigen; los de fuera de alcance van como deuda.
- Una ronda de confirmación del `revisor`, como máximo. Después, el orquestador repite la
  verificación del cierre de la Fase 2 y la de la Fase 3.

## 9. Fase 5 — Documentación, DoD, informe y commit (`orquestador`, 3,75 h)

### T14. Documentación

- **`CLAUDE.md`, mapa técnico:**
  - `GET /ramos`;
  - el ciclo de la póliza con enlace a ADR-018;
  - RN-01 en `CrearPagoUseCase`;
  - `SelectorCliente` como combobox compartido.
- **`apps/api/src/modules/README.md`:** la acción `CAMBIAR_ESTADO`, si el README lista las
  acciones.
- `docs/adr/README.md` ya lo actualizó `contrato-shared` (T3).

### 9.1 Definición de Terminado

Con PostgreSQL y Redis de `compose.dev.yaml` y el nodo Hardhat:

```bash
pnpm install --frozen-lockfile
pnpm -r build
pnpm -r lint
pnpm format:check
pnpm -r typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test                                             # contratos, API y SPA
pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy   # sin migraciones nuevas
pnpm --filter @oasis/api seed
pnpm test:e2e
pnpm --filter @oasis/web test:e2e
```

Pruebas manuales (anota el resultado en el informe):

- El operador desactiva un cliente y comprueba que no aparece al registrar una póliza; lo reactiva
  y sí aparece.
- El operador cancela una póliza y comprueba que un pago sobre ella se rechaza (por el API: aún no
  hay pantalla de pagos).
- `/clientes` y `/polizas` a 360 px, con teclado (combobox, menús y diálogos) y con lector de
  pantalla (anuncio de las opciones del combobox y de los errores por campo).

### 9.2 Informe del sprint

Crea `docs/sprints/sprint-05.md` con la estructura de `sprint-04.md`:

1. **Encabezado:** historias, épicas, rama, fechas y estado.
2. **Objetivo.**
3. **Entregables:** tabla con su ubicación, incluidos los agentes de `.opencode/agents/`.
4. **Criterios de cada historia con su evidencia** (sección 11).
5. **Definición de Terminado:** tabla de estado.
6. **Versiones:** solo si cambió alguna dependencia (no se espera).
7. **Decisiones y discrepancias:**
   - ADR-018;
   - el retiro de `DELETE /polizas`;
   - `ramo` → `ramoId` en la entrada;
   - RN-01 aplicado antes de HU-16;
   - la tabla 6-1 de la arquitectura dice NestJS 12 y se usa 11.
8. **Impedimentos y observaciones**, incluida la experiencia con los agentes:
   - qué fase paralela funcionó;
   - los conflictos entre fronteras;
   - las rondas de revisión.
9. **Deuda y fuera de alcance:**
   - la cuenta del cliente al desactivar (HU-05);
   - las tildes en la búsqueda (`unaccent`);
   - HU-10, HU-15 y HU-16;
   - Firefox y WebKit.
10. **Acciones del autor:** agregar ADR-018 a la tabla 11-1 de `docs/referencia/ARQUITECTURA.md`.
11. **Pruebas manuales** y **Cómo verificar** (los comandos de 9.1).

## 10. Commit y entrega

Revisa con `git status` que no entren:

- `.env` ni `.superpowers/`;
- `.agents/` (las skills son locales) ni `.claude/`;
- `*.docx`;
- `ignition/deployments/chain-31337` ni otros artefactos.

`.opencode/agents/` **sí** se versiona. Comprueba `git config user.name` (`JohannCaizaguano`) y haz
un solo commit, **sin** líneas `Co-Authored-By` ni "Generated with":

```bash
git add -A
git commit -F - <<'EOF'
feat(repo): completar el sprint 5 con gestión de clientes y registro de pólizas

- HU-08: edición de clientes con identificación fija si tienen pólizas; desactivar y reactivar.
- HU-09: búsqueda por identificación o nombre, filtro por estado y paginación de 20 en 20.
- HU-12: registro de pólizas con ramo del catálogo, prima positiva y vigencia válida.
- HU-13: edición de pólizas vigentes, prima bloqueada con pagos validados, cambio de estado a
  VENCIDA o CANCELADA y RN-01 en el registro de pagos.
- HU-14: listado con filtros por cliente, aseguradora y estado, y orden por fin de vigencia.
- Se retira DELETE de pólizas (RN-09); GET /ramos de solo lectura.
- Docs: ADR-018, CLAUDE.md e informe del sprint 5.

Refs: HU-08, HU-09, HU-12, HU-13, HU-14
EOF
```

No hagas push. Termina con un mensaje al usuario que incluya:

- el resumen de la verificación de 9.1 y de las pruebas manuales;
- el recordatorio de agregar ADR-018 a la tabla 11-1;
- el título del PR (el encabezado del commit);
- este cuerpo de PR, listo para pegar y sin líneas de atribución:

```markdown
## Resumen

Sprint 5: edición y desactivación de clientes (HU-08), búsqueda paginada (HU-09), registro (HU-12),
edición y cambio de estado (HU-13) y listado filtrado (HU-14) de pólizas. Informe:
`docs/sprints/sprint-05.md`.

## Criterios de aceptación

- [x] HU-08: editar contacto; identificación fija con pólizas; desactivar sin borrar; inactivo
      fuera del registro de pólizas
- [x] HU-09: búsqueda por identificación o nombre; 20 por página; filtro activos/inactivos
- [x] HU-12: número único y datos; fin posterior al inicio; prima > 0 con dos decimales; nace
      VIGENTE
- [x] HU-13: VENCIDA o CANCELADA con confirmación; RN-01; prima fija con pagos validados
- [x] HU-14: filtros por cliente, aseguradora y estado; paginado; orden por fin de vigencia

## Pendiente

- Agregar ADR-018 a la tabla 11-1 de la arquitectura.
- Aceptación del Product Owner en la revisión del sprint.
```

## 11. Trazabilidad criterio → evidencia

| Criterio                                     | Evidencia esperada                                                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| HU-08.1 editar datos de contacto             | `clientes.use-cases.spec.ts`; `clientes.e2e-spec.ts` caso 1; `ClientesPage.test.tsx`; `clientes-polizas.spec.ts`  |
| HU-08.2 identificación fija con pólizas      | `clientes.use-cases.spec.ts`; `clientes.e2e-spec.ts` caso 2; `FormularioCliente.test.tsx`                         |
| HU-08.3 desactivar no elimina (RN-09)        | `clientes.use-cases.spec.ts`; `clientes.e2e-spec.ts` casos 3 y 6                                                  |
| HU-08.4 inactivo fuera del registro          | `polizas.use-cases.spec.ts`; `polizas.e2e-spec.ts` caso 2; `SelectorCliente.test.tsx`; `clientes-polizas.spec.ts` |
| HU-09.1 búsqueda por identificación o nombre | `prisma-clientes.repository.spec.ts`; `clientes.e2e-spec.ts` caso 4; `ClientesPage.test.tsx`                      |
| HU-09.2 paginación de 20 en 20               | `esquemas-compartidos.spec.ts`; `clientes.e2e-spec.ts` caso 5                                                     |
| HU-09.3 filtro activos e inactivos           | `esquemas-compartidos.spec.ts`; `clientes.e2e-spec.ts` caso 3; `ClientesPage.test.tsx`                            |
| HU-12.1 número único, cliente, aseguradora…  | `polizas.use-cases.spec.ts`; `polizas.e2e-spec.ts` casos 1 a 3; `FormularioPoliza.test.tsx`                       |
| HU-12.2 fin posterior al inicio              | `esquemas-compartidos.spec.ts`; `polizas.e2e-spec.ts` caso 2                                                      |
| HU-12.3 prima > 0 con dos decimales (RN-10)  | `esquemas-compartidos.spec.ts`; `polizas.e2e-spec.ts` caso 2                                                      |
| HU-12.4 nace VIGENTE                         | `polizas.use-cases.spec.ts`; `polizas.e2e-spec.ts` caso 1                                                         |
| HU-13.1 VENCIDA o CANCELADA con confirmación | `polizas.use-cases.spec.ts`; `polizas.e2e-spec.ts` caso 6; `PolizasPage.test.tsx`; `clientes-polizas.spec.ts`     |
| HU-13.2 no vigente sin pagos (RN-01)         | `pagos.use-cases.spec.ts`; e2e de RN-01; ADR-018                                                                  |
| HU-13.3 prima fija con pagos validados       | `polizas.use-cases.spec.ts`; `polizas.e2e-spec.ts` caso 5; `FormularioPoliza.test.tsx`                            |
| HU-14.1 filtros cliente, aseguradora, estado | `polizas.e2e-spec.ts` caso 8; `PolizasPage.test.tsx`                                                              |
| HU-14.2 paginado                             | `polizas.e2e-spec.ts` caso 8                                                                                      |
| HU-14.3 orden por fin de vigencia            | `polizas.e2e-spec.ts` caso 8; `PolizasPage.test.tsx`; `clientes-polizas.spec.ts`                                  |

## 12. Estimación

| Fase | Tareas                                              | Agente                    | Historia | Horas |
| ---- | --------------------------------------------------- | ------------------------- | -------- | ----: |
| 0    | Rama, línea base y ledger (T0)                      | `orquestador`             | Todas    |   0,5 |
| 1    | Esquemas y ADR-018 (T1 a T3)                        | `contrato-shared`         | Todas    |     2 |
| 2    | Clientes, ramos, pólizas y RN-01 en el API (T4–7)   | `backend-api`             | Todas    |  5,75 |
| 2    | `ClientesPage`, `SelectorCliente` y pólizas (T8–10) | `frontend-spa`            | Todas    |     6 |
| 3    | e2e del API y Playwright (T11 y T12)                | `verificador`             | Todas    |     4 |
| 4    | Revisión y correcciones (T13)                       | `revisor` y especialistas | Todas    |     2 |
| 5    | Documentación, DoD, informe y commit (T14)          | `orquestador`             | Todas    |  3,75 |
|      | **Total de trabajo**                                |                           |          |    24 |

Las fases 2 de API y de SPA corren en paralelo. En el informe, las horas por historia siguen el
backlog: HU-08 4 h, HU-09 5 h, HU-12 8 h, HU-13 4 h y HU-14 3 h (24 h). Las horas son nominales
(D1): no hay orden de recorte.

## 13. Prompt de arranque para OpenCode

**Preparación, una vez en tu copia local:**

1. Instala la skill `grilling` junto a las demás skills del proyecto:

   ```bash
   git clone --depth 1 https://github.com/mattpocock/skills /tmp/mattpocock-skills
   mkdir -p .agents/skills && cp -r /tmp/mattpocock-skills/skills/productivity/grilling .agents/skills/
   ```

2. Abre OpenCode en la raíz del repositorio. Comprueba que `@` lista `contrato-shared`,
   `backend-api`, `frontend-spa`, `verificador` y `revisor`.
3. Cambia al agente primario `orquestador` con **Tab** y pega el prompt.

**Prompt:**

```text
Eres el orquestador del Sprint 5 del SRPP. Ejecuta docs/sprints/sprint-05-plan.md de principio a
fin, siguiendo sus reglas (sección 0) y sus decisiones (sección 2), que no se reabren.

1. Lee AGENTS.md, CLAUDE.md, apps/api/src/modules/README.md y el plan completo. Invoca
   executing-plans y ponytail. Abre el ledger en .superpowers/sdd/sprint-05-plan/.
2. Fase 0 (T0): crea la rama feat/sprint-05-clientes-polizas, ejecuta la línea base y anota los
   totales. Si algo está rojo antes de empezar, detente y avísame.
3. Fase 1: lanza @contrato-shared con T1, T2 y T3, citando D5 a D17 y la ruta de su nota de
   traspaso. Verifica la Fase 1 tú mismo.
4. Fase 2: en un mismo mensaje lanza dos tareas en paralelo:
   - @backend-api con T4 a T7 (decisiones D5 a D15 y D19);
   - @frontend-spa con T8 a T10 (decisiones D5 a D8, D11, D12, D15 y D16).
   Pásales a ambos el resumen de la nota de @contrato-shared. Al terminar los dos, ejecuta el
   cierre de la Fase 2.
5. Fase 3: lanza @verificador con T11 y T12 y las notas de backend y frontend. Si reporta bugs de
   producto, relanza al especialista dueño de la carpeta con la prueba roja y repite la
   verificación.
6. Fase 4: lanza @revisor con T13. Reparte los hallazgos por dueño de carpeta, corrige y pide
   como máximo una ronda de confirmación.
7. Fase 5: T14, la Definición de Terminado (9.1), el informe docs/sprints/sprint-05.md (9.2) y el
   único commit de la sección 10, sin atribuciones y sin push.

Cada subagente recibe un mensaje autosuficiente: las tareas, las decisiones por número, lo que
entregaron los demás y la ruta de su nota. Respeta las fronteras de edición de la tabla 0.1. Si
una decisión deja de ser viable, detente e invoca la skill grilling para preguntarme, con tu
recomendación. Termina con el resumen y el cuerpo del PR que pide la sección 10.
```
