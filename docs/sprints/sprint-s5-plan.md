# Sprint S5 — Plan de implementación

- **Historias:** HU-24 Ver estado de anclaje (4 h), HU-25 Recibo imprimible con QR (6 h), HU-26
  Reintentar recibo fallido (3 h), HT-16 Protección de datos y respuesta a incidentes (3 h), HU-28
  Verificar autenticidad del recibo (10 h), HU-36 Aplicar pagos a cuotas (5 h), HU-20 Listar pagos
  (6 h), HU-38 Cuotas por vencer y vencidas (4 h) y HU-51 Cobertura y condiciones de la póliza (2 h).
- **Horas:** 43 h de backlog. El informe reporta solo las horas de backlog (D22).
- **Épicas:** EP-05 (HU-24, HU-25, HU-26), EP-06 (HU-28), EP-03 (HU-36, HU-38, HU-51), EP-04
  (HU-20) y EP-07 (HT-16).
- **Fechas:** 02/11/2026 – 13/11/2026 (tabla 6-1). El 02 y el 03/11 son feriados. Revisión del
  sprint con Oasis: 13/11.
- **Rama:** `feat/sprint-s5-verificacion-cartera`. Un solo commit y un solo PR.
- **Ejecuta:** la sesión principal con `subagent-driven-development` y los agentes de área de
  `.opencode/agents/` (sección 0.1).
- **Decisiones acordadas con el desarrollador:** 23/10 y 24/10/2026, en sesiones de grilling
  (sección 2).

Este documento es el Sprint Backlog de S5. Las reglas generales están en `AGENTS.md`, el mapa
técnico en `CLAUDE.md` y las reglas de los módulos del API en `apps/api/src/modules/README.md`.
Cada agente lee los tres antes de empezar. La fuente de verdad está en `docs/referencia/`, que no se
edita: si algo de este plan la contradice, gana la referencia; detente y repórtalo.

**Cómo leer las tareas.** Cada tarea indica su **agente**, sus **archivos**, sus **skills**, el
comportamiento esperado, los casos borde, las pruebas que se escriben primero y su verificación. Los
bloques **Ejemplo (orientativo)** muestran la forma o la parte delicada; se adaptan al código real.

## 0. Reglas de ejecución

1. La sesión principal ejecuta las fases en orden: 0 → 1 → 2 → 3 → 4 → 5. Ningún agente arranca una
   fase por su cuenta.
2. TDD en toda lógica nueva (`test-driven-development`): primero la prueba en rojo, luego el código.
   Antes de cerrar una fase, la sesión principal usa `verification-before-completion` y guarda la
   salida en el ledger.
3. Cada agente invoca al empezar las skills de su tarea en el orden de `AGENTS.md`: proceso →
   tecnología → `ponytail` decide el tamaño.
4. Tras cambiar `packages/shared/src`: `pnpm --filter @oasis/shared build` y borrar
   `apps/web/node_modules/.vite`.
5. Nunca se edita `docs/referencia/`.
6. **Un solo commit** al final (T24), hecho por la sesión principal, sin líneas de atribución. Antes,
   `git config user.name` debe ser `JohannCaizaguano`. **Sin push ni PR**: los hace el usuario.
7. No se adelanta trabajo de otros sprints; lo que exceda el alcance va como deuda al informe.
8. Comentarios solo para el porqué no obvio. Simplificaciones deliberadas con `ponytail:` (techo y
   salida).
9. En la fase paralela cada agente compila y prueba **solo su paquete** (`pnpm --filter …`); nadie
   ejecuta `pnpm -r build` ni `pnpm install` hasta que la sesión principal cierre la fase.
10. Las dependencias nuevas las instala **la sesión principal** en T0: los agentes no editan
    `package.json` ni el lockfile. Este sprint no prevé ninguna (`qrcode.react` ya está instalado).
11. **Punto de control antes del commit (D21):** la sesión principal se detiene en T22, presenta las
    capturas de las pantallas nuevas y espera un «aprobado» explícito. Con ajustes, los reparte al
    dueño, repite los cierres afectados y vuelve a presentar.

### 0.1 Agentes y coordinación

| Agente            | Edita                                                            | Fases | Tareas            |
| ----------------- | ---------------------------------------------------------------- | ----- | ----------------- |
| sesión principal  | archivos raíz, ledger                                            | 0–5   | T0, T21, T22, T24 |
| `contrato-shared` | `packages/shared/src/` (salvo `abi/`), `apps/web/src/contratos/` | 1     | T1–T3             |
| `documentacion`   | `docs/` (salvo `referencia/`), `CLAUDE.md`, `AGENTS.md`, READMEs | 1, 5  | T4, T23           |
| `backend-api`     | `apps/api/src/`, `apps/api/prisma/`                              | 2, 4  | T5–T11            |
| `frontend-spa`    | `apps/web/src/` (salvo `contratos/`)                             | 3, 4  | T12–T17           |
| `verificador`     | `apps/api/test/`, `apps/web/e2e/`                                | 4     | T18, T19          |
| `revisor`         | nada (solo su nota del ledger)                                   | 4     | T20               |

```text
Fase 0  sesión principal ── T0 arrastre de S4, rama, línea base, estado de partida
Fase 1  contrato-shared ── T1 → T2 → T3        documentacion ── T4 HT-16 (en paralelo)
Fase 2  backend-api ── T5 → T6 → T7 → T8 → T9 → T10 → T11
Fase 3  frontend-spa ── T12 → T13 → T14 → T15 → T16 → T17
Fase 4  verificador ── T18 → T19 · revisor ── T20 → dueños corrigen → revisor confirma (máx. 1 ronda)
Fase 5  sesión principal ── T21 DoD, T22 capturas y PUNTO DE CONTROL ·
        documentacion ── T23 · sesión principal ── T24 informe y commit
```

**La SPA va después del backend.** Las pantallas de la Fase 3 consumen los endpoints, los códigos de
error y las formas reales de la Fase 2; la sesión principal pasa a `frontend-spa` el resumen exacto
al cerrar la Fase 2. HT-16 (T4) es solo documentación y no depende de nadie, así que corre en la
Fase 1.

**Traspasos.** Cada agente cierra su tarea con una nota en `.superpowers/sdd/sprint-s5-plan/<agente>.md`
(qué hizo, salida resumida de sus comandos, desvíos con su motivo y lo que necesita el siguiente) y
responde a la sesión principal con un resumen corto.

**Fronteras.** Si un agente necesita un cambio fuera de su carpeta, no lo hace: lo anota y la sesión
principal relanza al dueño. Si el `verificador` encuentra un bug de producto, deja la prueba en rojo
como evidencia.

**Frenos.** Si una decisión de la sección 2 deja de ser viable, la sesión principal se detiene e
invoca `grilling` con su recomendación. Los agentes no reabren decisiones.

### 0.2 Skills por tarea

| Momento                        | Agente            | Skills                                                                                                                   |
| ------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Todo el sprint                 | sesión principal  | `subagent-driven-development`, `ponytail`, `verification-before-completion`; `grilling` solo como freno                  |
| Toda lógica nueva              | todos             | `test-driven-development`                                                                                                |
| Fallo o prueba roja inesperada | todos             | `systematic-debugging`                                                                                                   |
| T1–T3 esquemas                 | `contrato-shared` | `zod`, `typescript-advanced-types`, `vitest`                                                                             |
| T4 y T23 documentación         | `documentacion`   | `humanizador-es` al final de cada documento                                                                              |
| T5 migración y backfill        | `backend-api`     | `prisma-cli`, `prisma-client-api`                                                                                        |
| T6–T11 API                     | `backend-api`     | `nestjs-best-practices`, `nodejs-best-practices`, `nodejs-backend-patterns`, `prisma-client-api`                         |
| T12–T17 SPA                    | `frontend-spa`    | `react-best-practices`, `react-hook-form`, `zod`, `shadcn`, `impeccable` (`harden`, `polish`), `accessibility`, `vitest` |
| T18 e2e del API                | `verificador`     | `nestjs-best-practices`, `prisma-client-api`                                                                             |
| T19 Playwright                 | `verificador`     | `playwright-best-practices`                                                                                              |
| T20 revisión                   | `revisor`         | `ponytail-review`, `accessibility`, `impeccable` (`audit`)                                                               |

