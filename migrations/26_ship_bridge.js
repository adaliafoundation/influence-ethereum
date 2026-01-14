const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const keccak256 = require('keccak256');
const ShipBridge = artifacts.require('ShipBridge');
const Ship = artifacts.require('Ship');

const {
  STARKNET_CORE_ADDRESS,
  STARKNET_SHIP_BRIDGE_ADDRESS } = process.env;

module.exports = async function(deployer) {
  const MANAGER_ROLE = keccak256("MANAGER_ROLE");
  if (!STARKNET_CORE_ADDRESS) throw new Error('Invalid/missing: STARKNET_CORE_ADDRESS');
  if (!STARKNET_SHIP_BRIDGE_ADDRESS) throw new Error('Invalid/missing: STARKNET_SHIP_BRIDGE_ADDRESS');

  const instance = await deployProxy(
    ShipBridge,
    [
      STARKNET_CORE_ADDRESS,
      Ship.address,
      STARKNET_SHIP_BRIDGE_ADDRESS
    ],
    { deployer, initializer: 'initialize' }
  );

  // add the ship bridge as a manager
  const ShipContract = await Ship.deployed();
  await ShipContract.grantRole(MANAGER_ROLE, instance.address);
};
