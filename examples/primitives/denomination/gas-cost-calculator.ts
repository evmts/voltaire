/**
 * Example 2: Gas Cost Calculator
 *
 * Demonstrates:
 * - Calculating transaction gas costs
 * - Working with gas prices in Gwei
 * - Converting costs between denominations
 * - Comparing different gas price tiers
 */

import * as Wei from "../../../src/primitives/Denomination/Wei.js";
import * as Gwei from "../../../src/primitives/Denomination/Gwei.js";
import * as Ether from "../../../src/primitives/Denomination/Ether.js";
import * as Uint from "../../../src/primitives/Uint/index.js";

console.log("\n=== Gas Cost Calculator ===\n");

// Example 1: Basic gas cost calculation
console.log("1. Basic Transfer (21,000 gas)\n");
console.log("   -----------------------------");

function calculateGasCost(gasPriceGwei: Gwei.Type, gasUsed: bigint): Wei.Type {
	// Convert gas price to Wei for calculation
	const gasPriceWei = Gwei.toWei(gasPriceGwei);

	// Calculate: gasPrice * gasUsed
	const cost = Uint.times(gasPriceWei, Uint.from(gasUsed));

	return Wei.from(cost);
}

const gasUsed = 21_000n; // Standard ETH transfer
const gasPrices = [
	{ name: "Slow", gwei: 20n },
	{ name: "Standard", gwei: 50n },
	{ name: "Fast", gwei: 100n },
	{ name: "Urgent", gwei: 200n },
];

for (const { name, gwei } of gasPrices) {
	const gasPrice = Gwei.from(gwei);
	const cost = calculateGasCost(gasPrice, gasUsed);
	const costGwei = Wei.toGwei(cost);
	const costEther = Wei.toEther(cost);

	console.log(`   ${name} (${gwei} Gwei):`);
	console.log(`     Cost: ${cost} Wei`);
	console.log(`     Cost: ${costGwei} Gwei`);
	console.log(
		`     Cost: ${costEther} Ether (~${Number(Wei.toU256(cost)) / 1e18} ETH)`,
	);
}

console.log("");

// Example 2: ERC-20 token transfer
console.log("2. ERC-20 Token Transfer (65,000 gas)\n");
console.log("   ------------------------------------");

const tokenGasUsed = 65_000n;

for (const { name, gwei } of gasPrices) {
	const gasPrice = Gwei.from(gwei);
	const cost = calculateGasCost(gasPrice, tokenGasUsed);
	const costEthNum = Number(Wei.toU256(cost)) / 1e18;

	console.log(`   ${name}: ${costEthNum.toFixed(6)} ETH`);
}

console.log("");

// Example 3: Complex DEX swap
console.log("3. Uniswap Swap (150,000 gas)\n");
console.log("   ---------------------------");

const swapGasUsed = 150_000n;

for (const { name, gwei } of gasPrices) {
	const gasPrice = Gwei.from(gwei);
	const cost = calculateGasCost(gasPrice, swapGasUsed);
	const costEthNum = Number(Wei.toU256(cost)) / 1e18;

	console.log(`   ${name}: ${costEthNum.toFixed(6)} ETH`);
}

console.log("");

// Example 4: Total transaction cost (value + gas)
console.log("4. Total Transaction Cost\n");
console.log("   -----------------------");

const transferValue = Ether.toWei(Ether.from(1n)); // Sending 1 ETH
const gasPrice = Gwei.from(50n); // 50 Gwei gas price
const gasCost = calculateGasCost(gasPrice, gasUsed);

const totalCost = Wei.from(
	Uint.plus(Wei.toU256(transferValue), Wei.toU256(gasCost)),
);

console.log(`   Transfer value: 1 ETH`);
console.log(`   Gas cost: ${Number(Wei.toU256(gasCost)) / 1e18} ETH`);
console.log(`   Total cost: ${Number(Wei.toU256(totalCost)) / 1e18} ETH`);
console.log("");

// Example 5: Balance check
console.log("5. Sufficient Balance Check\n");
console.log("   -------------------------");

function hasSufficientBalance(
	balance: Wei.Type,
	value: Wei.Type,
	gasCost: Wei.Type,
): boolean {
	const balanceU256 = Wei.toU256(balance);
	const valueU256 = Wei.toU256(value);
	const gasCostU256 = Wei.toU256(gasCost);

	const required = Uint.plus(valueU256, gasCostU256);

	return balanceU256 >= required;
}

const balance = Wei.from(2_000_000_000_000_000_000n); // 2 ETH
const value = Ether.toWei(Ether.from(1n)); // 1 ETH
const gas = calculateGasCost(Gwei.from(50n), 21_000n);

console.log(`   Balance: ${Number(Wei.toU256(balance)) / 1e18} ETH`);
console.log(`   Value: ${Number(Wei.toU256(value)) / 1e18} ETH`);
console.log(`   Gas: ${Number(Wei.toU256(gas)) / 1e18} ETH`);
console.log(
	`   Can send: ${hasSufficientBalance(balance, value, gas) ? "✓" : "✗"}`,
);
console.log("");

// Example 6: Gas price comparison
console.log("6. Gas Price Recommendations\n");
console.log("   --------------------------");

interface GasPriceRecommendation {
	safe: Gwei.Type;
	standard: Gwei.Type;
	fast: Gwei.Type;
	instant: Gwei.Type;
}

function getGasRecommendation(baseFeeGwei: number): GasPriceRecommendation {
	return {
		safe: Gwei.from(BigInt(Math.ceil(baseFeeGwei * 1.2))),
		standard: Gwei.from(BigInt(Math.ceil(baseFeeGwei * 1.5))),
		fast: Gwei.from(BigInt(Math.ceil(baseFeeGwei * 2))),
		instant: Gwei.from(BigInt(Math.ceil(baseFeeGwei * 3))),
	};
}

const currentBaseFee = 40; // 40 Gwei base fee
const recommendations = getGasRecommendation(currentBaseFee);

console.log(`   Current base fee: ${currentBaseFee} Gwei`);
console.log(`   Safe: ${recommendations.safe} Gwei`);
console.log(`   Standard: ${recommendations.standard} Gwei`);
console.log(`   Fast: ${recommendations.fast} Gwei`);
console.log(`   Instant: ${recommendations.instant} Gwei`);

console.log("\n=== Example Complete ===\n");