**`impeccable`.** Manda `apps/web/DESIGN.md` (Claroscuro, aplicado en S4). Toda pantalla nueva usa
`EstadoInsignia`, los botones y campos de S4 y la regla del oro (una acción dorada por vista). El
prototipo (`docs/diseno/prototipo/index.html`) es referencia; si discrepa con DESIGN.md, gana
DESIGN.md.

**Sin worktrees ni commits por tarea.** Ledger y capturas en `.superpowers/sdd/sprint-s5-plan/`
(ignorado por git).

## 1. Alcance

### HU-24 — Ver estado de anclaje (RF-29)

- Cada estado se muestra con una insignia de color y texto.
- El txHash enlaza a amoy.polygonscan.com.
- Se muestran las fechas de envío y de anclaje.
- Mientras está pendiente, el estado se actualiza cada 10 s.

### HU-25 — Recibo imprimible con QR (RF-30)

- El recibo muestra póliza, monto, fecha, código y estado de anclaje.
- El QR apunta a `/recibos/verificar/:codigo`, que exige iniciar sesión.
- Se imprime o se guarda como PDF desde el navegador.
- No se muestran la sal ni datos internos.

### HU-26 — Reintentar recibo fallido (RF-31)

- Solo el ADMIN puede reintentar y solo recibos FALLIDOS.
- El recibo vuelve a PENDIENTE_ANCLAJE y se encola de nuevo.
- Se registra quién ejecutó el reintento.

### HT-16 — Protección de datos y respuesta a incidentes (RNF-43)

- Plan de respuesta a incidentes con roles, contención, rotación de secretos y notificación a la
  Superintendencia por el SISPDP en un máximo de 5 días.
- Plantilla de comunicación al titular: naturaleza de la vulneración, fecha, medidas tomadas y
  recomendaciones.
- Registro de actividades de tratamiento y encargados (servidor, correo y proveedor RPC), con el
  plazo de 2 días para que un encargado avise al responsable.
- Insumos técnicos de la evaluación de impacto: datos, flujos y controles.

### HU-28 — Verificar autenticidad del recibo (RF-33, RF-34)

- Exige sesión activa; si se escanea el QR sin sesión, se pide iniciar sesión y luego se muestra el
  resultado.
- Se recalcula el hash y se compara con el registrado en el contrato.
- Resultados: Auténtico, No coincide, En proceso, Anulado y No encontrado.
- Se muestra el enlace a la transacción en el explorador.
- El cliente solo verifica sus propios recibos; el de otro cliente se informa como No encontrado
  (RN-07).
- Máximo 30 consultas por minuto por usuario.

### HU-36 — Aplicar pagos a cuotas (RF-41)

- El pago validado se aplica a las cuotas pendientes en orden de vencimiento (RN-13).
- Una cuota cubierta en parte queda PARCIAL; una cubierta en su totalidad queda PAGADA (D11 precisa
  el caso de una cuota ya vencida).
- El detalle de la aplicación se muestra en el pago y en la póliza.

### HU-20 — Listar pagos (RF-21)

- Filtros por estado, rango de fechas, póliza y cliente.
- Los pagos por validar aparecen primero.
- Listado paginado con el total del filtro.

### HU-38 — Cuotas por vencer y vencidas (RF-43)

- Cuotas que vencen en los próximos 7 días y cuotas vencidas.
- Filtros por cliente, aseguradora y rango de fechas.
- Cada fila: cliente, póliza, cuota, valor, fecha de vencimiento y días de atraso.

### HU-51 — Cobertura y condiciones (RF-57)

- Cobertura y condiciones como texto de hasta 2 000 caracteres cada una.
- Ambos campos se capturan al registrar y al editar la póliza.
- El detalle de la póliza muestra cobertura, condiciones y vigencia.
- Catálogo inicial de ramos de Oasis: Vida, Asistencia médica, Vehículos, Equipos electrónicos,
  Aéreo (drones) y Equipos y maquinaria; los demás se desactivan.

### Fuera de alcance (no implementar)

- Lista de recibos del cliente y saldo en el portal (HU-29 y HU-15, S6): en S5 el cliente llega a su
  recibo imprimible desde el pago validado de su panel.
- Anulación con motivo (HU-27, S6): el resultado Anulado ya existe para los recibos anulados hoy.
- Correo de validación con el enlace del recibo (HU-39) y Mailpit (HT-12): S6.
- PDF descargable generado en el servidor (HU-41, S9): en S5 se imprime desde el navegador.
- Contadores del límite en Redis (HT-08, S8).

## 2. Decisiones tomadas (no reabrir)

