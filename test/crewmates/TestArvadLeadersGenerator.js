const Generator = artifacts.require('ArvadLeadersGenerator');
const CrewFeatures = artifacts.require('CrewFeatures');
const truffleAssert = require('truffle-assertions');
const utils = require('web3-utils');

contract('ArvadLeadersGenerator', (accounts) => {
  let generator, crewFeatures;

  const leaderFeatures = [
    [ 3, 2, 7, 1, 53, 19, 11, 0, 1, 6, 1 ],
    [ 3, 1, 1, 5, 54, 20, 7, 7, 2, 7, 1 ],
    [ 3, 2, 8, 5, 55, 21, 7, 0, 4, 8, 1 ],
    [ 3, 2, 9, 5, 56, 22, 8, 0, 2, 9, 6 ],
    [ 3, 1, 6, 1, 57, 23, 4, 5, 5, 0, 1 ],
    [ 3, 1, 5, 4, 58, 24, 3, 4, 2, 10, 1 ],
    [ 3, 2, 10, 3, 59, 25, 11, 0, 3, 11, 1 ],
    [ 3, 1, 2, 2, 60, 26, 4, 7, 2, 12, 7 ],
    [ 3, 1, 4, 2, 61, 27, 5, 0, 5, 4, 1 ],
    [ 3, 1, 3, 5, 62, 28, 0, 6, 3, 13, 0 ],
    [ 3, 2, 11, 3, 63, 29, 9, 1, 4, 14, 1 ],
    [ 3, 1, 2, 4, 64, 30, 4, 3, 2, 15, 0 ],
    [ 3, 2, 12, 1, 65, 31, 6, 1, 1, 16, 8 ]
  ];

  beforeEach('bootstrap test suite', async () => {
    generator = await Generator.new();
    crewFeatures = await CrewFeatures.new();
    await crewFeatures.addManager(accounts[0]);
  });

  // We're checking everything here, that we can set up the generator, set the tokens and retrieve the right attributes
  it('should return bitpacked features for crew members', async () => {
    let features;
    await crewFeatures.setGenerator(3, generator.address);
    
    // i is used as both crewId and the mod
    for (let i = 1; i <= 13; i++) {
      await crewFeatures.setToken(i, 3, i);
      features = BigInt(await crewFeatures.getFeatures(i));
      assert.equal(Number(leaderFeatures[i - 1][1]), Number((features >> 8n) & BigInt(Math.pow(2, 2) - 1)));
      assert.equal(Number(leaderFeatures[i - 1][2]), Number((features >> 10n) & BigInt(Math.pow(2, 16) - 1)));
      assert.equal(Number(leaderFeatures[i - 1][3]), Number((features >> 26n) & BigInt(Math.pow(2, 8) - 1)));
      assert.equal(Number(leaderFeatures[i - 1][4]), Number((features >> 34n) & BigInt(Math.pow(2, 16) - 1)));
      assert.equal(Number(leaderFeatures[i - 1][5]), Number((features >> 50n) & BigInt(Math.pow(2, 16) - 1)));
      assert.equal(Number(leaderFeatures[i - 1][6]), Number((features >> 66n) & BigInt(Math.pow(2, 16) - 1)));
      assert.equal(Number(leaderFeatures[i - 1][7]), Number((features >> 82n) & BigInt(Math.pow(2, 16) - 1)));
      assert.equal(Number(leaderFeatures[i - 1][8]), Number((features >> 98n) & BigInt(Math.pow(2, 8) - 1)));
      assert.equal(Number(leaderFeatures[i - 1][9]), Number((features >> 106n) & BigInt(Math.pow(2, 8) - 1)));
      assert.equal(Number(leaderFeatures[i - 1][10]), Number((features >> 114n) & BigInt(Math.pow(2, 8) - 1)))
    }
  });
});