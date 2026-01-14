// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "abdk-libraries-solidity/ABDKMath64x64.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "../interfaces/IAsteroidToken.sol";
import "../interfaces/IAsteroidFeatures.sol";
import "../interfaces/IAsteroidScans.sol";
import "../interfaces/ICrewToken.sol";
import "../interfaces/ISwayToken.sol";
import "../interfaces/ISwayVolumeSource.sol";

contract SwayGovernor is AccessControlUpgradeable, OwnableUpgradeable {
  using ABDKMath64x64 for *;

  uint32 public constant AVERAGE_PERIODS = 30;
  int128 public constant MAX_EMISSION = 653937077413003604; // 0.03545 in 64.64 format
  int128 public constant SENSITIVITY = 17524406870024074035; // 0.95 in 64.64 format

  struct Beneficiary {
    int128 minEmissionRate; // 64.64 format
    uint32 excessEmissionSplit; // Unitless split of excess emissions
  }

  struct Period {
    uint128 volume;
    int128 velocity;
  }

  IAsteroidToken public asteroidTokenContract;
  IAsteroidFeatures public asteroidFeaturesContract;
  IAsteroidScans public asteroidScansContract;
  ICrewToken public crewTokenContract;
  ISwayToken public swayTokenContract;

  mapping (uint256 => bool) private _asteroidTokenCredits; // Mapping from AsteroidToken to credit used
  mapping (uint256 => bool) private _crewTokenCredits; // Mapping from CrewToken to credit used
  mapping (address => bool) private _testerCredits; // Mapping from address to credit used
  bytes32 public testerCreditMerkleRoot; // Merkle root for claiming tester phase1 sway credits

  // List of beneficiaries
  mapping (address => Beneficiary) public beneficiaries;
  address[] public beneficiaryAddresses;

  mapping (uint256 => Period) public periods; // Periods tracking
  address[] public sourceAddresses; // Array to store source addresses

  uint256 public lastProcessedPeriod; // Last processed period
  uint256 public beneficiarySplitTotal; // Total of all beneficiary splits


  // Events -----------------------------------------------------------------------------------------------------------

  event AssignmentSwayClaimed(address account, uint256[] asteroidIds, uint256[] crewmateIds, uint256 amount);
  event TesterPhase1SwayClaimed(address account, uint256 amount);

  event BeneficiaryUpdated(address indexed account, int128 minEmissionRate, uint32 excessEmissionSplit);
  event BeneficiaryRemoved(address indexed account);

  event PeriodProcessed(uint256 indexed period, uint128 volume, int128 velocity, uint256 emission);

  event SourceAdded(address indexed sourceContract);
  event SoureRemoved(address indexed sourceContract);


  // Initialization Functions -----------------------------------------------------------------------------------------

  function initialize(address _swayToken) public initializer {
    __Ownable_init();
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    swayTokenContract = ISwayToken(_swayToken);
  }

  /**
    * @dev set the asteroid and crew token contract addresses
    * @param _asteroidToken AsteroidToken address
    * @param _asteroidFeatures AsteroidFeatures address
    * @param _crewToken CrewToken address
    */
  function linkContracts(
    address _asteroidToken,
    address _asteroidFeatures,
    address _asteroidScans,
    address _crewToken
  ) public onlyRole(DEFAULT_ADMIN_ROLE) {
    asteroidTokenContract = IAsteroidToken(_asteroidToken);
    asteroidFeaturesContract = IAsteroidFeatures(_asteroidFeatures);
    asteroidScansContract = IAsteroidScans(_asteroidScans);
    crewTokenContract = ICrewToken(_crewToken);
  }

  // Source Management Functions --------------------------------------------------------------------------------------

  // Checks whether the source is already in the registered set
  function isSource(address _address) public view returns (bool) {
    for (uint256 i = 0; i < sourceAddresses.length; i++) {
      if (sourceAddresses[i] == _address) return true;
    }

    return false;
  }

  // Register a new source. Sources must implement the ISwayVolumeSource interface
  function addSource(address _address) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(!isSource(_address), "already registered");
    sourceAddresses.push(_address);
    emit SourceAdded(_address);
  }

  // Remove a source
  function removeSource(address _address) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(isSource(_address), "not registered");

    for (uint256 i = 0; i < sourceAddresses.length; i++) {
      if (sourceAddresses[i] == _address) {
        sourceAddresses[i] = sourceAddresses[sourceAddresses.length - 1];
        sourceAddresses.pop();
        break;
      }
    }

    emit SoureRemoved(_address);
  }


  // Beneficiary Management Functions ---------------------------------------------------------------------------------

  /**
   * @dev Loop over beneficiaries and return true if already set
   */
  function isBeneficiary(address _address) public view returns (bool) {
    for (uint256 i = 0; i < beneficiaryAddresses.length; i++) {
      if (beneficiaryAddresses[i] == _address) return true;
    }

    return false;
  }

  function updateBeneficiary(
      address _address,
      int128 _minimumEmissionRate,
      uint32 _excessEmissionSplit
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    Beneficiary storage beneficiary = beneficiaries[_address];

    // reduce total by old split and increase by new split
    beneficiarySplitTotal = beneficiarySplitTotal - beneficiary.excessEmissionSplit + _excessEmissionSplit;
    beneficiary.minEmissionRate = _minimumEmissionRate;
    beneficiary.excessEmissionSplit = _excessEmissionSplit;

    if (!isBeneficiary(_address)) {
      beneficiaryAddresses.push(_address);
    }

    emit BeneficiaryUpdated(_address, _minimumEmissionRate, _excessEmissionSplit);
  }

  function removeBeneficiary(address _address) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(isBeneficiary(_address), "does not exist");
    Beneficiary storage beneficiary = beneficiaries[_address];

    beneficiarySplitTotal -= beneficiary.excessEmissionSplit; // reduce total by old split
    delete beneficiaries[_address];

    for (uint256 i = 0; i < beneficiaryAddresses.length; i++) {
      if (beneficiaryAddresses[i] == _address) {
        beneficiaryAddresses[i] = beneficiaryAddresses[beneficiaryAddresses.length - 1];
        beneficiaryAddresses.pop();
        break;
      }
    }

    emit BeneficiaryRemoved(_address);
  }


  // Period and Emission Functions ------------------------------------------------------------------------------------

  function processPeriod(uint256 period) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(lastProcessedPeriod == 0 || period == lastProcessedPeriod + 1, "already processed");
    require(period < swayTokenContract.currentPeriod() - 1, "not ready");

    // Loop through sources, calculate volume, then velocity and store
    uint256 supply = swayTokenContract.totalSupply();
    uint256 volume = collectVolumes(period);
    int128 velocity = volume.fromUInt().div(supply.fromUInt());

    // Calculate trailing average volume
    int128 avgVelocity = computeAverage(period);

    // Calculate emission based on average and total supply
    uint256 emission = computeEmissions(velocity, avgVelocity, supply);

    // Mint emissions
    uint256 minted = _mintMinimumEmissions(supply);
    if (emission > minted) _mintExcessEmissions(emission - minted);

    // Update state and mark period as processed
    periods[period].volume = uint128(volume);
    periods[period].velocity = velocity;
    lastProcessedPeriod = period;
    emit PeriodProcessed(period, periods[period].volume, periods[period].velocity, emission);
  }

  /**
   * @dev Collect volumes from all sources
   * @param period period to collect volumes for
   */
  function collectVolumes(uint256 period) public view returns (uint256) {
    uint256 volume = 0;

    for (uint256 i = 0; i < sourceAddresses.length; i++) {
      volume += ISwayVolumeSource(sourceAddresses[i]).periodVolume(period);
    }

    return volume;
  }

  /**
   * @dev Compute trailing average velocity
   * @param period period to compute average for
   */
  function computeAverage(uint256 period) public view returns (int128) {
    int128 total = 0;

    for (uint256 i = period; i > period - AVERAGE_PERIODS; i--) {
      if (i == 0) break;
      total += int128(periods[i - 1].velocity);
    }

    return total.div(AVERAGE_PERIODS.fromUInt());
  }

  /**
   * @dev Compute emissions based on velocity and average velocity
   * @param velocity current velocity
   * @param avgVelocity trailing average velocity
   * @param supply current supply
   */
  function computeEmissions(int128 velocity, int128 avgVelocity, uint256 supply) public pure returns (uint256) {
    if (velocity <= avgVelocity) return 0;

    // emission = supply * maxEmission * sensitivity ^ (1 / (avgVelocity - velocity))
    int128 rawEmitRate = 1.fromUInt().div(velocity.sub(avgVelocity)).mul(SENSITIVITY.ln()).exp();

    return supply * uint256(uint128(MAX_EMISSION.mul(rawEmitRate))) / (2 ** 64);
  }

  /**
   * @dev Mint minimum emissions and distribute to beneficiaries
   * @param supply current supply
   */
  function _mintMinimumEmissions(uint256 supply) private returns (uint256) {
    uint256 minted = 0;

    for (uint256 i = 0; i < beneficiaryAddresses.length; i++) {
      Beneficiary storage beneficiary = beneficiaries[beneficiaryAddresses[i]];
      uint256 amount = supply * uint256(uint128(beneficiary.minEmissionRate)) / (2 ** 64);

      if (amount > 0) {
        swayTokenContract.mint(beneficiaryAddresses[i], amount);
        minted += amount;
      }
    }

    return minted;
  }

  /**
   * @dev Mint excess emissions and distribute to beneficiaries
   * @param excess excess emissions to distribute
   */
  function _mintExcessEmissions(uint256 excess) private {
    for (uint256 i = 0; i < beneficiaryAddresses.length; i++) {
      Beneficiary storage beneficiary = beneficiaries[beneficiaryAddresses[i]];
      int128 split = beneficiary.excessEmissionSplit.fromUInt().div(beneficiarySplitTotal.fromUInt());
      uint256 amount = excess * uint256(uint128(split)) / (2 ** 64);

      if (amount > 0) {
        swayTokenContract.mint(beneficiaryAddresses[i], amount);
        excess -= amount;
      }
    }

    // Distribute any remaining excess to the first beneficiary
    if (excess < 0) swayTokenContract.mint(beneficiaryAddresses[0], excess);
  }


  // SWAY Claim Functions ---------------------------------------------------------------------------------------------

  function setTesterCreditMerkleRoot(bytes32 _merkleRoot) public onlyRole(DEFAULT_ADMIN_ROLE) {
    testerCreditMerkleRoot = _merkleRoot;
  }

  /**
    * @dev Claim eligible sway for each "un-claimed" credit for each "owned" asteroid and/or crewmate
    * @param asteroidTokens array of asteroid tokens
    * @param crewTokens array of crew tokens
    */
  function claimAssignmentSway(uint256[] calldata asteroidTokens, uint256[] calldata crewTokens) public {
    uint decimalsAdjust = 10 ** uint256(swayTokenContract.decimals());
    uint total = crewTokens.length * 650_000 * decimalsAdjust;

    // validate and update asteroid token credit(s)
    for (uint i = 0; i < asteroidTokens.length; i++) {
      uint scanOrder = asteroidScansContract.getScanOrder(asteroidTokens[i]);
      require(!_asteroidTokenCredits[asteroidTokens[i]], "already claimed");
      require(scanOrder > 0 && scanOrder <= 11100, "not eligible");
      require(asteroidTokenContract.ownerOf(asteroidTokens[i]) == _msgSender(), "not owner");

      _asteroidTokenCredits[asteroidTokens[i]] = true;

      // calculate sway amount for the current asteroid
      uint radius = asteroidFeaturesContract.getRadius(asteroidTokens[i]);

      // 4 * PI * 2^64
      uint area = (231808622658467920000 * (radius * radius)) / uint(1_000_000); // area convert m2 to km2
      uint modification = (area / uint(18446744073709552000)) * 6922 * decimalsAdjust;

      total = total + modification;
    }

    // verify crew token ownership
    for (uint i = 0; i < crewTokens.length; i++) {
      require(crewTokenContract.ownerOf(crewTokens[i]) == _msgSender(), "not owner");
      require(!_crewTokenCredits[crewTokens[i]], "already claimed");
      _crewTokenCredits[crewTokens[i]] = true;
    }

    swayTokenContract.transfer(_msgSender(), total);
    emit AssignmentSwayClaimed(_msgSender(), asteroidTokens, crewTokens, total);
  }

  /**
    * @dev Claim eligible tester phase1 sway
    * @param proof array merkle proof
    * @param amount SWAY credit amount
    */
  function claimTesterPhase1Sway(bytes32[] calldata proof, uint256 amount) public {
    require(testerCreditMerkleRoot != 0, "root not set");

    // hash the senders address with the amount
    bytes32 leaf = keccak256(abi.encodePacked(_msgSender(), amount));

    // validate the leaf
    require(MerkleProof.verify(proof, testerCreditMerkleRoot, leaf) == true, "invalid proof");
    require(_testerCredits[_msgSender()] != true, "already claimed");

    // flag the credit as used
    _testerCredits[_msgSender()] = true;

    swayTokenContract.transfer(_msgSender(), amount);
    emit TesterPhase1SwayClaimed(_msgSender(), amount);
  }
}
