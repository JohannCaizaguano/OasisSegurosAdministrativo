# ADR-019 · Diseño de interfaz Claroscuro

- **Estado**: aceptado
- **Fecha**: 2026-10-23
- **Sprint**: S4 (decisión); implementación en HT-13

## Contexto

HT-13 pide implementar el sistema de diseño de la interfaz (RNF-20, RNF-26). El 06/10/2026 se
presentaron tres propuestas (A · Sello, B · Claro y C · Cercano) en
`SRPP-propuestas-diseno.pdf`. La SPA sigue con el tema por defecto de shadcn/ui (azul y gris), sin
relación con el manual de marca. El backlog v1.5 (23/10/2026) retiró además el pago en línea
(HU-48 y HU-49) y agregó la carga de la notificación de cobros de la aseguradora (HU-50). Por eso
las tres propuestas mostraban pantallas que ya no existen.

## Decisión

- **Claroscuro** es el diseño final: la estructura de C · Cercano (riel de iconos, resumen del
  día, mesa de validación en dos paneles, portal móvil) con la paleta del manual de marca. Usa
  lienzo de arena `#f6f4f0`, tinta `#1a1714`, paneles de noche `#14110d` y el degradado dorado del
  isologo, este solo en la acción principal de cada vista.
- **Fuente normativa:** `apps/web/DESIGN.md` (tokens y reglas, formato DESIGN.md de impeccable) y
  su sidecar `apps/web/.impeccable/design.json`. El prototipo navegable
  `docs/diseno/prototipo/` y el documento `docs/diseno/SRPP-diseno-final-claroscuro.pdf` muestran
  cada pantalla con su justificación.
- **Tipografía:** Outfit para títulos y cifras, Figtree para el texto; ambas OFL, autoalojadas con
  Fontsource.
- **Accesibilidad calculada:** texto ≥ 4,5:1, foco ≥ 3:1. El foco es tinta sobre superficies
  claras y oro sobre la noche, porque el oro sobre arena da 1,44:1. El texto sobre la fotografía
  del ingreso se mide en el peor píxel en 1440, 1280 y 390 px.
- **Administración:** dos cuentas ADMIN (el dueño y el administrador técnico) con segundo factor,
  indicadores y salud del anclaje en su inicio, y un hub «Admin.» con usuarios y cuentas de
  clientes, anclaje, bitácora, catálogos y seguridad. Reintentar y anular viven en el detalle del
  recibo. Lo que no es del operador se oculta.
- **Alcance del portal:** sin pago en línea. El teléfono tiene 4 pestañas y el cliente reporta
  con comprobante lo que pagó fuera del débito bancario (HU-17).

## Alternativas descartadas

- **A · Sello con el portal de C** (la recomendación del documento de propuestas): la serifa y la
  barra lateral oscura daban más autoridad al recibo, pero dejaban dos lenguajes visuales en un
  mismo producto.
- **C · Cercano con su café y arena:** el café `#6e532a` como color de acción se alejaba del negro
  y el oro con que el bróker se presenta.
- **Oro plano sin degradado:** más simple de implementar, pero perdía el único rasgo que reconoce
  la marca; se limitó el degradado a un elemento por vista en lugar de eliminarlo.

## Consecuencias

- Positivas: la SPA tiene un único sistema de tokens trazable al manual de marca; cada pantalla
  futura (HU-17, HU-24, HU-50) parte de una referencia aprobada y de reglas verificables (una
  acción dorada, estado con texto, icono y color, objetivos de 44 px).
- Negativas: HT-13 debe reescribir `index.css`, las variantes de unos 10 componentes de shadcn/ui
  y `AppLayout`; las filas de 56 px muestran menos registros por pantalla que una tabla densa.
- Pendiente: agregar ADR-019 a la tabla 11-1 de `docs/referencia/ARQUITECTURA.md` (lo hace el
  autor; ese documento no se edita desde el repositorio).
