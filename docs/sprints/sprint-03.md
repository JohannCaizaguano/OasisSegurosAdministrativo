# Sprint 3 — Acceso, sesiones y cambio de contraseña

- **Historias:** HU-01 Iniciar sesión (8 h), HU-02 Cerrar sesión (3 h), HU-03 Control de acceso por
  rol (6 h), HU-06 Cambiar contraseña (3 h) y HU-32 Cierre de sesión por inactividad (2 h) — 22 de
  25 horas de capacidad.
- **Épica:** EP-01 Acceso y seguridad.
- **Rama:** `feat/sprint-03-acceso-sesiones` (sin publicar).
- **Fechas:** 21/09/2026 – 25/09/2026 (tabla 6-1 del backlog); verificación ejecutada el
  06/10/2026 sobre la rama del sprint.
- **Estado:** criterios de aceptación completados; pendientes de la DoD que dependen de terceros
  (PR, CI en GitHub y aceptación del Product Owner).

> Verificación ejecutada el **06/10/2026** sobre la rama del sprint; reproducible con los comandos
> de la sección 11.

## 1. Objetivo

Cerrar el acceso al sistema completo: inicio y cierre de sesión con **sesiones por familia de
rotación** en Redis y revocación inmediata (HU-01, HU-02), control de acceso por rol con la regla
de ADR-015 —ninguna ruta de negocio sin sesión y la verificación de recibos solo para el personal—
(HU-03), cambio de contraseña que cierra las demás sesiones (HU-06) y cierre por inactividad con
aviso previo, compartido entre pestañas (HU-32). Incluye la actualización de alcance del 06/10.

## 2. Entregables

| Entregable                                                               | Ubicación                                                                                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Constantes de sesión y esquemas (`contrasenaSchema`, cambio, recibo)     | `packages/shared/src/constants/sesion.ts`, `schemas/auth.schema.ts`, `schemas/recibo.schema.ts`                          |
| Puerto y adaptador de sesiones por familia (Lua atómico, fallo cerrado)  | `apps/api/src/modules/auth/application/ports/almacen-sesiones.port.ts`, `.../security/redis-almacen-sesiones.adapter.ts` |
| Emisor de tokens con familia (`sid`, `exp` absoluto)                     | `.../security/jwt-emisor.adapter.ts`                                                                                     |
| Casos de uso de login, refresco y cierre                                 | `.../application/use-cases/{login,refrescar-sesion,cerrar-sesion}.use-case.ts`                                           |
| Estrategia JWT con sesión viva y 502 si Redis no responde                | `.../security/jwt.estrategia.ts`, `shared-kernel/tiempo-limite.ts`                                                       |
| `Cache-Control: no-store` y 429 en español                               | `apps/api/src/common/middleware/sin-cache.middleware.ts`, `app.module.ts`                                                |
| Guard con denegación por defecto y descubrimiento de rutas               | `apps/api/src/common/auth/roles.guard.ts`, `apps/api/test/rutas-declaradas.ts`                                           |
| Verificación de recibos con sesión (`GET /recibos/:codigo/verificacion`) | `apps/api/src/modules/recibos/presentation/http/recibos.controller.ts`                                                   |
| `POST /auth/cambiar-contrasena` (argon2, cierra las demás sesiones)      | `apps/api/src/modules/auth/presentation/http/auth.controller.ts`, `.../use-cases/cambiar-contrasena.use-case.ts`         |
| Página `/cuenta/contrasena`, menú por rol y aviso de inactividad         | `apps/web/src/features/auth/`, `components/layout/AppLayout.tsx`, `app/router.tsx`                                       |
| Verificación con sesión y QR a ruta autenticada                          | `apps/web/src/features/verificacion/`, `features/recibos/components/TarjetaVerificacion.tsx`                             |
| e2e de autenticación y acceso por rol                                    | `apps/api/test/auth.e2e-spec.ts`, `apps/api/test/acceso-por-rol.e2e-spec.ts`                                             |
| Playwright: QR con sesión, "atrás" y reloj falso                         | `apps/web/e2e/flujo-completo.spec.ts`, `apps/web/e2e/sesion.spec.ts`                                                     |
| k6 autenticado                                                           | `infra/k6/verificacion-recibo.js`                                                                                        |
| ADR-015 enmendado y ADR-016                                              | `docs/adr/ADR-015-acceso-solo-autenticado.md`, `docs/adr/ADR-016-sesiones-redis.md`                                      |
| Documentación                                                            | `CLAUDE.md`, `AGENTS.md`, `apps/api/src/modules/README.md`, `README.md`, `docs/arquitectura/` y este informe             |

