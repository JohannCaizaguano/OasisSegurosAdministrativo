import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { network } from 'hardhat';

import { rotarOperadora, transferirAdmin } from '../scripts/administracion.ts';

const { viem } = await network.create();

const hash = (n: number) => `0x${n.toString(16).padStart(64, '0')}` as const;

async function desplegar() {
  const [desplegador, operadoraA, operadoraB, fria, intruso] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();
  const registro = await viem.deployContract('RegistroRecibos', [desplegador.account.address]);
  const adminRole = await registro.read.DEFAULT_ADMIN_ROLE();
  const rolRegistrador = await registro.read.REGISTRADOR_ROLE();
  await publicClient.waitForTransactionReceipt({
    hash: await registro.write.grantRole([rolRegistrador, operadoraA.account.address], {
      account: desplegador.account,
    }),
  });
  return {
    registro,
    publicClient,
    desplegador,
    operadoraA,
    operadoraB,
    fria,
    intruso,
    adminRole,
    rolRegistrador,
  };
}

const silencio = () => {};

describe('matriz de roles del contrato (HT-15)', () => {
  it('solo REGISTRADOR_ROLE registra y anula: el admin y un intruso revierten', async () => {
    const { registro, desplegador, intruso, operadoraA, publicClient } = await desplegar();

    for (const cuenta of [desplegador, intruso]) {
      await viem.assertions.revertWithCustomError(
        registro.write.registrar([hash(1), hash(2)], { account: cuenta.account }),
        registro,
        'AccessControlUnauthorizedAccount',
      );
    }
    await publicClient.waitForTransactionReceipt({
      hash: await registro.write.registrar([hash(1), hash(2)], { account: operadoraA.account }),
    });
    for (const cuenta of [desplegador, intruso]) {
      await viem.assertions.revertWithCustomError(
        registro.write.anular([hash(1), hash(3)], { account: cuenta.account }),
        registro,
        'AccessControlUnauthorizedAccount',
      );
    }
  });

  it('solo DEFAULT_ADMIN_ROLE pausa, reanuda, otorga y revoca: la operadora no', async () => {
    const { registro, operadoraA, intruso, rolRegistrador } = await desplegar();
    const operadora = { account: operadoraA.account };

    await viem.assertions.revertWithCustomError(
      registro.write.pause(operadora),
      registro,
      'AccessControlUnauthorizedAccount',
    );
    await viem.assertions.revertWithCustomError(
      registro.write.unpause(operadora),
      registro,
      'AccessControlUnauthorizedAccount',
    );
    await viem.assertions.revertWithCustomError(
      registro.write.grantRole([rolRegistrador, intruso.account.address], operadora),
      registro,
      'AccessControlUnauthorizedAccount',
    );
    await viem.assertions.revertWithCustomError(
      registro.write.revokeRole([rolRegistrador, operadoraA.account.address], {
        account: intruso.account,
      }),
      registro,
      'AccessControlUnauthorizedAccount',
    );
  });

  it('la cuenta operadora no puede otorgarse el rol de administrador', async () => {
    const { registro, operadoraA, adminRole } = await desplegar();

    await viem.assertions.revertWithCustomError(
      registro.write.grantRole([adminRole, operadoraA.account.address], {
        account: operadoraA.account,
      }),
      registro,
      'AccessControlUnauthorizedAccount',
    );
    assert.equal(await registro.read.hasRole([adminRole, operadoraA.account.address]), false);
  });
});

