# ADR-031 · Diseño final: Claroscuro v2

- **Estado**: aceptado (implementación pendiente: fase de diseño del S5)
- **Fecha**: 2026-11
- **Sprint**: S5

## Contexto

El ADR-019 aprobó Claroscuro en el S4 y la SPA lo implementó. En el S5 se comparó con el sistema
anterior de Oasis (`OasisSeguros`, Next.js) y con la landing, y se armó un prototipo navegable que
une lo mejor de los tres. El sistema anterior ofrecía listas más legibles (cifras que filtran,
avatar, íconos de ramo, plazo en texto, detalle sin salir de la lista, paginación por números) y
una cabecera con buscador y avisos; le faltaban estados con texto e ícono y un lenguaje de color
sin acentos sueltos. La landing aportó la paleta (ADR-030).

## Decisión

Se adopta como diseño final el prototipo de `docs/diseno/prototipo/` y el documento
`apps/web/DESIGN.md`:

- **Color y botón:** paleta de la landing y botón principal en tinta (ADR-030).
- **Cabecera del personal:** buscador global, campana de avisos y menú de usuario con su nombre y rol.
  El usuario deja el riel.
- **Riel:** Inicio, Clientes, Pólizas, Pagos, Cartera, Recibos, Reportes y Admin. «Registrar pago»
  no es un destino del riel: vive como bloque de registro rápido en Inicio y como botón de Pagos.
- **Listas:** cifras que filtran, barra con búsqueda y filtros, filas con avatar, íconos de ramo
  apilados y plazo en texto, 8 filas por página con paginación numérica. Pólizas es una lista propia.
- **Detalle:** ventana modal centrada para cliente y póliza (no hoja lateral), con actividad y
  cuotas. Diálogos de alta para cliente y póliza con ayuda de campo y validación en línea.
- **Cuenta:** inicio de sesión con credenciales, recuperación de contraseña, bloqueo tras 5
  intentos, «Mi cuenta» con cambio de contraseña, sesiones abiertas y segundo factor.
- **Administración:** pestaña Sistema con estado de servicios, tareas programadas y recordatorios
  (este último es propuesta: HU-40, S9, prevé el aviso pero no su pantalla).
- **Móvil:** las listas del personal se apilan bajo 760 px; el portal conserva la barra inferior y
  suma Mis datos y Cambiar contraseña.

El ADR-019 sigue vigente en lo que no contradice a este: la estructura, los estados con texto e
ícono, el portal móvil y la mesa de validación.

## Alternativas descartadas

- **Hoja lateral para el detalle:** se prefirió la ventana modal; la hoja deja la lista a medias y
  en el teléfono ocupa lo mismo.
- **«Registrar» como destino del riel:** duplicaba a Pagos y alargaba el menú.
- **Fondo blanco puro:** la landing es blanca, pero el hueso de trabajo descansa más en jornadas de
  validación y se mantiene.
- **Selección múltiple y «Siniestros»:** el sistema anterior las dibujaba sin función; no se
  incluyen.
- **Alternativas C de color (lámina dorada, hilo dorado, General Sans):** no se adoptan.

## Consecuencias

- Positivas: una sola lista y una sola ventana para todos los datos; el personal busca, filtra y
  consulta sin cambiar de página; el sistema se siente la misma marca que la landing.
- Negativas: el código sigue en el diseño anterior hasta la fase de diseño del S5. Varias piezas del
  prototipo no tienen respaldo en el API o en el backlog (búsqueda global, avisos, sesiones
  abiertas, tareas con «Ejecutar ahora», recordatorios, actividad del cliente, dirección del
  cliente, cargo del usuario); el inventario está en `docs/diseno/README.md` y cada una se confirma
  contra `PRODUCT_BACKLOG.md` antes de construirse.