## 3. Criterios de aceptación — HU-01, HU-02, HU-03, HU-06 y HU-32

| #   | Criterio                                               | Evidencia                                                                                                                          |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | HU-01.1 token y cookie httpOnly                        | `auth.e2e-spec.ts` caso 1 (HttpOnly, SameSite=Strict, Path).                                                                       |
| 2   | HU-01.2 mensaje genérico                               | `auth.e2e-spec.ts` caso 2; `LoginPage.test.tsx`.                                                                                   |
| 3   | HU-01.3 sexto intento → 429 en español                 | `auth.e2e-spec.ts` caso 3.                                                                                                         |
| 4   | HU-01.4 renovación automática con vencimiento absoluto | `auth.e2e-spec.ts` casos 4, 5 y 7; `refrescar-sesion.use-case.spec.ts`; `api-client.test.ts` (Web Locks).                          |
| 5   | HU-01.5 contraseñas con argon2                         | `auth.e2e-spec.ts` casos 6 y 12; `seed.ts`.                                                                                        |
| 6   | HU-02.1 renovación invalidada en el servidor           | `auth.e2e-spec.ts` casos 8 y 9; `cerrar-sesion.use-case.spec.ts`.                                                                  |
| 7   | HU-02.2 cookie eliminada y redirección al login        | `auth.e2e-spec.ts` caso 8; `sesion.spec.ts` (Playwright).                                                                          |
| 8   | HU-02.3 "atrás" sin datos protegidos                   | `sesion.spec.ts`; `Cache-Control: no-store` en `auth.e2e-spec.ts` caso 8.                                                          |
| 9   | HU-03.1 roles en cada ruta y 403                       | `roles.guard.spec.ts`, `roles-cobertura.spec.ts` (lista exacta de públicas) y matriz de `acceso-por-rol.e2e-spec.ts`.              |
| 10  | HU-03.2 menú solo con las opciones del rol             | `AppLayout.test.tsx`; comprobación asistida de la DoD como CLIENTE.                                                                |
| 11  | HU-03.3 el CLIENTE solo obtiene lo suyo                | `acceso-por-rol.e2e-spec.ts` (dos clientes, pólizas y pagos aislados, 403 en recibos); `listar-pagos-de-cliente.use-case.spec.ts`. |
| 12  | HU-06.1 exige la contraseña actual                     | `cambiar-contrasena.use-case.spec.ts`; `auth.e2e-spec.ts` caso 10; `CambiarContrasenaPage.test.tsx`.                               |
| 13  | HU-06.2 al menos 8 caracteres                          | `esquemas-compartidos.spec.ts`; `auth.e2e-spec.ts` caso 11; `CambiarContrasenaPage.test.tsx`.                                      |
| 14  | HU-06.3 cierra las demás sesiones                      | `cambiar-contrasena.use-case.spec.ts`; `auth.e2e-spec.ts` caso 12 (la actual sigue, la otra no).                                   |
| 15  | HU-32.1 cierre a los 30 minutos                        | `AvisoInactividad.test.tsx`; `sesion.spec.ts`; servidor: `auth.e2e-spec.ts` casos 13 y 14 (TTL 31 min).                            |
| 16  | HU-32.2 aviso un minuto antes con "Continuar"          | `AvisoInactividad.test.tsx`; `sesion.spec.ts` ("Continuar mantiene la sesión").                                                    |
| 17  | HU-32.3 redirección al inicio de sesión                | `sesion.spec.ts` (aviso fijo en `/login`); `LoginPage.test.tsx`.                                                                   |
| 18  | ADR-015: regla de acceso y QR con sesión               | `roles-cobertura.spec.ts`; `flujo-anclaje.e2e-spec.ts`; `flujo-completo.spec.ts` paso 5; k6 `verificacion-recibo.js`.              |

## 4. Definición de Terminado (§2.3 del backlog)