describe('transferirAdmin (HT-15.1, D18)', () => {
  it('deja a la billetera fría como único admin y el desplegador pierde el rol', async () => {
    const { registro, publicClient, desplegador, fria, adminRole } = await desplegar();

    const resultado = await transferirAdmin({
      registro,
      publicClient,
      desplegador: desplegador.account,
      fria: fria.account.address,
      confirmar: async () => true,
      log: silencio,
    });

    assert.equal(await registro.read.hasRole([adminRole, fria.account.address]), true);
    assert.equal(await registro.read.hasRole([adminRole, desplegador.account.address]), false);
    assert.equal(resultado.transacciones.length, 2);
    await viem.assertions.revertWithCustomError(
      registro.write.pause({ account: desplegador.account }),
      registro,
      'AccessControlUnauthorizedAccount',
    );
  });

  it('si no se confirma, otorga a la fría pero no renuncia el desplegador', async () => {
    const { registro, publicClient, desplegador, fria, adminRole } = await desplegar();

    await assert.rejects(
      transferirAdmin({
        registro,
        publicClient,
        desplegador: desplegador.account,
        fria: fria.account.address,
        confirmar: async () => false,
        log: silencio,
      }),
      /cancelada/,
    );

    assert.equal(await registro.read.hasRole([adminRole, desplegador.account.address]), true);
    assert.equal(await registro.read.hasRole([adminRole, fria.account.address]), true);
  });

  it('rechaza transferir a la misma cuenta que despliega', async () => {
    const { registro, publicClient, desplegador } = await desplegar();

    await assert.rejects(
      transferirAdmin({
        registro,
        publicClient,
        desplegador: desplegador.account,
        fria: desplegador.account.address,
        confirmar: async () => true,
        log: silencio,
      }),
      /distinta/,
    );
  });
});

describe('rotarOperadora ante una filtración (HT-15.3, D18)', () => {
  it('A registra → rotar a B con pausa → A revierte, todo revierte por pausa → la fría reanuda → B registra', async () => {
    const { registro, publicClient, desplegador, operadoraA, operadoraB, fria, rolRegistrador } =
      await desplegar();
    await transferirAdmin({
      registro,
      publicClient,
      desplegador: desplegador.account,
      fria: fria.account.address,
      confirmar: async () => true,
      log: silencio,
    });
    await publicClient.waitForTransactionReceipt({
      hash: await registro.write.registrar([hash(10), hash(11)], { account: operadoraA.account }),
    });

    await rotarOperadora({
      registro,
      publicClient,
      admin: fria.account,
      anterior: operadoraA.account.address,
      nueva: operadoraB.account.address,
      pausar: true,
      log: silencio,
    });

    assert.equal(await registro.read.hasRole([rolRegistrador, operadoraA.account.address]), false);
    assert.equal(await registro.read.hasRole([rolRegistrador, operadoraB.account.address]), true);
    assert.equal(await registro.read.paused(), true);
    await viem.assertions.revertWithCustomError(
      registro.write.registrar([hash(12), hash(13)], { account: operadoraA.account }),
      registro,
      'AccessControlUnauthorizedAccount',
    );
    await viem.assertions.revertWithCustomError(
      registro.write.registrar([hash(12), hash(13)], { account: operadoraB.account }),
      registro,
      'EnforcedPause',
    );

    await publicClient.waitForTransactionReceipt({
      hash: await registro.write.unpause({ account: fria.account }),
    });
    await publicClient.waitForTransactionReceipt({
      hash: await registro.write.registrar([hash(12), hash(13)], { account: operadoraB.account }),
    });
    const [existe] = await registro.read.verificar([hash(12)]);
    assert.equal(existe, true);
  });

  it('sin --pausar rota sin detener el registro', async () => {
    const { registro, publicClient, desplegador, operadoraA, operadoraB } = await desplegar();

    await rotarOperadora({
      registro,
      publicClient,
      admin: desplegador.account,
      anterior: operadoraA.account.address,
      nueva: operadoraB.account.address,
      pausar: false,
      log: silencio,
    });

    assert.equal(await registro.read.paused(), false);
  });

  it('una cuenta que no es admin no puede rotar', async () => {
    const { registro, publicClient, operadoraA, operadoraB } = await desplegar();

    await assert.rejects(
      rotarOperadora({
        registro,
        publicClient,
        admin: operadoraA.account,
        anterior: operadoraA.account.address,
        nueva: operadoraB.account.address,
        pausar: true,
        log: silencio,
      }),
      /administrador/,
    );
  });
});