| #   | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Motivo                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Arrastre de S4 primero.** T0 lee `docs/sprints/sprint-s4.md` §Deuda: lo que S4 no cerró se ejecuta **antes** de la Fase 1 con su tarea original del plan de S4 y su agente, y se verifica con el cierre de la fase de S4 que corresponda. Si el arrastre incluye historias completas (no solo tareas de contingencia de S4 §16), la sesión principal se detiene e invoca `grilling` con una propuesta de orden.                                                                                                                                                                                                                                                         | La holgura de S5 cubre el riesgo de S4; no se adelantan historias.                                                                            |
| D2  | **Códigos de verificación renombrados** en `@oasis/shared`: `ESTADOS_VERIFICACION = ['AUTENTICO', 'NO_COINCIDE', 'EN_PROCESO', 'ANULADO', 'NO_ENCONTRADO']`. Reglas en `VerificarReciboUseCase`, en este orden: recibo inexistente o ajeno (D3) → NO_ENCONTRADO; recibo ANULADO en la base o anulado en el contrato → ANULADO; no registrado en el contrato (PENDIENTE_ANCLAJE, ENVIADO o FALLIDO) → EN_PROCESO; hash distinto → NO_COINCIDE; si no → AUTENTICO.                                                                                                                                                                                                          | 1:1 con el criterio de HU-28; ningún consumidor externo usa aún los códigos.                                                                  |
| D3  | **CLIENTE en la verificación** (RN-07): `GET /recibos/:codigo/verificacion` admite `ADMIN`, `OPERADOR` y `CLIENTE` y se mueve a un `VerificacionController` propio con `@Roles` en el handler. Para el CLIENTE, el caso de uso recibe `clienteId` y, si el recibo es de otro cliente, responde **exactamente** lo mismo que un código inexistente: mismo cuerpo, mismo estado HTTP 200 y **sin consultar la cadena**, para que tampoco el tiempo de respuesta lo delate.                                                                                                                                                                                                  | Un recibo ajeno no debe poder distinguirse de uno inexistente.                                                                                |
| D4  | **Límite de 30/min por usuario**: guard propio `LimitePorUsuarioGuard` aplicado con `@UseGuards` en el handler (corre **después** de los guards globales, así que conoce `req.user`), con el `ThrottlerStorage` de `@nestjs/throttler` en memoria y clave `verificacion:<usuarioId>`; al pasarse, 429 con el formato único, `code: 'DEMASIADAS_CONSULTAS'` y `Retry-After`. `ponytail:` techo: una sola instancia del API; salida: storage de Redis en HT-08 (S8).                                                                                                                                                                                                        | El `ThrottlerGuard` global corre antes de la autenticación y solo conoce la IP.                                                               |
| D5  | **Lenguaje sin tecnicismos** (DESIGN.md, PRODUCT.md): el cliente lee «Auténtico: este recibo coincide con el registro inmutable», nunca «hash» ni «blockchain». El personal ve además los hashes, el contrato y el bloque en «Detalles técnicos», plegado por defecto.                                                                                                                                                                                                                                                                                                                                                                                                    | The No Hype Rule.                                                                                                                             |
| D6  | **`payloadCanonico` y la sal fuera de la API**: se retiran de `reciboDetalleSchema` y de la respuesta de `GET /recibos/:id`. El payload sigue en la base para la verificación.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | HU-25: no mostrar datos internos.                                                                                                             |
| D7  | **Recibo imprimible**: `reciboImprimibleSchema` = `{ codigo, estadoAnclaje, emitidoEn, ancladoEn, explorerUrl, pago: { monto, fechaPago, metodo, referencia }, poliza: { numero, ramo, aseguradora }, cliente: { nombre, identificacionEnmascarada } }`. La identificación se enmascara dejando visibles los 4 últimos caracteres (`******4065`). Endpoints: `GET /recibos/:id/imprimible` (ADMIN, OPERADOR) y `GET /mis-recibos/:id/imprimible` (CLIENTE; recibo ajeno → 404). `/mis-pagos` suma `recibo: { id, codigo } \| null`.                                                                                                                                       | Un recibo dice quién pagó; enmascarar cubre la minimización (grilling del 24/10).                                                             |
| D8  | **Vista imprimible en la SPA**: `/recibos/:id/imprimir` (personal) y `/portal/recibos/:id` (cliente), con `@media print` (oculta navegación y botones, A4 vertical, márgenes de 15 mm, colores de estado con `print-color-adjust: exact`) y el botón «Imprimir o guardar PDF» (`window.print()`). El QR (`qrcode.react`) codifica `${window.location.origin}/recibos/verificar/${codigo}`, con el código impreso debajo.                                                                                                                                                                                                                                                  | Criterio de HU-25; el PDF de servidor es HU-41 (S9).                                                                                          |
| D9  | **HU-24**: `refetchInterval` de 10 000 ms en `RecibosPage` y `ReciboDetallePage` mientras algún recibo visible esté PENDIENTE_ANCLAJE o ENVIADO (función que devuelve `false` en otro caso; sustituye los sondeos de 3 y 5 s). El detalle muestra la línea de tiempo del anclaje (DESIGN.md): creado, enviado, anclado (o fallido, con `ultimoError` resumido solo para el personal) y el enlace «Ver transacción» a `EXPLORER_BASE_URL/tx/<txHash>`.                                                                                                                                                                                                                     | Criterio literal; sin sondeo cuando ya no hace falta.                                                                                         |
| D10 | **HU-26**: botón «Reintentar anclaje» (secundario) solo para ADMIN y solo con FALLIDO, con confirmación. El endpoint ya existe y se audita como `REINTENTAR`; el detalle muestra «Último reintento: <usuario>, <fecha>» leyendo la bitácora (`GET /auditoria?entidad=Recibo&entidadId=…&accion=REINTENTAR&pageSize=1`, solo ADMIN).                                                                                                                                                                                                                                                                                                                                       | El «quién» queda visible sin columnas nuevas.                                                                                                 |
| D11 | **Aplicación de pagos (HU-36)**: función pura `aplicarPagoACuotas(cuotas, monto)` en `modules/pagos/domain/aplicacion-pago.ts`, en centavos enteros. Recorre las cuotas no PAGADAS por `fechaVencimiento` y luego `numero`; cada una recibe `min(restante, valor − valorPagado)`. Estado resultante: cubierta → PAGADA; cubierta en parte → PARCIAL **si aún no vence**; una cuota **VENCIDA** cubierta en parte **sigue VENCIDA** hasta cubrirse, y la SPA la muestra como «Vencida · abonado $X». El informe registra esta lectura del criterio «parcial → PARCIAL».                                                                                                    | El cron de S4 vuelve VENCIDA toda cuota PARCIAL con fecha pasada: dejarla PARCIAL haría parpadear la mora (RN-14, RN-16; grilling del 24/10). |
| D12 | La aplicación ocurre **dentro** de `validarYCrearRecibo`: en la misma `$transaction`, `SELECT … FROM "Cuota" WHERE "polizaId" = $1 FOR UPDATE` (`$queryRaw`); comprobación definitiva de RN-02 con las cuotas bloqueadas (pendiente total ≥ monto, si no → 422 `MONTO_SUPERA_SALDO`); `AplicacionPago` por cada cuota tocada y actualización de `valorPagado` y `estado`. Cierra la carrera de dos validaciones simultáneas que S4 dejó marcada (S4 D7); se retira ese `ponytail:`.                                                                                                                                                                                       | Exactitud del saldo con concurrencia.                                                                                                         |
| D13 | **Invariante**: por póliza, `Σ Cuota.valorPagado = Σ pagos VALIDADOS`. Script idempotente `apps/api/prisma/backfill-aplicaciones.ts` (pagos VALIDADOS sin aplicaciones, en orden de `validadoEn`, con la misma función de dominio) para los datos validados en S4; se ejecuta una vez en desarrollo y se documenta en `docs/despliegue.md`.                                                                                                                                                                                                                                                                                                                               | Los pagos validados en S4 no se aplicaron.                                                                                                    |
| D14 | **Detalle de la aplicación**: `GET /pagos/:id` (nuevo, ADMIN y OPERADOR) devuelve el pago con `aplicaciones: [{ cuotaNumero, monto }]` y `recibo: { id, codigo, estado } \| null`; `GET /polizas/:id/cuotas` suma por cuota `aplicaciones: [{ pagoId, monto, fecha }]`. La SPA muestra el detalle del pago en un `Sheet` desde `PagosPage` y las aplicaciones en el detalle de la póliza (D17).                                                                                                                                                                                                                                                                           | Criterio «se muestra en el pago y en la póliza».                                                                                              |
| D15 | **HU-20**: `listarPagosQuerySchema` suma `clienteId`; orden `[{ estado: 'asc' }, { fechaPago: 'desc' }, { createdAt: 'desc' }]` (PostgreSQL ordena los enum por su declaración: REGISTRADO, VALIDADO, RECHAZADO; una prueba lo fija). Los filtros de `PagosPage` (estado, desde, hasta, póliza con `SelectorPoliza`, cliente con `SelectorCliente`) se sincronizan con la URL (`useSearchParams`) para que HU-30 enlace listados filtrados. El total del filtro aparece sobre la tabla («128 pagos»).                                                                                                                                                                     | Criterio literal; HU-30 (S8) depende de la URL.                                                                                               |
| D16 | **HU-38**: `GET /cuotas` (ADMIN y OPERADOR) con `vista=POR_VENCER\|VENCIDAS\|TODAS` (por defecto `TODAS` = las dos primeras), `clienteId`, `aseguradoraId`, `desde`, `hasta` (sobre `fechaVencimiento`) y paginación. POR_VENCER: no PAGADA y `hoy ≤ fechaVencimiento ≤ hoy + 7`; VENCIDAS: no PAGADA y `fechaVencimiento < hoy` (no depende de que el cron haya corrido). Fila: cliente, póliza, número de cuota, valor, pendiente (`valor − valorPagado`), vencimiento, `diasAtraso` (0 si aún no vence) y estado. Orden por vencimiento ascendente. Una sola consulta con `include`. Página «Cartera» (`/cartera`) en el riel para ADMIN y OPERADOR.                   | Criterio literal y DESIGN.md (ítem «Cartera»).                                                                                                |
| D17 | **HU-51**: columnas `Poliza.cobertura` y `Poliza.condiciones` (`TEXT`, opcionales); `crearPolizaSchema`/`actualizarPolizaSchema` con `z.string().trim().max(2000).optional()` (vacío tras `trim` → `undefined`). Página nueva `/polizas/:id` (`PolizaDetallePage`): datos, vigencia, cobertura, condiciones, plan de cuotas con sus aplicaciones (D14) y pagos de la póliza. Formularios con `textarea` y contador «1 234 / 2 000».                                                                                                                                                                                                                                       | Criterio del detalle; HU-10 y HU-15 (S6) reutilizan la página.                                                                                |
| D18 | **Ramos de Oasis** como dato de referencia en la **migración** (`INSERT … ON CONFLICT (codigo) DO UPDATE`): `VIDA` Vida, `ASISTENCIA_MEDICA` Asistencia médica, `VEHICULOS` Vehículos, `EQUIPOS_ELECTRONICOS` Equipos electrónicos, `AEREO_DRONES` Aéreo (drones), `EQUIPOS_MAQUINARIA` Equipos y maquinaria; `UPDATE … SET activo = false` de `SALUD`, `INCENDIO` y `FIANZAS`. Las pólizas existentes con esos ramos se conservan (RN-09). El seed usa los mismos códigos.                                                                                                                                                                                               | Producción no corre el seed; el catálogo debe existir igual (backlog §contexto y HU-51).                                                      |
| D19 | **HT-16** en `docs/proteccion-datos/` con la política de tratamiento **v1.0** como borrador para que Oasis la revise antes del 16/11 (HU-33 la publica en S6). Las referencias legales citan la LOPDP (Registro Oficial Suplemento 459, 26/05/2021) y su Reglamento; la redacción jurídica final la valida Oasis.                                                                                                                                                                                                                                                                                                                                                         | Acuerdo del grilling del 23/10.                                                                                                               |
| D20 | **Documentos de HT-16:** `plan-respuesta-incidentes.md`, `plantilla-comunicacion-titular.md`, `registro-actividades-tratamiento.md` (finalidades, bases de legitimación, categorías de datos, plazos de conservación, destinatarios), `encargados.md` (VPS, Brevo, proveedor RPC de Polygon, Backblaze B2; plazo de 2 días para avisar al responsable), `insumos-eipd.md` (inventario de datos, diagrama de flujos con el C4 de la arquitectura, controles técnicos con su evidencia: ADR-004, ADR-006, ADR-015, ADR-016, HT-08) y `politica-tratamiento-datos-v1.0.md`.                                                                                                  | Criterios literales; enlazan, no repiten.                                                                                                     |
| D21 | **Punto de control visual** antes del único commit (T22): capturas a 1280 y 360 px de las pantallas nuevas o cambiadas, y espera del «aprobado» del desarrollador.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Grilling del 24/10: aplica a todo sprint con pantallas nuevas.                                                                                |
| D22 | **Horas:** el informe reporta solo las horas de backlog por historia (sección 13); no se estiman ni se reportan horas reales.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Grilling del 24/10.                                                                                                                           |
| D23 | **Pruebas:** TDD de `aplicarPagoACuotas`, de la verificación (cinco resultados y RN-07), del guard de límite, de cartera y de `enmascararIdentificacion`; e2e `verificacion`, `recibos`, `cuotas` ampliado (aplicación, concurrencia y cartera), `pagos` ampliado (HU-20) y `polizas` ampliado (HU-51); Vitest de las páginas y componentes nuevos; Playwright `recibos-verificacion.spec.ts`, `cartera.spec.ts` y `diseno.spec.ts` extendido. Solo Chromium.                                                                                                                                                                                                             | Evidencia por criterio (sección 12).                                                                                                          |
| D24 | **Vista previa de la aplicación del pago** (de la Etapa C de S4 ([sprint-s4-etapa-c-plan.md](sprint-s4-etapa-c-plan.md))): `aplicarPagoACuotas` vive en `@oasis/shared/dominio` (junto a `proponerPlanCuotas`) en lugar de `modules/pagos/domain/`; el API la importa y la regla de D11 no cambia. La SPA la usa con `GET /polizas/:id/cuotas` para anticipar el efecto: en `ValidarPagoDialog`, «Al validar: la cuota 1 queda Pagada y la cuota 2 recibe $40,00 (Pago parcial)»; en `FormularioPago`, la misma frase en condicional bajo el monto («Este pago cubriría…»), solo informativa. Si el monto supera lo pendiente, el aviso de RN-02 aparece antes de enviar. | El operador sabe qué va a pasar antes de confirmar; una sola implementación de la regla para el API y la SPA.                                 |
| D25 | **Componentes de la Etapa C de S4 reutilizados**: `LineaTiempoAnclaje` (D9) y `SeguimientoPago` comparten los pasos, que se extraen a `components/LineaTiempo.tsx` (segundo uso: ahora sí se justifica); `CarteraPage` y `PolizaDetallePage` usan `RamoEtiqueta` y `LeyendaEstados` (dominio `cuota`); las descripciones de `estados.ts` pasan a los códigos de verificación de D2 sin cambiar su texto, y D5 las toma como base. `PagosPage` ya lee `estado` de la URL (Etapa C, D7): D15 extiende ese patrón a los demás filtros.                                                                                                                                       | Un solo vocabulario y un solo diseño de línea de tiempo.                                                                                      |

