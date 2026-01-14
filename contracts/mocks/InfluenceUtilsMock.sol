// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../lib/InfluenceUtils.sol";

contract InfluenceUtilsMock {

  function strToUint(string memory _str) public pure returns(uint256 res) {
    return InfluenceUtils.strToUint(_str);
  }

  function packFeatures(uint256[6] memory values) public pure returns (uint256 packed){
    return InfluenceUtils.packFeatures(values);
  } 
}
