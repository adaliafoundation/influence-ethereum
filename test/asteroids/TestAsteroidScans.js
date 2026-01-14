const AsteroidToken = artifacts.require('AsteroidToken');
const Planets = artifacts.require('Planets');
const AsteroidScans = artifacts.require('AsteroidScans');
const AsteroidFeatures = artifacts.require('AsteroidFeatures');
const AsteroidSale = artifacts.require('AsteroidSale');
const truffleAssert = require('truffle-assertions');
const utils = require('web3-utils');
const { send } = require('../helpers/blockchain');

contract('AsteroidScans', (accounts) => {
  let token, planets, scans, gen, sale;

  beforeEach('bootstrap test suite', async () => {
    token = await AsteroidToken.new('Influence Asteroids', 'INFA');
    planets = await Planets.new();
    gen = await AsteroidFeatures.new(planets.address);
    scans = await AsteroidScans.new(token.address, gen.address);
    sale = await AsteroidSale.new(token.address, gen.address, scans.address);
  });

  it('should allow scanning asteroids', async () => {
    let result, tx1, tx2, txt, id, price, scanOrder;
    let gasTotal = 0;
    let gasMax = 0;
    const samples = 100;

    await token.addManager(sale.address);
    await scans.addManager(sale.address);
    const startTime = (await web3.eth.getBlock('latest')).timestamp;
    await sale.setSaleParams(startTime, 86400, utils.toWei('0.0002'), utils.toWei('0.00001'));

    for (let i = 1; i <= samples; i++) {
      id = Math.ceil(Math.random() * 250000);
      price = await sale.getAsteroidPrice(id);
      await sale.buyAsteroid(id, { from: accounts[2], value: price });
      scanOrder = await scans.getScanOrder(id);
      assert.equal(scanOrder, i);
      tx1 = await scans.startScan(id, { from: accounts[2] });
      await send({ jsonrpc: '2.0', method: 'evm_mine', id: new Date().getTime() });
      tx2 = await scans.finalizeScan(id, { from: accounts[2] });
      result = await scans.retrieveScan(id);
      assert.ok((result & (1 << 0)) == 1);
      assert.ok(result >= 3, 'All early adopters should get at least Yield1');

      txt = tx1.receipt.gasUsed + tx2.receipt.gasUsed;
      gasTotal += txt;
      if (gasMax < txt) gasMax = txt;
    }

    // console.log('Gas used (avg):', gasTotal / samples);
    // console.log('Gas used (max):', gasMax);
  });

  it('should allow scanning later and retain the scan incentive order', async () => {
    let price;

    await token.addManager(sale.address);
    await scans.addManager(sale.address);
    const startTime = (await web3.eth.getBlock('latest')).timestamp;
    await sale.setSaleParams(startTime, 86400, utils.toWei('0.0002'), utils.toWei('0.00001'));
    price = await sale.getAsteroidPrice(2);
    await sale.buyAsteroid(2, { from: accounts[2], value: price });
    price = await sale.getAsteroidPrice(3);
    await sale.buyAsteroid(3, { from: accounts[2], value: price });
    assert.equal(await scans.getScanOrder(2), 1);
    assert.equal(await scans.getScanOrder(3), 2);
  });

  it('should require starting scan before finalizing', async () => {
    await token.addManager(sale.address);
    await scans.addManager(sale.address);
    const startTime = (await web3.eth.getBlock('latest')).timestamp;
    await sale.setSaleParams(startTime, 86400, utils.toWei('0.0002'), utils.toWei('0.00001'));
    const price = await sale.getAsteroidPrice(2);
    await sale.buyAsteroid(2, { from: accounts[2], value: price });
    await truffleAssert.reverts(scans.finalizeScan(2, { from: accounts[2] }));
  });

  it('should revert on the very next block after startScan', async () => {
    await token.addManager(accounts[1]);
    await token.mint(accounts[2], 2, { from: accounts[1] });
    await scans.startScan(2, { from: accounts[2] });
    await truffleAssert.reverts(scans.finalizeScan(2, { from: accounts[2] }));
  });

  it('should not allow a non-owner to scan', async () => {
    await token.addManager(accounts[1]);
    await token.mint(accounts[2], 2, { from: accounts[1] });
    await truffleAssert.reverts(scans.startScan(2, { from: accounts[3] }));
  });

  it('should not allow re-scanning an asteroid', async () => {
    await token.addManager(accounts[1]);
    await token.mint(accounts[2], 2, { from: accounts[1] });
    await scans.startScan(2, { from: accounts[2] });
    await truffleAssert.reverts(scans.startScan(2, { from: accounts[2] }));
    await send({ jsonrpc: '2.0', method: 'evm_mine', id: new Date().getTime() });
    await scans.finalizeScan(2, { from: accounts[2] });
    await truffleAssert.reverts(scans.startScan(2, { from: accounts[2] }));
  });

  it('should allow pre-scanning asteroids', async () => {
    await scans.addManager(accounts[0]);
    const ids = [ 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
    const bonuses = [ 3, 6, 8, 123, 47, 31, 94, 12, 67 ];
    const mods = [ 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000 ];
    const tx = await scans.setInitialBonuses(ids, bonuses, mods);
    // console.log('Gas used:', tx.receipt.gasUsed);

    for (let i = 0; i < ids.length; i++) {
      assert.equal(await scans.retrieveScan(ids[i]), bonuses[i]);
    }
  });

  it('should not allow pre-scanning after the first sale purchase', async () => {
    await token.addManager(sale.address);
    await scans.addManager(sale.address);
    const startTime = (await web3.eth.getBlock('latest')).timestamp;
    await sale.setSaleParams(startTime, 86400, utils.toWei('0.0002'), utils.toWei('0.00001'));
    const price = await sale.getAsteroidPrice(2);
    await sale.buyAsteroid(2, { from: accounts[2], value: price });
    await scans.startScan(2, { from: accounts[2] });
    await send({ jsonrpc: '2.0', method: 'evm_mine', id: new Date().getTime() });
    await scans.finalizeScan(2, { from: accounts[2] });
    await truffleAssert.reverts(scans.setInitialBonuses([2, 3], [4, 5], [ 1000, 2000 ]));
  });

  it('should not allow pre-scanning with different length args', async () => {
    await truffleAssert.reverts(scans.setInitialBonuses([2, 3, 4], [4, 5], [ 1000 ]));
  });
});
