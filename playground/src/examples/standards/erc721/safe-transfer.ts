/**
 * ERC-721 safeTransferFrom - Safe NFT transfer encoding
 *
 * The safeTransferFrom function transfers ownership of an NFT and
 * checks if the recipient can handle NFTs (implements ERC721Receiver).
 */

import { Address, Uint256, ERC721 } from "@tevm/voltaire";

// Setup safe transfer parameters
const from = Address("0xABc0000000000000000000000000000000000001"); // Current owner
const to = Address("0xDef0000000000000000000000000000000000002"); // New owner
const tokenId = Uint256(42n);

// Encode safeTransferFrom(address,address,uint256) calldata
const calldata = ERC721.encodeSafeTransferFrom(from, to, tokenId);

console.log("=== ERC-721 safeTransferFrom Encoding ===");
console.log("From:", "0xABc0000000000000000000000000000000000001");
console.log("To:", "0xDef0000000000000000000000000000000000002");
console.log("Token ID:", tokenId.toString());
console.log("Selector:", ERC721.SELECTORS.safeTransferFrom);
console.log("\nEncoded calldata:", calldata);

// Breakdown of the calldata
console.log("\n=== Calldata Breakdown ===");
console.log("Selector (4 bytes):", calldata.slice(0, 10));
console.log("From (32 bytes):", "0x" + calldata.slice(10, 74));
console.log("To (32 bytes):", "0x" + calldata.slice(74, 138));
console.log("Token ID (32 bytes):", "0x" + calldata.slice(138));

// Comparing selectors
console.log("\n=== Comparing Transfer Selectors ===");
console.log(
	"safeTransferFrom(address,address,uint256):",
	ERC721.SELECTORS.safeTransferFrom,
);
console.log(
	"safeTransferFrom(address,address,uint256,bytes):",
	ERC721.SELECTORS.safeTransferFromWithData,
);
console.log(
	"transferFrom(address,address,uint256):",
	ERC721.SELECTORS.transferFrom,
);

// ERC721Receiver callback
console.log("\n=== ERC721Receiver Interface ===");
console.log("When sending to a contract, safeTransferFrom calls:");
console.log("  onERC721Received(operator, from, tokenId, data)");
console.log("\nExpected return value:");
console.log(
	"  bytes4(keccak256('onERC721Received(address,address,uint256,bytes)'))",
);
console.log("  = 0x150b7a02");

// Use cases
console.log("\n=== When to Use safeTransferFrom ===");
console.log("1. Sending to unknown addresses (safety check)");
console.log("2. Sending to smart contracts (ensures they can receive)");
console.log("3. NFT marketplaces (standard practice)");
console.log("4. Cross-protocol transfers");

console.log("\n=== When transferFrom is OK ===");
console.log("1. Sending to EOA (externally owned account)");
console.log("2. Known compatible contract addresses");
console.log("3. Gas optimization when safety is verified off-chain");
