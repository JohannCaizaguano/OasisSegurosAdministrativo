# ADR-028 · Generación de reportes en CSV y PDF en el servidor

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: S8 (reutilizada en S9)

## Contexto

HU-43 (conciliación), HU-44 (cartera vencida) y HU-21 (exportar pagos) exportan a CSV, y HU-43,
HU-44 y HU-41 (recibo) a PDF con la identidad de Oasis. El personal abre los CSV en Excel con la
configuración regional de Ecuador, y un CSV con datos del cliente puede llevar una inyección de
fórmulas.

## Decisión

- **CSV:** utilidad única con BOM UTF-8, separador `;`, coma decimal, comillas escapadas, saltos
  `\r\n` y neutralización de toda celda que empiece con `=`, `+`, `-`, `@`, tabulación o retorno de
  carro (se antepone `'`). Se responde en flujo, por lotes, con un límite de filas por reporte.
- **PDF:** `pdfkit` en el servidor detrás de un `GeneradorPdfPort`, con el isologo, las fuentes
  Outfit y Figtree incluidas en el repositorio, el encabezado de noche con filo dorado, tablas con
  cifras tabulares y pie con la fecha, el usuario y la página. El recibo en PDF incluye el QR de
  verificación.
- **Auditoría:** exportar pagos queda en la bitácora con los filtros usados.

## Alternativas descartadas

- **Navegador sin cabeza (Playwright o Chromium) para el PDF:** imagen de cientos de MB y más
  superficie en producción para tres plantillas.
- **pdfmake:** más declarativo, pero más pesado; pdfkit basta para tablas y un encabezado.
- **CSV con coma y punto decimal:** Excel en es-EC lo abre en una sola columna.

## Consecuencias

- Positivas: un solo generador para los tres PDF y una sola utilidad de CSV con la regla de
  seguridad en un lugar.
- Negativas: el diseño del PDF se programa a mano (posiciones y tamaños); un CSV con `;` puede
  requerir ajustes en herramientas configuradas en inglés.
