# Sprint 2 — Plan de implementación

- **Historias:** HT-02 Contrato inteligente RegistroRecibos (18 h) y HU-45 Bitácora de auditoría
  (6 h): 24 de 25 horas de capacidad.
- **Rama:** `feat/sprint-02-contrato-bitacora`.
- **Ejecuta:** agente local (OpenCode) sobre esta copia del repositorio.
- **Decisiones acordadas con el desarrollador:** 01/10/2026 (sección 2).

Este documento es el Sprint Backlog del Sprint 2. Las reglas generales están en `AGENTS.md` y la
fuente de verdad en `docs/referencia/`, que no se edita. Si algo de este plan contradice
`docs/referencia/`, gana la referencia: detente y repórtalo.

## 0. Reglas de ejecución

1. Ejecuta las fases en orden: 0 → 1 → (2 en paralelo con 3) → 4 → 5.
2. Los pasos marcados con 👤 los ejecuta el usuario, porque descifran el keystore de Hardhat con una
   contraseña interactiva. **Nunca** pidas, leas, imprimas ni guardes claves privadas, la API key de
   Etherscan ni la URL del RPC: solo recibes datos públicos (direcciones, hashes de transacción,
   bloques).
3. TDD en el código nuevo de HU-45: primero la prueba en rojo y luego el código.
4. Antes de dar por terminada una fase, ejecuta su verificación y guarda la salida para el informe.
5. **Un solo commit** al final (sección 10). **No hagas push ni abras el PR**: los hace el usuario.
6. No adelantes trabajo de otros sprints; lo que quede fuera de alcance se anota como deuda en el
   informe (sección 9.2).
7. Comentarios solo para el porqué no obvio y en español; nada de narrar cambios (ver `AGENTS.md`).

## 1. Alcance

### HT-02 — criterios de aceptación

1. registrar(id, hash) solo lo ejecuta REGISTRADOR_ROLE, rechaza identificadores repetidos y hash
   cero, y emite ReciboRegistrado.
2. anular, verificar, pause y unpause funcionan según los roles definidos.
3. La cobertura de pruebas es ≥ 90 % y se genera el reporte de gas por función.
4. Slither no reporta hallazgos de severidad alta.
5. El contrato está desplegado y verificado en Amoy, y un script registra un hash de prueba.
6. El ABI tipado se exporta a packages/shared.

Requisitos: RNF-07 (gas medio ≤ 100 000 por registro) y RNF-14 (sin hallazgos altos en Slither).

### HU-45 — criterios de aceptación

1. Se registran creación, modificación, validación, rechazo, anulación, inicio de sesión e
   importación.
2. Cada registro guarda usuario, fecha, IP, entidad afectada y acción.
3. Los registros no se pueden modificar ni eliminar desde la aplicación (RN-17).
4. El ADMIN consulta la bitácora con filtros por usuario, acción y fecha.

Requisitos: RF-50 y RNF-27 (conservación de al menos 1 año, sin modificación desde la aplicación).

### Fuera de alcance (no implementar)

- Motivo obligatorio de la anulación y su hash en la cadena (HU-27, S11). El contrato no cambia.
- Importación de clientes y pólizas (HU-34, S13): solo se declara la acción `IMPORTAR`.
- Gestión de usuarios (HU-04, S4), ADR-007 (S7) y RPC de respaldo del worker.
- Copiar `OPERATOR_PRIVATE_KEY` a `.env.worker` del VPS (HT-06, S13).

## 2. Decisiones tomadas (no reabrir)

| #   | Decisión                                                                                                                                                                                                                                                                             | Motivo                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| D1  | Cerrar brechas sobre el código existente: no se reescribe el contrato ni el modelo de datos.                                                                                                                                                                                         | El contrato y la tabla de la bitácora ya cumplen buena parte de los criterios.                                             |
| D2  | El contrato queda **congelado** tal cual (coincide con la tabla 9-1 de la arquitectura). Solo se agregan pruebas.                                                                                                                                                                    | Después del despliegue en Amoy es inmutable (ADR-008).                                                                     |
| D3  | Slither analiza `RegistroRecibos.sol` directamente, no el proyecto Hardhat, con `fail_on: medium`.                                                                                                                                                                                   | Los tests Foundry rompen `crytic-compile`; `medium` es más estricto que RNF-14.                                            |
| D4  | Amoy: el agente prepara configuración, scripts y guion; el usuario ejecuta los comandos que usan el keystore y entrega las salidas públicas.                                                                                                                                         | Secretos y contraseña interactiva.                                                                                         |
| D5  | Se crea ya la cuenta operadora (`REGISTRADOR_ROLE`), que firma el hash de prueba desde una red nueva `amoyOperador`.                                                                                                                                                                 | Separación de roles (ADR-006); la cuenta se usa también en S7 y S13.                                                       |
| D6  | El despliegue en Amoy es **definitivo**: S7, S8 y S13 usarán esa dirección.                                                                                                                                                                                                          | Contrato inmutable sin cambios pendientes.                                                                                 |
| D7  | Se versiona `packages/contracts/ignition/deployments/chain-80002/`; `chain-31337` sigue ignorado.                                                                                                                                                                                    | Evidencia del despliegue y `ignition verify` reproducible.                                                                 |
| D8  | RPC de Amoy: el despliegue usa la URL propia del usuario (`AMOY_RPC_URL` del keystore). La documentación cita `https://polygon-amoy-bor-rpc.publicnode.com` como alternativa pública; `rpc-amoy.polygon.technology` ya no resuelve en DNS (verificado el 01/10/2026) y se reemplaza. | El RPC documentado dejó de funcionar.                                                                                      |
| D9  | Se instrumentan **todas** las mutaciones HTTP existentes con un catálogo de 9 acciones; `IMPORTAR` queda declarada para S13.                                                                                                                                                         | Es la única forma de demostrar el criterio 1 en este sprint.                                                               |
| D10 | Captura declarativa: decorador `@Auditar(accion, entidad)` más un interceptor global que inserta tras la respuesta exitosa. No es atómica con la operación (riesgo documentado en ADR-013).                                                                                          | Diff mínimo; no toca los casos de uso.                                                                                     |
| D11 | Del inicio de sesión solo se registran los exitosos.                                                                                                                                                                                                                                 | `usuarioId` es obligatorio; los intentos fallidos ya quedan en el log y los limita el throttler.                           |
| D12 | Inmutabilidad en dos capas: el puerto no ofrece editar ni borrar, y un trigger de PostgreSQL rechaza UPDATE, DELETE y TRUNCATE.                                                                                                                                                      | Evidencia verificable de RN-17.                                                                                            |
| D13 | `detalle` solo guarda metadatos técnicos: método, ruta, `requestId` y, en MODIFICAR, los nombres de los campos (sin valores).                                                                                                                                                        | La bitácora es inmutable y una solicitud de eliminación del titular (LOPDP, ERS §6.4) no podría atenderse si guarda datos. |
| D14 | Consulta con `GET /api/v1/bitacora` (ADMIN) y una página "Bitácora" en la SPA (ADMIN). Fechas filtradas y mostradas en hora de Ecuador (UTC−5).                                                                                                                                      | Revisión del PO en pantalla; pauta "quién hizo qué y cuándo" de los diseños.                                               |
| D15 | Se agregan `.claude/` y `docs/*.docx` a `.gitignore`, y se versiona `CLAUDE.md`.                                                                                                                                                                                                     | `.claude/` rompe `pnpm format:check`; el contenido de los `.docx` ya está en `docs/referencia/`.                           |
| D16 | Un solo commit; el usuario hace push y abre el PR.                                                                                                                                                                                                                                   | `AGENTS.md` y preferencia del usuario.                                                                                     |

## 3. Estado de partida (verificado el 01/10/2026)

- `RegistroRecibos.sol` coincide con la tabla 9-1. Tiene 26 pruebas (16 en Solidity y 10 en TS),
  100 % de líneas cubiertas, `registrar` ≈ 78 423 de gas y el ABI se exporta con control de deriva
  en CI.
- Slither 0.11.6 sobre el archivo del contrato (solc 0.8.28 y remaps de OpenZeppelin): **0
  hallazgos**. El job de CI falla solo por cómo se invoca.
- `REPORTE-COBERTURA.md` menciona un error `SoloRegistrador` que no existe en el contrato.
- Keystore de producción de Hardhat: contiene `AMOY_RPC_URL` (URL propia del usuario),
  `DEPLOYER_PRIVATE_KEY`, `ETHERSCAN_API_KEY` y `OPERATOR_PRIVATE_KEY`. La cuenta operadora ya
  existe y el usuario ya tiene POL en Amoy.
- Gas en Amoy: 40 gwei. El sprint cuesta como máximo ≈ 0,055 POL (despliegue ≤ 0,048,
  `grantRole` ≈ 0,002 y `registrar` ≈ 0,003).
