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
