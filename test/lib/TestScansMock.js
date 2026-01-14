const InfluenceSettings = artifacts.require('InfluenceSettings');
const AsteroidToken = artifacts.require('AsteroidToken');
const Planets = artifacts.require('Planets');
const AsteroidScans = artifacts.require('AsteroidScans');
const AsteroidFeatures = artifacts.require('AsteroidFeatures');
const Procedural = artifacts.require('Procedural');
const ScansMock = artifacts.require('ScansMock');
const utils = require('web3-utils');

contract('ScansMock', (accounts) => {
  let asteroid, features, scans, planets;

  before('bootstrap test suite', async () => {
    asteroid = await AsteroidToken.new('Influence Asteroids', 'INFA');
    planets = await Planets.new();
    features = await AsteroidFeatures.new(planets.address);
    await ScansMock.link(InfluenceSettings);
    await ScansMock.link(Procedural);
    scans = await ScansMock.new(features.address);
  });

  /**
    * Takes a set of test scans with asteroidId, scan order and blockhash and tests that the appropriate
    * scan results are returned.
    */
  it('should recompute bonuses', async () => {
    let bonuses;
    const testScans = [];

    for (let s of testScans) {
      bonuses = await scans.finalizeScan(s[0], s[1], s[2]);
      console.log(s[0], bonuses.toNumber());
    }
  });
});
