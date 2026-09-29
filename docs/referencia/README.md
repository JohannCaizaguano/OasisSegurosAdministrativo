# Documentos de referencia

Esta carpeta contiene las **fuentes de verdad** del proyecto. Si algo en otro
documento, en el prompt de un sprint o en el código contradice lo que hay aquí,
gana lo que hay aquí (y la contradicción se reporta):

- `PRODUCT_BACKLOG.md` — historias de usuario y técnicas, criterios de
  aceptación, definición de listo y de terminado, y sprint backlog por semana.
- `ARQUITECTURA.md` — documento de arquitectura (arc42 + C4): principios,
  restricciones, patrones, estructura del repositorio, CI/CD, modelo de datos,
  aspectos transversales y registro de decisiones (tabla §11).

Estos dos documentos **no se editan** en este repositorio: se copian desde la
entrega del autor del proyecto y se tratan como entrada inmutable. Por eso están
excluidos de Prettier (`.prettierignore`).

## Diagramas originales

La carpeta `arquitectura_img/` debe contener los diagramas citados por
`ARQUITECTURA.md`. **Aún no están versionados**; ver
`arquitectura_img/README.md` para la lista de archivos esperados.

## Documentos complementarios

Los diagramas de arquitectura en formato texto (Mermaid) y las fichas C4 viven
en `docs/arquitectura/`, y el registro de decisiones en `docs/adr/`.
