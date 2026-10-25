# Sprint S4 — Etapa C: claridad de la interfaz (plan)

- **Encargo:** pedido del autor el 25/10/2026. Toma del repositorio anterior (`OasisSeguros`) los
  patrones de interfaz que ayudan a entender la información y los adapta a Claroscuro.
- **Historias que refina:** HT-13 Sistema de diseño, HU-16 Registrar pago, HU-18 Validar pago,
  HU-19 Rechazar pago y HU-35 Plan de cuotas. No abre historias nuevas: cada tarea pule una pantalla
  que ya entregó el S4.
- **Fechas:** 26/10 – 30/10/2026, dentro del S4 (19/10 – 30/10, tabla 6-1).
- **Rama:** `feat/sprint-s4-claridad-ui`. Un solo commit al cierre (T10).
- **Ejecuta:** la sesión principal con `subagent-driven-development` y los agentes de
  `.opencode/agents/`. Las reglas de ejecución son las de la sección 0 de `sprint-s4-plan.md`; las
  diferencias se indican abajo.

Este documento es el Sprint Backlog de la Etapa C. Las reglas generales están en `AGENTS.md`, el mapa
técnico en `CLAUDE.md` y las reglas de los módulos del API en `apps/api/src/modules/README.md`.

## 0. Reglas de ejecución (diferencias con la Etapa B)

1. Fases en orden: C0 → C1 → C2 → C3 → C4. Ningún agente arranca una fase por su cuenta.
2. **Prueba del autor antes del commit (D9):** al cerrar C3, la sesión principal levanta el sistema
   (`pnpm dev:infra`, `pnpm dev:chain`, migración, seed y `pnpm dev`), presenta las capturas de la
   sección 6 y espera un «aprobado» explícito. Sin él no hay commit. Los ajustes vuelven al dueño.
3. Sin dependencias nuevas: todo se hace con lo que ya está instalado (`lucide-react`, Radix y
   elementos nativos de HTML).
4. **Sin push ni PR**: los hace el autor.

### 0.1 Agentes

| Agente            | Edita                                      | Fase  | Tareas      |
| ----------------- | ------------------------------------------ | ----- | ----------- |
| sesión principal  | ledger, capturas y commit                  | C0–C4 | T0, T9, T10 |
| `contrato-shared` | `packages/shared/src/` (salvo `abi/`)      | C1    | T1          |
| `backend-api`     | `apps/api/src/`                            | C1    | T2          |
| `frontend-spa`    | `apps/web/src/` (salvo `contratos/`)       | C2    | T3–T7       |
| `verificador`     | `apps/web/e2e/`                            | C3    | T8          |
| `revisor`         | nada (solo lectura)                        | C3    | T8.r        |
| `documentacion`   | `docs/` (salvo `referencia/`), `CLAUDE.md` | C3    | T8.d        |

### 0.2 Skills por tarea

| Tareas            | Skills                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| T1                | `zod`, `vitest`                                                                                               |
| T2                | `nestjs-best-practices`, `prisma-client-api`                                                                  |
| T3–T7             | `react-best-practices`, `composition-patterns`, `impeccable` (`clarify`, `polish`), `accessibility`, `vitest` |
| T5 (formulario)   | además `react-hook-form`                                                                                      |
| T8                | `playwright-best-practices`; revisión con `ponytail-review`, `accessibility`, `impeccable` (`audit`)          |
| Toda lógica nueva | `test-driven-development`                                                                                     |

## 1. Alcance

