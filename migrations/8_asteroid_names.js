// Contracts
const AsteroidToken = artifacts.require('AsteroidToken');
const AsteroidNames = artifacts.require('AsteroidNames');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(AsteroidNames, AsteroidToken.address);
};
