// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "../interfaces/IStarknetCore.sol";
import "../interfaces/ISwayToken.sol";

contract SwayBridge is Context {
  ISwayToken public l1TokenContract;
  IStarknetCore public starknetCore;
  uint256 public l2BridgeContract;

  uint256 constant DEPOSIT_SELECTOR =
    1285101517810983806491589552491143496277809242732141897358598292095611420389; // handle_deposit
  uint256 constant CAIRO_PRIME =
    3618502788666131213697322783095070105623107215331596699973092056135872020481;
  uint256 constant BRIDGE_MODE_WITHDRAW = 1; // operation ID sent in the L2 -> L1 message

  event LogDeposit(address indexed l1Sender, uint256 amount, uint256 l2Recipient);
  event LogWithdrawal(address indexed l1Recipient, uint256 amount);

  function splitUint256(uint256 value) internal pure returns (uint256, uint256) {
    uint256 low = value & ((1 << 128) - 1);
    uint256 high = value >> 128;
    return (low, high);
  }

  constructor(address _starknetCore, address _l1TokenContract, uint256 _l2BridgeContract) {
    require(_l2BridgeContract < CAIRO_PRIME, "Bridge/invalid-dest-bridge");

    starknetCore = IStarknetCore(_starknetCore);
    l1TokenContract = ISwayToken(_l1TokenContract);
    l2BridgeContract = _l2BridgeContract;
  }

  /**
    Function used to bridge SWAY from L1 to L2
    @param amount How many SWAY to send from msg.sender
    @param l2Recipient To which L2 address should we deposit the SWAY to
  */
  function deposit(uint256 amount, uint256 l2Recipient) external payable {
      require(amount > 0, "Bridge/zero-amount");
      require(
          l2Recipient != 0 && l2Recipient != l2BridgeContract && l2Recipient < CAIRO_PRIME,
          "Bridge/invalid-recipient"
      );

      uint256[] memory payload = new uint256[](4);
      payload[0] = l2Recipient;
      (payload[1], payload[2]) = splitUint256(amount);
      payload[3] = uint256(uint160(_msgSender()));

      // Store the sender with the nonce in case we need to cancel
      l1TokenContract.transferFrom(msg.sender, address(this), amount);
      starknetCore.sendMessageToL2{value: msg.value}(l2BridgeContract, DEPOSIT_SELECTOR, payload);

      emit LogDeposit(msg.sender, amount, l2Recipient);
  }

  /**
    Function to process the L2 withdrawal
    @param amount How many SWAY were sent from L2
    @param l1Recipient Recipient of the bridged SWAY
  */
  function withdraw(uint256 amount, address l1Recipient) external {
      uint256[] memory payload = new uint256[](4);
      payload[0] = BRIDGE_MODE_WITHDRAW;
      payload[1] = uint256(uint160(l1Recipient));
      (payload[2], payload[3]) = splitUint256(amount);

      // The call to consumeMessageFromL2 will succeed only if a
      // matching L2->L1 message exists and is ready for consumption.
      starknetCore.consumeMessageFromL2(l2BridgeContract, payload);
      l1TokenContract.transfer(l1Recipient, amount);

      emit LogWithdrawal(l1Recipient, amount);
  }

  /**
    Cancels the bridging request from L1 -> L2
    @param amount How many SWAY were sent from L1
    @param l2Recipient Recipient of the bridged SWAY
    @param nonce Nonce of the L1 -> L2 message
  */
  function startDepositCancellation(uint256 amount, uint256 l2Recipient, uint256 nonce) external {
    // build payload
    uint256[] memory payload = new uint256[](4);
    payload[0] = l2Recipient;
    (payload[1], payload[2]) = splitUint256(amount);
    payload[3] = uint256(uint160(_msgSender())); // ensures only original sender can cancel

    // start cancellation process
    starknetCore.startL1ToL2MessageCancellation(l2BridgeContract, DEPOSIT_SELECTOR, payload, nonce);
  }

  /**
    Finishes the cancellationbridging request from L1 -> L2
    @param amount How many SWAY were sent from L1
    @param l2Recipient Recipient of the bridged SWAY
    @param nonce Nonce of the L1 -> L2 message
  */
  function finishDepositCancellation(uint256 amount, uint256 l2Recipient, uint256 nonce) external {
    // build payload
    uint256[] memory payload = new uint256[](4);
    payload[0] = l2Recipient;
    (payload[1], payload[2]) = splitUint256(amount);
    payload[3] = uint256(uint160(_msgSender())); // ensures only original sender can cancel

    // finish cancellation process
    starknetCore.cancelL1ToL2Message(l2BridgeContract, DEPOSIT_SELECTOR, payload, nonce);

    // Transfer back the SWAY tokens
    l1TokenContract.transfer(_msgSender(), amount);
  }
}
