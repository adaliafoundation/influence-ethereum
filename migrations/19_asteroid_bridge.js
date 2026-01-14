const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const AsteroidBridge = artifacts.require('AsteroidBridge');
const AsteroidToken = artifacts.require('AsteroidToken');

const {
  STARKNET_CORE_ADDRESS,
  STARKNET_ASTEROID_BRIDGE_ADDRESS } = process.env;

module.exports = async function(deployer, network, accounts) {
  if (!STARKNET_CORE_ADDRESS) throw new Error('Invalid/missing: STARKNET_CORE_ADDRESS');
  if (!STARKNET_ASTEROID_BRIDGE_ADDRESS) throw new Error('Invalid/missing: STARKNET_ASTEROID_BRIDGE_ADDRESS');

  const instance = await deployProxy(
    AsteroidBridge,
    [
      STARKNET_CORE_ADDRESS,
      AsteroidToken.address,
      STARKNET_ASTEROID_BRIDGE_ADDRESS
    ],
    { deployer, initializer: 'initialize' }
  );

  // add the asteroid token bridge as a manager
  const AsteroidTokenContract = await AsteroidToken.deployed();
  await AsteroidTokenContract.addManager(instance.address);
};