- Hardhat 3.18 ya trae Amoy (chainId 80002) con PolygonScan como explorador, y
  `hardhat-viem-assertions` viene con el toolbox.
- La tabla `BitacoraAuditoria` existe desde la migración inicial. El módulo
  `apps/api/src/modules/auditoria/` está vacío (`.gitkeep`) y `trust proxy = 1` ya está activo.
- `pnpm format:check` falla en local por los archivos de `.claude/`.

## 4. Fase 0 — Preparación (0,5 h)

```bash
git switch main && git pull --ff-only
git switch -c feat/sprint-02-contrato-bitacora
pnpm install --frozen-lockfile
pnpm -r build
```

### T0. Limpieza del repositorio (D7, D15)

En `.gitignore`:

1. Reemplaza la línea `packages/contracts/ignition/deployments/` por:

   ```gitignore
   # Despliegues de Ignition: solo se versiona Amoy (evidencia y `ignition verify`).
   packages/contracts/ignition/deployments/*
   !packages/contracts/ignition/deployments/chain-80002/
   ```

2. En la sección "Artefactos de asistentes/agentes de IA", agrega `.claude/`.
3. Al final del archivo agrega:

   ```gitignore
   # Originales en Word: su contenido está en docs/referencia/
   docs/*.docx
   ```

Verificación: `git status --short` ya no lista `.claude/` ni los `.docx`, pero sí `CLAUDE.md`. La
línea base debe quedar en verde:

```bash
pnpm -r lint && pnpm format:check && pnpm -r typecheck && pnpm deps:check && pnpm test
```

## 5. Fase 1 — HT-02: código (9 h)

### T1. Pruebas de roles del contrato (2 h)

`packages/contracts/test/RegistroRecibos.t.sol`:

1. Agrega `import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";`.
2. Cambia los `vm.expectRevert()` sin argumentos por el error exacto. Lee el rol **antes** de
   `vm.prank`, porque la llamada al getter consumiría el prank:

   ```solidity
   function test_Registrar_Revert_SinRol() public {
       bytes32 rolRegistrador = registro.REGISTRADOR_ROLE();
       vm.prank(intruso);
       vm.expectRevert(
           abi.encodeWithSelector(
               IAccessControl.AccessControlUnauthorizedAccount.selector, intruso, rolRegistrador
           )
       );
       registro.registrar(ID_RECIBO, HASH_RECIBO);
   }
   ```

   Aplica lo mismo en `test_Anular_Revert_SinRol` (cuenta `intruso`, rol `REGISTRADOR_ROLE`) y en
   `test_Pause_Revert_SinAdmin` (cuenta `registrador`, rol `DEFAULT_ADMIN_ROLE`).

3. Agrega dos pruebas:
   - `test_Unpause_Revert_SinAdmin`: el admin pausa y el registrador llama a `unpause()`. Debe
     revertir con `AccessControlUnauthorizedAccount(registrador, DEFAULT_ADMIN_ROLE)`.
   - `test_Anular_PermitidoMientrasPausado`: se registra un recibo, el admin pausa y el registrador
     lo anula con éxito; `verificar()` devuelve `anulado = true`. Documenta la arquitectura §5.4:
     la pausa solo detiene registros nuevos.

`packages/contracts/test/RegistroRecibos.test.ts`: importa `getAddress` de `viem` y reemplaza cada
`assert.rejects(...)` por la aserción del error exacto con `viem.assertions`:

| Prueba existente                         | Aserción nueva                                                                                                                                                              |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| revierte sin `REGISTRADOR_ROLE`          | `revertWithCustomErrorWithArgs(promesa, registro, 'AccessControlUnauthorizedAccount', [getAddress(intruso.account.address), rolRegistrador])`                               |
| revierte con id duplicado                | `revertWithCustomErrorWithArgs(promesa, registro, 'ReciboYaRegistrado', [ID_RECIBO])`                                                                                       |
| revierte con id cero o hash cero         | `revertWithCustomError(promesa, registro, 'IdReciboInvalido')` y `'HashReciboInvalido'`                                                                                     |
| no registra en pausa                     | `revertWithCustomError(promesa, registro, 'EnforcedPause')`                                                                                                                 |
| solo el admin puede pausar               | `revertWithCustomErrorWithArgs(promesa, registro, 'AccessControlUnauthorizedAccount', [getAddress(registrador.account.address), await registro.read.DEFAULT_ADMIN_ROLE()])` |
| revierte al anular inexistente o anulado | `revertWithCustomErrorWithArgs(..., 'ReciboNoRegistrado', [ID_RECIBO])` y `'ReciboYaAnulado'` con `[ID_RECIBO]`                                                             |

Agrega `it('solo el admin puede reanudar', …)` e
`it('con el contrato pausado se puede anular un recibo existente', …)`, equivalentes a las de
Solidity.

Resultado esperado: **30 pruebas** (18 en Solidity y 12 en TS) en verde con
`pnpm --filter @oasis/contracts test`.

### T2. Reporte de cobertura y gas (0,5 h)

En `packages/contracts/scripts/reporte.ts`:

1. En la plantilla de `REPORTE-COBERTURA.md`, reemplaza el punto que empieza con "Las 6 rutas de
   error del contrato" por este texto (escapa las comillas invertidas como en el resto del template
   literal):

   ```text
   - Los 6 errores propios del contrato (`AdminInvalido`, `IdReciboInvalido`,
     `HashReciboInvalido`, `ReciboYaRegistrado`, `ReciboNoRegistrado`,
     `ReciboYaAnulado`) y los heredados `AccessControlUnauthorizedAccount` y
     `EnforcedPause` tienen pruebas explícitas, pero eso es cobertura de casos,
     no de ramas instrumentadas.
   ```

2. Borra el comentario `// Gas del perfil de producción (el que se despliega).`: la variable que le
   sigue toma el gas del perfil `default`.

Regenera los reportes con el script; no los edites a mano:

```bash
pnpm --filter @oasis/contracts reporte
```

Esperado: líneas ≥ 90 % (hoy 100 %) y tabla de gas por función con `registrar` < 100 000 (RNF-07).

### T3. Slither en verde (1,5 h)

Reemplaza `packages/contracts/slither.config.json`. Las rutas son relativas a la **raíz** del
repositorio; esta configuración se verificó con Slither 0.11.6 (0 resultados y sin avisos):

```json
{
  "compile_force_framework": "solc",
  "filter_paths": "node_modules",
  "solc_remaps": ["@openzeppelin/=packages/contracts/node_modules/@openzeppelin/"],
  "solc_args": "--allow-paths .",
  "exclude_informational": true,
  "fail_on": "medium"
}
```

`fail_on` es la clave válida en Slither 0.11.6; `fail_medium` produce "unknown key".

En el job `slither` de `.github/workflows/ci.yml` conserva checkout, `pnpm/action-setup`,
`actions/setup-node` y `pnpm install --frozen-lockfile` (Slither lee OpenZeppelin de
`node_modules`). **Elimina** el paso `pnpm --filter @oasis/contracts build` y el paso
`crytic/slither-action`, y agrega estos pasos con la misma indentación que los demás del job:

```yaml
- name: Instalar Slither y solc
  run: |
    pipx install slither-analyzer==0.11.6
    pipx install solc-select
    solc-select install 0.8.28
    solc-select use 0.8.28
# Se analiza el archivo del contrato y no el proyecto Hardhat: crytic-compile no
# resuelve los tests Foundry que Hardhat 3 compila junto al contrato.
- name: Analizar RegistroRecibos.sol
  run: >-
    slither packages/contracts/contracts/RegistroRecibos.sol
    --config-file packages/contracts/slither.config.json
```

Si hay Python en el equipo, verifica en local desde la raíz con el mismo comando. Esperado:
`0 result(s) found`. La evidencia final es el job en verde en el PR.

### T4. Red de la cuenta operadora y script del hash de prueba (3 h)

1. En `packages/contracts/hardhat.config.ts`, después de la red `amoy`, agrega:

   ```ts
       amoyOperador: {
         type: 'http',
         chainId: 80002,
         url: configVariable('AMOY_RPC_URL'),
         // Cuenta operadora (REGISTRADOR_ROLE, ADR-006): solo para scripts que firman como el worker.
         accounts: [configVariable('OPERATOR_PRIVATE_KEY')],
       },
   ```

   `configVariable` se resuelve solo al conectarse a esa red, así que el CI no necesita la clave.

