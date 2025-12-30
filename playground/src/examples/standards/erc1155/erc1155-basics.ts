/**
 * ERC-1155 Basics - Overview of the multi-token interface
 *
 * ERC-1155 is a multi-token standard that can represent both fungible and
 * non-fungible tokens in a single contract. It's more gas-efficient for
 * batch operations.
 */

import { ERC1155 } from "@tevm/voltaire";

// === Function Selectors ===
// First 4 bytes of keccak256 hash of function signature
console.log("=== ERC-1155 Core Function Selectors ===");
console.log("balanceOf(address,uint256):", ERC1155.SELECTORS.balanceOf);
console.log(
	"balanceOfBatch(address[],uint256[]):",
	ERC1155.SELECTORS.balanceOfBatch,
);
console.log(
	"setApprovalForAll(address,bool):",
	ERC1155.SELECTORS.setApprovalForAll,
);
console.log(
	"isApprovedForAll(address,address):",
	ERC1155.SELECTORS.isApprovedForAll,
);
console.log("safeTransferFrom(...):", ERC1155.SELECTORS.safeTransferFrom);
console.log(
	"safeBatchTransferFrom(...):",
	ERC1155.SELECTORS.safeBatchTransferFrom,
);

// Metadata extension
console.log("\n=== ERC-1155 Metadata Extension ===");
console.log("uri(uint256):", ERC1155.SELECTORS.uri);

// === Event Signatures ===
console.log("\n=== ERC-1155 Event Signatures ===");
console.log("TransferSingle(...):", ERC1155.EVENTS.TransferSingle);
console.log("TransferBatch(...):", ERC1155.EVENTS.TransferBatch);
console.log("ApprovalForAll(...):", ERC1155.EVENTS.ApprovalForAll);
console.log("URI(...):", ERC1155.EVENTS.URI);

// === Available Encoding Functions ===
console.log("\n=== Available Encoding Functions ===");
console.log("encodeBalanceOf(account, id) - Encode balanceOf calldata");
console.log(
	"encodeSetApprovalForAll(operator, approved) - Encode setApprovalForAll calldata",
);
console.log(
	"encodeSafeTransferFrom(from, to, id, amount, data) - Encode safeTransferFrom calldata",
);
console.log(
	"encodeIsApprovedForAll(account, operator) - Encode isApprovedForAll calldata",
);
console.log("encodeURI(id) - Encode uri calldata");

// === Available Decoding Functions ===
console.log("\n=== Available Decoding Functions ===");
console.log("decodeTransferSingleEvent(log) - Decode TransferSingle event");
console.log("decodeApprovalForAllEvent(log) - Decode ApprovalForAll event");

// === Key Differences from ERC-20/721 ===
console.log("\n=== Key Differences from ERC-20/721 ===");
console.log("1. Single contract can hold multiple token types");
console.log("2. Each token ID can have a supply > 1 (semi-fungible)");
console.log("3. Batch operations for gas efficiency");
console.log("4. No individual token approvals (only operator approvals)");
console.log("5. All transfers are 'safe' (receiver callback required)");
