const AsteroidToken = artifacts.require('AsteroidToken');
const truffleAssert = require('truffle-assertions');
const utils = require('web3-utils');
const { TOTAL_ASTEROIDS } = require('influence-utils');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('AsteroidToken', (accounts) => {
  let token;

  beforeEach('bootstrap test suite', async () => {
    token = await AsteroidToken.new('Influence Asteroids', 'INFA');
  });

  it('should implement ERC721 introspection', async () => {
    const result = await token.supportsInterface('0x80ac58cd');
    assert.equal(result, true);
  });

  it('should return the correct totalSupply', async () => {
    assert.equal((await token.totalSupply.call()).toNumber(), TOTAL_ASTEROIDS);
  });

  it('should allow removing a manager', async () => {
    await token.addManager(accounts[1]);
    await token.removeManager(accounts[1]);
    await truffleAssert.reverts(token.mint(accounts[1], 2, { from: accounts[1] }));
  });

  it('should not allow a non-manager to mint an asteroid', async () => {
    await truffleAssert.reverts(token.mint(accounts[1], 2, { from: accounts[1] }));
  });

  it('should allow setting a manager and minting a new asteroid', async () => {
    let result, receipt;

    await token.addManager(accounts[1]);
    receipt = await token.mint(accounts[2], 2, { from: accounts[1] });
    result = await token.ownerOf(2);
    assert.equal(result, accounts[2]);
    truffleAssert.eventEmitted(receipt, 'Transfer', (e) => {
      return e.from === ZERO_ADDRESS && e.to === accounts[2] && e.tokenId.toNumber() === 2;
    });
  });

  it('should not allow minting an already minted asteroid', async () => {
    await token.addManager(accounts[1]);
    await token.mint(accounts[2], 2, { from: accounts[1] });
    await truffleAssert.reverts(token.mint(accounts[3], 2, { from: accounts[1] }));
  });

  it('should not allow minting outside of the allowed id range', async () => {
    await token.addManager(accounts[1]);
    await truffleAssert.reverts(token.mint(accounts[2], 0, { from: accounts[1] }));
    await truffleAssert.reverts(token.mint(accounts[2], 250001, { from: accounts[1] }));
  });

  it('should not allow transfers when paused', async () => {
    await token.addManager(accounts[1]);
    await token.mint(accounts[2], 1, { from: accounts[1] });
    await token.pause();
    await truffleAssert.reverts(token.burn(1, { from: accounts[1] }));
    await truffleAssert.reverts(token.mint(accounts[2], 2, { from: accounts[1] }));
  });

  it('shoud only allow owner to pause', async () => {
    await truffleAssert.reverts(token.pause({ from: accounts[1] }));
    await token.pause();
  });

  it('should only allow managers to burn', async () => {
    await truffleAssert.reverts(token.burn(1));
  });

  // Standard ERC-721 interface tests
  it('should allow setting the base URI by owner', async () => {
    const base = 'https://api.influenceth.io/';
    await truffleAssert.reverts(token.setBaseURI(base, { from: accounts[1] }));
    await token.setBaseURI(base);
    assert.equal(await token.baseURI.call(), base);
    assert.equal(await token.tokenURI(1), base + '1');
  });

  it('shoud return the amount of tokens held by an address', async () => {
    await token.addManager(accounts[0]);
    let balance = await token.balanceOf(accounts[1]);
    assert.equal(balance.toNumber(), 0);
    await token.mint(accounts[1], 2);
    balance = await token.balanceOf(accounts[1]);
    assert.equal(balance.toNumber(), 1);
    await truffleAssert.reverts(token.balanceOf(ZERO_ADDRESS));
  });

  it('shoud allow owner to transfer token', async () => {
    await token.addManager(accounts[0]);
    await token.mint(accounts[0], 1, { from: accounts[0] });
    const receipt = await token.transferFrom(accounts[0], accounts[1], 1, { from: accounts[0] });
    truffleAssert.eventEmitted(receipt, 'Transfer', (e) => {
      return e.from === accounts[0] && e.to === accounts[1] && e.tokenId.toNumber() === 1;
    });
    assert.equal(await token.ownerOf(1), accounts[1]);
    assert.equal((await token.balanceOf(accounts[0])).toNumber(), 0);
    assert.equal((await token.balanceOf(accounts[1])).toNumber(), 1);
  });

  it('shoud allow owner to approve transfer token', async () => {
    await token.addManager(accounts[0]);
    await token.mint(accounts[0], 1, { from: accounts[0] });
    await token.approve(accounts[1], 1);
    const receipt = await token.transferFrom(accounts[0], accounts[1], 1, { from: accounts[1] });
    truffleAssert.eventEmitted(receipt, 'Transfer', (e) => {
      return e.from === accounts[0] && e.to === accounts[1] && e.tokenId.toNumber() === 1;
    });
    assert.equal(await token.ownerOf(1), accounts[1]);
    assert.equal((await token.balanceOf(accounts[0])).toNumber(), 0);
    assert.equal((await token.balanceOf(accounts[1])).toNumber(), 1);
    assert.equal(await token.getApproved(1), ZERO_ADDRESS, 'Approval not cleared');
  });

  it('should not allow un-approved address to transfer token', async () => {
    await truffleAssert.reverts(token.transferFrom(accounts[0], accounts[1], 1, { from: accounts[1] }));
  });

  it('should not allow approving un-owned token', async () => {
    await truffleAssert.reverts(token.approve(accounts[1], 2));
  });

  it('should burn a minted token', async () => {
    await token.addManager(accounts[0]);
    await token.mint(accounts[0], 1, { from: accounts[0] });
    await token.burn(1);
    assert.equal(await token.ownerOf(1), ZERO_ADDRESS);
    assert.equal((await token.balanceOf(accounts[0])).toNumber(), 0);
  });

  it('should not burn a non-minted token', async () => {
    await token.addManager(accounts[0]);
    await truffleAssert.reverts(token.burn(2));
  });
});
