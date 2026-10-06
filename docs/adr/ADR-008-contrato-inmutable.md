# ADR-008 · Contrato inmutable, sin proxy actualizable

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: 2

## Contexto

`RegistroRecibos` es la evidencia pública de los recibos (ADR-003, ADR-004): su valor depende de
que nadie, ni siquiera el bróker, pueda cambiar sus reglas después de anclar. HT-02 lo despliega en
Amoy en el Sprint 2, y los sprints siguientes (S7, S8 y S13) usan esa dirección.

## Decisión

- Desplegar el contrato sin proxy, con Ignition: su código no puede cambiar.
- Congelar el código antes del despliegue; coincide con la tabla 9-1 de la arquitectura.
- Una versión nueva se despliega como otro contrato con otra dirección, y el sistema la adopta
  cambiando `CONTRACT_ADDRESS` (RNF-19).
- Lo que sí cambia sin redespliegue: la parada de emergencia (`pause`/`unpause`) y la rotación de
  `REGISTRADOR_ROLE` (ADR-006).

## Alternativas descartadas

- **Proxy UUPS o transparente (OpenZeppelin)**: permite corregir errores, pero quien controla la
  actualización podría cambiar las reglas de evidencias ya ancladas; además agrega inicializadores,
  disposición de almacenamiento y superficie de ataque.
- **Diamond (EIP-2535)**: complejidad desproporcionada para tres funciones.

## Consecuencias

- Positivas: un tercero confía en que el código verificado en PolygonScan es el que ejecutó cada
  registro; menos código y menos superficie para Slither.
- Negativas: un error exige desplegar otro contrato y conservar el anterior para verificar recibos
  antiguos. Hoy la verificación consulta el contrato de `CONTRACT_ADDRESS`, aunque cada `Recibo`
  guarda su `chainId` y `contractAddress`; si llega a existir un segundo contrato, la verificación
  deberá usar la dirección guardada en el recibo.
