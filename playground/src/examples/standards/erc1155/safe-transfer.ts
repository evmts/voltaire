/**
 * ERC-1155 safeTransferFrom - Transfer single token type
 *
 * Transfers a specified amount of a single token type.
 * Unlike ERC-721, you can transfer multiple units of the same token.
 */

import { Address, Uint256, ERC1155 } from "@tevm/voltaire";

// Setup transfer parameters
const from = Address("0xABc0000000000000000000000000000000000001");
const to = Address("0xDef0000000000000000000000000000000000002");
const tokenId = Uint256(42n);
const amount = Uint256(100n); // Transferring 100 units of token #42
const data = new Uint8Array(0); // Empty data

// Encode safeTransferFrom(address,address,uint256,uint256,bytes) calldata
const calldata = ERC1155.encodeSafeTransferFrom(
	from,
	to,
	tokenId,
	amount,
	data,
);

console.log("=== ERC-1155 safeTransferFrom Encoding ===");
console.log("From:", "0xABc0000000000000000000000000000000000001");
console.log("To:", "0xDef0000000000000000000000000000000000002");
console.log("Token ID:", tokenId.toString());
console.log("Amount:", amount.toString());
console.log("Data:", "0x (empty)");
console.log("Selector:", ERC1155.SELECTORS.safeTransferFrom);
console.log("\nEncoded calldata:", calldata);

// Calldata breakdown
console.log("\n=== Calldata Breakdown ===");
console.log("Selector (4 bytes):", calldata.slice(0, 10));
console.log("From (32 bytes):", "0x" + calldata.slice(10, 74));
console.log("To (32 bytes):", "0x" + calldata.slice(74, 138));
console.log("Token ID (32 bytes):", "0x" + calldata.slice(138, 202));
console.log("Amount (32 bytes):", "0x" + calldata.slice(202, 266));
console.log("Data offset:", "0x" + calldata.slice(266, 268));

// Decoding TransferSingle event
console.log("\n=== Decoding TransferSingle Event ===");
const mockTransferLog = {
	topics: [
		ERC1155.EVENTS.TransferSingle,
		"0x000000000000000000000000abc0000000000000000000000000000000000001", // operator
		"0x000000000000000000000000abc0000000000000000000000000000000000001", // from
		"0x000000000000000000000000def0000000000000000000000000000000000002", // to
	],
	data: "0x000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000000000000000000000000000000064", // id=42, value=100
};

const decoded = ERC1155.decodeTransferSingleEvent(mockTransferLog);
console.log("Operator:", decoded.operator);
console.log("From:", decoded.from);
console.log("To:", decoded.to);
console.log("Token ID:", decoded.id.toString());
console.log("Amount:", decoded.value.toString());

// ERC1155Receiver callback
console.log("\n=== ERC1155Receiver Interface ===");
console.log("When sending to a contract, safeTransferFrom calls:");
console.log("  onERC1155Received(operator, from, id, value, data)");
console.log("\nExpected return value:");
console.log(
	"  bytes4(keccak256('onERC1155Received(address,address,uint256,uint256,bytes)'))",
);
console.log("  = 0xf23a6e61");
