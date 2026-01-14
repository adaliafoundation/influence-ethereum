// Contracts
const SwayToken = artifacts.require('SwayToken');
const SwayBridge = artifacts.require('SwayBridge');

const { STARKNET_CORE_ADDRESS, STARKNET_SWAY_BRIDGE_ADDRESS } = process.env;

module.exports = async function(deployer, network, accounts) {
  if (!STARKNET_CORE_ADDRESS) throw new Error('Invalid/missing: STARKNET_CORE_ADDRESS');
  if (!STARKNET_SWAY_BRIDGE_ADDRESS) throw new Error('Invalid/missing: STARKNET_SWAY_BRIDGE_ADDRESS');

  await deployer.deploy(SwayBridge, STARKNET_CORE_ADDRESS, SwayToken.address, STARKNET_SWAY_BRIDGE_ADDRESS);
};
