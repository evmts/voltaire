import { FeeMarket } from "@tevm/voltaire";
// Example: Target utilization and gas elasticity
// EIP-1559 targets 50% utilization for optimal fee stability

const gasLimit = 30_000_000n;
const baseFee = 1_000_000_000n;

// Calculate gas target (50% of limit)
const gasTarget = gasLimit / FeeMarket.Eip1559.ELASTICITY_MULTIPLIER;

// Simulate blocks at different utilization levels
const utilizationLevels = [0.2, 0.4, 0.5, 0.6, 0.8, 1.0];

let currentBaseFee = baseFee;

utilizationLevels.forEach((utilization) => {
	const gasUsed = BigInt(Math.floor(Number(gasLimit) * utilization));
	const nextBaseFee = FeeMarket.BaseFee(gasUsed, gasLimit, currentBaseFee);
	const change = nextBaseFee - currentBaseFee;
	const pct = (Number(change) / Number(currentBaseFee)) * 100;

	// Check if above/below/at target
	if (gasUsed > gasTarget) {
	} else if (gasUsed < gasTarget) {
	} else {
	}

	currentBaseFee = nextBaseFee;
});

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
	}
}
