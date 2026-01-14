const assert = require('node:assert/strict');
const almostEqual = require('almost-equal');
const truffleAssert = require('truffle-assertions');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const web3EthAbi = require('web3-eth-abi');

const { GOVERNOR_ROLE, TRANSFERRER_ROLE } = require('../lib/constants');
const { advanceTimeAndBlock } = require('../helpers/blockchain.js');

const AsteroidFeatures = artifacts.require('AsteroidFeatures');
const AsteroidScans = artifacts.require('AsteroidScans');
const AsteroidToken = artifacts.require('AsteroidToken');
const CrewToken = artifacts.require('CrewToken');
const Planets = artifacts.require('Planets');
const SwayToken = artifacts.require('SwayToken');
const SwayGovernor = artifacts.require('SwayGovernor');


contract('SwayGovernor', function (accounts) {
  let token, asteroidFeatures, asteroidScans, asteroidToken, crewToken, planets, tokenGovernor, decimalAdjust;

  before(async function() {
    planets = await Planets.new();
    asteroidFeatures = await AsteroidFeatures.new(planets.address);
  });

  beforeEach(async function () {
    asteroidToken = await AsteroidToken.new('INFA', 'INFA');
    asteroidScans = await AsteroidScans.new(asteroidToken.address, asteroidFeatures.address);
    await asteroidScans.addManager(accounts[0]);
    crewToken = await CrewToken.new('INFC', 'INFC');
    token = await SwayToken.new();
    tokenGovernor = await SwayGovernor.new();

    decimalAdjust = 10n ** BigInt(await token.decimals());
    await tokenGovernor.initialize(token.address);

    await token.grantRole(GOVERNOR_ROLE, accounts[0]);
    await token.grantRole(GOVERNOR_ROLE, tokenGovernor.address);
    await token.grantRole(TRANSFERRER_ROLE, tokenGovernor.address);

    await asteroidToken.addManager(accounts[0]);
    await crewToken.addManager(accounts[0]);

    await token.transfer(tokenGovernor.address, 30_000_000_000n * decimalAdjust, { from: accounts[0] });
  });

  describe('initialize', function () {
    it('should set the owner, and the SWAY contract', async function () {
      const owner = await tokenGovernor.owner();
      const tokenAddress = await tokenGovernor.swayTokenContract();

      expect(owner).to.eql(accounts[0]);
      expect(tokenAddress).to.eql(token.address);
    });
  });

  describe('setTesterCreditMerkleRoot', function () {
    it('should set the tester credit merkle root', async function () {
      const root = '0x51ce35310442a07818e7cf9b9740d35b5c10be57a087d828a23ab996f3128b71';
      await tokenGovernor.setTesterCreditMerkleRoot(root);
      const result = await tokenGovernor.testerCreditMerkleRoot();
      expect(result).to.eql(root);
    });
  });

  describe('linkContracts', function () {
    it('should link the specified contracts', async function () {
      await tokenGovernor.linkContracts(
        asteroidToken.address, asteroidFeatures.address, asteroidScans.address, crewToken.address
      );

      const asteroidTokenAddress = await tokenGovernor.asteroidTokenContract();
      const asteroidFeaturesAddress = await tokenGovernor.asteroidFeaturesContract();
      const asteroidScansAddress = await tokenGovernor.asteroidScansContract();
      const crewTokenAddress = await tokenGovernor.crewTokenContract();

      expect(asteroidTokenAddress).to.eql(asteroidToken.address);
      expect(asteroidFeaturesAddress).to.eql(asteroidFeatures.address);
      expect(asteroidScansAddress).to.eql(asteroidScans.address);
      expect(crewTokenAddress).to.eql(crewToken.address);
    });
  });

  describe('claimAssignmentSway', function () {
    beforeEach(async function () {
      await tokenGovernor.linkContracts(
        asteroidToken.address, asteroidFeatures.address, asteroidScans.address, crewToken.address
      );
    });

    it('should transfer the correct amount of sway to the sender [250_000], [1]', async function () {
      await asteroidToken.mint(accounts[1], 250_000);
      await asteroidScans.recordScanOrder(250_000);
      await crewToken.mint(accounts[1]);

      await tokenGovernor.claimAssignmentSway([250_000], [1], { from: accounts[1] });
      const balance = await token.balanceOf(accounts[1]);
      assert.equal(balance.toString(), (739986n * decimalAdjust).toString());
    });

    it('should transfer the correct amount of sway to the sender [1], [1, 2]', async function () {
      await asteroidToken.mint(accounts[2], 1);
      await asteroidScans.recordScanOrder(1);
      await crewToken.mint(accounts[2]);
      await crewToken.mint(accounts[2]);

      await tokenGovernor.claimAssignmentSway([1], [1, 2], { from: accounts[2] });
      const balance = await token.balanceOf(accounts[2]);
      assert.equal(balance.toString(), (12_242_746_248n * decimalAdjust).toString());
    });

    it('should fail if one of the specified asteroids is not owned by the sender', async function () {
      await asteroidToken.mint(accounts[1], 1);
      await asteroidScans.recordScanOrder(1);
      await asteroidToken.mint(accounts[2], 2);
      await asteroidScans.recordScanOrder(2);
      await crewToken.mint(accounts[1]);

      await truffleAssert.reverts(tokenGovernor.claimAssignmentSway([1, 2], [1], { from: accounts[1] }));
    });

    it('should fail if the scan order is 0 / not set', async function () {
      await asteroidToken.mint(accounts[1], 1);
      await crewToken.mint(accounts[1]);
      await truffleAssert.reverts(tokenGovernor.claimAssignmentSway([1], [1], { from: accounts[1] }));
    });

    it('should fail if one of the specified crewmates is not owned by the sender', async function () {
      await asteroidToken.mint(accounts[1], 1);
      await asteroidScans.recordScanOrder(1);
      await asteroidToken.mint(accounts[1], 2);
      await asteroidScans.recordScanOrder(1);
      await crewToken.mint(accounts[2]);

      await truffleAssert.reverts(tokenGovernor.claimAssignmentSway([1, 2], [2], { from: accounts[1] }));
    });

    it('should fail if the credit has already been claimed for one of the specified asteroids', async function () {
      await asteroidToken.mint(accounts[1], 1);
      await asteroidScans.recordScanOrder(1);
      await asteroidToken.mint(accounts[1], 2);
      await asteroidScans.recordScanOrder(1);

      // claim credit for one asteroid
      await tokenGovernor.claimAssignmentSway([1], [], { from: accounts[1] })

      // attempt to clain the credit again
      await truffleAssert.reverts(tokenGovernor.claimAssignmentSway([1, 2], [], { from: accounts[1] }));
    });

    it('should fail if the credit has already been claimed for one of the specified crewmates', async function () {
      await crewToken.mint(accounts[1]);
      await crewToken.mint(accounts[1]);

      // claim credit for one crewmate
      await tokenGovernor.claimAssignmentSway([], [1], { from: accounts[1] })

      // attempt to clain the credit again
      await truffleAssert.reverts(tokenGovernor.claimAssignmentSway([], [1, 2], { from: accounts[1] }));
    });
  });

  describe('claimTesterPhase1Sway', function () {
    const _accounts = [...accounts];
    _accounts.pop(); // remove the last one for fail testing
    const leafNodes = _accounts.map(function (address) {
      const amount = web3EthAbi.encodeParameter('uint256', (1_000).toString());
      return keccak256(
        Buffer.concat([
          Buffer.from(address.replace('0x', ''), 'hex'),
          Buffer.from(amount.replace('0x', ''), 'hex')
        ]
      ))
    });
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const merkleRoot = merkleTree.getHexRoot();

    it('should transfer the correct balance to the sender', async function () {
      const proof = merkleTree.getHexProof(leafNodes[1]);
      const amount = 1_000;
      const leaf = leafNodes[1].toString('hex');

      await tokenGovernor.setTesterCreditMerkleRoot(merkleRoot.toString('hex'));
      await tokenGovernor.claimTesterPhase1Sway(proof, amount, { from: accounts[1] });
      const balance = await token.balanceOf(accounts[1]);
      assert.equal(balance.toNumber(), 1_000);
    });

    it('fail if the merkle root is not set', async function () {
      const proof = merkleTree.getHexProof(leafNodes[1]);
      const amount = 1_000;

      await truffleAssert.reverts(
        tokenGovernor.claimTesterPhase1Sway(proof, amount, { from: accounts[1] }),
        'root not set'
      );
    });

    it('should fail if the credit has already been claimed', async function () {
      const proof = merkleTree.getHexProof(leafNodes[1]);
      const amount = 1_000;

      await tokenGovernor.setTesterCreditMerkleRoot(merkleRoot.toString('hex'));
      await tokenGovernor.claimTesterPhase1Sway(proof, amount, { from: accounts[1] });
      await truffleAssert.reverts(
        tokenGovernor.claimTesterPhase1Sway(proof, amount, { from: accounts[1] }),
        'already claimed'
      );
    });

    it('should fail if no credit exists for the caller', async function () {
      const proof = merkleTree.getHexProof(leafNodes[1]);
      const amount = 1_000;
      await tokenGovernor.setTesterCreditMerkleRoot(merkleRoot.toString('hex'));

      await truffleAssert.reverts(
        tokenGovernor.claimTesterPhase1Sway(proof, amount, { from: accounts[9] }),
        'invalid proof'
      );
    });
  });

  describe('benificiary registration', async function () {
    it('should allow adding a beneficiary', async function () {
      const minEmission = 2n ** 64n / 100n; // 0.01
      const split = 4n;
      await tokenGovernor.updateBeneficiary(accounts[1], minEmission, split, { from: accounts[0] });
      const beneficiary = await tokenGovernor.beneficiaries(accounts[1]);
      expect(beneficiary.minEmissionRate.toString()).to.eql(minEmission.toString());
      expect(beneficiary.excessEmissionSplit.toString()).to.eql(split.toString());
    });

    it('should fail adding beneficiary is not admin', async function () {
      const minEmission = 2n ** 64n / 100n; // 0.01
      const split = 4n;
      await truffleAssert.reverts(
        tokenGovernor.updateBeneficiary(accounts[1], minEmission, split, { from: accounts[1] })
      );
    });

    it('should allow updating a beneficiary', async function () {
      const minEmission = 2n ** 64n / 100n; // 0.01
      const split = 4n;
      await tokenGovernor.updateBeneficiary(accounts[1], minEmission, split, { from: accounts[0] });
      await tokenGovernor.updateBeneficiary(accounts[1], minEmission * 2n, split * 2n, { from: accounts[0] });
      const beneficiary = await tokenGovernor.beneficiaries(accounts[1]);
      expect(beneficiary.minEmissionRate.toString()).to.eql((minEmission * 2n).toString());
      expect(beneficiary.excessEmissionSplit.toString()).to.eql((split * 2n).toString());
    });

    it('should fail to update a beneficiary if not admin', async function () {
      const minEmission = 2n ** 64n / 100n; // 0.01
      const split = 4n;
      await tokenGovernor.updateBeneficiary(accounts[1], minEmission, split, { from: accounts[0] });
      await truffleAssert.reverts(
        tokenGovernor.updateBeneficiary(accounts[1], minEmission * 2n, split * 2n, { from: accounts[1] })
      );
    });

    it('should allow removing a beneficiary', async function () {
      const minEmission = 2n ** 64n / 100n; // 0.01
      const split = 4n;
      await tokenGovernor.updateBeneficiary(accounts[1], minEmission, split, { from: accounts[0] });
      await tokenGovernor.removeBeneficiary(accounts[1], { from: accounts[0] });
      const beneficiary = await tokenGovernor.beneficiaries(accounts[1]);
      expect(beneficiary.minEmissionRate.toString()).to.eql('0');
      expect(beneficiary.excessEmissionSplit.toString()).to.eql('0');
    });

    it('should fail to remove a beneficiary if not admin', async function () {
      const minEmission = 2n ** 64n / 100n; // 0.01
      const split = 4n;
      await tokenGovernor.updateBeneficiary(accounts[1], minEmission, split, { from: accounts[0] });
      await truffleAssert.reverts(
        tokenGovernor.removeBeneficiary(accounts[1], { from: accounts[1] })
      );
    });
  });

  describe('source registration', async function () {
    it('should allow adding a source', async function () {
      await tokenGovernor.addSource(accounts[1], { from: accounts[0] });
      await tokenGovernor.addSource(accounts[2], { from: accounts[0] });
      let source = await tokenGovernor.sourceAddresses(0);
      expect(source).to.eql(accounts[1]);
      source = await tokenGovernor.sourceAddresses(1);
      expect(source).to.eql(accounts[2]);
    });

    it('should fail to add a source if not admin', async function () {
      await truffleAssert.reverts(tokenGovernor.addSource(accounts[1], { from: accounts[1] }));
    });

    it('should allow removing a source', async function () {
      await tokenGovernor.addSource(accounts[1], { from: accounts[0] });
      await tokenGovernor.removeSource(accounts[1], { from: accounts[0] });
      await truffleAssert.reverts(tokenGovernor.sourceAddresses(0));
    });

    it('should fail to remove a source if not admin', async function () {
      await tokenGovernor.addSource(accounts[1], { from: accounts[0] });
      await truffleAssert.reverts(tokenGovernor.removeSource(accounts[1], { from: accounts[1] }));
    });
  });

  describe('emission', async function () {
    it('should compute zero emissions when velocity is lower than target', async function () {
      const velocity = 2n ** 64n / 20n; // 0.05
      const avgVelocity = 2n ** 64n / 10n; // 0.1
      const supply = 100_000_000n;
      const emissions = await tokenGovernor.computeEmissions(velocity, avgVelocity, supply);
      expect(emissions.toString()).to.eql('0');
    });

    it('should correctly compute the emissions', async function () {
      let velocity = 2n ** 64n / 10n; // 0.1
      let avgVelocity = 2n ** 64n / 20n; // 0.05
      let supply = 100_000_000n;
      let emissions = await tokenGovernor.computeEmissions(velocity, avgVelocity, supply);
      expect(emissions.toString()).to.eql('3584859');

      velocity = 2n ** 64n / 4n; // 0.25
      avgVelocity = 2n ** 64n / 20n; // 0.05
      supply = 100_000_000n;
      emissions = await tokenGovernor.computeEmissions(velocity, avgVelocity, supply);
      expect(emissions.toString()).to.eql('7737809');
    });

    it('should process period and mint new SWAY', async function () {
      const minEmission = 2n ** 64n / 100n; // 0.01
      const split = 4n;
      await tokenGovernor.updateBeneficiary(accounts[1], minEmission, split, { from: accounts[0] });
      await tokenGovernor.updateBeneficiary(accounts[2], minEmission / 2n, split, { from: accounts[0] });
      const currentPeriod = await token.currentPeriod();
      let lastPeriod = await tokenGovernor.lastProcessedPeriod();
      expect(lastPeriod.toString()).to.eql('0');

      const period = currentPeriod.toNumber() - 2;
      await tokenGovernor.processPeriod(period);
      const balance1 = await token.balanceOf(accounts[1]);
      const balance2 = await token.balanceOf(accounts[2]);
      lastPeriod = await tokenGovernor.lastProcessedPeriod();
      expect(BigInt(balance1)).to.eql(974999999999999n);
      expect(BigInt(balance2)).to.eql(487499999999999n);
      expect(lastPeriod.toString()).to.eql(period.toString());
    });

    it('should only allow admin to process period', async function () {
      const currentPeriod = await token.currentPeriod();
      await truffleAssert.reverts(tokenGovernor.processPeriod(currentPeriod.toNumber() - 2, { from: accounts[1] }));
    });

    it('should not process period until delay has passed', async function () {
      const minEmission = 2n ** 64n / 100n; // 0.01
      const split = 4n;
      await tokenGovernor.updateBeneficiary(accounts[1], minEmission, split, { from: accounts[0] });
      await tokenGovernor.updateBeneficiary(accounts[2], minEmission / 2n, split, { from: accounts[0] });
      const currentPeriod = await token.currentPeriod();

      await truffleAssert.reverts(tokenGovernor.processPeriod(currentPeriod.toNumber() - 1));
    });

    it('should process a period with excess emissions', async function () {
      let average, balance;
      const tol = 1e-7;

      await token.launch();
      await tokenGovernor.addSource(token.address);
      await tokenGovernor.updateBeneficiary(accounts[2], 2n ** 64n / 100n, 1n, { from: accounts[0] });

      const startPeriod = (await token.currentPeriod()).toNumber();
      await token.transfer(accounts[1], 50_000_000_000n * decimalAdjust, { from: accounts[0] });
      await advanceTimeAndBlock(1_000_000); // advance one period
      await token.transfer(accounts[0], 50_000_000_000n * decimalAdjust, { from: accounts[1] });
      await advanceTimeAndBlock(1_000_000); // advance one period
      await token.transfer(accounts[1], 50_000_000_000n * decimalAdjust, { from: accounts[0] });
      await advanceTimeAndBlock(1_000_000); // advance one period
      await token.transfer(accounts[0], 5_000_000_000n * decimalAdjust, { from: accounts[1] });
      await advanceTimeAndBlock(2_000_000); // advance two periods

      await tokenGovernor.processPeriod(startPeriod);
      average = await tokenGovernor.computeAverage(startPeriod);
      balance = await token.balanceOf(accounts[2]);
      expect(almostEqual(Number(average.toString()) / 2 ** 64, 0, 0, tol)).to.eql(true);
      expect(almostEqual(Number(balance.toString()), 11_376_920_572 * 1_000_000, 0, tol)).to.eql(true);

      await tokenGovernor.processPeriod(startPeriod + 1);
      average = await tokenGovernor.computeAverage(startPeriod + 1);
      balance = await token.balanceOf(accounts[2]);
      expect(almostEqual(Number(average.toString()) / 2 ** 64, 0.01282051282, 0, tol)).to.eql(true);
      expect(almostEqual(Number(balance.toString()), 23_539_395_225 * 1_000_000, 0, tol)).to.eql(true);

      await tokenGovernor.processPeriod(startPeriod + 2);
      average = await tokenGovernor.computeAverage(startPeriod + 2);
      balance = await token.balanceOf(accounts[2]);
      expect(almostEqual(Number(average.toString()) / 2 ** 64, 0.02460932998, 0, tol)).to.eql(true);
      expect(almostEqual(Number(balance.toString()), 36_487_962_023 * 1_000_000, 0, tol)).to.eql(true);

      await tokenGovernor.processPeriod(startPeriod + 3);
      average = await tokenGovernor.computeAverage(startPeriod + 3);
      balance = await token.balanceOf(accounts[2]);
      expect(almostEqual(Number(average.toString()) / 2 ** 64, 0.03546430739, 0, tol)).to.eql(true);
      expect(almostEqual(Number(balance.toString()), 38_152_841_644 * 1_000_000, 0, tol)).to.eql(true);
    });
  });
});