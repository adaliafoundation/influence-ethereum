// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../interfaces/ICrew.sol";
import "../interfaces/IStarknetCore.sol";
import "../lib/InfluenceRoles.sol";
import "../lib/InfluenceUtils.sol";

contract CrewBridge is AccessControlUpgradeable, OwnableUpgradeable {
  ICrew public l1TokenContract;
  IStarknetCore public starknetCore;
  uint256 public l2BridgeContract;
  mapping (address => bool) private _managers;

  uint256 constant BRIDGE_MODE_WITHDRAW = 1;
  uint256 constant CAIRO_PRIME =
    3618502788666131213697322783095070105623107215331596699973092056135872020481;
  uint256 constant L2_BRIDGE_SELECTOR =
    1157548185917827836691019656633924546219803202764187478285065005547416801023; // bridge_from_l1

  function initialize (address _starknetCore, address _l1TokenContract, uint256 _l2BridgeContract) public initializer {
    require(_starknetCore != address(0), "Bridge/invalid-starknet-core-address");
    require(_l2BridgeContract != 0, "Bridge/invalid-l2-bridge-address");

    starknetCore = IStarknetCore(_starknetCore);
    l1TokenContract = ICrew(_l1TokenContract);
    l2BridgeContract = _l2BridgeContract;

    __Ownable_init();

    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _setupRole(InfluenceRoles.MANAGER_ROLE, _msgSender());
  }

  // Utils
  function addressToUint(address value) internal pure returns (uint256 convertedValue) {
    convertedValue = uint256(uint160(address(value)));
  }

  // Events
  event BridgeToStarknet(
    address l1Contract,
    address l1Account,
    uint256 l2Account,
    uint256 tokenId
  );

  event BridgeFromStarknet(
    uint256 l2Account,
    address l1Contract,
    address l1Account,
    uint256 tokenId
  );

  // setters
  function setL1TokenContract(address _l1TokenContract) external onlyRole(InfluenceRoles.MANAGER_ROLE) {
    l1TokenContract = ICrew(_l1TokenContract);
  }

  function setL2BridgeContract(uint256 _l2BridgeContract) external onlyRole(InfluenceRoles.MANAGER_ROLE) {
    l2BridgeContract = _l2BridgeContract;
  }

  // Bridging to Starknet
  function bridgeToStarknet(uint256[] calldata tokenIds, uint256 l2Recipient) external payable {
    require(
      l2Recipient != 0 && l2Recipient != l2BridgeContract && l2Recipient < CAIRO_PRIME,
      "Bridge/invalid-recipient"
    );
    require(tokenIds.length <= 25, "Bridge/too-many-tokens");

    // build payload
    uint256[] memory payload = new uint256[](3 + tokenIds.length);
    payload[0] = l2Recipient;
    payload[1] = uint256(uint160(_msgSender()));
    payload[2] = tokenIds.length;

    for (uint256 i = 0; i < tokenIds.length; i++) {
      require(l1TokenContract.ownerOf(tokenIds[i]) == _msgSender(), 'Invalid token');

      l1TokenContract.burn(tokenIds[i]);
      payload[3 + i] = tokenIds[i];

      emit BridgeToStarknet(address(l1TokenContract), _msgSender(), l2Recipient, tokenIds[i]);
    }

    // send message to L2
    starknetCore.sendMessageToL2{value: msg.value}(l2BridgeContract, L2_BRIDGE_SELECTOR, payload);
  }

  // Bridging back from Starknet
  function bridgeFromStarknet(uint256[] calldata tokenIds, uint256 l2AccountAddress) external {
    uint256[] memory payload = new uint256[](4 + tokenIds.length);

    // build withdraw message payload
    payload[0] = BRIDGE_MODE_WITHDRAW;
    payload[1] = l2BridgeContract;
    payload[2] = l2AccountAddress;
    payload[3] = addressToUint(_msgSender());

    for (uint256 i = 0; i < tokenIds.length; i++) {
      l1TokenContract.mint(_msgSender(), tokenIds[i]);
      payload[4 + i] = tokenIds[i];

      emit BridgeFromStarknet(l2AccountAddress, address(l1TokenContract), _msgSender(), tokenIds[i]);
    }

    // consume withdraw message
    starknetCore.consumeMessageFromL2(l2BridgeContract, payload);
  }

  /**
    Cancels the bridging request from L1 -> L2
    @param tokenIds Tokens sent from L1
    @param l2Recipient Recipient of the bridged token(s)
    @param nonce Nonce of the L1 -> L2 message
  */
  function startBridgeToStarknetCancellation(uint256[] calldata tokenIds, uint256 l2Recipient, uint256 nonce) external {
    // build payload
    uint256[] memory payload = new uint256[](4);
    payload[0] = l2Recipient;
    payload[1] = addressToUint(_msgSender());
    payload[2] = tokenIds.length;

    for (uint256 i = 0; i < tokenIds.length; i++) {
      payload[3 + i] = tokenIds[i];
    }

    // start cancellation process
    starknetCore.startL1ToL2MessageCancellation(l2BridgeContract, L2_BRIDGE_SELECTOR, payload, nonce);
  }

  /**
    Finishes the cancellationbridging request from L1 -> L2
    @param tokenIds Tokens sent from L1
    @param l2Recipient Recipient of the bridged token(s)
    @param nonce Nonce of the L1 -> L2 message
  */
  function finishBridgeToStarknetCancellation(uint256[] calldata tokenIds, uint256 l2Recipient, uint256 nonce) external {
    // build payload
    uint256[] memory payload = new uint256[](4);
    payload[0] = l2Recipient;
    payload[1] = addressToUint(_msgSender());
    payload[2] = tokenIds.length;

    for (uint256 i = 0; i < tokenIds.length; i++) {
      payload[3 + i] = tokenIds[i];

      // Re-mint assets
      l1TokenContract.mint(_msgSender(), tokenIds[i]);
    }

    // finish cancellation process
    starknetCore.cancelL1ToL2Message(l2BridgeContract, L2_BRIDGE_SELECTOR, payload, nonce);
  }
}
