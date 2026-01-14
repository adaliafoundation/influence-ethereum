const CrewToken = artifacts.require('CrewToken');
const CrewNames = artifacts.require('CrewNames');
const truffleAssert = require('truffle-assertions');
const utils = require('web3-utils');

contract('CrewNames', (accounts) => {
  let token, names;

  beforeEach('bootstrap test suite', async () => {
    token = await CrewToken.new('Influence Crew', 'INFC');
    names = await CrewNames.new(token.address);
  });

  it('should allow naming a crew member', async () => {
    let result;

    await token.addManager(accounts[0]);
    await token.mint(accounts[1], { from: accounts[0] });
    await names.setName(1, 'TestName', { from: accounts[1] });
    result = await names.getName(1);
    assert.equal(result, 'TestName');
  });

  it('should not allow changing a crew member name', async () => {
    let result;

    await token.addManager(accounts[0]);
    await token.mint(accounts[1], { from: accounts[0] });
    await names.setName(1, 'TestName', { from: accounts[1] });
    await truffleAssert.reverts(names.setName(1, 'TestName2', { from: accounts[1] }));
  });

  it('should not allow naming a crew member that is not owned', async () => {
    await truffleAssert.reverts(names.setName(1, 'TestName', { from: accounts[1] }));
  });

  it('should not allow changing to a used name', async () => {
    await token.addManager(accounts[0]);
    await token.mint(accounts[1], { from: accounts[0] });
    await token.mint(accounts[1], { from: accounts[0] });
    await names.setName(1, 'TestName', { from: accounts[1] });
    await truffleAssert.reverts(names.setName(2, 'TestName', { from: accounts[1] }));
  });

  it('should not allow using an invalid name', async () => {
    await token.addManager(accounts[0]);
    await token.mint(accounts[1], { from: accounts[0] });
    await truffleAssert.reverts(names.setName(1, 'TestName!', { from: accounts[1] }));
    await truffleAssert.reverts(names.setName(1, 'Test  Name!', { from: accounts[1] }));
    await truffleAssert.reverts(names.setName(1, ' ', { from: accounts[1] }));
    await truffleAssert.reverts(names.setName(1, '123456789012345678901234567890123', { from: accounts[1] }));
  });

  it('should return an empty string for unnamed crew member', async () => {
    let result = await names.getName(1);
    assert.equal(result, '');
  });
});
