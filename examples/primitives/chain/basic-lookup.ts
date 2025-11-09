/**
 * Chain Example 1: Basic Chain Lookup
 *
 * Demonstrates:
 * - Looking up chains by ID
 * - Accessing chain metadata (name, chainId, symbol)
 * - Using the byId record vs fromId method
 */

import { Chain } from "../../../src/primitives/Chain/Chain.js";

const quai = Chain.fromId(9);
if (quai) {
}

const flare = Chain.fromId(14);
if (flare) {
}

const ethereum = Chain.byId[1];
if (ethereum) {
}

const optimism = Chain.byId[10];
if (optimism) {
}

const arbitrum = Chain.byId[42161];
if (arbitrum) {
}

const unknownChain = Chain.fromId(999999999);

// Safe chain lookup pattern
function getChainSafely(chainId: number): string {
	const chain = Chain.fromId(chainId);
	if (!chain) {
		return `Chain ${chainId} not found`;
	}
	return `${chain.name} (ID: ${chain.chainId})`;
}

const popularChains = [
	{ id: 1, expected: "Ethereum Mainnet" },
	{ id: 10, expected: "OP Mainnet" },
	{ id: 42161, expected: "Arbitrum One" },
	{ id: 8453, expected: "Base" },
	{ id: 137, expected: "Polygon" },
	{ id: 43114, expected: "Avalanche C-Chain" },
];

popularChains.forEach(({ id, expected }) => {
	const chain = Chain.fromId(id);
	if (chain) {
	}
});
