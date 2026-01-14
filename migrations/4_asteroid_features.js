// Libraries to link
const ABDKMath64x64 = artifacts.require('abdk-libraries-solidity/ABDKMath64x64.sol');
const Procedural = artifacts.require('Procedural');
const InfluenceSettings = artifacts.require('InfluenceSettings');

// Contracts
const Planets = artifacts.require('Planets');
const AsteroidFeatures = artifacts.require('AsteroidFeatures');

module.exports = async function(deployer, network, accounts) {
  deployer.link(InfluenceSettings, AsteroidFeatures);
  deployer.link(Procedural, AsteroidFeatures);
  deployer.link(ABDKMath64x64, AsteroidFeatures);
  await deployer.deploy(AsteroidFeatures, Planets.address);
};
