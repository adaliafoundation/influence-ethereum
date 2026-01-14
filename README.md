# Influence

Smart contracts for Influence. A grand strategy game set in an asteroid belt and built on Ethereum.

## Test Environment
1. (As needed) Install [MetaMask](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn) in Chrome
1. (As needed) Install ganache and truffle globally: `npm install -g truffle ganache-cli`
1. Install local node modules: `npm install`
1. Start up your local chain by running `ganache-cli --host 192.168.1.100`. Host is optional.
    > Alternatively, to allow for starting / stopping and retaining block history (as well as simulating realistic block times) you can use: `ganache-cli --host 192.168.1.100 -d -i 1337 --mnemonic="[your 12 world mnemonic here]" --db ./data --blockTime 15`
1. In the MetaMask extension header, there is a Network dropdown where `"Ethereum Mainnet"` is selected by default. Select `"Localhost 8545"` to point MetaMask to the locally running chain instead.
1. (As needed) Create a new account in MetaMask.
1. Copy the wallet address into `TEST_ADDRESS` in `.env`
1. Run `truffle migrate` to ensure all contracts are compiled and up to date
1. Run `truffle exec ./bin/seedChain.js` to simulate sales up to the present (and add some asteroids and ETH to your `TEST_ADDRESS` wallet)
    > __NOTE__: The final lines of output that start with `CONTRACT_*` will be needed in the `.env` files in both the client and server projects.

## Generate ABIs
1. Ensure `truffle migrate` has been run first
2. Run `node ./bin/generateAbis.js > contracts.json` and output to desired location

## Verifying on Etherscan
1. Ensure the `ETHERSCAN_API_KEY` is set in `.env`
2. Run `truffle run verify CONTRACT_1 --network NETWORK` for the desired contract and network (rinkeby, production)

## Migrating
When running migrations with dry runs make sure to copy the `mainnet.json` to `unknown-1337.json` in the `migrations` directory.