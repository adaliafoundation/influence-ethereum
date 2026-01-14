require('dotenv').config({ silent: true });
const { promises: fsPromises } = require('fs');
const { getRandomFeatures } = require('./lib/utils');

const BASE_EXPORT_PATH = `${process.cwd()}/build`;
const ASTEROIDS_OUTPUT_FILE_NAME = 'asteroids.json';
const CREW_FEATURES_OUTPUT_FILE_NAME = 'crew_credit_features.json';

const done = function (error) {
  if (error) console.error(error);
  console.info('Done');
  process.exit();
}

const main = async function () {
  const asteroidsExportPath = `${BASE_EXPORT_PATH}/${ASTEROIDS_OUTPUT_FILE_NAME}`;
  const crewFeaturesExportPath = `${BASE_EXPORT_PATH}/${CREW_FEATURES_OUTPUT_FILE_NAME}`;
  const featuresData = {};
  let asteroidExportData;

  try {
    asteroidExportData = require(asteroidsExportPath);
  } catch (error) {
    done(error);
  }

  for (const { crewCredit, size, collection, tokenId } of asteroidExportData) {
    if (!crewCredit) continue;
    console.info(`getting features for tokenId [${tokenId}], ${size} ${collection}`);
    const key = `${size}_${collection}`;
    if (!featuresData[key]) featuresData[key] = [];
    const features = await getRandomFeatures({ collection, size });
    featuresData[key].push(features.toString());
  }

  await fsPromises.writeFile(crewFeaturesExportPath, JSON.stringify(featuresData));
};

main()
.then(() => done())
.catch(done);