| #   | Mejora                                        | Para quién        | De dónde sale (repo anterior)                 | Tarea  |
| --- | --------------------------------------------- | ----------------- | --------------------------------------------- | ------ |
| M1  | Ícono por ramo junto al nombre                | personal, cliente | `PolicyCard` (`typeConfig`)                   | T1–T3  |
| M2  | Qué significa cada estado (leyenda y frase)   | personal, cliente | idea propia; el anterior no explica estados   | T4     |
| M3  | Estados vacíos que explican y proponen acción | personal, cliente | `EmptyState` con descripción y acción         | T4     |
| M4  | Ayudas permanentes en el formulario de pago   | personal          | `PaymentClassificationPreview` (avisar antes) | T5     |
| M5  | «Por validar» abre el listado ya filtrado     | personal          | `ClientStats` (cifra que filtra)              | T5     |
| M6  | Seguimiento del pago en el portal             | cliente           | `InteractionTimeline`                         | T2, T6 |
| M7  | «En mora» visible y explicado para el cliente | cliente           | idea propia; hoy el portal lo omite           | T6     |
| M8  | Textos en lenguaje llano con consecuencia     | personal          | idea propia                                   | T7     |

### Fuera de alcance (no implementar)

Dependen de historias de otros sprints y ya están incorporadas en su plan:

| Pendiente                                                         | Sprint | Dónde quedó                                    |
| ----------------------------------------------------------------- | ------ | ---------------------------------------------- |
| Vista previa de las cuotas que cubre un pago                      | S5     | `sprint-s5-plan.md` D24, T2, T8 y T15 (HU-36)  |
| Línea de tiempo del anclaje con los pasos de `SeguimientoPago`    | S5     | `sprint-s5-plan.md` D9, D25 y T12 (HU-24)      |
| Días de atraso en la cartera, con ramo y leyenda                  | S5     | `sprint-s5-plan.md` D16, D25 y T16 (HU-38)     |
| Todos los filtros de pagos en la URL (aquí solo `estado`, M5)     | S5     | `sprint-s5-plan.md` D15 y D25 (HU-20)          |
| Saldo pendiente antes de registrar o validar                      | S6     | `sprint-s6-plan.md` D24 y T17 (HU-15)          |
| «Pagado $X de $Y», próxima cuota y mora con su cuota en el portal | S6     | `sprint-s6-plan.md` D25, T2, T15 y T20 (HU-29) |
| Saldo de anclaje expresado en recibos restantes                   | S8     | `sprint-s8-plan.md` D26, T2, T9 y T14 (HU-30)  |

### No se copia del repositorio anterior

Tendencias fijas (`+2.5%`), íconos de ramo que no salen del dato (`PolicyIndicators`), método de pago
inventado, la barra de progreso con `Math.random()`, las clases de color de Tailwind (aquí no generan
CSS, `--color-*: initial`), `transition-all` y las animaciones escalonadas en todo.

## 2. Decisiones (no reabrir)

