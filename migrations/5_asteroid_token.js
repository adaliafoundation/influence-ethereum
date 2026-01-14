// Libraries to link
const InfluenceSettings = artifacts.require('InfluenceSettings');

// Contracts
const AsteroidToken = artifacts.require('AsteroidToken');

module.exports = async function(deployer, network, accounts) {
  deployer.link(InfluenceSettings, AsteroidToken);
  await deployer.deploy(AsteroidToken, 'Influence Asteroids', 'INFA');
};
