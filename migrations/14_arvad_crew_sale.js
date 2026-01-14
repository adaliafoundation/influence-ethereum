const ArvadCrewSale = artifacts.require('ArvadCrewSale');
const AsteroidToken = artifacts.require('AsteroidToken');
const AsteroidFeatures = artifacts.require('AsteroidFeatures');
const AsteroidScans = artifacts.require('AsteroidScans');
const CrewToken = artifacts.require('CrewToken');
const CrewFeatures = artifacts.require('CrewFeatures');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(
    ArvadCrewSale,
    AsteroidToken.address,
    AsteroidFeatures.address,
    AsteroidScans.address,
    CrewToken.address,
    CrewFeatures.address
  );

  const asteroids = await AsteroidToken.deployed();
  await asteroids.addManager(ArvadCrewSale.address);
  console.log('Added ArvadCrewSale as manager to AsteroidToken');
  const scans = await AsteroidScans.deployed();
  await scans.addManager(ArvadCrewSale.address);
  console.log('Added ArvadCrewSale as manager to AsteroidScans');
  const crew = await CrewToken.deployed();
  await crew.addManager(ArvadCrewSale.address);
  console.log('Added ArvadCrewSale as manager to CrewToken');
  const crewFeatures = await CrewFeatures.deployed();
  await crewFeatures.addManager(ArvadCrewSale.address);
  console.log('Added ArvadCrewSale as manager to CrewFeatures');
};
