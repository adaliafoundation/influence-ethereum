// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "../interfaces/IStarknetCore.sol";

contract StarknetSwayVolume is AccessControlUpgradeable, OwnableUpgradeable {
  mapping (uint256 => uint256) private _periodVolumes;
  uint256 public l2SwayContract;
  IStarknetCore public starknetCore;

  function initialize(address _starknetCore, uint256 _l2SwayContract) public initializer {
    __Ownable_init();
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

    l2SwayContract = _l2SwayContract;
    starknetCore = IStarknetCore(_starknetCore);
  }

  function setL2SwayContract(uint256 _l2SwayContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
    l2SwayContract = _l2SwayContract;
  }

  function periodVolume(uint256 period) public view returns (uint256 volume) {
    return _periodVolumes[period];
  }

  function setPeriodVolume(uint256 period, uint256 volume) internal {
    require(_periodVolumes[period] == 0, "Period volume already set");
    _periodVolumes[period] = volume;
  }

  function consumeL2VolumeMessage(uint256 volume, uint256 period) external {
    uint256[] memory payload = new uint256[](2);

    // build message payload
    payload[0] = period;
    payload[1] = volume;

    // update period volume
    setPeriodVolume(period, volume);

    // consume message
    starknetCore.consumeMessageFromL2(l2SwayContract, payload);
  }
}