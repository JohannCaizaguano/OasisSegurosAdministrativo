# ADR-022 · Importación de cartera en el servidor con vista previa

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: S6 (reutilizada por HU-50 en S7)

## Contexto

Oasis lleva su cartera en archivos de Excel (reunión del 07/10/2026), por eso HU-34 es de prioridad
ALTA: importar clientes y pólizas con las mismas reglas del registro manual, con una vista previa
antes de confirmar y límites de 5 MB y 5 000 filas. El backlog fija SheetJS 0.20.3 desde su CDN
oficial porque la versión del registro npm tiene vulnerabilidades conocidas.

## Decisión

- **Procesamiento en el API.** `POST /importaciones/vista-previa` recibe el archivo en memoria
  (nunca se escribe a disco), comprueba su firma (ZIP para .xlsx, texto UTF-8 para .csv), lo lee con
  SheetJS sin fórmulas ni HTML y con un tope de filas, y valida cada fila con los mismos esquemas y
  reglas de dominio del registro manual.
- **Vista previa en Redis.** Las filas normalizadas se guardan 30 min en `importacion:<uuid>`,
  asociadas al usuario; la respuesta lista las válidas y los errores por fila y columna.
- **Confirmación.** `POST /importaciones/:id/confirmar` revalida la unicidad, inserta las filas
  válidas en lotes de 500 (cada lote en su transacción), guarda un registro `Importacion` con el
  resumen y deja la acción `IMPORTAR` en la bitácora. Un registro existente es un error de fila, no
  una actualización.
- **Plantillas** descargables en .xlsx (con hoja de instrucciones) y .csv; las pólizas incluyen
  cobertura, condiciones y número de cuotas (ADR-020).
- **Reutilización.** HU-50 agrega el tipo `PAGOS_ASEGURADORA` con la aseguradora elegida (ADR-024).

## Alternativas descartadas

- **Leer el archivo en la SPA:** la validación debe vivir en el servidor de todos modos y la
  vista previa no puede confiar en el navegador.
- **SheetJS desde npm:** versión con vulnerabilidades conocidas (criterio de HU-34).
- **Actualizar registros existentes desde el archivo:** una importación que sobrescribe datos sin
  revisión es un riesgo de integridad; las correcciones se hacen una por una.

## Consecuencias

- Positivas: una sola definición de las reglas para el registro manual y la importación; ningún
  archivo queda en el servidor.
- Negativas: la dependencia viene de una URL fuera del registro npm (Renovate no la actualiza);
  vistas previas de hasta 5 000 filas ocupan memoria de Redis durante 30 min.
