const Planets = artifacts.require('Planets');
const AsteroidFeatures = artifacts.require('AsteroidFeatures');
const utils = require('web3-utils');
const { SPECTRAL_TYPES, toSpectralType } = require('influence-utils');

contract('AsteroidFeatures', (accounts) => {
  let planets, gen;

  beforeEach('bootstrap test suite', async () => {
    planets = await Planets.new();
    gen = await AsteroidFeatures.new(planets.address);
  });

  it('should get an asteroid seed', async () => {
    const seed = await gen.getAsteroidSeed(1);
    const expected = '0xc724751ccde05a7706fc8a93757fa3783eda21e98941d100b254017f455576ab';
    assert.equal(seed, expected, 'Seed should be retrieved successfully.');
  });

  it('should get asteroid radii within the appropriate range', async () => {
    let id, radius, seed;

    for (let i = 0; i < 100; i++) {
      id = Math.ceil(Math.random() * 250000);
      radius = await gen.getRadius(id);
      assert.isAtLeast(radius.toNumber(), 1000, 'Radius is too small.');
      assert.isAtMost(radius.toNumber(), 375142, 'Radius is too large.');
    }
  });

  // This may fail every so often (1% of the time or so) since it's testing a confidence interval
  it('should get the correct distribution of spectral types', async () => {
    let id, result, seed, type;
    const samples = 250;
    const mainRatio = [ 6500, 125, 250, 500, 250, 125, 1000, 500, 125, 500, 125 ];
    const trojanRatio = [ 2750, 0, 1500, 0, 0, 0, 0, 0, 0, 0, 5750 ];
    const expectedRatios = mainRatio.map((r, i) => (r * 0.8 + trojanRatio[i] * 0.2) / 10000);
    const stdErrors = expectedRatios.map(r => Math.sqrt((r * (1 - r)) / samples));
    let results = SPECTRAL_TYPES.map(t => 0);

    for (let i = 0; i < samples; i++) {
      id = Math.ceil(Math.random() * 250000);
      type = await gen.getSpectralType(id);
      results[type.toNumber()] += 1 / samples;
    }

    results.forEach((r, i) => {
      const diff = Math.abs(expectedRatios[i] - r);
      assert.ok(stdErrors[i] * 3.0 > diff, `Number of ${toSpectralType(i)} is outside of 99% margin of error`);
    });
  });

  it('should get orbital elements for each asteroid', async () => {
    let elements, id, seed;

    for (let i = 1; i < 100; i++) {
      id = Math.ceil(Math.random() * 250000);
      elements = await gen.getOrbitalElements(id);
      assert.isAtLeast(elements[0].toNumber(), 800, 'Semi-major axis is too small.');
      assert.isAtMost(elements[0].toNumber(), 3912, 'Semi-major axis is too large.');
      assert.isAtLeast(elements[1].toNumber(), 0, 'Eccentricity can not be negative.');
      assert.isAtMost(elements[1].toNumber(), 400, 'Eccentricity is too large.');
      assert.isAtLeast(elements[2].toNumber(), 0, 'Inclination can not be negative.');
      assert.isAtMost(elements[2].toNumber(), 4000, 'Inclination is too large.');
      assert.isAtLeast(elements[3].toNumber(), 0, 'Longitude of ascending node can not be negative.');
      assert.isAtMost(elements[3].toNumber(), 35999, 'Longitude of ascending node is larger than one turn.');
      assert.isAtLeast(elements[4].toNumber(), 0, 'Argument of periapsis can not be negative.');
      assert.isAtMost(elements[4].toNumber(), 35999, 'Argument of periapsis is larger than one turn.');
      assert.isAtLeast(elements[5].toNumber(), 0, 'Mean anomaly can not be negative.');
      assert.isAtMost(elements[5].toNumber(), 35999, 'Mean anomaly is larger than one turn.');
    }
  });
});
