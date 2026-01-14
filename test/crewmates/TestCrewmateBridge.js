const CrewToken = artifacts.require('CrewToken');
const CrewmateToken = artifacts.require('CrewmateToken');
const CrewmateBridge = artifacts.require('CrewmateBridge');
const CrewFeatures = artifacts.require('CrewFeatures');
const ArvadCitizenGenerator = artifacts.require('ArvadCitizenGenerator');
const StarknetcoreMock = artifacts.require('StarknetcoreMock');
const StarknetcoreWithFailMock = artifacts.require('StarknetcoreWithFailMock');
const truffleAssert = require('truffle-assertions');
const utils = require('web3-utils');
const { MANAGER_ROLE, ZERO_ADDRESS } = require('../lib/constants');

contract('CrewmateBridge', (accounts) => {
  let crewTokenContract;
  let crewmateTokenContract;
  let bridgeContract;
  let crewFeaturesContract;
  let generatorContract;
  let starknetcoreContract;
  let starknetcoreWithFailContract;
  const _l2BridgeContract = utils.randomHex(31);
  const l2AccountAddress = utils.randomHex(31);

  before(async function () {
    starknetcoreContract = await StarknetcoreMock.new()
    starknetcoreWithFailContract = await StarknetcoreWithFailMock.new();
  });

  beforeEach(async function () {
    crewTokenContract = await CrewToken.new('Influence Crew', 'INFC');
    crewmateTokenContract = await CrewmateToken.new();
    await crewmateTokenContract.initialize('Influence Crewmates', 'INFCRM');

    crewFeaturesContract = await CrewFeatures.new();
    generatorContract = await ArvadCitizenGenerator.new();

    bridgeContract = await CrewmateBridge.new()
    await bridgeContract.initialize(
      starknetcoreContract.address,
      crewTokenContract.address,
      crewmateTokenContract.address,
      crewFeaturesContract.address,
      _l2BridgeContract
    );

    await crewTokenContract.addManager(accounts[0]);
    await crewTokenContract.addManager(bridgeContract.address);

    await crewmateTokenContract.grantRole(MANAGER_ROLE, bridgeContract.address);

    await crewFeaturesContract.addManager(accounts[0]);
    await generatorContract.addManager(accounts[0]);
    await generatorContract.addManager(crewFeaturesContract.address);

    await crewFeaturesContract.setGenerator(1, generatorContract.address);
    await crewFeaturesContract.setGeneratorSeed(1, '0x02342342');

    await crewFeaturesContract.setToken(1, 1, 0);
    await crewFeaturesContract.setToken(2, 1, 0);
  });

  describe('bridgeToStarknet', function () {
    it('should burn the token if owned on CrewToken contract', async function () {
      await crewTokenContract.mint(accounts[1]);
      await crewTokenContract.mint(accounts[1]);
      const receipt = await bridgeContract.bridgeToStarknet(
        [1, 2],
        l2AccountAddress,
        { from: accounts[1] }
      );

      truffleAssert.eventEmitted(receipt, 'BridgeToStarknet', (e) => {
        return ['1584572922429724691384504427009', '633830136629053276362744276481'].includes(e.features.toString())
          && ['1', '2'].includes(e.tokenId.toString());
        return true;
      });
      const result = await crewTokenContract.ownerOf(1);
      assert.equal(result, ZERO_ADDRESS);
    });

    it('should burn the token if owned on the CrewmateToken contract', async function () {
      await crewmateTokenContract.mint(accounts[1], 1);

      await bridgeContract.bridgeToStarknet(
        [1],
        l2AccountAddress,
        { from: accounts[1] }
      );

      await truffleAssert.fails(
        crewmateTokenContract.ownerOf(1),
        truffleAssert.ErrorType.REVERT,
        'ERC721: invalid token ID'
      );
    });

    it('should fail if the token is not owned by the caller on the either contract', async function () {
      // mint a token
      await crewTokenContract.mint(accounts[2]);

      await truffleAssert.fails(
        bridgeContract.bridgeToStarknet(
          [1],
          l2AccountAddress,
          { from: accounts[1] }
        ),
        truffleAssert.ErrorType.REVERT,
        'ERC721: invalid token ID'
      );
    });

    it('should revert if sendMessageToL2 fails/reverts', async function () {
      bridgeContract = await CrewmateBridge.new()
      await bridgeContract.initialize(
        starknetcoreWithFailContract.address,
        crewTokenContract.address,
        crewmateTokenContract.address,
        crewFeaturesContract.address,
        _l2BridgeContract
      );

      await crewTokenContract.mint(accounts[1]);
      await crewTokenContract.addManager(bridgeContract.address);

      await truffleAssert.fails(
        bridgeContract.bridgeToStarknet([1], l2AccountAddress, { from: accounts[1] }),
        truffleAssert.ErrorType.REVERT,
        'sendMessageToL2/TEST_FAIL'
      );

      const result = await crewTokenContract.ownerOf(1);
      assert.equal(result, accounts[1]);
    });
  });

  describe('bridgeFromStarknet', function () {
    it('should mint the specified token on the CrewmateToken contract if non owned', async function () {
      await bridgeContract.bridgeFromStarknet([5,6], l2AccountAddress, { from: accounts[1] });

      const results = await Promise.all([
        crewmateTokenContract.ownerOf(5),
        crewmateTokenContract.ownerOf(6)
      ]);

      assert.equal(results[0], accounts[1]);
      assert.equal(results[1], accounts[1]);
    });

    it('should revert if the consumeMessageFromL2 fails/reverts', async function() {
      bridgeContract = await CrewmateBridge.new();
      await bridgeContract.initialize(
        starknetcoreWithFailContract.address,
        crewTokenContract.address,
        crewmateTokenContract.address,
        crewFeaturesContract.address,
        _l2BridgeContract
      );

      await crewmateTokenContract.grantRole(MANAGER_ROLE, bridgeContract.address);

      await truffleAssert.fails(
        bridgeContract.bridgeFromStarknet([1], l2AccountAddress, { from: accounts[1] }),
        truffleAssert.ErrorType.REVERT,
        'consumeMessageFromL2/TEST_FAIL'
      );
    });
  });

  describe('startBridgeToStarknetCancellation', function () {
    it('should not fail if the caller is the original sender', async function () {
      await crewTokenContract.mint(accounts[1]);

      await bridgeContract.bridgeToStarknet(
        [1],
        l2AccountAddress,
        { from: accounts[1] }
      );

      await bridgeContract.startBridgeToStarknetCancellation(
        [l2AccountAddress, 2, 1, 1584572922429724691384504427009n],
        1,
        { from: accounts[1] }
      );
    });

    it('should fail if the caller is not the original sender', async function () {
      await crewTokenContract.mint(accounts[1]);

      await bridgeContract.bridgeToStarknet(
        [1],
        l2AccountAddress,
        { from: accounts[1] }
      );

      await truffleAssert.fails(
        bridgeContract.startBridgeToStarknetCancellation(
          [l2AccountAddress, 2, 1, 1584572922429724691384504427009n],
          1,
          { from: accounts[2] }
        )
      )
    });
  });
});
