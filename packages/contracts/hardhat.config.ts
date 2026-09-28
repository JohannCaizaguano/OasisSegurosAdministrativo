import hardhatToolboxViemPlugin from '@nomicfoundation/hardhat-toolbox-viem';
import { configVariable, defineConfig } from 'hardhat/config';

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: '0.8.28',
      },
      production: {
        version: '0.8.28',
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    },
  },
  networks: {
    localhost: {
      type: 'http',
      chainId: 31337,
      url: 'http://127.0.0.1:8545',
      // El nodo Hardhat local firma con sus cuentas desbloqueadas (sin claves en el repo).
      accounts: 'remote',
    },
    amoy: {
      type: 'http',
      chainId: 80002,
      // Polygon PoS no es L1 ni OP Stack: se deja el chainType por defecto (generic).
      url: configVariable('AMOY_RPC_URL'),
      accounts: [configVariable('DEPLOYER_PRIVATE_KEY')],
    },
  },
  verify: {
    etherscan: {
      // Etherscan API v2: una sola API key sirve para todas las chains soportadas.
      apiKey: configVariable('ETHERSCAN_API_KEY'),
    },
  },
});
