// Contracts
const SwayToken = artifacts.require('SwayToken');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(SwayToken);
};