## 3. Estado de partida (a confirmar en T0)

- **S4 entregó** (según su plan): Claroscuro con `EstadoInsignia`, riel y barra inferior; pagos con
  RN-02, referencia única y Débito bancario; `rechazadoPorId`; plan de cuotas con cuota única por
  defecto; vencimiento diario y `enMora`; saldo de la operadora; CI con el job `seguridad`. El
  informe `sprint-s4.md` dice qué quedó pendiente (D1).
- **Recibos:** `GET /recibos`, `GET /recibos/:id` (con `payloadCanonico`),
  `GET /recibos/:codigo/verificacion` (solo ADMIN y OPERADOR, códigos `VALIDO`, `NO_ANCLADO`,
  `HASH_INCONSISTENTE`, `ANULADO`, `NO_ENCONTRADO`), `POST :id/reintentar` (solo ADMIN, auditado) y
  `POST :id/anular`. `TarjetaVerificacion.tsx` ya genera el QR hacia `/recibos/verificar/:codigo`.
  El sondeo actual es de 3 s y 5 s.
- **Retorno tras el login:** `router.tsx` ya guarda `desde` en la ubicación y, al autenticarse,
  navega a `desde ?? '/'`; las rutas `/recibos/verificar` y `/recibos/verificar/:codigo` existen.
  T14 solo abre esas rutas al CLIENTE y lo prueba.
- **Pagos:** `GET /pagos` sin `clienteId` y con orden por `fechaPago desc`; no existe
  `GET /pagos/:id`. `validarYCrearRecibo` no aplica a cuotas.
- **Cuotas:** `Cuota.valorPagado` siempre 0; `AplicacionPago` sin uso.
- **Ramos del seed:** VIDA, SALUD, VEHICULOS, INCENDIO, FIANZAS. `CrearPolizaUseCase` ya responde
  422 `RAMO_INVALIDO` si el ramo no está activo.
- **Límite de tasa:** `ThrottlerModule.forRootAsync` en `AppModule` con el guard global por IP.
- **Pruebas que se rompen** (y se actualizan, no se borran): las que esperan `VALIDO`, `NO_ANCLADO`
  o `HASH_INCONSISTENTE` (`outbox.use-cases.spec.ts`, `flujo-anclaje`, `VerificacionPage`,
  `TarjetaVerificacion`, `components/estados.ts` de S4), las que leen `payloadCanonico` del detalle,
  la matriz de `acceso-por-rol` (CLIENTE en la verificación, rutas nuevas) y las que crean pólizas con
  ramos que ahora quedan inactivos.

## 4. Fase 0 — Preparación (sesión principal)

### T0. Arrastre de S4, rama, línea base y estado de partida

1. **Arrastre (D1):** lee `docs/sprints/sprint-s4.md` y lista en el ledger lo no cerrado. Ejecútalo
   con las tareas del plan de S4 y sus agentes **antes** de la Fase 1.
2. **Rama** `feat/sprint-s5-verificacion-cartera` desde `main` con S4 fusionado. Si `main` tiene
   cambios sin commit del desarrollador, detente y pregunta.
3. **Línea base:** `pnpm install --frozen-lockfile`, `pnpm -r build`, `pnpm -r typecheck`,
   `pnpm test`; totales en `.superpowers/sdd/sprint-s5-plan/principal.md`. Si algo está rojo,
   detente.
4. **Estado de partida:** confirma cada punto de la sección 3 en el código; si algo difiere, anótalo
   en el ledger con su efecto en las tareas.

## 5. Fase 1 — Contratos y documentación (en paralelo)

### T1. Verificación y recibos (`contrato-shared`, HU-24, HU-25, HU-28; TDD)

- **Archivos:** `constants/estados.ts`, `schemas/recibo.schema.ts`, `schemas/pago.schema.ts`
  (`pagoClienteSchema`), `validacion/enmascarar.ts` (nuevo), `index.ts` y sus pruebas.
- **Cambios:**
  - `ESTADOS_VERIFICACION` según D2.
  - `reciboDetalleSchema` sin `payloadCanonico` ni `sal` (D6), en modo estricto.
  - `reciboImprimibleSchema` (D7).
  - `pagoClienteSchema` (el de `/mis-pagos`) suma `recibo: { id, codigo } | null`.
  - `enmascararIdentificacion(id)`: deja visibles los 4 últimos caracteres y reemplaza el resto por
    `*`; con menos de 5 caracteres, todo enmascarado.
- **Pruebas primero:** los cinco códigos exactos; el detalle estricto rechaza `payloadCanonico`;
  enmascarado de una cédula (`1710034065` → `******4065`), un RUC de 13 dígitos, un pasaporte
  alfanumérico y una cadena de 4 caracteres.

### T2. Pagos, cuotas y cartera (`contrato-shared`, HU-20, HU-36, HU-38; TDD)

- **Archivos:** `schemas/pago.schema.ts`, `schemas/cuota.schema.ts`, `schemas/cartera.schema.ts`
  (nuevo), `constants/estados.ts` e `index.ts`.