| ID  | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                   | Motivo                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| D1  | **Ícono por código, no por nombre.** `polizaSchema` suma `ramoCodigo: z.string()`; el API lo devuelve en `GET /polizas`, `GET /polizas/:id` y `GET /mis-polizas` (el `include` del ramo ya trae el código).                                                                                                                                                                                                                | Un ramo renombrado en HU-46 (S9) no pierde su ícono.                                                                  |
| D2  | **Mapa fijo en `apps/web/src/components/ramos.ts`**: `VIDA` HeartPulse, `SALUD` y `ASISTENCIA_MEDICA` Stethoscope, `VEHICULOS` Car, `INCENDIO` Flame, `FIANZAS` FileSignature, `EQUIPOS_ELECTRONICOS` Laptop, `AEREO_DRONES` Plane, `EQUIPOS_MAQUINARIA` Cog; cualquier otro código, Shield. Incluye los códigos de D18 de S5 para que el cambio de catálogo no deje íconos genéricos.                                     | Importación por nombre: Vite solo empaqueta esos nueve íconos (pocos KB). Nunca `import { icons }` ni carga dinámica. |
| D3  | **`RamoEtiqueta`**: ícono de 16 px con `aria-hidden` + nombre del ramo como texto. El ícono nunca va solo.                                                                                                                                                                                                                                                                                                                 | El nombre sigue siendo el dato accesible; el ícono solo acelera la lectura.                                           |
| D4  | **Cada `Presentacion` de `estados.ts` suma `descripcion`** (una frase, en «usted», sin «hash» ni «blockchain»). El tipo la exige, así que omitirla rompe el `typecheck`. Textos en la sección 3.                                                                                                                                                                                                                           | Un solo vocabulario: la leyenda, el portal y las pruebas leen la misma fuente.                                        |
| D5  | **Leyenda con `<details>` nativo** («¿Qué significa cada estado?») bajo el filtro de Pagos y Recibos y en el pie de Pólizas, con cada insignia y su descripción. **Sin tooltips sobre la insignia.**                                                                                                                                                                                                                       | Funciona con teclado y en el celular sin dependencias; el `hover` no existe en el teléfono, donde está el cliente.    |
| D6  | **`AvisoVacio` suma `descripcion?: string` y `accion?: ReactNode`**; `TablaDatos` pasa `vacioDescripcion`. `children` sigue siendo el título.                                                                                                                                                                                                                                                                              | Cambio compatible: los usos actuales no se tocan.                                                                     |
| D7  | **M5:** el enlace de la cifra «Por validar» va a `/pagos?estado=REGISTRADO`. `PagosPage` toma su estado inicial de `useSearchParams` (solo `estado`, validado contra `ESTADOS_PAGO`; un valor desconocido equivale a «Todos») y lo escribe al cambiar el filtro con `replace`.                                                                                                                                             | Lo mínimo para M5; D15 de S5 extiende el mismo patrón al resto de filtros.                                            |
| D8  | **M6:** `GET /mis-pagos` suma `rechazadoEn` (ya está en `pagoSchema`). `SeguimientoPago` pinta tres pasos con los puntos de 24 px de DESIGN.md (éxito, proceso, error, neutro): «Registrado» (`createdAt`), «En revisión por Oasis Seguros» y el final, «Validado · recibo verificable» (`validadoEn`) o «Rechazado» (`rechazadoEn`) con el motivo existente. Lista ordenada (`<ol>`) con el estado de cada paso en texto. | Responde «¿qué pasó con mi pago?» sin llamar al bróker (principio 4 de PRODUCT.md).                                   |
| D9  | **Prueba del autor antes del commit** (regla 0.2).                                                                                                                                                                                                                                                                                                                                                                         | Pedido explícito del autor.                                                                                           |

## 3. Textos

### 3.1 Descripción de cada estado (D4)

| Dominio         | Estado                                 | Descripción                                                                                          |
| --------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| pago            | REGISTRADO                             | Oasis Seguros está revisando este pago con la notificación de la aseguradora o el comprobante.       |
| pago            | VALIDADO                               | El pago fue confirmado y tiene un recibo verificable.                                                |
| pago            | RECHAZADO                              | El pago no se pudo confirmar; el motivo aparece junto a él.                                          |
| recibo          | PENDIENTE_ANCLAJE, ENVIADO             | El recibo se está registrando para que pueda verificarse; suele tardar menos de un minuto.           |
| recibo          | ANCLADO                                | Cualquier persona con sesión puede comprobar que el recibo es auténtico.                             |
| recibo          | FALLIDO                                | No se pudo registrar el recibo; el sistema lo reintenta y, si sigue así, un administrador lo revisa. |
| recibo          | ANULADO                                | Oasis Seguros anuló este recibo; ya no vale como comprobante.                                        |
| poliza          | VIGENTE                                | La póliza está activa y admite pagos.                                                                |
| poliza          | VENCIDA                                | Terminó su vigencia; ya no admite pagos.                                                             |
| poliza          | CANCELADA                              | Se canceló antes de terminar; ya no admite pagos.                                                    |
| poliza          | EN_MORA                                | Tiene al menos una cuota vencida sin pagar.                                                          |
| cuota           | PENDIENTE                              | Aún no vence y no tiene pagos.                                                                       |
| cuota           | PARCIAL                                | Tiene un abono, pero falta completar su valor.                                                       |
| cuota           | PAGADA                                 | Está cubierta por completo.                                                                          |
| cuota           | VENCIDA                                | Pasó su fecha de vencimiento sin cubrirse.                                                           |
| verificacion    | VALIDO                                 | El recibo fue emitido por Oasis Seguros y no ha cambiado.                                            |
| verificacion    | HASH_INCONSISTENTE                     | Los datos del recibo no son los que se registraron. No lo acepte y comuníquese con Oasis Seguros.    |
| verificacion    | NO_ANCLADO                             | El recibo existe y se está registrando. Vuelva a intentarlo en un minuto.                            |
| verificacion    | ANULADO                                | Oasis Seguros anuló este recibo; ya no vale como comprobante.                                        |
| verificacion    | NO_ENCONTRADO                          | No hay un recibo con ese código. Revise que lo haya escrito bien.                                    |
| cliente, cuenta | ACTIVO/ACTIVA, DESACTIVADO/DESACTIVADA | Puede usar el sistema / No puede iniciar sesión ni operar.                                           |

