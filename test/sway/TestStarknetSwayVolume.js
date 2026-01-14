const StarknetSwayVolume = artifacts.require('StarknetSwayVolume');
const StarknetcoreMock = artifacts.require('StarknetcoreMock');
const utils = require('web3-utils');
const truffleAssert = require('truffle-assertions');

contract('StarknetSwayVolume', (accounts) => {
  let starknetSwayVolumeContract;
  let starknetcoreContract;
  let l2SwayContract = utils.randomHex(32);

  beforeEach(async function () {
    starknetSwayVolumeContract = await StarknetSwayVolume.new();
    starknetcoreContract = await StarknetcoreMock.new()

    await starknetSwayVolumeContract.initialize(starknetcoreContract.address, l2SwayContract);
  });

  describe('consumeL2VolumeMessage', function () {
    it('should set the volume data for the period, if not already set', async function () {
      await starknetSwayVolumeContract.consumeL2VolumeMessage(1_000_000, 1);
      const result = await starknetSwayVolumeContract.periodVolume(1);
      assert.equal(result, 1000000n);
    });

    it('should FAIL if already set', async function () {
      await starknetSwayVolumeContract.consumeL2VolumeMessage(1_000_000, 1);

      await truffleAssert.fails(
        starknetSwayVolumeContract.consumeL2VolumeMessage(1_000_000, 1),
        truffleAssert.ErrorType.REVERT,
        'Period volume already set'
      );
    });
  });
});