- **Cambios:**
  - `listarPagosQuerySchema` suma `clienteId` (uuid opcional, D15).
  - `pagoDetalleSchema` = `pagoSchema` + `aplicaciones: [{ cuotaNumero, monto }]` + `recibo` (D14).
  - `cuotaSchema` suma `aplicaciones: [{ pagoId, monto, fecha }]` (D14).
  - `VISTAS_CARTERA = ['POR_VENCER', 'VENCIDAS', 'TODAS'] as const`, `listarCarteraQuerySchema`
    (vista, clienteId, aseguradoraId, desde, hasta, page, pageSize) y `filaCarteraSchema` (D16).
  - `aplicarPagoACuotas` se mueve a `dominio/aplicacion-pago.ts` y se exporta (D24); sus pruebas
    viajan con ella.
- **Pruebas primero:** `desde > hasta` → error en ambos listados; `vista` inválida → error; `vista`
  ausente → `TODAS`.

### T3. Póliza (`contrato-shared`, HU-51; TDD)

- `cobertura` y `condiciones` en `crearPolizaSchema`, `actualizarPolizaSchema` y `polizaSchema`
  (D17); `polizaDetalleSchema` solo si la respuesta del detalle difiere del listado.
- **Pruebas primero:** 2 000 caracteres → válido; 2 001 → error con `path` al campo; vacío o solo
  espacios → `undefined`.

### T4. HT-16 (`documentacion`)

- Los seis documentos de D20 en `docs/proteccion-datos/`, cortos y enlazados entre sí y con la
  arquitectura.
- **Plan de respuesta a incidentes:**
  - clasificación (confidencialidad, integridad, disponibilidad) y severidad;
  - roles: responsable (gerencia de Oasis), responsable técnico (el desarrollador) y encargado
    afectado;
  - contención por escenario: fuga de `OPERATOR_PRIVATE_KEY` → `rotar-operadora.ts --pausar` (HT-15);
    fuga de los secretos JWT → rotación y `cerrarTodas`; fuga de la base → rotación de credenciales y
    evaluación de titulares afectados; indisponibilidad del VPS → restauración (HT-06, S7);
  - rotación de secretos: tabla con cada variable de `.env.example` y `.env.worker.example`, dónde se
    rota y qué se reinicia;
  - notificación a la Superintendencia por el SISPDP en máximo 5 días y al titular sin dilación
    indebida (plantilla);
  - registro del incidente y lecciones aprendidas.
- **Política v1.0:** responsable, finalidades, datos tratados, base legal, derechos (acceso,
  rectificación, eliminación, oposición, portabilidad) y cómo ejercerlos (HU-53, S6), conservación,
  encargados, transferencias (ninguna internacional salvo los encargados listados), seguridad y
  contacto. Marca visible «Borrador para revisión de Oasis Seguros».
- `docs/README.md` (o el índice que corresponda) enlaza la carpeta.

**Cierre de la Fase 1 (sesión principal):** `pnpm --filter @oasis/shared build` y `test`; borrar
`apps/web/node_modules/.vite`; resumen de las notas para la Fase 2.

## 6. Fase 2 — API (`backend-api`)

Una línea de trabajo, en orden: T5 → T11. Al cerrar, la sesión principal pasa a `frontend-spa` el
resumen exacto de rutas, códigos de error y respuestas.

### T5. Migración y backfill (`backend-api`, HU-51, HU-36)

- **Archivos:** `prisma/schema.prisma`, `prisma/migrations/<fecha>_cobertura_ramos_s5/`,
  `prisma/seed.ts`, `prisma/backfill-aplicaciones.ts` (nuevo).
- **Migración:** columnas `cobertura` y `condiciones` (D17) y el catálogo de ramos (D18) con SQL
  idempotente.
- **Seed:** los mismos códigos de ramo; la póliza de ejemplo usa `VEHICULOS`; sigue idempotente.
- **Backfill (D13):** ejecutable con `pnpm --filter @oasis/api exec tsx prisma/backfill-aplicaciones.ts`;
  reutiliza `aplicarPagoACuotas` (T8) e imprime cuántos pagos aplicó. Se escribe después de T8 si
  hace falta la función, pero vive en esta tarea.
- **Verificación:** `prisma migrate dev` sobre la base con datos de S4; `seed` dos veces; backfill
  dos veces (la segunda aplica 0); `prisma migrate diff` sin deriva.

### T6. Verificación del cliente y límite (`backend-api`, HU-28; TDD)

- **Archivos:** `modules/recibos/application/use-cases/verificar-recibo.use-case.ts` (+spec),
  `application/ports/recibos.repository.port.ts` (`buscarPorCodigo` devuelve también el `clienteId`
  de la póliza), `presentation/http/verificacion.controller.ts` (nuevo), `recibos.controller.ts`
  (retira la verificación), `common/throttle/limite-por-usuario.guard.ts` (+spec, nuevo),
  `config/throttle.ts`, `recibos.module.ts`.
- **Comportamiento:** D2, D3 y D4. La respuesta para el CLIENTE omite `hashOnchain` y
  `contractAddress` y conserva `explorerUrl`.
- **Casos borde:** recibo FALLIDO → EN_PROCESO; recibo ANULADO en la base pero aún registrado en la
  cadena → ANULADO; RPC caído → 502 con el formato único (no un resultado falso); CLIENTE sin
  `clienteId` asociado → NO_ENCONTRADO.
- **Pruebas primero:** los cinco resultados con dobles de los puertos; CLIENTE con recibo ajeno →
  respuesta igual (deep equal salvo `codigo` y `verificadoEn`) a la de un código inexistente y sin
  llamada a `registro.obtenerEnCadena`; la 31.ª consulta en 60 s del mismo usuario → 429 con
  `Retry-After`; otro usuario no se ve afectado.

**Ejemplo (orientativo):**

```ts
@Injectable()
export class LimitePorUsuarioGuard implements CanActivate {
  constructor(private readonly almacen: ThrottlerStorage) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const req = contexto.switchToHttp().getRequest<{ user: UsuarioAutenticado }>();
    const clave = `verificacion:${req.user.sub}`;
    const { isBlocked, timeToBlockExpire } = await this.almacen.increment(
      clave,
      60_000,
      30,
      60_000,
      'verificacion',
    );
    if (isBlocked) throw new DemasiadasConsultasError(timeToBlockExpire);
    return true;
  }
}
```

### T7. Imprimible, detalle sin payload y estado (`backend-api`, HU-24, HU-25, HU-26; TDD)

- **Archivos:** `modules/recibos/…` (caso de uso `ObtenerReciboImprimibleUseCase`, repositorio,
  `recibos.controller.ts`, `mis-recibos.controller.ts` nuevo con `@Roles('CLIENTE')`),
  `modules/pagos/…` (`/mis-pagos` con `recibo`).
- **Comportamiento:** `GET /recibos/:id` sin `payloadCanonico` ni `sal` (D6); `GET
/recibos/:id/imprimible` y `GET /mis-recibos/:id/imprimible` (D7) con un solo `include` (pago →
  póliza → ramo, aseguradora y cliente); `enmascararIdentificacion` de `@oasis/shared`; el detalle
  conserva `enviadoEn`, `ancladoEn`, `txHash` y `explorerUrl` (HU-24).
- **Pruebas primero:** el imprimible no contiene `sal`, `payloadCanonico`, `idOnchain`, `intentos`
  ni `ultimoError` (recorrido recursivo de claves); recibo ajeno del CLIENTE → 404; identificación
  enmascarada; `/mis-pagos` trae `recibo` solo en los VALIDADOS.

### T8. Aplicación de pagos a cuotas (`backend-api`, HU-36; TDD)

- **D24:** la función pura se escribe en `@oasis/shared` (T2) y aquí solo se importa.
- **Archivos:** `modules/pagos/domain/aplicacion-pago.ts` (+spec), `prisma-pagos.repository.ts`
  (`validarYCrearRecibo` con D12), `pagos.repository.port.ts` (`buscarDetalle`),
  `pagos.controller.ts` (`GET /pagos/:id`), caso de uso `ObtenerPagoUseCase`, repositorio de pólizas
  (aplicaciones en `GET /polizas/:id/cuotas`).
- **Dominio (D11):** entrada `[{ id, numero, valor, valorPagado, fechaVencimiento, estado }]` y
  `monto`; salida `{ aplicaciones: [{ cuotaId, monto }], cuotas: [{ id, valorPagado, estado }] }`.
- **Persistencia (D12):** bloqueo, comprobación de RN-02 con lo bloqueado, `createMany` de
  `AplicacionPago` y `update` por cuota tocada, todo en la `$transaction` existente. Se retira el
  `ponytail:` de S4 D7.
