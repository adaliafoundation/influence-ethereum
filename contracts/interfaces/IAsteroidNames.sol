// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


interface IAsteroidNames {
  function getName(uint _asteroidId) external pure returns (string memory);
}
