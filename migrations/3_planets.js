// Contracts
const Planets = artifacts.require('Planets');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(Planets);
};
