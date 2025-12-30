/**
 * ERC-1155 balanceOf - Check token balances
 *
 * Unlike ERC-20, ERC-1155 balanceOf takes both an address AND a token ID,
 * since a single contract can hold multiple token types.
 */

import { Address, Uint256, ERC1155 } from "@tevm/voltaire";

// Setup balance check parameters
const account = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f5bEb2");
const tokenId = Uint256(1n); // Token ID to check

// Encode balanceOf(address,uint256) calldata
const calldata = ERC1155.encodeBalanceOf(account, tokenId);

console.log("=== ERC-1155 balanceOf Encoding ===");
console.log("Account:", "0x742d35Cc6634C0532925a3b844Bc9e7595f5bEb2");
console.log("Token ID:", tokenId.toString());
console.log("Selector:", ERC1155.SELECTORS.balanceOf);
console.log("\nEncoded calldata:", calldata);

// Breakdown of the calldata
console.log("\n=== Calldata Breakdown ===");
console.log("Selector (4 bytes):", calldata.slice(0, 10));
console.log("Account (32 bytes):", "0x" + calldata.slice(10, 74));
console.log("Token ID (32 bytes):", "0x" + calldata.slice(74));

// Checking balances for multiple token IDs
console.log("\n=== Checking Multiple Token Types ===");
const tokenTypes = [
	{ name: "Gold Coin", id: 1n },
	{ name: "Silver Coin", id: 2n },
	{ name: "Legendary Sword", id: 1000n },
	{ name: "Common Shield", id: 2001n },
];

for (const { name, id } of tokenTypes) {
	const tid = Uint256(id);
	const data = ERC1155.encodeBalanceOf(account, tid);
	console.log(`${name} (ID ${id}): ${data}`);
}

// URI for token metadata
console.log("\n=== Token URI Encoding ===");
const uriCalldata = ERC1155.encodeURI(tokenId);
console.log("URI calldata:", uriCalldata);
console.log(
	"\nNote: ERC-1155 uses a single URI template with {id} placeholder",
);
console.log("Example: https://game.example/api/item/{id}.json");
