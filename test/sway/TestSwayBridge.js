const SwayToken = artifacts.require('SwayToken');
const SwayBridge = artifacts.require('SwayBridge');
const StarknetcoreMock = artifacts.require('StarknetcoreMock');
const StarknetcoreWithFailMock = artifacts.require('StarknetcoreWithFailMock');
const truffleAssert = require('truffle-assertions');
const utils = require('web3-utils');
const { GOVERNOR_ROLE } = require('../lib/constants');

contract('SwayBridge', (accounts) => {
  let swayTokenContract;
  let bridgeContract;
  let starknetcoreContract;
  let starknetcoreWithFailContract;
  const _l2BridgeContract = utils.randomHex(31);
  const l2AccountAddress = utils.randomHex(31);
  const admin = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];

  before('bootstrap test suite', async () => {
    swayTokenContract = await SwayToken.new();
    starknetcoreContract = await StarknetcoreMock.new()
    starknetcoreWithFailContract = await StarknetcoreWithFailMock.new();
    bridgeContract = await SwayBridge.new(starknetcoreContract.address, swayTokenContract.address, _l2BridgeContract);
    await swayTokenContract.approve(bridgeContract.address, 1000000000, { from: player1 });
    await swayTokenContract.approve(bridgeContract.address, 1000000000, { from: player2 });

    await swayTokenContract.grantRole(GOVERNOR_ROLE, admin);
    await swayTokenContract.launch({ from: admin });
  });

  describe('bridgeToStarknet', function () {
    it('should burn the token if owned', async function () {
      await swayTokenContract.mint(player1, 42000);
      await bridgeContract.deposit(42000, l2AccountAddress, { from: player1 });

      const balance = await swayTokenContract.balanceOf(player1);
      assert.equal(balance, 0);
    });

    it('should fail if insufficient funds', async function () {
      await truffleAssert.reverts(bridgeContract.deposit(1, l2AccountAddress, { from: player2 }));
    });
  });

  describe('bridgeFromStarknet', function () {
    it('should fail to transfer when bridge has no funds', async function () {
      const balance = await swayTokenContract.balanceOf(bridgeContract.address);
      await truffleAssert.reverts(bridgeContract.withdraw(balance + 1, player1, { from: player1 }));
    });

    it('should transfer the specified amount', async function () {
      await swayTokenContract.mint(bridgeContract.address, 42000);
      const preBalance = await swayTokenContract.balanceOf(bridgeContract.address);
      await bridgeContract.withdraw(42000, player1, { from: player1 });
      const postBalance = await swayTokenContract.balanceOf(bridgeContract.address);

      const userBalance = await swayTokenContract.balanceOf(player1);

      assert.equal(preBalance.toNumber() - postBalance.toNumber(), 42000);
      assert.equal(userBalance.toNumber(), 42000);
    });

    it('should revert if the consumeMessageFromL2 fails/reverts', async function() {
      const bridge = await SwayBridge.new(
        starknetcoreWithFailContract.address,
        swayTokenContract.address,
        _l2BridgeContract
      );

      await swayTokenContract.mint(bridge.address, 42000);
      await truffleAssert.reverts(bridge.withdraw(42000, player1, { from: player1 }));
    });
  });

  describe('startDepositCancellation', function () {
    it('should not fail if the caller is the original sender', async function () {
      await swayTokenContract.mint(player1, 42000);

      await bridgeContract.deposit(42000, l2AccountAddress, { from: player1 });
      await bridgeContract.startDepositCancellation(42000, l2AccountAddress, 1, { from: player1 });
    });

    it('should fail with the wrong information', async function () {

    });

    it('should fail if the caller is not the original sender', async function () {
      await swayTokenContract.mint(player1, 42001);

      await bridgeContract.deposit(42001, l2AccountAddress, { from: player1 });
      await truffleAssert.reverts(
        bridgeContract.startDepositCancellation(42001, l2AccountAddress, 1, { from: player2 })
      );
    });
  });

  describe('finishDepositCancellation', function () {
    it('should not fail if the caller is the original sender and re-mint', async function () {
      await swayTokenContract.mint(player1, 42002);
      const preBalance = await swayTokenContract.balanceOf(player1);

      await bridgeContract.deposit(42002, l2AccountAddress, { from: player1 });
      await bridgeContract.finishDepositCancellation(42002, l2AccountAddress, 1, { from: player1 });

      const postBalance = await swayTokenContract.balanceOf(player1);
      assert.equal(postBalance.toNumber(), preBalance.toNumber());
    });

    it('should fail if the caller is not the original sender', async function () {
      await swayTokenContract.mint(player1, 42003);

      await bridgeContract.deposit(42003, l2AccountAddress, { from: player1 });
      await truffleAssert.reverts(
        bridgeContract.finishDepositCancellation(42003, l2AccountAddress, 1, { from: player2 })
      );
    });
  });
});