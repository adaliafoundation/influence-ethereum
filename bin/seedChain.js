require('dotenv').config({ silent: true });

const AsteroidToken = artifacts.require('AsteroidToken');
const AsteroidScans = artifacts.require('AsteroidScans');
const ArvadCrewSale = artifacts.require('ArvadCrewSale');

const getRandAccount = function() {
  return Math.ceil(Math.random() * 9);
};

let seedTally = process.env.QUICK_MIGRATE ? 18 : 1859;
let ownershipChance = process.env.QUICK_MIGRATE ? 0.75 : 0.05;

module.exports = async function(callback) {
  let asteroidId, accountId, scanningId, scanningOwner;

  const accounts = await web3.eth.getAccounts();

  const astToken = await AsteroidToken.deployed();
  const astScans = await AsteroidScans.deployed();

  // Add main account as manager to bootstrap without spinning up sales
  await astToken.addManager(accounts[0]);
  await astScans.addManager(accounts[0]);

  // Send Adalia Prime to primary account
  await astToken.mint(accounts[0], 1);
  await astScans.setInitialBonuses([ 1 ], [ 1 ]);

  // Purchase, scan and finalize scans for 1,859 asteroids
  for (let i = 0; i < seedTally; i++) {
    try {
      asteroidId = i * 100 + 20;
      accountId = getRandAccount();
      await astToken.mint(accounts[accountId], asteroidId);
      await astScans.recordScanOrder(asteroidId);
      console.log(`Minted asteroidId: ${asteroidId} to ${accountId}`);

      if (i % 5 === 0) {
        if (scanningId) {
          scanningOwner = await astToken.ownerOf(scanningId);
          await astScans.finalizeScan(scanningId, { from: scanningOwner });
          console.log(`Finalized scan for ${scanningId}`);
        }

        scanningId = asteroidId;
        await astScans.startScan(scanningId, { from: accounts[accountId] });
        console.log(`Started scan for ${scanningId}`);
      }
    } catch (e) {/* no-op */}
  }

  // Transfer some of the asteroids to the test address
  for (let i = 0; i < seedTally; i++) {
    if (process.env.TEST_ADDRESS && Math.random() < ownershipChance) {
      asteroidId = i * 100 + 20;
      const sender = await astToken.ownerOf(asteroidId);
      try {
        await astToken.safeTransferFrom(sender, process.env.TEST_ADDRESS, asteroidId, { from: sender });
        console.log(`Transferring asteroid ${asteroidId} to ${process.env.TEST_ADDRESS}`);
      } catch (e) {/* no-op */}
    }
  }

  // Finish the last scan
  if (scanningId) {
    scanningOwner = await astToken.ownerOf(scanningId);
    console.log(`Finishing last scan (#${scanningId} for ${scanningOwner})`);
    if (scanningOwner) {
      await astScans.finalizeScan(scanningId, { from: scanningOwner });
    }
  }

  // Create a new sale and end after 10 purchases
  const sale2 = await ArvadCrewSale.deployed();
  await sale2.createSale(
    Math.floor(Date.now() / 1000) + 60,
    web3.utils.toWei('0.001'),
    web3.utils.toWei('0.0001'),
    seedTally,
    seedTally + 10
  );

  console.log(`Created new ArvadCrewSale`);

  // If a test address is defined, transfer some Ether to it
  if (process.env.TEST_ADDRESS) {
    await web3.eth.sendTransaction({
      from: accounts[0],
      to: process.env.TEST_ADDRESS,
      value: web3.utils.toWei('10')
    }, { from: accounts[0] });
  }

  console.log(`Transferred ETH to ${process.env.TEST_ADDRESS}`);

  callback();
};
