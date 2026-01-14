// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


contract StarknetcoreMock {
  mapping (bytes32 => bool) private _messages; // maps nonce to sender address

  // Events
  event SendMessageToL2(
    uint256 to_address,
    uint256 selector,
    uint256[] payload
  );

  function _encodeMessage(uint256[] calldata payload) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(payload));
  }

  /**
    Sends a message to an L2 contract.
  */
  function sendMessageToL2(
    uint256 to_address,
    uint256 selector,
    uint256[] calldata payload
  ) external payable returns (bytes32, uint256) {
    require(to_address != 0);
    require(selector != 0);
    require(payload.length != 0);
    _messages[_encodeMessage(payload)] = true;
    emit SendMessageToL2(to_address, selector, payload);
    return ('foo', 1);
  }

  /**
    Consumes a message that was sent from an L2 contract.
  */
  function consumeMessageFromL2(uint256 fromAddress, uint256[] calldata payload) external pure returns (bytes32) {
    require(fromAddress != 0, 'Invalid fromAddress');
    require(payload.length != 0, 'Invalid payload');
    return 'foo';
  }

  function startL1ToL2MessageCancellation(
    uint256 fromAddress,
    uint256 selector,
    uint256[] calldata payload,
    uint256 nonce) external view returns (bytes32) {
    require(fromAddress != 0, 'Invalid fromAddress');
    require(selector != 0, 'Invalid selector');
    require(payload.length != 0, 'Invalid payload');
    require(nonce != 0, 'Invalid nonce');
    require(_messages[_encodeMessage(payload)], 'Invalid message');
    return 'foo';
  }

  function cancelL1ToL2Message(
    uint256 fromAddress,
    uint256 selector,
    uint256[] calldata payload,
    uint256 nonce) external view returns (bytes32) {
    require(fromAddress != 0, 'Invalid fromAddress');
    require(selector != 0, 'Invalid selector');
    require(payload.length != 0, 'Invalid payload');
    require(nonce != 0, 'Invalid nonce');
    require(_messages[_encodeMessage(payload)], 'Invalid message');
    return 'foo';
  }
}
