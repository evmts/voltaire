/**
 * Example 1: Basic Denomination Conversions
 *
 * Demonstrates:
 * - Converting between Wei, Gwei, and Ether
 * - Type-safe denomination handling
 * - Integer division behavior and truncation
 * - Round-trip conversions
 */

import * as Wei from "../../../src/primitives/Denomination/Wei.js";
import * as Gwei from "../../../src/primitives/Denomination/Gwei.js";
import * as Ether from "../../../src/primitives/Denomination/Ether.js";

console.log("\n=== Basic Denomination Conversions ===\n");

// Example 1: Ether to Wei and Gwei
console.log("1. Converting from Ether\n");
console.log("   ------------------------");

const oneEther = Ether.from(1n);
const weiFromEther = Ether.toWei(oneEther);
const gweiFromEther = Ether.toGwei(oneEther);

console.log(`   1 Ether = ${weiFromEther} Wei`);
console.log(`   1 Ether = ${gweiFromEther} Gwei\n`);

// Example 2: Gwei to Wei and Ether
console.log("2. Converting from Gwei\n");
console.log("   ----------------------");

const fiftyGwei = Gwei.from(50n);
const weiFromGwei = Gwei.toWei(fiftyGwei);
const etherFromGwei = Gwei.toEther(fiftyGwei); // Truncates to 0

console.log(`   50 Gwei = ${weiFromGwei} Wei`);
console.log(`   50 Gwei = ${etherFromGwei} Ether (truncated)\n`);

// Example 3: Wei to Gwei and Ether
console.log("3. Converting from Wei\n");
console.log("   --------------------");

const largeWei = Wei.from(1_500_000_000_000_000_000n); // 1.5 ETH in Wei
const gweiFromWei = Wei.toGwei(largeWei);
const etherFromWei = Wei.toEther(largeWei);

console.log(`   ${largeWei} Wei = ${gweiFromWei} Gwei`);
console.log(`   ${largeWei} Wei = ${etherFromWei} Ether\n`);

// Example 4: Integer division truncation
console.log("4. Integer Division Truncation\n");
console.log("   ----------------------------");

// 1.5 Gwei in Wei
const partialGwei = Wei.from(1_500_000_000n);
const truncatedGwei = Wei.toGwei(partialGwei);
console.log(
	`   ${partialGwei} Wei = ${truncatedGwei} Gwei (expected 1.5, got 1)`,
);

// 0.5 ETH in Wei
const partialEther = Wei.from(500_000_000_000_000_000n);
const truncatedEther = Wei.toEther(partialEther);
console.log(
	`   ${partialEther} Wei = ${truncatedEther} Ether (expected 0.5, got 0)\n`,
);

// Example 5: Safe round-trip conversions
console.log("5. Round-trip Conversions\n");
console.log("   -----------------------");

// Safe: Gwei -> Wei -> Gwei (no loss)
const originalGwei = Gwei.from(100n);
const toWei = Gwei.toWei(originalGwei);
const backToGwei = Wei.toGwei(toWei);
console.log(`   Original: ${originalGwei} Gwei`);
console.log(`   To Wei:   ${toWei} Wei`);
console.log(`   Back:     ${backToGwei} Gwei`);
console.log(`   Match:    ${originalGwei === backToGwei ? "✓" : "✗"}\n`);

// Unsafe: Wei -> Gwei -> Wei (loses fractional Gwei)
const originalWei = Wei.from(1_500_000_000n); // 1.5 Gwei
const toGweiLossy = Wei.toGwei(originalWei);
const backToWeiLossy = Gwei.toWei(toGweiLossy);
console.log(`   Original: ${originalWei} Wei`);
console.log(`   To Gwei:  ${toGweiLossy} Gwei (truncated)`);
console.log(`   Back:     ${backToWeiLossy} Wei`);
console.log(
	`   Lost:     ${Wei.toU256(originalWei) - Wei.toU256(backToWeiLossy)} Wei\n`,
);

// Example 6: Common values reference
console.log("6. Common Values Reference\n");
console.log("   ------------------------");

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
	console.log(`   ${name}:`);
	console.log(`     ${weiValue} Wei = ${g} Gwei = ${e} Ether`);
}

console.log("\n=== Example Complete ===\n");
