/**
 * Example 4: EIP-1559 Fee Calculations
 *
 * Demonstrates:
 * - EIP-1559 base fee + priority fee mechanics
 * - Calculating max cost vs estimated cost
 * - Fee market dynamics
 * - Transaction fee budgeting
 */

import * as Wei from "../../../src/primitives/Denomination/Wei.js";
import * as Gwei from "../../../src/primitives/Denomination/Gwei.js";
import * as Ether from "../../../src/primitives/Denomination/Ether.js";
import * as Uint from "../../../src/primitives/Uint/index.js";

console.log("\n=== EIP-1559 Fee Calculations ===\n");

// Example 1: Basic EIP-1559 fee structure
console.log("1. EIP-1559 Fee Structure\n");
console.log("   -----------------------");

interface EIP1559Params {
	baseFeePerGas: Gwei.Type;
	maxPriorityFeePerGas: Gwei.Type;
	maxFeePerGas: Gwei.Type;
	gasLimit: bigint;
}

function calculateEIP1559Cost(params: EIP1559Params): {
	minCost: Wei.Type;
	maxCost: Wei.Type;
	estimatedCost: Wei.Type;
} {
	// Minimum cost (base fee only, no tips)
	const baseFeeWei = Gwei.toWei(params.baseFeePerGas);
	const minCostU256 = Uint.times(baseFeeWei, Uint.from(params.gasLimit));

	// Maximum cost (max fee per gas)
	const maxFeeWei = Gwei.toWei(params.maxFeePerGas);
	const maxCostU256 = Uint.times(maxFeeWei, Uint.from(params.gasLimit));

	// Estimated cost (base + priority)
	const priorityFeeWei = Gwei.toWei(params.maxPriorityFeePerGas);
	const effectiveFeeWei = Uint.plus(baseFeeWei, priorityFeeWei);
	const estimatedCostU256 = Uint.times(
		effectiveFeeWei,
		Uint.from(params.gasLimit),
	);

	return {
		minCost: Wei.from(minCostU256),
		maxCost: Wei.from(maxCostU256),
		estimatedCost: Wei.from(estimatedCostU256),
	};
}

const params: EIP1559Params = {
	baseFeePerGas: Gwei.from(30n), // Current base fee
	maxPriorityFeePerGas: Gwei.from(2n), // Tip to miner
	maxFeePerGas: Gwei.from(50n), // Max willing to pay
	gasLimit: 21_000n, // Standard transfer
};

const costs = calculateEIP1559Cost(params);

console.log(`   Base Fee: ${params.baseFeePerGas} Gwei`);
console.log(`   Priority Fee: ${params.maxPriorityFeePerGas} Gwei`);
console.log(`   Max Fee: ${params.maxFeePerGas} Gwei`);
console.log(`   Gas Limit: ${params.gasLimit}`);
console.log("");
console.log(`   Min Cost (base only): ${Wei.toGwei(costs.minCost)} Gwei`);
console.log(
	`   Estimated (base + priority): ${Wei.toGwei(costs.estimatedCost)} Gwei`,
);
console.log(`   Max Cost (worst case): ${Wei.toGwei(costs.maxCost)} Gwei`);

console.log("");

// Example 2: Calculate effective gas price
console.log("2. Effective Gas Price\n");
console.log("   --------------------");

function calculateEffectiveGasPrice(
	baseFee: Gwei.Type,
	maxFeePerGas: Gwei.Type,
	maxPriorityFee: Gwei.Type,
): Gwei.Type {
	const baseFeeU256 = Gwei.toU256(baseFee);
	const maxFeeU256 = Gwei.toU256(maxFeePerGas);
	const maxPriorityU256 = Gwei.toU256(maxPriorityFee);

	// effectiveGasPrice = min(baseFee + maxPriorityFee, maxFeePerGas)
	const baseAndPriority = Uint.plus(baseFeeU256, maxPriorityU256);
	const effectiveU256 =
		baseAndPriority <= maxFeeU256 ? baseAndPriority : maxFeeU256;

	return Gwei.from(effectiveU256);
}

const scenarios = [
	{ name: "Normal", base: 30n, priority: 2n, max: 50n },
	{ name: "High base (capped)", base: 45n, priority: 10n, max: 50n },
	{ name: "Low priority", base: 30n, priority: 1n, max: 50n },
	{ name: "Generous tip", base: 30n, priority: 15n, max: 100n },
];

for (const scenario of scenarios) {
	const effective = calculateEffectiveGasPrice(
		Gwei.from(scenario.base),
		Gwei.from(scenario.max),
		Gwei.from(scenario.priority),
	);
	console.log(`   ${scenario.name}:`);
	console.log(
		`     Base: ${scenario.base} Gwei, Priority: ${scenario.priority} Gwei, Max: ${scenario.max} Gwei`,
	);
	console.log(`     Effective: ${effective} Gwei`);
}

console.log("");

// Example 3: Fee budgeting
console.log("3. Transaction Fee Budgeting\n");
console.log("   --------------------------");

