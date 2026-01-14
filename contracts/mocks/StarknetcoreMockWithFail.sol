// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


contract StarknetcoreWithFailMock {
  /**
    Sends a message to an L2 contract.
  */
  function sendMessageToL2(uint256 to_address, uint256 selector, uint256[] calldata payload) pure external {
    require(to_address != 0, 'FAIL');
    require(selector != 0, 'FAIL');
    require(payload.length != 0, 'FAIL');
    revert('sendMessageToL2/TEST_FAIL');
  }

  /**
    Consumes a message that was sent from an L2 contract.
  */
  function consumeMessageFromL2(uint256 fromAddress, uint256[] calldata payload) pure external returns (bytes32) {
    require(fromAddress != 0, 'FAIL');
    require(payload.length != 0, 'FAIL');
    revert('consumeMessageFromL2/TEST_FAIL');
  }
}
