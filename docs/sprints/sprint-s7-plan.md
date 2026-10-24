# Sprint S7 — Plan de implementación

- **Historias:** HT-05 Contenerización con Docker (13 h), HU-50 Pagos notificados por la aseguradora
  (8 h), HU-31 Recuperar contraseña por correo (4 h), HT-06 Despliegue en VPS con CI/CD (13 h) y
  HU-17 Reportar pago con comprobante (11 h).
- **Horas:** 49 h de backlog. El informe reporta solo las horas de backlog (D21). El scaffold ya trae
  el Dockerfile multi-stage, `compose.prod.yaml` con redes separadas, `bootstrap-vps.sh`,
  `deploy.yml` y `backup-db.sh` (sección 3).
- **Épicas:** EP-07 (HT-05, HT-06), EP-04 (HU-50, HU-17) y EP-01 (HU-31).
- **Fechas:** 30/11/2026 – 11/12/2026 (tabla 6-1).
- **Rama:** `feat/sprint-s7-despliegue-aseguradoras`. **Dos commits** (D19): el del sprint y, tras el
  despliegue real, uno solo de documentación con la evidencia. Un solo PR.
- **Ejecuta:** la sesión principal con `subagent-driven-development` y los agentes de área de
  `.opencode/agents/` (sección 0.1). Los pasos en el VPS los ejecuta el desarrollador (D18).
- **Precondición:** VPS, dominio con DNS, Brevo y Backblaze B2 contratados por el autor (S6 §10). Si
  faltan, aplica R1.
- **Decisiones acordadas con el desarrollador:** 23/10 y 24/10/2026, en sesiones de grilling
  (sección 2).

Este documento es el Sprint Backlog de S7. Las reglas generales están en `AGENTS.md`, el mapa
técnico en `CLAUDE.md` y las reglas de los módulos del API en `apps/api/src/modules/README.md`.
Cada agente lee los tres antes de empezar. La fuente de verdad está en `docs/referencia/`, que no se
edita: si algo de este plan la contradice, gana la referencia; detente y repórtalo.

**Cómo leer las tareas.** Cada tarea indica su **agente**, sus **archivos**, sus **skills**, el
comportamiento esperado, los casos borde, las pruebas que se escriben primero y su verificación. Los
bloques **Ejemplo (orientativo)** muestran la forma o la parte delicada; se adaptan al código real.

## 0. Reglas de ejecución

1. La sesión principal ejecuta las fases en orden: 0 → 1 → 2 → 3 → 4 → 5 → 6. Ningún agente arranca
   una fase por su cuenta.
2. TDD en toda lógica nueva (`test-driven-development`): primero la prueba en rojo, luego el código.
   Antes de cerrar una fase, la sesión principal usa `verification-before-completion` y guarda la
   salida en el ledger.
3. Cada agente invoca al empezar las skills de su tarea en el orden de `AGENTS.md`: proceso →
   tecnología → `ponytail` decide el tamaño.
4. Tras cambiar `packages/shared/src`: `pnpm --filter @oasis/shared build` y borrar
   `apps/web/node_modules/.vite`.
5. Nunca se edita `docs/referencia/`.
6. **Dos commits** (D19), hechos por la sesión principal, sin líneas de atribución: T23 (sprint) y
   T26 (evidencia del despliegue). Antes, `git config user.name` debe ser `JohannCaizaguano`. **Sin
   push ni PR**: los hace el usuario.
7. No se adelanta trabajo de otros sprints; lo que exceda el alcance va como deuda al informe.
8. Comentarios solo para el porqué no obvio. Simplificaciones deliberadas con `ponytail:` (techo y
   salida).
9. En la fase paralela cada agente compila y prueba **solo su paquete** (`pnpm --filter …`); nadie
   ejecuta `pnpm -r build` ni `pnpm install` hasta que la sesión principal cierre la fase.
10. Las dependencias nuevas las instala **la sesión principal** en T0: los agentes no editan
    `package.json` ni el lockfile.
11. **Acciones remotas (D18):** ninguna credencial del VPS, de GitHub, del DNS, de Brevo ni de B2 pasa
    por la IA. Cada comando remoto lo ejecuta el desarrollador con `! ssh oasis@<vps> '…'` (o en la
    consola del proveedor) en esta sesión; la sesión principal lo propone, espera la salida, la
    verifica y solo entonces propone el siguiente.
12. **Punto de control antes del commit 1 (D20):** la sesión principal se detiene en T21, presenta las
    capturas y espera un «aprobado» explícito.

### 0.1 Agentes y coordinación

| Agente            | Edita                                                              | Fases | Tareas                         |
| ----------------- | ------------------------------------------------------------------ | ----- | ------------------------------ |
| sesión principal  | archivos raíz (`.env*.example`, `package.json`), ledger            | 0–6   | T0, T19–T21, T23, T24–T26      |
| `contrato-shared` | `packages/shared/src/` (salvo `abi/`), `apps/web/src/contratos/`   | 1     | T1–T3                          |
| `documentacion`   | `docs/` (salvo `referencia/`), `CLAUDE.md`, `AGENTS.md`, READMEs   | 1, 5  | T4, T22                        |
| `infra`           | `infra/`, `compose.*.yaml`, `Dockerfile`s, `Caddyfile`, `.github/` | 2, 4  | T5–T7                          |
| `backend-api`     | `apps/api/src/`, `apps/api/prisma/`                                | 2, 4  | T8–T11                         |
| `frontend-spa`    | `apps/web/src/` (salvo `contratos/`)                               | 3, 4  | T12–T15                        |
| `verificador`     | `apps/api/test/`, `apps/web/e2e/`                                  | 4     | T16, T17                       |
| `revisor`         | nada (solo su nota del ledger)                                     | 4     | T18                            |
| desarrollador     | VPS, DNS, GitHub, Brevo, B2, billetera fría                        | 5, 6  | pasos remotos de T19, T24, T25 |

```text
Fase 0  sesión principal ── T0 arrastre de S6, rama, dependencias, variables, precondición, línea base
Fase 1  contrato-shared ── T1 → T2 → T3        documentacion ── T4 (en paralelo)
Fase 2  ┌ infra ── T5 → T6 → T7 (todo en local)
        └ backend-api ── T8 → T9 → T10 → T11
Fase 3  frontend-spa ── T12 → T13 → T14 → T15
Fase 4  verificador ── T16 → T17 · revisor ── T18 → dueños corrigen → revisor confirma (máx. 1 ronda)
Fase 5  sesión principal + desarrollador ── T19 preparación del VPS (sin desplegar código)
        sesión principal ── T20 DoD local, T21 capturas y PUNTO DE CONTROL ·
        documentacion ── T22 · sesión principal ── T23 informe y COMMIT 1
        ── el desarrollador hace push de la rama ──
Fase 6  sesión principal + desarrollador ── T24 despliegue y TLS → T25 respaldos y restauración →
        T26 evidencia y COMMIT 2 (solo docs)
```

**Por qué este orden.** El VPS se prepara (T19) antes del commit porque no necesita el código; el
despliegue (T24) sí necesita las imágenes publicadas, que solo existen después del push del
desarrollador. Se despliega código ya revisado (T18) y aprobado (T21).

