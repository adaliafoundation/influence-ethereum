// Contracts
const CrewToken = artifacts.require('CrewToken');
const CrewNames = artifacts.require('CrewNames');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(CrewNames, CrewToken.address);
};
