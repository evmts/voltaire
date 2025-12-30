/**
 * ERC-1155 safeBatchTransferFrom - Batch transfer multiple token types
 *
 * One of ERC-1155's most powerful features: transfer multiple different
 * token types in a single transaction.
 */

import { Address, ERC1155, Uint256 } from "@tevm/voltaire";

// Example batch transfer
const from = Address("0xABc0000000000000000000000000000000000001");
const to = Address("0xDef0000000000000000000000000000000000002");

const items = [
	{ id: 1n, amount: 10n, name: "Gold Coins" },
	{ id: 2n, amount: 50n, name: "Silver Coins" },
	{ id: 1000n, amount: 1n, name: "Legendary Sword" },
	{ id: 2001n, amount: 5n, name: "Health Potions" },
];
for (const item of items) {
}
