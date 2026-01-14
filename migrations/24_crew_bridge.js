const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const keccak256 = require('keccak256');
const CrewBridge = artifacts.require('CrewBridge');
const Crew = artifacts.require('Crew');

const {
  STARKNET_CORE_ADDRESS,
  STARKNET_CREW_BRIDGE_ADDRESS } = process.env;

module.exports = async function(deployer) {
  const MANAGER_ROLE = keccak256("MANAGER_ROLE");
  if (!STARKNET_CORE_ADDRESS) throw new Error('Invalid/missing: STARKNET_CORE_ADDRESS');
  if (!STARKNET_CREW_BRIDGE_ADDRESS) throw new Error('Invalid/missing: STARKNET_CREW_BRIDGE_ADDRESS');

  const instance = await deployProxy(
    CrewBridge,
    [
      STARKNET_CORE_ADDRESS,
      Crew.address,
      STARKNET_CREW_BRIDGE_ADDRESS
    ],
    { deployer, initializer: 'initialize' }
  );

  // add the crew bridge as a manager
  const CrewContract = await Crew.deployed();
  await CrewContract.grantRole(MANAGER_ROLE, instance.address);
};
