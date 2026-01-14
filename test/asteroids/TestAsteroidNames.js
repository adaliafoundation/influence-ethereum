const AsteroidToken = artifacts.require('AsteroidToken');
const AsteroidNames = artifacts.require('AsteroidNames');
const truffleAssert = require('truffle-assertions');
const utils = require('web3-utils');

contract('AsteroidNames', (accounts) => {
  let token, names;

  beforeEach('bootstrap test suite', async () => {
    token = await AsteroidToken.new('Influence Asteroids', 'INFA');
    names = await AsteroidNames.new(token.address);
  });

  it('should allow naming an asteroid', async () => {
    let result;

    await token.addManager(accounts[1]);
    await token.mint(accounts[2], 2, { from: accounts[1] });
    await names.setName(2, 'TestName', { from: accounts[2] });
    result = await names.getName(2);
    assert.equal(result, 'TestName');
  });

  it('should allow changing an asteroid name', async () => {
    let result;

    await token.addManager(accounts[1]);
    await token.mint(accounts[2], 2, { from: accounts[1] });
    await names.setName(2, 'TestName', { from: accounts[2] });
    await names.setName(2, 'TestName2', { from: accounts[2] });
    result = await names.getName(2);
    assert.equal(result, 'TestName2');
  });

  it('should not allow naming an asteroid that is not owned', async () => {
    await truffleAssert.reverts(names.setName(2, 'TestName', { from: accounts[2] }));
  });

  it('should not allow changing to a used name', async () => {
    await token.addManager(accounts[1]);
    await token.mint(accounts[2], 2, { from: accounts[1] });
    await token.mint(accounts[2], 3, { from: accounts[1] });
    await names.setName(2, 'TestName', { from: accounts[2] });
    await truffleAssert.reverts(names.setName(3, 'TestName', { from: accounts[2] }));
  });

  it('should not allow using an invalid name', async () => {
    await token.addManager(accounts[1]);
    await token.mint(accounts[2], 2, { from: accounts[1] });
    await truffleAssert.reverts(names.setName(2, 'TestName!', { from: accounts[2] }));
    await truffleAssert.reverts(names.setName(2, 'Test  Name!', { from: accounts[2] }));
    await truffleAssert.reverts(names.setName(2, ' ', { from: accounts[2] }));
    await truffleAssert.reverts(names.setName(2, '123456789012345678901234567890123', { from: accounts[2] }));
  });

  it('should return an empty string for unnamed asteroid', async () => {
    let result = await names.getName(2);
    assert.equal(result, '');
  });
});
