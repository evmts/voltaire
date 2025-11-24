import * as FeeMarket from "../../../primitives/FeeMarket/index.js";

// Example: Target utilization and gas elasticity
// EIP-1559 targets 50% utilization for optimal fee stability

const gasLimit = 30_000_000n;
const baseFee = 1_000_000_000n;

// Calculate gas target (50% of limit)
const gasTarget = gasLimit / FeeMarket.Eip1559.ELASTICITY_MULTIPLIER;

console.log("EIP-1559 Gas Elasticity:");
console.log("Gas limit:", gasLimit);
console.log("Elasticity multiplier:", FeeMarket.Eip1559.ELASTICITY_MULTIPLIER);
console.log("Gas target (50%):", gasTarget);

// Simulate blocks at different utilization levels
const utilizationLevels = [0.2, 0.4, 0.5, 0.6, 0.8, 1.0];

console.log("\n\nUtilization vs Base Fee:");
console.log("Target = 50% (fee stable)");
console.log("Below target = fee decreases");
console.log("Above target = fee increases");

let currentBaseFee = baseFee;
console.log("\n\nStarting base fee:", currentBaseFee);

utilizationLevels.forEach((utilization) => {
	const gasUsed = BigInt(Math.floor(Number(gasLimit) * utilization));
	const nextBaseFee = FeeMarket.BaseFee(gasUsed, gasLimit, currentBaseFee);
	const change = nextBaseFee - currentBaseFee;
	const pct = (Number(change) / Number(currentBaseFee)) * 100;

	console.log(`\n${(utilization * 100).toFixed(0)}% utilization:`);
	console.log(`  Gas used: ${gasUsed}`);
	console.log(`  Base fee: ${currentBaseFee} -> ${nextBaseFee}`);
	console.log(`  Change: ${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`);

	// Check if above/below/at target
	if (gasUsed > gasTarget) {
		console.log(`  Status: Above target (congested)`);
	} else if (gasUsed < gasTarget) {
		console.log(`  Status: Below target (underutilized)`);
	} else {
		console.log(`  Status: At target (equilibrium)`);
	}

	currentBaseFee = nextBaseFee;
});

// Demonstrate convergence to target
console.log("\n\nConvergence to equilibrium:");
console.log("Sustained high demand (80% utilization):");

let state: FeeMarket.State = {
	gasUsed: 0n,
	gasLimit: gasLimit,
	baseFee: 1_000_000_000n,
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

// Simulate 10 blocks at 80% utilization
for (let i = 0; i < 10; i++) {
	state = {
		...state,
		gasUsed: (gasLimit * 80n) / 100n,
	};
	state = FeeMarket.nextState(state);

	if (i % 2 === 0) {
		console.log(`Block ${i + 1}: ${state.baseFee}`);
	}
}

console.log("\nBase fee rises to price out demand and reach equilibrium");