**Traspasos.** Cada agente cierra su tarea con una nota en `.superpowers/sdd/sprint-s7-plan/<agente>.md`
(qué hizo, salida resumida de sus comandos, desvíos con su motivo y lo que necesita el siguiente) y
responde a la sesión principal con un resumen corto. Las salidas de los comandos remotos van a
`.superpowers/sdd/sprint-s7-plan/servidor.md`, **sin secretos** (se recortan antes de guardarlas).

**Fronteras.** Si un agente necesita un cambio fuera de su carpeta, no lo hace: lo anota y la sesión
principal relanza al dueño. Si el `verificador` encuentra un bug de producto, deja la prueba en rojo
como evidencia.

**Frenos.** Si una decisión de la sección 2 deja de ser viable, la sesión principal se detiene e
invoca `grilling` con su recomendación. Los agentes no reabren decisiones.

### 0.2 Skills por tarea

| Momento                        | Agente            | Skills                                                                                                        |
| ------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| Todo el sprint                 | sesión principal  | `subagent-driven-development`, `ponytail`, `verification-before-completion`; `grilling` solo como freno       |
| Toda lógica nueva              | todos             | `test-driven-development`                                                                                     |
| Fallo o prueba roja inesperada | todos             | `systematic-debugging`                                                                                        |
| T1–T3 esquemas                 | `contrato-shared` | `zod`, `vitest`                                                                                               |
| T4 y T22 documentación         | `documentacion`   | `humanizador-es` al final de cada documento                                                                   |
| T5–T7 contenedores y scripts   | `infra`           | `bash-defensive-patterns`                                                                                     |
| T8 migración                   | `backend-api`     | `prisma-cli`, `prisma-client-api`                                                                             |
| T9–T11 API                     | `backend-api`     | `nestjs-best-practices`, `nodejs-best-practices`, `nodejs-backend-patterns`, `prisma-client-api`              |
| T12–T15 SPA                    | `frontend-spa`    | `react-best-practices`, `react-hook-form`, `zod`, `impeccable` (`craft`, `harden`), `accessibility`, `vitest` |
| T16 e2e del API                | `verificador`     | `nestjs-best-practices`, `prisma-client-api`                                                                  |
| T17 Playwright                 | `verificador`     | `playwright-best-practices`                                                                                   |
| T18 revisión                   | `revisor`         | `ponytail-review`, `accessibility`, `impeccable` (`audit`)                                                    |
| T19, T24, T25 servidor         | sesión principal  | `bash-defensive-patterns`, `verification-before-completion`                                                   |

**`impeccable`.** Manda `apps/web/DESIGN.md`. La mesa de validación (D14) es la pantalla firma de
DESIGN.md: se construye con `craft` y se audita con `audit`.

**Sin worktrees ni commits por tarea.** Ledger y capturas en `.superpowers/sdd/sprint-s7-plan/`
(ignorado por git).

## 1. Alcance

### HT-05 — Contenerización con Docker (RNF-11, RNF-22, RNF-32, RNF-40)

- Dockerfile multi-stage del API con destinos runtime y migrator; imagen web basada en Caddy.
- `compose.dev` levanta PostgreSQL, Redis y el nodo de Hardhat.
- `compose.prod` separa las redes edge e internal, con healthchecks y límites de recursos.
- La clave de firma solo existe en el contenedor worker.
- `compose.prod` se levanta en local con imágenes construidas localmente.
- Contenedores sin root, con sistema de archivos de solo lectura, `cap_drop: ALL` y
  `no-new-privileges`.
- La aplicación usa un usuario de PostgreSQL sin DDL, las migraciones otro, y Redis exige
  contraseña.
- Grype analiza las imágenes en la CI y falla ante vulnerabilidades críticas.

### HU-50 — Pagos notificados por la aseguradora (RF-56)

- Se elige la aseguradora y se carga un .xlsx o CSV (número de póliza, fecha de cobro, monto y
  referencia) según una plantilla descargable.
- Cada fila con las reglas del registro manual (RN-01, RN-02) y la póliza de la aseguradora elegida
  (RN-23).
- Una referencia ya registrada para la misma póliza se rechaza (RN-22).
- Vista previa con válidas y errores por fila antes de confirmar.
- Pagos REGISTRADO con Débito bancario, validables de uno en uno o todos los de la carga con una
  sola confirmación.
- Resumen del resultado y la carga en la bitácora.

### HU-31 — Recuperar contraseña por correo (RF-36, RNF-29)

- La respuesta no revela si el correo existe.
- El enlace es de un solo uso y vence a los 30 minutos.
- La nueva contraseña cumple la política; al restablecerla se cierran las sesiones activas.

### HT-06 — Despliegue en VPS con CI/CD (RNF-10, RNF-16, RNF-39)

- VPS endurecido: usuario no root, SSH solo con clave, ufw y fail2ban.
- Caddy obtiene y renueva el certificado TLS automáticamente.
- `deploy.yml` publica las imágenes en GHCR y despliega con prueba de humo.
- Respaldo diario con `pg_dump` rotado 7 días y restauración probada.
- La cuenta operadora tiene `REGISTRADOR_ROLE` en el contrato desplegado en Amoy.
- Respaldos cifrados con restic en almacenamiento externo compatible con S3, conservados 30 días,
  con la restauración del respaldo cifrado probada en un entorno limpio.

### HU-17 — Reportar pago con comprobante (RF-18, RNF-37)

- El cliente solo elige sus propias pólizas vigentes (RN-07).
- PDF, JPG o PNG de hasta 5 MB; el pago queda REGISTRADO hasta que el personal lo valide (RN-08).
- El personal ve el comprobante al revisar el pago.
- Validación por contenido (`FileTypeValidator`), nombre aleatorio fuera de la carpeta pública y
  descarga con `X-Content-Type-Options: nosniff` solo al personal y al cliente dueño.
- Las imágenes se reprocesan con sharp para eliminar los metadatos, incluida la ubicación GPS.

### Fuera de alcance (no implementar)

- Métricas de seguridad, alertas y Grafana en el servidor (HT-07, S8); cabeceras finales, ZAP y
  límite en Redis (HT-08, S8). En S7 el monitoreo **no** se despliega.
- Contraseñas robustas con zxcvbn y TOTP (HU-52, S8): HU-31 usa la política vigente.

## 2. Decisiones tomadas (no reabrir)

