// Contracts
const ArvadLeadersGenerator = artifacts.require('ArvadLeadersGenerator');
const CrewFeatures = artifacts.require('CrewFeatures');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(ArvadLeadersGenerator);
  const crewFeatures = await CrewFeatures.deployed();
  await crewFeatures.setGenerator(3, ArvadLeadersGenerator.address);
  console.log('Added ArvadLeadersGenerator to CrewFeatures');
};
