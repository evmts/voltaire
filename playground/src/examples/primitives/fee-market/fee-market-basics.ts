import * as FeeMarket from "../../../primitives/FeeMarket/index.js";

// Example: FeeMarket basics - EIP-1559 fee market dynamics

// 1. Base fee calculation (EIP-1559)
// Formula: adjust base fee based on gas target (50% of limit)
const parentGasUsed = 15_000_000n; // 15M gas used
const parentGasLimit = 30_000_000n; // 30M gas limit
const parentBaseFee = 1_000_000_000n; // 1 gwei

// At target (50% full) - base fee unchanged
const baseFeeAtTarget = FeeMarket.BaseFee(
	parentGasUsed,
	parentGasLimit,
	parentBaseFee,
);
console.log("At target (15M/30M):", baseFeeAtTarget); // 1_000_000_000n

// Above target - base fee increases
const baseFeeAbove = FeeMarket.BaseFee(
	25_000_000n, // 83% full
	parentGasLimit,
	parentBaseFee,
);
console.log("Above target (25M/30M):", baseFeeAbove); // Increased

// Below target - base fee decreases
const baseFeeBelow = FeeMarket.BaseFee(
	5_000_000n, // 17% full
	parentGasLimit,
	parentBaseFee,
);
console.log("Below target (5M/30M):", baseFeeBelow); // Decreased

// 2. Complete fee market state
const currentState: FeeMarket.State = {
	gasUsed: 20_000_000n,
	gasLimit: 30_000_000n,
	baseFee: 1_000_000_000n,
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

// Calculate next block's state
const nextState = FeeMarket.nextState(currentState);
console.log("\nNext block base fee:", nextState.baseFee);
console.log("Next block excess blob gas:", nextState.excessBlobGas);

// 3. Transaction fee calculation
const txParams = {
	maxFeePerGas: 2_000_000_000n, // 2 gwei max
	maxPriorityFeePerGas: 500_000_000n, // 0.5 gwei tip
	baseFee: 1_200_000_000n, // 1.2 gwei current
};

const txFee = FeeMarket.calculateTxFee(txParams);
console.log("\nTransaction fee breakdown:");
console.log("  Effective gas price:", txFee.effectiveGasPrice);
console.log("  Priority fee (tip):", txFee.priorityFee);
console.log("  Base fee (burned):", txFee.baseFee);

// 4. Blob base fee (EIP-4844)
const blobBaseFee0 = FeeMarket.BlobBaseFee(0n);
const blobBaseFee1 = FeeMarket.BlobBaseFee(
	FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK,
);
const blobBaseFee2 = FeeMarket.BlobBaseFee(
	FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK * 2n,
);

console.log("\nBlob base fees:");
console.log("  No excess:", blobBaseFee0); // MIN_BLOB_BASE_FEE
console.log("  At target:", blobBaseFee1);
console.log("  2x target:", blobBaseFee2);

// 5. Fee projections
const projected = FeeMarket.projectBaseFees(
	currentState,
	5, // 5 blocks
	25_000_000n, // Avg gas used (high demand)
	0n, // No blobs
);

console.log("\nProjected base fees (5 blocks, high demand):");
projected.forEach((fee, i) => {
	console.log(`  Block ${i + 1}:`, fee);
});
