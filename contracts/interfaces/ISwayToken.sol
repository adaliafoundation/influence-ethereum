// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


interface ISwayToken {

  function currentPeriod() external view returns (uint256);

  function decimals() external returns (uint8);

  function mint(address to, uint256 amount) external;

  function totalSupply() external returns (uint256);

  function transfer(address to, uint256 amount) external returns (bool);

  function transferFrom(address from, address to, uint256 value) external returns (bool success);
}