- **Pruebas primero (dominio):** pago de 50 sobre 33,33/33,33/33,34 → la primera PAGADA y 16,67 a la
  segunda (PARCIAL); pago exacto del total → todas PAGADAS; cuota VENCIDA cubierta en parte →
  sigue VENCIDA con su `valorPagado`; orden por vencimiento aunque los números estén desordenados;
  monto mayor que lo pendiente → error (no debería ocurrir tras RN-02; el dominio lo impide igual).
- **Pruebas de integración** (spec del repositorio contra la base de pruebas, o en T18): dos
  validaciones simultáneas sobre la misma póliza que juntas superan el saldo → una 200 y otra 422
  `MONTO_SUPERA_SALDO`; el invariante D13 se cumple tras cada validación.

**Ejemplo (orientativo):**

```ts
export function aplicarPagoACuotas(cuotas: CuotaAplicable[], monto: string) {
  let restante = aCentavos(monto);
  const aplicaciones: { cuotaId: string; monto: string }[] = [];
  const resultado: { id: string; valorPagado: string; estado: EstadoCuota }[] = [];
  for (const c of [...cuotas]
    .filter((c) => c.estado !== 'PAGADA')
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento) || a.numero - b.numero)) {
    if (restante === 0) break;
    const pendiente = aCentavos(c.valor) - aCentavos(c.valorPagado);
    const aplicado = Math.min(restante, pendiente);
    restante -= aplicado;
    const pagado = aCentavos(c.valorPagado) + aplicado;
    const estado =
      pagado === aCentavos(c.valor) ? 'PAGADA' : c.estado === 'VENCIDA' ? 'VENCIDA' : 'PARCIAL';
    aplicaciones.push({ cuotaId: c.id, monto: aMonto(aplicado) });
    resultado.push({ id: c.id, valorPagado: aMonto(pagado), estado });
  }
  if (restante > 0) throw new MontoSuperaSaldoError();
  return { aplicaciones, cuotas: resultado };
}
```

```ts
// Dentro de la $transaction de validarYCrearRecibo:
const cuotas = await tx.$queryRaw<CuotaFila[]>`
  SELECT id, numero, valor, "valorPagado", "fechaVencimiento", estado
  FROM "Cuota" WHERE "polizaId" = ${polizaId}::uuid FOR UPDATE`;
```

### T9. Listado de pagos (`backend-api`, HU-20; TDD)

- `clienteId` (a través de `poliza.clienteId`) y el orden de D15 en `listar`; `meta.total` ya
  existe.
- **Pruebas primero:** con pagos en los tres estados, la primera página empieza por los REGISTRADOS;
  el filtro de cliente no devuelve pagos de otro cliente; el total coincide con el filtro; la
  paginación conserva el orden entre páginas.

### T10. Cartera (`backend-api`, HU-38; TDD)

- **Archivos:** `modules/polizas/application/use-cases/listar-cartera.use-case.ts` (+spec),
  repositorio de pólizas (`listarCartera`), `cuotas.controller.ts` (`GET /cuotas`).
- **Comportamiento:** D16, con `hoy` de `ClockPort` en Guayaquil.
- **Pruebas primero:** con reloj fijo, una cuota que vence en 7 días entra en POR_VENCER y una en 8
  no; una vencida hace 3 días tiene `diasAtraso = 3` aunque su estado siga PENDIENTE (cron no
  corrido); PAGADA nunca aparece; PARCIAL vencida aparece con su pendiente; filtros de aseguradora,
  cliente y fechas.

### T11. Cobertura de rutas y cierre del carril (`backend-api`)

- `auditoria-cobertura.spec.ts` y `roles-cobertura.spec.ts` incluyen `VerificacionController`,
  `MisRecibosController`, `GET /pagos/:id` y `GET /cuotas` (todas de lectura, exentas de
  `@Auditar`).
- `HU-51` en `polizas.use-cases.spec.ts`: crear y editar con cobertura y condiciones.
- **Cierre:** `pnpm --filter @oasis/api lint`, `typecheck`, `test` y `pnpm deps:check`.

**Cierre de la Fase 2 (sesión principal):** `pnpm -r build`, `lint`, `format:check`, `typecheck`,
`deps:check`, `deps:check:negativo`, `pnpm test`; backfill en la base de desarrollo; resumen de la
API para `frontend-spa`.

## 7. Fase 3 — SPA (`frontend-spa`)

Una línea de trabajo, en orden: T12 → T17. Todas las pantallas usan `EstadoInsignia`, los
componentes de S4 y `lib/formato.ts`.

### T12. Estado de anclaje y reintento (`frontend-spa`, HU-24, HU-26; TDD)

- **Archivos:** `features/recibos/pages/RecibosPage.tsx` y `ReciboDetallePage.tsx` (+tests),
  `features/recibos/components/LineaTiempoAnclaje.tsx` (+test, nuevo), `features/recibos/api.ts`.
- **D25:** antes de crear `LineaTiempoAnclaje`, extraer los pasos de `SeguimientoPago` (Etapa C) a
  `components/LineaTiempo.tsx` y usarlo en los dos; las pruebas de `SeguimientoPago` siguen en verde.
- **Comportamiento:** D9 y D10. Línea de tiempo con puntos de 24 px con icono y los tonos de
  DESIGN.md; fechas de envío y anclaje en formato de Ecuador; enlace «Ver transacción» con
  `target="_blank"` y `rel="noopener noreferrer"`.
- **Pruebas primero:** con `vi.useFakeTimers`, un recibo ENVIADO se vuelve a pedir a los 10 s y un
  ANCLADO no; el OPERADOR no ve «Reintentar»; el ADMIN lo ve solo en FALLIDO y confirma antes de
  enviar; tras reintentar se muestra «Último reintento».

### T13. Recibo imprimible (`frontend-spa`, HU-25; TDD)

- **Archivos:** `features/recibos/pages/ReciboImprimiblePage.tsx` (compartida por las dos rutas de
  D8; la fuente de datos depende del rol), `features/recibos/components/ReciboImprimible.tsx`
  (+test), estilos `@media print` en `index.css`, `router.tsx` (rutas con sus roles), enlaces
  «Imprimir» desde `ReciboDetallePage` y, en el portal, desde el pago validado del `PanelCliente`.
- **Hoja:** isologo, «Recibo de pago», código grande en Outfit, estado de anclaje con
  `EstadoInsignia`, datos del pago, póliza y cliente (D7), QR de 32 mm con el código debajo y la
  frase «Verifique este recibo en Oasis Seguros con su sesión».
- **Pruebas primero:** muestra póliza, monto, fecha, código y estado; el QR codifica la URL de
  verificación; no aparece `sal`, `payload` ni `hash`; el botón llama a `window.print`.

**Ejemplo (orientativo):**

```css
@media print {
  @page {
    size: A4 portrait;
    margin: 15mm;
  }
  [data-no-imprimir] {
    display: none !important;
  }
  .recibo-imprimible {
    box-shadow: none;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
```

### T14. Verificación con sesión (`frontend-spa`, HU-28; TDD)

- **Archivos:** `features/verificacion/pages/VerificacionPage.tsx` (+test),
  `features/recibos/components/TarjetaVerificacion.tsx` (+test), `components/estados.ts` (dominio
  `verificacion` con los códigos de D2), `router.tsx`.
- **Comportamiento:** los cinco resultados con `EstadoInsignia` y los textos de D5; «Detalles
  técnicos» solo para el personal; enlace al explorador; rutas accesibles al CLIENTE
  (`RutaProtegida roles={['ADMIN','OPERADOR','CLIENTE']}`); 429 → «Demasiadas consultas; intente de
  nuevo en un minuto» con el tiempo de `Retry-After`.
- **Pruebas primero:** cada resultado con su texto; el CLIENTE no ve hashes; sin sesión, la URL del
  QR lleva al login y, tras entrar, vuelve a la verificación de ese código.

### T15. Pagos: filtros y detalle (`frontend-spa`, HU-20, HU-36; TDD)

- **Archivos:** `features/pagos/pages/PagosPage.tsx` (+test),
  `features/pagos/components/DetallePagoSheet.tsx` (+test, nuevo), `features/pagos/api.ts`.
- **Comportamiento:** filtros de D15 en la URL; total del filtro sobre la tabla; `Sheet` de detalle
  con datos del pago, aplicaciones por cuota y enlace al recibo.
- **Pruebas primero:** cambiar un filtro actualiza la URL y al recargar se conserva; el filtro de
  cliente envía `clienteId`; el `Sheet` muestra las aplicaciones.
