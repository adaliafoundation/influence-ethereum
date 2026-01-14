const { deployProxy } = require('@openzeppelin/truffle-upgrades');

// Contracts
const StarknetSwayVolume = artifacts.require('StarknetSwayVolume');
const SwayGovernor = artifacts.require('SwayGovernor');

const { STARKNET_CORE_ADDRESS, STARKNET_SWAY_BRIDGE_ADDRESS } = process.env;

module.exports = async function(deployer, network, accounts) {
  if (!STARKNET_CORE_ADDRESS) throw new Error('Invalid/missing: STARKNET_CORE_ADDRESS');
  if (!STARKNET_SWAY_BRIDGE_ADDRESS) throw new Error('Invalid/missing: STARKNET_SWAY_BRIDGE_ADDRESS');

  const instance = await deployProxy(
    StarknetSwayVolume, [STARKNET_CORE_ADDRESS, STARKNET_SWAY_BRIDGE_ADDRESS],{ deployer, initializer: 'initialize' }
  );

  // Register with governor
  const governor = await SwayGovernor.deployed();
  await governor.addSource(instance.address);
};