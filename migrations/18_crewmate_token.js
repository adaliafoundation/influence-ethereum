const { deployProxy } = require('@openzeppelin/truffle-upgrades');
// Contracts
const CrewmateToken = artifacts.require('CrewmateToken');

module.exports = async function(deployer, network, accounts) {
  await deployProxy(
    CrewmateToken,
    ['Influence Crewmates', 'INFCRM'],
    { deployer, initializer: 'initialize' }
  );
};
