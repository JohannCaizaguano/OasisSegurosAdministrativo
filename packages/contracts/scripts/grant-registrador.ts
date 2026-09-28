import { network } from 'hardhat';
import { getAddress } from 'viem';

const contractAddress = process.env.CONTRACT_ADDRESS;
const operatorAddress = process.env.OPERATOR_ADDRESS;

if (!contractAddress) {
  throw new Error('Falta CONTRACT_ADDRESS (dirección del RegistroRecibos desplegado).');
}
if (!operatorAddress) {
  throw new Error('Falta OPERATOR_ADDRESS (dirección pública de la cuenta operadora).');
}

const { viem } = await network.create();
const publicClient = await viem.getPublicClient();
const [admin] = await viem.getWalletClients();

if (!admin) {
  throw new Error(
    'La red seleccionada no tiene cuentas de firma. En Amoy configure DEPLOYER_PRIVATE_KEY ' +
      'con `hardhat keystore set DEPLOYER_PRIVATE_KEY` y use --network amoy.',
  );
}

const registro = await viem.getContractAt('RegistroRecibos', getAddress(contractAddress));
const rolRegistrador = await registro.read.REGISTRADOR_ROLE();
const operador = getAddress(operatorAddress);

if (await registro.read.hasRole([rolRegistrador, operador])) {
  console.log(`La cuenta ${operador} ya tiene REGISTRADOR_ROLE. Nada por hacer.`);
} else {
  const txHash = await registro.write.grantRole([rolRegistrador, operador], {
    account: admin.account,
  });
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`REGISTRADOR_ROLE otorgado a ${operador}`);
  console.log(`Transacción: ${txHash}`);
}

console.log(`Contrato: ${contractAddress}`);
