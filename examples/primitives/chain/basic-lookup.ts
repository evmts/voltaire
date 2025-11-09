/**
 * Chain Example 1: Basic Chain Lookup
 *
 * Demonstrates:
 * - Looking up chains by ID
 * - Accessing chain metadata (name, chainId, symbol)
 * - Using the byId record vs fromId method
 */

import { Chain } from "../../../src/primitives/Chain/Chain.js";

console.log("\n=== Basic Chain Lookup Example ===\n");

// Lookup using fromId() method
console.log("1. Lookup with fromId()");
console.log("   ---------------------");

const quai = Chain.fromId(9);
if (quai) {
	console.log(`   Chain ID: ${quai.chainId}`);
	console.log(`   Name: ${quai.name}`);
	console.log(`   Short Name: ${quai.shortName}`);
	console.log(`   Symbol: ${quai.nativeCurrency.symbol}\n`);
}

const flare = Chain.fromId(14);
if (flare) {
	console.log(`   Chain ID: ${flare.chainId}`);
	console.log(`   Name: ${flare.name}`);
	console.log(`   Short Name: ${flare.shortName}`);
	console.log(`   Symbol: ${flare.nativeCurrency.symbol}\n`);
}

// Lookup using byId record (direct access)
console.log("2. Lookup with byId record");
console.log("   -----------------------");

const ethereum = Chain.byId[1];
if (ethereum) {
	console.log(
		`   Ethereum: ${ethereum.name} (${ethereum.nativeCurrency.symbol})`,
	);
}

const optimism = Chain.byId[10];
if (optimism) {
	console.log(
		`   Optimism: ${optimism.name} (${optimism.nativeCurrency.symbol})`,
	);
}

const arbitrum = Chain.byId[42161];
if (arbitrum) {
	console.log(
		`   Arbitrum: ${arbitrum.name} (${arbitrum.nativeCurrency.symbol})\n`,
	);
}

// Handling unknown chains
console.log("3. Handling Unknown Chains");
console.log("   -----------------------");

const unknownChain = Chain.fromId(999999999);
console.log(`   Chain 999999999 exists: ${unknownChain !== undefined}`);

// Safe chain lookup pattern
function getChainSafely(chainId: number): string {
	const chain = Chain.fromId(chainId);
	if (!chain) {
		return `Chain ${chainId} not found`;
	}
	return `${chain.name} (ID: ${chain.chainId})`;
}

console.log(`   ${getChainSafely(1)}`);
console.log(`   ${getChainSafely(999999999)}\n`);

// Popular chain IDs
console.log("4. Common Chain IDs");
console.log("   ----------------");

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
		console.log(`   ${id.toString().padStart(6)}: ${chain.name}`);
	}
});

console.log("\n=== Example Complete ===\n");
