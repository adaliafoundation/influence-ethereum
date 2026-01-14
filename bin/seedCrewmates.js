require('dotenv').config({ silent: true });

const CrewToken = artifacts.require('CrewToken');
const CrewFeatures = artifacts.require('CrewFeatures');

const logger = console;
const deployer = process.env.DEPLOY_ADDRESS || accounts[0];
console.log('Migrating with', deployer);

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function chunk(a, size) {
  let chunks = [];

  for (let i = 0; i < a.length; i += size) {
    chunks.push(a.slice(i, i + size));
  }

  return chunks;
}

// Start from settings
const startFromMint = 0;
const startFromFeatures = 0;

module.exports = async function() {
  const asteroidData = require('../tmp/asteroid_snapshot.json');

  // Calculate modifier for minted crewmates
  const asteroidsWithCrew = asteroidData.filter(a => !!a.mintedCrewId);
  const crewmateMods = {};

  asteroidsWithCrew.forEach(a => {
    crewmateMods[a.mintedCrewId] = (250000n - BigInt(a.i)) * (250000n - BigInt(a.i)) / 25000000n;
  });

  const data = require('../tmp/crewmate_snapshot.json');

  const crewToken = await CrewToken.deployed();
  const features = await CrewFeatures.deployed();

  console.log('setting deployer as manager for token');
  const isTokenManager = await crewToken.isManager(deployer);
  if (!isTokenManager) await crewToken.addManager(deployer);

  console.log('setting deployer as manager for features');
  const isScanManager = await features.isManager(deployer);
  if (!isScanManager) await features.addManager(deployer);

  let nonce = await web3.eth.getTransactionCount(deployer);

  // Mint the crewmates
  for ({ i, owner } of data) {
    if (i >= startFromMint) {
      const currentOwner = await crewToken.ownerOf(i);

      if (currentOwner == 0n) {
        console.log(`minting #${i} to ${owner}...`);
        crewToken.mint(owner, { from: deployer });
        nonce++;
        await timeout(2000);
      }
    }
  }

  // Write features
  const chunks = chunk(data, 50);

  for (c of chunks) {
    const ids = c.map(v => v.i);

    if (ids[0] >= startFromFeatures) {
      const collections = c.map(v => v.collection);
      const mods = c.map(v => v.mod ? v.mod : crewmateMods[v.i]);
      console.log(`setting crewmate init data for chunk starting with ${ids[0]}`);
      console.log(ids, collections, mods);

      try {
        await features.setInitialTokens(ids, collections, mods, { from: deployer });
        nonce++;
      } catch (e) {
        console.log(e);
      }

      await timeout(10000);
    }
  }
}
