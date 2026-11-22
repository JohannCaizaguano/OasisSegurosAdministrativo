# Diseño de interfaz · Claroscuro v2

Diseño final aprobado el 05/11/2026 ([ADR-030](../adr/ADR-030-colores-alineados-con-la-landing.md) y
[ADR-031](../adr/ADR-031-diseno-final-claroscuro-v2.md)). Parte de Claroscuro
([ADR-019](../adr/ADR-019-diseno-interfaz-claroscuro.md)) y suma la paleta de la landing, el botón
principal en tinta y los patrones de lista, ventana modal, cuenta y sistema.

> **Estado: sin implementar.** La SPA sigue con el diseño del S4. Llevarla a este diseño es una
> **fase de diseño del S5** que se planifica aparte. Este directorio deja todo listo para ese plan:
> el prototipo, el documento, las capturas y el inventario de abajo. Mientras no se implemente,
> el código existente se rige por los tokens de `apps/web/src/index.css`.

| Pieza                                                                        | Para qué                                                                                                                                    |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [`apps/web/DESIGN.md`](../../apps/web/DESIGN.md)                             | Fuente normativa del diseño final: tokens, tipografía, forma, componentes y reglas.                                                         |
| [`apps/web/.impeccable/design.json`](../../apps/web/.impeccable/design.json) | Sidecar de impeccable: rampas, sombras, movimiento y componentes de referencia, con los valores finales.                                    |
| [`apps/web/PRODUCT.md`](../../apps/web/PRODUCT.md)                           | Contexto del producto que lee impeccable.                                                                                                   |
| [`prototipo/index.html`](prototipo/index.html)                               | Prototipo navegable del diseño final (personal, administración y asegurado, con datos compartidos). Se abre directo en el navegador.        |
| [`SRPP-diseno-final-claroscuro.pdf`](SRPP-diseno-final-claroscuro.pdf)       | Documento A4 horizontal: reglas, color con contraste calculado, componentes y cada pantalla con su justificación y, al final, el plan base. |
| [`pdf/`](pdf/)                                                               | Fuente del PDF: `index.html`, `capturas/` e `imprimir.mjs`.                                                                                 |

Si `DESIGN.md` y el prototipo discrepan, gana `DESIGN.md`. El prototipo no es código de producción:
sirve de referencia visual y de comportamiento.

## Probar el prototipo

Abra `prototipo/index.html`. El rol lo decide el inicio de sesión:

| Rol           | Correo                            | Contraseña        | Segundo factor                |
| ------------- | --------------------------------- | ----------------- | ----------------------------- |
| Administrador | `diego.andrade@oasisseguros.ec`   | `Admin.Oasis1`    | cualquier código de 6 dígitos |
| Operador      | `andrea.villacis@oasisseguros.ec` | `Operador.Oasis1` | no aplica                     |
| Asegurado     | `mf.guaman@correo.ec`             | `Cliente.Oasis1`  | no aplica                     |

«Cuentas de ejemplo», en el ingreso, rellena el formulario. «Qué cambia en el diseño final», en el
menú de usuario, resume por pantalla lo que se suma, lo que se queda y lo que se descarta. Los datos
son de ejemplo y se comparten entre sesiones; «Reiniciar datos de ejemplo» (en esa misma ventana) los
restablece.

## Tokens finales para `apps/web/src/index.css`

Correspondencia de los roles de `DESIGN.md` con las variables de shadcn/ui. Es el estado **objetivo**;
`index.css` todavía tiene los valores del S4.

```css
:root {
  --background: #f0efed; /* lienzo hueso, el de la landing */
  --foreground: #1e1e1e; /* tinta */
  --card: #ffffff; /* papel */
  --card-foreground: #1e1e1e;
  --popover: #ffffff;
  --popover-foreground: #1e1e1e;
  --primary: #1e1e1e; /* botón principal sobre claro: tinta */
  --primary-foreground: #ffffff;
  --primary-hover: #3a3631;
  --secondary: #e6e4e0;
  --secondary-foreground: #1e1e1e;
  --muted: #e6e4e0;
  --muted-foreground: #57514a; /* tinta suave */
  --accent: #e6e4e0;
  --accent-foreground: #1e1e1e;
  --destructive: #a1452c; /* ladrillo de la landing */
  --destructive-foreground: #ffffff;
  --border: #dedcd8; /* hilo */
  --input: #8a857d; /* borde de campo */
  --ring: #1e1e1e;
  --link: #8a6630; /* tinta dorada de la landing */
  --sidebar: #1e1e1e; /* noche = negro de tarjeta */
  --sidebar-foreground: #f0efed;
  --sidebar-muted: #a39b90;
  --sidebar-primary: #e2bf7d; /* dorado de tarjeta */
  --sidebar-primary-foreground: #1a140c;
  --sidebar-accent: #2c2a27;
  --gold-gradient: linear-gradient(
    90deg,
    #c39a55 0%,
    #efd395 50%,
    #c39a55 100%
  ); /* METAL: botón dorado sobre noche */
  --night-glow: radial-gradient(120% 130% at 0% 0%, rgb(226 191 125 / 0.2), transparent 60%);
  --estado-error: #a1452c;
  --estado-neutro: #57514a;
  --estado-neutro-fondo: #e6e4e0;
  /* éxito, proceso y aviso no cambian */
}
```

