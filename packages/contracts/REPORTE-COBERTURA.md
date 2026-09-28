# Reporte de cobertura · RegistroRecibos

Generado por `pnpm run reporte`. Umbral exigido: **90 %** (el script falla
si no se alcanza).

| Métrica | Cubiertas | Total | % |
| --- | ---: | ---: | ---: |
| Líneas | 23 | 23 | 100.00 |

## Qué NO mide esta herramienta

El plugin de cobertura de Hardhat 3 instrumenta **líneas y sentencias**, no
ramas ni funciones. Su informe HTML muestra "Branches 100 %" y "Functions
100 %" con 0 elementos instrumentados: es una casilla vacía de la plantilla, no
una medición. Por eso este documento no afirma cobertura de ramas.

- Las 6 rutas de error del contrato (`IdReciboInvalido`, `HashReciboInvalido`,
  `ReciboYaRegistrado`, `ReciboNoRegistrado`, `ReciboYaAnulado`,
  `SoloRegistrador`) sí están cubiertas por tests explícitos, pero eso es
  cobertura de casos, no de ramas instrumentadas.
- Para medir ramas de verdad hay que migrar los tests a Foundry
  (`forge coverage` con `forge-std`), que no está en el stack acordado.
