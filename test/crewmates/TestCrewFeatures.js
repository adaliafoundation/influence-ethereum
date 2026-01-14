const CrewFeatures = artifacts.require('CrewFeatures');
const SpecialistGenerator = artifacts.require('ArvadSpecialistGenerator');
const CitizenGenerator = artifacts.require('ArvadCitizenGenerator');
const truffleAssert = require('truffle-assertions');
const utils = require('web3-utils');

contract('CrewFeatures', (accounts) => {
  let features;

  beforeEach('bootstrap test suite', async () => {
    features = await CrewFeatures.new();
    await features.addManager(accounts[0]);
  });

  it('should allow creating collections and assigning tokens to collections', async () => {
    const generator = await SpecialistGenerator.new();
    await features.setGenerator(1, generator.address);
    await features.setToken(1, 1, 0);
    const result = BigInt(await features.getFeatures(1));
    assert.equal(1, Number(result & BigInt(Math.pow(2, 8) - 1)));
  });

  it('should fire event when creating collections', async () => {
    const generator = await SpecialistGenerator.new();
    let receipt = await features.setGenerator(1, generator.address);
    truffleAssert.eventEmitted(receipt, 'CollectionCreated', (e) => {
      return e.id.toNumber() === 1;
    });
  });

  it('should fire event when seeding collections', async () => {
    const generator = await CitizenGenerator.new();
    await generator.addManager(features.address);
    await features.setGenerator(1, generator.address);
    let receipt = await features.setGeneratorSeed(1, utils.asciiToHex('testSeed'));
    truffleAssert.eventEmitted(receipt, 'CollectionSeeded', (e) => {
      return e.id.toNumber() === 1;
    });
  });

  it('should revert when trying to overwrite the seed on the specialist generator', async () => {
    const generator = await SpecialistGenerator.new();
    await features.setGenerator(1, generator.address);
    await truffleAssert.reverts(features.setGeneratorSeed(1, utils.asciiToHex('testSeed')));
  });

  it('should not allow assigning crew to collections with no contract', async () => {
    await truffleAssert.reverts(features.setToken(1, 1, 0));
  });

  it('should not allow setting a generator seed with no contract', async () => {
    await truffleAssert.reverts(features.setGeneratorSeed(1, utils.asciiToHex('testSeed')));
  });
});