2. Crea `packages/contracts/scripts/registrar-prueba.ts`:

   ```ts
   import { network } from 'hardhat';
   import { formatEther, getAddress, keccak256, toHex } from 'viem';

   const contractAddress = process.env.CONTRACT_ADDRESS;

   if (!contractAddress) {
     throw new Error('Falta CONTRACT_ADDRESS (dirección del RegistroRecibos desplegado).');
   }

   // Id y hash fijos: el script es idempotente y el id nunca coincide con un recibo real,
   // cuyo idOnchain es keccak256 de un UUID.
   const ID_PRUEBA = keccak256(toHex('SRPP-HT02-recibo-de-prueba'));
   const HASH_PRUEBA = keccak256(toHex('SRPP-HT02-hash-de-prueba'));
   const CHAIN_ID_AMOY = 80002;

   const { viem } = await network.create();
   const publicClient = await viem.getPublicClient();
   const registro = await viem.getContractAt('RegistroRecibos', getAddress(contractAddress));
   const rolRegistrador = await registro.read.REGISTRADOR_ROLE();

   let firmante: Awaited<ReturnType<typeof viem.getWalletClients>>[number] | undefined;
   for (const cuenta of await viem.getWalletClients()) {
     if (await registro.read.hasRole([rolRegistrador, cuenta.account.address])) {
       firmante = cuenta;
       break;
     }
   }

   if (!firmante) {
     throw new Error(
       'Ninguna cuenta de la red tiene REGISTRADOR_ROLE. En Amoy use --network amoyOperador ' +
         'después de otorgar el rol con scripts/grant-registrador.ts.',
     );
   }

   const chainId = await publicClient.getChainId();
   const [yaRegistrado] = await registro.read.verificar([ID_PRUEBA]);

   if (yaRegistrado) {
     console.log('El recibo de prueba ya estaba registrado. Nada por hacer.');
   } else {
     const txHash = await registro.write.registrar([ID_PRUEBA, HASH_PRUEBA], {
       account: firmante.account,
     });
     const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
     console.log(`Transacción: ${txHash}`);
     console.log(`Bloque: ${receipt.blockNumber}`);
     console.log(`Gas usado: ${receipt.gasUsed}`);
     console.log(`Costo: ${formatEther(receipt.gasUsed * receipt.effectiveGasPrice)} POL`);
     if (chainId === CHAIN_ID_AMOY) {
       console.log(`Explorador: https://amoy.polygonscan.com/tx/${txHash}`);
     }
   }

   const [existe, hashRecibo, registradoEn, anulado] = await registro.read.verificar([ID_PRUEBA]);
   console.log(`Contrato: ${registro.address} (chainId ${chainId})`);
   console.log(`Firmante: ${firmante.account.address}`);
   console.log(`idRecibo: ${ID_PRUEBA}`);
   console.log(
     `verificar(): existe=${existe} hash=${hashRecibo} ` +
       `registradoEn=${new Date(Number(registradoEn) * 1000).toISOString()} anulado=${anulado}`,
   );
   ```

3. En `packages/contracts/package.json`, agrega el script
   `"registrar-prueba": "hardhat run scripts/registrar-prueba.ts"`.

4. En el job `api` de `ci.yml`, agrega este paso justo después de "Nodo Hardhat y anclaje de
   prueba", con la misma indentación que los demás. En el nodo local, la primera cuenta con el
   rol es la #1 que configura `dev:chain`:

   ```yaml
   - name: Script del hash de prueba contra el nodo local
     run: |
       CONTRACT_ADDRESS=$(grep '^CONTRACT_ADDRESS=' apps/api/.env | cut -d= -f2) \
         pnpm --filter @oasis/contracts exec hardhat run scripts/registrar-prueba.ts --network localhost
   ```

Verificación local, con el nodo Hardhat arriba y después de `pnpm dev:chain`: ejecuta el comando
del paso 4 **dos veces**. La primera imprime transacción, bloque y gas; la segunda imprime "ya
estaba registrado".

### T5. Documentación del despliegue (1 h)

1. En `.env.example`, cambia el comentario
   `# RPC principal (Amoy: https://rpc-amoy.polygon.technology)` por
   `# RPC principal (Amoy: https://polygon-amoy-bor-rpc.publicnode.com o una URL propia)`.
2. En `docs/despliegue.md`:
   - En el bloque de variables del VPS, cambia `RPC_URL=https://rpc-amoy.polygon.technology` por
     `RPC_URL=https://polygon-amoy-bor-rpc.publicnode.com`.
   - Reescribe la sección "4. Despliegue del contrato en Amoy" en este orden, sin valores secretos
     y siempre con `pnpm --filter @oasis/contracts …` desde la raíz:
     1. `hardhat keystore set` de `DEPLOYER_PRIVATE_KEY`, `OPERATOR_PRIVATE_KEY`, `AMOY_RPC_URL` y
        `ETHERSCAN_API_KEY` (API key V2 de etherscan.io, gratuita);
     2. fondos: ≈ 0,06 POL en la cuenta admin y 0,01 POL en la operadora;
     3. `deploy:amoy`;
     4. `hardhat ignition verify chain-80002`;
     5. `hardhat run scripts/grant-registrador.ts --network amoy`;
     6. `hardhat run scripts/registrar-prueba.ts --network amoyOperador`.
   - Reemplaza la tabla de la sección 4 por estas filas, que se completan en la Fase 4: dirección
     del contrato; transacción y bloque del despliegue; gas del despliegue; cuenta admin
     (`DEFAULT_ADMIN_ROLE`); cuenta operadora (`REGISTRADOR_ROLE`); transacción de `grantRole`;
     hash de prueba (id, transacción, bloque y gas); código verificado
     (`https://amoy.polygonscan.com/address/<dirección>#code`).
   - Aclara que `CONTRACT_ADDRESS` de Amoy y `OPERATOR_PRIVATE_KEY` pasan al VPS en HT-06 (S13).

### T6. ADR-008 (1 h)

Crea `docs/adr/ADR-008-contrato-inmutable.md` con este contenido:

```markdown
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
```

En `docs/adr/README.md`, cambia la fila de ADR-008 para que apunte a
`ADR-008-contrato-inmutable.md` (la fila de ADR-013 se agrega en T15).

### Verificación de la Fase 1

```bash
pnpm --filter @oasis/contracts lint
pnpm --filter @oasis/contracts typecheck
pnpm --filter @oasis/contracts test                       # 30 pruebas en verde
pnpm --filter @oasis/contracts reporte                    # ≥ 90 % y reportes regenerados
pnpm --filter @oasis/contracts export-abi
git diff --exit-code packages/shared/src/abi              # sin cambios: el contrato no cambió
```

## 6. Fase 2 — 👤 Punto de control en Amoy (en paralelo con la Fase 3)

El keystore ya tiene las cuatro claves: `AMOY_RPC_URL` (URL propia del usuario),
`DEPLOYER_PRIVATE_KEY`, `ETHERSCAN_API_KEY` y `OPERATOR_PRIVATE_KEY` (verificado el 01/10/2026).
Antes de enviar el mensaje, confírmalo con
`pnpm --filter @oasis/contracts exec hardhat keystore list`, que muestra solo los nombres y no pide
contraseña.

Cuando la Fase 1 esté en verde, envía al usuario el mensaje siguiente **tal cual** y continúa con la
Fase 3 mientras responde. No ejecutes estos comandos tú: piden la contraseña del keystore.

> **Despliegue en Amoy (HT-02).** Ejecuta en tu terminal, desde la raíz del repositorio, y pégame
> solo las salidas públicas: direcciones, hashes, bloques y enlaces. Nada secreto.
>
> - **H1.** Pásame las direcciones públicas (`0x…`) de la cuenta admin (`DEPLOYER_PRIVATE_KEY`) y de
>   la cuenta operadora (`OPERATOR_PRIVATE_KEY`). Deben ser cuentas distintas (ADR-006).
> - **H2.** Fondos: la cuenta admin necesita ≥ 0,06 POL y la operadora 0,01 POL.
> - **H3.** Despliega (confirma con `y`): `pnpm --filter @oasis/contracts deploy:amoy`. Pégame la
>   salida: incluye la dirección del contrato.
> - **H4.** Verifica en PolygonScan:
>   `pnpm --filter @oasis/contracts exec hardhat ignition verify chain-80002`. Si pide la red,
>   agrega `--network amoy`. Pégame la salida.
> - **H5.** Otorga el rol a la cuenta operadora:
>   `CONTRACT_ADDRESS=<dirección> OPERATOR_ADDRESS=<operadora> pnpm --filter @oasis/contracts exec hardhat run scripts/grant-registrador.ts --network amoy`.
>   Pégame la salida.
> - **H6.** Registra el hash de prueba:
>   `CONTRACT_ADDRESS=<dirección> pnpm --filter @oasis/contracts exec hardhat run scripts/registrar-prueba.ts --network amoyOperador`.
>   Pégame la salida completa.

Si un paso falla, pide la salida del error y corrige solo los scripts o la configuración de la
Fase 1, nunca el contrato (D2).

## 7. Fase 3 — HU-45: bitácora de auditoría (6 h)

Estructura nueva del módulo (`apps/api/src/modules/auditoria/`; borra su `.gitkeep`):