| #   | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Motivo                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| D1  | **Endurecimiento de contenedores**: en `compose.prod.yaml`, todos los servicios con `read_only: true`, `cap_drop: [ALL]`, `security_opt: [no-new-privileges:true]` y `tmpfs` donde escriben (`/tmp`; PostgreSQL además `/var/run/postgresql`; Caddy `/config` y `/data` como volúmenes). Usuarios: API y worker `oasis` (ya en el Dockerfile), PostgreSQL `user: "70:70"` (alpine), Redis `user: "999:999"`, Caddy con `cap_add: [NET_BIND_SERVICE]` como única excepción y usuario no root. Toda excepción lleva su motivo escrito junto al servicio.                                                                                                                                                                                                                                                                                                                                                                   | Criterio literal de HT-05.                                                             |
| D2  | **Dos usuarios de PostgreSQL**: `oasis_migrator` (dueño del esquema, DDL) y `oasis_app` (`SELECT, INSERT, UPDATE` en todas las tablas y `USAGE` en secuencias, más `DELETE` solo en `Cuota`, la única tabla con borrado legítimo, ADR-020). Script `infra/postgres/init/01-roles.sh` (al crear el volumen) y `ALTER DEFAULT PRIVILEGES FOR ROLE oasis_migrator` para las tablas futuras. El servicio `migrate` usa `MIGRATION_DATABASE_URL`; API y worker, `DATABASE_URL` con `oasis_app`. Una prueba en compose comprueba que `oasis_app` no puede `CREATE TABLE` ni `DELETE FROM "Pago"`.                                                                                                                                                                                                                                                                                                                              | Defensa en profundidad de RN-09 a nivel de base.                                       |
| D3  | **Redis con contraseña**: `REDIS_PASSWORD` en `.env.prod` (`--requirepass` y `REDIS_URL=redis://:<pass>@redis:6379`); `compose.dev` también la exige para que el código no dependa de un Redis abierto.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Criterio literal.                                                                      |
| D4  | **Grype** en `deploy.yml` y en un job de `ci.yml` sobre las imágenes construidas sin publicar: `anchore/scan-action` fijada por SHA con `severity-cutoff: critical` y `fail-build: true`, sobre las tres imágenes (api, migrator, web). Las imágenes base se fijan por digest.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Criterio literal; Renovate (HT-14) actualiza los digest.                               |
| D5  | **Prueba local de producción**: `infra/scripts/prod-local.sh` construye las tres imágenes con etiqueta `local`, genera un `.env.prod.local` con secretos aleatorios y un nodo Hardhat aparte, levanta `compose.prod.yaml` con un override `compose.prod.local.yaml` (Caddy con `tls internal` y `localhost`) y corre la prueba de humo (`/api/v1/health`, `/`, login del seed). Termina con `down -v`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Criterio «compose.prod se levanta en local».                                           |
| D6  | **VPS**: `bootstrap-vps.sh` (existente) se completa y se hace idempotente: usuario `oasis` con sudo, SSH solo con clave y sin root, ufw (22, 80, 443), fail2ban para `sshd`, `unattended-upgrades`, Docker desde el repositorio oficial y el usuario de despliegue en el grupo `docker`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Criterio literal.                                                                      |
| D7  | **Despliegue**: `deploy.yml` se dispara con una etiqueta `v*` o con `workflow_dispatch`, en el entorno `production` de GitHub con aprobación del autor; construye, escanea (D4), publica en GHCR, entra por SSH (clave de despliegue de solo ese usuario, `known_hosts` fijado), ejecuta `infra/scripts/deploy.sh` (`pull`, `migrate`, `up -d`) y la prueba de humo (`https://<dominio>/api/v1/health` y la SPA); si la prueba falla, `deploy.sh` vuelve a la etiqueta anterior. Secretos solo en GitHub Environments y en `.env.prod`/`.env.worker` del servidor (permisos 600).                                                                                                                                                                                                                                                                                                                                        | RNF-10, RNF-16; reversión sin intervención manual.                                     |
| D8  | **Respaldos**: `backup-db.sh` (local, 7 días) se mantiene; nuevo `infra/scripts/backup-restic.sh` (`pg_dump -Fc` con `oasis_migrator` → `restic backup --stdin`, y el volumen `comprobantes` (ADR-025), a Backblaze B2 por su API S3; `restic forget --keep-daily 30 --prune`; `restic check` semanal). Contraseña de restic y llaves de B2 en `/etc/oasis/restic.env` (600). Timer de systemd diario a las 03:00 (`infra/systemd/oasis-backup.{service,timer}`). Restauración: `restore-restic.sh` sobre un contenedor PostgreSQL efímero limpio, con verificación de conteos por tabla contra el origen.                                                                                                                                                                                                                                                                                                               | Criterio literal (cifrado, externo, 30 días, restauración probada).                    |
| D9  | **Amoy en producción**: la cuenta operadora de producción es **nueva** (no la de desarrollo); el autor le otorga `REGISTRADOR_ROLE` con la billetera fría (HT-15, ADR-021) usando `grant-registrador.ts`; su clave solo en `.env.worker` del servidor. `CONTRACT_ADDRESS` es el contrato desplegado en S1. La cuenta se fondea con POL de prueba y el panel de HU-42 debe mostrarla sobre el umbral.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | ADR-006 y HT-15.                                                                       |
| D10 | **Correo en producción**: Brevo por SMTP (`smtp-relay.brevo.com:587`, STARTTLS) con remitente del dominio verificado (SPF, DKIM y DMARC `p=none` al inicio); variables en `.env.worker`. Una prueba de humo envía un correo de recuperación (HU-31) a la cuenta del autor.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Acuerdo del grilling; el código no se ata al proveedor.                                |
| D11 | **Recuperación (HU-31)**: `POST /auth/recuperar` (`@Public`, límite 5 por 15 min por IP y por correo) responde siempre 202 con el mismo cuerpo y en un tiempo similar (el trabajo real se encola; el API no espera). Token de 32 bytes aleatorios en base64url; se guarda su SHA-256 en `TokenRecuperacion` con `expiraEn = +30 min`; un token nuevo invalida los anteriores del usuario. Correo `recuperar-contrasena` con el enlace `${APP_PUBLIC_URL}/restablecer#token=<token>` (en el fragmento, para que no llegue a los logs del servidor). `POST /auth/restablecer { token, nuevaContrasena }` (`@Public`, límite 10 por 15 min por IP): token válido, no usado y no vencido; política vigente; marca `usadoEn`, cambia la contraseña, `debeCambiarContrasena = false` y `cerrarTodas`. Auditado como `RESTABLECER` sobre `Usuario` (con el propio usuario como autor). Usuarios inactivos: 202 sin enviar nada. | Criterios literales; sin enumeración de cuentas.                                       |
| D12 | **Pagos de la aseguradora (HU-50, ADR-024)**: reutiliza `importaciones` (ADR-022) con `tipo = PAGOS_ASEGURADORA` y `aseguradoraId` en `Importacion`. Columnas: `numeroPoliza, fechaCobro, monto, referencia`. Por fila: la póliza existe y es de la aseguradora elegida (RN-23, si no → «La póliza no pertenece a <aseguradora>»), está VIGENTE (RN-01), monto positivo y **acumulado por póliza dentro del archivo** ≤ saldo (RN-02), referencia no registrada para esa póliza ni repetida en el archivo (RN-22). Confirmar crea los pagos REGISTRADO con `DEBITO_BANCARIO`, `registradoPorId` del operador e `importacionId` (columna nueva en `Pago`).                                                                                                                                                                                                                                                                | Criterio literal; un archivo no puede saltarse RN-02 repartiendo montos.               |
| D13 | **Validar todos**: `POST /importaciones/:id/validar-pagos { confirmado: true }` valida en orden los pagos REGISTRADOS de esa carga con `ValidarPagoUseCase`, **cada uno en su transacción** (RN-01, RN-02 y RN-03 de nuevo), y responde `{ validados, fallidos: [{ pagoId, motivo }] }`: los que fallan no detienen a los demás. Deja una entrada de bitácora `VALIDAR` por pago más una `VALIDAR_CARGA` sobre `Importacion`. Los correos de HU-39 y el anclaje se encolan por pago como siempre.                                                                                                                                                                                                                                                                                                                                                                                                                        | Avance parcial: un pago malo no bloquea a los buenos (grilling del 24/10).             |
| D14 | **Mesa de validación** (DESIGN.md, pantalla firma): `MesaValidacionPage` (`/pagos/:id/validar`) con dos paneles. A la izquierda, el documento: la fila de la notificación de la aseguradora (archivo, fila, fecha de cobro, referencia y monto sobre arena hundida) o la hoja del comprobante del cliente con giro de −0,6°; debajo, las comprobaciones automáticas (póliza vigente, saldo suficiente, referencia única) con su icono. A la derecha, los datos del pago, «Rechazar» en contorno rojo y «Validar y emitir recibo» en oro. La validación desde la fila (S4) se mantiene para pagos sin documento.                                                                                                                                                                                                                                                                                                          | Diseño aprobado; el documento existe desde este sprint (grilling del 24/10).           |
| D15 | **Comprobante (HU-17, ADR-025)**: `POST /mis-pagos` (CLIENTE, multipart) con `polizaId`, `monto`, `fechaPago`, `metodo` (todos menos `DEBITO_BANCARIO`), `referencia` y `comprobante`. `ParseFilePipe` con `MaxFileSizeValidator(5 MB)` y `FileTypeValidator` por números mágicos (`application/pdf`, `image/jpeg`, `image/png`). Imágenes: `sharp(buffer).rotate()` y reexportación al mismo formato **sin** `withMetadata()` (elimina EXIF y GPS). PDF: se guarda tal cual (`ponytail:` techo: no se limpian metadatos de PDF; salida: `qpdf` o reimpresión si Oasis lo pide). Se guarda en `COMPROBANTES_DIR` (volumen `comprobantes`, fuera de toda carpeta servida) con nombre `randomUUID()` + extensión; `Pago.comprobanteRuta` guarda solo el nombre. La póliza debe ser del cliente (si no → 404) y VIGENTE; RN-02 aplica.                                                                                      | Criterios literales y RN-07, RN-08.                                                    |
| D16 | **Descarga del comprobante**: `GET /pagos/:id/comprobante` (ADMIN, OPERADOR) y `GET /mis-pagos/:id/comprobante` (CLIENTE dueño; ajeno → 404) con `Content-Type` del archivo, `Content-Disposition: attachment; filename="comprobante-<id>.<ext>"`, `X-Content-Type-Options: nosniff` y `Cache-Control: no-store`; el nombre se valida contra `^[0-9a-f-]{36}\.(pdf\|jpg\|png)$` y se resuelve con `path.join` más la comprobación de que queda dentro de `COMPROBANTES_DIR`. La anonimización (HU-53) borra el archivo.                                                                                                                                                                                                                                                                                                                                                                                                  | Sin traversal ni ejecución en el navegador.                                            |
| D17 | **Pruebas:** TDD de las reglas por fila de HU-50 (acumulado), del token de recuperación, del saneamiento con sharp (la salida no tiene EXIF: `sharp(salida).metadata()` sin `exif`) y del resolvedor de rutas; e2e `pagos-aseguradora`, `recuperacion`, `comprobantes` y `permisos-bd` (en compose); Playwright `aseguradora.spec.ts`, `recuperacion.spec.ts`, `comprobante.spec.ts` y `diseno.spec.ts` extendido; prueba de humo en el VPS.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Evidencia por criterio (sección 12).                                                   |
| D18 | **Ejecución remota**: la IA prepara y prueba en local todos los scripts y un procedimiento paso a paso en `docs/despliegue.md`. El desarrollador ejecuta cada comando remoto con `! ssh oasis@<vps> '…'` en esta sesión (o en la consola del proveedor, del DNS, de GitHub, de Brevo o de B2), la sesión principal verifica la salida y solo entonces propone el siguiente. Ninguna credencial del servidor pasa por la IA; los secretos los genera y los guarda el desarrollador.                                                                                                                                                                                                                                                                                                                                                                                                                                       | Cada paso remoto queda confirmado y su salida sirve de evidencia (grilling del 24/10). |
| D19 | **Dos commits**: el commit 1 (T23) lleva todo el sprint y el informe con la sección «Despliegue en producción» marcada **pendiente**. Tras el push del desarrollador y el despliegue real, el commit 2 (T26, `docs(docs): registrar la evidencia del despliegue de S7`) agrega la URL, el certificado, la ejecución de `deploy.yml`, la prueba de humo, el respaldo y la restauración.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | El despliegue solo existe después del push (grilling del 24/10).                       |
| D20 | **Punto de control visual** antes del commit 1 (T21): capturas a 1280 y 360 px de las pantallas nuevas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Grilling del 24/10.                                                                    |
| D21 | **Horas:** el informe reporta solo las horas de backlog por historia (sección 13).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Grilling del 24/10.                                                                    |
| D22 | **Entorno (tabla 8-1 de la arquitectura)**: el VPS-1 que se prepara en este sprint es el entorno **«Pruebas»** (`compose.prod` + `compose.monitoring`, Amoy) hasta la entrega de S9, cuando pasa a **«Producción»** con `v1.0.0` (S9 D2 y D14). Donde este plan dice «producción», se refiere a ese servidor.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Grilling del 24/10: un solo VPS que cumple la tabla 8-1.                               |

