import { FeeMarket } from "voltaire";
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
	}

	state = nextState;

	// Check if we've reached equilibrium (within 5% of target)
	const targetUtilization = 50;
	if (Math.abs(utilization - targetUtilization) < 5) {
		if (i < 19) {
			break;
		}
	}
}

// Reset to equilibrium
state = {
	gasUsed: 0n,
	gasLimit: 30_000_000n,
	baseFee: 10_000_000_000n,
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

// Maintain 50% utilization
for (let i = 0; i < 5; i++) {
	state = { ...state, gasUsed: gasTarget };
	state = FeeMarket.nextState(state);
}
state = { ...state, gasUsed: state.gasLimit };
state = FeeMarket.nextState(state);

// Return to equilibrium
for (let i = 0; i < 3; i++) {
	state = { ...state, gasUsed: gasTarget };
	state = FeeMarket.nextState(state);
}
