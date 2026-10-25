# Sprint S9 — Plan de implementación

- **Historias:** HT-10 Evaluación de la eficiencia de desempeño (14 h), HU-47 Actualizar datos de
  contacto (3 h), HT-11 Capacitación y entrega (10 h), HU-41 Descargar recibo en PDF (5 h), HU-46
  Administrar catálogos (4 h), HU-40 Recordatorio de vencimiento de cuota (3 h) y HU-44 Reporte de
  cartera vencida (5 h).
- **Horas:** 44 h de backlog. El informe reporta solo las horas de backlog (D18). Antes que nada se
  atienden las incidencias de la aceptación de S8 (D1; backlog §6: no hay sprint de reserva).
- **Épicas:** EP-08 (HT-10, HT-11), EP-06 (HU-47), EP-05 (HU-41), EP-03 (HU-46, HU-40) y EP-09
  (HU-44).
- **Fechas:** 28/12/2026 – 08/01/2027 (tabla 6-1; el 01/01 es feriado). **Congelamiento y
  `v1.0.0-rc.1`: 04/01. Medición: 05/01. Capacitación: 06/01. Entrega: 07/01. Cierre: 08/01.**
- **Rama:** `feat/sprint-s9-evaluacion-entrega`. **Dos commits** (D17) y un solo PR; al final, la
  etiqueta `v1.0.0`.
- **Ejecuta:** la sesión principal con `subagent-driven-development` y los agentes de área de
  `.opencode/agents/` (sección 0.1). Los pasos en el servidor los ejecuta el desarrollador (S7 D18).
- **Decisiones acordadas con el desarrollador:** 23/10 y 24/10/2026, en sesiones de grilling
  (sección 2).

Este documento es el Sprint Backlog de S9, el último del proyecto. Las reglas generales están en
`AGENTS.md`, el mapa técnico en `CLAUDE.md` y las reglas de los módulos del API en
`apps/api/src/modules/README.md`. Cada agente lee los tres antes de empezar. La fuente de verdad está
en `docs/referencia/`, que no se edita: si algo de este plan la contradice, gana la referencia;
detente y repórtalo.

**Cómo leer las tareas.** Cada tarea indica su **agente**, sus **archivos**, sus **skills**, el
comportamiento esperado, los casos borde, las pruebas que se escriben primero y su verificación. Los
bloques **Ejemplo (orientativo)** muestran la forma o la parte delicada; se adaptan al código real.

## 0. Reglas de ejecución

1. La sesión principal ejecuta las fases en orden: 0 → 1 → 2 → 3 → 4 → 5. Ningún agente arranca una
   fase por su cuenta. **El calendario manda:** el commit 1 debe existir el 04/01 por la mañana.
2. TDD en toda lógica nueva (`test-driven-development`): primero la prueba en rojo, luego el código.
   Antes de cerrar una fase, la sesión principal usa `verification-before-completion` y guarda la
   salida en el ledger.
3. Cada agente invoca al empezar las skills de su tarea en el orden de `AGENTS.md`: proceso →
   tecnología → `ponytail` decide el tamaño.
4. Tras cambiar `packages/shared/src`: `pnpm --filter @oasis/shared build` y borrar
   `apps/web/node_modules/.vite`.
5. Nunca se edita `docs/referencia/`.
6. **Dos commits (D17)**: T18 (código) y T26 (solo documentación). Los hace la sesión principal, sin
   líneas de atribución; antes, `git config user.name` debe ser `JohannCaizaguano`. **Sin push, PR
   ni etiquetas**: los hace el usuario.
7. No se adelanta trabajo ni se agrega funcionalidad nueva: lo que surja en la capacitación va al
   informe como trabajo futuro.
8. Comentarios solo para el porqué no obvio. Simplificaciones deliberadas con `ponytail:` (techo y
   salida).
9. En la fase paralela cada agente compila y prueba **solo su paquete** (`pnpm --filter …`); nadie
   ejecuta `pnpm -r build` ni `pnpm install` hasta que la sesión principal cierre la fase.
10. Sin dependencias nuevas previstas: `pdfkit` y `qrcode` llegaron en S8 y k6 corre en contenedor.
    Si hiciera falta una, la instala la sesión principal.
11. **Congelamiento:** desde el 04/01 solo entran correcciones bloqueantes, cada una con su prueba.
12. **Acciones en el servidor y datos reales:** como en S7 y S8, la sesión principal propone, el
    desarrollador ejecuta y la salida se verifica antes del siguiente paso. Ninguna credencial ni dato
    personal de los clientes de Oasis entra al ledger, a los informes ni a los manuales (las capturas
    de los manuales usan el stack de evaluación con datos sintéticos, D2).
13. **Punto de control antes del commit 1 (D16):** la sesión principal se detiene en T16, presenta las
    capturas y espera un «aprobado» explícito.

### 0.1 Agentes y coordinación

| Agente            | Edita                                                              | Fases   | Tareas                          |
| ----------------- | ------------------------------------------------------------------ | ------- | ------------------------------- |
| sesión principal  | archivos raíz, ledger                                              | 0–5     | T0, T15, T16, T18–T20, T25, T26 |
| `contrato-shared` | `packages/shared/src/` (salvo `abi/`), `apps/web/src/contratos/`   | 1       | T1, T2                          |
| `documentacion`   | `docs/` (salvo `referencia/`), `CLAUDE.md`, `AGENTS.md`, READMEs   | 1, 4, 5 | T3, T17, T21, T22, T24          |
| `backend-api`     | `apps/api/src/`, `apps/api/prisma/`                                | 2, 4    | T4–T8                           |
| `infra`           | `infra/`, `compose.*.yaml`, `Dockerfile`s, `Caddyfile`, `.github/` | 2, 4    | T9, T10                         |
| `frontend-spa`    | `apps/web/src/` (salvo `contratos/`)                               | 3, 4    | T11, T12                        |
| `verificador`     | `apps/api/test/`, `apps/web/e2e/`                                  | 4       | T13                             |
| `revisor`         | nada (solo su nota del ledger)                                     | 4       | T14                             |
| desarrollador     | servidor, Amoy, sesiones con Oasis, firmas                         | 5       | pasos de T19, T20, T23–T25      |