## 3. Estado de partida (a confirmar en T0)

- **Contenedores:** `apps/api/Dockerfile` con destinos `migrator` y `runtime` y `USER oasis`; imagen
  web con Caddy; `compose.dev.yaml` con PostgreSQL, Redis y Hardhat (y Mailpit desde S6);
  `compose.prod.yaml` con redes `edge` e `internal`, límites, healthchecks y la clave solo en el
  worker (`.env.worker`). Faltan D1, D2, D3 y Grype. `postgres:17-alpine` y `redis:7-alpine` corren
  como root.
- **Servidor:** `infra/scripts/bootstrap-vps.sh` (ssh, ufw, fail2ban), `deploy.sh`, `backup-db.sh`
  (7 días) y `restore-db.sh`; `deploy.yml` con GHCR, SSH y prueba de humo. Faltan restic, B2, 30
  días, la restauración probada y la reversión automática.
- **Auth:** `TokenRecuperacion` en el esquema, sin endpoints. **Pagos:** `Pago.comprobanteRuta` sin
  uso. **Importaciones:** de S6, con `Importacion` y vista previa en Redis. **Correo:** de S6, con
  la cola `notificaciones` y Mailpit.
- **Precondición** del autor: VPS, dominio con DNS, Brevo y B2.

## 4. Fase 0 — Preparación (sesión principal)

### T0. Arrastre de S6, rama, dependencias, variables, precondición y línea base

1. **Arrastre:** lee `docs/sprints/sprint-s6.md` y ejecuta primero lo no cerrado. Si trae historias
   completas, detente e invoca `grilling`.
2. **Rama** `feat/sprint-s7-despliegue-aseguradoras` desde `main` con S6 fusionado. Si `main` tiene
   cambios sin commit del desarrollador, detente y pregunta.
3. **Dependencias:** `apps/api` → `sharp` (versión exacta). `infra` comprueba en T5 que la imagen
   `runtime` incluye sus binarios.
4. **Variables:** `.env.example` (`REDIS_PASSWORD`, `MIGRATION_DATABASE_URL`, `COMPROBANTES_DIR`) y
   `.env.worker.example` (SMTP de Brevo como comentario).
