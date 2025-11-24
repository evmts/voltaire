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

console.log("Current base fee:", currentState.baseFee);
console.log("Current gas limit:", currentState.gasLimit);

// Prediction 1: Assume steady demand at target
console.log("\n\nPrediction 1: Steady demand (50% utilization)");
console.log("===============================================");

const steadyFees = FeeMarket.projectBaseFees(
	currentState,
	10, // 10 blocks
	15_000_000n, // Target utilization
	0n,
);

steadyFees.forEach((fee, i) => {
	console.log(`Block +${i + 1}: ${fee}`);
});
console.log("\nResult: Base fee remains stable at target");

// Prediction 2: High demand period
console.log("\n\nPrediction 2: High demand (75% utilization)");
console.log("============================================");

const highDemandFees = FeeMarket.projectBaseFees(
	currentState,
	10,
	22_500_000n, // 75% utilization
	0n,
);

highDemandFees.forEach((fee, i) => {
	console.log(`Block +${i + 1}: ${fee}`);
});
console.log("\nResult: Base fee increases to reduce demand");

// Prediction 3: Low demand period
console.log("\n\nPrediction 3: Low demand (25% utilization)");
console.log("===========================================");

const lowDemandFees = FeeMarket.projectBaseFees(
	currentState,
	10,
	7_500_000n, // 25% utilization
	0n,
);

lowDemandFees.forEach((fee, i) => {
	console.log(`Block +${i + 1}: ${fee}`);
});
console.log("\nResult: Base fee decreases to attract usage");

// Prediction 4: Maximum congestion
console.log("\n\nPrediction 4: Full congestion (100% utilization)");
console.log("=================================================");

const congestedFees = FeeMarket.projectBaseFees(
	currentState,
	10,
	30_000_000n, // Full blocks
	0n,
);

congestedFees.forEach((fee, i) => {
	console.log(`Block +${i + 1}: ${fee}`);
});

const increase = congestedFees[congestedFees.length - 1] - currentState.baseFee;
const pct = (Number(increase) / Number(currentState.baseFee)) * 100;
console.log(
	`\nTotal increase over 10 blocks: ${increase} (+${pct.toFixed(0)}%)`,
);

// Prediction 5: With blob usage (EIP-4844)
console.log("\n\nPrediction 5: With blob transactions");
console.log("=====================================");

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

console.log("\nBase fees (with blobs):");
withBlobsFees.forEach((fee, i) => {
	console.log(`Block +${i + 1}: ${fee}`);
});

console.log("\nBlob base fees calculated separately via BlobBaseFee()");

// Compare different scenarios
console.log("\n\nScenario comparison (10 blocks out):");
console.log("=====================================");
console.log("Steady (50%):", steadyFees[9]);
console.log("High (75%):", highDemandFees[9]);
console.log("Low (25%):", lowDemandFees[9]);
console.log("Congested (100%):", congestedFees[9]);
