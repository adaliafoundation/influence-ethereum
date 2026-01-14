require('dotenv').config({ silent: true });
const HDWalletProvider = require('@truffle/hdwallet-provider');

const networks = {
  development: {
    host: process.env.HOST || 'localhost',
    port: 8545,
    network_id: '*',
    disableConfirmationListener: true
  }
};

// When USB is available locally (i.e. not in CI/CD) setup our Ledger providers
if (process.env.MNEMONIC) {

  networks.production = {
    provider: () => {
      return new HDWalletProvider(process.env.MNEMONIC, `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`);
    },
    network_id: 1,
    timeoutBlocks: 200,
    deploymentPollingInterval: 10000,
    gasPrice: process.env.DEPLOY_GAS_PRICE || 25_000_000_000,
    maxFeePerGas: process.env.DEPLOY_GAS_PRICE || 25_000_000_000,
    maxPriorityFeePerGas: 1_000_000_000,
    confirmations: 5
  };

  networks.goerli = {
    provider: () => {
      return new HDWalletProvider({
        mnemonic: process.env.MNEMONIC,
        providerOrUrl: `wss://goerli.infura.io/ws/v3/${process.env.INFURA_ID}`,
        pollingInterval: 30000,
        disableConfirmationListener: true
      });
    },
    network_id: 5,
    deploymentPollingInterval: 10000,
    maxFeePerGas: process.env.DEPLOY_GAS_PRICE || 10_000_000_000,
    maxPriorityFeePerGas: 1_000_000_000,
    networkCheckTimeout: 100000,
    timeoutBlocks: 5,
    disableConfirmationListener: true
  };

  networks.sepolia = {
    provider: () => {
      return new HDWalletProvider({
        mnemonic: process.env.MNEMONIC,
        providerOrUrl: `wss://sepolia.infura.io/ws/v3/${process.env.INFURA_ID}`,
        pollingInterval: 30000,
        disableConfirmationListener: true
      });
    },
    network_id: 11155111,
    deploymentPollingInterval: 10000,
    maxFeePerGas: process.env.DEPLOY_GAS_PRICE || 200_000_000_000,
    maxPriorityFeePerGas: 1_000_000,
    networkCheckTimeout: 100000,
    timeoutBlocks: 5,
    disableConfirmationListener: true
  };

  if (process.env.DEPLOY_ADDRESS) {
    networks.production.from = process.env.DEPLOY_ADDRESS;
    networks.goerli.from = process.env.DEPLOY_ADDRESS;
    networks.sepolia.from = process.env.DEPLOY_ADDRESS;
  }
}

module.exports = {
  networks: networks,
  compilers: {
    solc: {
      version: "0.8.19"
    }
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  }
};