```text
auditoria/
├── domain/
│   ├── registro-auditoria.ts          (+ .spec.ts)
│   └── periodo-ecuador.ts             (+ .spec.ts)
├── application/
│   ├── ports/bitacora.repository.port.ts
│   └── use-cases/auditoria.use-cases.ts   (+ .spec.ts)
├── infrastructure/persistence/prisma-bitacora.repository.ts
├── presentation/http/
│   ├── auditoria.interceptor.ts       (+ .spec.ts)
│   ├── auditoria-cobertura.spec.ts
│   └── bitacora.controller.ts
└── auditoria.module.ts
apps/api/src/common/auditoria/auditar.decorator.ts
```

### T7. Catálogo y esquemas compartidos (0,5 h)

Crea `packages/shared/src/constants/auditoria.ts`:

```ts
export const ACCIONES_AUDITORIA = [
  'CREAR',
  'MODIFICAR',
  'ELIMINAR',
  'VALIDAR',
  'RECHAZAR',
  'ANULAR',
  'REINTENTAR',
  'INICIAR_SESION',
  'IMPORTAR',
] as const;
export type AccionAuditoria = (typeof ACCIONES_AUDITORIA)[number];

/** Nombres de los modelos de Prisma que afectan las acciones auditadas. */
export const ENTIDADES_AUDITADAS = [
  'Usuario',
  'Cliente',
  'Aseguradora',
  'Poliza',
  'Pago',
  'Recibo',
] as const;
export type EntidadAuditada = (typeof ENTIDADES_AUDITADAS)[number];
```

Crea `packages/shared/src/schemas/auditoria.schema.ts`:

```ts
import { z } from 'zod';
import { ACCIONES_AUDITORIA } from '../constants/auditoria';
import { idUuidSchema, paginacionQuerySchema } from './common.schema';

export const accionAuditoriaSchema = z.enum(ACCIONES_AUDITORIA);

/** `desde` y `hasta` son fechas de calendario en hora de Ecuador (UTC−5), ambas inclusivas. */
export const listarBitacoraQuerySchema = paginacionQuerySchema
  .extend({
    usuarioId: idUuidSchema.optional(),
    accion: accionAuditoriaSchema.optional(),
    desde: z.iso.date().optional(),
    hasta: z.iso.date().optional(),
  })
  .refine((query) => !query.desde || !query.hasta || query.desde <= query.hasta, {
    message: 'La fecha "desde" no puede ser posterior a "hasta"',
    path: ['hasta'],
  });
export type ListarBitacoraQuery = z.infer<typeof listarBitacoraQuerySchema>;

export const registroBitacoraSchema = z.object({
  id: idUuidSchema,
  usuarioId: idUuidSchema,
  usuarioEmail: z.string(),
  accion: z.string(),
  entidad: z.string(),
  entidadId: z.string().nullable(),
  ip: z.string().nullable(),
  detalle: z.record(z.string(), z.unknown()).nullable(),
  creadoEn: z.iso.datetime(),
});
export type RegistroBitacora = z.infer<typeof registroBitacoraSchema>;
```

`accion` y `entidad` se responden como texto porque la columna es `TEXT`: una acción nueva no rompe
a un cliente anterior.

En `packages/shared/src/index.ts`, exporta ambos archivos
(`export * from './constants/auditoria';` y `export * from './schemas/auditoria.schema';`). Luego
ejecuta `pnpm --filter @oasis/shared build` (el API y la SPA consumen `dist/`).

### T8. Dominio, puerto y casos de uso (1 h; primero las pruebas)

`domain/registro-auditoria.ts`. Usa `type` y no `interface` en `DetalleAuditoria`, para que sea
asignable al JSON de Prisma:

```ts
import type { AccionAuditoria, EntidadAuditada } from '@oasis/shared';

/** Metadatos técnicos de la petición; nunca valores de datos personales (ADR-013). */
export type DetalleAuditoria = {
  metodo: string;
  ruta: string;
  requestId: string | null;
  campos?: string[];
};

export interface NuevoRegistroAuditoria {
  usuarioId: string;
  accion: AccionAuditoria;
  entidad: EntidadAuditada;
  entidadId: string | null;
  ip: string | null;
  detalle: DetalleAuditoria;
}

export interface RegistroAuditoria {
  id: string;
  usuarioId: string;
  usuarioEmail: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  ip: string | null;
  detalle: Record<string, unknown> | null;
  creadoEn: string;
}

/** En MODIFICAR guarda solo los nombres de los campos enviados, nunca sus valores. */
export function construirDetalle(
  accion: AccionAuditoria,
  peticion: { metodo: string; ruta: string; requestId: string | null; cuerpo: unknown },
): DetalleAuditoria {
  const detalle: DetalleAuditoria = {
    metodo: peticion.metodo,
    ruta: peticion.ruta,
    requestId: peticion.requestId,
  };
  if (accion === 'MODIFICAR' && typeof peticion.cuerpo === 'object' && peticion.cuerpo !== null) {
    detalle.campos = Object.keys(peticion.cuerpo).sort();
  }
  return detalle;
}
```

`domain/periodo-ecuador.ts`:

```ts
/** Quito usa UTC−5 todo el año (no hay horario de verano). */
const DESFASE_ECUADOR = '-05:00';
const UN_DIA_MS = 86_400_000;

export interface Periodo {
  desde?: Date;
  hastaExclusivo?: Date;
}

/** Convierte fechas de calendario de Ecuador (`YYYY-MM-DD`, inclusivas) en instantes UTC. */
export function periodoEnEcuador(desde?: string, hasta?: string): Periodo {
  const inicioDelDia = (fecha: string) => new Date(`${fecha}T00:00:00.000${DESFASE_ECUADOR}`);
  return {
    desde: desde ? inicioDelDia(desde) : undefined,
    hastaExclusivo: hasta ? new Date(inicioDelDia(hasta).getTime() + UN_DIA_MS) : undefined,
  };
}
```

`application/ports/bitacora.repository.port.ts`:

```ts
import type { AccionAuditoria } from '@oasis/shared';

import type { NuevoRegistroAuditoria, RegistroAuditoria } from '../../domain/registro-auditoria';

export const BITACORA_REPOSITORY = Symbol('BitacoraRepositoryPort');

export interface FiltrosBitacora {
  usuarioId?: string;
  accion?: AccionAuditoria;
  desde?: Date;
  hastaExclusivo?: Date;
  pagina: number;
  porPagina: number;
}

export interface PaginaBitacora {
  items: RegistroAuditoria[];
  total: number;
}

/** Solo inserción y consulta: la bitácora no se modifica ni se elimina (RN-17). */
export interface BitacoraRepositoryPort {
  registrar(registro: NuevoRegistroAuditoria): Promise<void>;
  listar(filtros: FiltrosBitacora): Promise<PaginaBitacora>;
}
```

`application/use-cases/auditoria.use-cases.ts`:

- `RegistrarAccionUseCase` recibe un `BitacoraRepositoryPort` y en `ejecutar(registro)` devuelve
  `this.bitacora.registrar(registro)`.
- `ListarBitacoraUseCase` recibe un `BitacoraRepositoryPort` y en
  `ejecutar({ pagina, porPagina, usuarioId?, accion?, desde?, hasta? })` convierte `desde` y `hasta`
  con `periodoEnEcuador` antes de llamar a `this.bitacora.listar({ usuarioId, accion, desde,
hastaExclusivo, pagina, porPagina })`.

Pruebas (Jest, nombres en español):

| Archivo                       | Casos                                                                                                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `registro-auditoria.spec.ts`  | en MODIFICAR guarda los nombres de los campos ordenados · no guarda los valores del cuerpo · en otras acciones no agrega `campos` · un cuerpo vacío o no objeto no agrega `campos` |
| `periodo-ecuador.spec.ts`     | `desde` `'2026-10-01'` → `2026-10-01T05:00:00.000Z` · `hasta` `'2026-10-01'` → `2026-10-02T05:00:00.000Z` (exclusivo) · sin fechas no acota el periodo                             |
| `auditoria.use-cases.spec.ts` | RegistrarAccion delega en el repositorio · ListarBitacora pasa filtros, paginación y el periodo convertido · ListarBitacora sin fechas no envía límites                            |

### T9. Repositorio Prisma (0,5 h)

`infrastructure/persistence/prisma-bitacora.repository.ts`:

- `@Injectable()`, con `PrismaService` inyectado (el mismo patrón que
  `prisma-usuarios.repository.ts`).
- `registrar(registro)` llama a `prisma.bitacoraAuditoria.create({ data: { usuarioId, accion,
entidad, entidadId, ip, detalle: { ...registro.detalle } } })`.
- `listar(filtros)`:
  - `where = { usuarioId, accion, creadoEn }`, donde `creadoEn` es `{ gte: desde, lt:
hastaExclusivo }` solo si hay alguna de las dos fechas.
  - Ejecuta `$transaction([findMany(...), count({ where })])`. `findMany` usa
    `include: { usuario: { select: { email: true } } }`,
    `orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }]`, `skip: (pagina - 1) * porPagina` y
    `take: porPagina`.
  - Mapea cada fila a `RegistroAuditoria` con `usuarioEmail = fila.usuario.email` y
    `creadoEn = fila.creadoEn.toISOString()`. Para `detalle` usa un type guard
    (`typeof v === 'object' && v !== null && !Array.isArray(v)`), sin `any`.
