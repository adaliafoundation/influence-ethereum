const ArvadCrewSale = artifacts.require('ArvadCrewSale');
const AsteroidToken = artifacts.require('AsteroidToken');
const Planets = artifacts.require('Planets');
const AsteroidFeatures = artifacts.require('AsteroidFeatures');
const AsteroidScans = artifacts.require('AsteroidScans');
const CrewToken = artifacts.require('CrewToken');
const CrewFeatures = artifacts.require('CrewFeatures');
const SpecialistGenerator = artifacts.require('ArvadSpecialistGenerator');
const CitizenGenerator = artifacts.require('ArvadCitizenGenerator');
const truffleAssert = require('truffle-assertions');
const utils = require('web3-utils');

contract('ArvadCrewSale', (accounts) => {
  let asteroids, planets, astFeatures, scans, crew, crewFeatures, specialistGen, citizenGen, sale;

  // Helper to create a valid sale
  const createSale = async () => {
    await asteroids.addManager(sale.address);
    await scans.addManager(sale.address);
    await crew.addManager(sale.address);
    await crewFeatures.addManager(sale.address);
    await crewFeatures.setGenerator(1, specialistGen.address);
    await crewFeatures.setGenerator(2, citizenGen.address);
    await citizenGen.addManager(crewFeatures.address);
    const startTime = (await web3.eth.getBlock('latest')).timestamp;
    await sale.createSale(startTime, utils.toWei('0.0002'), utils.toWei('0.00001'), 5, 10);
  };

  beforeEach('bootstrap test suite', async () => {
    asteroids = await AsteroidToken.new('Influence Asteroids', 'INFA');
    planets = await Planets.new();
    astFeatures = await AsteroidFeatures.new(planets.address);
    scans = await AsteroidScans.new(asteroids.address, astFeatures.address);
    crew = await CrewToken.new('Influence Crew', 'INFC');
    crewFeatures = await CrewFeatures.new();
    specialistGen = await SpecialistGenerator.new();
    citizenGen = await CitizenGenerator.new();
    sale = await ArvadCrewSale.new(
      asteroids.address,
      astFeatures.address,
      scans.address,
      crew.address,
      crewFeatures.address
    );
  });

  it('should only allow withdraw from owner', async () => {
    await truffleAssert.reverts(sale.withdraw({ from: accounts[1] }));
  });

  it('should allow the initial sale parameters to be set', async () => {
    let result;

    const startTime = (await web3.eth.getBlock('latest')).timestamp + 7200;
    const asteroidPrice = utils.toWei('0.0002');
    const lotPrice = utils.toWei('0.00001');
    const startCount = 1;
    const endCount = 10;
    const receipt = await sale.createSale(startTime, asteroidPrice, lotPrice, startCount, endCount);

    // Check for accurate start time
    result = await sale.saleStartTime();
    assert.equal(result.toNumber(), startTime);

    // Check for accurate base price
    result = await sale.baseAsteroidPrice();
    assert.equal(result.toNumber(), Number(asteroidPrice));

    // Check for accurate base lot price
    result = await sale.baseLotPrice();
    assert.equal(result.toNumber(), Number(lotPrice));

    // Check for accurate start count
    result = await sale.startScanCount();
    assert.equal(result.toNumber(), startCount);

    // Check for accurate start count
    result = await sale.endScanCount();
    assert.equal(result.toNumber(), endCount);

    // Check that the SaleCreated event is correct
    truffleAssert.eventEmitted(receipt, 'SaleCreated', (e) => {
      return e.start.toNumber() === startTime &&
        e.asteroidPrice.toString() === asteroidPrice &&
        e.lotPrice.toString() === lotPrice;
    });
  });

  it('should allow for cancelling a sale', async () => {
    let result;

    const startTime = (await web3.eth.getBlock('latest')).timestamp + 7200;
    const asteroidPrice = utils.toWei('0.0002');
    const lotPrice = utils.toWei('0.00001');
    await sale.createSale(startTime, asteroidPrice, lotPrice, 1, 10);
    const receipt = await sale.cancelSale();

    // Check for accurate start time
    result = await sale.saleStartTime();
    assert.equal(result.toNumber(), 0);

    // Check for accurate base price
    result = await sale.baseAsteroidPrice();
    assert.equal(Number(result), 0);

    // Check for accurate base lot price
    result = await sale.baseLotPrice();
    assert.equal(Number(result), 0);

    truffleAssert.eventEmitted(receipt, 'SaleCancelled', (e) => {
      return e.start.toNumber() === startTime;
    });
  });

  it('should fail to return a price when base price unset', async () => {
    await truffleAssert.reverts(sale.getAsteroidPrice(1));
  });

  it('should return the price for the asteroid', async () => {
    let id, startTime, basePrice, lotPrice, price, radius, result;

    for (let i = 0; i < 10; i++) {
      id = Math.ceil(Math.random() * 250000);

      // Calculate price
      startTime = (await web3.eth.getBlock('latest')).timestamp + 7200;
      basePrice = utils.toWei('0.0002');
      lotPrice = utils.toWei('0.00001');
      await sale.createSale(startTime, basePrice, lotPrice, 1, 10);
      price = await sale.getAsteroidPrice(id);

      // Now do it manually
      radius = await astFeatures.getRadius(id);
      result = 0.0002 + 0.00001 * Math.floor((radius.toNumber() * radius.toNumber()) / 250000);
      assert.equal(Number(result.toFixed(5)), Number(utils.fromWei(price)));
      await sale.cancelSale();
    }
  });

  it('should not be able to purchase an asteroid before sale start', async () => {
    await asteroids.addManager(sale.address);
    await scans.addManager(sale.address);
    const startTime = (await web3.eth.getBlock('latest')).timestamp + 1000;
    await sale.createSale(startTime, utils.toWei('0.0002'), utils.toWei('0.00001'), 1, 10);
    const price = await sale.getAsteroidPrice(250000);
    await truffleAssert.reverts(sale.buyAsteroid(250000, { from: accounts[1], value: price }));
  });

  it('should reject a sale if incorrect funds are sent', async () => {
    const startTime = (await web3.eth.getBlock('latest')).timestamp;
    await sale.createSale(startTime, utils.toWei('0.0002'), utils.toWei('0.00001'), 1, 10);
    await truffleAssert.reverts(sale.buyAsteroid(2, { from: accounts[1], value: utils.toWei('1')}));
  });

  it('should allow purchasing an asteroid', async () => {
    await createSale();
    const price = await sale.getAsteroidPrice(250000);
    const tx = await sale.buyAsteroid(250000, { from: accounts[1], value: price });
    // console.log('Gas used:', tx.receipt.gasUsed);
    assert.equal(await asteroids.ownerOf(250000), accounts[1]);
    assert.equal(await web3.eth.getBalance(sale.address), price);
  });

  it('should allow withdraw of ether balance', async () => {
    await createSale();
    const price = await sale.getAsteroidPrice(250000);
    await sale.buyAsteroid(250000, { from: accounts[1], value: price });
    await sale.withdraw({ from: accounts[0] });
    assert.equal(await web3.eth.getBalance(sale.address), 0);
  });

  it('should allow minting a specialist crew member with an early adopter asteroid', async () => {
    await createSale();
    await asteroids.addManager(accounts[0]);
    await asteroids.mint(accounts[1], 1);
    await scans.addManager(accounts[0]);
    await scans.recordScanOrder(1);
    const tx = await sale.mintCrewWithAsteroid(1, { from: accounts[1] });
    // console.log('Gas used:', tx.receipt.gasUsed);
    assert.equal(await crew.ownerOf(1), accounts[1]);
  });

  it('should not allow minting a citizen until the end count is reached', async () => {
    await createSale();
    let price;

    for (let i = 250000; i >= 249994; i--) {
      price = await sale.getAsteroidPrice(i);
      await sale.buyAsteroid(i, { from: accounts[1], value: price });
    }

    await truffleAssert.reverts(sale.mintCrewWithAsteroid(249994, { from: accounts[1] }));
  });

  it('should not allow buying past the end count but should allow minting citizens', async () => {
    await createSale();
    let price;

    for (let i = 250000; i >= 249991; i--) {
      price = await sale.getAsteroidPrice(i);
      await sale.buyAsteroid(i, { from: accounts[1], value: price });
    }

    // Ensure you can't buy anymore
    await truffleAssert.reverts(sale.getAsteroidPrice(249990));
    await truffleAssert.reverts(sale.buyAsteroid(249990, { from: accounts[1], value: web3.utils.toWei('1.0') }));

    // Ensure you can mint the citizen
    await sale.mintCrewWithAsteroid(249991, { from: accounts[1] });
    assert.equal(await crew.ownerOf(1), accounts[1]);
    assert.ok(await crewFeatures.getFeatures(1));
  });

  it('should not allow minting a crew member with an already used asteroid', async () => {
    await createSale();
    const price = await sale.getAsteroidPrice(250000);
    await sale.buyAsteroid(250000, { from: accounts[1], value: price });
    await sale.mintCrewWithAsteroid(250000, { from: accounts[1] });
    await truffleAssert.reverts(sale.mintCrewWithAsteroid(250000, { from: accounts[1] }));
  });

  it('should not allow minting a crew member with an unowned asteroid', async () => {
    await createSale();
    const price = await sale.getAsteroidPrice(250000);
    await sale.buyAsteroid(250000, { from: accounts[1], value: price });
    await truffleAssert.reverts(sale.mintCrewWithAsteroid(250000, { from: accounts[0] }));
  });

  it('should not allow minting with an unpurchased asteroid', async () => {
    await createSale();
    await truffleAssert.reverts(sale.mintCrewWithAsteroid(250000, { from: accounts[1] }));
  });
});
