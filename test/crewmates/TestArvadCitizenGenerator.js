const Generator = artifacts.require('ArvadCitizenGenerator');
const truffleAssert = require('truffle-assertions');
const utils = require('web3-utils');

contract('ArvadCitizenGenerator', (accounts) => {
  let generator;

  beforeEach('bootstrap test suite', async () => {
    generator = await Generator.new();
    await generator.addManager(accounts[0]);
    const seed = utils.asciiToHex('testSeed');
    await generator.setSeed(seed);
  });

  it('should set the seed correctly', async () => {
    const derivedSeed = '0xbd330b71467d5e80d171860763443d9029a08185fa9382f5e6d248321325297d';
    assert.equal(await generator.generatorSeed(), derivedSeed);
  });

  it('should return bitpacked features for crew members', async () => {
    const crewId = Math.ceil(Math.random() * 11100);
    const mod = Math.ceil(Math.random() * 2500);
    const features = BigInt(await generator.getFeatures(crewId, mod));
    const seed = await generator.getCrewSeed(crewId);

    const sex = await generator.generateSex(seed);
    assert.equal(Number(sex), Number((features >> 8n) & BigInt(Math.pow(2, 2) - 1)));

    const body = await generator.generateBody(seed, sex);
    assert.equal(Number(body), Number((features >> 10n) & BigInt(Math.pow(2, 16) - 1)));

    const crewClass = await generator.generateClass(seed);
    assert.equal(Number(crewClass), Number((features >> 26n) & BigInt(Math.pow(2, 8) - 1)));

    const job = await generator.generateArvadJob(seed, crewClass, mod);
    assert.equal(Number(job), Number((features >> 34n) & BigInt(Math.pow(2, 16) - 1)));

    const clothes = await generator.generateClothes(seed, crewClass);
    assert.equal(Number(clothes), Number((features >> 50n) & BigInt(Math.pow(2, 16) - 1)));

    const hair = await generator.generateHair(seed, sex);
    assert.equal(Number(hair), Number((features >> 66n) & BigInt(Math.pow(2, 16) - 1)));

    const facialFeatures = await generator.generateFacialFeatures(seed, sex);
    assert.equal(Number(facialFeatures), Number((features >> 82n) & BigInt(Math.pow(2, 16) - 1)));

    const color = await generator.generateHairColor(seed);
    assert.equal(Number(color), Number((features >> 98n) & BigInt(Math.pow(2, 8) - 1)));

    const headPiece = await generator.generateHeadPiece(seed, crewClass, mod);
    assert.equal(Number(headPiece), Number((features >> 106n) & BigInt(Math.pow(2, 8) - 1)));

    // Check that the item is not populated
    assert.equal(0, Number((features >> 114n) & BigInt(Math.pow(2, 8) - 1)));
  });

  it('should generate a proper sex ratio', async () => {
    let seed, sex;
    let male = 0;
    const samples = 100;

    for (let i = 0; i < samples; i++) {
      seed = await generator.getCrewSeed(Math.ceil(Math.random() * 11100));
      sex = await generator.generateSex(seed);

      sex.toNumber() == 1 && male++;
    }

    const stdError = Math.sqrt((0.5 * (1 - 0.5)) / samples);
    const diff = Math.abs(0.5 - male / samples);
    assert.ok(stdError * 3.0 > diff, "Ratio of males to females is incorrect");
  });

  it('should generate a proper distribution of bodies', async () => {
    let seed, sex, body;
    let bodies = new Array(12).fill(0);
    const samples = 100;

    for (let i = 0; i < samples; i++) {
      seed = await generator.getCrewSeed(Math.ceil(Math.random() * 11100));
      sex = await generator.generateSex(seed);
      body = await generator.generateBody(seed, sex);
      bodies[body.toNumber() - 1]++;
    }

    const stdError = Math.sqrt(((1 / 12) * (1 - (1 / 12))) / samples);

    bodies.forEach((n, i) => {
      const diff = Math.abs((1 / 12) - (n / samples));
      assert.ok(stdError * 3.0 > diff, 'Ratio of body types is incorrect');
    });
  });

  it('should generate a proper distribution of classes', async () => {
    let seed, crewClass;
    let classes = new Array(5).fill(0);
    const samples = 100;
    const expectedRatios = [ 0.0703, 0.2068, 0.4352, 0.1714, 0.1163 ];
    const stdErrors = expectedRatios.map(r => Math.sqrt((r * (1 - r)) / samples));

    for (let i = 0; i < samples; i++) {
      seed = await generator.getCrewSeed(Math.ceil(Math.random() * 11100));
      crewClass = await generator.generateClass(seed);
      classes[crewClass.toNumber() - 1]++;
    }

    classes.forEach((n, i) => {
      const diff = Math.abs(expectedRatios[i] - (n / samples));
      assert.ok(stdErrors[i] * 3.0 > diff, 'Ratio of classes is incorrect');
    });
  });

  it('should generate a proper Arvad job rank distribution with no modification', async () => {
    let seed, crewClass, job, rank;
    let ranks = new Array(4).fill(0);
    const samples = 100;
    const expectedRatios = [ 0.533, 0.267, 0.133, 0.067 ];
    const stdErrors = expectedRatios.map(r => Math.sqrt((r * (1 - r)) / samples));

    for (let i = 0; i < samples; i++) {
      seed = await generator.getCrewSeed(Math.ceil(Math.random() * 11100));
      crewClass = await generator.generateClass(seed);
      job = await generator.generateArvadJob(seed, crewClass, 0);
      rank = Math.floor((job.toNumber() - 1) / 13);
      ranks[rank]++;
    }

    ranks.forEach((n, i) => {
      const diff = Math.abs(expectedRatios[i] - (n / samples));
      assert.ok(stdErrors[i] * 3.0 > diff, 'Ratio of job ranks is incorrect');
    });
  });

  it('should generate a proper distribution of clothes', async () => {
    let seed, crewClass, outfit;
    let clothes = new Array(18).fill(0);
    const samples = 100;
    const expectedRatios = [
      0.103, 0.103, 0.103,
      0.053, 0.053, 0.053,
      0.013, 0.013, 0.013,
      0.053, 0.053, 0.053,
      0.008, 0.008, 0.008,
      0.103, 0.103, 0.103
    ];

    const stdErrors = expectedRatios.map(r => Math.sqrt((r * (1 - r)) / samples));

    for (let i = 0; i < samples; i++) {
      seed = await generator.getCrewSeed(Math.ceil(Math.random() * 11100));
      crewClass = await generator.generateClass(seed);
      outfit = await generator.generateClothes(seed, crewClass);
      clothes[outfit.toNumber() - 1]++;
    }

    clothes.forEach((n, i) => {
      const diff = Math.abs(expectedRatios[i] - (n / samples));
      assert.ok(stdErrors[i] * 3.0 > diff, 'Ratio of job ranks is incorrect');
    });
  });

  it('should generate a proper distribution of hair', async () => {
    let seed, sex, hair;
    let hairStyles = new Array(12).fill(0);
    const samples = 100;
    const expectedRatios = [ 0.167, 0.083, 0.083, 0.083, 0.083, 0.083, 0.069, 0.069, 0.069, 0.069, 0.069, 0.069 ];
    const stdErrors = expectedRatios.map(r => Math.sqrt((r * (1 - r)) / samples));

    for (let i = 0; i < samples; i++) {
      seed = await generator.getCrewSeed(Math.ceil(Math.random() * 11100));
      sex = await generator.generateSex(seed);
      hair = await generator.generateHair(seed, sex);
      hairStyles[hair.toNumber()]++;
    }

    hairStyles.forEach((n, i) => {
      const diff = Math.abs(expectedRatios[i] - (n / samples));
      assert.ok(stdErrors[i] * 3.0 > diff, 'Ratio of hair styles is incorrect');
    });
  });

  it('should generate a proper distribution of facial features', async () => {
    let seed, sex, feature;
    let features = new Array(8).fill(0);
    const samples = 100;
    const expectedRatios = [ 0.333, 0.333, 0.167, 0.033, 0.033, 0.033, 0.033, 0.033 ];
    const stdErrors = expectedRatios.map(r => Math.sqrt((r * (1 - r)) / samples));

    for (let i = 0; i < samples; i++) {
      seed = await generator.getCrewSeed(Math.ceil(Math.random() * 11100));
      sex = await generator.generateSex(seed);
      feature = await generator.generateFacialFeatures(seed, sex);
      features[feature.toNumber()]++;
    }

    features.forEach((n, i) => {
      const diff = Math.abs(expectedRatios[i] - (n / samples));
      assert.ok(stdErrors[i] * 3.0 > diff, 'Ratio of facial features is incorrect');
    });
  });

  it('should generate a proper distribution of hair color', async () => {
    let seed, color;
    let colors = new Array(5).fill(0);
    const samples = 100;

    for (let i = 0; i < samples; i++) {
      seed = await generator.getCrewSeed(Math.ceil(Math.random() * 11100));
      color = await generator.generateHairColor(seed);
      colors[color.toNumber() - 1]++;
    }

    const stdError = Math.sqrt(((1 / 5) * (1 - (1 / 5))) / samples);

    colors.forEach((n, i) => {
      const diff = Math.abs((1 / 5) - (n / samples));
      assert.ok(stdError * 3.0 > diff, 'Ratio of hair colors is incorrect');
    });
  });

  it('should generate a proper distribution of head pieces without modification', async () => {
    let seed, crewClass, headPiece;
    let headPieces = new Array(6).fill(0);
    const samples = 100;
    const expectedRatios = [ 0.667, 0.103, 0.093, 0.050, 0.055, 0.032 ];
    const stdErrors = expectedRatios.map(r => Math.sqrt((r * (1 - r)) / samples));

    for (let i = 0; i < samples; i++) {
      seed = await generator.getCrewSeed(Math.ceil(Math.random() * 11100));
      crewClass = await generator.generateClass(seed);
      headPiece = await generator.generateHeadPiece(seed, crewClass, 0);
      headPieces[headPiece.toNumber()]++;
    }

    headPieces.forEach((n, i) => {
      const diff = Math.abs(expectedRatios[i] - (n / samples));
      assert.ok(stdErrors[i] * 3.0 > diff, 'Ratio of head pieces is incorrect');
    });
  });
});
