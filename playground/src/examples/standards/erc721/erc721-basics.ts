/**
 * ERC-721 Basics - Overview of the NFT interface
 *
 * ERC-721 defines a standard interface for non-fungible tokens (NFTs) on Ethereum.
 * Each token is unique and has its own token ID.
 */

import { ERC721 } from "@tevm/voltaire";

// === Function Selectors ===
// First 4 bytes of keccak256 hash of function signature
console.log("=== ERC-721 Core Function Selectors ===");
console.log("balanceOf(address):", ERC721.SELECTORS.balanceOf);
console.log("ownerOf(uint256):", ERC721.SELECTORS.ownerOf);
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
console.log("approve(address,uint256):", ERC721.SELECTORS.approve);
console.log(
	"setApprovalForAll(address,bool):",
	ERC721.SELECTORS.setApprovalForAll,
);
console.log("getApproved(uint256):", ERC721.SELECTORS.getApproved);
console.log(
	"isApprovedForAll(address,address):",
	ERC721.SELECTORS.isApprovedForAll,
);

// Metadata extension
console.log("\n=== ERC-721 Metadata Extension ===");
console.log("name():", ERC721.SELECTORS.name);
console.log("symbol():", ERC721.SELECTORS.symbol);
console.log("tokenURI(uint256):", ERC721.SELECTORS.tokenURI);

// Enumerable extension
console.log("\n=== ERC-721 Enumerable Extension ===");
console.log("totalSupply():", ERC721.SELECTORS.totalSupply);
console.log(
	"tokenOfOwnerByIndex(address,uint256):",
	ERC721.SELECTORS.tokenOfOwnerByIndex,
);
console.log("tokenByIndex(uint256):", ERC721.SELECTORS.tokenByIndex);

// === Event Signatures ===
console.log("\n=== ERC-721 Event Signatures ===");
console.log("Transfer(address,address,uint256):", ERC721.EVENTS.Transfer);
console.log("Approval(address,address,uint256):", ERC721.EVENTS.Approval);
console.log(
	"ApprovalForAll(address,address,bool):",
	ERC721.EVENTS.ApprovalForAll,
);

// === Available Encoding Functions ===
console.log("\n=== Available Encoding Functions ===");
console.log(
	"encodeTransferFrom(from, to, tokenId) - Encode transferFrom calldata",
);
console.log(
	"encodeSafeTransferFrom(from, to, tokenId) - Encode safeTransferFrom calldata",
);
console.log("encodeApprove(to, tokenId) - Encode approve calldata");
console.log(
	"encodeSetApprovalForAll(operator, approved) - Encode setApprovalForAll calldata",
);
console.log("encodeOwnerOf(tokenId) - Encode ownerOf calldata");
console.log("encodeTokenURI(tokenId) - Encode tokenURI calldata");

// === Available Decoding Functions ===
console.log("\n=== Available Decoding Functions ===");
console.log("decodeTransferEvent(log) - Decode Transfer event");
console.log("decodeApprovalEvent(log) - Decode Approval event");
console.log("decodeApprovalForAllEvent(log) - Decode ApprovalForAll event");
