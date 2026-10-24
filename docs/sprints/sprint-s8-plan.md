# Sprint S8 — Plan de implementación

- **Historias:** HT-07 Instrumentación y monitoreo (8 h), HT-08 Endurecimiento de seguridad (9 h),
  HU-43 Reporte de conciliación por aseguradora (6 h), HU-52 Proteger las cuentas del personal
  (5 h), HT-09 Pruebas de aceptación con Oasis Seguros (12 h), HU-21 Exportar pagos a CSV (4 h) y
  HU-30 Panel de indicadores (6 h).
- **Horas:** 50 h de backlog. El informe reporta solo las horas de backlog (D24). HT-07, HT-08 y
  HU-30 parten de lo que dejó el scaffold (sección 3).
- **Épicas:** EP-08 (HT-07, HT-09), EP-07 (HT-08), EP-09 (HU-43), EP-01 (HU-52), EP-04 (HU-21) y
  EP-06 (HU-30).
- **Fechas:** 14/12/2026 – 25/12/2026 (tabla 6-1; el 25/12 es feriado). **Despliegue para la
  aceptación: lunes 21/12. Sesión de aceptación con el personal: martes 22/12.**
- **Rama:** `feat/sprint-s8-seguridad-aceptacion`. **Hasta tres commits** (D22) y un solo PR.
- **Ejecuta:** la sesión principal con `subagent-driven-development` y los agentes de área de
  `.opencode/agents/` (sección 0.1). Los pasos en producción los ejecuta el desarrollador (S7 D18).
- **Decisiones acordadas con el desarrollador:** 23/10 y 24/10/2026, en sesiones de grilling
  (sección 2).

Este documento es el Sprint Backlog de S8. Las reglas generales están en `AGENTS.md`, el mapa
técnico en `CLAUDE.md` y las reglas de los módulos del API en `apps/api/src/modules/README.md`.
Cada agente lee los tres antes de empezar. La fuente de verdad está en `docs/referencia/`, que no se
edita: si algo de este plan la contradice, gana la referencia; detente y repórtalo.

**Cómo leer las tareas.** Cada tarea indica su **agente**, sus **archivos**, sus **skills**, el
comportamiento esperado, los casos borde, las pruebas que se escriben primero y su verificación. Los
bloques **Ejemplo (orientativo)** muestran la forma o la parte delicada; se adaptan al código real.

## 0. Reglas de ejecución

1. La sesión principal ejecuta las fases en orden: 0 → 1 → 2 → 3 → 4 → 5 → 6. Ningún agente arranca
   una fase por su cuenta. **El calendario manda:** todo lo que el personal usará en la aceptación
   debe estar desplegado el 21/12.
2. TDD en toda lógica nueva (`test-driven-development`): primero la prueba en rojo, luego el código.
   Antes de cerrar una fase, la sesión principal usa `verification-before-completion` y guarda la
   salida en el ledger.
3. Cada agente invoca al empezar las skills de su tarea en el orden de `AGENTS.md`: proceso →
   tecnología → `ponytail` decide el tamaño.
4. Tras cambiar `packages/shared/src`: `pnpm --filter @oasis/shared build` y borrar
   `apps/web/node_modules/.vite`.
5. Nunca se edita `docs/referencia/`.
6. **Commits (D22):** commit 1 (T20, código), commit 2 (T25, solo documentación) y, si hace falta,
   commit 3 (T26, correcciones de la aceptación). Los hace la sesión principal, sin líneas de
   atribución; antes, `git config user.name` debe ser `JohannCaizaguano`. **Sin push ni PR**: los
   hace el usuario.
7. No se adelanta trabajo de otros sprints; lo que exceda el alcance va como deuda al informe.
8. Comentarios solo para el porqué no obvio. Simplificaciones deliberadas con `ponytail:` (techo y
   salida).
9. En la fase paralela cada agente compila y prueba **solo su paquete** (`pnpm --filter …`); nadie
   ejecuta `pnpm -r build` ni `pnpm install` hasta que la sesión principal cierre la fase.
10. Las dependencias nuevas las instala **la sesión principal** en T0 (D21): los agentes no editan
    `package.json` ni el lockfile.
11. **Acciones en producción:** como en S7 (D18 de S7), la sesión principal propone cada comando, el
    desarrollador lo ejecuta y la salida se verifica antes del siguiente. Ninguna credencial pasa por
    la IA y ningún dato personal de los clientes de Oasis entra al ledger ni a los informes.
12. **Punto de control antes del commit 1 (D23):** la sesión principal se detiene en T18, presenta las
    capturas y espera un «aprobado» explícito.

### 0.1 Agentes y coordinación

| Agente            | Edita                                                              | Fases   | Tareas                     |
| ----------------- | ------------------------------------------------------------------ | ------- | -------------------------- |
| sesión principal  | archivos raíz, ledger                                              | 0–6     | T0, T17, T18, T20–T23, T25 |
| `contrato-shared` | `packages/shared/src/` (salvo `abi/`), `apps/web/src/contratos/`   | 1       | T1–T3                      |
| `documentacion`   | `docs/` (salvo `referencia/`), `CLAUDE.md`, `AGENTS.md`, READMEs   | 1, 4, 6 | T4, T19, T24               |
| `backend-api`     | `apps/api/src/`, `apps/api/prisma/`                                | 2, 4, 6 | T5–T10, T26                |
| `infra`           | `infra/`, `compose.*.yaml`, `Dockerfile`s, `Caddyfile`, `.github/` | 2, 4    | T11, T12                   |
| `frontend-spa`    | `apps/web/src/` (salvo `contratos/`)                               | 3, 4, 6 | T13, T14, T26              |
| `verificador`     | `apps/api/test/`, `apps/web/e2e/`                                  | 4, 6    | T15, T26                   |
| `revisor`         | nada (solo su nota del ledger)                                     | 4       | T16                        |
| desarrollador     | producción, sesión con Oasis, acta                                 | 5, 6    | pasos de T21–T23           |

```text
Semana 1 (14–18/12)
  Fase 0  sesión principal ── T0 arrastre de S7, rama, dependencias, variables, línea base
  Fase 1  contrato-shared ── T1 → T2 → T3        documentacion ── T4 (en paralelo)
  Fase 2  ┌ backend-api ── T5 → T6 → T7 → T8 → T9 → T10
          └ infra ── T11 → T12
  Fase 3  frontend-spa ── T13 → T14
Semana 2 (21–25/12)
  Fase 4  verificador ── T15 · revisor ── T16 → correcciones · sesión principal ── T17 DoD,
          T18 capturas y PUNTO DE CONTROL · documentacion ── T19 · sesión principal ── T20 COMMIT 1
          ── el desarrollador hace push y etiqueta v0.8.0 (lunes 21/12) ──
  Fase 5  T21 despliegue, flujo principal contra producción con datos de PRUEBA y ZAP (21/12)
          T22 importación de los datos reales por el personal de Oasis (21/12 o inicio del 22/12)
          T23 sesión de aceptación (22/12)
  Fase 6  documentacion ── T24 acta, incidencias, ZAP y ASVS · sesión principal ── T25 COMMIT 2 (docs)
          dueños + verificador ── T26 correcciones bloqueantes → COMMIT 3 (fix), si hace falta
```

