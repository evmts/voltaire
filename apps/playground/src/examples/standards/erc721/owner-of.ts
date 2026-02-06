/**
 * ERC-721 ownerOf - Check NFT ownership
 *
 * The ownerOf function returns the owner of a specific token ID.
 */

import { ERC721, Uint256 } from "@tevm/voltaire";

// Token ID to check ownership
const tokenId = Uint256(1234n);

// Encode ownerOf(uint256) calldata
const calldata = ERC721.encodeOwnerOf(tokenId);
const tokenIds = [1n, 100n, 1000n, 10000n];

for (const id of tokenIds) {
	const tid = Uint256(id);
	const data = ERC721.encodeOwnerOf(tid);
}
const tokenURICalldata = ERC721.encodeTokenURI(tokenId);
