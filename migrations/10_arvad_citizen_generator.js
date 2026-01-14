// Contracts
const ArvadCitizenGenerator = artifacts.require('ArvadCitizenGenerator');
const Procedural = artifacts.require('Procedural');
const InfluenceSettings = artifacts.require('InfluenceSettings');

module.exports = async function(deployer, network, accounts) {
  deployer.link(InfluenceSettings, ArvadCitizenGenerator);
  deployer.link(Procedural, ArvadCitizenGenerator);
  await deployer.deploy(ArvadCitizenGenerator);
};
