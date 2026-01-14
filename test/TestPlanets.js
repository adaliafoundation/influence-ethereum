const Planets = artifacts.require('Planets');

contract('Planets', (accounts) => {
  let planets;

  before('bootstrap test suite', async () => {
    planets = await Planets.new();
  });

  it('should get the planet orbital elements', async () => {
    const result = await planets.getElements.call(1);
    const expected = [ 258, 178, 639, 27693, 4955, 9342 ];
    assert.deepEqual(result.map(v => v.toNumber()), expected, 'Correct orbital elements should be returned');
  });

  it('should get the planet type', async () => {
    const result = await planets.getType.call(3);
    assert.equal(result.toNumber(), 2, 'Correct planet type should be returned');
  });

  it('should get the planet radius', async () => {
    const result = await planets.getRadius.call(5);
    assert.equal(result.toNumber(), 19559342, 'Correct radius should be returned');
  });
});
