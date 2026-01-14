const AsteroidToken = artifacts.require('AsteroidToken');
const Planets = artifacts.require('Planets');
const AsteroidSale = artifacts.require('AsteroidSale');
const AsteroidFeatures = artifacts.require('AsteroidFeatures');
const AsteroidScans = artifacts.require('AsteroidScans');
const truffleAssert = require('truffle-assertions');
const utils = require('web3-utils');

contract('AsteroidSale', (accounts) => {
  let asteroid, planets, sale, scans, gen;

  beforeEach('bootstrap test suite', async () => {
    asteroid = await AsteroidToken.new('Influence Asteroids', 'INFA');
    planets = await Planets.new();
    gen = await AsteroidFeatures.new(planets.address);
    scans = await AsteroidScans.new(asteroid.address, gen.address);
    sale = await AsteroidSale.new(asteroid.address, gen.address, scans.address);
  });

  it('should allow the initial sale parameters to be set', async () => {
    let startTime, duration, asteroidPrice, lotPrice, result;

    startTime = (await web3.eth.getBlock('latest')).timestamp + 7200;
    duration = 30 * 24 * 60 * 60;
    asteroidPrice = utils.toWei('0.0002');
    lotPrice = utils.toWei('0.00001');
    await sale.setSaleParams(startTime, duration, asteroidPrice, lotPrice);

    // Check for accurate start time
    result = await sale.saleStartTime();
    assert.equal(result.toNumber(), startTime);

    // Check for accurate end time
    result = await sale.saleEndTime();
    assert.equal(result.toNumber(), startTime + duration);

    // Check for accurate base price
    result = await sale.baseAsteroidPrice();
    assert.equal(asteroidPrice, Number(result));

    // Check for accurate base lot price
    result = await sale.baseLotPrice();
    assert.equal(lotPrice, Number(lotPrice));
  });

  it('should prevent creating a sale for less than a day', async () => {
    const startTime = (await web3.eth.getBlock('latest')).timestamp + 7200;
    await truffleAssert.reverts(sale.setSaleParams(startTime, 60, utils.toWei('1'), utils.toWei('1')));
  });

  it('should not allow the start time to be in the past', async () => {
    const startTime = (await web3.eth.getBlock('latest')).timestamp - 300;
    await truffleAssert.reverts(sale.setSaleParams(startTime, 86400, utils.toWei('1'), utils.toWei('1')));
  });

  it('should be able to cancel a sale', async () => {
    const startTime = (await web3.eth.getBlock('latest')).timestamp + 7200;
    await sale.setSaleParams(startTime, 86400, utils.toWei('1'), utils.toWei('1'));
    await sale.cancelSale();

    assert.equal(await sale.saleStartTime(), 0);
  });

  it('should fail to return a price when base price unset', async () => {
    await truffleAssert.reverts(sale.getAsteroidPrice(1));
  });

  it('should return the price for the asteroid', async () => {
    let id, startTime, basePrice, lotPrice, price, seed, radius, result;

    for (let i = 0; i < 10; i++) {
      id = Math.ceil(Math.random() * 250000);

      // Calculate price
      startTime = (await web3.eth.getBlock('latest')).timestamp + 7200;
      basePrice = utils.toWei('0.0002');
      lotPrice = utils.toWei('0.00001');
      await sale.setSaleParams(startTime, 86400, basePrice, lotPrice);
      price = await sale.getAsteroidPrice(id);

      // Now do it manually]
      radius = await gen.getRadius(id);
      result = 0.0002 + 0.00001 * Math.floor((radius.toNumber() * radius.toNumber()) / 250000);
      assert.equal(Number(result.toFixed(5)), Number(utils.fromWei(price)));
      await sale.cancelSale();
    }
  });

  it('should not be able to purchase an asteroid before sale start', async () => {
    let startTime, price;

    await asteroid.addManager(sale.address);
    await scans.addManager(sale.address);
    startTime = (await web3.eth.getBlock('latest')).timestamp + 1000;
    await sale.setSaleParams(startTime, 86400, utils.toWei('0.0002'), utils.toWei('0.00001'));
    price = await sale.getAsteroidPrice(250000);
    await truffleAssert.reverts(sale.buyAsteroid(250000, { from: accounts[1], value: price }));
  });

  it('should be able to purchase an asteroid', async () => {
    let startTime, price, tx;

    await asteroid.addManager(sale.address);
    await scans.addManager(sale.address);
    startTime = (await web3.eth.getBlock('latest')).timestamp;
    await sale.setSaleParams(startTime, 86400, utils.toWei('0.0002'), utils.toWei('0.00001'));
    price = await sale.getAsteroidPrice(250000);
    tx = await sale.buyAsteroid(250000, { from: accounts[1], value: price });
    // console.log('Gas used:', tx.receipt.gasUsed);
    assert.equal(await asteroid.ownerOf(250000), accounts[1]);
    assert.equal(await web3.eth.getBalance(sale.address), price);
  });

  it('should reject a sale if incorrect funds are sent', async () => {
    const startTime = (await web3.eth.getBlock('latest')).timestamp + 7200;
    await sale.setSaleParams(startTime, 86400, utils.toWei('0.0002'), utils.toWei('0.00001'));
    await truffleAssert.reverts(sale.buyAsteroid(2, { from: accounts[1], value: utils.toWei('1')}));
  });

  it('should allow withdraw of ether balance', async () => {
    let startTime, price;

    await asteroid.addManager(sale.address);
    await scans.addManager(sale.address);
    startTime = (await web3.eth.getBlock('latest')).timestamp;
    await sale.setSaleParams(startTime, 86400, utils.toWei('0.0002'), utils.toWei('0.00001'));
    price = await sale.getAsteroidPrice(2);
    await sale.buyAsteroid(2, { from: accounts[1], value: price });
    await sale.withdraw({ from: accounts[0] });
    assert.equal(await web3.eth.getBalance(sale.address), 0);
  });

  it('should only allow withdraw from owner', async () => {
    await truffleAssert.reverts(sale.withdraw({ from: accounts[1] }));
  });
});
