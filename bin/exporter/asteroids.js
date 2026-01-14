require('dotenv').config({ silent: true });
const { promises: fsPromises } = require('fs');
const { contracts } = require('influence-utils');
const web3 = require('./lib/web3');
const { getRandomFeatures } = require('./lib/utils');

const ASTEROID_COUNT = 250000;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const { env: {
  CONTRACT_ASTEROID_NAMES,
  CONTRACT_ASTEROID_TOKEN,
  CONTRACT_ARVAD_CREW_SALE,
  CONTRACT_ASTEROID_SCANS } } = process;

const BASE_EXPORT_PATH = './build';
const ASTEROIDS_OUTPUT_FILE_NAME = 'asteroids.json';
const CREW_FEATURES_OUTPUT_FILE_NAME = 'crew_credit_features.json';

const done = function (error) {
  if (error) console.error(error);
  console.info('Done');
  process.exit();
}

if (!CONTRACT_ASTEROID_TOKEN || !CONTRACT_ASTEROID_NAMES || !CONTRACT_ARVAD_CREW_SALE || !CONTRACT_ASTEROID_SCANS) {
  done(new Error(`Missing CONTRACT_ASTEROID_TOKEN, CONTRACT_ASTEROID_NAMES, CONTRACT_ARVAD_CREW_SALE or CONTRACT_ASTEROID_SCANS`));
}

const asteroidToken = new web3.eth.Contract(contracts.AsteroidToken, CONTRACT_ASTEROID_TOKEN);
const asteroidName = new web3.eth.Contract(contracts.AsteroidNames, CONTRACT_ASTEROID_NAMES);
const asteroidSans = new web3.eth.Contract(contracts.AsteroidScans, CONTRACT_ASTEROID_SCANS)
const arvadCrewSale = new web3.eth.Contract(contracts.ArvadCrewSale, CONTRACT_ARVAD_CREW_SALE)

const hasUsedAsteroid = async function ({ asteroidId }) {
  const events = await arvadCrewSale.getPastEvents('AsteroidUsed', {
    fromBlock: 'earliest',
    toBlock: 'latest',
    filter: { asteroidId }
  });
  return events.length !== 0;
}

const getCrewCollection = async function ({ asteroidId }) {
  const result = await asteroidSans.methods.getScanOrder(asteroidId).call();
  if (result >= 1 && result <= 1859) return 1;
  if (result >= 1860 && result <= 11100) return 2;
  return 0;
}

const getAsteroidSize = function ({ asteroidId }) {
  if (asteroidId >= 1 && asteroidId <= 69) return 4; // Huge
  if (asteroidId >= 70 && asteroidId <= 479) return 3; // Large
  if (asteroidId >= 480 && asteroidId <= 8868) return 2; // Medium
  if (asteroidId >= 8869 && asteroidId <= 250000) return 1; // Small
  throw new Error(`Invalid asteroidId ${asteroidId}`);
}

const main = async function () {
  const asteroidsPath = `${BASE_EXPORT_PATH}/${ASTEROIDS_OUTPUT_FILE_NAME}`;
  const crewFeaturesPath = `${BASE_EXPORT_PATH}/${CREW_FEATURES_OUTPUT_FILE_NAME}`;
  const asteroidData = [];
  const featuresData = {};

  // init output files
  await Promise.all([
    fsPromises.writeFile(asteroidsPath, ''),
    fsPromises.writeFile(crewFeaturesPath, '')
  ]);

  for (let i=1; i<=ASTEROID_COUNT; i++) {
    const data = {};
    console.info(`checking token ${i}...`);
    const result = await asteroidToken.methods.ownerOf(i).call();
    if (result !== ZERO_ADDRESS) {
      Object.assign(data, { tokenId: i });

      // get the name
      const name = await asteroidName.methods.getName(i).call();
      if (name) Object.assign(data, { name });

      // check for available crewmate credit
      const asteroidUsed = await hasUsedAsteroid({ asteroidId: i });

      if (!asteroidUsed) {
        const collection = await getCrewCollection({ asteroidId: i });
        const size = getAsteroidSize({ asteroidId: i });
        if (collection > 0) {
          Object.assign(data, { crewCredit: true, collection, size });

          // create random crew features based on collection and size
          const key = `${size}_${collection}`;
          if (!featuresData[key]) featuresData[key] = [];
          const features = await getRandomFeatures({ collection, size });
          featuresData[key].push(features.toString());
        }
      }

      asteroidData.push(data);
    }
  }

  await fsPromises.appendFile(asteroidsPath, JSON.stringify(asteroidData));
  await fsPromises.appendFile(crewFeaturesPath, JSON.stringify(featuresData));
};

main()
.then(() => done())
.catch(done);