Además: `--shadow-sm: 0 0 0 1px #e0deda, 0 4px 16px rgb(30 30 30 / 0.05)`; las sombras flotante y de
noche pasan de `rgb(20 17 13 / …)` a `rgb(30 30 30 / …)`; el filo de noche es `rgb(226 191 125 / 0.26)`
y el anillo de campo `rgb(138 102 48 / 0.32)`.

## Inventario para el plan de implementación

Lo que sigue es la base del plan de la fase de diseño del S5. No es el plan: no fija orden de
trabajo ni estimaciones.

### 1. Tokens y botón

| Archivo                                              | Hoy                                    | Cambio                                                                                                            |
| ---------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/index.css`                             | Paleta arena, negro cálido, oro 135°   | Los valores de arriba; registrar `--color-primary-hover`; sombras y filo de noche.                                |
| `apps/web/src/components/ui/button.tsx`              | `primary` dorado con `--gold-gradient` | `primary` en tinta con hover `#3a3631`; nueva variante `dorado` para paneles de noche; quitar `shadow-oro-login`. |
| `features/dashboard/components/PanelCliente.tsx`     | Acción dorada sobre el héroe de noche  | Usar `variant="dorado"`.                                                                                          |
| `features/auth/pages/LoginPage.tsx`                  | «Ingresar» dorado                      | Pasa a tinta con el `primary` nuevo; la barra de 80×3 px sigue dorada.                                            |
| `apps/web/e2e/diseno.spec.ts` y pruebas de contraste | Contrastes de la paleta del S4         | Recalcular con `DESIGN.md` (el enlace sobre el lienzo queda en 4,5:1).                                            |

### 2. Componentes

| Componente (propuesto)            | Hoy en la SPA                                                                | En el diseño final                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `CabeceraPersonal`                | No existe; el usuario vive en el riel (`MenuUsuario`)                        | Línea fija con buscador global, avisos y menú de usuario.                                                   |
| `BuscadorGlobal`, `MenuAvisos`    | No existen                                                                   | Búsqueda de clientes, pólizas y recibos; avisos de pagos por validar, cuotas vencidas y anclaje.            |
| `RielPersonal`                    | Inicio, Pagos, Cartera, Recibos, Verificar, Clientes, Pólizas, Aseguradoras… | Orden Inicio, Clientes, Pólizas, Pagos, Cartera, Recibos, Reportes, Admin.; sin avatar.                     |
| `FranjaCifras`                    | La cifra «Por validar» del inicio filtra Pagos                               | Franja de tres o cuatro cifras que filtran cada lista, con la de noche para lo que pide acción.             |
| `ListaDatos` y celdas             | `TablaDatos` con `RamoEtiqueta`, sin avatar ni plazo                         | Barra de lista, celda de identidad con avatar, `RamosApilados`, plazo en texto y «En mora» junto al estado. |
| `Paginacion`                      | `TablaDatos` con Anterior y Siguiente                                        | Números de página, «Mostrando a–b de n» y 8 filas por página en todas las listas.                           |
| `VentanaDetalle`                  | `PolizaDetallePage`, ficha en página y `PlanCuotasDialog`                    | Ventana modal de cliente y póliza con actividad (`LineaTiempo`) y cuotas.                                   |
| `DialogoCliente`, `DialogoPoliza` | `FormularioCliente` y `FormularioPoliza`                                     | Diálogos con ayuda de campo, validación de cédula o RUC y vista previa del plan de cuotas.                  |
| `RegistroRapido`                  | `FormularioPago` en su propia página                                         | Bloque en Inicio; la página completa sigue para adjuntar comprobante.                                       |
| `MiCuenta`, `SesionesAbiertas`    | `CambiarContrasenaPage` (primer ingreso)                                     | Página de cuenta con datos, contraseña con requisitos en vivo, segundo factor y sesiones.                   |
| `SistemaAdmin`                    | `SaludAnclaje` en el inicio del administrador                                | Pestaña con servicios, tareas programadas y recordatorios.                                                  |
| Listas del personal en móvil      | Tablas con desplazamiento horizontal                                         | Columnas secundarias ocultas bajo 760 px.                                                                   |

### 3. Pantallas

Cada pantalla tiene su captura en `pdf/capturas/proto-*.jpg` y su página en el PDF.

