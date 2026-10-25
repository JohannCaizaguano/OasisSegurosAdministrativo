# ADR-025 · Almacenamiento y entrega de comprobantes

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: S7

## Contexto

HU-17 permite al cliente reportar un pago hecho fuera del débito bancario, con un comprobante PDF,
JPG o PNG de hasta 5 MB. El archivo es contenido no confiable y puede llevar metadatos personales
(la ubicación GPS de una foto). Solo el personal y el cliente dueño pueden verlo.

## Decisión

- **Validación por contenido** con `FileTypeValidator` de NestJS (números mágicos) y
  `MaxFileSizeValidator`; la extensión y el `Content-Type` del cliente no se usan.
- **Saneamiento:** las imágenes se reprocesan con sharp (`rotate()` y reexportación sin metadatos);
  los PDF se guardan tal cual, con la limitación anotada.
- **Almacenamiento** en un volumen fuera de cualquier carpeta servida (`COMPROBANTES_DIR`), con
  nombre `UUID + extensión`; la base guarda solo el nombre.
- **Entrega** por `GET /pagos/:id/comprobante` (personal) y `GET /mis-pagos/:id/comprobante` (dueño;
  ajeno → 404) como descarga, con `X-Content-Type-Options: nosniff` y `Cache-Control: no-store`; el
  nombre se valida con una expresión estricta y la ruta resuelta debe quedar dentro del directorio.
- **Eliminación:** la anonimización del titular (HU-53) borra el archivo.

## Alternativas descartadas

- **Almacenamiento de objetos (S3):** otro encargado y otra credencial para pocos archivos al día;
  el volumen entra en los respaldos (ADR-026).
- **Guardar el archivo en PostgreSQL:** infla la base y los respaldos diarios.

## Consecuencias

- Positivas: un archivo malicioso no se ejecuta en el navegador ni se sirve como estático; las fotos
  no filtran la ubicación.
- Negativas: los metadatos de los PDF no se limpian; el volumen debe respaldarse junto con la base.