**Por qué la Fase 4 entra en la semana 2.** El commit 1 debe existir el lunes 21/12 por la mañana
para que el despliegue esté listo esa tarde. Si la semana 1 termina antes, la Fase 4 se adelanta: lo
que no se mueve es el despliegue del 21/12 y la sesión del 22/12.

**Traspasos.** Cada agente cierra su tarea con una nota en `.superpowers/sdd/sprint-s8-plan/<agente>.md`
(qué hizo, salida resumida de sus comandos, desvíos con su motivo y lo que necesita el siguiente) y
responde a la sesión principal con un resumen corto.

**Fronteras.** Si un agente necesita un cambio fuera de su carpeta, no lo hace: lo anota y la sesión
principal relanza al dueño. Si el `verificador` encuentra un bug de producto, deja la prueba en rojo
como evidencia.

**Frenos.** Si una decisión de la sección 2 deja de ser viable, la sesión principal se detiene e
invoca `grilling` con su recomendación. Los agentes no reabren decisiones.

### 0.2 Skills por tarea

| Momento                        | Agente            | Skills                                                                                                                              |
| ------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Todo el sprint                 | sesión principal  | `subagent-driven-development`, `ponytail`, `verification-before-completion`; `grilling` solo como freno                             |
| Toda lógica nueva              | todos             | `test-driven-development`                                                                                                           |
| Fallo o prueba roja inesperada | todos             | `systematic-debugging`                                                                                                              |
| T1–T3 esquemas                 | `contrato-shared` | `zod`, `typescript-advanced-types`, `vitest`                                                                                        |
| T4, T19 y T24 documentación    | `documentacion`   | `humanizador-es` al final de cada documento                                                                                         |
| T5 migración                   | `backend-api`     | `prisma-cli`, `prisma-client-api`                                                                                                   |
| T6–T10 API                     | `backend-api`     | `nestjs-best-practices`, `nodejs-best-practices`, `nodejs-backend-patterns`, `prisma-client-api`                                    |
| T11–T12 monitoreo y ZAP        | `infra`           | `bash-defensive-patterns`                                                                                                           |
| T13–T14 SPA                    | `frontend-spa`    | `react-best-practices`, `react-hook-form`, `impeccable` (`craft`, `harden`, `polish`), `dataviz` (panel), `accessibility`, `vitest` |
| T15 e2e y Playwright           | `verificador`     | `playwright-best-practices`, `nestjs-best-practices`                                                                                |
| T16 revisión                   | `revisor`         | `ponytail-review`, `security-review` (diff), `accessibility`                                                                        |
| T26 correcciones               | dueños            | `systematic-debugging`, `test-driven-development`                                                                                   |

**`impeccable`.** Manda `apps/web/DESIGN.md`. El campo de código de un solo uso, los códigos de
recuperación y el panel de indicadores siguen sus secciones correspondientes; el panel usa
`dataviz` solo para la jerarquía de las cifras (sin gráficos decorativos, D15).

**Sin worktrees ni commits por tarea.** Ledger y capturas en `.superpowers/sdd/sprint-s8-plan/`
(ignorado por git).

## 1. Alcance

### HT-07 — Instrumentación y monitoreo (RNF-05, RNF-06, RNF-38)

- El API expone `/metrics` con histogramas de tiempo por ruta, solo en la red interna.
- `compose.monitoring` levanta Prometheus, Grafana, cAdvisor y node-exporter.
- Grafana tiene un tablero provisionado y no expone puertos públicos.
- Eventos de seguridad (logins fallidos, 401, 403 y 429, cambios de contraseña, rol y segundo
  factor) con su `requestId` y sin datos personales ni secretos.
- Alertas por correo ante picos de logins fallidos o de respuestas 403 y 429.

### HT-08 — Endurecimiento de seguridad (RNF-09 a RNF-13, RNF-35, RNF-36)

- Helmet y Caddy aplican cabeceras de seguridad.
- Se verifican los límites de tasa en login y en la verificación de recibos.
- Ningún secreto versionado; validaciones, rechazos y anulaciones registran usuario y fecha.
- CSP de Caddy con `frame-ancestors 'none'`, `Permissions-Policy` y `Cross-Origin-Opener-Policy`.
- ZAP base contra el sistema desplegado sin alertas de riesgo alto ni medio.
- Contadores del límite en Redis (`@nest-lab/throttler-storage-redis`).
- Revisión registrada contra OWASP ASVS 5.0, nivel 2.

### HU-43 — Reporte de conciliación por aseguradora (RF-48)

- Filtro por aseguradora y rango de fechas.
- Póliza, cliente, fecha, monto y código de recibo de cada pago, con totales.
- Exportación a CSV y a PDF.

### HU-52 — Proteger las cuentas del personal (RF-58, RNF-41)

- Contraseñas del personal de ≥ 12 caracteres y puntuación ≥ 3 en zxcvbn-ts con diccionario en
  español.
- El ADMIN activa TOTP (otplib) y recibe códigos de recuperación de un solo uso guardados con argon2.
- El login del ADMIN exige el código TOTP y respeta el límite de intentos.
- Correo cuando cambian la contraseña, el rol o el segundo factor.

### HT-09 — Pruebas de aceptación con Oasis Seguros (RNF-23)

- Playwright cubre el flujo principal en Chromium, Firefox y WebKit.
- Se cargan los datos reales iniciales de clientes, aseguradoras y pólizas.
- La sesión de aceptación queda registrada en un acta.
- Las incidencias se corrigen o se registran en el backlog.

### HU-21 — Exportar pagos a CSV (RF-23, RNF-37)

- La exportación respeta los filtros aplicados.
- UTF-8 que Excel abre correctamente.
- Celdas que empiezan con `=`, `+`, `-`, `@`, tabulación o retorno de carro, neutralizadas.

### HU-30 — Panel de indicadores (RF-35)

- Pagos por validar, pagos validados del mes, recibos anclados y fallidos.
- Cada indicador enlaza a su listado filtrado.

### Deuda que entra por historia

- Límite de la verificación en memoria (S5 D4) → HT-08 (D5).
- Carreras de desactivación y login (deuda de S2 y S3) → HT-08 (D6).

### Fuera de alcance (no implementar)

- Pruebas de carga y métricas ISO 25023 (HT-10, S9); PDF del recibo (HU-41, S9), que reutilizará el
  generador de PDF de HU-43; cartera vencida (HU-44, S9).
- Segundo factor para el OPERADOR (el criterio lo pide solo para el ADMIN).

## 2. Decisiones tomadas (no reabrir)

