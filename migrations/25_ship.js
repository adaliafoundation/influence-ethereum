const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const Ship = artifacts.require('Ship');

module.exports = async function(deployer, network, accounts) {
  await deployProxy(
    Ship,
    ['Influence Ship', 'INFSHP'],
    { deployer, initializer: 'initialize' }
  );
};
