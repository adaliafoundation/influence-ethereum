require('dotenv').config({ silent: true });

const AsteroidToken = artifacts.require('AsteroidToken');
const AsteroidScans = artifacts.require('AsteroidScans');

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

// Start from settings (purchaseOrder)
const startFromMint = 1;
const startFromScan = 1;

module.exports = async function() {
  const data = require('../tmp/asteroid_snapshot.json');

  const astToken = await AsteroidToken.deployed();
  const astScans = await AsteroidScans.deployed();

  console.log('setting deployer as manager for token');
  const isTokenManager = await astToken.isManager(deployer);
  if (!isTokenManager) await astToken.addManager(deployer);

  console.log('setting deployer as manager for scans');
  const isScanManager = await astScans.isManager(deployer);
  if (!isScanManager) await astScans.addManager(deployer);

  let nonce = await web3.eth.getTransactionCount(deployer);

  // Mint the asteroids
  for ({ i, owner, purchaseOrder } of data) {
    if (purchaseOrder >= startFromMint) {
      const currentOwner = await astToken.ownerOf(i);

      if (currentOwner == 0n) {
        console.log(`minting #${purchaseOrder}: ${i} to ${owner}...`);
        astToken.mint(owner, i, { from: deployer });
        nonce++;
        await timeout(2000);
      }
    }
  }

  // Write scan results
  const chunks = chunk(data.filter(v => !!v.owner && v.i >= startFromScan), 50);

  for (c of chunks) {
    const ids = c.map(v => v.i);
    const bonuses = c.map(v => v.bonuses);
    const scanOrders = c.map(v => v.purchaseOrder);
    console.log(`setting bonuses for chunk starting with ${ids[0]}`);
    astScans.setInitialBonuses(ids, bonuses, scanOrders, { from: deployer });
    nonce++;
    await timeout(10000);
  }
}
