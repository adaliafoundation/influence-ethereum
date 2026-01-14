const ProceduralMock = artifacts.require('ProceduralMock');
const Procedural = artifacts.require('Procedural');
const Math64Helper = require('../helpers/Math64');
const utils = require('web3-utils');

contract('Procedural', (accounts) => {
  let proceduralMock;

  before('bootstrap test suite', async () => {
    await ProceduralMock.link(Procedural);
  });

  it('should generate consistent outputs', async () => {
    let generated;

    proceduralMock = await ProceduralMock.new(utils.toHex(42));
    generated = await proceduralMock.getHash();
    assert.equal(generated.toString(), '0x12f3bb4c5076ada91fab3a59f9e379ea300fbdf187ee4049227078006c395741');
    generated = await proceduralMock.getInt128();
    assert.equal(generated.toString(), '63884680762024744668724884810388559681');
    generated = await proceduralMock.getReal();
    assert.equal(generated.toString(), '2481615337892173633');
    generated = await proceduralMock.derive(utils.toHex('string'));
    assert.equal(generated.toString(), '0x0133cf1bb1da24fbf070975169527fba9cc6064dabd80cad509b89658c964aca');
    generated = await proceduralMock.derive(42);
    assert.equal(generated.toString(), '0xa4afdaaba12a3db5b268913cc7a0e50301a1685dbd83ca9e9c69f7c2504b8f55');
  });

  it('should get a real between zero and one', async () => {
    let generated, result, num;

    for (let i = 0; i < 100; i++) {
      num = Math.ceil(Math.random() * 250000);
      proceduralMock = await ProceduralMock.new(utils.toHex(num));
      generated = await proceduralMock.getReal.call();
      result = Math64Helper.fromReal(generated);
      assert(result < 1, 'Generated real is more than one');
      assert(result >= 0, 'Generated real is less than zero');
    }
  });

  it('should get an integer between low and high', async () => {
    let generated, result, num;

    for (let i = 0; i < 100; i++) {
      num = Math.ceil(Math.random() * 250000);
      proceduralMock = await ProceduralMock.new(utils.toHex(num));
      generated = await proceduralMock.getIntBetween.call(1, 101);
      result = generated.toNumber();
      assert(result < 101, 'Generated integer is more than high');
      assert(result >= 1, 'Generated integer is less than low');
    }
  });

  it('should get a normal integer between low and high', async () => {
    let generated, result, num;

    for (let i = 0; i < 100; i++) {
      num = Math.ceil(Math.random() * 250000);
      proceduralMock = await ProceduralMock.new(utils.toHex(num));
      generated = await proceduralMock.getNormalIntBetween.call(1, 101);
      result = generated.toNumber();
      assert(result < 101, 'Generated integer is more than high');
      assert(result >= 1, 'Generated integer is less than low');
    }
  });

  it('should get a decaying integer below high', async () => {
    let generated, result;
    let max = 0;

    for (let i = 0; i < 100; i++) {
      num = Math.ceil(Math.random() * 250000);
      proceduralMock = await ProceduralMock.new(utils.toHex(num));
      generated = await proceduralMock.getDecayingIntBelow.call(101);
      result = generated.toNumber();
      if (result > max) max = result;
      assert(result < 101, 'Generated integer is more than high');
      assert(result >= 0, 'Generated integer is lower than one');
    }

    assert(max > 50, 'Generator is failing to generate in upper half of range');
  });
});
