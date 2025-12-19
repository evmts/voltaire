import * as FeeMarket from "../../../primitives/FeeMarket/index.js";

// Example: Base fee adjustment dynamics (EIP-1559)
// Shows how base fee responds to block utilization

const gasLimit = 30_000_000n;
const startingBaseFee = 1_000_000_000n; // 1 gwei

// Target is 50% of gas limit (15M gas)
const gasTarget = gasLimit / FeeMarket.Eip1559.ELASTICITY_MULTIPLIER;

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
scenarios.forEach(({ name, gasUsed }) => {
	const newBaseFee = FeeMarket.BaseFee(gasUsed, gasLimit, startingBaseFee);
	const change = newBaseFee - startingBaseFee;
	const pct = (Number(change) / Number(startingBaseFee)) * 100;
});

// Maximum possible change per block (12.5%)
const maxIncrease = FeeMarket.BaseFee(gasLimit, gasLimit, startingBaseFee);
const maxDecrease = FeeMarket.BaseFee(0n, gasLimit, startingBaseFee);

// Minimum base fee enforcement
const veryLowBaseFee = 5n;
const afterEmpty = FeeMarket.BaseFee(0n, gasLimit, veryLowBaseFee);
