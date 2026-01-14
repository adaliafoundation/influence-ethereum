const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const keccak256 = require('keccak256');

const CrewmateBridge = artifacts.require('CrewmateBridge');
const CrewToken = artifacts.require('CrewToken');
const CrewmateToken = artifacts.require('CrewmateToken');
const CrewFeatures = artifacts.require('CrewFeatures');

const { STARKNET_CORE_ADDRESS, STARKNET_CREWMATE_BRIDGE_ADDRESS } = process.env;

module.exports = async function(deployer) {
  const MANAGER_ROLE = keccak256("MANAGER_ROLE");
  if (!STARKNET_CORE_ADDRESS) throw new Error('Invalid/missing: STARKNET_CORE_ADDRESS');
  if (!STARKNET_CREWMATE_BRIDGE_ADDRESS) throw new Error('Invalid/missing: STARKNET_CREWMATE_BRIDGE_ADDRESS');

  const instance = await deployProxy(
    CrewmateBridge,
    [
      STARKNET_CORE_ADDRESS,
      CrewToken.address,
      CrewmateToken.address,
      CrewFeatures.address,
      STARKNET_CREWMATE_BRIDGE_ADDRESS
    ],
    { deployer, initializer: 'initialize' }
  );

  // add the crewmate token bridge as a manager
  const CrewTokenContract = await CrewToken.deployed();
  await CrewTokenContract.addManager(instance.address);

  const CrewmateTokenContract = await CrewmateToken.deployed();
  await CrewmateTokenContract.grantRole(MANAGER_ROLE, instance.address);

  // NOTE: reminder to update startScanCount and endScanCount on the ArvadCrewSale contract
  // to prevent further mintCrewWithAsteroid
  console.warn('reminder to update startScanCount and endScanCount on the ArvadCrewSale contract');
};
