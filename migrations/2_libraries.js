const ABDKMath64x64 = artifacts.require('abdk-libraries-solidity/ABDKMath64x64.sol');
const Procedural = artifacts.require('Procedural');
const InfluenceSettings = artifacts.require('InfluenceSettings');

module.exports = function(deployer, network, accounts) {
  // Deploy fixed point math lib
  deployer.deploy(ABDKMath64x64);

  // Deploy and link Procedural
  deployer.link(ABDKMath64x64, Procedural);
  deployer.deploy(Procedural);

  // Deploy remaining libs
  deployer.deploy(InfluenceSettings);
};
