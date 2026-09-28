import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

/**
 * Despliegue del registro inmutable de recibos.
 * La cuenta 0 de la red es el administrador (DEFAULT_ADMIN_ROLE): en Amoy es la
 * cuenta del desplegador, custodiada con hardhat-keystore y fuera del servidor.
 * El REGISTRADOR_ROLE se otorga a la cuenta operadora con scripts/grant-registrador.ts.
 */
export default buildModule('RegistroRecibosModule', (m) => {
  const admin = m.getAccount(0);
  const registroRecibos = m.contract('RegistroRecibos', [admin]);

  return { registroRecibos };
});
