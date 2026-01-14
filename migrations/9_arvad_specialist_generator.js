// Contracts
const ArvadSpecialistGenerator = artifacts.require('ArvadSpecialistGenerator');
const Procedural = artifacts.require('Procedural');
const InfluenceSettings = artifacts.require('InfluenceSettings');

module.exports = async function(deployer, network, accounts) {
  deployer.link(InfluenceSettings, ArvadSpecialistGenerator);
  deployer.link(Procedural, ArvadSpecialistGenerator);
  await deployer.deploy(ArvadSpecialistGenerator);
};
