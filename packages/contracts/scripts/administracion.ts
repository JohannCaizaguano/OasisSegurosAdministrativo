import type { Account, Address, Hex } from 'viem';

/** Lo que usan los scripts del contrato `RegistroRecibos` desplegado (ADR-021). */
export interface RegistroAdministrable {
  address: Address;
  read: {
    DEFAULT_ADMIN_ROLE(): Promise<Hex>;
    REGISTRADOR_ROLE(): Promise<Hex>;
    hasRole(args: readonly [Hex, Address]): Promise<boolean>;
    paused(): Promise<boolean>;
  };
  write: {
    grantRole(args: readonly [Hex, Address], opciones: { account: Account }): Promise<Hex>;
    revokeRole(args: readonly [Hex, Address], opciones: { account: Account }): Promise<Hex>;
    renounceRole(args: readonly [Hex, Address], opciones: { account: Account }): Promise<Hex>;
    pause(opciones: { account: Account }): Promise<Hex>;
  };
}

interface EsperaRecibos {
  waitForTransactionReceipt(args: { hash: Hex }): Promise<{ status: 'success' | 'reverted' }>;
}

interface Contexto {
  registro: RegistroAdministrable;
  publicClient: EsperaRecibos;
  log?: (mensaje: string) => void;
}

async function confirmarTx(contexto: Contexto, descripcion: string, hash: Hex): Promise<Hex> {
  const recibo = await contexto.publicClient.waitForTransactionReceipt({ hash });
  if (recibo.status !== 'success') {
    throw new Error(`La transacción "${descripcion}" revirtió: ${hash}`);
  }
  (contexto.log ?? console.log)(`${descripcion}: ${hash}`);
  return hash;
}

async function exigirAdmin(contexto: Contexto, cuenta: Address): Promise<Hex> {
  const adminRole = await contexto.registro.read.DEFAULT_ADMIN_ROLE();
  if (!(await contexto.registro.read.hasRole([adminRole, cuenta]))) {
    throw new Error(`La cuenta ${cuenta} no es administradora del contrato`);
  }
  return adminRole;
}

/**
 * HT-15.1 (D18): otorga DEFAULT_ADMIN_ROLE a la billetera fría, comprueba que lo tiene y solo
 * entonces el desplegador renuncia (irreversible: `confirmar` decide si se sigue).
 */
export async function transferirAdmin(
  contexto: Contexto & {
    desplegador: Account;
    fria: Address;
    confirmar: () => Promise<boolean>;
  },
): Promise<{ transacciones: Hex[] }> {
  const { registro, desplegador, fria } = contexto;
  if (fria.toLowerCase() === desplegador.address.toLowerCase()) {
    throw new Error('La billetera fría debe ser una cuenta distinta del desplegador');
  }
  const adminRole = await exigirAdmin(contexto, desplegador.address);
  const transacciones: Hex[] = [];

  if (!(await registro.read.hasRole([adminRole, fria]))) {
    transacciones.push(
      await confirmarTx(
        contexto,
        `grantRole(DEFAULT_ADMIN_ROLE, ${fria})`,
        await registro.write.grantRole([adminRole, fria], { account: desplegador }),
      ),
    );
  }
  if (!(await registro.read.hasRole([adminRole, fria]))) {
    throw new Error(`La billetera fría ${fria} no quedó como administradora; no se renuncia`);
  }
  if (!(await contexto.confirmar())) {
    throw new Error('Transferencia cancelada antes de renunciar el rol del desplegador');
  }
  transacciones.push(
    await confirmarTx(
      contexto,
      `renounceRole(DEFAULT_ADMIN_ROLE, ${desplegador.address})`,
      await registro.write.renounceRole([adminRole, desplegador.address], { account: desplegador }),
    ),
  );
  if (await registro.read.hasRole([adminRole, desplegador.address])) {
    throw new Error('El desplegador sigue siendo administrador tras renunciar');
  }
  return { transacciones };
}

/**
 * HT-15.3 (D18): primero otorga el rol a la cuenta nueva y luego lo revoca a la anterior, para no
 * dejar el anclaje sin registrador; con `pausar`, detiene el registro ante una filtración.
 */
export async function rotarOperadora(
  contexto: Contexto & { admin: Account; anterior: Address; nueva: Address; pausar: boolean },
): Promise<{ transacciones: Hex[] }> {
  const { registro, admin, anterior, nueva } = contexto;
  await exigirAdmin(contexto, admin.address);
  const rol = await registro.read.REGISTRADOR_ROLE();
  const transacciones: Hex[] = [];

  if (contexto.pausar && !(await registro.read.paused())) {
    transacciones.push(
      await confirmarTx(contexto, 'pause()', await registro.write.pause({ account: admin })),
    );
  }
  if (!(await registro.read.hasRole([rol, nueva]))) {
    transacciones.push(
      await confirmarTx(
        contexto,
        `grantRole(REGISTRADOR_ROLE, ${nueva})`,
        await registro.write.grantRole([rol, nueva], { account: admin }),
      ),
    );
  }
  if (await registro.read.hasRole([rol, anterior])) {
    transacciones.push(
      await confirmarTx(
        contexto,
        `revokeRole(REGISTRADOR_ROLE, ${anterior})`,
        await registro.write.revokeRole([rol, anterior], { account: admin }),
      ),
    );
  }
  if (
    !(await registro.read.hasRole([rol, nueva])) ||
    (await registro.read.hasRole([rol, anterior]))
  ) {
    throw new Error('La rotación no dejó los roles esperados');
  }
  return { transacciones };
}