function canAffordTransaction(
	balance: Wei.Type,
	transferValue: Wei.Type,
	maxFeePerGas: Gwei.Type,
	gasLimit: bigint,
): { canAfford: boolean; remaining: Wei.Type } {
	const balanceU256 = Wei.toU256(balance);
	const valueU256 = Wei.toU256(transferValue);

	// Max possible gas cost
	const maxFeeWei = Gwei.toWei(maxFeePerGas);
	const maxGasCost = Uint.times(maxFeeWei, Uint.from(gasLimit));

	// Total required
	const totalRequired = Uint.plus(valueU256, maxGasCost);

	if (balanceU256 < totalRequired) {
		return { canAfford: false, remaining: Wei.from(0n) };
	}

	const remaining = Wei.from(balanceU256 - totalRequired);
	return { canAfford: true, remaining };
}

const balance = Wei.from(1_000_000_000_000_000_000n); // 1 ETH
const transferValue = Wei.from(500_000_000_000_000_000n); // 0.5 ETH
const maxFee = Gwei.from(100n);
const gasLimit = 21_000n;

const result = canAffordTransaction(balance, transferValue, maxFee, gasLimit);

console.log(`   Balance: ${Number(Wei.toU256(balance)) / 1e18} ETH`);
console.log(`   Transfer: ${Number(Wei.toU256(transferValue)) / 1e18} ETH`);
console.log(`   Max Gas Fee: ${maxFee} Gwei × ${gasLimit} gas`);
console.log(`   Can afford: ${result.canAfford ? "✓" : "✗"}`);
console.log(`   Remaining: ${Number(Wei.toU256(result.remaining)) / 1e18} ETH`);

console.log("");

// Example 4: Miner tip percentage
console.log("4. Miner Tip Analysis\n");
console.log("   -------------------");

function analyzeTip(
	baseFee: Gwei.Type,
	priorityFee: Gwei.Type,
	gasUsed: bigint,
): { baseFeePaid: Wei.Type; tipPaid: Wei.Type; tipPercentage: number } {
	const baseFeeWei = Gwei.toWei(baseFee);
	const priorityFeeWei = Gwei.toWei(priorityFee);

	const baseFeePaid = Wei.from(Uint.times(baseFeeWei, Uint.from(gasUsed)));
	const tipPaid = Wei.from(Uint.times(priorityFeeWei, Uint.from(gasUsed)));

	const total = Wei.toU256(baseFeePaid) + Wei.toU256(tipPaid);
	const tipPercentage =
		total > 0n ? Number((Wei.toU256(tipPaid) * 10000n) / total) / 100 : 0;

	return { baseFeePaid, tipPaid, tipPercentage };
}

const tipScenarios = [
	{ base: 30n, priority: 1n },
	{ base: 30n, priority: 2n },
	{ base: 30n, priority: 5n },
	{ base: 30n, priority: 10n },
];

for (const scenario of tipScenarios) {
	const analysis = analyzeTip(
		Gwei.from(scenario.base),
		Gwei.from(scenario.priority),
		21_000n,
	);

	console.log(
		`   Base: ${scenario.base} Gwei, Priority: ${scenario.priority} Gwei`,
	);
	console.log(`     Base Fee Paid: ${Wei.toGwei(analysis.baseFeePaid)} Gwei`);
	console.log(`     Tip Paid: ${Wei.toGwei(analysis.tipPaid)} Gwei`);
	console.log(`     Tip %: ${analysis.tipPercentage.toFixed(2)}%`);
}

console.log("");

// Example 5: Fee savings calculation
console.log("5. Fee Savings (Legacy vs EIP-1559)\n");
console.log("   ----------------------------------");

function compareLegacyVsEIP1559(
	baseFee: Gwei.Type,
	priorityFee: Gwei.Type,
	legacyGasPrice: Gwei.Type,
	gasUsed: bigint,
): { legacy: Wei.Type; eip1559: Wei.Type; savings: Wei.Type } {
	const legacyWei = Gwei.toWei(legacyGasPrice);
	const legacyCost = Wei.from(Uint.times(legacyWei, Uint.from(gasUsed)));

	const baseFeeWei = Gwei.toWei(baseFee);
	const priorityFeeWei = Gwei.toWei(priorityFee);
	const effectiveFee = Uint.plus(baseFeeWei, priorityFeeWei);
	const eip1559Cost = Wei.from(Uint.times(effectiveFee, Uint.from(gasUsed)));

	const savings = Wei.from(Wei.toU256(legacyCost) - Wei.toU256(eip1559Cost));

	return { legacy: legacyCost, eip1559: eip1559Cost, savings };
}

const comparison = compareLegacyVsEIP1559(
	Gwei.from(30n), // Current base fee
	Gwei.from(2n), // Priority fee
	Gwei.from(50n), // Legacy gas price
	21_000n,
);

console.log(`   Legacy (50 Gwei): ${Wei.toGwei(comparison.legacy)} Gwei total`);
console.log(`   EIP-1559 (30+2): ${Wei.toGwei(comparison.eip1559)} Gwei total`);
console.log(`   Savings: ${Wei.toGwei(comparison.savings)} Gwei`);
console.log(`   Savings: ${Number(Wei.toU256(comparison.savings)) / 1e18} ETH`);

console.log("\n=== Example Complete ===\n");