5. **Precondición:** pregunta al desarrollador si el VPS, el dominio con DNS, Brevo y B2 están listos.
   Si no, aplica R1 y anótalo en el ledger.
6. **Línea base:** `pnpm install --frozen-lockfile`, `pnpm -r build`, `pnpm -r typecheck`,
   `pnpm test`; totales en el ledger. Si algo está rojo, detente.

## 5. Fase 1 — Contratos y documentación (en paralelo)

### T1. Pagos de la aseguradora (`contrato-shared`, HU-50; TDD)

- `TIPOS_IMPORTACION` suma `PAGOS_ASEGURADORA`; `filaPagoAseguradoraSchema` (desde
  `crearPagoSchema`, con `numeroPoliza` y `fechaCobro`, y el preprocesado de fechas y montos de S6);
  `vistaPreviaImportacionSchema` admite `aseguradoraId`; `validarCargaSchema` y
  `resultadoValidacionCargaSchema` (`{ validados, fallidos: [{ pagoId, motivo }] }`); acción
  `VALIDAR_CARGA`.
- **Pruebas primero:** fila sin referencia → error; `fechaCobro` con número de serie de Excel →
  fecha ISO.

### T2. Recuperación (`contrato-shared`, HU-31; TDD)

- `solicitarRecuperacionSchema { email }`, `restablecerContrasenaSchema { token, nuevaContrasena }`
  (con la política vigente), acción `RESTABLECER`, plantilla `recuperar-contrasena` en
  `PLANTILLAS_CORREO`.
- **Pruebas primero:** token vacío → error; contraseña fuera de la política → error con su `path`.

### T3. Comprobante (`contrato-shared`, HU-17; TDD)

- `reportarPagoSchema` (campos del multipart como texto que se coerciona), `METODOS_PAGO_CLIENTE`
  (sin `DEBITO_BANCARIO`), `TIPOS_COMPROBANTE` y `TAMANO_MAXIMO_COMPROBANTE = 5 * 1024 * 1024`;
  `pagoSchema` suma `tieneComprobante: boolean` e `importacionId`; `documentoPagoSchema` para la mesa
  (fila de carga o comprobante).
- **Pruebas primero:** `metodo: 'DEBITO_BANCARIO'` en el reporte del cliente → error; monto en texto
  `'25.50'` → `'25.50'`.

### T4. Contraste de ADR (`documentacion`)

- ADR-024 (cargas de la aseguradora), ADR-025 (comprobantes) y ADR-026 (respaldos) ya están
  redactadas y registradas; se contrastan con D8, D12, D13, D15 y D16 y se ajustan solo si el plan
  las precisó (por ejemplo, el avance parcial de D13).

**Cierre de la Fase 1 (sesión principal):** `pnpm --filter @oasis/shared build` y `test`; borrar
`apps/web/node_modules/.vite`; resumen para la Fase 2.

## 6. Fase 2 — Contenedores y API (en paralelo, todo en local)

Dos carriles en un mismo mensaje: `infra` (T5–T7) y `backend-api` (T8–T11).

### T5. Contenedores endurecidos (`infra`, HT-05)

- **Archivos:** `compose.prod.yaml`, `compose.dev.yaml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`
  (o el de Caddy), `infra/postgres/init/01-roles.sh` (nuevo).
- **Cambios:** D1, D2 y D3; servicio `migrate` con `MIGRATION_DATABASE_URL`; volumen `comprobantes`
  montado en el API (escritura) y nunca en `web`; imágenes base por digest; `sharp` operativo en
  `runtime` (base `node:24-bookworm-slim` si la alpina falla; se mide el tamaño y se anota).
- **Verificación:** `docker.exe compose -f compose.prod.yaml config` sin errores; `docker inspect` de
  cada contenedor muestra usuario no root, `ReadonlyRootfs: true`, `CapDrop: [ALL]` y
  `no-new-privileges`; `redis-cli` sin contraseña → `NOAUTH`.

**Ejemplo (orientativo):**

```yaml
x-endurecido: &endurecido
  read_only: true
  cap_drop: [ALL]
  security_opt: [no-new-privileges:true]
  tmpfs: [/tmp]

services:
  redis:
    <<: *endurecido
    image: redis:7-alpine@sha256:<digest>
    user: '999:999'
    command: ['redis-server', '--appendonly', 'yes', '--requirepass', '${REDIS_PASSWORD:?}']
    volumes: [redis-data:/data]
    networks: [internal]
```

```bash
# infra/postgres/init/01-roles.sh (fragmento)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<SQL
CREATE ROLE oasis_app LOGIN PASSWORD '${OASIS_APP_PASSWORD}';
GRANT USAGE ON SCHEMA public TO oasis_app;
ALTER DEFAULT PRIVILEGES FOR ROLE oasis_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO oasis_app;
ALTER DEFAULT PRIVILEGES FOR ROLE oasis_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO oasis_app;
SQL
```

El `DELETE` sobre `Cuota` se concede en una migración (la tabla ya existe cuando corre `migrate`).

### T6. Prueba local de producción y Grype (`infra`, HT-05)

- **Archivos:** `infra/scripts/prod-local.sh`, `compose.prod.local.yaml` (D5), `.github/workflows/ci.yml`
  (job `imagenes`: construye las tres imágenes sin publicar y corre Grype) y `deploy.yml` (Grype antes
  de publicar).
- **Prueba de permisos de base (D2):** `prod-local.sh` ejecuta, con `oasis_app`, `CREATE TABLE x()` y
  `DELETE FROM "Pago"` y exige que ambos fallen.
- **Verificación:** `bash infra/scripts/prod-local.sh` termina en verde; Grype sin críticas (o con la
  base actualizada hasta lograrlo).

### T7. Scripts del servidor (`infra`, HT-06)

- **Archivos:** `infra/scripts/bootstrap-vps.sh` (D6), `deploy.sh` (D7, con reversión),
  `backup-restic.sh` y `restore-restic.sh` (D8), `infra/systemd/oasis-backup.{service,timer}`,
  `.github/workflows/deploy.yml` (entorno `production`, `workflow_dispatch`, etiquetas `v*`, Grype y
  prueba de humo).
- Todos los scripts con `set -Eeuo pipefail`, `trap` de limpieza, `shellcheck` sin avisos,
  idempotentes y con `--dry-run` donde tenga sentido; ninguno imprime secretos.
- **Prueba local:** `bootstrap-vps.sh --dry-run` en un contenedor Debian; `deploy.sh` y la reversión
  contra el compose de `prod-local.sh` (una imagen rota a propósito vuelve a la anterior);
  `backup-restic.sh` y `restore-restic.sh` contra un repositorio restic local (`RESTIC_REPOSITORY`
  en un directorio temporal).

### T8. Migración (`backend-api`, HU-50, HU-17)

- `Importacion.aseguradoraId` (relación e índice); `Pago.importacionId` (relación e índice);
  `GRANT DELETE ON "Cuota" TO oasis_app` condicionado a que el rol exista (`DO $$ … $$`), para que la
  migración también corra en desarrollo; `@@index([usuarioId, usadoEn])` en `TokenRecuperacion` si
  hace falta.
- **Verificación:** `migrate dev` sobre la base de S6; `seed` dos veces; `migrate diff` sin deriva.

