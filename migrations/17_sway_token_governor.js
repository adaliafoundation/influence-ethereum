const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const keccak256 = require('keccak256');

// Contracts
const AsteroidToken = artifacts.require('AsteroidToken');
const AsteroidFeatures = artifacts.require('AsteroidFeatures');
const AsteroidScans = artifacts.require('AsteroidScans');
const CrewToken = artifacts.require('CrewToken');
const SwayToken = artifacts.require('SwayToken');
const SwayGovernor = artifacts.require('SwayGovernor');

const GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
const TRANSFERRER_ROLE = keccak256("TRANSFERRER_ROLE");
// const MERKLE_ROOT = '0x8674973315e9cf4a6eb853b4b115067b71f0af0ebdc6dc65f10da6c3e2110496';

module.exports = async function(deployer, network, accounts) {
  const instance = await deployProxy(SwayGovernor, [SwayToken.address],{ deployer, initializer: 'initialize' });

  const asteroidTokenContract = await AsteroidToken.deployed();
  const asteroidFeaturesContract = await AsteroidFeatures.deployed();
  const asteroidScansContract = await AsteroidScans.deployed();
  const crewTokenContract = await CrewToken.deployed();
  const swayTokenContract = await SwayToken.deployed();

  // set test credit merkle root
  // await instance.setTesterCreditMerkleRoot(MERKLE_ROOT);

  // link contracts
  await instance.linkContracts(
    asteroidTokenContract.address,
    asteroidFeaturesContract.address,
    asteroidScansContract.address,
    crewTokenContract.address
  );

  // add required roles
  await swayTokenContract.grantRole(GOVERNOR_ROLE, instance.address);
  await swayTokenContract.grantRole(TRANSFERRER_ROLE, instance.address);

  // Remember to send SWAY to the governor contract from the Influence wallet!
};