- **Vista previa (D24):** `ValidarPagoDialog` y `FormularioPago` muestran el efecto en las cuotas.
  Pruebas primero: un pago de $160 sobre cuotas de $120 y $120 dice «la cuota 1 queda Pagada y la
  cuota 2 recibe $40,00»; un monto mayor que lo pendiente muestra el aviso de saldo sin llamar al API.

### T16. Cartera (`frontend-spa`, HU-38; TDD)

- **Archivos:** `features/cartera/pages/CarteraPage.tsx` (+test), `features/cartera/api.ts`,
  `router.tsx`, `components/layout/AppLayout.tsx` (ítem «Cartera» en el riel para ADMIN y OPERADOR).
- **Comportamiento:** píldoras «Por vencer» · «Vencidas» · «Todas»; filtros de cliente
  (`SelectorCliente`), aseguradora y fechas, en la URL; tabla con cliente, póliza (enlace a su
  detalle), cuota, valor, pendiente, vencimiento, días de atraso (tono aviso de 1 a 30, error con más
  de 30) y estado («Vencida · abonado $X» para las parciales vencidas, D11); montos tabulares.
- **Pruebas primero:** muestra los días de atraso; estado vacío explicado («No hay cuotas que venzan
  en los próximos 7 días»); el OPERADOR ve el ítem del riel y el CLIENTE no.
- **D25:** ramo con `RamoEtiqueta` y `LeyendaEstados dominio="cuota"` bajo las píldoras.

### T17. Cobertura y detalle de póliza (`frontend-spa`, HU-51, HU-36; TDD)

- **Archivos:** `features/polizas/components/FormularioPoliza.tsx` (+test),
  `features/polizas/pages/PolizaDetallePage.tsx` (+test, nuevo), `PolizasPage.tsx` (número de póliza
  como enlace), `router.tsx`.
- **Comportamiento:** `cobertura` y `condiciones` con `textarea`, contador y `maxLength` 2000;
  detalle con datos y vigencia, cobertura y condiciones (saltos de línea respetados), plan de cuotas
  con `EstadoInsignia` y sus aplicaciones, y pagos de la póliza.
- **Pruebas primero:** 2 001 caracteres muestran el error del campo; el detalle muestra cobertura,
  condiciones y vigencia; las aplicaciones aparecen bajo su cuota.

**Cierre de la Fase 3 (sesión principal):** `pnpm --filter @oasis/web lint`, `typecheck`, `test` y
`build`; `pnpm format:check`.

## 8. Fase 4 — Evidencia y revisión

Infraestructura arriba (`compose.dev.yaml`, nodo Hardhat, `pnpm dev:chain`, `migrate deploy`,
`seed`, backfill). Antes de las e2e del API, detén el worker de desarrollo y limpia
`bull:anclaje-recibos:*`.

### T18. e2e del API (`verificador`)

- **`verificacion.e2e-spec.ts`** (nuevo): AUTENTICO tras anclar; EN_PROCESO antes; NO_COINCIDE
  alterando `payloadCanonico` en la base de la prueba; ANULADO tras anular; NO_ENCONTRADO con un
  código inexistente; CLIENTE dueño → AUTENTICO; CLIENTE ajeno → cuerpo igual al inexistente; 31
  consultas → la última 429 con `Retry-After`; sin token → 401.
- **`recibos.e2e-spec.ts`** (nuevo o ampliado): `GET /recibos/:id` sin `payloadCanonico`;
  imprimible del personal y del CLIENTE (ajeno → 404); reintento de un FALLIDO forzado →
  PENDIENTE_ANCLAJE, encolado y en la bitácora con el ADMIN; reintento de un ANCLADO → 422;
  OPERADOR → 403.
- **`cuotas.e2e-spec.ts`** ampliado: aplicación en orden (HU-36), PARCIAL, PAGADA y VENCIDA con
  abono; concurrencia de D12 con `Promise.all`; `GET /pagos/:id` con aplicaciones; cartera POR_VENCER
  y VENCIDAS con días de atraso (reloj fijado con el `ClockPort` de pruebas).
- **`pagos.e2e-spec.ts`** ampliado: HU-20 (orden, cliente, fechas, total).
- **`polizas.e2e-spec.ts`** ampliado: cobertura y condiciones; ramo `SALUD` → 422 `RAMO_INVALIDO`.
- `acceso-por-rol.e2e-spec.ts` con la matriz nueva (CLIENTE en la verificación y en
  `/mis-recibos/:id/imprimible`).

### T19. Playwright (`verificador`)

- **`recibos-verificacion.spec.ts`:** el operador valida un pago y ve «En proceso» que pasa a
  «Verificable» sin recargar; abre el imprimible; con `page.emulateMedia({ media: 'print' })` la
  navegación queda oculta; el CLIENTE abre la URL del QR sin sesión → login → «Auténtico».
- **`cartera.spec.ts`:** el operador filtra vencidas y llega a la póliza con su cobertura.
- **`diseno.spec.ts`:** agrega a su lista el imprimible, la verificación del CLIENTE, la cartera, el
  detalle de póliza y el `Sheet` del pago.

### T20. Revisión (`revisor` y dueños)

- Contra la sección 2, los criterios, `AGENTS.md`, `ponytail-review`, `accessibility` e `impeccable
audit`. Atención: D3 indistinguible también en tiempo (sin consulta a la cadena); el guard corre
  después de la autenticación; `FOR UPDATE` dentro de la transacción; centavos enteros; ningún dato
  interno en el imprimible; estilos de impresión; un solo oro por vista.
- Hallazgos bloqueantes y menores dentro del alcance se corrigen; una ronda de confirmación como
  máximo; después se repiten los cierres de las Fases 2, 3 y 4.

## 9. Fase 5 — Cierre

### T21. Definición de Terminado (sesión principal)

```bash
pnpm install --frozen-lockfile
pnpm -r build && pnpm -r lint && pnpm format:check && pnpm -r typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test
docker.exe compose -f compose.dev.yaml up -d
pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy   # cobertura_ramos_s5
pnpm --filter @oasis/api seed
pnpm --filter @oasis/api exec tsx prisma/backfill-aplicaciones.ts
pnpm test:e2e
pnpm --filter @oasis/web test:e2e
```

Pruebas manuales (resultado en el informe): imprimir un recibo a PDF desde Chrome y comprobar que
cabe en una hoja A4; escanear el QR con un teléfono en la misma red (`pnpm dev --host`) y verificar;
lector de pantalla en la verificación y en la cartera.

### T22. Capturas y punto de control (sesión principal)

1. Script de Playwright temporal en `.superpowers/sdd/sprint-s5-plan/` (no se versiona), a 1280 y
   360 px: lista de recibos y detalle con la línea de tiempo (en proceso, anclado y fallido con
   «Reintentar»), el imprimible en pantalla y con `emulateMedia('print')`, la verificación con los
   cinco resultados (personal y CLIENTE), la cartera en sus tres vistas, el detalle de póliza y el
   `Sheet` del pago. En `capturas/`.
2. **Punto de control (D21):** presenta las capturas (rutas absolutas) y el resultado de T21. Espera
   «aprobado» o ajustes; con ajustes, relanza al dueño, repite los cierres afectados y vuelve a
   presentar.

### T23. Documentación (`documentacion`)

- **`CLAUDE.md`:** códigos de verificación (D2), CLIENTE y RN-07 (D3), límite por usuario (D4),
  imprimible (D7, D8), aplicación de pagos con `FOR UPDATE` (D12) e invariante (D13), cartera (D16),
  ramos en la migración (D18). Actualiza el párrafo «Hash y privacidad», que dice que HU-28 abrirá la
  verificación al CLIENTE.
- **`apps/api/src/modules/README.md`:** rutas de lectura nuevas exentas de `@Auditar`.
- **`docs/despliegue.md`:** `backfill-aplicaciones.ts`.
- **`docs/sprints/README.md`:** fila de S5.

### T24. Informe y commit (sesión principal)

`docs/sprints/sprint-s5.md` con la estructura de `sprint-s4.md`: encabezado, objetivo, entregables,
criterios con evidencia (sección 12), DoD, decisiones y discrepancias (incluida la lectura de D11),
arrastre de S4 ejecutado, **horas de backlog** (sección 13), deuda con sprint destino, acciones del
autor y «Cómo verificar». Revisa con `git status` que no entren `.env`, `.superpowers/`, `.agents/`,
`.claude/` ni `*.docx`. Solo con el «aprobado» de T22:

```bash
git add -A
git commit -F - <<'EOF'
feat(repo): completar el sprint S5 con verificación del cliente, recibo imprimible y cartera

- HU-24, HU-25, HU-26: estado de anclaje con sondeo de 10 s, recibo imprimible con QR y reintento
  del ADMIN.
- HU-28: verificación con sesión para el cliente (RN-07), cinco resultados y 30 consultas por minuto.
- HU-36: aplicación de pagos a cuotas en la transacción de validación, con bloqueo de cuotas.
- HU-20, HU-38: listado de pagos con filtros en la URL y cartera por vencer y vencida.
- HU-51: cobertura y condiciones de la póliza y catálogo de ramos de Oasis.
- HT-16: plan de incidentes, RAT, encargados, insumos de la EIPD y política de datos v1.0.

Refs: HU-24, HU-25, HU-26, HT-16, HU-28, HU-36, HU-20, HU-38, HU-51
EOF
```

Sin push. Mensaje final: resumen de la verificación, acciones del autor, título y cuerpo del PR.

## 10. Acciones del autor e hitos

- **Revisión del 13/11 con Oasis:** pedir los Excel actuales de cartera (clientes y pólizas) para la
  plantilla de HU-34 (S6) y entregar la política v1.0 para su revisión antes del 16/11.
- Aprobar el punto de control, push, PR y aceptación del Product Owner.

## 11. Riesgos

| #   | Riesgo                                        | Respuesta                                                                                                                        |
| --- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| R1  | El arrastre de S4 incluye historias completas | D1: freno con `grilling` y propuesta de orden; HU-51 y HU-26 son las primeras en ceder.                                          |
| R2  | Oasis no entrega los Excel el 13/11           | HU-34 (S6) diseña la plantilla con las columnas del backlog y la ajusta cuando lleguen.                                          |
| R3  | Oasis no revisa la política a tiempo          | HU-33 (S6) publica la v1.0 borrador como «1.0»; un cambio posterior sube la versión y pide nueva aceptación (criterio de HU-33). |
| R4  | La prueba de concurrencia es intermitente     | Dos transacciones reales con `Promise.all` sobre la misma póliza; se comprueba el resultado, nunca el orden.                     |

## 12. Trazabilidad criterio → evidencia

| Criterio                                     | Evidencia esperada                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| HU-24.1 insignia de color y texto            | `EstadoInsignia.test.tsx`; `RecibosPage.test.tsx`                                             |
| HU-24.2 enlace al explorador                 | `ReciboDetallePage.test.tsx`; `recibos-verificacion.spec.ts`                                  |
| HU-24.3 fechas de envío y anclaje            | `LineaTiempoAnclaje.test.tsx`                                                                 |
| HU-24.4 actualización cada 10 s              | `RecibosPage.test.tsx` (temporizadores falsos); Playwright                                    |
| HU-25.1 póliza, monto, fecha, código, estado | `ReciboImprimible.test.tsx`; `recibos.e2e-spec.ts`                                            |
| HU-25.2 QR a la ruta con sesión              | `ReciboImprimible.test.tsx`; `recibos-verificacion.spec.ts`                                   |
| HU-25.3 imprimir o guardar PDF               | prueba de `window.print`; `emulateMedia('print')`; prueba manual                              |
| HU-25.4 sin sal ni datos internos            | `recibos.e2e-spec.ts` (recorrido de claves); `ReciboImprimible.test.tsx`                      |
| HU-26.1 solo ADMIN y FALLIDO                 | `recibos.e2e-spec.ts`; `ReciboDetallePage.test.tsx`                                           |
| HU-26.2 vuelve a PENDIENTE y se encola       | `recibos.e2e-spec.ts`; `outbox.use-cases.spec.ts`                                             |
| HU-26.3 quién reintentó                      | `recibos.e2e-spec.ts` (bitácora); `ReciboDetallePage.test.tsx`                                |
| HT-16.1 a HT-16.4                            | los seis documentos de `docs/proteccion-datos/`                                               |
| HU-28.1 exige sesión y vuelve tras login     | `verificacion.e2e-spec.ts` (401); `VerificacionPage.test.tsx`; `recibos-verificacion.spec.ts` |
| HU-28.2 recalcula y compara                  | `verificar-recibo.use-case.spec.ts`; `verificacion.e2e-spec.ts`                               |
| HU-28.3 cinco resultados                     | `verificar-recibo.use-case.spec.ts`; `verificacion.e2e-spec.ts`; `VerificacionPage.test.tsx`  |
| HU-28.4 enlace al explorador                 | `verificacion.e2e-spec.ts`; `TarjetaVerificacion.test.tsx`                                    |
| HU-28.5 RN-07                                | `verificar-recibo.use-case.spec.ts`; `verificacion.e2e-spec.ts`                               |
| HU-28.6 30 por minuto por usuario            | `limite-por-usuario.guard.spec.ts`; `verificacion.e2e-spec.ts`                                |
| HU-36.1 orden de vencimiento (RN-13)         | `aplicacion-pago.spec.ts`; `cuotas.e2e-spec.ts`                                               |
| HU-36.2 PARCIAL                              | `aplicacion-pago.spec.ts`; `cuotas.e2e-spec.ts`                                               |
| HU-36.3 PAGADA                               | `aplicacion-pago.spec.ts`; `cuotas.e2e-spec.ts`                                               |
| HU-36.4 detalle en pago y póliza             | `cuotas.e2e-spec.ts`; `DetallePagoSheet.test.tsx`; `PolizaDetallePage.test.tsx`               |
| HU-20.1 filtros                              | `pagos.e2e-spec.ts`; `PagosPage.test.tsx`                                                     |
| HU-20.2 por validar primero                  | `pagos.e2e-spec.ts`                                                                           |
| HU-20.3 paginado con total                   | `pagos.e2e-spec.ts`; `PagosPage.test.tsx`                                                     |
| HU-38.1 próximos 7 días y vencidas           | `listar-cartera.use-case.spec.ts`; `cuotas.e2e-spec.ts`                                       |
| HU-38.2 filtros                              | `cuotas.e2e-spec.ts`; `CarteraPage.test.tsx`                                                  |
| HU-38.3 columnas y días de atraso            | `CarteraPage.test.tsx`; `cartera.spec.ts`                                                     |
| HU-51.1 texto ≤ 2 000                        | esquemas; `polizas.e2e-spec.ts`                                                               |
| HU-51.2 al registrar y editar                | `FormularioPoliza.test.tsx`; `polizas.e2e-spec.ts`                                            |
| HU-51.3 detalle                              | `PolizaDetallePage.test.tsx`; `cartera.spec.ts`                                               |
| HU-51.4 ramos de Oasis                       | migración; `polizas.e2e-spec.ts` (SALUD inactivo)                                             |

## 13. Horas de backlog

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

## 14. Prompt de arranque

```text
Eres la sesión principal del Sprint S5 del SRPP. Ejecuta docs/sprints/sprint-s5-plan.md de
principio a fin con subagent-driven-development, siguiendo sus reglas (sección 0) y sus decisiones
(sección 2), que no se reabren.

1. Lee AGENTS.md, CLAUDE.md, apps/api/src/modules/README.md y el plan completo. Invoca
   subagent-driven-development y ponytail. Abre el ledger en .superpowers/sdd/sprint-s5-plan/.
2. Fase 0 (T0): arrastre de S4 (D1), rama, línea base y estado de partida. Si el arrastre trae
   historias completas, detente e invoca grilling con tu propuesta.
3. Fase 1: en un mismo mensaje, @contrato-shared con T1–T3 y @documentacion con T4. Cierra la fase.
4. Fase 2: @backend-api con T5–T11. Cierra la fase y prepara el resumen de la API.
5. Fase 3: @frontend-spa con T12–T17, con ese resumen. Cierra la fase.
6. Fase 4: @verificador con T18 y T19 (bugs de producto → relanza al dueño con la prueba roja);
   @revisor con T20; máximo una ronda de confirmación.
7. Fase 5: T21 DoD; T22 capturas y DETENTE en el punto de control; con mi «aprobado»,
   @documentacion con T23 y tú T24 (informe y único commit, sin atribuciones y sin push).

Cada agente recibe un mensaje autosuficiente: sus tareas, las decisiones por número, lo que
entregaron los demás y la ruta de su nota. Respeta las fronteras de la tabla 0.1. Termina con el
resumen y el cuerpo del PR.
```