`VerificacionPage` usa estas descripciones en lugar de su `LEYENDAS.detalle` actual (que menciona el
hash y la cadena); el título se conserva. El detalle técnico (hash, transacción) sigue en su bloque.

### 3.2 Estados vacíos (D6)

| Pantalla                 | Título                       | Descripción y acción                                                                          |
| ------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------- |
| Portal · Mis pólizas     | Sin pólizas                  | Cuando Oasis Seguros registre una póliza a su nombre, aparecerá aquí.                         |
| Portal · Mis pagos       | Sin pagos                    | Cuando Oasis Seguros valide un pago de sus pólizas, aparecerá aquí con su recibo verificable. |
| Pagos (filtro sin datos) | No hay pagos con este filtro | Pruebe con «Todos los estados». Acción: botón «Quitar filtro».                                |
| Recibos                  | Sin recibos todavía          | Cada pago validado emite un recibo. Acción: enlace «Ir a Pagos».                              |
| Panel · Últimos recibos  | Sin recibos todavía          | (igual que Recibos)                                                                           |

### 3.3 Ayudas del formulario de pago (M4)

| Campo      | Ayuda (prop `ayuda` de `Campo`)                                                  |
| ---------- | -------------------------------------------------------------------------------- |
| Póliza     | Solo aparecen pólizas vigentes.                                                  |
| Monto      | En dólares, con punto decimal. No puede superar el saldo pendiente de la póliza. |
| Fecha      | El día en que se hizo el pago; no puede ser posterior a hoy.                     |
| Referencia | Número del comprobante o del débito. No se repite en la misma póliza.            |

### 3.4 Lenguaje llano (M8)

- `ValidarPagoDialog`: «Se emitirá el recibo y se registrará para que cualquiera pueda verificarlo.
  El cliente lo verá en su portal. La acción no se puede deshacer.» (hoy nombra al worker y a
  Polygon).
- `RechazarPagoDialog`: conserva su texto; se resalta en negrita «El cliente verá este motivo».
- `PolizasPage`: en las pólizas no VIGENTE, donde hoy no aparece el menú de acciones, una línea en
  `text-caption` bajo la insignia: «Solo lectura: la póliza ya no está vigente».
- Portal, póliza en mora (M7): insignia «En mora» junto a la de estado y, debajo, «Tiene una cuota
  vencida. Comuníquese con Oasis Seguros para ponerse al día.»

## 4. Estado de partida (a confirmar en T0)

- `EstadoInsignia` y `estados.ts` sin descripciones; `PanelCliente` no muestra `enMora` aunque
  `GET /mis-polizas` lo devuelve.
- `AvisoVacio` solo recibe un texto. `Campo` ya acepta `ayuda`, pero `FormularioPago` no la usa.
- `PagosPage` guarda el filtro en `useState`; la cifra «Por validar» enlaza a `/pagos`.
- `GET /mis-pagos` devuelve `validadoEn` pero no `rechazadoEn`. `polizaSchema` trae `ramo` (nombre)
  sin código.
