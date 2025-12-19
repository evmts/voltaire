import * as FeeMarket from "../../../primitives/FeeMarket/index.js";

// Valid state
const validState: FeeMarket.State = {
	gasUsed: 15_000_000n,
	gasLimit: 30_000_000n,
	baseFee: 1_000_000_000n,
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

try {
	FeeMarket.validateState(validState);
} catch (error) {}

const invalidGasUsed: FeeMarket.State = {
	...validState,
	gasUsed: 35_000_000n, // Exceeds limit!
};

try {
	FeeMarket.validateState(invalidGasUsed);
} catch (error) {}

const invalidBlobGas: FeeMarket.State = {
	...validState,
	blobGasUsed: FeeMarket.Eip4844.MAX_BLOB_GAS_PER_BLOCK + 1n, // Over max!
};

try {
	FeeMarket.validateState(invalidBlobGas);
} catch (error) {}

const validTxParams = {
	maxFeePerGas: 2_000_000_000n,
	maxPriorityFeePerGas: 1_000_000_000n,
	baseFee: 1_000_000_000n,
};

try {
	FeeMarket.validateTxFeeParams(validTxParams);
} catch (error) {}

const invalidMaxFee = {
	maxFeePerGas: 500_000_000n, // Too low!
	maxPriorityFeePerGas: 100_000_000n,
	baseFee: 1_000_000_000n,
};

try {
	FeeMarket.validateTxFeeParams(invalidMaxFee);
} catch (error) {}

const txParams1 = {
	maxFeePerGas: 2_000_000_000n,
	maxPriorityFeePerGas: 1_000_000_000n,
	baseFee: 1_500_000_000n,
};

const canInclude1 = FeeMarket.canIncludeTx(txParams1);

const txParams2 = {
	maxFeePerGas: 1_000_000_000n,
	maxPriorityFeePerGas: 500_000_000n,
	baseFee: 1_500_000_000n,
};

const canInclude2 = FeeMarket.canIncludeTx(txParams2);

const gwei = 50; // Number, not bigint
const wei = FeeMarket.gweiToWei(gwei);
const backToGwei = FeeMarket.weiToGwei(wei);

const blobGasPerBlob = FeeMarket.Eip4844.BLOB_GAS_PER_BLOB;
const validBlobGas = blobGasPerBlob * 3n; // 3 blobs
const invalidBlobGasAlignment = blobGasPerBlob * 3n + 1n; // Misaligned