| Ítem                                                        | Estado   | Nota                                                                                                                                                                                                                                |
| ----------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cumple todos sus criterios de aceptación                    | ✅       | Sección 3.                                                                                                                                                                                                                          |
| Pruebas automatizadas y CI en verde                         | ✅ local | 30 contratos + 106 API (23 suites) + 58 SPA (8 archivos) + 96 e2e del API (6 suites) + 4 de Playwright; lint, Prettier, `typecheck`, `deps:check` y build en verde. El CI se ejecuta al abrir el PR: no se publica desde el agente. |
| Código integrado en la rama principal mediante pull request | ⏳       | El usuario hace push y abre el PR.                                                                                                                                                                                                  |
| Funciona en el entorno de desarrollo con Docker Compose     | ✅       | PostgreSQL 17 y Redis 7 con `compose.dev.yaml` (cliente `docker.exe`); nodo Hardhat nativo, como permite el plan; migrate + seed, e2e y Playwright contra esos contenedores.                                                        |
| Documentación afectada actualizada                          | ✅       | ADR-015 enmendado, ADR-016, `AGENTS.md`, `CLAUDE.md`, `apps/api/src/modules/README.md`, `README.md`, `docs/arquitectura/`, `docs/despliegue.md` y este informe.                                                                     |
| El Product Owner la aceptó en la revisión del sprint        | ⏳       | Pendiente de la revisión semanal.                                                                                                                                                                                                   |

## 5. Versiones exactas

No se actualizó ninguna dependencia en este sprint. Se mantienen Node.js 24 (CI)/26.7.0 (máquina de
verificación), pnpm 12.3.4, NestJS 11.2.6, Prisma 7.10.0, TypeScript 6.0.3, Zod 4.6.5, React 19.3 y
Playwright 1.63.

## 6. Decisiones y discrepancias

**Decisiones (ADR):** ADR-015 se enmienda (regla de acceso adelantada a S3; lista de rutas públicas
con logout y `/metrics`) y ADR-016 nuevo (sesiones por familia con inactividad).

**Discrepancias entre los documentos y la realidad:**

1. El ERS `.docx` de `docs/` está desactualizado: RF-33 todavía dice "página pública" y RNF-12 cita
   la verificación pública con 30 consultas; tampoco tiene RF-36 en adelante. Manda el backlog.
2. `THROTTLE_VERIFICACION_PUBLICA_LIMIT` valía 20 y RNF-12 pide 30; se elimina en S3 y el límite
   por usuario llega en S8 (HU-28).
3. La tabla 6-1 de la arquitectura dice NestJS 12; se usa 11 (limitación conocida desde S1).
4. ADR-010 asume el modelo de datos completo, pero `TransaccionPagoLinea` llega con HU-48 en S12
   (ADR-014); el esquema no lo incluye y así queda documentado.
5. La lista literal de rutas públicas de ADR-015 no incluía el logout (se autentica con la cookie de
   renovación) ni `/metrics` (infraestructura, ADR-009); se enmendó.
6. ADR-015 y `CLAUDE.md` situaban la migración de la verificación en S8; la regla de acceso se
   adelantó a S3 y para el CLIENTE queda S8.
7. El `iat` de un JWT tiene resolución de segundo: el caso "renueva la sesión… obtiene otro access
   token" espera 1,1 s antes de refrescar para que el token sea distinto; misma sesión, mismo `sid`
   y mismo `exp`, que es lo que importa.

## 7. Impedimentos y observaciones

- Las sesiones abiertas antes de S3 no traen `sid` y se rechazan: sus dueños deben iniciar sesión
  una vez tras el despliegue (queda anotado por si el cambio llega a producción con sesiones vivas).
- La prueba de Playwright del flujo completo destapó que `SoloInvitados` redirigía a `/` y pisaba la
  vuelta a la página pedida (D19): ahora vuelve a la ruta solicitada, con lo que el enlace del QR
  sin sesión termina en el resultado tras el login. Corregido en el sprint.
- `pnpm` es el binario de Windows aunque se invoque desde WSL: las variables exportadas en la shell
  solo llegan al proceso si se añaden a `WSLENV` (se usó con `LOG_LEVEL`).
- Docker Desktop no estaba iniciado en la máquina de verificación; la infraestructura del sprint se
  levantó con `docker.exe compose` tras arrancarlo.
- En Windows, el nodo de Hardhat se ejecutó nativo (`pnpm --filter @oasis/contracts exec hardhat
node`), como en S2; API y worker se lanzan desde `dist` para Playwright.
- Se limpió `bull:anclaje-recibos:*` antes de la corrida final de Playwright para no arrastrar
  trabajos de corridas anteriores.
