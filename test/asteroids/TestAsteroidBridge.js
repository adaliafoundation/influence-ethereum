const AsteroidToken = artifacts.require('AsteroidToken');
const AsteroidBridge = artifacts.require('AsteroidBridge');
const StarknetcoreMock = artifacts.require('StarknetcoreMock');
const StarknetcoreWithFailMock = artifacts.require('StarknetcoreWithFailMock');
const truffleAssert = require('truffle-assertions');
const utils = require('web3-utils');
const { ZERO_ADDRESS } = require('../lib/constants');

contract('AsteroidBridge', (accounts) => {
  let asteroidTokenContract;
  let bridgeContract;
  let starknetcoreContract;
  let starknetcoreWithFailContract;
  const _l2BridgeContract = utils.randomHex(31);
  const l2AccountAddress = utils.randomHex(31);

  before('bootstrap test suite', async () => {
    asteroidTokenContract = await AsteroidToken.new('Influence Asteroids', 'INFA');
    starknetcoreContract = await StarknetcoreMock.new()
    starknetcoreWithFailContract = await StarknetcoreWithFailMock.new();
    bridgeContract = await AsteroidBridge.new()

    await bridgeContract.initialize(
      starknetcoreContract.address,
      asteroidTokenContract.address,
      _l2BridgeContract
    )

    await asteroidTokenContract.addManager(accounts[0]);
    await asteroidTokenContract.addManager(bridgeContract.address);
  });

  describe('bridgeToStarknet', function () {
    it('should burn the token if owned', async function () {
      await asteroidTokenContract.mint(accounts[1], 1);

      await bridgeContract.bridgeToStarknet(
        [1],
        l2AccountAddress,
        { from: accounts[1] }
      );

      const result = await asteroidTokenContract.ownerOf(1);
      assert.equal(result, ZERO_ADDRESS);
    });

    it('should fail if the token is not owned by the caller', async function () {
      // mint a token
      await asteroidTokenContract.mint(accounts[2], 2);

      await truffleAssert.fails(
        bridgeContract.bridgeToStarknet(
          [2],
          l2AccountAddress,
          { from: accounts[1] }
        ),
        truffleAssert.ErrorType.REVERT,
        'Invalid token'
      );
    });
  });

  describe('bridgeFromStarknet', function () {
    it('should mint the specified token(s)', async function () {
      await bridgeContract.bridgeFromStarknet([3, 4], l2AccountAddress, { from: accounts[1] });

      const results = await Promise.all([asteroidTokenContract.ownerOf(3), asteroidTokenContract.ownerOf(4)]);
      assert.equal(results[0], accounts[1]);
      assert.equal(results[1], accounts[1]);
    });

    it('should revert if the consumeMessageFromL2 fails/reverts', async function() {
      const bridge = await AsteroidBridge.new()
      await bridge.initialize(
        starknetcoreWithFailContract.address,
        asteroidTokenContract.address,
        _l2BridgeContract
      );

      await asteroidTokenContract.addManager(bridge.address);

      await truffleAssert.fails(
        bridge.bridgeFromStarknet([5], l2AccountAddress, { from: accounts[1] }),
        truffleAssert.ErrorType.REVERT,
        'consumeMessageFromL2/TEST_FAIL'
      );
    });
  });

  describe('startBridgeToStarknetCancellation', function () {
    it('should not fail if the caller is the original sender', async function () {
      await asteroidTokenContract.mint(accounts[1], 100);

      await bridgeContract.bridgeToStarknet(
        [100],
        l2AccountAddress,
        { from: accounts[1] }
      );

      await bridgeContract.startBridgeToStarknetCancellation(
        [100],
        l2AccountAddress,
        1,
        { from: accounts[1] }
      );
    });

    it('should fail if the caller is not the original sender', async function () {
      await asteroidTokenContract.mint(accounts[1], 101);

      await bridgeContract.bridgeToStarknet(
        [101],
        l2AccountAddress,
        { from: accounts[1] }
      );

      await truffleAssert.fails(
        bridgeContract.startBridgeToStarknetCancellation(
          [102],
          l2AccountAddress,
          1,
          { from: accounts[2] }
        )
      )
    });
  });

  describe('finishBridgeToStarknetCancellation', function () {
    it('should not fail if the caller is the original sender and re-mint', async function () {
      await asteroidTokenContract.mint(accounts[1], 110);

      await bridgeContract.bridgeToStarknet(
        [110],
        l2AccountAddress,
        { from: accounts[1] }
      );

      await bridgeContract.finishBridgeToStarknetCancellation(
        [110],
        l2AccountAddress,
        1,
        { from: accounts[1] }
      );

      const result = await asteroidTokenContract.ownerOf(110);
      assert.equal(result, accounts[1]);
    });

    it('should fail if the caller is not the original sender', async function () {
      await asteroidTokenContract.mint(accounts[1], 111);

      await bridgeContract.bridgeToStarknet(
        [111],
        l2AccountAddress,
        { from: accounts[1] }
      );

      await truffleAssert.fails(
        bridgeContract.finishBridgeToStarknetCancellation(
          [111],
          l2AccountAddress,
          1,
          { from: accounts[2] }
        )
      )
    });
  });
});