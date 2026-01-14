const { upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const SwayGovernor = artifacts.require('SwayGovernor');

module.exports = async function (deployer) {
  const existing = await SwayGovernor.deployed();
  await upgradeProxy(existing.address, SwayGovernor, { deployer });
};