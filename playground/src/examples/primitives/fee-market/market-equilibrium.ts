import * as FeeMarket from "../../../primitives/FeeMarket/index.js";

// Example: Market equilibrium and convergence
// Demonstrates how fee market seeks 50% target utilization

console.log("Fee Market Equilibrium Analysis");
console.log("================================\n");

// Start with imbalanced market (high demand, low base fee)
let state: FeeMarket.State = {
	gasUsed: 0n,
	gasLimit: 30_000_000n,
	baseFee: 5_000_000_000n, // 5 gwei (too low for demand)
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

const gasTarget = state.gasLimit / FeeMarket.Eip1559.ELASTICITY_MULTIPLIER;
const demandGas = 28_000_000n; // High demand (93% utilization)

console.log("Initial conditions:");
console.log("  Base fee:", state.baseFee);
console.log("  Gas target:", gasTarget);
console.log("  Demand level:", demandGas, "(93% of limit)");
console.log("\nMarket is out of equilibrium (demand > target)");

// Simulate convergence
console.log("\n\nConvergence to equilibrium:");
console.log("Block | Gas Used | Base Fee | Utilization");
console.log("------|----------|----------|------------");

let actualGasUsed = demandGas;
for (let i = 0; i < 20; i++) {
	// Demand is price-sensitive: as base fee rises, some users drop out
	// Simple model: demand drops 1% for every 10% base fee increase
	const priceRatio = Number(state.baseFee) / 5_000_000_000;
	const demandReduction = Math.max(0, Math.min(0.3, (priceRatio - 1) * 0.1));
	actualGasUsed = BigInt(Math.floor(Number(demandGas) * (1 - demandReduction)));

	// Don't exceed limit
	if (actualGasUsed > state.gasLimit) {
		actualGasUsed = state.gasLimit;
	}

	state = { ...state, gasUsed: actualGasUsed };
	const nextState = FeeMarket.nextState(state);

	const utilization = (Number(actualGasUsed) / Number(state.gasLimit)) * 100;

	if (i % 2 === 0 || i === 19) {
		console.log(
			`${String(i + 1).padStart(5)} | ${String(actualGasUsed).padStart(8)} | ${String(nextState.baseFee).padStart(8)} | ${utilization.toFixed(1)}%`,
		);
	}

	state = nextState;

	// Check if we've reached equilibrium (within 5% of target)
	const targetUtilization = 50;
	if (Math.abs(utilization - targetUtilization) < 5) {
		if (i < 19) {
			console.log("\nEquilibrium reached!");
			break;
		}
	}
}

console.log("\n\nEquilibrium characteristics:");
console.log("  Target utilization: 50%");
console.log(
	"  Achieved utilization:",
	((Number(actualGasUsed) / Number(state.gasLimit)) * 100).toFixed(1),
	"%",
);
console.log("  Final base fee:", state.baseFee);
console.log("  Price signal balanced supply and demand");

// Demonstrate stability at equilibrium
console.log("\n\nStability test at equilibrium:");
console.log("==============================");

// Reset to equilibrium
state = {
	gasUsed: 0n,
	gasLimit: 30_000_000n,
	baseFee: 10_000_000_000n,
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

console.log("Starting at equilibrium (50% utilization)");
console.log("Initial base fee:", state.baseFee);

// Maintain 50% utilization
for (let i = 0; i < 5; i++) {
	state = { ...state, gasUsed: gasTarget };
	state = FeeMarket.nextState(state);
	console.log(`Block ${i + 1}: ${state.baseFee}`);
}

console.log("\nBase fee remains stable when at target");

// Resistance to perturbations
console.log("\n\nPerturbation recovery:");
console.log("======================");

console.log("\n1 block spike to 100%, then return to 50%:");
state = { ...state, gasUsed: state.gasLimit };
state = FeeMarket.nextState(state);
console.log("  After spike:", state.baseFee);

// Return to equilibrium
for (let i = 0; i < 3; i++) {
	state = { ...state, gasUsed: gasTarget };
	state = FeeMarket.nextState(state);
	console.log(`  Block ${i + 1} at target:`, state.baseFee);
}

console.log("\nMarket self-corrects back to equilibrium");

// Show elasticity benefit
console.log("\n\nElasticity benefit:");
console.log("===================");
console.log("Gas limit:", state.gasLimit, "(can handle temporary spikes)");
console.log("Gas target:", gasTarget, "(normal steady state)");
console.log(
	"Elasticity:",
	FeeMarket.Eip1559.ELASTICITY_MULTIPLIER,
	"x (2x capacity for peaks)",
);
console.log("\nAllows temporary demand spikes without rejection");
console.log("Base fee increases to signal congestion");
