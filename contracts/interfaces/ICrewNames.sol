// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


interface ICrewNames {
  function getName(uint _crewId) external pure returns (string memory);
}
