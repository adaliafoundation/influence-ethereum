// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";


interface ICrew is IERC721 {

  function burn(uint _tokenId) external;

  function mint(address _to, uint _tokenId) external;

  function ownerOf(uint tokenId) external view override returns (address);

  function transferFrom(address from, address to, uint256 tokenId) external override;
}
