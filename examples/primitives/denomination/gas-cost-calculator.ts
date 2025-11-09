/**
 * Example 2: Gas Cost Calculator
 *
 * Demonstrates:
 * - Calculating transaction gas costs
 * - Working with gas prices in Gwei
 * - Converting costs between denominations
 * - Comparing different gas price tiers
 */

import * as Ether from "../../../src/primitives/Denomination/Ether.js";
import * as Gwei from "../../../src/primitives/Denomination/Gwei.js";
import * as Wei from "../../../src/primitives/Denomination/Wei.js";
import * as Uint from "../../../src/primitives/Uint/index.js";

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
}

const tokenGasUsed = 65_000n;

for (const { name, gwei } of gasPrices) {
	const gasPrice = Gwei.from(gwei);
	const cost = calculateGasCost(gasPrice, tokenGasUsed);
	const costEthNum = Number(Wei.toU256(cost)) / 1e18;
}

const swapGasUsed = 150_000n;

for (const { name, gwei } of gasPrices) {
	const gasPrice = Gwei.from(gwei);
	const cost = calculateGasCost(gasPrice, swapGasUsed);
	const costEthNum = Number(Wei.toU256(cost)) / 1e18;
}

const transferValue = Ether.toWei(Ether.from(1n)); // Sending 1 ETH
const gasPrice = Gwei.from(50n); // 50 Gwei gas price
const gasCost = calculateGasCost(gasPrice, gasUsed);

const totalCost = Wei.from(
	Uint.plus(Wei.toU256(transferValue), Wei.toU256(gasCost)),
);

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