- No agregues métodos de actualización ni de borrado (D12).

### T10. Migración: bitácora de solo inserción (0,5 h)

Con PostgreSQL arriba (`pnpm dev:infra`):

```bash
pnpm --filter @oasis/api exec prisma migrate dev --create-only --name bitacora_solo_insercion
```

Si Prisma no crea la carpeta porque el esquema no cambia, créala a mano como
`apps/api/prisma/migrations/<AAAAMMDDHHMMSS UTC>_bitacora_solo_insercion/`. El contenido exacto de
`migration.sql` es:

```sql
-- RN-17: la bitácora de auditoría es de solo inserción.
CREATE FUNCTION bitacora_solo_insercion() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'La bitácora de auditoría es de solo inserción (RN-17)';
END;
$$;

CREATE TRIGGER bitacora_sin_update_delete
  BEFORE UPDATE OR DELETE ON "BitacoraAuditoria"
  FOR EACH ROW EXECUTE FUNCTION bitacora_solo_insercion();

CREATE TRIGGER bitacora_sin_truncate
  BEFORE TRUNCATE ON "BitacoraAuditoria"
  FOR EACH STATEMENT EXECUTE FUNCTION bitacora_solo_insercion();
```

Aplica con `pnpm --filter @oasis/api exec prisma migrate deploy`; `schema.prisma` no cambia. En el
mismo sprint, agrega al comentario del modelo `BitacoraAuditoria` en `schema.prisma`: "Un trigger
de PostgreSQL rechaza UPDATE, DELETE y TRUNCATE (migración `bitacora_solo_insercion`)".

### T11. Decorador, interceptor, controlador y módulo (1 h)

`apps/api/src/common/auditoria/auditar.decorator.ts`:

```ts
import { SetMetadata } from '@nestjs/common';
import type { AccionAuditoria, EntidadAuditada } from '@oasis/shared';

export const AUDITAR_KEY = 'auditoria';

export interface MetadatoAuditoria {
  accion: AccionAuditoria;
  entidad: EntidadAuditada;
}

/** Registra la acción en la bitácora (HU-45) cuando el handler responde con éxito. */
export const Auditar = (accion: AccionAuditoria, entidad: EntidadAuditada) =>
  SetMetadata<string, MetadatoAuditoria>(AUDITAR_KEY, { accion, entidad });
```

`presentation/http/auditoria.interceptor.ts`. Inyecta `PinoLogger` igual que `AnclajeProcessor`:

```ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';
import { Observable, concatMap } from 'rxjs';

import {
  AUDITAR_KEY,
  type MetadatoAuditoria,
} from '../../../../common/auditoria/auditar.decorator';
import type { UsuarioAutenticado } from '../../../../common/auth/decorators';
import { RegistrarAccionUseCase } from '../../application/use-cases/auditoria.use-cases';
import { construirDetalle } from '../../domain/registro-auditoria';

/** Lo mínimo que el interceptor necesita de la petición de Express. */
interface PeticionAuditable {
  method: string;
  path: string;
  ip?: string;
  id?: unknown;
  params?: Record<string, string | undefined>;
  body?: unknown;
  route?: { path?: string };
  user?: UsuarioAutenticado;
}

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly registrarAccion: RegistrarAccionUseCase,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuditoriaInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadato = this.reflector.get<MetadatoAuditoria | undefined>(
      AUDITAR_KEY,
      context.getHandler(),
    );
    if (!metadato || context.getType() !== 'http') {
      return next.handle();
    }

    const peticion = context.switchToHttp().getRequest<PeticionAuditable>();
    // Se espera la inserción para que el registro exista al responder; si falla, no rompe la respuesta.
    return next.handle().pipe(
      concatMap(async (respuesta: unknown) => {
        await this.registrar(metadato, peticion, respuesta);
        return respuesta;
      }),
    );
  }

  private async registrar(
    metadato: MetadatoAuditoria,
    peticion: PeticionAuditable,
    respuesta: unknown,
  ): Promise<void> {
    const requestId = typeof peticion.id === 'string' ? peticion.id : null;
    const usuarioId = peticion.user?.id ?? leerId(respuesta, 'usuario');
    if (!usuarioId) {
      this.logger.warn({ requestId, ...metadato }, 'Acción auditada sin usuario identificable');
      return;
    }

    try {
      await this.registrarAccion.ejecutar({
        usuarioId,
        accion: metadato.accion,
        entidad: metadato.entidad,
        entidadId: peticion.params?.id ?? leerId(respuesta) ?? leerId(respuesta, 'usuario') ?? null,
        ip: peticion.ip ?? null,
        detalle: construirDetalle(metadato.accion, {
          metodo: peticion.method,
          ruta: peticion.route?.path ?? peticion.path,
          requestId,
          cuerpo: peticion.body,
        }),
      });
    } catch (error) {
      this.logger.error(
        { err: error, requestId, ...metadato },
        'No se pudo registrar la acción en la bitácora',
      );
    }
  }
}

/** Devuelve `respuesta.id`, o `respuesta[clave].id` si se indica `clave`, cuando es texto. */
function leerId(respuesta: unknown, clave?: string): string | undefined {
  const objetivo =
    clave && typeof respuesta === 'object' && respuesta !== null
      ? (respuesta as Record<string, unknown>)[clave]
      : respuesta;
  if (typeof objetivo !== 'object' || objetivo === null) {
    return undefined;
  }
  const id = (objetivo as Record<string, unknown>)['id'];
  return typeof id === 'string' ? id : undefined;
}
```

Reglas que debe cumplir el interceptor (y que prueban sus specs):

- Usuario: `req.user.id`; en el inicio de sesión, que es `@Public()`, usa `respuesta.usuario.id`.
- `entidadId`, en este orden: `req.params.id`, luego `respuesta.id` (creaciones) y luego
  `respuesta.usuario.id` (inicio de sesión).
- Solo registra si el handler termina con éxito; los errores se propagan sin registro.
- Si falla la inserción, la respuesta se entrega igual y el error queda en el log con su
  `requestId`.

`presentation/http/bitacora.controller.ts` (imports con el mismo patrón que
`usuarios.controller.ts`, más `listarBitacoraQuerySchema`, `ListarBitacoraQuery`,
`RegistroBitacora` y `RespuestaPaginada` de `@oasis/shared`):

```ts
@ApiTags('auditoria')
@Controller('bitacora')
@Roles('ADMIN')
export class BitacoraController {
  constructor(private readonly listarBitacora: ListarBitacoraUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Consulta la bitácora de auditoría con filtros (ADMIN)' })
  async listar(
    @ZodQuery(listarBitacoraQuerySchema) query: ListarBitacoraQuery,
  ): Promise<RespuestaPaginada<RegistroBitacora>> {
    const pagina = await this.listarBitacora.ejecutar({
      pagina: query.page,
      porPagina: query.pageSize,
      usuarioId: query.usuarioId,
      accion: query.accion,
      desde: query.desde,
      hasta: query.hasta,
    });
    return {
      data: pagina.items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: pagina.total,
        totalPages: Math.ceil(pagina.total / query.pageSize),
      },
    };
  }
}
```

`auditoria.module.ts`, con el mismo estilo que `usuarios.module.ts`:

- `controllers: [BitacoraController]`.
- Providers:
  - `{ provide: BITACORA_REPOSITORY, useClass: PrismaBitacoraRepository }`.
  - `RegistrarAccionUseCase` y `ListarBitacoraUseCase` con `useFactory` e
    `inject: [BITACORA_REPOSITORY]`.
  - `{ provide: APP_INTERCEPTOR, useClass: AuditoriaInterceptor }`, con el comentario
    `// Global aunque se declare aquí: aplica a todos los controladores del API, no al worker.`

En `app.module.ts`, agrega `AuditoriaModule` a `imports`, después de `RecibosModule`. **No** lo
importes en `WorkerModule`.

### T12. Instrumentación de las mutaciones (0,5 h)

Agrega el decorador (`import { Auditar } from '<ruta relativa>/common/auditoria/auditar.decorator'`)
exactamente en estos 15 handlers:

