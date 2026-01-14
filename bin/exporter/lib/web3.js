require('dotenv').config({ silent: true });
const Web3 = require('web3');

const wsProvider = new Web3.providers.WebsocketProvider(process.env.ETHEREUM_PROVIDER, {
  timeout: 30000, // ms
  clientConfig: {
    // Useful to keep a connection alive
    keepalive: true,
    keepaliveInterval: 60000 // ms
  },
  // Enable auto reconnection
  reconnect: {
    auto: true,
    delay: 5000, // ms
    maxAttempts: 5,
    onTimeout: false
  }
});

const web3 = new Web3(wsProvider);
web3.eth.Contract.setProvider(web3.currentProvider);
module.exports = web3;
