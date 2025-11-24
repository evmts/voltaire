import * as FeeMarket from "../../../primitives/FeeMarket/index.js";

// Example: Base fee adjustment dynamics (EIP-1559)
// Shows how base fee responds to block utilization

const gasLimit = 30_000_000n;
const startingBaseFee = 1_000_000_000n; // 1 gwei

// Target is 50% of gas limit (15M gas)
const gasTarget = gasLimit / FeeMarket.Eip1559.ELASTICITY_MULTIPLIER;
console.log("Gas target:", gasTarget); // 15_000_000n

// Test different utilization levels
const scenarios = [
	{ name: "Empty block", gasUsed: 0n },
	{ name: "10% full", gasUsed: 3_000_000n },
	{ name: "25% full", gasUsed: 7_500_000n },
	{ name: "50% full (target)", gasUsed: 15_000_000n },
	{ name: "75% full", gasUsed: 22_500_000n },
	{ name: "90% full", gasUsed: 27_000_000n },
	{ name: "100% full", gasUsed: 30_000_000n },
];

console.log("\nBase fee adjustments:");
scenarios.forEach(({ name, gasUsed }) => {
	const newBaseFee = FeeMarket.BaseFee(gasUsed, gasLimit, startingBaseFee);
	const change = newBaseFee - startingBaseFee;
	const pct = (Number(change) / Number(startingBaseFee)) * 100;

	console.log(`\n${name}:`);
	console.log(`  Gas used: ${gasUsed}`);
	console.log(`  New base fee: ${newBaseFee}`);
	console.log(`  Change: ${change} (${pct.toFixed(2)}%)`);
});

// Maximum possible change per block (12.5%)
const maxIncrease = FeeMarket.BaseFee(gasLimit, gasLimit, startingBaseFee);
const maxDecrease = FeeMarket.BaseFee(0n, gasLimit, startingBaseFee);

console.log("\n\nMaximum changes per block:");
console.log("Max increase (full block):", maxIncrease);
console.log(
	"Change:",
	(
		(Number(maxIncrease - startingBaseFee) / Number(startingBaseFee)) *
		100
	).toFixed(2),
	"%",
);
console.log("\nMax decrease (empty block):", maxDecrease);
console.log(
	"Change:",
	(
		(Number(maxDecrease - startingBaseFee) / Number(startingBaseFee)) *
		100
	).toFixed(2),
	"%",
);

// Minimum base fee enforcement
const veryLowBaseFee = 5n;
const afterEmpty = FeeMarket.BaseFee(0n, gasLimit, veryLowBaseFee);
console.log("\n\nMinimum base fee enforcement:");
console.log("Starting:", veryLowBaseFee);
console.log("After empty block:", afterEmpty);
console.log("MIN_BASE_FEE:", FeeMarket.Eip1559.MIN_BASE_FEE); // 7n
