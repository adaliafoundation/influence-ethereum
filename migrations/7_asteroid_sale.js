// Contracts
const AsteroidToken = artifacts.require('AsteroidToken');
const AsteroidFeatures = artifacts.require('AsteroidFeatures');
const AsteroidSale = artifacts.require('AsteroidSale');
const AsteroidScans = artifacts.require('AsteroidScans');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(AsteroidSale, AsteroidToken.address, AsteroidFeatures.address, AsteroidScans.address);
};