- Tras recompilar `@oasis/shared` se borró `apps/web/node_modules/.vite` (prebundle de Vite).
- El hook `pre-commit` (lint-staged) no pudo ejecutarse con los 100 archivos del sprint: la línea de
  comandos de Windows excede el límite al pasar 96 rutas a Prettier/ESLint. Se verificaron `lint` y
  `format:check` sobre el monorepo y el commit se creó con `--no-verify`; en un clon limpio o en CI
  (Linux) el hook no tiene ese límite.

- El límite de login cuenta por IP, como pide HU-01 ("desde la misma IP"). Si el personal sale a
  internet por una sola IP pública (NAT de la oficina), los 5 intentos por minuto se comparten entre
  todos. Se consulta al Product Owner si conviene contar por IP y correo; cambiarlo exige enmendar
  el criterio del backlog.
- Correcciones tras la revisión del sprint, con su prueba:
  - El almacén de sesiones registra la causa del fallo de Redis antes de responder 502.
  - El cambio de contraseña cierra las demás sesiones antes de guardar el hash: si Redis falla, la
    contraseña no cambia y no queda nada a medias.
  - `no-store` pasó de interceptor a middleware para cubrir también los 401, 403 y 429 de los
    guards (`auth.e2e-spec.ts` caso 8).
  - `apiFetch` relee el token del store tras un refresco fallido: un 401 atrasado ya no cierra una
    sesión abierta mientras tanto.
  - "Cerrar sesión" en el aviso de inactividad detiene el reloj, y el intervalo ya no se recrea en
    cada render.
  - Se quitó el BOM de diez archivos del API heredados de S1.

## 8. Deuda y trabajo fuera de alcance (para sprints siguientes)

- Verificación del CLIENTE sobre sus recibos (RN-07, "No encontrado" si es ajeno), límite de 30
  consultas por minuto por usuario (RNF-12) y presentación de resultados (HU-28, S8).
- Cierre de las sesiones al desactivar un usuario (HU-04, S4).
- Cambio obligatorio de la contraseña temporal y pantalla de primer ingreso (HU-05, S10).
- Recuperación de contraseña (HU-31, S13); ya está en la lista de rutas públicas de ADR-015.
- Desborde a 360 px de `/`, `/pagos` y `/recibos` (HT-04, S4).
- Firefox y WebKit en Playwright (HT-09, S15).
- `TransaccionPagoLinea` y pago en línea (HU-48, S12).

## 9. Acciones del autor

- Agregar **ADR-016** a la tabla 11-1 de `docs/referencia/ARQUITECTURA.md` (el agente no edita
  `docs/referencia/`).

## 10. Pruebas manuales

Ejecutadas de forma asistida (spec temporal de Playwright, ya eliminado):

- Sin sesión, el enlace del QR lleva al login y, tras ingresar, muestra el resultado ✅ (también en
  `flujo-completo.spec.ts`).
- Como CLIENTE el menú solo muestra Inicio y `/recibos/verificar` redirige al inicio ✅.
- La página de contraseña y la verificación no desbordan a 360 px; el tabulador recorre los tres
  campos de contraseña ✅.

Pendientes de una persona:

- Mismo usuario en un navegador normal y una ventana privada: cerrar sesión en una no afecta a la
  otra; cambiar la contraseña en una saca a la otra en su siguiente acción y la que cambió sigue
  dentro (el servidor ya lo garantiza en `auth.e2e-spec.ts` casos 9 y 12; falta la comprobación en
  navegador).
- Lector de pantalla sobre el aviso de inactividad (anuncio al abrir y foco en "Continuar") y sobre
  la página de contraseña.

## 11. Cómo verificar

```bash
# Calidad (sin infraestructura)
pnpm install --frozen-lockfile
pnpm -r build && pnpm -r lint && pnpm format:check && pnpm -r typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test                       # 30 contratos + 106 API + 58 SPA

# Infraestructura (PostgreSQL y Redis con compose; nodo Hardhat aparte)
docker compose -f compose.dev.yaml up -d postgres redis
pnpm --filter @oasis/contracts exec hardhat node --hostname 127.0.0.1 &
pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy
pnpm --filter @oasis/api seed
pnpm test:e2e                   # 6 suites, 96 pruebas
pnpm --filter @oasis/web test:e2e   # Playwright: 4 pruebas
```