| Archivo (`presentation/http/`)              | Handler         | Decorador                               |
| ------------------------------------------- | --------------- | --------------------------------------- |
| `auth/…/auth.controller.ts`                 | `iniciarSesion` | `@Auditar('INICIAR_SESION', 'Usuario')` |
| `clientes/…/clientes.controller.ts`         | `crear`         | `@Auditar('CREAR', 'Cliente')`          |
| `clientes/…/clientes.controller.ts`         | `actualizar`    | `@Auditar('MODIFICAR', 'Cliente')`      |
| `clientes/…/clientes.controller.ts`         | `eliminar`      | `@Auditar('ELIMINAR', 'Cliente')`       |
| `aseguradoras/…/aseguradoras.controller.ts` | `crear`         | `@Auditar('CREAR', 'Aseguradora')`      |
| `aseguradoras/…/aseguradoras.controller.ts` | `actualizar`    | `@Auditar('MODIFICAR', 'Aseguradora')`  |
| `aseguradoras/…/aseguradoras.controller.ts` | `eliminar`      | `@Auditar('ELIMINAR', 'Aseguradora')`   |
| `polizas/…/polizas.controller.ts`           | `crear`         | `@Auditar('CREAR', 'Poliza')`           |
| `polizas/…/polizas.controller.ts`           | `actualizar`    | `@Auditar('MODIFICAR', 'Poliza')`       |
| `polizas/…/polizas.controller.ts`           | `eliminar`      | `@Auditar('ELIMINAR', 'Poliza')`        |
| `pagos/…/pagos.controller.ts`               | `crear`         | `@Auditar('CREAR', 'Pago')`             |
| `pagos/…/pagos.controller.ts`               | `validar`       | `@Auditar('VALIDAR', 'Pago')`           |
| `pagos/…/pagos.controller.ts`               | `rechazar`      | `@Auditar('RECHAZAR', 'Pago')`          |
| `recibos/…/recibos.controller.ts`           | `reintentar`    | `@Auditar('REINTENTAR', 'Recibo')`      |
| `recibos/…/recibos.controller.ts`           | `anular`        | `@Auditar('ANULAR', 'Recibo')`          |

Quedan exentos `AuthController.refrescarSesion` y `AuthController.cerrarSesion`: no cambian datos
de negocio ni son acciones del catálogo.

Prueba de cobertura, `presentation/http/auditoria-cobertura.spec.ts`:

1. Importa todos los controladores: `AuthController`, `ClientesController`,
   `AseguradorasController`, `PolizasController`, `MisPolizasController`, `PagosController`,
   `MisPagosController`, `RecibosController`, `VerificacionPublicaController`, `UsuariosController`
   y `BitacoraController`.
2. Recorre los métodos de cada prototipo y lee `Reflect.getMetadata(METHOD_METADATA, handler)`
   (`METHOD_METADATA` de `@nestjs/common/constants`). Conserva los `POST`, `PUT`, `PATCH` y
   `DELETE` (`RequestMethod`), salvo los exentos. Ojo: `RequestMethod.GET` vale `0`, así que compara
   con `!== undefined`.
3. Arma `{ 'Controlador.metodo': Reflect.getMetadata(AUDITAR_KEY, handler) }` y compáralo con
   `toEqual` contra un objeto `ESPERADAS` que contiene exactamente las 15 filas de la tabla.

Una mutación nueva sin `@Auditar` aparece con `undefined` y hace fallar la prueba.

### T13. Pruebas del interceptor y e2e (1,25 h)

`presentation/http/auditoria.interceptor.spec.ts`:

- Usa un `Reflector` real, un handler con `Reflect.defineMetadata(AUDITAR_KEY, …)`, un
  `ExecutionContext` falso (`getType`, `getHandler`, `switchToHttp().getRequest`), un `CallHandler`
  con `of(respuesta)` o `throwError(...)`, `lastValueFrom` y dobles de `RegistrarAccionUseCase` y
  `PinoLogger` (`setContext`, `warn`, `error`).
- Casos:
  1. registra con el usuario autenticado, la IP y el id de la ruta;
  2. en el inicio de sesión toma el usuario de la respuesta;
  3. en una creación toma el id de la respuesta;
  4. en una modificación guarda los nombres de los campos y no sus valores;
  5. no registra nada si el handler falla;
  6. entrega la respuesta aunque falle la inserción y lo deja en el log;
  7. ignora los handlers sin `@Auditar`.

Nuevo `apps/api/test/bitacora.e2e-spec.ts`, con el mismo arranque que
`flujo-anclaje.e2e-spec.ts` (`AppModule`, `cookieParser()` y
`setGlobalPrefix('api/v1', { exclude: ['metrics'] })`, sin worker):

- `beforeAll`: inicia sesión con `admin@oasis.com` / `Admin.Oasis1` y con `operador@oasis.com` /
  `Operador.Oasis1`. Guarda los tokens y `operadorId = body.usuario.id`.
- Auxiliares:
  - `hoyEnEcuador()` es
    `new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date())`.
  - `ultimo(where)` es `prisma.bitacoraAuditoria.findFirstOrThrow({ where, orderBy: { creadoEn:
'desc' } })`.
- Casos:
  1. **registra el inicio de sesión con usuario, IP y ruta:** la última fila `INICIAR_SESION` del
     operador tiene `entidad: 'Usuario'`, `entidadId: operadorId`, `ip` no vacío y `detalle` que
     incluye `{ metodo: 'POST', ruta: '/api/v1/auth/login' }`.
  2. **registra la creación, la modificación y la eliminación de un cliente sin guardar sus datos:**
     - `POST /clientes` con `{ tipoIdentificacion: 'PASAPORTE', identificacion: 'E2E' + sufijo,
nombres: 'Prueba', apellidos: 'Bitácora', email: 'bitacora.<sufijo>@example.com' }` → 201;
       luego `PATCH /clientes/:id` con `{ telefono: '0991234567' }` → 200; luego
       `DELETE /clientes/:id` → 204.
     - Filas `CREAR`, `MODIFICAR` (`detalle.campos = ['telefono']`) y `ELIMINAR` con
       `entidadId = id`.
     - `JSON.stringify` de los tres `detalle` no contiene el correo ni el teléfono.
  3. **registra el rechazo de un pago y no registra un rechazo fallido:**
     - Toma una póliza con `prisma.poliza.findFirstOrThrow({ where: { estado: 'VIGENTE' } })`.
     - `POST /pagos` con `{ monto: '10.00', fechaPago: hoyEnEcuador(), metodo: 'TRANSFERENCIA',
referencia: 'E2E-BIT-<sufijo>' }` → 201.
     - `PATCH /pagos/:id/rechazar` con `{ confirmado: true, motivo: 'Comprobante ilegible' }` → 200.
       Repetirlo → 422.
     - Hay exactamente **1** fila `RECHAZAR` con ese `entidadId`, su `detalle` no contiene
       "ilegible", y hay una fila `CREAR` con `entidad: 'Pago'`.
  4. **el ADMIN filtra por usuario, acción y fecha de Ecuador:** `GET /bitacora` con
     `usuarioId = operadorId`, `accion = 'CREAR'` y `desde = hasta = hoyEnEcuador()` → 200,
     `meta.total ≥ 1`. Cada item coincide con `{ usuarioId, usuarioEmail: 'operador@oasis.com',
accion: 'CREAR' }` y `creadoEn` viene en orden descendente.
  5. **rechaza un rango de fechas invertido:** `desde=2026-10-02&hasta=2026-10-01` → 400 con
     `code: 'VALIDACION'`.
  6. **un OPERADOR no puede consultar la bitácora:** → 403.
  7. **la base de datos impide modificar, borrar o vaciar la bitácora (RN-17):**
     - `prisma.bitacoraAuditoria.update(...)`, `prisma.bitacoraAuditoria.delete(...)` y
       ``prisma.$executeRaw`TRUNCATE "BitacoraAuditoria"` `` terminan en `rejects.toThrow()`.
     - Después, la fila sigue existiendo con su `accion` original. Si el mensaje del adaptador
       incluye el texto del trigger, compruébalo además con `/solo inserción/`.

En `apps/api/test/flujo-anclaje.e2e-spec.ts`, después de validar el pago, agrega una aserción: existe
una fila `VALIDAR` con `entidad: 'Pago'` y `entidadId` igual al id del pago.

### T14. Página "Bitácora" en la SPA (1,25 h)

`apps/web/src/lib/format.ts`, agrega:

```ts
/** Fecha y hora en la zona de Ecuador (UTC−5), sin importar la zona del navegador. */
export function formatearFechaHoraEcuador(iso: string): string {
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'America/Guayaquil',
  }).format(new Date(iso));
}
```

Nueva carpeta `apps/web/src/features/auditoria/`:

- `api.ts`:
  - `FiltrosBitacora = { page; pageSize; usuarioId?; accion?: AccionAuditoria; desde?; hasta? }`.
  - `auditoriaApi.listar(filtros)` es
    `api.get<RespuestaPaginada<RegistroBitacora>>('/bitacora' + construirQuery({ ...filtros }))`.
  - `auditoriaApi.listarUsuarios()` es
    `api.get<RespuestaPaginada<UsuarioFiltro>>('/usuarios?pageSize=100')`, con el tipo local
    `UsuarioFiltro = { id: string; email: string; rol: Rol }`. Comentario:
    `// ponytail: el filtro carga hasta 100 usuarios; si el personal crece, buscar por correo.`