### T9. Recuperación de contraseña (`backend-api`, HU-31; TDD)

- **Archivos:** módulo `auth`: `SolicitarRecuperacionUseCase`, `RestablecerContrasenaUseCase`, puerto
  `TokensRecuperacionPort` con repositorio Prisma, rutas en `auth.controller.ts`; plantilla
  `recuperar-contrasena` en `notificaciones`; límites en `config/throttle.ts`.
- **Comportamiento:** D11.
- **Pruebas primero:** correo inexistente y existente → mismo cuerpo y estado; token usado → 400
  `TOKEN_INVALIDO`; vencido (reloj a +31 min) → 400; dos solicitudes → solo el último token sirve;
  restablecer cierra todas las sesiones y limpia `debeCambiarContrasena`; el token en claro nunca se
  guarda ni aparece en logs; usuario inactivo → 202 sin job.

### T10. Pagos de la aseguradora (`backend-api`, HU-50; TDD)

- **Archivos:** `modules/importaciones/` (fila `fila-pago-aseguradora.ts`, vista previa con
  `aseguradoraId`, confirmación, plantilla), `modules/pagos/` (`importacionId`,
  `ValidarCargaUseCase`), `importaciones.controller.ts` (`POST /importaciones/:id/validar-pagos`).
- **Comportamiento:** D12 y D13.
- **Pruebas primero:** fila de otra aseguradora → error RN-23; dos filas de la misma póliza cuyo
  acumulado supera el saldo → la segunda con error RN-02; referencia ya registrada → error RN-22;
  referencia repetida en el archivo → la segunda con error; validar la carga con un pago que ya no
  cabe → aparece en `fallidos` y los demás se validan; bitácora `IMPORTAR` y `VALIDAR_CARGA`.

### T11. Comprobantes (`backend-api`, HU-17; TDD)

- **Archivos:** `ReportarPagoUseCase` (CLIENTE), puertos `AlmacenComprobantesPort` (adaptador de
  disco, `COMPROBANTES_DIR` en el esquema de entorno del API) y `SaneadorImagenPort` (adaptador
  sharp), descargas del personal y del dueño, `GET /pagos/:id/documento` para la mesa (fila de carga
  o metadatos del comprobante); `AnonimizarClienteUseCase` (S6) borra el archivo.
- **Comportamiento:** D15 y D16.
- **Pruebas primero:** un `.png` renombrado a `.pdf` se acepta como PNG y un `.exe` renombrado a
  `.pdf` se rechaza (números mágicos); JPG con GPS → la salida no tiene EXIF; póliza ajena → 404;
  `../../etc/passwd` como nombre guardado → la descarga lo rechaza; cabeceras de la descarga.

**Ejemplo (orientativo):**

```ts
export function resolverComprobante(dir: string, nombre: string): string {
  if (!/^[0-9a-f-]{36}\.(pdf|jpg|png)$/.test(nombre)) throw new ComprobanteNoEncontradoError();
  const ruta = path.resolve(dir, nombre);
  if (!ruta.startsWith(path.resolve(dir) + path.sep)) throw new ComprobanteNoEncontradoError();
  return ruta;
}
```

- **Cierre de carril:** `lint`, `typecheck`, `test`, `deps:check`; coberturas de `@Roles` y
  `@Auditar` (`POST /mis-pagos` auditado como `CREAR`/`Pago`; recuperación como `RESTABLECER`).

**Cierre de la Fase 2 (sesión principal):** `pnpm -r build`, `lint`, `format:check`, `typecheck`,
`deps:check`, `deps:check:negativo`, `pnpm test`; `bash infra/scripts/prod-local.sh`; resumen de la
API para `frontend-spa`.

## 7. Fase 3 — SPA (`frontend-spa`)

Una línea de trabajo, en orden: T12 → T15.

### T12. Recuperación de contraseña (`frontend-spa`, HU-31; TDD)

- **Archivos:** `features/auth/pages/RecuperarContrasenaPage.tsx` y `RestablecerPage.tsx` (+tests,
  nuevos), `LoginPage.tsx` (enlace «¿Olvidó su contraseña?»), `router.tsx` (rutas públicas).
- **Comportamiento:** mensaje neutro tras solicitar («Si el correo está registrado, recibirá un
  enlace»); `RestablecerPage` lee el token del fragmento y lo borra de la URL con
  `history.replaceState` antes de cualquier petición; tras restablecer, vuelve al login con aviso.
- **Pruebas primero:** la URL queda sin token; el mensaje es igual con correo existente o no; error
  de política por campo.

### T13. Carga de la aseguradora (`frontend-spa`, HU-50; TDD)

- **Archivos:** `features/pagos/pages/CargaAseguradoraPage.tsx` (+test, nuevo), reutiliza los
  componentes del asistente de `ImportarPage` (S6), `PagosPage.tsx` (botón secundario «Cargar
  notificación»), `router.tsx`.
- **Asistente:** aseguradora → plantilla → archivo → vista previa (errores RN-23, RN-02 y RN-22 por
  fila) → confirmar → resumen con «Validar los N pagos» (una confirmación) y el resultado de
  `validados` y `fallidos` con su motivo y enlace a cada pago.
- **Pruebas primero:** la vista previa muestra los errores por fila; validar la carga pide
  confirmación una vez; los fallidos aparecen con su motivo.

### T14. Mesa de validación (`frontend-spa`, HU-17, HU-50; TDD)

- **Archivos:** `features/pagos/pages/MesaValidacionPage.tsx` (+test, nuevo),
  `features/pagos/components/DocumentoPago.tsx`, `ComprobacionesPago.tsx`, `router.tsx`; acceso
  «Revisar» desde `PagosPage` para pagos con documento.
- **Comportamiento:** D14 con `impeccable craft`; el comprobante se muestra desde la descarga
  autenticada (imagen con `URL.createObjectURL`; PDF en `<iframe sandbox>` sin `allow-scripts`);
  teclado completo y foco al primer control de acción.
- **Pruebas primero:** muestra la fila de la carga o el comprobante; las comprobaciones reflejan el
  estado real (póliza no vigente → icono de error); validar y rechazar funcionan igual que en S4.

### T15. Reportar pago en el portal (`frontend-spa`, HU-17; TDD)

- **Archivos:** `features/portal/pages/ReportarPagoPage.tsx` (+test, nuevo), acción del pie fijo en
  el portal, `router.tsx`.
- **Formulario:** pólizas vigentes propias (chips en el teléfono, DESIGN.md), monto con el saldo
  visible, fecha, método (sin Débito bancario), referencia y zona de archivo (PDF, JPG o PNG hasta
  5 MB) con vista previa de imagen; tras enviar, el pago aparece como «Por validar».
- **Pruebas primero:** un archivo de 6 MB o un `.gif` da error local; solo aparecen pólizas vigentes
  del cliente; tras enviar, el pago aparece como «Por validar».

**Cierre de la Fase 3 (sesión principal):** `pnpm --filter @oasis/web lint`, `typecheck`, `test` y
`build`; `pnpm format:check`.

## 8. Fase 4 — Evidencia y revisión

Infraestructura arriba (`compose.dev.yaml` con Mailpit y Redis con contraseña, nodo Hardhat,
`pnpm dev:chain`, `migrate deploy`, `seed`).

### T16. e2e del API (`verificador`)