- `VerificacionPage` explica cada resultado con «hash», «blockchain» y «cadena».

## 5. Tareas

### C0 — Preparación (sesión principal)

#### T0. Rama, línea base y ledger

- Crear `feat/sprint-s4-claridad-ui` desde `main`. `pnpm install`, `pnpm -r build` y línea base de
  `lint`, `typecheck`, `test` y `deps:check`, guardada en `.superpowers/sdd/sprint-s4-etapa-c/`.
- Confirmar la sección 4; si algo difiere, detenerse y reportarlo.

### C1 — Contrato y API (en paralelo)

#### T1. `ramoCodigo` en `polizaSchema` (`contrato-shared`, M1; TDD)

- **Archivos:** `packages/shared/src/schemas/poliza.schema.ts` y su prueba.
- **Pruebas primero:** el esquema rechaza una póliza sin `ramoCodigo` y acepta una con él.
- **Verificación:** `pnpm --filter @oasis/shared test` y `build`; borrar `apps/web/node_modules/.vite`.

#### T2. `ramoCodigo` y `rechazadoEn` en las respuestas (`backend-api`, M1, M6; TDD)

- **Archivos:** `prisma-polizas.repository.ts` (mapear `fila.ramo.codigo`), `domain/poliza.ts`,
  `polizas.controller.ts` y el controlador de `mis-polizas`; `pagos.controller.ts` (`mis-pagos`).
- **Pruebas primero:** unitarias del mapeo y los e2e existentes de `polizas` y `pagos` ampliados:
  `ramoCodigo` presente en listado, detalle y `mis-polizas`; `rechazadoEn` en `mis-pagos` para un
  pago rechazado y `null` para uno validado.
- **Casos borde:** sin consultas nuevas (el `include` del ramo ya existe), sin N+1.
- **Verificación:** `pnpm --filter @oasis/api test`, `typecheck` y `deps:check`.

### C2 — SPA (`frontend-spa`)

#### T3. `RamoEtiqueta` (M1; TDD)

- **Archivos:** `components/ramos.ts`, `components/RamoEtiqueta.tsx` y su prueba; uso en
  `PolizasPage` (columna Ramo) y en «Mis pólizas» de `PanelCliente`.
- **Pruebas primero:** un código conocido pinta su ícono (`data-ramo`) y el nombre; uno desconocido
  pinta el genérico; el ícono tiene `aria-hidden`.
- **Verificación:** `pnpm --filter @oasis/web test ramo` y `build` (revisar que el chunk no crezca
  más de unos pocos KB).

#### T4. Descripciones, leyenda y estados vacíos (M2, M3; TDD)

- **Archivos:** `components/estados.ts` (D4, textos 3.1), `components/LeyendaEstados.tsx`,
  `components/DataState.tsx` (D6), `components/TablaDatos.tsx`; uso en `PagosPage`, `RecibosPage`,
  `PolizasPage`, `PanelPersonal`, `PanelCliente` y `VerificacionPage` (textos 3.2).
- **Pruebas primero:** `LeyendaEstados dominio="pago"` lista los tres estados con su descripción y
  se abre con el teclado; `AvisoVacio` pinta descripción y acción; `VerificacionPage` ya no contiene
  «hash» ni «blockchain» en el resultado.
- **Casos borde:** la leyenda no repite insignias de `data-testid` usados por los e2e (usar
  `data-estado` igual que `EstadoInsignia`, dentro de un contenedor con su propio `data-testid`).

#### T5. Formulario de pago y cifra que filtra (M4, M5; TDD)

- **Archivos:** `features/pagos/components/FormularioPago.tsx`, `features/pagos/pages/PagosPage.tsx`,
  `features/dashboard/components/PanelPersonal.tsx` y sus pruebas.
