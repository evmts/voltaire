/**
 * ERC-1155 balanceOf - Check token balances
 *
 * Unlike ERC-20, ERC-1155 balanceOf takes both an address AND a token ID,
 * since a single contract can hold multiple token types.
 */

import { Address, ERC1155, Uint256 } from "@tevm/voltaire";

// Setup balance check parameters
const account = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f5bEb2");
const tokenId = Uint256(1n); // Token ID to check

// Encode balanceOf(address,uint256) calldata
const calldata = ERC1155.encodeBalanceOf(account, tokenId);
const tokenTypes = [
	{ name: "Gold Coin", id: 1n },
	{ name: "Silver Coin", id: 2n },
	{ name: "Legendary Sword", id: 1000n },
	{ name: "Common Shield", id: 2001n },
];

for (const { name, id } of tokenTypes) {
	const tid = Uint256(id);
	const data = ERC1155.encodeBalanceOf(account, tid);
}
const uriCalldata = ERC1155.encodeURI(tokenId);