- **`pagos-aseguradora.e2e-spec.ts`:** HU-50 completa, incluida la validación de la carga con un
  fallido y la bitácora.
- **`recuperacion.e2e-spec.ts`:** HU-31 con Mailpit (se extrae el token del correo): solicitud,
  restablecer, token usado, vencido, sesiones cerradas.
- **`comprobantes.e2e-spec.ts`:** HU-17 con fixtures (JPG con GPS, PNG, PDF, EXE renombrado y
  archivo de 5 MB + 1); descargas del personal, del dueño y de otro cliente (404).
- **Permisos de base:** la prueba de `prod-local.sh` (T6) se ejecuta y su salida va al ledger.
- `acceso-por-rol.e2e-spec.ts` con la matriz nueva.

### T17. Playwright (`verificador`)

- **`aseguradora.spec.ts`:** carga con un error por fila, confirmación y validar todos.
- **`recuperacion.spec.ts`:** solicitud → correo en Mailpit → restablecer → login con la nueva.
- **`comprobante.spec.ts`:** el cliente reporta con un PNG, el operador lo ve en la mesa y lo valida.
- **`diseno.spec.ts`:** suma la mesa de validación, la carga, la recuperación y el reporte del
  cliente.

### T18. Revisión (`revisor` y dueños)

- Contra la sección 2, los criterios, `AGENTS.md`, `ponytail-review`, `accessibility` e
  `impeccable audit`. Atención: indistinguibilidad de la recuperación; token solo hasheado y fuera de
  logs; comprobantes fuera de lo servido y sin traversal; permisos de `oasis_app`; contenedores
  endurecidos sin excepciones injustificadas; secretos fuera del repositorio y de los logs;
  reversión de `deploy.sh`; `shellcheck`.
- Una ronda de confirmación como máximo; después se repiten los cierres de las Fases 2, 3 y 4.

## 9. Fase 5 — Preparación del servidor, cierre y commit 1

### T19. Preparación del VPS (sesión principal + desarrollador, HT-06)

Sigue D18: la sesión principal propone cada comando, el desarrollador lo ejecuta y la salida se
verifica antes del siguiente.

1. **Acceso:** el desarrollador crea su clave SSH (si no la tiene) y entra al VPS con el usuario que
   da el proveedor.
2. **Endurecimiento:** copia y ejecuta `bootstrap-vps.sh` (D6). Comprobaciones: `ssh root@<vps>`
   rechazado, acceso con contraseña rechazado, `sudo ufw status` (22, 80, 443),
   `sudo fail2ban-client status sshd`, `systemctl is-enabled unattended-upgrades`, `docker version`.
3. **DNS:** registro A del dominio al VPS; `dig +short <dominio>` devuelve su IP.
4. **Secretos del servidor:** el desarrollador crea `/opt/oasis/.env.prod`, `/opt/oasis/.env.worker` y
   `/etc/oasis/restic.env` con permisos 600 a partir de los `.example`; la sesión principal solo
   verifica con `stat -c '%a %U' …` y `grep -c '=' …` (nunca con `cat`).
5. **Cuenta operadora de producción (D9):** el desarrollador genera la cuenta nueva, la fondea con POL
   de Amoy y, con la billetera fría, ejecuta `grant-registrador.ts`; guarda el txHash.
6. **Brevo (D10):** dominio remitente verificado con SPF, DKIM y DMARC; `dig TXT` lo confirma.
7. **GitHub:** entorno `production` con aprobación del desarrollador y sus secretos (`SSH_HOST`,
   `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`).
8. **Timers:** instala las unidades de `infra/systemd/` (se activan en T25).

### T20. Definición de Terminado local (sesión principal)

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
pnpm --filter @oasis/web test:e2e
bash infra/scripts/prod-local.sh
```

Prueba manual: reportar un pago desde un teléfono real con una foto en la red local y comprobar que
la descarga no conserva la ubicación (`exiftool`).

### T21. Capturas y punto de control (sesión principal)

1. Script de Playwright temporal en `.superpowers/sdd/sprint-s7-plan/` (no se versiona), a 1280 y
   360 px: recuperar y restablecer contraseña, los pasos de la carga de la aseguradora (con errores y
   con el resultado de validar todos), la mesa de validación con una fila de carga y con un
   comprobante (imagen y PDF), y el reporte de pago del portal. Además, el correo de recuperación en
   Mailpit. En `capturas/`.
2. **Punto de control (D20):** presenta las capturas (rutas absolutas) y el resultado de T20. Espera
   «aprobado» o ajustes.

### T22. Documentación (`documentacion`)

- **`docs/despliegue.md`:** puesta en marcha del VPS paso a paso (D6–D10, en el orden de T19 y T24),
  variables por archivo, usuarios de PostgreSQL, respaldos y restauración, reversión de un
  despliegue, rotación de secretos (enlaza el plan de incidentes de HT-16).
- **`CLAUDE.md`:** endurecimiento de compose, dos usuarios de base, Redis con contraseña,
  recuperación, cargas de la aseguradora, mesa de validación y comprobantes.
- **`docs/proteccion-datos/encargados.md`:** datos reales de los encargados (proveedor del VPS,
  Brevo, Backblaze y RPC).
- **ADR:** ajustes que T4 o la ejecución hayan dejado pendientes.
- **`docs/sprints/README.md`:** fila de S7.

### T23. Informe y commit 1 (sesión principal)

`docs/sprints/sprint-s7.md` con la estructura de `sprint-s4.md`: criterios con evidencia (sección
12), DoD, decisiones y discrepancias (ejecución remota, dos commits, avance parcial de validar todos),
**horas de backlog** (sección 13), deuda con sprint destino, acciones del autor, «Cómo verificar» y la
sección **«Despliegue en producción: pendiente»** (D19), con la preparación de T19 ya registrada.
Revisa con `git status` que no entren `.env*` reales, `.superpowers/`, `.agents/`, `.claude/` ni
`*.docx`. Solo con el «aprobado» de T21:

```bash
git add -A
git commit -F - <<'EOF'
feat(repo): completar el sprint S7 con despliegue endurecido, cargas de aseguradoras y comprobantes

- HT-05: contenedores sin root, de solo lectura y sin capacidades; usuarios de base separados;
  Redis con contraseña; Grype en la CI.
- HT-06: VPS endurecido, despliegue con reversión y respaldos cifrados con restic.
- HU-50: carga de pagos notificados por la aseguradora con RN-22 y RN-23, y validación por carga.
- HU-31: recuperación de contraseña con enlace de un solo uso.
- HU-17: pago reportado por el cliente con comprobante validado por contenido y sin metadatos;
  mesa de validación.

Refs: HT-05, HU-50, HU-31, HT-06, HU-17
EOF
```

Pide al desarrollador el push de la rama y la etiqueta `v0.7.0` (o el `workflow_dispatch`).

## 10. Fase 6 — Despliegue, respaldos y commit 2

### T24. Despliegue y TLS (sesión principal + desarrollador, HT-06)

1. El desarrollador aprueba el despliegue en el entorno `production`; la sesión principal sigue la
   ejecución (`gh run watch`) y anota el enlace.
2. **TLS:** `curl -sI https://<dominio>` con HTTP/2 y certificado de Let's Encrypt
   (`openssl s_client -connect <dominio>:443 -servername <dominio> | openssl x509 -noout -issuer -dates`).
