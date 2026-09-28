# Reporte de gas · RegistroRecibos

Generado por `pnpm run reporte`. Cifras en unidades de gas, agrupando las
mediciones de las pruebas de Solidity (forge-std) y de las de TypeScript (viem)
sobre el mismo contrato.

**Perfil de las cifras de gas por función: `default`** (`hardhat test` compila
con ese perfil y con `--coverage` inyecta instrumentación). Lo que se despliega
en Amoy es el perfil `production`, cuyo bytecode es un 44 % menor, así
que el gas real de cada operación es más bajo que el de la tabla. La comparación
de tamaños está más abajo, recompilada por el propio script.

| Métrica | Valor |
| --- | --- |
| Gas de despliegue (perfil `default`) | 1.207.223 |

## Optimizador

El tamaño del bytecode cambia radicalmente según el perfil de compilación, y el
ABI es idéntico en ambos (32 entradas), por lo que desplegar sin optimizador
solo encarece el despliegue sin aportar nada:

| Perfil | Bytecode en runtime | ABI |
| --- | ---: | ---: |
| `default` (sin optimizador) | 3.994 bytes | 32 entradas |
| `production` (optimizer, 200 runs) | 2.221 bytes | 32 entradas |

El optimizador reduce el bytecode un 44 % y el ABI es idéntico (32
entradas), así que desplegar sin él solo encarece el despliegue. Los scripts
`deploy:local` y `deploy:amoy` compilan con `production`, de modo que el
bytecode desplegado y verificado en Amoy es el optimizado.

| Función | Mínimo | Media | Máximo | Llamadas |
| --- | ---: | ---: | ---: | ---: |
| `anular(bytes32,bytes32)` | 36.061 | 36.067 | 36.073 | 4 |
| `DEFAULT_ADMIN_ROLE()` | 373 | 10.905 | 21.437 | 2 |
| `grantRole(bytes32,address)` | 51.826 | 52.022 | 52.042 | 11 |
| `hasRole(bytes32,address)` | 3.187 | 13.964 | 24.747 | 4 |
| `pause()` | 50.149 | 50.149 | 50.149 | 3 |
| `REGISTRADOR_ROLE()` | 413 | 17.966 | 21.477 | 12 |
| `registrar(bytes32,bytes32)` | 78.411 | 78.417 | 78.423 | 12 |
| `unpause()` | 28.267 | 28.267 | 28.267 | 2 |
| `verificar(bytes32)` | 8.654 | 18.243 | 30.230 | 9 |

Notas:

- Las mediciones se hacen contra la cadena de pruebas en memoria de Hardhat
  (Amoy tiene el mismo coste en gas; lo que cambia es el precio del gas).
- `verificar` es una vista: su gas no lo paga el usuario, pero se incluye por
  completitud del informe.
- `registrar` ronda las 78k unidades: es la operación que paga el sistema por
  cada recibo, y el valor debe citarse en el informe de resultados.
