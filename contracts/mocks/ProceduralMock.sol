// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../lib/Procedural.sol";


/**
 * @dev Mock of Procedural allows utilizing the library from within js tests
 */
contract ProceduralMock {
  using Procedural for bytes32;

  bytes32 internal rootNode;

  constructor(bytes32 _seed) {
    rootNode = _seed;
  }

  function derive(string memory _entropy) public view returns (bytes32) {
    return rootNode.derive(_entropy);
  }

  function derive(int256 _entropy) public view returns (bytes32) {
    return rootNode.derive(_entropy);
  }

  function derive(uint _entropy) public view returns (bytes32) {
    return rootNode.derive(_entropy);
  }

  function getHash() public view returns (bytes32) {
    return rootNode.getHash();
  }

  function getInt128() public view returns (int128) {
    return rootNode.getInt128();
  }

  function getReal() public view returns (int128) {
    return rootNode.getReal();
  }

  function getIntBetween(int128 _low, int128 _high) public view returns (int64) {
    return rootNode.getIntBetween(_low, _high);
  }

  function getNormalIntBetween(int128 _low, int128 _high) public view returns (int64) {
    return rootNode.getNormalIntBetween(_low, _high);
  }

  function getDecayingIntBelow(uint _high) public view returns (int64) {
    return rootNode.getDecayingIntBelow(_high);
  }
}
