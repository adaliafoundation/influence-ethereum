const ArvadSpecialistGenerator = require('../../../build/contracts/ArvadSpecialistGenerator.json');
const ArvadCitizenGenerator = require('../../../build/contracts/ArvadCitizenGenerator.json');
const web3 = require('./web3');

const { env: {
  CONTRACT_ARVAD_SPECIALIST_GENERATOR,
  CONTRACT_ARVAD_CITIZEN_GENERATOR } } = process;

const arvadSpecialistGenerator = new web3.eth.Contract(ArvadSpecialistGenerator.abi, CONTRACT_ARVAD_SPECIALIST_GENERATOR);
const arvadCitizenGenerator = new web3.eth.Contract(ArvadCitizenGenerator.abi, CONTRACT_ARVAD_CITIZEN_GENERATOR);

const getRandomFeatures = async function ({ collection, size }) {
  if (!CONTRACT_ARVAD_SPECIALIST_GENERATOR || !CONTRACT_ARVAD_CITIZEN_GENERATOR) {
    done(new Error('Missing CONTRACT_ARVAD_SPECIALIST_GENERATOR, CONTRACT_ARVAD_CITIZEN_GENERATOR'));
  }

  let features;
  const id = Math.ceil(Math.random() * 250000);
  const mods = {
    4: 2500, // huge
    3: 2490, // large
    2: 2320, // medium
    1: 500 // small
  };

  if (collection === 1) {
    features = BigInt(await arvadSpecialistGenerator.methods.getFeatures(id, mods[size]).call()) + 1n;
  } else if (collection === 2) {
    features = BigInt(await arvadCitizenGenerator.methods.getFeatures(id, mods[size]).call()) + 2n;
  }

  return features;
};

module.exports = {
  getRandomFeatures
};
