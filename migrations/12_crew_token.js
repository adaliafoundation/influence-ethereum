// Contracts
const CrewToken = artifacts.require('CrewToken');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(CrewToken, 'Influence Crew', 'INFC');
};
