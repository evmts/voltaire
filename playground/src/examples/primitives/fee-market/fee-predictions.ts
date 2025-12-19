import * as FeeMarket from "../../../primitives/FeeMarket/index.js";

// Example: Fee predictions using projectBaseFees
// Estimate future fees based on expected demand

const currentState: FeeMarket.State = {
	gasUsed: 15_000_000n,
	gasLimit: 30_000_000n,
	baseFee: 1_000_000_000n, // 1 gwei
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

const steadyFees = FeeMarket.projectBaseFees(
	currentState,
	10, // 10 blocks
	15_000_000n, // Target utilization
	0n,
);

steadyFees.forEach((fee, i) => {});

const highDemandFees = FeeMarket.projectBaseFees(
	currentState,
	10,
	22_500_000n, // 75% utilization
	0n,
);

highDemandFees.forEach((fee, i) => {});

const lowDemandFees = FeeMarket.projectBaseFees(
	currentState,
	10,
	7_500_000n, // 25% utilization
	0n,
);

lowDemandFees.forEach((fee, i) => {});

const congestedFees = FeeMarket.projectBaseFees(
	currentState,
	10,
	30_000_000n, // Full blocks
	0n,
);

congestedFees.forEach((fee, i) => {});

const increase = congestedFees[congestedFees.length - 1] - currentState.baseFee;
const pct = (Number(increase) / Number(currentState.baseFee)) * 100;

const withBlobsState: FeeMarket.State = {
	gasUsed: 15_000_000n,
	gasLimit: 30_000_000n,
	baseFee: 1_000_000_000n,
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

const withBlobsFees = FeeMarket.projectBaseFees(
	withBlobsState,
	5,
	20_000_000n, // Regular gas
	FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK, // Blob gas at target
);
withBlobsFees.forEach((fee, i) => {});
