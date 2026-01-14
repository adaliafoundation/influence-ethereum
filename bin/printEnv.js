require('dotenv').config({ silent: true });

const Planets = artifacts.require('Planets');
const AsteroidToken = artifacts.require('AsteroidToken');
const AsteroidFeatures = artifacts.require('AsteroidFeatures');
const AsteroidScans = artifacts.require('AsteroidScans');
const AsteroidSale = artifacts.require('AsteroidSale');
const AsteroidNames = artifacts.require('AsteroidNames');
const AsteroidBridge = artifacts.require('AsteroidBridge');
const ArvadCrewSale = artifacts.require('ArvadCrewSale');
const CrewToken = artifacts.require('CrewToken');
const CrewmateToken = artifacts.require('CrewmateToken');
const CrewFeatures = artifacts.require('CrewFeatures');
const CrewNames = artifacts.require('CrewNames');
const CrewmateBridge = artifacts.require('CrewmateBridge');
const SwayGovernor = artifacts.require('SwayGovernor');
const SwayToken = artifacts.require('SwayToken');

module.exports = async function(callback) {
  console.log('## SERVER ##');
  console.log(`CONTRACT_PLANETS=${Planets.address}`);
  console.log(`CONTRACT_ASTEROID_TOKEN=${AsteroidToken.address}`);
  console.log(`CONTRACT_ASTEROID_FEATURES=${AsteroidFeatures.address}`);
  console.log(`CONTRACT_ASTEROID_SCANS=${AsteroidScans.address}`);
  console.log(`CONTRACT_ASTEROID_SALE=${AsteroidSale.address}`);
  console.log(`CONTRACT_ASTEROID_NAMES=${AsteroidNames.address}`);
  console.log(`CONTRACT_ASTEROID_TOKEN_BRIDGE=${AsteroidBridge.address}`);
  console.log(`CONTRACT_ARVAD_CREW_SALE=${ArvadCrewSale.address}`);
  console.log(`CONTRACT_CREW_TOKEN=${CrewToken.address}`);
  console.log(`CONTRACT_CREW_TOKEN_V2=${CrewmateToken.address}`);
  console.log(`CONTRACT_CREW_FEATURES=${CrewFeatures.address}`);
  console.log(`CONTRACT_CREW_NAMES=${CrewNames.address}`);
  console.log(`CONTRACT_CREW_TOKEN_BRIDGE=${CrewmateBridge.address}`);

  console.log('\n## CLIENT ##');
  console.log(`REACT_APP_CONTRACT_ASTEROID_TOKEN=${AsteroidToken.address}`);
  console.log(`REACT_APP_CONTRACT_CREW_TOKEN=${CrewToken.address}`);
  console.log(`REACT_APP_CONTRACT_CREW_TOKEN_V2=${CrewTokenV2.address}`);

  console.log('\n## BRIDGE CLIENT ##');
  console.log(`REACT_APP_ETHEREUM_SWAY_GOVERNOR=${SwayGovernor.address}`);
  console.log(`REACT_APP_ETHEREUM_SWAY_TOKEN=${SwayToken.address}`);
  console.log(`REACT_APP_ETHEREUM_ASTEROID_TOKEN=${AsteroidToken.address}`);
  console.log(`REACT_APP_ETHEREUM_ASTEROID_BRIDGE=${AsteroidBridge.address}`);
  console.log(`REACT_APP_ETHEREUM_CREW_TOKEN=${CrewToken.address}`);
  console.log(`REACT_APP_ETHEREUM_CREW_BRIDGE=${CrewmateBridge.address}`);

  console.log('\n## STARKNET CONTRACTS ##');
  console.log(`ETHEREUM_ASTEROID_BRIDGE_ADDRESS=${AsteroidBridge.address}`);
  console.log(`ETHEREUM_CREWMATE_BRIDGE_ADDRESS=${CrewmateBridge.address}`);

  console.log('');
  callback();
};