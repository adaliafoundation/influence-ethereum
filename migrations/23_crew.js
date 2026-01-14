const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const Crew = artifacts.require('Crew');

module.exports = async function(deployer, network, accounts) {
  await deployProxy(
    Crew,
    ['Influence Crew', 'INFCRW'],
    { deployer, initializer: 'initialize' }
  );
};
