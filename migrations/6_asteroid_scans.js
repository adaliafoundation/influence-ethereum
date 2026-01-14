// Libraries to link
const Procedural = artifacts.require('Procedural');
const InfluenceSettings = artifacts.require('InfluenceSettings');

// Contracts
const AsteroidToken = artifacts.require('AsteroidToken');
const AsteroidFeatures = artifacts.require('AsteroidFeatures');
const AsteroidScans = artifacts.require('AsteroidScans');

module.exports = async function(deployer, network, accounts) {
  deployer.link(InfluenceSettings, AsteroidScans);
  deployer.link(Procedural, AsteroidScans);
  await deployer.deploy(AsteroidScans, AsteroidToken.address, AsteroidFeatures.address);
};
