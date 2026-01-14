// Contracts
const CrewFeatures = artifacts.require('CrewFeatures');
const ArvadSpecialistGenerator = artifacts.require('ArvadSpecialistGenerator');
const ArvadCitizenGenerator = artifacts.require('ArvadCitizenGenerator');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(CrewFeatures);
  const crewFeatures = await CrewFeatures.deployed();
  await crewFeatures.setGenerator(1, ArvadSpecialistGenerator.address);
  console.log('Added ArvadSpecialistGenerator to CrewFeatures');
  const citizenGenerator = await ArvadCitizenGenerator.deployed();
  citizenGenerator.addManager(CrewFeatures.address);
  await crewFeatures.setGenerator(2, ArvadCitizenGenerator.address);
  console.log('Added ArvadCitizenGenerator to CrewFeatures');
};
