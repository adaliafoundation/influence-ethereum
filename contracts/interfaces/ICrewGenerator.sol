// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


interface ICrewGenerator {

  function setSeed(bytes32 _seed) external;

  function getFeatures(uint _crewId, uint _mod) external view returns (uint);
}
