require('dotenv').config({ silent: true });
const { promises: fsPromises } = require('fs');
const { contracts } = require('influence-utils');
const web3 = require('./lib/web3');

const CREW_MAX_COUNT = 1356;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const { env: { CONTRACT_CREW_TOKEN, CONTRACT_CREW_NAMES, CONTRACT_CREW_FEATURES } } = process;

const BASE_EXPORT_PATH = './build';
const CREW_OUTPUT_FILE_NAME = 'crew.json';

const done = function (error) {
  if (error) console.error(error);
  console.info('Done');
  process.exit();
}

if (!CONTRACT_CREW_TOKEN || !CONTRACT_CREW_NAMES || !CONTRACT_CREW_FEATURES) {
  done(new Error(`Missing CONTRACT_CREW_TOKEN or CONTRACT_CREW_NAMES OR CONTRACT_CREW_FEATURES`));
}

const crewToken = new web3.eth.Contract(contracts.CrewToken, CONTRACT_CREW_TOKEN);
const crewName = new web3.eth.Contract(contracts.CrewNames, CONTRACT_CREW_NAMES);
const crewFeatures = new web3.eth.Contract(contracts.CrewFeatures, CONTRACT_CREW_FEATURES);

const main = async function () {
  const path = `${BASE_EXPORT_PATH}/${CREW_OUTPUT_FILE_NAME}`;
  const results = [];
  await fsPromises.writeFile(path, '');
  for (let i=1; i<=CREW_MAX_COUNT; i++) {
    const data = {};
    console.info(`checking token ${i}...`);
    const result = await crewToken.methods.ownerOf(i).call();
    if (result !== ZERO_ADDRESS) {
      Object.assign(data, { tokenId: i });

      // get the name
      const name = await crewName.methods.getName(i).call();
      if (name) Object.assign(data, { name });

      const features = await crewFeatures.methods.getFeatures(i).call();
      Object.assign(data, { features: features.toString() });

      results.push(data);
    }
  }
  await fsPromises.appendFile(path, JSON.stringify(results));
};

main()
.then(() => done())
.catch(done);