- **Pruebas primero:** cada campo enlaza su ayuda por `aria-describedby` (junto al error si lo hay);
  `/pagos?estado=REGISTRADO` abre con el filtro «Registrados»; `?estado=OTRO` abre en «Todos»;
  cambiar el filtro actualiza la URL sin agregar entradas al historial.

#### T6. Portal: seguimiento del pago y mora (M6, M7; TDD)

- **Archivos:** `features/dashboard/components/SeguimientoPago.tsx`, `PanelCliente.tsx` y sus pruebas.
- **Pruebas primero:** un pago REGISTRADO muestra «En revisión» como paso en curso; uno VALIDADO, los
  tres pasos completos con su fecha; uno RECHAZADO, el paso final en error con el motivo (la prueba
  actual de HU-19 sigue en verde); una póliza con `enMora` muestra la insignia y el texto de 3.4.
- **Casos borde:** objetivos táctiles de 44 px (`diseno.spec.ts`); sin desborde a 360 px; las
  fechas con `formatearFecha`.

#### T7. Lenguaje llano (M8)

- **Archivos:** `ValidarPagoDialog.tsx`, `RechazarPagoDialog.tsx`, `PolizasPage.tsx` (textos 3.4).
- **Verificación:** las pruebas de los diálogos se ajustan solo si leían el texto cambiado.

### C3 — Evidencia, revisión y prueba del autor

#### T8. Playwright, revisión y documentación

- **`verificador`:** correr `diseno.spec.ts` completo (axe AA, foco, 360 px, 44 px) sobre las
  pantallas tocadas; ampliar `pagos.spec.ts` con el paso «Por validar» → listado filtrado.
- **`revisor` (T8.r):** diff contra este plan con `ponytail-review`, `accessibility` e `impeccable`
  (`audit`). Hallazgos al dueño.
- **`documentacion` (T8.d):** en `CLAUDE.md` (sección SPA) una línea para `RamoEtiqueta`,
  `LeyendaEstados` y la descripción de los estados; en `sprint-s4.md`, una sección «Etapa C» con
  entregables y evidencia; fila en `docs/sprints/README.md`.

#### T9. Prueba del autor (sesión principal, D9)

- Levantar el sistema y presentar capturas de escritorio y de 360 px: Pagos con leyenda y filtro desde
  el panel, formulario de pago con ayudas, Pólizas con íconos, Verificación con los cinco
  resultados, portal con seguimiento de un pago de cada estado y una póliza en mora.
- Esperar «aprobado». Con ajustes, repartirlos y repetir T8.

### C4 — Cierre

#### T10. DoD y commit

- `pnpm lint`, `format:check`, `typecheck`, `deps:check`, `test`, `build`, `test:e2e` y Playwright
  en verde.
- Un commit: `feat(web): aclarar estados, ramos y seguimiento del pago en la interfaz` (cuerpo con
  M1–M8), con `git config user.name` = `JohannCaizaguano`. Sin push ni PR.

## 6. Evidencia por mejora

| Mejora | Prueba automatizada                                     | Captura                      |
| ------ | ------------------------------------------------------- | ---------------------------- |
| M1     | `RamoEtiqueta.test.tsx`, e2e `polizas` (`ramoCodigo`)   | Pólizas y portal             |
| M2     | `LeyendaEstados.test.tsx`, `VerificacionPage.test.tsx`  | Pagos con la leyenda abierta |
| M3     | `DataState.test.tsx`, `PanelCliente.test.tsx`           | Portal vacío                 |
| M4     | `FormularioPago.test.tsx`                               | Formulario de pago           |
| M5     | `PagosPage.test.tsx`, `pagos.spec.ts`                   | Panel → Pagos filtrado       |
| M6     | `SeguimientoPago.test.tsx`, e2e `pagos` (`rechazadoEn`) | Portal, tres pagos           |
| M7     | `PanelCliente.test.tsx`                                 | Portal, póliza en mora       |
| M8     | pruebas de los diálogos                                 | Diálogo de validación        |
