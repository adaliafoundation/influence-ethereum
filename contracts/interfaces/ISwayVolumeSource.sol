// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


interface ISwayVolumeSource {

  function periodVolume(uint256 period) external view returns (uint256);
}