```text
Semana 1 (28/12–01/01)
  Fase 0  sesión principal ── T0 incidencias de S8, rama, línea base, fechas con Oasis
  Fase 1  contrato-shared ── T1 → T2        documentacion ── T3 manuales en borrador (en paralelo)
  Fase 2  ┌ backend-api ── T4 → T5 → T6 → T7 → T8
          └ infra ── T9 → T10 (escenarios k6, stack de evaluación y extracción de métricas)
  Fase 3  frontend-spa ── T11 → T12
Semana 2 (04–08/01)
  Fase 4  verificador ── T13 · revisor ── T14 → correcciones · sesión principal ── T15 DoD,
          T16 capturas y PUNTO DE CONTROL · documentacion ── T17 · sesión principal ── T18 COMMIT 1
          ── el desarrollador hace push y etiqueta v1.0.0-rc.1 (04/01) ──
  Fase 5  T19 despliegue de rc.1 (04/01) → T20 medición en el stack de evaluación (05/01) →
          T21 informe de desempeño → T22 manuales finales → T23 capacitación (06/01) →
          T24 acta de entrega (07/01) → T25 v1.0.0 en producción → T26 informe del proyecto y COMMIT 2
```

**Si la semana 1 termina antes,** la Fase 4 se adelanta; lo que no se mueve son las fechas con Oasis.

**Traspasos.** Cada agente cierra su tarea con una nota en `.superpowers/sdd/sprint-s9-plan/<agente>.md`
(qué hizo, salida resumida de sus comandos, desvíos con su motivo y lo que necesita el siguiente) y
responde a la sesión principal con un resumen corto.

**Fronteras.** Si un agente necesita un cambio fuera de su carpeta, no lo hace: lo anota y la sesión
principal relanza al dueño. Si el `verificador` encuentra un bug de producto, deja la prueba en rojo
como evidencia.

**Frenos.** Si una decisión de la sección 2 deja de ser viable, la sesión principal se detiene e
invoca `grilling` con su recomendación. Los agentes no reabren decisiones.

### 0.2 Skills por tarea

| Momento                        | Agente            | Skills                                                                                                                                                    |
| ------------------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Todo el sprint                 | sesión principal  | `subagent-driven-development`, `ponytail`, `verification-before-completion`; `grilling` solo como freno                                                   |
| Toda lógica nueva              | todos             | `test-driven-development`                                                                                                                                 |
| Fallo o prueba roja inesperada | todos             | `systematic-debugging`                                                                                                                                    |
| T1–T2 esquemas                 | `contrato-shared` | `zod`, `vitest`                                                                                                                                           |
| T3, T17, T21, T22, T24         | `documentacion`   | `humanizador-es`; `dataviz` para las gráficas del informe de desempeño; `evaluador-tesis-software-espoch` para revisar el Capítulo IV si el autor lo pide |
| T4–T8 API y worker             | `backend-api`     | `nestjs-best-practices`, `nodejs-best-practices`, `prisma-client-api`                                                                                     |
| T9–T10 carga y métricas        | `infra`           | `bash-defensive-patterns`                                                                                                                                 |
| T11–T12 SPA                    | `frontend-spa`    | `react-best-practices`, `react-hook-form`, `impeccable` (`harden`, `polish`), `accessibility`, `vitest`                                                   |
| T13 e2e y Playwright           | `verificador`     | `nestjs-best-practices`, `playwright-best-practices`                                                                                                      |
| T14 revisión                   | `revisor`         | `ponytail-review`, `accessibility`                                                                                                                        |

**`impeccable`.** Manda `apps/web/DESIGN.md`: interruptores de catálogo (`role="switch"`), grupos
plegables de la cartera vencida y la sección de contacto del portal.

**Sin worktrees ni commits por tarea.** Ledger y capturas en `.superpowers/sdd/sprint-s9-plan/`
(ignorado por git).

## 1. Alcance

### HT-10 — Evaluación de la eficiencia de desempeño (RNF-01 a RNF-08)

- Escenarios k6 de inicio de sesión, listado de pagos, validación de pago y verificación de recibos
  con 20 y 50 usuarios virtuales.
- Se obtienen PTb-1-G, PTb-3-G, PTb-5-G, PRu-1-G, PRu-2-G y PCa-2-G.
- La latencia de anclaje y el gas medio se calculan a partir de los recibos.
- Los resultados se exportan y se contrastan con los umbrales definidos.

### HU-47 — Actualizar datos de contacto (RF-52)

- El cliente edita su correo y teléfono desde el portal; el formato se valida.
- El cambio queda registrado en la bitácora.

### HT-11 — Capacitación y entrega

- Un manual de usuario por rol (ADMIN, OPERADOR y CLIENTE).
- Manual técnico con instalación, configuración, respaldo y restauración.
- La capacitación queda registrada con lista de asistentes.
- El acta de entrega queda firmada por Oasis Seguros.

### HU-41 — Descargar recibo en PDF (RF-46)

- El PDF contiene los datos del recibo, el código y el QR de verificación, con la identidad de Oasis.
- El cliente solo descarga sus propios recibos.

### HU-46 — Administrar catálogos (RF-51)

- Se crean, editan y desactivan ramos de seguro y métodos de pago.
- Un elemento en uso no se elimina, solo se desactiva.

### HU-40 — Recordatorio de vencimiento de cuota (RF-45)

- Correo 5 días antes del vencimiento de cada cuota pendiente, con póliza, número de cuota, valor y
  fecha.
- Nunca para una cuota ya pagada.

