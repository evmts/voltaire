/**
 * ERC-721 safeTransferFrom - Safe NFT transfer encoding
 *
 * The safeTransferFrom function transfers ownership of an NFT and
 * checks if the recipient can handle NFTs (implements ERC721Receiver).
 */

import { Address, ERC721, Uint256 } from "@tevm/voltaire";

// Setup safe transfer parameters
const from = Address("0xABc0000000000000000000000000000000000001"); // Current owner
const to = Address("0xDef0000000000000000000000000000000000002"); // New owner
const tokenId = Uint256(42n);

// Encode safeTransferFrom(address,address,uint256) calldata
const calldata = ERC721.encodeSafeTransferFrom(from, to, tokenId);
