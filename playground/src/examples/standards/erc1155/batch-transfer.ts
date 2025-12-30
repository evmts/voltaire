/**
 * ERC-1155 safeBatchTransferFrom - Batch transfer multiple token types
 *
 * One of ERC-1155's most powerful features: transfer multiple different
 * token types in a single transaction.
 */

import { Address, Uint256, ERC1155 } from "@tevm/voltaire";

// Note: safeBatchTransferFrom requires array encoding
// The SELECTOR is available for identifying the function

console.log("=== ERC-1155 safeBatchTransferFrom ===");
console.log("Selector:", ERC1155.SELECTORS.safeBatchTransferFrom);
console.log(
	"Signature: safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
);

// Example batch transfer
const from = Address("0xABc0000000000000000000000000000000000001");
const to = Address("0xDef0000000000000000000000000000000000002");

const items = [
	{ id: 1n, amount: 10n, name: "Gold Coins" },
	{ id: 2n, amount: 50n, name: "Silver Coins" },
	{ id: 1000n, amount: 1n, name: "Legendary Sword" },
	{ id: 2001n, amount: 5n, name: "Health Potions" },
];

console.log("\n=== Batch Transfer Example ===");
console.log("From:", "0xABc0000000000000000000000000000000000001");
console.log("To:", "0xDef0000000000000000000000000000000000002");
console.log("\nItems being transferred:");
for (const item of items) {
	console.log(`  - ${item.amount}x ${item.name} (ID: ${item.id})`);
}

// ABI encoding structure
console.log("\n=== ABI Encoding Structure ===");
console.log("Selector: 0x2eb2c2d6 (4 bytes)");
console.log("From address: 32 bytes");
console.log("To address: 32 bytes");
console.log("Offset to ids array: 32 bytes");
console.log("Offset to amounts array: 32 bytes");
console.log("Offset to data: 32 bytes");
console.log("IDs array: length + N * 32 bytes");
console.log("Amounts array: length + N * 32 bytes");
console.log("Data: length + padded bytes");

// TransferBatch event
console.log("\n=== TransferBatch Event ===");
console.log("Event signature:", ERC1155.EVENTS.TransferBatch);
console.log("\nEvent structure:");
console.log("  Topics: [signature, operator, from, to]");
console.log("  Data: ABI-encoded (ids[], values[])");

// Gas comparison
console.log("\n=== Gas Savings: Batch vs Individual ===");
console.log("Individual safeTransferFrom calls (4 items):");
console.log("  - 4 separate transactions");
console.log("  - 4x base cost (~21,000 gas each)");
console.log("  - 4x ERC1155Receiver callbacks");
console.log("  - Estimated: ~200,000+ gas total");

console.log("\nsafeBatchTransferFrom:");
console.log("  - 1 transaction");
console.log("  - 1x base cost");
console.log("  - 1x ERC1155BatchReceiver callback");
console.log("  - Estimated: ~80,000 gas");
console.log("  - Savings: 60%+");

// ERC1155BatchReceiver callback
console.log("\n=== ERC1155BatchReceiver Interface ===");
console.log("When sending to a contract, safeBatchTransferFrom calls:");
console.log("  onERC1155BatchReceived(operator, from, ids, values, data)");
console.log("\nExpected return value:");
console.log(
	"  bytes4(keccak256('onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)'))",
);
console.log("  = 0xbc197c81");

// Use cases
console.log("\n=== Use Cases for Batch Transfers ===");
console.log("1. Game: Trade multiple items in one transaction");
console.log("2. Marketplace: Bundle sales");
console.log("3. Airdrops: Distribute multiple token types");
console.log("4. Crafting: Combine ingredients, receive products");