### HU-44 — Reporte de cartera vencida (RF-49)

- Cuotas vencidas agrupadas por cliente y por aseguradora, con valor vencido y días de atraso.
- Exportación a CSV y PDF.

### Fuera de alcance (no implementar)

- Cualquier funcionalidad nueva que surja en la capacitación: va al informe como trabajo futuro.
- Pago en línea (HU-48 y HU-49, retiradas en el backlog v1.5).

## 2. Decisiones tomadas (no reabrir)

| #   | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Motivo                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| D1  | **Incidencias de S8 primero**: T0 lee `docs/evaluacion/incidencias-aceptacion.md` y ejecuta las de destino S9 antes de la Fase 1, cada una con su prueba y su agente. Si son más que correcciones puntuales (por ejemplo, una historia rehecha), freno con `grilling` y propuesta de recorte: ceden primero HU-40 y HU-46 (prioridad BAJA), nunca HT-10 ni HT-11.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Backlog §6: las correcciones de la aceptación se absorben en S9.                                                       |
| D2  | **Entorno de pruebas y medición (tabla 8-1 de la arquitectura)**: el único VPS-1 hace de entorno **«Pruebas»** desde S7 hasta la entrega (aceptación de S8 y rendimiento de S9, con `compose.monitoring`) y pasa a **«Producción»** en `v1.0.0` (T25). La medición no toca los datos reales: en la ventana del 05/01, fuera de horario y con aviso a Oasis, se **detiene** el stack real (`docker compose -p oasis stop`) y se levanta un **stack de evaluación** aparte (`-p oasis-eval`, volúmenes propios, mismas imágenes `v1.0.0-rc.1`, `.env.eval` con secretos propios y una **cuenta operadora de evaluación** en Amoy con `REGISTRADOR_ROLE` otorgado y luego revocado por la billetera fría). La base de evaluación se llena con `infra/k6/sembrar-evaluacion.ts` (5 000 clientes, 8 000 pólizas, 40 000 pagos y sus recibos, sintéticos y válidos por RN-11). Al terminar: `down -v` del stack de evaluación, revocación del rol y arranque del stack real con su prueba de humo. k6 corre desde **otra máquina** (no el VPS) con `grafana/k6` en contenedor. | Respeta la tabla 8-1 sin duplicar el servidor; los datos reales nunca se mezclan ni se restauran (grilling del 24/10). |
| D3  | **Escenarios**: inicio de sesión, listado de pagos, validación de pago y verificación de recibos; cada uno con 1 min de calentamiento, 5 min estables a 20 VUs y 5 min a 50 VUs, tres repeticiones; se informa la mediana de las repeticiones. El escenario de validación crea sus pagos por la API en `setup()` y ancla en Amoy con la cuenta de evaluación; la verificación usa códigos reales de la base sembrada.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Criterio literal y medición reproducible.                                                                              |
| D4  | **Métricas ISO/IEC 25023 y umbrales** (tabla 12-1 de la arquitectura): PTb-1-G tiempo medio de respuesta (media y p95 de `http_req_duration` por escenario; umbral **p95 ≤ 1 s**, EC-01 y EC-02); PTb-3-G tiempo medio de retorno (de la validación a ANCLADO, `ancladoEn − creadoEn`; umbral **media ≤ 30 s y p95 ≤ 60 s**, EC-03); PTb-5-G rendimiento medio (peticiones por segundo completadas sin error; **informativa**, sin umbral documentado); PRu-1-G uso medio de CPU (cAdvisor y node-exporter; umbral **≤ 70 %**, EC-09); PRu-2-G uso medio de memoria de API + worker (umbral **≤ 1 GB**, EC-09); PCa-2-G capacidad de acceso (máximo de VUs con error < 1 % y p95 ≤ 1 s; umbral **sostener 50 VUs**, criterio de HT-10). Además, latencia de anclaje (mediana, p95 y máximo) y gas medio (media de `gasUsed` y de `gasUsed × effectiveGasPrice` en POL).                                                                                                                                                                                                  | Fórmulas y umbrales trazables para el Capítulo IV (confirmados el 24/10).                                              |
| D5  | **Extracción**: k6 exporta `--summary-export` JSON y CSV por escenario; `infra/scripts/metricas-iso.mjs` consulta la API HTTP de Prometheus por rango (CPU `rate(container_cpu_usage_seconds_total[1m])`, memoria `container_memory_working_set_bytes`, por contenedor) y la base de evaluación (latencia y gas) y escribe `docs/evaluacion/desempeno/resultados-<fecha>.json` y una tabla Markdown. Las gráficas del informe salen de ese JSON (`dataviz`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Datos exportados y contrastables.                                                                                      |
| D6  | **Datos de contacto (HU-47)**: `PATCH /mi-cuenta/contacto` (CLIENTE, `@Auditar('MODIFICAR', 'Cliente')`, con los **nombres** de los campos cambiados en el detalle, no sus valores) con `{ email?, telefono? }` validados con los esquemas de cliente. Cambiar el correo actualiza `Cliente.email`, `Cliente.busqueda` y `Usuario.email` en una transacción (409 si otro usuario ya lo usa) y envía el aviso `contacto-cambiado` al correo **anterior**. Sección «Datos de contacto» en `/portal/cuenta`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Criterio literal; el aviso al correo anterior protege contra un robo de cuenta.                                        |
| D7  | **PDF del recibo (HU-41)**: `GET /recibos/:id/pdf` (ADMIN, OPERADOR) y `GET /mis-recibos/:id/pdf` (CLIENTE dueño; ajeno → 404) con el `GeneradorPdfPort` de S8 (ADR-028): los datos de `reciboImprimibleSchema` (S5 D7), el código, el QR (`qrcode`, mismo enlace que el imprimible) y la identidad de Oasis; `Content-Disposition: attachment; filename="recibo-<codigo>.pdf"` y `Cache-Control: no-store`. Botón «Descargar PDF» junto a «Imprimir».                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Criterio literal; un solo generador de PDF.                                                                            |
| D8  | **Catálogos (HU-46)**: `POST/PATCH /ramos` y `POST/PATCH /metodos-pago` (ADMIN, auditados `CREAR`/`MODIFICAR`), y `POST /ramos/:id/desactivar`\|`/reactivar` y lo mismo para métodos (auditados `DESACTIVAR`/`REACTIVAR`); sin `DELETE` (RN-09). `codigo` en mayúsculas sin espacios, inmutable tras crearse (lo usan las importaciones y el seed); `nombre` único. Lo desactivado deja de ofrecerse en formularios e importaciones y lo existente lo conserva. `DEBITO_BANCARIO` no se puede desactivar (lo exige HU-50) → 422 `METODO_REQUERIDO`. `MetodoPago` ya es una tabla: lo que cambia es que `METODOS_PAGO` de `@oasis/shared` deja de validar la entrada como lista cerrada; los esquemas aceptan el código como texto y el API comprueba que exista y esté activo. Pestaña «Aseguradoras y catálogos» del hub de administración con interruptores (`role="switch"`).                                                                                                                                                                                         | Criterio literal; un método nuevo no exige desplegar código.                                                           |
| D9  | **Recordatorio (HU-40)**: `RecordatorioCuotasTask` en el worker, diaria a las 08:00 de Guayaquil (`@Cron('0 8 * * *', { timeZone: 'America/Guayaquil' })`), encola `recordatorio-cuota` por cada cuota PENDIENTE o PARCIAL con `fechaVencimiento = hoy + 5` de pólizas VIGENTES cuyo cliente esté activo y tenga correo, con póliza, número de cuota, valor pendiente y fecha. Idempotencia: `Cuota.recordatorioEnviadoEn`, marcada en la misma operación que selecciona (`UPDATE … RETURNING` de las que aún no tienen marca). Recuperación: si el worker estuvo apagado, la siguiente ejecución también toma las de `hoy + 4` sin marca. Nunca para una cuota PAGADA. Log con el conteo.                                                                                                                                                                                                                                                                                                                                                                               | Criterio literal; sin correos duplicados ante reinicios.                                                               |
| D10 | **Cartera vencida (HU-44)**: `GET /reportes/cartera-vencida?agrupar=cliente\|aseguradora&formato=json\|csv\|pdf` (**solo ADMIN**, DESIGN.md), cuotas no PAGADAS con `fechaVencimiento < hoy`: por grupo, número de cuotas, valor vencido (suma de pendientes) y días de atraso máximo y promedio, con el detalle de cuotas bajo cada grupo; totales generales. Reutiliza la consulta de la cartera de S5 (HU-38) y las utilidades de CSV y PDF de S8.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Criterio literal sin duplicar reglas.                                                                                  |
| D11 | **Manuales (HT-11)**: `docs/manuales/manual-administrador.md`, `manual-operador.md`, `manual-cliente.md` (tareas paso a paso con capturas del **stack de evaluación** de `v1.0.0-rc.1`, con datos sintéticos, en el lenguaje de PRODUCT.md y sin tecnicismos para el cliente) y `manual-tecnico.md` (arquitectura en una página que enlaza ARQUITECTURA.md, instalación desde cero, variables por archivo, despliegue, respaldo, restauración, rotación de secretos, monitoreo y solución de problemas frecuentes). Se exportan a PDF para Oasis (Pandoc o impresión del navegador).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Criterio literal; ninguna captura con datos reales.                                                                    |
| D12 | **Capacitación (06/01, 2 h)**: agenda por rol y práctica guiada en producción con datos reales (las acciones de prueba se anulan o se registran como tales); registro `docs/evaluacion/capacitacion-2027-01-06.md` con asistentes, temas y preguntas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Criterio literal.                                                                                                      |
| D13 | **Acta de entrega (07/01)**: `docs/evaluacion/acta-entrega.md` con versión `v1.0.0`, URL, credenciales entregadas (sin escribirlas: se entregan en sobre o gestor de contraseñas), contrato de Amoy y su administrador en frío, respaldos activos, manuales, estado del monitoreo (D14) y periodo de soporte acordado; firmada por la gerencia de Oasis. El escaneo firmado queda fuera del repositorio; en el repositorio, la versión sin firmas y la constancia de que se firmó.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Criterio literal; sin datos personales ni firmas versionadas.                                                          |
| D14 | **Paso a producción (T25)**: `v1.0.0` desplegada con `compose.prod` como en la tabla 8-1. `compose.monitoring` se detiene y queda documentado cómo volver a activarlo (manual técnico); el acta registra que las alertas de HT-07 quedan inactivas salvo que Oasis pida mantenerlas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Tabla 8-1: «Producción» usa solo `compose.prod`.                                                                       |
| D15 | **Pruebas:** TDD del recordatorio (reloj fijo, idempotencia, recuperación de un día, cuotas pagadas fuera), del agrupado de la cartera vencida, de los catálogos (sin `DELETE`, `DEBITO_BANCARIO` protegido, lo desactivado fuera de formularios e importaciones) y del cambio de contacto (transacción y aviso); e2e `catalogos`, `contacto-cliente`, `recibo-pdf` (ajeno → 404, `%PDF` en los primeros bytes), `cartera-vencida` y `recordatorios` (Mailpit); Playwright `catalogos.spec.ts`, `portal-cuenta.spec.ts`, `recibo-pdf.spec.ts` y `diseno.spec.ts` extendido, en los tres navegadores; regresión completa.                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Evidencia por criterio (sección 12).                                                                                   |
| D16 | **Punto de control visual** antes del commit 1 (T16): capturas a 1280 y 360 px de las pantallas nuevas, del PDF del recibo y de los correos `recordatorio-cuota` y `contacto-cambiado`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Grilling del 24/10.                                                                                                    |
| D17 | **Commits**: commit 1 (T18) con el código, antes de desplegar `v1.0.0-rc.1`; commit 2 (T26, `docs(docs): …`) con el informe de desempeño y sus resultados, los manuales finales, la capacitación, el acta de entrega, el informe de S9 y el **resumen del proyecto**. Después, el desarrollador crea la etiqueta `v1.0.0` (T25 la despliega antes desde el mismo commit 1, que es el código entregado). Si la capacitación revela una corrección bloqueante, va en un `fix` entre ambos commits, con su prueba, y la etiqueta apunta a él.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | La evidencia llega después del código (grilling del 24/10).                                                            |
| D18 | **Horas:** el informe de S9 y el resumen del proyecto reportan solo las horas de backlog por historia y por sprint.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Grilling del 24/10.                                                                                                    |

## 3. Estado de partida (a confirmar en T0)

- **S8 entregó** (según su plan): monitoreo en el VPS, eventos de seguridad, cabeceras, límites en
  Redis, TOTP, conciliación con CSV y PDF (`GeneradorPdfPort`), exportación de pagos, indicadores,
  Playwright en tres navegadores, acta de aceptación e incidencias.
- **Catálogos:** `GET /ramos` de solo lectura (S3); la tabla `MetodoPago` existe sin endpoints;
  `METODOS_PAGO` es una lista cerrada en `@oasis/shared`.
- **Carga:** `infra/k6/` con login, listar-pagos, validar-pago y verificación hasta 5 o 10 VUs.
- **Manuales:** no existen.
- **Entorno:** el VPS-1 corre `compose.prod` y `compose.monitoring` con los datos reales de Oasis.

## 4. Fase 0 — Preparación (sesión principal)

### T0. Incidencias de S8, rama, línea base y fechas con Oasis

1. **Incidencias (D1):** lee `docs/evaluacion/incidencias-aceptacion.md` y `sprint-s8.md`; ejecuta
   las de destino S9 con su agente y su prueba antes de la Fase 1.
2. **Rama** `feat/sprint-s9-evaluacion-entrega` desde `main` con S8 fusionado. Si `main` tiene
   cambios sin commit del desarrollador, detente y pregunta.
3. **Línea base:** `pnpm install --frozen-lockfile`, `pnpm -r build`, `pnpm -r typecheck`,
   `pnpm test`; totales en el ledger. Si algo está rojo, detente.
4. **Fechas:** pide al desarrollador que confirme con Oasis la ventana de medición del 05/01 (hora
   de inicio y fin), la capacitación del 06/01 y la entrega del 07/01.

## 5. Fase 1 — Contratos y borradores (en paralelo)

### T1. Catálogos y contacto (`contrato-shared`, HU-46, HU-47; TDD)

- `crearRamoSchema`, `actualizarRamoSchema`, `crearMetodoPagoSchema`, `actualizarMetodoPagoSchema`
  (código `^[A-Z][A-Z0-9_]{1,39}$`); los esquemas de pago aceptan `metodo` como código de texto (D8)
  y `ETIQUETAS_METODO_PAGO` queda solo como respaldo de presentación de los del seed;
  `actualizarContactoSchema`; plantilla `contacto-cambiado` en `PLANTILLAS_CORREO`.
- **Pruebas primero:** código con minúsculas o espacios → error; un método nuevo `CHEQUE` pasa el
  esquema de pago; contacto sin ningún campo → error.

### T2. Cartera vencida y recordatorio (`contrato-shared`, HU-40, HU-44; TDD)

- `carteraVencidaQuerySchema` (`agrupar`, `formato`), `grupoCarteraVencidaSchema`,
  `totalesCarteraVencidaSchema`; plantilla `recordatorio-cuota` en `PLANTILLAS_CORREO`.
- **Pruebas primero:** `agrupar` inválido → error; por defecto `cliente` y `json`.

### T3. Manuales en borrador (`documentacion`, HT-11)

- Estructura y contenido de los cuatro manuales de D11 sobre la versión de S8, con marcadores
  `[captura: …]` donde irán las imágenes; las capturas se toman en T22 del stack de evaluación.

**Cierre de la Fase 1 (sesión principal):** `pnpm --filter @oasis/shared build` y `test`; borrar
`apps/web/node_modules/.vite`; resumen para la Fase 2.

## 6. Fase 2 — API, worker, carga y métricas (en paralelo)

Dos carriles en un mismo mensaje: `backend-api` (T4–T8) e `infra` (T9–T10).

### T4. Catálogos (`backend-api`, HU-46; TDD)

- **Archivos:** módulo `catalogos` (si el diff queda más corto) o `polizas` (ramos) y `pagos`
  (métodos); controladores con las rutas de D8; los casos de uso de pagos, pólizas e importaciones
  validan que el código exista y esté activo.
- **Pruebas primero:** desactivar un ramo con pólizas → 200 y las pólizas lo conservan; no existe
  `DELETE`; desactivar `DEBITO_BANCARIO` → 422 `METODO_REQUERIDO`; un método nuevo se usa en
  `POST /pagos` sin desplegar; un ramo desactivado en una fila de importación → error de fila.

### T5. Datos de contacto (`backend-api`, HU-47; TDD)

- D6 con `MiCuentaController`; plantilla `contacto-cambiado` en `notificaciones`.
- **Pruebas primero:** correo inválido → 400; correo de otro usuario → 409; un cambio exitoso
  actualiza `Cliente` y `Usuario`, deja la bitácora con los nombres de los campos y sin sus valores,
  y encola el aviso al correo anterior; solo teléfono → sin aviso.

### T6. PDF del recibo (`backend-api`, HU-41; TDD)

- D7 con una plantilla nueva del `GeneradorPdfPort`.
- **Pruebas primero:** el PDF empieza con `%PDF`, contiene el código y el texto del enlace de
  verificación; no contiene `sal` ni el payload; un recibo ajeno → 404.

### T7. Recordatorio de cuotas (`backend-api`, HU-40; TDD)

- **Archivos:** migración `Cuota.recordatorioEnviadoEn`; `EnviarRecordatoriosCuotasUseCase` (+spec);
  `RecordatorioCuotasTask` en el worker; plantilla `recordatorio-cuota`.
- **Pruebas primero:** con reloj del 10/01 a las 08:00, la cuota del 15/01 recibe recordatorio y la
  del 16/01 no; una segunda ejecución no duplica; una PAGADA del 15/01 no recibe; si ayer no corrió,
  hoy toma la del 14/01 sin marca; cliente sin correo → no se encola.

**Ejemplo (orientativo):**

```sql
UPDATE "Cuota" c SET "recordatorioEnviadoEn" = now()
FROM "Poliza" p JOIN "Cliente" cl ON cl.id = p."clienteId"
WHERE c."polizaId" = p.id
  AND c.estado IN ('PENDIENTE', 'PARCIAL')
  AND c."recordatorioEnviadoEn" IS NULL
  AND c."fechaVencimiento" BETWEEN $1::date + 4 AND $1::date + 5
  AND p.estado = 'VIGENTE' AND cl.activo AND cl.email IS NOT NULL
RETURNING c.id, c.numero, c.valor, c."valorPagado", c."fechaVencimiento", p.numero AS "numeroPoliza", cl.email;
```

### T8. Cartera vencida y cierre del carril (`backend-api`, HU-44; TDD)

- D10 en `reportes`.
- **Pruebas primero:** agrupado por cliente y por aseguradora con sumas y días correctos; OPERADOR →
  403; CSV y PDF con los mismos totales que el JSON; sin N+1 (una consulta por formato).
- **Cierre:** `lint`, `typecheck`, `test`, `deps:check`; coberturas de `@Roles` y `@Auditar`.

### T9. Escenarios de carga y stack de evaluación (`infra`, HT-10)

- **Archivos:** `infra/k6/` (cuatro escenarios con `scenarios` de k6, `ramping-vus` a 20 y 50,
  `thresholds` con los umbrales de D4, etiquetas por escenario; `lib.js` con un login por VU salvo en
  el escenario de login), `infra/k6/sembrar-evaluacion.ts` (D2), `compose.eval.yaml` (override del
  stack de evaluación con su nombre de proyecto y volúmenes propios), `infra/scripts/medir.sh`.
- **`medir.sh`** (se ejecuta en la máquina externa; los pasos en el VPS los ejecuta el desarrollador
  por SSH, D2): comprobaciones previas, escenarios con sus repeticiones, exportación de resultados y
  ninguna acción destructiva sobre el stack real.
- **Prueba local:** los escenarios contra `prod-local` con 2 VUs; la siembra en la base de
  `prod-local` termina en menos de 10 min y es determinista (semilla fija).

### T10. Extracción de métricas (`infra`, HT-10)

- `infra/scripts/metricas-iso.mjs` (D5) con las consultas PromQL documentadas en el propio script y
  por contenedor (`api`, `worker`, `postgres`, `redis`, `web`).
- **Verificación:** contra la corrida de humo, el JSON tiene todas las métricas de D4 sin valores
  nulos y la tabla Markdown marca «cumple» o «no cumple» por umbral.

**Cierre de la Fase 2 (sesión principal):** `pnpm -r build`, `lint`, `format:check`, `typecheck`,
`deps:check`, `deps:check:negativo`, `pnpm test`; corrida de humo de k6; resumen de la API para
`frontend-spa`.

## 7. Fase 3 — SPA (`frontend-spa`)

Una línea de trabajo, en orden: T11 → T12.

### T11. Catálogos y contacto (`frontend-spa`, HU-46, HU-47; TDD)

- **Archivos:** pestaña «Aseguradoras y catálogos» del hub de administración (ramos y métodos:
  tabla, crear y editar en diálogo, interruptor de activo con `role="switch"` y `aria-checked`;
  `DEBITO_BANCARIO` con el interruptor deshabilitado y su explicación); `/portal/cuenta` con «Datos de
  contacto» (correo y teléfono, confirmación, mensaje de éxito y aviso de que se notificará al correo
  anterior); los formularios de pago y póliza leen los catálogos activos del API.
- **Pruebas primero:** el interruptor anuncia su estado; el formulario de pago deja de ofrecer un
  método desactivado; el portal valida el formato antes de enviar.

### T12. PDF del recibo y cartera vencida (`frontend-spa`, HU-41, HU-44; TDD)

- «Descargar PDF» en el detalle del recibo y en el imprimible (personal y portal).
- `CarteraVencidaPage` (`/reportes/cartera-vencida`, solo ADMIN): pestañas de agrupación, grupos
  plegables con su total y botones de exportación (secundarios).
- **Pruebas primero:** el OPERADOR no ve el ítem; cambiar la agrupación vuelve a pedir el reporte;
  la descarga del PDF usa la ruta según el rol.

**Cierre de la Fase 3 (sesión principal):** `pnpm --filter @oasis/web lint`, `typecheck`, `test` y
`build`; `pnpm format:check`.

## 8. Fase 4 — Evidencia, revisión y commit 1

### T13. e2e y Playwright (`verificador`)

- e2e y Playwright de D15; `flujo-principal.spec.ts` sigue verde en los tres navegadores; regresión
  completa (`pnpm test:e2e` y `pnpm --filter @oasis/web test:e2e`).

### T14. Revisión (`revisor` y dueños)

- Atención: sin `DELETE` de catálogos, idempotencia del recordatorio, transacción del cambio de
  correo, autorización de los PDF, consultas del reporte sin N+1, escenarios k6 y siembra que nunca
  apuntan al stack real, `medir.sh` sin acciones destructivas.
- Una ronda de confirmación como máximo; después se repiten los cierres de las Fases 2, 3 y 4.

### T15. Definición de Terminado (sesión principal)

```bash
pnpm install --frozen-lockfile
pnpm -r build && pnpm -r lint && pnpm format:check && pnpm -r typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test
docker.exe compose -f compose.dev.yaml up -d
pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy
pnpm --filter @oasis/api seed
pnpm test:e2e
pnpm --filter @oasis/web test:e2e        # chromium, firefox y webkit
bash infra/scripts/prod-local.sh
```

### T16. Capturas y punto de control (sesión principal)

1. Script de Playwright temporal en `.superpowers/sdd/sprint-s9-plan/` (no se versiona), a 1280 y
   360 px: catálogos (con un elemento desactivado y `DEBITO_BANCARIO` protegido), datos de contacto
   del portal, cartera vencida en sus dos agrupaciones, botón y primera página del PDF del recibo, y
   los correos `recordatorio-cuota` y `contacto-cambiado` en Mailpit. En `capturas/`.
2. **Punto de control (D16):** presenta las capturas (rutas absolutas) y el resultado de T15. Espera
   «aprobado» o ajustes.

### T17. Documentación técnica (`documentacion`)

- **`CLAUDE.md`:** catálogos editables, recordatorio, cartera vencida, PDF del recibo, k6 y métricas.
- **`docs/despliegue.md`:** stack de evaluación (D2), medición, paso a producción (D14) y cómo
  reactivar el monitoreo.
- **`docs/sprints/README.md`:** fila de S9.

### T18. Informe parcial y commit 1 (sesión principal, a más tardar el 04/01 por la mañana)

`docs/sprints/sprint-s9.md` con la estructura de `sprint-s4.md` y los apartados **Evaluación**,
**Entrega** y **Resumen del proyecto** marcados «pendiente». Revisa con `git status` que no entren
`.env*` reales, `.superpowers/`, `.agents/`, `.claude/` ni `*.docx`. Solo con el «aprobado» de T16:

```bash
git add -A
git commit -F - <<'EOF'
feat(repo): completar el sprint S9 con catálogos, recibo en PDF, cartera vencida y evaluación

- HT-10: escenarios k6 a 20 y 50 usuarios, stack de evaluación y extracción de métricas ISO/IEC 25023.
- HU-41, HU-44: recibo en PDF y reporte de cartera vencida en CSV y PDF.
- HU-46, HU-47, HU-40: catálogos editables, datos de contacto del cliente y recordatorio de cuotas.
- Correcciones de la aceptación de S8.

Refs: HT-10, HU-47, HU-41, HU-46, HU-40, HU-44
EOF
```

Pide al desarrollador el push y la etiqueta `v1.0.0-rc.1`.

## 9. Fase 5 — Evaluación, entrega y cierre

### T19. Despliegue de `v1.0.0-rc.1` (sesión principal + desarrollador, 04/01)

- El desarrollador aprueba el despliegue; prueba de humo; `flujo-principal.spec.ts` contra el
  servidor con el cliente de PRUEBA de S8 (el recibo se anula al terminar). Desde aquí, congelamiento.

### T20. Medición (sesión principal + desarrollador, HT-10, 05/01)

Sigue D2 paso a paso; cada comando lo propone la sesión principal y lo ejecuta el desarrollador.

1. Respaldo del día verificado (`restic snapshots`) y aviso a Oasis de la ventana.
2. La billetera fría otorga `REGISTRADOR_ROLE` a la cuenta de evaluación (fondeada con POL de Amoy).
3. `docker compose -p oasis stop` (stack real) y arranque del stack de evaluación con `compose.eval.yaml`.
4. Siembra (`sembrar-evaluacion.ts`) y conteos.
5. `medir.sh` desde la máquina externa: tres repeticiones de cada escenario a 20 y 50 VUs.
6. `metricas-iso.mjs` contra Prometheus y la base de evaluación; resultados en
   `docs/evaluacion/desempeno/`.
7. **Capturas para los manuales** sobre el stack de evaluación (datos sintéticos, D11).
8. `down -v` del stack de evaluación; la billetera fría revoca el rol de la cuenta de evaluación.
9. Arranque del stack real y prueba de humo; conteos de la base real iguales a los de antes.

### T21. Informe de desempeño (`documentacion`, HT-10)

- `docs/evaluacion/desempeno/informe-desempeno.md`: entorno (VPS-1, versión, datos sintéticos y su
  volumen), método (escenarios, repeticiones, fórmulas de D4), resultados por métrica y escenario
  contra su umbral (cumple o no), latencia de anclaje y gas medio, gráficas, amenazas a la validez
  (una sola máquina de carga, red pública, Amoy compartida) y conclusiones. Es el insumo del
  Capítulo IV.

### T22. Manuales finales (`documentacion`, HT-11)

- Capturas de T20 en los marcadores de T3, revisión con `humanizador-es` y PDF para Oasis.

### T23. Capacitación (desarrollador + personal de Oasis, HT-11, 06/01)

- Según D12; la sesión principal prepara la agenda y la plantilla del registro, y redacta el registro
  desde las notas del desarrollador.

### T24. Acta de entrega (`documentacion` + desarrollador, HT-11, 07/01)

- Según D13; el desarrollador recoge la firma de la gerencia de Oasis.

### T25. Paso a producción (sesión principal + desarrollador, 07/01)

- Correcciones bloqueantes de la capacitación, si las hay, en un `fix` con su prueba (D17).
- El desarrollador crea la etiqueta `v1.0.0` y aprueba el despliegue; prueba de humo;
  `compose.monitoring` se detiene (D14); respaldo del día verificado.

### T26. Informe del sprint y del proyecto, commit 2 (sesión principal, 08/01)

- `docs/sprints/sprint-s9.md` completa **Evaluación** (resumen del informe de desempeño), **Entrega**
  (capacitación, acta, `v1.0.0`) y **Resumen del proyecto**: historias terminadas por sprint, horas de
  backlog por sprint y totales, deuda abierta con su destino como trabajo futuro, lista de ADR y los
  PNG y `.docx` pendientes desde S1 resueltos o declarados fuera del repositorio.

```bash
git add docs/
git commit -m "docs(docs): registrar la evaluación de desempeño, la entrega y el cierre del proyecto"
```

Sin push. Mensaje final: resumen de la verificación, acciones del autor, título y cuerpo del PR.

## 10. Acciones del autor e hitos

- Push y etiqueta `v1.0.0-rc.1` el 04/01; push del commit 2; etiqueta `v1.0.0` el 07/01.
- Conducir la medición (05/01), la capacitación (06/01) y la entrega (07/01); recoger las firmas.
- Trasladar el informe de desempeño al Capítulo IV de la tesis.
- Cerrar el backlog (estado final de cada historia) y agregar a la tabla 11-1 cualquier ADR nuevo.
- Aprobar el punto de control, PR y aceptación del Product Owner.

## 11. Riesgos

| #   | Riesgo                                    | Respuesta                                                                                                                              |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Muchas incidencias de S8                  | D1: freno con `grilling`; ceden HU-40 y HU-46 (BAJA) antes que HT-10 o HT-11.                                                          |
| R2  | El VPS no soporta 50 VUs                  | Es un resultado válido: PCa-2-G informa el máximo alcanzado y el informe lo discute; no se cambia el hardware a mitad de la medición.  |
| R3  | Oasis no puede el 06/01 o el 07/01        | Capacitación y entrega el 07/01 y 08/01; si se pasa del 08/01, el acta se firma después y el informe lo declara.                       |
| R4  | La medición se alarga fuera de la ventana | El stack real se arranca a la hora acordada aunque falten repeticiones; las que falten se repiten otra noche y el informe lo declara.  |
| R5  | El stack de evaluación toca datos reales  | Proyecto, volúmenes y `.env` propios; `medir.sh` comprueba el nombre del proyecto antes de cada paso; conteos antes y después (T20.9). |

## 12. Trazabilidad criterio → evidencia

| Criterio                           | Evidencia esperada                                                          |
| ---------------------------------- | --------------------------------------------------------------------------- |
| HT-10.1 escenarios con 20 y 50 VUs | `infra/k6/*.js`; resultados exportados                                      |
| HT-10.2 seis métricas ISO          | `resultados-<fecha>.json`; `informe-desempeno.md`                           |
| HT-10.3 latencia de anclaje y gas  | `metricas-iso.mjs`; `informe-desempeno.md`                                  |
| HT-10.4 exportados y contrastados  | `docs/evaluacion/desempeno/` (commit 2)                                     |
| HU-47.1–HU-47.3                    | `contacto-cliente.e2e-spec.ts`; `portal-cuenta.spec.ts`                     |
| HT-11.1 manual por rol             | `docs/manuales/manual-{administrador,operador,cliente}.md`                  |
| HT-11.2 manual técnico             | `docs/manuales/manual-tecnico.md`                                           |
| HT-11.3 capacitación               | `docs/evaluacion/capacitacion-2027-01-06.md`                                |
| HT-11.4 acta de entrega            | `docs/evaluacion/acta-entrega.md`                                           |
| HU-41.1–HU-41.3                    | `recibo-pdf.e2e-spec.ts`; `recibo-pdf.spec.ts`                              |
| HU-46.1–HU-46.3                    | `catalogos.e2e-spec.ts`; `catalogos.spec.ts`                                |
| HU-40.1–HU-40.3                    | `enviar-recordatorios-cuotas.use-case.spec.ts`; `recordatorios.e2e-spec.ts` |
| HU-44.1–HU-44.3                    | `cartera-vencida.e2e-spec.ts`; specs del agrupado                           |

## 13. Horas de backlog

| Historia  |  Horas |
| --------- | -----: |
| HT-10     |     14 |
| HU-47     |      3 |
| HT-11     |     10 |
| HU-41     |      5 |
| HU-46     |      4 |
| HU-40     |      3 |
| HU-44     |      5 |
| **Total** | **44** |

## 14. Prompt de arranque

```text
Eres la sesión principal del Sprint S9 del SRPP, el último del proyecto. Ejecuta
docs/sprints/sprint-s9-plan.md de principio a fin con subagent-driven-development, siguiendo sus
reglas (sección 0) y sus decisiones (sección 2), que no se reabren. El calendario manda: commit 1 el
04/01, medición el 05/01, capacitación el 06/01 y entrega el 07/01.

1. Lee AGENTS.md, CLAUDE.md, apps/api/src/modules/README.md y el plan completo. Invoca
   subagent-driven-development y ponytail. Abre el ledger en .superpowers/sdd/sprint-s9-plan/.
2. Fase 0 (T0): incidencias de S8 primero (D1), rama, línea base y fechas con Oasis.
3. Fase 1: en un mismo mensaje, @contrato-shared con T1–T2 y @documentacion con T3. Cierra la fase.
4. Fase 2: en un mismo mensaje, @backend-api con T4–T8 e @infra con T9–T10. Cierra la fase.
5. Fase 3: @frontend-spa con T11–T12, con el resumen de la API. Cierra la fase.
6. Fase 4: @verificador con T13; @revisor con T14; T15 DoD; T16 capturas y DETENTE en el punto de
   control; con mi «aprobado», @documentacion con T17 y tú T18 (commit 1). Pídeme el push y la
   etiqueta v1.0.0-rc.1.
7. Fase 5: T19 y T20 conmigo en el servidor (tú propones, yo ejecuto); @documentacion con T21, T22 y
   T24; T23 la conduzco yo; T25 conmigo; T26 con el commit 2 solo de documentación.

Ninguna credencial ni dato personal de los clientes de Oasis pasa por ti. Commits sin atribuciones y
sin push.
```
