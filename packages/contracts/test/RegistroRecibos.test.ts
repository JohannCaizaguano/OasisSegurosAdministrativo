import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { network } from 'hardhat';
import { getAddress, parseEventLogs } from 'viem';

const { viem } = await network.create();

const ID_RECIBO = `0x${'11'.repeat(32)}` as const;
const HASH_RECIBO = `0x${'22'.repeat(32)}` as const;
const MOTIVO = `0x${'33'.repeat(32)}` as const;
const CERO = `0x${'00'.repeat(32)}` as const;

async function desplegar() {
  const [admin, registrador, intruso] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();
  const registro = await viem.deployContract('RegistroRecibos', [admin.account.address]);
  const rolRegistrador = await registro.read.REGISTRADOR_ROLE();

  const txHash = await registro.write.grantRole([rolRegistrador, registrador.account.address], {
    account: admin.account,
  });
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return { registro, publicClient, admin, registrador, intruso, rolRegistrador };
}

describe('RegistroRecibos', () => {
  it('el despliegue otorga DEFAULT_ADMIN_ROLE al admin y no al intruso', async () => {
    const { registro, admin, intruso } = await desplegar();
    const adminRole = await registro.read.DEFAULT_ADMIN_ROLE();

    assert.equal(await registro.read.hasRole([adminRole, admin.account.address]), true);
    assert.equal(await registro.read.hasRole([adminRole, intruso.account.address]), false);
  });

  it('registra un recibo y emite ReciboRegistrado', async () => {
    const { registro, publicClient, registrador } = await desplegar();

    const txHash = await registro.write.registrar([ID_RECIBO, HASH_RECIBO], {
      account: registrador.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    const eventos = parseEventLogs({
      abi: registro.abi,
      eventName: 'ReciboRegistrado',
      logs: receipt.logs,
    });

    assert.equal(eventos.length, 1);
    assert.equal(eventos[0].args.idRecibo, ID_RECIBO);
    assert.equal(eventos[0].args.hashRecibo, HASH_RECIBO);

    const [existe, hashRecibo, registradoEn, anulado] = await registro.read.verificar([ID_RECIBO]);
    assert.equal(existe, true);
    assert.equal(hashRecibo, HASH_RECIBO);
    assert.ok(registradoEn > 0n);
    assert.equal(anulado, false);
  });

  it('revierte si la cuenta no tiene REGISTRADOR_ROLE', async () => {
    const { registro, intruso, rolRegistrador } = await desplegar();

    await viem.assertions.revertWithCustomErrorWithArgs(
      registro.write.registrar([ID_RECIBO, HASH_RECIBO], { account: intruso.account }),
      registro,
      'AccessControlUnauthorizedAccount',
      [getAddress(intruso.account.address), rolRegistrador],
    );
  });

  it('revierte al registrar un id duplicado', async () => {
    const { registro, registrador } = await desplegar();

    await registro.write.registrar([ID_RECIBO, HASH_RECIBO], { account: registrador.account });

    await viem.assertions.revertWithCustomErrorWithArgs(
      registro.write.registrar([ID_RECIBO, HASH_RECIBO], { account: registrador.account }),
      registro,
      'ReciboYaRegistrado',
      [ID_RECIBO],
    );
  });

  it('revierte al registrar hash cero o id cero', async () => {
    const { registro, registrador } = await desplegar();

    await viem.assertions.revertWithCustomError(
      registro.write.registrar([CERO, HASH_RECIBO], { account: registrador.account }),
      registro,
      'IdReciboInvalido',
    );
    await viem.assertions.revertWithCustomError(
      registro.write.registrar([ID_RECIBO, CERO], { account: registrador.account }),
      registro,
      'HashReciboInvalido',
    );
  });

  it('al pausar no se pueden registrar recibos y al reanudar sí', async () => {
    const { registro, admin, registrador } = await desplegar();

    await registro.write.pause({ account: admin.account });
    await viem.assertions.revertWithCustomError(
      registro.write.registrar([ID_RECIBO, HASH_RECIBO], { account: registrador.account }),
      registro,
      'EnforcedPause',
    );

    await registro.write.unpause({ account: admin.account });
    await registro.write.registrar([ID_RECIBO, HASH_RECIBO], { account: registrador.account });

    const [existe] = await registro.read.verificar([ID_RECIBO]);
    assert.equal(existe, true);
  });

  it('solo el admin puede pausar', async () => {
    const { registro, registrador } = await desplegar();
    await viem.assertions.revertWithCustomErrorWithArgs(
      registro.write.pause({ account: registrador.account }),
      registro,
      'AccessControlUnauthorizedAccount',
      [getAddress(registrador.account.address), await registro.read.DEFAULT_ADMIN_ROLE()],
    );
  });

  it('solo el admin puede reanudar', async () => {
    const { registro, admin, registrador } = await desplegar();
    await registro.write.pause({ account: admin.account });

    await viem.assertions.revertWithCustomErrorWithArgs(
      registro.write.unpause({ account: registrador.account }),
      registro,
      'AccessControlUnauthorizedAccount',
      [getAddress(registrador.account.address), await registro.read.DEFAULT_ADMIN_ROLE()],
    );
  });

  it('anula un recibo existente y emite ReciboAnulado', async () => {
    const { registro, publicClient, registrador } = await desplegar();

    await registro.write.registrar([ID_RECIBO, HASH_RECIBO], { account: registrador.account });
    const txHash = await registro.write.anular([ID_RECIBO, MOTIVO], {
      account: registrador.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    const eventos = parseEventLogs({
      abi: registro.abi,
      eventName: 'ReciboAnulado',
      logs: receipt.logs,
    });

    assert.equal(eventos.length, 1);
    assert.equal(eventos[0].args.idRecibo, ID_RECIBO);
    assert.equal(eventos[0].args.motivoHash, MOTIVO);

    const [, , , anulado] = await registro.read.verificar([ID_RECIBO]);
    assert.equal(anulado, true);
  });

  it('revierte al anular un recibo inexistente o ya anulado', async () => {
    const { registro, registrador } = await desplegar();

    await viem.assertions.revertWithCustomErrorWithArgs(
      registro.write.anular([ID_RECIBO, MOTIVO], { account: registrador.account }),
      registro,
      'ReciboNoRegistrado',
      [ID_RECIBO],
    );

    await registro.write.registrar([ID_RECIBO, HASH_RECIBO], { account: registrador.account });
    await registro.write.anular([ID_RECIBO, MOTIVO], { account: registrador.account });

    await viem.assertions.revertWithCustomErrorWithArgs(
      registro.write.anular([ID_RECIBO, MOTIVO], { account: registrador.account }),
      registro,
      'ReciboYaAnulado',
      [ID_RECIBO],
    );
  });

  it('con el contrato pausado se puede anular un recibo existente', async () => {
    const { registro, admin, registrador } = await desplegar();

    await registro.write.registrar([ID_RECIBO, HASH_RECIBO], { account: registrador.account });
    await registro.write.pause({ account: admin.account });
    await registro.write.anular([ID_RECIBO, MOTIVO], { account: registrador.account });

    const [existe, , , anulado] = await registro.read.verificar([ID_RECIBO]);
    assert.equal(existe, true);
    assert.equal(anulado, true);
  });

  it('verificar devuelve existe=false para un id desconocido', async () => {
    const { registro } = await desplegar();
    const [existe, hashRecibo, registradoEn, anulado] = await registro.read.verificar([ID_RECIBO]);
    assert.equal(existe, false);
    assert.equal(hashRecibo, CERO);
    assert.equal(registradoEn, 0n);
    assert.equal(anulado, false);
  });
});