3. **Prueba de humo:** `/api/v1/health`, la SPA y el login.
4. **Seed mínimo de producción:** solo el ADMIN inicial con contraseña temporal (S6 D2) y los
   catálogos; ningún dato de prueba.
5. **Correo real:** solicitar una recuperación a la cuenta del desarrollador; llega por Brevo, no a
   spam, con SPF y DKIM `pass` en las cabeceras.
6. **Anclaje real:** validar un pago de prueba (luego se anula con HU-27) y ver el recibo ANCLADO en
   Amoy y el saldo de la operadora sobre el umbral.

### T25. Respaldos y restauración (sesión principal + desarrollador, HT-06)

- Activa los timers de D8; ejecuta un respaldo manual; `restic snapshots` muestra el snapshot en B2.
- Restaura el **respaldo cifrado** en un entorno limpio (otra máquina o un contenedor nuevo sin
  volúmenes) con `restore-restic.sh` y compara los conteos por tabla; prueba también `restore-db.sh`
  con el respaldo local de 7 días.

### T26. Evidencia y commit 2 (sesión principal)

Reemplaza la sección «Despliegue en producción: pendiente» del informe con la URL, la ejecución de
`deploy.yml`, el certificado, la prueba de humo, el correo, el anclaje, el txHash del `grantRole`,
los snapshots y la restauración (salidas recortadas, sin secretos). Solo documentación:

```bash
git add docs/sprints/sprint-s7.md docs/despliegue.md
git commit -m "docs(docs): registrar la evidencia del despliegue de S7"
```

Sin push. Mensaje final: resumen de la verificación, acciones del autor pendientes, título y cuerpo
del PR.

## 11. Acciones del autor e hitos

- Los pasos remotos de T19, T24 y T25; guardar el txHash del `grantRole` de producción.
- Push de la rama y la etiqueta `v0.7.0` después del commit 1; push del commit 2.
- Avisar a Oasis la URL de producción y coordinar la sesión de aceptación del **22/12** (S8) y la
  carga de sus datos reales (HT-09).
- Aprobar el punto de control, PR y aceptación del Product Owner.

## 12. Trazabilidad criterio → evidencia

| Criterio                                         | Evidencia esperada                                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| HT-05.1 Dockerfile y web Caddy                   | `apps/api/Dockerfile`; imagen web; `prod-local.sh`                                  |
| HT-05.2 compose.dev                              | `compose.dev.yaml`                                                                  |
| HT-05.3 redes, healthchecks, límites             | `compose.prod.yaml`; `docker compose config`                                        |
| HT-05.4 clave solo en el worker                  | `compose.prod.yaml` (`env_file` del worker); `docker exec api env` sin la clave     |
| HT-05.5 prod en local                            | `prod-local.sh` en verde                                                            |
| HT-05.6 sin root, solo lectura, sin capacidades  | `docker inspect` en el ledger                                                       |
| HT-05.7 usuarios de base y Redis con contraseña  | `01-roles.sh`; prueba de permisos; `redis-cli` sin contraseña rechazado             |
| HT-05.8 Grype                                    | jobs de `ci.yml` y `deploy.yml`                                                     |
| HU-50.1–HU-50.6                                  | `pagos-aseguradora.e2e-spec.ts`; `aseguradora.spec.ts`; specs de filas              |
| HU-31.1–HU-31.4                                  | `recuperacion.e2e-spec.ts`; `recuperacion.spec.ts`                                  |
| HT-06.1 VPS endurecido                           | salidas de T19 en el informe                                                        |
| HT-06.2 TLS automático                           | `curl -I` y `openssl` de T24 (commit 2); `Caddyfile`                                |
| HT-06.3 GHCR y prueba de humo                    | ejecución de `deploy.yml` (enlace en el commit 2)                                   |
| HT-06.4 pg_dump 7 días y restauración            | `backup-db.sh`; `restore-db.sh`; evidencia de T25                                   |
| HT-06.5 REGISTRADOR_ROLE en Amoy                 | txHash del `grantRole` (T19)                                                        |
| HT-06.6 restic, S3, 30 días, restauración limpia | `backup-restic.sh`; `restore-restic.sh`; evidencia de T25                           |
| HU-17.1–HU-17.6                                  | `comprobantes.e2e-spec.ts`; `comprobante.spec.ts`; specs del saneador y del almacén |

## 13. Horas de backlog

| Historia  |  Horas |
| --------- | -----: |
| HT-05     |     13 |
| HU-50     |      8 |
| HU-31     |      4 |
| HT-06     |     13 |
| HU-17     |     11 |
| **Total** | **49** |

## 14. Riesgos

| #   | Riesgo                                          | Respuesta                                                                                                                                                  |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | VPS, dominio, Brevo o B2 no disponibles         | Las Fases 1 a 4 no dependen del servidor; T19, T24 y T25 pasan al inicio de S8 y HT-09 se reprograma. Freno con `grilling` si el 07/12 sigue sin servidor. |
| R2  | `sharp` no funciona en la imagen alpina         | Cambio a `bookworm-slim` (T5) y se anota el tamaño.                                                                                                        |
| R3  | Correos de Brevo en spam                        | SPF, DKIM y DMARC antes del primer envío; prueba con mail-tester.                                                                                          |
| R4  | `read_only` rompe algún proceso (Prisma, Caddy) | `tmpfs` puntual documentado por servicio; ninguna excepción sin motivo escrito.                                                                            |
| R5  | Un secreto aparece en una salida remota         | Las verificaciones usan `stat` y conteos, nunca `cat`; si aparece, se rota (plan de incidentes de HT-16) y se recorta del ledger.                          |

## 15. Prompt de arranque

```text
Eres la sesión principal del Sprint S7 del SRPP. Ejecuta docs/sprints/sprint-s7-plan.md de
principio a fin con subagent-driven-development, siguiendo sus reglas (sección 0) y sus decisiones
(sección 2), que no se reabren.

1. Lee AGENTS.md, CLAUDE.md, apps/api/src/modules/README.md y el plan completo. Invoca
   subagent-driven-development y ponytail. Abre el ledger en .superpowers/sdd/sprint-s7-plan/.
2. Fase 0 (T0): arrastre de S6, rama, dependencias, variables, precondición del servidor y línea
   base.
3. Fase 1: en un mismo mensaje, @contrato-shared con T1–T3 y @documentacion con T4. Cierra la fase.
4. Fase 2: en un mismo mensaje, @infra con T5–T7 y @backend-api con T8–T11. Cierra la fase.
5. Fase 3: @frontend-spa con T12–T15, con el resumen de la API. Cierra la fase.
6. Fase 4: @verificador con T16 y T17; @revisor con T18; máximo una ronda de confirmación.
7. Fase 5: T19 conmigo en el VPS (tú propones cada comando, yo lo ejecuto con ! ssh y tú verificas);
   T20 DoD; T21 capturas y DETENTE en el punto de control; con mi «aprobado», @documentacion con T22
   y tú T23 (informe y commit 1). Pídeme el push.
8. Fase 6: T24 y T25 conmigo; T26 con el commit 2 solo de documentación.

Ninguna credencial del servidor pasa por ti: nunca pidas ni imprimas secretos. Commits sin
atribuciones y sin push.
```
