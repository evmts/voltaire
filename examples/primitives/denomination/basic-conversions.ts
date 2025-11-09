/**
 * Example 1: Basic Denomination Conversions
 *
 * Demonstrates:
 * - Converting between Wei, Gwei, and Ether
 * - Type-safe denomination handling
 * - Integer division behavior and truncation
 * - Round-trip conversions
 */

import * as Ether from "../../../src/primitives/Denomination/Ether.js";
import * as Gwei from "../../../src/primitives/Denomination/Gwei.js";
import * as Wei from "../../../src/primitives/Denomination/Wei.js";

const oneEther = Ether.from(1n);
const weiFromEther = Ether.toWei(oneEther);
const gweiFromEther = Ether.toGwei(oneEther);

const fiftyGwei = Gwei.from(50n);
const weiFromGwei = Gwei.toWei(fiftyGwei);
const etherFromGwei = Gwei.toEther(fiftyGwei); // Truncates to 0

const largeWei = Wei.from(1_500_000_000_000_000_000n); // 1.5 ETH in Wei
const gweiFromWei = Wei.toGwei(largeWei);
const etherFromWei = Wei.toEther(largeWei);

// 1.5 Gwei in Wei
const partialGwei = Wei.from(1_500_000_000n);
const truncatedGwei = Wei.toGwei(partialGwei);

// 0.5 ETH in Wei
const partialEther = Wei.from(500_000_000_000_000_000n);
const truncatedEther = Wei.toEther(partialEther);

// Safe: Gwei -> Wei -> Gwei (no loss)
const originalGwei = Gwei.from(100n);
const toWei = Gwei.toWei(originalGwei);
const backToGwei = Wei.toGwei(toWei);

// Unsafe: Wei -> Gwei -> Wei (loses fractional Gwei)
const originalWei = Wei.from(1_500_000_000n); // 1.5 Gwei
const toGweiLossy = Wei.toGwei(originalWei);
const backToWeiLossy = Gwei.toWei(toGweiLossy);

const values = [
	{ name: "Dust", wei: 1n },
	{ name: "Small", wei: 1_000_000_000n },
	{ name: "Transfer gas (21k @ 50 Gwei)", wei: 1_050_000_000_000_000n },
	{ name: "Standard", wei: 1_000_000_000_000_000_000n },
	{ name: "Large", wei: 10_000_000_000_000_000_000n },
];

for (const { name, wei: weiValue } of values) {
	const w = Wei.from(weiValue);
	const g = Wei.toGwei(w);
	const e = Wei.toEther(w);
}