- `hooks.ts`:
  - `useBitacora(filtros)` usa `queryKey: ['bitacora', filtros]` y
    `placeholderData: (anterior) => anterior`, igual que `usePagos`.
  - `useUsuariosParaFiltro()` usa `queryKey: ['usuarios', 'filtro-bitacora']` y
    `staleTime: 5 * 60_000`.
- `pages/BitacoraPage.tsx`:
  - Encabezado `h1` "Bitácora" y una descripción breve.
  - Filtros en `flex flex-wrap gap-3`, cada uno con su `Label`:
    - "Usuario": `Select` con `TODOS` y los correos.
    - "Acción": `Select` con `TODAS` y las etiquetas.
    - "Desde" y "Hasta": `Input type="date"`; "Desde" lleva `max={hasta}` y "Hasta" lleva
      `min={desde}`.
    - Botón "Limpiar filtros".
    - Los centinelas `TODOS` y `TODAS` se traducen a `undefined`, como hace `PagosPage`.
    - Cambiar cualquier filtro vuelve a la página 1.
  - Etiquetas de acción, con el tipo `Record<AccionAuditoria, string>`: CREAR "Creación",
    MODIFICAR "Modificación", ELIMINAR "Eliminación", VALIDAR "Validación", RECHAZAR "Rechazo",
    ANULAR "Anulación", REINTENTAR "Reintento", INICIAR_SESION "Inicio de sesión" e IMPORTAR
    "Importación". Si llega un texto desconocido, se muestra tal cual.
  - Tabla (componentes `Table` de `components/ui/table`, que ya hacen scroll horizontal en 360 px):
    - `caption` con clase `sr-only`: "Registros de la bitácora de auditoría".
    - Columnas: "Fecha y hora (Ecuador)" (`formatearFechaHoraEcuador`), "Usuario" (correo),
      "Acción" (etiqueta), "Entidad" (Poliza se muestra como "Póliza"), "Registro" (primeros 8
      caracteres de `entidadId`, con el id completo en `title`) e "IP".
  - Estados: `EsqueletoTabla` mientras carga, `AvisoError` con `alReintentar` si hay error, y
    `TableEmpty mensaje="No hay registros con estos filtros"` si no hay datos.
  - Paginación igual que `PagosPage` (Anterior y Siguiente, "Página X de Y"), con 20 por página y
    el total en un elemento con `aria-live="polite"`.
- En `apps/web/src/app/router.tsx`, dentro de los hijos de `AppLayout`, agrega
  `{ element: <RutaProtegida roles={['ADMIN']} />, children: [{ path: '/bitacora', element:
<BitacoraPage /> }] }`.
- En `apps/web/src/components/layout/AppLayout.tsx`, agrega a `ENLACES`
  `{ a: '/bitacora', texto: 'Bitácora', icono: ScrollText, roles: ['ADMIN'] }` (`ScrollText` de
  `lucide-react`).

`pages/BitacoraPage.test.tsx` (Vitest):

- Monta la página dentro de `QueryClientProvider` con `retry: false` y mockea el módulo con
  `vi.mock('../api', …)`.
- Casos:
  1. **muestra cada registro con la acción en español y la hora de Ecuador:** `listar` devuelve un
     registro `INICIAR_SESION` con `creadoEn: '2026-10-01T15:30:00.000Z'` y
     `usuarioEmail: 'operador@oasis.com'`. Se ven "Inicio de sesión", el correo y "10:30:00".
  2. **al elegir una fecha desde vuelve a la página 1 y filtra:** se cambia el campo "Desde" a
     `2026-10-01` y la última llamada a `listar` incluye `{ page: 1, desde: '2026-10-01' }`.
  3. **muestra el aviso cuando no hay registros:** con `data: []` aparece "No hay registros con
     estos filtros".

### T15. Documentación de HU-45 (0,5 h)

- Crea `docs/adr/ADR-013-bitacora-auditoria.md` con este contenido:

```markdown
# ADR-013 · Bitácora de auditoría declarativa y de solo inserción

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: 2

## Contexto

HU-45 (RF-50, RNF-27 y RN-17) pide registrar creación, modificación, validación, rechazo,
anulación, inicio de sesión e importación con usuario, fecha, IP, entidad y acción. Los registros
no se modifican ni se eliminan y se conservan al menos un año. La tabla `BitacoraAuditoria` ya
existe (ADR-010) con `usuarioId` obligatorio, y las mutaciones viven en controladores de seis
módulos.

## Decisión

- Catálogo cerrado en `@oasis/shared`: `ACCIONES_AUDITORIA` y `ENTIDADES_AUDITADAS` (nombres de
  los modelos de Prisma).
- Captura declarativa: cada endpoint que modifica datos lleva `@Auditar(accion, entidad)`, y
  `AuditoriaInterceptor` (global, declarado en `AuditoriaModule`) inserta el registro después de
  que el handler termina con éxito y antes de responder. Una prueba falla si una mutación HTTP
  queda sin decorador.
- El usuario sale de `req.user`; en el inicio de sesión, de la respuesta. Solo se registran los
  inicios exitosos.
- `detalle` guarda método, ruta, `requestId` y, en MODIFICAR, los nombres de los campos enviados:
  nunca valores ni datos personales.
- Inmutabilidad en dos capas: el puerto solo ofrece `registrar` y `listar`, y el trigger
  `bitacora_solo_insercion` rechaza UPDATE, DELETE y TRUNCATE.
- Consulta: `GET /api/v1/bitacora` (ADMIN), con filtros por usuario, acción y fechas de Ecuador
  (UTC−5).

## Alternativas descartadas

- **Registro explícito en cada caso de uso, en la misma transacción**: es atómico, pero cambia una
  docena de firmas y obliga a compartir transacciones entre repositorios.
- **Triggers de auditoría sobre las tablas de negocio**: no conocen al usuario ni la IP sin pasar
  contexto a la sesión de PostgreSQL, y no cubren el inicio de sesión.
- **Usuario de base de datos sin permisos de UPDATE y DELETE**: cambia compose, credenciales y
  despliegue; el trigger da la misma garantía con una sola migración.
- **Instantáneas de antes y después**: duplicarían datos personales en un registro que no se puede
  borrar (LOPDP).

## Consecuencias

- Positivas: una línea por endpoint; las historias futuras solo agregan el decorador; RN-17 se
  demuestra contra la base de datos.
- Negativas: el registro no es atómico con la operación. Si la inserción falla después del commit,
  la acción queda solo en el log de pino con su `requestId`. Los intentos fallidos de inicio de
  sesión quedan en el log, no en la bitácora. La conservación de un año se cumple porque nada se
  borra; los respaldos llegan con HT-06 (S13).
```

- En `docs/adr/README.md`, agrega la fila
  `| ADR-013 | Bitácora de auditoría declarativa y de solo inserción | S2 | ADR-013-bitacora-auditoria.md |`.
- En `apps/api/src/modules/README.md`, agrega la sección "Auditoría (HU-45)":
  - Todo endpoint que crea, modifica, elimina, valida, rechaza, anula, reintenta, importa o inicia
    sesión declara `@Auditar(accion, entidad)` (`src/common/auditoria/auditar.decorator.ts`), con
    valores de `ACCIONES_AUDITORIA` y `ENTIDADES_AUDITADAS`.
  - `auditoria-cobertura.spec.ts` falla si una ruta POST, PUT, PATCH o DELETE no lo declara; las
    exenciones están listadas allí.
  - La bitácora es de solo inserción: no agregues métodos de edición ni de borrado a su puerto.
- En `CLAUDE.md`, sección "API: tubería de cada petición", agrega: "Toda mutación declara
  `@Auditar(accion, entidad)` (`common/auditoria/`); `AuditoriaInterceptor`, global y declarado en
  `AuditoriaModule`, inserta en `BitacoraAuditoria` tras la respuesta exitosa. La tabla es de solo
  inserción (trigger `bitacora_solo_insercion`)."
- En `README.md`:
  - Agrega `auditoria` a la lista de módulos de "Arquitectura en una mirada".
  - Actualiza el número de ADR según `docs/adr/`.
  - En la tabla de pruebas, actualiza los conteos reales (contratos: 30 = 18 Solidity + 12 viem;
    API y SPA según la salida real) y agrega una fila de Slither con el comando de T3.

## 8. Fase 4 — Evidencia de Amoy (1,5 h; tras las respuestas de la Fase 2)

1. `git status` debe mostrar `packages/contracts/ignition/deployments/chain-80002/`
   (`deployed_addresses.json`, `journal.jsonl`, `build-info/` y `artifacts/`). Se versiona entero.
2. Datos sin secretos:
   - `pnpm --filter @oasis/contracts exec hardhat ignition status chain-80002` (dirección).
   - `pnpm --filter @oasis/contracts exec hardhat ignition transactions chain-80002` (hash de la
     transacción de despliegue).
   - Bloque y gas de cada transacción (despliegue, `grantRole` y registro de prueba), con el RPC
     público:

   ```bash
   curl -s -X POST https://polygon-amoy-bor-rpc.publicnode.com -H 'Content-Type: application/json' \
     -d '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["<txHash>"],"id":1}'
   ```

   Convierte de hexadecimal a decimal `blockNumber`, `gasUsed` y `effectiveGasPrice`.