| #   | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Motivo                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Eventos de seguridad (HT-07)**: interceptor y filtro de excepciones registran con pino `{ evento: 'seguridad', tipo, requestId, ruta, metodo, usuarioId?, ipRed }`, con `tipo` en `LOGIN_FALLIDO`, `NO_AUTENTICADO` (401), `PROHIBIDO` (403), `LIMITE` (429), `CAMBIO_CONTRASENA`, `CAMBIO_ROL`, `CAMBIO_SEGUNDO_FACTOR` y `RESTABLECER`. `ipRed` es la IP truncada (/24 en IPv4, /48 en IPv6); nunca correo, nombre, identificación ni el cuerpo de la petición. La redacción de pino suma `req.body.codigo`, `req.body.codigoRecuperacion` y `req.body.token`. Contador Prometheus `oasis_eventos_seguridad_total{tipo}` en el API.                                                                                                                                                                                                                                                                                                                                                                                                                          | Criterio sin datos personales; las alertas leen métricas, no logs.                                                                            |
| D2  | **Alertas (HT-07)**: reglas de Grafana provisionadas (`infra/monitoring/grafana/provisioning/alerting/`): `rate(oasis_eventos_seguridad_total{tipo="LOGIN_FALLIDO"}[5m]) * 300 > 20` y la misma forma con `tipo=~"PROHIBIDO\|LIMITE"` y umbral 50, con 5 min de pendiente; punto de contacto por correo con el SMTP de Brevo (`GF_SMTP_*`) al correo del autor y al de la gerencia de Oasis (lo da el desarrollador). Grafana sin puertos públicos: se accede con un túnel SSH (`ssh -L 3001:localhost:3001`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Criterio literal; umbrales iniciales ajustables tras la aceptación.                                                                           |
| D3  | **Monitoreo en el VPS**: `compose.monitoring.yaml` se despliega junto a producción con límites de recursos (Prometheus 256 MB, Grafana 256 MB, cAdvisor 128 MB, node-exporter 64 MB), retención de Prometheus de 15 días y los endurecimientos de HT-05 donde la imagen lo permita (cAdvisor y node-exporter necesitan montajes de solo lectura del host; se documentan como excepción).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Medición de HT-10 sobre el entorno real.                                                                                                      |
| D4  | **Cabeceras (HT-08)**: en `apps/web/Caddyfile`: `Content-Security-Policy` con `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS de 1 año con `includeSubDomains` y `X-Content-Type-Options: nosniff`. Helmet en el API alineado (sin valores contradictorios). Si un componente necesita `style-src 'unsafe-inline'` (estilos en línea de Radix), se mide y se documenta como excepción en el ASVS. `blob:` en `img-src` lo pide la vista del comprobante (S7).                                                                                                                                                                                                   | Criterio literal.                                                                                                                             |
| D5  | **Límite en Redis**: `ThrottlerModule` con `ThrottlerStorageRedisService` sobre el cliente Redis existente; el `LimitePorUsuarioGuard` de S5 usa el mismo storage. Límites verificados en e2e: login (S2), recuperación (S7), verificación 30/min por usuario (S5) y TOTP 5 intentos por 15 min por usuario (D9). Se retira el `ponytail:` de S5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Sobrevive a reinicios y a más de una instancia.                                                                                               |
| D6  | **Carreras pendientes** (deuda de S2 y S3): (a) dos ADMIN que se desactivan a la vez → `SELECT … FOR UPDATE` sobre los ADMIN activos en `prisma-usuarios.repository.ts` dentro de la transacción (se retira el `ponytail:`); (b) login concurrente con la desactivación → el login comprueba `activo` **después** de crear la sesión en Redis y la revoca si el usuario se desactivó entre medias; prueba de concurrencia.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Endurecimiento antes de la evaluación.                                                                                                        |
| D7  | **ASVS 5.0 nivel 2**: `docs/seguridad/asvs-5.0-l2.md` con cada requisito aplicable, su estado (cumple, no aplica, excepción) y la evidencia (archivo, prueba o ADR); las excepciones con motivo y riesgo. ZAP base (`zaproxy/zap-stable`, `zap-baseline.py -t https://<dominio> -c infra/zap/reglas.tsv`) se ejecuta contra producción **después** del despliegue del 21/12 y su informe va a `docs/seguridad/zap-<fecha>.md`. Las alertas altas o medias se corrigen; las informativas se anotan.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Criterio literal.                                                                                                                             |
| D8  | **Contraseñas robustas (HU-52)**: para ADMIN y OPERADOR, en crear usuario, restablecer, cambiar y recuperar: longitud ≥ 12 y `zxcvbn(contraseña, [email, nombre, 'oasis', 'seguros']).score >= 3` con los diccionarios común y español. Se valida **en el API** (fuente de verdad, módulo `auth`, puerto `EvaluadorContrasenaPort`) y la SPA muestra un medidor con carga diferida. El CLIENTE conserva la política vigente. Como las contraseñas están en hash y no se puede saber cuáles cumplen, la migración pone `debeCambiarContrasena = true` a **todo el personal**, antes del 22/12.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Criterio literal; el diccionario no infla el bundle inicial (grilling del 24/10).                                                             |
| D9  | **TOTP (HU-52, ADR-027)**, **obligatorio solo para el ADMIN**: columnas `Usuario.totpSecretoCifrado` (AES-256-GCM con `TOTP_ENC_KEY` de 32 bytes del entorno del API) y `totpActivadoEn`; tabla `CodigoRecuperacion` (`usuarioId`, `hash` argon2id, `usadoEn`). Alta: `POST /auth/2fa/iniciar` (secreto nuevo y `otpauth://` con emisor «Oasis Seguros», QR generado en el servidor como data URL) → `POST /auth/2fa/activar { codigo }` (ventana ±1 paso) → 10 códigos de recuperación de 10 caracteres mostrados una vez. Login del ADMIN con TOTP: la contraseña correcta devuelve `{ requiereSegundoFactor: true, desafio }` (JWT de 5 min con `typ: 'mfa'`, sin sesión) y `POST /auth/2fa/verificar { desafio, codigo \| codigoRecuperacion }` crea la sesión; 5 intentos por 15 min. ADMIN **sin** TOTP: tras el login solo puede usar `/auth/2fa/*`, `/auth/me` y `/auth/logout` (mismo patrón de guard de S6 D2) hasta activarlo. Desactivar o restablecer el TOTP de otro ADMIN es una acción del ADMIN, auditada. El OPERADOR no tiene segundo factor. | Criterio «exige el código»; nunca hay un ADMIN operando sin segundo factor (grilling del 24/10).                                              |
| D10 | **Correos de seguridad (HU-52)**: plantillas `contrasena-cambiada`, `rol-cambiado` y `segundo-factor-cambiado` (activado, desactivado, códigos regenerados), con fecha, IP truncada y la indicación «Si no fue usted, contacte al administrador». Se encolan tras el commit desde los casos de uso que ya existen (cambiar contraseña, restablecer, cambiar rol, 2FA).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Criterio literal.                                                                                                                             |
| D11 | **Conciliación (HU-43)**: `GET /reportes/conciliacion?aseguradoraId&desde&hasta&formato=json\|csv\|pdf` (ADMIN y OPERADOR): pagos VALIDADOS por `validadoEn` en el rango (fecha de Guayaquil), con póliza, cliente, fecha de pago, monto y código de recibo, y totales (cantidad, suma). Módulo `reportes` (hasta ahora vacío). JSON paginado para la pantalla; CSV y PDF con **todas** las filas del filtro (límite 10 000; más → 422 `REPORTE_DEMASIADO_GRANDE`). Los pagos ANULADOS (S6) no cuentan.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Criterio literal.                                                                                                                             |
| D12 | **CSV (HU-21 y HU-43, ADR-028)**: utilidad `infrastructure/csv/escribir-csv.ts` con BOM UTF-8, separador `;` y coma decimal (Excel en es-EC), comillas dobles escapadas, saltos `\r\n` y **neutralización**: toda celda de texto que empiece con `=`, `+`, `-`, `@`, `\t` o `\r` se antepone con `'`. Los montos se escriben como número con coma decimal (no hay montos negativos; una prueba lo fija). Respuesta en flujo (`StreamableFile`) con `Content-Disposition: attachment; filename="pagos-AAAAMMDD.csv"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Excel de Ecuador usa `;`; criterio de inyección de fórmulas.                                                                                  |
| D13 | **PDF (HU-43; lo reutilizan HU-41 y HU-44 en S9)**: `pdfkit` en `infrastructure/pdf/` con la identidad de Oasis (isologo, Outfit y Figtree en TTF incluidas en `apps/api/assets/fuentes/`, encabezado de noche con filo dorado, tabla con filas alternas en arena, cifras tabulares, pie con fecha de emisión, usuario y número de página). Un `GeneradorPdfPort` con plantillas por reporte.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Una sola forma de generar PDF para los tres reportes.                                                                                         |
| D14 | **Exportar pagos (HU-21)**: `GET /pagos/exportar` con **el mismo** `listarPagosQuerySchema` (sin paginación), el mismo orden (S5 D15) y un límite de 50 000 filas, leído por lotes de 1 000; columnas: código de recibo, póliza, cliente, aseguradora, fecha, monto, método, referencia, estado, validado por y fecha de validación. La SPA arma la URL desde los filtros actuales (S5 los dejó en la URL). Auditado como `EXPORTAR` sobre `Pago` (acción nueva) con los filtros en el detalle.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Criterio literal; la exportación de datos personales queda trazada.                                                                           |
| D15 | **Indicadores (HU-30)**: `GET /indicadores` (ADMIN) con `{ pagosPorValidar, pagosValidadosMes, recibosAnclados, recibosFallidos }` en cuatro `count` en `Promise.all`; mes calendario de Guayaquil. El inicio del ADMIN muestra cuatro cifras (Outfit 32 px), la de «Por validar» en panel de noche (The Task First Rule), cada una con enlace: `/pagos?estado=REGISTRADO`, `/pagos?estado=VALIDADO&desde=<1.º del mes>`, `/recibos?estado=ANCLADO` y `/recibos?estado=FALLIDO`. `RecibosPage` lee el estado de la URL igual que `PagosPage`. Sin gráficos decorativos.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Criterio literal y DESIGN.md.                                                                                                                 |
| D16 | **Navegadores (HT-09)**: Playwright con los proyectos `chromium`, `firefox` y `webkit` en `apps/web/playwright.config.ts`. El **flujo principal** (`flujo-principal.spec.ts`): login del operador → registrar pago → validar → recibo anclado → verificación del cliente con su QR → impresión. Corre en los tres navegadores en la CI (job con `pnpm exec playwright install --with-deps`). Contra producción se corre **una sola vez, antes de importar los datos reales**, con un cliente y una póliza de prueba llamados «PRUEBA — no usar»; al terminar, el recibo se anula (HU-27) y el cliente se desactiva.                                                                                                                                                                                                                                                                                                                                                                                                                                              | El criterio pide evidencia sobre el sistema real sin mezclarla con datos reales; RN-09 conserva los registros de prueba (grilling del 24/10). |
| D17 | **Sesión de aceptación** (22/12, 2 h, presencial o videollamada con pantalla compartida): guion por rol en `docs/evaluacion/guion-aceptacion.md` con cada criterio de las historias de S2 a S8 agrupado por tarea del día del personal (no por historia); el personal ejecuta y el autor anota en el acta `docs/evaluacion/acta-aceptacion-2026-12-22.md` (asistentes, fecha, resultado por paso, incidencias con severidad). Las incidencias bloqueantes se corrigen en S8 si caben (T26); las demás van a `docs/evaluacion/incidencias-aceptacion.md` con su destino, y el autor las agrega al backlog (que los agentes no editan).                                                                                                                                                                                                                                                                                                                                                                                                                            | Criterio literal y trazabilidad del Capítulo IV.                                                                                              |
| D18 | **Pruebas:** TDD del evaluador de contraseñas, TOTP (con reloj fijo), códigos de recuperación, CSV (neutralización y formato), agregados de indicadores y del reporte, eventos de seguridad (sin datos personales) y carreras; e2e `segundo-factor`, `contrasenas-personal`, `reportes`, `exportar-pagos`, `indicadores`, `limites-redis` (reiniciar la app conserva el contador) y `cabeceras` (contra `prod-local`); Playwright `flujo-principal.spec.ts` en tres navegadores, `segundo-factor.spec.ts`, `reportes.spec.ts` y `diseno.spec.ts` extendido.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Evidencia por criterio (sección 13).                                                                                                          |
| D19 | **Correo de la gerencia y hora de la sesión**: el desarrollador da en T0 el correo de la gerencia de Oasis para las alertas (D2) y la hora de la sesión del 22/12. Ninguno se versiona: el correo va en el entorno del servidor (`GF_ALERT_EMAILS`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Datos que no son del repositorio.                                                                                                             |
| D20 | **Datos reales (HT-09)**: los importa el **personal de Oasis** en producción con su propia cuenta ADMIN y la importación de S6 (HU-34), guiado por el desarrollador con pantalla compartida o en persona, el 21/12 o al inicio de la sesión del 22/12. El desarrollador no manipula los archivos; la bitácora registra a Oasis como autor; el informe solo da conteos (clientes, pólizas, aseguradoras), nunca datos personales. Antes de importar, el ADMIN de Oasis activa su TOTP (D9).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Oasis es responsable del tratamiento y el desarrollador solo encargado técnico (LOPDP; grilling del 24/10).                                   |
| D21 | **Dependencias** (T0): `apps/api` → `@nest-lab/throttler-storage-redis`, `otplib`, `argon2` (si aún no está), `@zxcvbn-ts/core`, `@zxcvbn-ts/language-common`, `@zxcvbn-ts/language-es-es`, `pdfkit`, `@types/pdfkit` (dev) y `qrcode` (para el QR del alta del TOTP y del PDF de HU-41 en S9); `apps/web` → `@zxcvbn-ts/*` (medidor, con import dinámico).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Criterios de HT-08 y HU-52.                                                                                                                   |
| D22 | **Commits**: commit 1 (T20) con el código del sprint, antes del despliegue del 21/12; commit 2 (T25, `docs(docs): …`) con el ZAP, el ASVS completo, el acta y las incidencias; commit 3 (T26, `fix(…): …`), solo si hay incidencias bloqueantes que se corrijan antes del 25/12, con su prueba que falla antes y pasa después, y la actualización de `incidencias-aceptacion.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | La evidencia llega después del código (grilling del 24/10).                                                                                   |
| D23 | **Punto de control visual** antes del commit 1 (T18): capturas a 1280 y 360 px de las pantallas nuevas y de los correos de seguridad.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Grilling del 24/10.                                                                                                                           |
| D24 | **Horas:** el informe reporta solo las horas de backlog por historia (sección 14).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Grilling del 24/10.                                                                                                                           |
| D25 | **Entorno (tabla 8-1 de la arquitectura)**: la aceptación se hace en el VPS-1 que funciona como entorno **«Pruebas»** hasta la entrega (S9 D2); los datos reales que Oasis importa (D20) se quedan en él cuando pasa a «Producción» con `v1.0.0`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Grilling del 24/10.                                                                                                                           |

## 3. Estado de partida (a confirmar en T0)

- **HT-07:** `/metrics` excluido en Caddy, interceptor de histogramas por ruta,
  `compose.monitoring.yaml` con los cuatro servicios, tablero provisionado y redacción de pino.
  Faltan D1 y D2; el monitoreo no está desplegado en el VPS.
- **HT-08:** Helmet en `main.ts`, cabeceras en `apps/web/Caddyfile` con `frame-ancestors 'self'`; sin
  `Permissions-Policy` ni COOP; throttler en memoria. gitleaks y secretlint desde S4.
- **HU-30:** `PanelPersonal.tsx` con conteos genéricos. `modules/reportes/` solo con `.gitkeep`.
- **HT-09:** Playwright solo con `chromium`; `flujo-completo.spec.ts` existente (se reutiliza o se
  convierte en `flujo-principal.spec.ts`).
- **Producción:** S7 desplegado, con su evidencia en `sprint-s7.md` (si no, R1).

## 4. Fase 0 — Preparación (sesión principal)

### T0. Arrastre de S7, rama, dependencias, variables y línea base

1. **Arrastre:** lee `docs/sprints/sprint-s7.md`; si el despliegue de S7 quedó pendiente, sus T19,
   T24 y T25 abren este sprint (R1). Si trae historias completas, detente e invoca `grilling`.
2. **Rama** `feat/sprint-s8-seguridad-aceptacion` desde `main` con S7 fusionado. Si `main` tiene
   cambios sin commit del desarrollador, detente y pregunta.
3. **Dependencias** de D21 (versiones exactas, anotadas en el ledger).
4. **Variables:** `TOTP_ENC_KEY` en `.env.example` (con la instrucción `openssl rand -base64 32`) y
   `GF_SMTP_*` y `GF_ALERT_EMAILS` en el ejemplo de entorno del monitoreo.
5. **Datos de la sesión (D19):** pregunta al desarrollador la hora del 22/12, el correo de la gerencia
   para las alertas y si el personal importará el 21/12 o al inicio de la sesión (D20).
6. **Línea base:** `pnpm install --frozen-lockfile`, `pnpm -r build`, `pnpm -r typecheck`,
   `pnpm test`; totales en el ledger. Si algo está rojo, detente.

## 5. Fase 1 — Contratos y documentación (en paralelo)

### T1. Seguridad de cuentas (`contrato-shared`, HU-52; TDD)

- `contrasenaPersonalSchema` (≥ 12; la puntuación la valida el API); esquemas de alta, activación y
  verificación de 2FA; respuesta de login con `requiereSegundoFactor` y `desafio`; `codigoTotpSchema`
  (6 dígitos); `codigoRecuperacionSchema` (10 caracteres); `ESTADOS_SEGUNDO_FACTOR = ['ACTIVO',
'POR_ACTIVAR']` para `EstadoInsignia`; `TIPOS_EVENTO_SEGURIDAD` (D1); acciones `EXPORTAR` y
  `CAMBIAR_SEGUNDO_FACTOR`; plantillas de D10 en `PLANTILLAS_CORREO`.
- **Pruebas primero:** código de 5 o 7 dígitos → error; contraseña de 11 caracteres → error; la
  respuesta de login es una unión discriminada (con sesión o con desafío).

### T2. Reportes, exportación e indicadores (`contrato-shared`, HU-21, HU-30, HU-43; TDD)

- `conciliacionQuerySchema` (con `formato`), `filaConciliacionSchema`, `totalesConciliacionSchema`,
  `indicadoresSchema`; `FORMATOS_REPORTE = ['json', 'csv', 'pdf']`; `listarRecibosQuerySchema` admite
  `estado` (D15).
- **Pruebas primero:** sin `aseguradoraId` → error; `desde > hasta` → error; formato inválido → error.

### T3. Neutralización compartida (`contrato-shared`, HU-21; TDD)

- `neutralizarCeldaCsv(valor)` en `validacion/` (la usan el API y las pruebas).
- **Pruebas primero:** `=SUMA(A1)` → `'=SUMA(A1)`; `+593…` → `'+593…`; `-` → `'-`; `@x` → `'@x`;
  `\tx` y `\rx` neutralizadas; `Juan` intacto; cadena vacía intacta.

### T4. Contraste de ADR, ASVS y guion (`documentacion`)

- ADR-027 (TOTP) y ADR-028 (reportes) ya están redactadas y registradas; se contrastan con D9, D12 y
  D13 (por ejemplo, el TOTP obligatorio solo para el ADMIN) y se ajustan solo si el plan las precisó.
- Esqueleto de `docs/seguridad/asvs-5.0-l2.md` con los capítulos aplicables (V1 a V17 de ASVS 5.0)
  para que T16 y T21 lo completen.
- `docs/evaluacion/guion-aceptacion.md` (D17) y la plantilla del acta.

**Cierre de la Fase 1 (sesión principal):** `pnpm --filter @oasis/shared build` y `test`; borrar
`apps/web/node_modules/.vite`; resumen para la Fase 2.

## 6. Fase 2 — API, monitoreo y cabeceras (en paralelo)

Dos carriles en un mismo mensaje: `backend-api` (T5–T10) e `infra` (T11–T12).

### T5. Migración (`backend-api`)

- `Usuario.totpSecretoCifrado` y `totpActivadoEn`; `CodigoRecuperacion`; `UPDATE "Usuario" SET
"debeCambiarContrasena" = true WHERE rol IN ('ADMIN', 'OPERADOR')` (D8). El seed conserva sus
  usuarios con `debeCambiarContrasena = false` para no romper las e2e.
- **Verificación:** `migrate dev`; `seed` dos veces; `migrate diff` sin deriva.

### T6. Eventos de seguridad y métricas (`backend-api`, HT-07; TDD)

- **Archivos:** `common/seguridad/eventos-seguridad.ts` (registro y contador),
  `common/filters/all-exceptions.filter.ts` (401, 403, 429), los casos de uso de login y de cambios,
  `MetricsModule`, la configuración de redacción de pino.
- **Pruebas primero:** un login fallido registra `LOGIN_FALLIDO` con `requestId` y sin el correo; un
  403 registra `PROHIBIDO`; la IP sale truncada (`190.152.10.0/24`); el contador sube; un cuerpo con
  `codigo` sale como `[Redacted]`.

### T7. Endurecimiento del API (`backend-api`, HT-08; TDD)

- D4 (Helmet), D5 (storage de Redis para el throttler global y el guard por usuario) y D6
  (carreras).
- **Pruebas primero:** el contador del login sobrevive a cerrar y abrir la app (misma instancia de
  Redis); la carrera de dos desactivaciones deja al menos un ADMIN activo (`Promise.all`); un login
  que coincide con la desactivación no deja sesión viva.

### T8. Cuentas del personal (`backend-api`, HU-52; TDD)

- **Archivos:** módulo `auth`: `EvaluadorContrasenaPort` con adaptador zxcvbn-ts (diccionarios
  cargados una sola vez al arrancar), `CifradorSecretosPort` con AES-256-GCM, casos de uso
  `IniciarSegundoFactorUseCase`, `ActivarSegundoFactorUseCase`, `VerificarSegundoFactorUseCase`,
  `RegenerarCodigosUseCase` y `RestablecerSegundoFactorUseCase`; `SegundoFactorPendienteGuard`
  (ADMIN sin TOTP); módulo `usuarios` (correos de D10); `config/env.schema.ts` (`TOTP_ENC_KEY`).
- **Casos borde:** desafío vencido (> 5 min) → 401; desafío usado dos veces → 401; un código TOTP ya
  usado en la misma ventana → rechazado (anti-repetición con Redis `totp:usado:<usuarioId>:<paso>`);
  `TOTP_ENC_KEY` ausente → el API no arranca (validación de entorno).
- **Pruebas primero:** `Oasis2026!` (puntuación baja) → 422 `CONTRASENA_DEBIL` con sugerencias; una
  frase larga → aceptada; TOTP correcto en la ventana ±1 → sesión; fuera → 401; un código de
  recuperación sirve una vez; el 6.º intento → 429; el secreto nunca sale en claro tras activar;
  ADMIN sin TOTP → 403 `SEGUNDO_FACTOR_REQUERIDO` en cualquier ruta salvo las permitidas; cambiar el
  rol de un usuario encola `rol-cambiado`.

**Ejemplo (orientativo):**

```ts
export class CifradorAesGcm implements CifradorSecretosPort {
  constructor(private readonly clave: Buffer) {}
  cifrar(texto: string): string {
    const iv = randomBytes(12);
    const c = createCipheriv('aes-256-gcm', this.clave, iv);
    const datos = Buffer.concat([c.update(texto, 'utf8'), c.final()]);
    return [iv, c.getAuthTag(), datos].map((b) => b.toString('base64url')).join('.');
  }
  descifrar(sobre: string): string {
    const [iv, tag, datos] = sobre.split('.').map((p) => Buffer.from(p, 'base64url'));
    const d = createDecipheriv('aes-256-gcm', this.clave, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(datos), d.final()]).toString('utf8');
  }
}
```

### T9. Reportes, exportación e indicadores (`backend-api`, HU-21, HU-30, HU-43; TDD)

- **Archivos:** módulo `reportes` (`ConciliacionUseCase`, `IndicadoresUseCase`, controladores),
  `infrastructure/csv/escribir-csv.ts` (D12), `infrastructure/pdf/` (D13, con
  `apps/api/assets/fuentes/` e isologo), `GET /pagos/exportar` en `pagos` reutilizando el repositorio
  de listado sin paginar con lectura por lotes (D14), `GET /recibos?estado=`.
- **Pruebas primero:** totales correctos con pagos en el borde del rango (Guayaquil); los ANULADOS no
  cuentan; el CSV abre con BOM y `;` y neutraliza una referencia `=1+1`; el PDF contiene el código de
  recibo (texto extraíble con `pdf-parse` en la prueba) y tantas páginas como corresponde; los
  indicadores del mes no cuentan validados del mes anterior; 10 001 filas → 422.

### T10. Cobertura y cierre del carril (`backend-api`)

- `@Roles`, `@Auditar` y exenciones de las rutas nuevas; `rutas-declaradas`.
- **Cierre:** `pnpm --filter @oasis/api lint`, `typecheck`, `test` y `pnpm deps:check`.

### T11. Monitoreo y cabeceras (`infra`, HT-07, HT-08)

- **Archivos:** `infra/monitoring/grafana/provisioning/alerting/` (reglas y punto de contacto de D2),
  `compose.monitoring.yaml` (D3: límites, retención, `GF_SMTP_*` y `GF_ALERT_EMAILS` desde un archivo
  de entorno del servidor, sin puertos publicados), `infra/scripts/deploy.sh` (despliega también el
  monitoreo), `apps/web/Caddyfile` (D4).
- **Verificación:** en `prod-local`, `curl -I` muestra todas las cabeceras; `promtool check rules`
  sin errores; una alerta de prueba (umbral temporal en 1) llega a Mailpit; `docker compose port`
  de Grafana vacío.

### T12. ZAP (`infra`, HT-08)

- `infra/zap/reglas.tsv` (sin ignorar nada salvo falsos positivos justificados con su motivo) e
  `infra/scripts/zap-baseline.sh` (contenedor efímero; informes HTML y Markdown en un directorio
  temporal). Primero se prueba contra `prod-local`; contra producción se ejecuta en T21.

**Cierre de la Fase 2 (sesión principal):** `pnpm -r build`, `lint`, `format:check`, `typecheck`,
`deps:check`, `deps:check:negativo`, `pnpm test`; `bash infra/scripts/prod-local.sh`; ZAP contra
`prod-local`; resumen de la API para `frontend-spa`.

## 7. Fase 3 — SPA (`frontend-spa`)

Una línea de trabajo, en orden: T13 → T14.

### T13. Contraseñas, segundo factor y estado en usuarios (`frontend-spa`, HU-52; TDD)

- **Archivos:** `components/MedidorContrasena.tsx` (+test, con `import()` diferido de zxcvbn-ts), los
  formularios de crear usuario, cambiar y restablecer contraseña (personal),
  `features/auth/pages/SegundoFactorPage.tsx` (+test, `/cuenta/segundo-factor`),
  `features/auth/components/PasoCodigo.tsx` (tras el login del ADMIN), `router.tsx` (redirección
  del ADMIN sin TOTP), `UsuariosPage.tsx` (insignia del 2FA y acción de restablecerlo).
- **Diseño (DESIGN.md):** campo de código de 60 px en Outfit 26 px con `inputmode="numeric"` y
  `autocomplete="one-time-code"`; QR con el secreto también en texto para copiar; códigos de
  recuperación en rejilla monoespaciada con el aviso «No se volverán a mostrar» y descarga `.txt`.
- **Pruebas primero:** el ADMIN sin 2FA solo puede ir a activarlo; un código de 5 dígitos no se
  envía; tras activar, los códigos se muestran una sola vez; el medidor no se carga en el bundle
  inicial (prueba del import dinámico).

### T14. Reportes, exportación e indicadores (`frontend-spa`, HU-21, HU-30, HU-43; TDD)

- **Archivos:** `features/reportes/pages/ConciliacionPage.tsx` (+test, `/reportes/conciliacion`,
  ítem «Reportes» del riel), `PagosPage.tsx` («Exportar CSV» con los filtros de la URL),
  `features/dashboard/components/IndicadoresAdmin.tsx` (+test, D15), `RecibosPage.tsx` (estado en la
  URL).
- **Conciliación:** filtros (aseguradora y fechas), tabla con totales, «Exportar CSV» y «Exportar
  PDF» como secundarios; la acción dorada de la vista es «Consultar».
- **Pruebas primero:** la URL de exportación lleva exactamente los filtros activos; cada indicador
  enlaza a su listado filtrado; el panel no muestra gráficos.

**Cierre de la Fase 3 (sesión principal):** `pnpm --filter @oasis/web lint`, `typecheck`, `test` y
`build`; `pnpm format:check`.

## 8. Fase 4 — Evidencia, revisión y commit 1

### T15. e2e y Playwright (`verificador`)

- **API:** las e2e de D18; `cabeceras` corre contra `prod-local` (o se verifica con `curl` en
  `prod-local.sh`).
- **Playwright:** proyectos `firefox` y `webkit`; `flujo-principal.spec.ts` en los tres con
  `BASE_URL` configurable (local por defecto); `segundo-factor.spec.ts` (alta con un secreto conocido
  y `otplib` en la prueba para generar el código); `reportes.spec.ts` (descarga del CSV con
  `page.waitForEvent('download')` y verificación de BOM, `;` y neutralización); `diseno.spec.ts`
  suma las pantallas nuevas. Lo que falle solo en un navegador se corrige o se anota con su motivo
  (nunca `skip` sin nota).
- **CI:** el job de Playwright con los tres navegadores lo agrega `infra` en `ci.yml` (la sesión
  principal lo coordina).

### T16. Revisión (`revisor` y dueños)

- Con `security-review` sobre el diff: secretos TOTP cifrados y nunca registrados, desafío MFA sin
  sesión, ventana y anti-repetición del TOTP, límites en Redis, CSV neutralizado, datos personales
  fuera de los eventos, cabeceras, permisos de las rutas de reportes y exportación. Completa en
  `asvs-5.0-l2.md` los requisitos que el diff cubre.
- Una ronda de confirmación como máximo; después se repiten los cierres de las Fases 2, 3 y 4.

### T17. Definición de Terminado (sesión principal)

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

### T18. Capturas y punto de control (sesión principal)

1. Script de Playwright temporal en `.superpowers/sdd/sprint-s8-plan/` (no se versiona), a 1280 y
   360 px: medidor de contraseña, alta del segundo factor (QR, código y códigos de recuperación), paso
   de código tras el login, usuarios con la insignia del 2FA, conciliación con totales, panel de
   indicadores y los tres correos de seguridad en Mailpit. En `capturas/`.
2. **Punto de control (D23):** presenta las capturas (rutas absolutas) y el resultado de T17. Espera
   «aprobado» o ajustes.

### T19. Documentación (`documentacion`)

- **`CLAUDE.md`:** eventos de seguridad, alertas, cabeceras, throttler en Redis, contraseñas del
  personal, TOTP (ADR-027), reportes (ADR-028), exportación auditada e indicadores.
- **`docs/despliegue.md`:** monitoreo en el VPS, túnel a Grafana, `TOTP_ENC_KEY` (y qué pasa si se
  pierde: los ADMIN regeneran su 2FA), ZAP y el procedimiento de la prueba de producción con datos de
  PRUEBA (D16).
- **ADR:** ajustes que T4 o la ejecución hayan dejado pendientes.
- **`docs/sprints/README.md`:** fila de S8.

### T20. Informe y commit 1 (sesión principal, a más tardar el 21/12 por la mañana)

`docs/sprints/sprint-s8.md` con la estructura de `sprint-s4.md`, más los apartados **Aceptación** y
**Seguridad** marcados «pendiente» (se completan en T25). Revisa con `git status` que no entren
`.env*` reales, `.superpowers/`, `.agents/`, `.claude/` ni `*.docx`. Solo con el «aprobado» de T18:

```bash
git add -A
git commit -F - <<'EOF'
feat(repo): completar el sprint S8 con seguridad, monitoreo, reportes y cuentas del personal

- HT-07: eventos de seguridad sin datos personales, alertas por correo y monitoreo en el servidor.
- HT-08: cabeceras finales, límites en Redis, carreras cerradas y guía de ZAP y ASVS 5.0 nivel 2.
- HU-52: contraseñas robustas del personal y segundo factor TOTP obligatorio para el ADMIN.
- HU-43, HU-21, HU-30: conciliación en CSV y PDF, exportación de pagos e indicadores.
- HT-09: flujo principal en Chromium, Firefox y WebKit; guion de aceptación.

Refs: HT-07, HT-08, HU-43, HU-52, HT-09, HU-21, HU-30
EOF
```

Pide al desarrollador el push y la etiqueta `v0.8.0`.

## 9. Fase 5 — Producción y aceptación

### T21. Despliegue, prueba con datos de PRUEBA y ZAP (sesión principal + desarrollador, 21/12)

1. El desarrollador aprueba el despliegue de `v0.8.0`; la sesión principal sigue `deploy.yml` y la
   prueba de humo. El monitoreo queda arriba; `curl -I https://<dominio>` muestra las cabeceras de D4.
2. **ADMIN con TOTP:** el ADMIN inicial cambia su contraseña (D8) y activa el TOTP.
3. **Flujo principal contra producción (D16):** el ADMIN crea el cliente y la póliza «PRUEBA — no
   usar»; `BASE_URL=https://<dominio> pnpm --filter @oasis/web exec playwright test
flujo-principal --project=chromium`; se anula el recibo y se desactiva el cliente. Evidencia: el
   informe de Playwright y el txHash.
4. **ZAP contra producción:** `bash infra/scripts/zap-baseline.sh https://<dominio>`; las alertas
   altas o medias se corrigen antes de la sesión (si hace falta, un `v0.8.1` con su prueba; entra al
   commit 3).
5. **Alerta de prueba:** se baja temporalmente un umbral y se comprueba que el correo llega a los
   destinatarios de D2; se restablece el umbral.

### T22. Importación de los datos reales (personal de Oasis + desarrollador, D20)

- El ADMIN de Oasis activa su TOTP y, guiado por el desarrollador, descarga las plantillas, carga sus
  archivos de clientes y pólizas, revisa la vista previa y confirma.
- La sesión principal solo registra en el ledger los **conteos** del resumen (importadas y con
  error); los errores por fila los corrige Oasis en su archivo.

### T23. Sesión de aceptación (desarrollador + personal de Oasis, 22/12, 2 h)

- Se sigue el guion (D17); el autor anota en vivo el resultado de cada paso y las incidencias con su
  severidad. La sesión principal no participa con datos de producción; recibe las notas del autor.

## 10. Fase 6 — Acta, commit 2 y correcciones

### T24. Acta, incidencias, ZAP y ASVS (`documentacion`)

- `docs/evaluacion/acta-aceptacion-2026-12-22.md` (asistentes, resultados por paso, firmas
  pendientes) e `incidencias-aceptacion.md` (severidad bloqueante, mayor o menor; historia afectada;
  destino S8 o S9), a partir de las notas del autor.
- `docs/seguridad/zap-<fecha>.md` con el resultado de T21 y `asvs-5.0-l2.md` completo.
- El informe completa los apartados **Aceptación** (resumen del acta, conteos de la importación,
  incidencias y su destino) y **Seguridad** (ZAP y ASVS).

### T25. Commit 2 (sesión principal)

```bash
git add docs/
git commit -m "docs(docs): registrar la aceptación de Oasis, ZAP y ASVS del sprint S8"
```

### T26. Correcciones de la aceptación y commit 3 (dueños + `verificador`, 23–24/12)

- Solo bloqueantes (y mayores si caben), cada una con su prueba que falla antes y pasa después; el
  dueño de cada carpeta corrige y el `verificador` confirma; despliegue `v0.8.x` y ZAP de nuevo.
  `incidencias-aceptacion.md` actualiza el estado de cada una. Lo que no quepa va a la holgura de S9.
- Si hubo correcciones:

```bash
git add -A
git commit -m "fix(repo): corregir las incidencias bloqueantes de la aceptación del sprint S8"
```

Sin push. Mensaje final: resumen de la verificación, acciones del autor, título y cuerpo del PR.

## 11. Acciones del autor e hitos

- Push y etiqueta `v0.8.0` el 21/12 por la mañana; push de los commits 2 y 3.
- Guiar al personal de Oasis en la importación (D20) y conducir la sesión del 22/12; recoger las
  firmas del acta.
- Agregar las incidencias no corregidas al backlog.
- Aprobar el punto de control, PR y aceptación del Product Owner.

## 12. Riesgos

| #   | Riesgo                                     | Respuesta                                                                                                                                      |
| --- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Producción no estaba lista al cierre de S7 | T19, T24 y T25 de S7 abren este sprint; si el VPS no está, la aceptación se hace el 22/12 sobre `prod-local` expuesto por túnel y se anota.    |
| R2  | Oasis no puede el 22/12                    | Fecha alternativa 23/12; si tampoco, primera semana de S9 (28/12) y HT-11 se comprime.                                                         |
| R3  | WebKit falla en WSL                        | Se ejecuta en la CI (Ubuntu) y se documenta; local con Chromium y Firefox.                                                                     |
| R4  | `style-src 'self'` rompe estilos en línea  | Se mide; excepción `'unsafe-inline'` solo para estilos, documentada en el ASVS.                                                                |
| R5  | Muchas incidencias en la aceptación        | Bloqueantes en S8 (T26); el resto, a la holgura de S9.                                                                                         |
| R6  | El commit 1 no llega al 21/12              | Si el 18/12 la Fase 3 no cerró, ceden primero el PDF de la conciliación (el CSV cumple la exportación) y el medidor visual (el API ya valida). |

## 13. Trazabilidad criterio → evidencia

| Criterio                                                        | Evidencia esperada                                                                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| HT-07.1 /metrics interno                                        | `Caddyfile`; `curl https://<dominio>/metrics` → 404                                                            |
| HT-07.2 compose.monitoring                                      | `compose.monitoring.yaml`; servicios en el VPS                                                                 |
| HT-07.3 tablero sin puertos                                     | provisión; `docker compose port` vacío                                                                         |
| HT-07.4 eventos de seguridad                                    | specs de T6; muestra de logs en el informe                                                                     |
| HT-07.5 alertas por correo                                      | reglas provisionadas; correo de prueba recibido (T21)                                                          |
| HT-08.1 cabeceras                                               | `cabeceras` (prod-local); `curl -I` de producción                                                              |
| HT-08.2 límites verificados                                     | `limites-redis.e2e-spec.ts`                                                                                    |
| HT-08.3 sin secretos versionados                                | gitleaks en la CI                                                                                              |
| HT-08.4 usuario y fecha en validaciones, rechazos y anulaciones | e2e de S4 y S6; ASVS                                                                                           |
| HT-08.5 CSP, Permissions-Policy, COOP                           | `Caddyfile`; `cabeceras`                                                                                       |
| HT-08.6 ZAP sin altas ni medias                                 | `docs/seguridad/zap-<fecha>.md` (commit 2)                                                                     |
| HT-08.7 throttler en Redis                                      | `limites-redis.e2e-spec.ts`                                                                                    |
| HT-08.8 ASVS 5.0 L2                                             | `docs/seguridad/asvs-5.0-l2.md` (commit 2)                                                                     |
| HU-43.1–HU-43.3                                                 | `reportes.e2e-spec.ts`; `reportes.spec.ts`; specs de CSV y PDF                                                 |
| HU-52.1–HU-52.4                                                 | `contrasenas-personal.e2e-spec.ts`; `segundo-factor.e2e-spec.ts`; `segundo-factor.spec.ts`; correos en Mailpit |
| HT-09.1 tres navegadores                                        | `playwright.config.ts`; job de la CI; ejecución contra producción (T21)                                        |
| HT-09.2 datos reales                                            | conteos de la importación (T22), sin datos personales                                                          |
| HT-09.3 acta                                                    | `docs/evaluacion/acta-aceptacion-2026-12-22.md` (commit 2)                                                     |
| HT-09.4 incidencias                                             | `docs/evaluacion/incidencias-aceptacion.md`; correcciones con su prueba (commit 3)                             |
| HU-21.1–HU-21.3                                                 | `exportar-pagos.e2e-spec.ts`; `escribir-csv.spec.ts`; `reportes.spec.ts`                                       |
| HU-30.1–HU-30.2                                                 | `indicadores.e2e-spec.ts`; `IndicadoresAdmin.test.tsx`                                                         |

## 14. Horas de backlog

| Historia  |  Horas |
| --------- | -----: |
| HT-07     |      8 |
| HT-08     |      9 |
| HU-43     |      6 |
| HU-52     |      5 |
| HT-09     |     12 |
| HU-21     |      4 |
| HU-30     |      6 |
| **Total** | **50** |

## 15. Prompt de arranque

```text
Eres la sesión principal del Sprint S8 del SRPP. Ejecuta docs/sprints/sprint-s8-plan.md de
principio a fin con subagent-driven-development, siguiendo sus reglas (sección 0) y sus decisiones
(sección 2), que no se reabren. El calendario manda: el commit 1 debe existir el 21/12 por la mañana
y la aceptación es el 22/12.

1. Lee AGENTS.md, CLAUDE.md, apps/api/src/modules/README.md y el plan completo. Invoca
   subagent-driven-development y ponytail. Abre el ledger en .superpowers/sdd/sprint-s8-plan/.
2. Fase 0 (T0): arrastre de S7, rama, dependencias, variables, datos de la sesión y línea base.
3. Fase 1: en un mismo mensaje, @contrato-shared con T1–T3 y @documentacion con T4. Cierra la fase.
4. Fase 2: en un mismo mensaje, @backend-api con T5–T10 e @infra con T11–T12. Cierra la fase.
5. Fase 3: @frontend-spa con T13–T14, con el resumen de la API. Cierra la fase.
6. Fase 4: @verificador con T15; @revisor con T16; T17 DoD; T18 capturas y DETENTE en el punto de
   control; con mi «aprobado», @documentacion con T19 y tú T20 (commit 1). Pídeme el push y la
   etiqueta v0.8.0.
7. Fase 5: T21 conmigo en producción (tú propones, yo ejecuto); T22 y T23 los conduzco yo con Oasis.
8. Fase 6: @documentacion con T24 desde mis notas; T25 commit 2; T26 correcciones y commit 3 si hace
   falta.

Ninguna credencial ni dato personal de los clientes de Oasis pasa por ti. Commits sin atribuciones y
sin push.
```
