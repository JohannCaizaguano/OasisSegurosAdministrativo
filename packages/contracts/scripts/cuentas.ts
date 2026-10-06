import { network } from 'hardhat';
import { formatEther } from 'viem';

// Muestra la dirección y el saldo de las cuentas de la red elegida sin revelar sus claves:
// así se comprueba a qué cuenta corresponde cada clave del keystore.
const { viem } = await network.create();
const publicClient = await viem.getPublicClient();

for (const cuenta of await viem.getWalletClients()) {
  const saldo = await publicClient.getBalance({ address: cuenta.account.address });
  console.log(`${cuenta.account.address}  ${formatEther(saldo)} POL`);
}