3. Comprueba que `https://amoy.polygonscan.com/address/<dirección>#code` muestra el contrato
   verificado. Si no puedes abrirla, pide al usuario que lo confirme.
4. Completa la tabla de `docs/despliegue.md` §4 y la sección "Despliegue en Amoy" del informe.
   Incluye el gas real de `registrar` en Amoy como evidencia de RNF-07 (≤ 100 000).
5. **No** escribas la dirección de Amoy en `apps/api/.env`: el desarrollo local sigue en 31337.

## 9. Fase 5 — Cierre (2 h)

### 9.1 Definición de Terminado

Con la infraestructura de desarrollo arriba (`pnpm dev:infra`, o el nodo Hardhat nativo con
`pnpm --filter @oasis/contracts exec hardhat node --hostname 127.0.0.1`), ejecuta todo y guarda las
salidas:

```bash
pnpm install --frozen-lockfile
pnpm -r build
pnpm -r lint
pnpm format:check
pnpm -r typecheck
pnpm deps:check && pnpm deps:check:negativo
pnpm test                                             # contratos 30, API y SPA en verde
pnpm --filter @oasis/contracts reporte
pnpm --filter @oasis/contracts export-abi && git diff --exit-code packages/shared/src/abi
pnpm dev:chain
pnpm --filter @oasis/api exec prisma migrate deploy   # incluye bitacora_solo_insercion
pnpm --filter @oasis/api seed
pnpm test:e2e                                         # health, flujo, idempotencia y bitácora
CONTRACT_ADDRESS=$(grep '^CONTRACT_ADDRESS=' apps/api/.env | cut -d= -f2) \
  pnpm --filter @oasis/contracts exec hardhat run scripts/registrar-prueba.ts --network localhost
pnpm --filter @oasis/web test:e2e                     # Playwright: el flujo existente sigue en verde
```

Prueba manual de la página: inicia sesión como ADMIN y abre `/bitacora`. Revisa los filtros, la
paginación, el ancho de 360 px y la navegación con teclado. Inicia sesión como OPERADOR y comprueba
que el menú no muestra "Bitácora" y que `/bitacora` redirige al inicio.

### 9.2 Informe del sprint

Crea `docs/sprints/sprint-02.md` con la misma estructura que `sprint-01.md`:

1. Encabezado: historias, épicas (EP-05 y EP-09), rama, fechas reales y estado.
2. Objetivo.
3. Entregables (tabla con su ubicación).
4. Criterios de HT-02 con su evidencia (sección 11 de este plan).
5. Criterios de HU-45 con su evidencia. Aclara que `IMPORTAR` queda declarada y que la prueba de
   cobertura obligará a instrumentar la importación en S13.
6. Definición de Terminado (tabla de estado, como en S1).
7. **Despliegue en Amoy:** tabla con dirección, transacciones, bloques, gas real, costo en POL,
   cuentas y enlaces.
8. Versiones exactas: Hardhat 3.18.0, hardhat-ignition 3.1.8, hardhat-verify 3.1.1, OpenZeppelin
   5.6.1, solc 0.8.28 y Slither 0.11.6, además de las del S1 que no cambiaron.
9. Decisiones y discrepancias:
   - ADR-008 y ADR-013.
   - La matriz 8-1 del ERS v1.2 asigna otros sprints (por ejemplo, HT-02 en S1 y HT-03 en S0);
     manda el backlog.
   - `rpc-amoy.polygon.technology` ya no resuelve.
   - En Slither 0.11.6 la clave válida es `fail_on`, no `fail_medium`.
   - El objetivo de Slither cambió al archivo del contrato.
10. Impedimentos y observaciones: el faucet de Alchemy exige saldo en mainnet; QuickNode y
    ETHGlobal no lo exigen.
11. Deuda y fuera de alcance:
    - instrumentar la importación (S13);
    - registrar el motivo de la anulación (S11);
    - verificar con la dirección guardada en cada recibo si algún día hay un segundo contrato
      (ADR-008);
    - presupuesto de POL para las pruebas de carga de S16, porque cada recibo anclado cuesta
      ≈ 0,003 POL;
    - ADR-007 (S7).
12. Cómo verificar: los comandos de 9.1.

## 10. Commit y entrega

Revisa con `git status` que no entren `.env`, `.claude/`, `*.docx`, `ignition/deployments/chain-31337`
ni artefactos. Haz un solo commit:

```bash
git add -A
git commit -F - <<'EOF'
feat(repo): completar el sprint 2 con el contrato en Amoy y la bitácora de auditoría

- HT-02: pruebas de roles con errores exactos, reporte corregido, Slither en verde sobre el
  contrato, red amoyOperador, script registrar-prueba y despliegue verificado en Amoy.
- HU-45: módulo auditoria con @Auditar e interceptor global, bitácora de solo inserción con
  trigger, GET /api/v1/bitacora y página Bitácora para ADMIN.
- Docs: ADR-008, ADR-013, despliegue en Amoy, plan e informe del sprint 2.

Refs: HT-02, HU-45
EOF
```

No hagas push. Termina con un mensaje al usuario que incluya:

- el resumen de la verificación de 9.1;
- la dirección del contrato y los enlaces de PolygonScan;
- el título del PR (el encabezado del commit);
- este cuerpo de PR, listo para pegar:

```markdown
## Resumen

Sprint 2: contrato RegistroRecibos desplegado y verificado en Amoy (HT-02) y bitácora de
auditoría (HU-45). Informe: `docs/sprints/sprint-02.md`.

## Criterios de aceptación

- [x] HT-02: roles, duplicados, hash cero y eventos (30 pruebas)
- [x] HT-02: cobertura ≥ 90 % y reporte de gas por función
- [x] HT-02: Slither sin hallazgos (job `slither`)
- [x] HT-02: desplegado y verificado en Amoy, con hash de prueba registrado (<enlaces>)
- [x] HT-02: ABI exportado sin deriva
- [x] HU-45: acciones registradas con usuario, fecha, IP, entidad y acción
- [x] HU-45: solo inserción (trigger, prueba e2e)
- [x] HU-45: consulta del ADMIN con filtros (API y página)

## Pendiente

- Aceptación del Product Owner en la revisión del sprint.
```

## 11. Trazabilidad criterio → evidencia

| Criterio                                           | Evidencia                                                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| HT-02.1 registrar: rol, duplicados, cero, evento   | `RegistroRecibos.t.sol` y `.test.ts` (errores exactos y `ReciboRegistrado`)                                       |
| HT-02.2 anular, verificar, pause y unpause por rol | pruebas de roles, incluidas `unpause` sin admin y anular en pausa                                                 |
| HT-02.3 cobertura ≥ 90 % y gas por función         | `REPORTE-COBERTURA.md` y `REPORTE-GAS.md` regenerados; job `contratos`                                            |
| HT-02.4 Slither sin hallazgos altos                | job `slither` en verde (`fail_on: medium`); salida local `0 result(s) found`                                      |
| HT-02.5 desplegado, verificado y hash de prueba    | `ignition/deployments/chain-80002/`, PolygonScan `#code`, salida de `registrar-prueba` y tabla de `despliegue.md` |
| HT-02.6 ABI exportado                              | `export-abi` sin diff y control de deriva en CI                                                                   |
| HU-45.1 acciones registradas                       | `auditoria-cobertura.spec.ts` (15 handlers), e2e de bitácora y aserción VALIDAR en `flujo-anclaje`                |
| HU-45.2 usuario, fecha, IP, entidad y acción       | columnas de `BitacoraAuditoria` y e2e caso 1                                                                      |
| HU-45.3 sin modificar ni eliminar (RN-17)          | migración `bitacora_solo_insercion`, puerto sin edición y e2e caso 7                                              |
| HU-45.4 consulta del ADMIN con filtros             | `GET /api/v1/bitacora`, e2e casos 4 a 6, página `/bitacora` y su prueba de Vitest                                 |

## 12. Estimación

| Fase | Tareas                                                                              | Historia |  Horas |
| ---- | ----------------------------------------------------------------------------------- | -------- | -----: |
| 0    | Preparación y limpieza (T0)                                                         | HT-02    |    0,5 |
| 1    | Pruebas, reporte, Slither, red operadora, script, documentación y ADR-008 (T1 a T6) | HT-02    |      9 |
| 2    | Punto de control en Amoy (usuario)                                                  | HT-02    |      2 |
| 3    | Bitácora (T7 a T15)                                                                 | HU-45    |      6 |
| 4    | Evidencia de Amoy                                                                   | HT-02    |    1,5 |
| 5    | Definición de Terminado, informe y commit                                           | HT-02    |      2 |
| —    | Holgura                                                                             | HT-02    |      3 |
|      | **Total**                                                                           |          | **24** |
