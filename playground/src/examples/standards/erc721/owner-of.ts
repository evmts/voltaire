/**
 * ERC-721 ownerOf - Check NFT ownership
 *
 * The ownerOf function returns the owner of a specific token ID.
 */

import { Uint256, ERC721 } from "@tevm/voltaire";

// Token ID to check ownership
const tokenId = Uint256(1234n);

// Encode ownerOf(uint256) calldata
const calldata = ERC721.encodeOwnerOf(tokenId);

console.log("=== ERC-721 ownerOf Encoding ===");
console.log("Token ID:", tokenId.toString());
console.log("Selector:", ERC721.SELECTORS.ownerOf);
console.log("\nEncoded calldata:", calldata);

// Breakdown of the calldata
console.log("\n=== Calldata Breakdown ===");
console.log("Selector (4 bytes):", calldata.slice(0, 10));
console.log("Token ID (32 bytes):", "0x" + calldata.slice(10));

// Example: Checking multiple token IDs
console.log("\n=== Checking Multiple Token IDs ===");
const tokenIds = [1n, 100n, 1000n, 10000n];

for (const id of tokenIds) {
	const tid = Uint256(id);
	const data = ERC721.encodeOwnerOf(tid);
	console.log(`Token #${id}: ${data}`);
}

// Example: Checking tokenURI for metadata
console.log("\n=== Checking Token Metadata ===");
const tokenURICalldata = ERC721.encodeTokenURI(tokenId);
console.log("tokenURI calldata:", tokenURICalldata);

// Note: ownerOf will revert if token doesn't exist
console.log("\n=== Important Notes ===");
console.log("- ownerOf reverts if tokenId does not exist");
console.log("- Returns the owner address (not zero address)");
console.log("- Use try/catch when calling to handle non-existent tokens");
