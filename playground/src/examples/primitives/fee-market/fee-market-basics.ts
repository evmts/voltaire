import { FeeMarket } from "voltaire";
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

// Above target - base fee increases
const baseFeeAbove = FeeMarket.BaseFee(
	25_000_000n, // 83% full
	parentGasLimit,
	parentBaseFee,
);

// Below target - base fee decreases
const baseFeeBelow = FeeMarket.BaseFee(
	5_000_000n, // 17% full
	parentGasLimit,
	parentBaseFee,
);

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

// 3. Transaction fee calculation
const txParams = {
	maxFeePerGas: 2_000_000_000n, // 2 gwei max
	maxPriorityFeePerGas: 500_000_000n, // 0.5 gwei tip
	baseFee: 1_200_000_000n, // 1.2 gwei current
};

const txFee = FeeMarket.calculateTxFee(txParams);

// 4. Blob base fee (EIP-4844)
const blobBaseFee0 = FeeMarket.BlobBaseFee(0n);
const blobBaseFee1 = FeeMarket.BlobBaseFee(
	FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK,
);
const blobBaseFee2 = FeeMarket.BlobBaseFee(
	FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK * 2n,
);

// 5. Fee projections
const projected = FeeMarket.projectBaseFees(
	currentState,
	5, // 5 blocks
	25_000_000n, // Avg gas used (high demand)
	0n, // No blobs
);
projected.forEach((fee, i) => {});
