import * as FeeMarket from "../../../primitives/FeeMarket/index.js";

// Example: Fee market validation
// Shows validation of states and transaction parameters

console.log("Fee Market Validation");
console.log("=====================\n");

// Valid state
const validState: FeeMarket.State = {
	gasUsed: 15_000_000n,
	gasLimit: 30_000_000n,
	baseFee: 1_000_000_000n,
	excessBlobGas: 0n,
	blobGasUsed: 0n,
};

console.log("Valid state:");
console.log("  Gas used:", validState.gasUsed);
console.log("  Gas limit:", validState.gasLimit);
console.log("  Base fee:", validState.baseFee);
console.log("  Excess blob gas:", validState.excessBlobGas);
console.log("  Blob gas used:", validState.blobGasUsed);

try {
	FeeMarket.validateState(validState);
	console.log("✓ State is valid");
} catch (error) {
	console.log("✗ State is invalid:", error);
}

// Gas used validation
console.log("\n\nGas used validation:");
console.log("===================");

const invalidGasUsed: FeeMarket.State = {
	...validState,
	gasUsed: 35_000_000n, // Exceeds limit!
};

console.log("Gas used:", invalidGasUsed.gasUsed);
console.log("Gas limit:", invalidGasUsed.gasLimit);

try {
	FeeMarket.validateState(invalidGasUsed);
	console.log("✓ State is valid");
} catch (error) {
	console.log(
		"✗ State is invalid:",
		error instanceof Error ? error.message : error,
	);
}

// Blob gas validation
console.log("\n\nBlob gas validation:");
console.log("====================");

const invalidBlobGas: FeeMarket.State = {
	...validState,
	blobGasUsed: FeeMarket.Eip4844.MAX_BLOB_GAS_PER_BLOCK + 1n, // Over max!
};

console.log("Blob gas used:", invalidBlobGas.blobGasUsed);
console.log("Max blob gas:", FeeMarket.Eip4844.MAX_BLOB_GAS_PER_BLOCK);

try {
	FeeMarket.validateState(invalidBlobGas);
	console.log("✓ State is valid");
} catch (error) {
	console.log(
		"✗ State is invalid:",
		error instanceof Error ? error.message : error,
	);
}

// Transaction parameters validation
console.log("\n\nTransaction parameters validation:");
console.log("==================================");

const validTxParams = {
	maxFeePerGas: 2_000_000_000n,
	maxPriorityFeePerGas: 1_000_000_000n,
	baseFee: 1_000_000_000n,
};

console.log("Max fee per gas:", validTxParams.maxFeePerGas);
console.log("Max priority fee:", validTxParams.maxPriorityFeePerGas);
console.log("Base fee:", validTxParams.baseFee);

try {
	FeeMarket.validateTxFeeParams(validTxParams);
	console.log("✓ Transaction params valid");
} catch (error) {
	console.log("✗ Transaction params invalid:", error);
}

// Invalid: max fee too low
console.log("\n\nInvalid: Max fee below base fee:");
console.log("=================================");

const invalidMaxFee = {
	maxFeePerGas: 500_000_000n, // Too low!
	maxPriorityFeePerGas: 100_000_000n,
	baseFee: 1_000_000_000n,
};

console.log("Max fee per gas:", invalidMaxFee.maxFeePerGas);
console.log("Base fee:", invalidMaxFee.baseFee);

try {
	FeeMarket.validateTxFeeParams(invalidMaxFee);
	console.log("✓ Transaction params valid");
} catch (error) {
	console.log(
		"✗ Transaction params invalid:",
		error instanceof Error ? error.message : error,
	);
}

console.log("\nTransaction would be rejected (cannot pay base fee)");

// Check if transaction can be included
console.log("\n\nTransaction inclusion check:");
console.log("============================");

const txParams1 = {
	maxFeePerGas: 2_000_000_000n,
	maxPriorityFeePerGas: 1_000_000_000n,
	baseFee: 1_500_000_000n,
};

console.log("Scenario 1:");
console.log("  Max fee:", txParams1.maxFeePerGas);
console.log("  Base fee:", txParams1.baseFee);

const canInclude1 = FeeMarket.canIncludeTx(txParams1);
console.log("  Can include:", canInclude1 ? "✓ Yes" : "✗ No");

const txParams2 = {
	maxFeePerGas: 1_000_000_000n,
	maxPriorityFeePerGas: 500_000_000n,
	baseFee: 1_500_000_000n,
};

console.log("\nScenario 2:");
console.log("  Max fee:", txParams2.maxFeePerGas);
console.log("  Base fee:", txParams2.baseFee);

const canInclude2 = FeeMarket.canIncludeTx(txParams2);
console.log("  Can include:", canInclude2 ? "✓ Yes" : "✗ No");

// Unit conversions validation
console.log("\n\nUnit conversions:");
console.log("=================");

const gwei = 50; // Number, not bigint
const wei = FeeMarket.gweiToWei(gwei);
const backToGwei = FeeMarket.weiToGwei(wei);

console.log("Original (gwei):", gwei);
console.log("Converted (wei):", wei);
console.log("Back to gwei:", backToGwei);
console.log("Round-trip successful:", gwei === backToGwei);

// Blob alignment validation
console.log("\n\nBlob gas alignment:");
console.log("===================");

const blobGasPerBlob = FeeMarket.Eip4844.BLOB_GAS_PER_BLOB;
const validBlobGas = blobGasPerBlob * 3n; // 3 blobs
const invalidBlobGasAlignment = blobGasPerBlob * 3n + 1n; // Misaligned

console.log("Blob gas per blob:", blobGasPerBlob);
console.log("Valid (3 blobs):", validBlobGas);
console.log(
	"  Aligned:",
	validBlobGas % blobGasPerBlob === 0n ? "✓ Yes" : "✗ No",
);

console.log("Invalid (3 blobs + 1):", invalidBlobGasAlignment);
console.log(
	"  Aligned:",
	invalidBlobGasAlignment % blobGasPerBlob === 0n ? "✓ Yes" : "✗ No",
);

console.log(
	"\nBlob gas must be multiple of",
	blobGasPerBlob,
	"(whole blobs only)",
);
