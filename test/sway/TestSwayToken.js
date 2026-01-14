const SwayToken = artifacts.require('SwayToken');
const truffleAssert = require('truffle-assertions');
const { advanceTimeAndBlock } = require('../helpers/blockchain.js');
const { GOVERNOR_ROLE, TRANSFERRER_ROLE } = require('../lib/constants');

let decimalAdjust;

contract('SwayToken', (accounts) => {
  let token;
  const admin = accounts[0];
  const governor = accounts[1];
  const user1 = accounts[2];
  const user2 = accounts[3];

  before('bootstrap test suite', async () => {
    token = await SwayToken.new();
    decimalAdjust = 10n ** BigInt(await token.decimals());
    await token.grantRole(GOVERNOR_ROLE, governor);
  });

  it('should start in non-transferrable state', async () => {
    const launched = await token.launched();
    assert.equal(launched, false);
  });

  it('should mint the initial supply to caller', async () => {
    const balance = await token.balanceOf(admin);
    const totalSupply = await token.totalSupply();
    assert.equal(balance.toString(), totalSupply.toString());
    assert.equal(balance.toString(), (97_500_000_000n * decimalAdjust).toString());
  });

  it('should fail to mint when not yet launched', async () => {
    await truffleAssert.reverts(token.mint(governor, 100_000n, { from: governor }));
  });

  it('should allow transfer prior to launch with correct role', async () => {
    await token.transfer(user1, 100_000n, { from: admin });
    const balance = await token.balanceOf(user1);
    assert.equal(balance.toString(), '100000');
  });

  it('should not allow transfer prior to launch without correct role', async () => {
    await truffleAssert.reverts(token.transferFrom(user1, user2, 100_000n));
  });

  it('should fail when non-admin tries to launch', async () => {
    await truffleAssert.reverts(token.launch({ from: user1 }));
  });

  it('should allow admin to launch', async () => {
    const balancePre = await token.balanceOf(admin);
    await token.launch({ from: admin });
    const launched = await token.launched();
    assert.equal(launched, true);
    const balancePost = await token.balanceOf(admin);
    assert.equal(balancePost.sub(balancePre).toString(), (32_500_000_000n * decimalAdjust).toString());
  });

  it('should fail to launch twice', async () => {
    await truffleAssert.reverts(token.launch({ from: admin }));
  });

  it('should allow transfers after launch', async () => {
    await token.transfer(user2, 100_000n, { from: user1 });
    const balance = await token.balanceOf(user2);
    assert.equal(balance.toString(), '100000');
  });

  it('should calculate the current period correctly', async () => {
    const timestamp = (await web3.eth.getBlock('latest')).timestamp;
    const period = Math.floor(timestamp / 1_000_000);
    const currentPeriod = await token.currentPeriod();
    assert.equal(currentPeriod.toString(), period.toString());
  });

  it('should fail to retrieve period volume before period closed', async () => {
    const period = await token.currentPeriod();
    await truffleAssert.reverts(token.periodVolume(period));
  });

  it('should record transfers in period volumes', async () => {
    let period = await token.currentPeriod();
    await token.transfer(user1, 100_000n, { from: admin }); // transfer some more SWAY
    await advanceTimeAndBlock(1_000_000); // Advance 1 million seconds to next period
    const volume = await token.periodVolume(period); // Check cached period
    assert.equal(volume.toString(), '200000');
  });

  it('should not allow minting by non-governor', async () => {
    await truffleAssert.reverts(token.mint(admin, 1337n, { from: admin }));
  });
});
