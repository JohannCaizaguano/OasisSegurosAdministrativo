# Módulos del API — estructura obligatoria

Cada módulo de negocio replica la **arquitectura hexagonal** de ARQUITECTURA §5.1.
Los módulos implementados hoy son la referencia a copiar:

```text
modulo/
├── domain/                    # TypeScript puro: entidades, VOs, errores, reglas
├── application/
│   ├── ports/                 # interfaces + token de inyección (Symbol)
│   └── use-cases/             # una clase por operación de negocio, sin decoradores
├── infrastructure/
│   └── persistence|queue|blockchain|crypto/   # adaptadores de los puertos
├── presentation/
│   └── http/                  # controllers NestJS + DTOs; solo hablan con casos de uso
└── modulo.module.ts           # composición explícita con useFactory + inject por token
```

## Regla de dependencias (verificada en CI)

```
presentation ─┐
infrastructure┴─> application ─> domain        (las flechas son dependencias)
```

- `domain/` y `shared-kernel/` **no** importan NestJS, Prisma, viem, BullMQ, ioredis,
  prom-client, `application/`, `infrastructure/` ni `presentation/`.
- `application/` **no** importa `infrastructure/`, `presentation/` ni frameworks.
- `presentation/` usa los casos de uso por token; nunca instancia un adaptador.
- Sin ciclos.

Se verifica con `pnpm deps:check` (dependency-cruiser, configuración en
`apps/api/.dependency-cruiser.cjs`). Si la regla falla, **no** se relaja la regla: se
mueve el código a la capa que corresponde.

## Convenciones de nombres

| Elemento                 | Convención               | Ejemplo                             |
| ------------------------ | ------------------------ | ----------------------------------- |
| Puerto (interfaz)        | `XxxPort`                | `RecibosRepositoryPort`             |
| Token de inyección       | `XXX_PORT` (Symbol)      | `RECIBOS_REPOSITORY_PORT`           |
| Adaptador Prisma         | `PrismaXxxRepository`    | `PrismaRecibosRepository`           |
| Adaptador de cadena      | `ViemXxxAdapter`         | `ViemRegistroRecibosAdapter`        |
| Adaptador de cola        | `BullMqXxxAdapter`       | `BullMqColaAnclajeAdapter`          |
| Caso de uso              | `VerboSustantivoUseCase` | `ValidarPagoUseCase`                |
| Controlador              | `XxxController`          | `PagosController`                   |
| Términos de dominio      | español                  | `EstadoRecibo`, `saldoPendiente`    |
| Infraestructura genérica | inglés                   | `ConfigService`, `HealthController` |

## Pruebas

- `.spec.ts` junto al código; nombres de `describe`/`it` en español.
- Los casos de uso se prueban con **puertos simulados** (sin base de datos ni red).
- Los e2e viven en `apps/api/test/` (Supertest) y usan los servicios reales.

## Auditoría (HU-45)

- Todo endpoint que crea, modifica, elimina, valida, rechaza, anula, reintenta, importa o inicia
  sesión declara `@Auditar(accion, entidad)` (`src/common/auditoria/auditar.decorator.ts`), con
  valores de `ACCIONES_AUDITORIA` y `ENTIDADES_AUDITADAS`.
- `auditoria-cobertura.spec.ts` falla si una ruta POST, PUT, PATCH o DELETE no lo declara;
  descubre los controladores con `test/rutas-declaradas.ts` y las exenciones siguen listadas allí.
- La bitácora es de solo inserción: no agregues métodos de edición ni de borrado a su puerto.

## Acceso (HU-03, ADR-015)

- Todo handler declara `@Roles(...)` (en el handler o en la clase) o `@Public()`. `RolesGuard`
  responde 403 si no hay roles: una ruta nueva nunca queda abierta a cualquier autenticado.
- Solo son públicas `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /health` y
  `GET /metrics`; la recuperación de contraseña se sumará con HU-31. `roles-cobertura.spec.ts` falla
  si cambia esa lista o si una ruta queda sin roles, y `acceso-por-rol.e2e-spec.ts` comprueba 401
  sin token y 403 para cada rol no permitido.
- Los datos del CLIENTE se filtran en un caso de uso con su `clienteId` (RN-07), no solo en el
  controlador.