| Pantalla                 | Hoy                                 | Diseño final                                                        | Historia o sprint     |
| ------------------------ | ----------------------------------- | ------------------------------------------------------------------- | --------------------- |
| Ingreso y recuperación   | Ingreso; recuperar es un enlace     | Pie legal, recuperar con un paso real, bloqueo tras 5 intentos      | HU-01, HU-31 (S7)     |
| Inicio del personal      | Cifras y últimos recibos            | Cabecera, registro rápido, por validar y vencimientos de la semana  | HU-30 (S8), HU-38     |
| Clientes                 | Lista con formulario                | Franja, lista con identidad, ventana modal y diálogo de alta        | HU-07 a HU-10         |
| Pólizas                  | Lista y página de detalle           | Franja, lista con plazo, ventana modal con cuotas y diálogo de alta | HU-12 a HU-14         |
| Pagos y Cartera          | Lista con filtros en la URL         | Franja de cifras, buscador, paginación por números                  | HU-20, HU-38          |
| Recibos                  | Lista y verificación                | Franja por estado, buscador y verificador arriba                    | HU-24, HU-28          |
| Mi cuenta                | Solo el primer cambio de contraseña | Datos, contraseña, segundo factor y sesiones                        | HU-06, HU-52, ADR-027 |
| Administración · Sistema | No existe                           | Servicios, tareas programadas, recordatorios (propuesta)            | HU-37, HU-40 (S9)     |
| Portal · Cuenta          | Solo «Cerrar sesión»                | Mis datos y Cambiar contraseña                                      | HU-47, HU-29          |

### 4. Brechas de API y datos

Lo que el prototipo muestra y el API o el esquema no tienen hoy. Cada punto se confirma contra
`PRODUCT_BACKLOG.md` antes de construirse; los que no tengan historia se difieren.

| Brecha                                         | Hoy                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Dirección del cliente                          | `Cliente` no tiene `direccion` (sí `telefono` y `email`)                                                      |
| Cargo del usuario                              | `Usuario` no tiene `cargo`                                                                                    |
| Búsqueda global (clientes, pólizas, recibos)   | No hay ruta; cada lista busca por separado                                                                    |
| Avisos de la campana                           | No hay ruta; salen de contar pagos, cuotas y recibos ya existentes                                            |
| Actividad del cliente (pagos, recibos, cuotas) | No hay ruta; se arma con pagos y cuotas                                                                       |
| Sesiones abiertas y cerrar las otras           | Las sesiones viven en Redis (ADR-016) sin ruta para listarlas                                                 |
| Estado de los servicios                        | Solo `GET /operadora/saldo`                                                                                   |
| Ejecutar tareas programadas a mano             | Las tareas del worker no tienen ruta                                                                          |
| Recordatorios de cuota (correo, días, hora)    | El módulo `notificaciones` está vacío; HU-40 (S9) prevé el aviso, no su pantalla de configuración             |
| Exportar listas a CSV                          | HU-21 exporta pagos a CSV (S8); el módulo `reportes` está vacío (ADR-028). Exportar otras listas es propuesta |
| Recuperar contraseña y segundo factor          | `TokenRecuperacion` existe; ruta y TOTP llegan en S7 (ADR-027)                                                |

### 5. Decisiones que el diseño ya tomó

- Sin selección múltiple, sin «Siniestros» y sin recordatorios por SMS.
- «Exportar» y los recordatorios van marcados como propuesta hasta confirmar su historia.
- El hueso `#f0efed` se queda como fondo de trabajo aunque la landing use blanco (ADR-030).
- La ventana modal reemplaza a la hoja lateral (ADR-031).

### 6. Verificación que habrá que ajustar

- `apps/web/e2e/diseno.spec.ts`: el arreglo `PANTALLAS` suma Clientes, Pólizas, Mi cuenta y Sistema;
  axe `wcag2a`/`wcag2aa` con la paleta nueva; objetivos de 44 × 44 px en el portal.
- Pruebas de Vitest de `Button`, `RielPersonal`, `AppLayout` y las listas, que hoy miran clases.
- Capturas de la SPA para el PDF (`imprimir.mjs --spa <carpeta>`) cuando exista la implementación.

## Regenerar las capturas y el PDF

Desde la raíz del repositorio:

```bash
pnpm --filter @oasis/web exec node ../../docs/diseno/pdf/imprimir.mjs --prototipo   # recaptura el prototipo e imprime
pnpm --filter @oasis/web exec node ../../docs/diseno/pdf/imprimir.mjs               # solo imprime
```

Opciones: `--solo-capturas` no imprime el PDF; `--spa <carpeta>` importa capturas PNG de la SPA. Si
Playwright pide una versión de Chromium que no está instalada, instálela con
`pnpm --filter @oasis/web exec playwright install chromium` o apunte a otro con
`CHROMIUM_PATH=<ejecutable>`.
