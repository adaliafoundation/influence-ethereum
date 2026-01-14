// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../lib/InfluenceSettings.sol";
import "../lib/Procedural.sol";
import "../interfaces/IAsteroidFeatures.sol";


/**
 * @dev Contract that generates randomized perks based on when the asteroid is "scanned" by its owner. Perks
 * are specific to certain types of asteroids, have varying degrees of rarity and can stack.
 */
contract ScansMock {
  using Procedural for bytes32;

  IAsteroidFeatures internal features;

  constructor(IAsteroidFeatures _features) {
    features = _features;
  }
  /**
   * @dev Returns a set of 0 or more perks for the asteroid randomized by time / owner address
   * @param _asteroidId The ERC721 token ID of the asteroid
   */
  function finalizeScan(uint _asteroidId, uint purchaseOrder, bytes32 _bhash) public view returns (uint) {
    // Capture the bonuses bitpacked into a uint. The first bit is set to indicate the asteroid has been scanned.
    uint bonuses = 1;
    uint bonusTest;
    bytes32 seed = features.getAsteroidSeed(_asteroidId);
    uint spectralType = features.getSpectralTypeBySeed(seed);

    // Add some randomness to the bonuses outcome
    uint bhash = uint(_bhash);

    // bhash == 0 if we're later than 256 blocks after startScan, this will default to no bonus
    if (bhash != 0) {
      seed = seed.derive(bhash);

      // Array of possible bonuses (0 or 1) per spectral type (same order as spectral types in AsteroidFeatures)
      uint8[6][11] memory bonusRates = [
        [ 1, 1, 0, 1, 0, 0 ],
        [ 1, 1, 1, 1, 0, 1 ],
        [ 1, 1, 0, 1, 0, 0 ],
        [ 1, 1, 1, 1, 1, 1 ],
        [ 1, 1, 1, 1, 1, 1 ],
        [ 1, 1, 1, 1, 1, 1 ],
        [ 1, 0, 1, 0, 1, 1 ],
        [ 1, 0, 1, 0, 1, 1 ],
        [ 1, 1, 1, 0, 1, 1 ],
        [ 1, 0, 1, 0, 0, 1 ],
        [ 1, 1, 0, 0, 0, 0 ]
      ];

      // Boosts the bonus chances based on early scan tranches
      int128 rollMax = 10001;

      if (purchaseOrder < 100) {
        rollMax = 3441; // 4x increase
      } else if (purchaseOrder < 1100) {
        rollMax = 4143; // 3x increase
      } else if (purchaseOrder < 11100) {
        rollMax = 5588; // 2x increase
      }

      // Loop over the possible bonuses for the spectral class
      for (uint i = 0; i < 6; i++) {

        // Handles the case for regular bonuses
        if (i < 4 && bonusRates[spectralType][i] == 1) {
          bonusTest = uint(uint64(seed.derive(i).getIntBetween(0, rollMax)));

          if (bonusTest <= 2100) {
            if (bonusTest > 600) {
              bonuses = bonuses | (1 << (i * 3 + 1)); // Tier 1 regular bonus (15% of asteroids)
            } else if (bonusTest > 100) {
              bonuses = bonuses | (1 << (i * 3 + 2)); // Tier 2 regular bonus (5% of asteroids)
            } else {
              bonuses = bonuses | (1 << (i * 3 + 3)); // Tier 3 regular bonus (1% of asteroids)
            }
          }
        }

        // Handle the case for the special bonuses
        if (i >= 4 && bonusRates[spectralType][i] == 1) {
          bonusTest = uint(uint64(seed.derive(i).getIntBetween(0, rollMax)));

          if (bonusTest <= 250) {
            bonuses = bonuses | (1 << (i + 9)); // Single tier special bonus (2.5% of asteroids)
          }
        }
      }

      // Guarantees at least a level 1 yield bonus for the early adopters
      if (purchaseOrder < 11100 && bonuses == 1) {
        bonuses = 3;
      }
    }

    return bonuses;
  }
}
