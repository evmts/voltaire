/**
 * Benchmark: FeeMarket TypeScript vs WASM implementations
 * Compares performance of EIP-1559 and EIP-4844 fee calculations
 *
 * Note: WASM re-exports pure TypeScript (no native WASM impl) - benchmarks
 * verify overhead is negligible and document pure TS performance.
 */

import { bench, run } from "mitata";
import * as FeeMarketWasm from "./FeeMarket.wasm.js";
import * as FeeMarket from "./index.js";

// ============================================================================
// Test Data - Realistic mainnet values
// ============================================================================

const testState: FeeMarket.State = {
	gasUsed: 20_000_000n,
	gasLimit: 30_000_000n,
	baseFee: 1_000_000_000n, // 1 gwei
	excessBlobGas: 393216n,
	blobGasUsed: 262144n,
};

const testTxParams: FeeMarket.TxFeeParams = {
	maxFeePerGas: 2_000_000_000n, // 2 gwei
	maxPriorityFeePerGas: 1_000_000_000n, // 1 gwei
	baseFee: 800_000_000n, // 0.8 gwei
};

const testBlobTxParams: FeeMarket.BlobTxFeeParams = {
	...testTxParams,
	maxFeePerBlobGas: 10_000_000n,
	blobBaseFee: 5_000_000n,
	blobCount: 3n,
};

// ============================================================================
// BaseFee Calculation (EIP-1559)
// ============================================================================

bench("BaseFee - at target - TS", () => {
	FeeMarket.BaseFee(15_000_000n, 30_000_000n, 1_000_000_000n);
});

bench("BaseFee - at target - WASM", () => {
	FeeMarketWasm.BaseFee(15_000_000n, 30_000_000n, 1_000_000_000n);
});

await run();

bench("BaseFee - above target - TS", () => {
	FeeMarket.BaseFee(25_000_000n, 30_000_000n, 1_000_000_000n);
});

bench("BaseFee - above target - WASM", () => {
	FeeMarketWasm.BaseFee(25_000_000n, 30_000_000n, 1_000_000_000n);
});

await run();

bench("BaseFee - below target - TS", () => {
	FeeMarket.BaseFee(10_000_000n, 30_000_000n, 1_000_000_000n);
});

bench("BaseFee - below target - WASM", () => {
	FeeMarketWasm.BaseFee(10_000_000n, 30_000_000n, 1_000_000_000n);
});

await run();

bench("BaseFee - full block - TS", () => {
	FeeMarket.BaseFee(30_000_000n, 30_000_000n, 1_000_000_000n);
});

bench("BaseFee - full block - WASM", () => {
	FeeMarketWasm.BaseFee(30_000_000n, 30_000_000n, 1_000_000_000n);
});

await run();

bench("BaseFee - empty block - TS", () => {
	FeeMarket.BaseFee(0n, 30_000_000n, 1_000_000_000n);
});

bench("BaseFee - empty block - WASM", () => {
	FeeMarketWasm.BaseFee(0n, 30_000_000n, 1_000_000_000n);
});

await run();

// ============================================================================
// BlobBaseFee Calculation (EIP-4844)
// ============================================================================

bench("BlobBaseFee - no excess - TS", () => {
	FeeMarket.BlobBaseFee(0n);
});

bench("BlobBaseFee - no excess - WASM", () => {
	FeeMarketWasm.BlobBaseFee(0n);
});

await run();

bench("BlobBaseFee - at target - TS", () => {
	FeeMarket.BlobBaseFee(393216n);
});

bench("BlobBaseFee - at target - WASM", () => {
	FeeMarketWasm.BlobBaseFee(393216n);
});

await run();

bench("BlobBaseFee - high excess - TS", () => {
	FeeMarket.BlobBaseFee(1_000_000n);
});

bench("BlobBaseFee - high excess - WASM", () => {
	FeeMarketWasm.BlobBaseFee(1_000_000n);
});

await run();

bench("BlobBaseFee - very high excess - TS", () => {
	FeeMarket.BlobBaseFee(10_000_000n);
});

bench("BlobBaseFee - very high excess - WASM", () => {
	FeeMarketWasm.BlobBaseFee(10_000_000n);
});

await run();

// ============================================================================
// Excess Blob Gas Calculation
// ============================================================================

bench("calculateExcessBlobGas - below target - TS", () => {
	FeeMarket.calculateExcessBlobGas(0n, 131072n);
});

bench("calculateExcessBlobGas - below target - WASM", () => {
	FeeMarketWasm.calculateExcessBlobGas(0n, 131072n);
});

await run();

bench("calculateExcessBlobGas - at target - TS", () => {
	FeeMarket.calculateExcessBlobGas(0n, 393216n);
});

bench("calculateExcessBlobGas - at target - WASM", () => {
	FeeMarketWasm.calculateExcessBlobGas(0n, 393216n);
});

await run();

bench("calculateExcessBlobGas - with previous excess - TS", () => {
	FeeMarket.calculateExcessBlobGas(393216n, 393216n);
});

bench("calculateExcessBlobGas - with previous excess - WASM", () => {
	FeeMarketWasm.calculateExcessBlobGas(393216n, 393216n);
});

await run();

// ============================================================================
// Transaction Fee Calculation
// ============================================================================

bench("calculateTxFee - normal - TS", () => {
	FeeMarket.calculateTxFee(testTxParams);
});

bench("calculateTxFee - normal - WASM", () => {
	FeeMarketWasm.calculateTxFee(testTxParams);
});

await run();

bench("calculateTxFee - capped by maxFee - TS", () => {
	FeeMarket.calculateTxFee({
		maxFeePerGas: 1_500_000_000n,
		maxPriorityFeePerGas: 1_000_000_000n,
		baseFee: 800_000_000n,
	});
});

bench("calculateTxFee - capped by maxFee - WASM", () => {
	FeeMarketWasm.calculateTxFee({
		maxFeePerGas: 1_500_000_000n,
		maxPriorityFeePerGas: 1_000_000_000n,
		baseFee: 800_000_000n,
	});
});

await run();

bench("calculateTxFee - zero priority - TS", () => {
	FeeMarket.calculateTxFee({
		maxFeePerGas: 1_000_000_000n,
		maxPriorityFeePerGas: 0n,
		baseFee: 1_000_000_000n,
	});
});

bench("calculateTxFee - zero priority - WASM", () => {
	FeeMarketWasm.calculateTxFee({
		maxFeePerGas: 1_000_000_000n,
		maxPriorityFeePerGas: 0n,
		baseFee: 1_000_000_000n,
	});
});

await run();

// ============================================================================
// Blob Transaction Fee Calculation
// ============================================================================

bench("calculateBlobTxFee - normal - TS", () => {
	FeeMarket.calculateBlobTxFee(testBlobTxParams);
});

bench("calculateBlobTxFee - normal - WASM", () => {
	FeeMarketWasm.calculateBlobTxFee(testBlobTxParams);
});

await run();

bench("calculateBlobTxFee - 1 blob - TS", () => {
	FeeMarket.calculateBlobTxFee({ ...testBlobTxParams, blobCount: 1n });
});

bench("calculateBlobTxFee - 1 blob - WASM", () => {
	FeeMarketWasm.calculateBlobTxFee({ ...testBlobTxParams, blobCount: 1n });
});

await run();

bench("calculateBlobTxFee - 6 blobs - TS", () => {
	FeeMarket.calculateBlobTxFee({ ...testBlobTxParams, blobCount: 6n });
});

bench("calculateBlobTxFee - 6 blobs - WASM", () => {
	FeeMarketWasm.calculateBlobTxFee({ ...testBlobTxParams, blobCount: 6n });
});

await run();

// ============================================================================
// Transaction Inclusion Check
// ============================================================================

bench("canIncludeTx - normal tx - TS", () => {
	FeeMarket.canIncludeTx(testTxParams);
});

bench("canIncludeTx - normal tx - WASM", () => {
	FeeMarketWasm.canIncludeTx(testTxParams);
});

await run();

bench("canIncludeTx - blob tx - TS", () => {
	FeeMarket.canIncludeTx(testBlobTxParams);
});

bench("canIncludeTx - blob tx - WASM", () => {
	FeeMarketWasm.canIncludeTx(testBlobTxParams);
});

await run();

bench("canIncludeTx - insufficient fee - TS", () => {
	FeeMarket.canIncludeTx({
		maxFeePerGas: 500_000_000n,
		maxPriorityFeePerGas: 100_000_000n,
		baseFee: 800_000_000n,
	});
});

bench("canIncludeTx - insufficient fee - WASM", () => {
	FeeMarketWasm.canIncludeTx({
		maxFeePerGas: 500_000_000n,
		maxPriorityFeePerGas: 100_000_000n,
		baseFee: 800_000_000n,
	});
});

await run();

// ============================================================================
// State Transitions
// ============================================================================

bench("nextState - TS", () => {
	FeeMarket.nextState(testState);
});

bench("nextState - WASM", () => {
	FeeMarketWasm.nextState(testState);
});

await run();

bench("State.next (convenience) - TS", () => {
	FeeMarket.State.next.call(testState);
});

bench("State.next (convenience) - WASM", () => {
	FeeMarketWasm.State.next.call(testState);
});

await run();

// ============================================================================
// State Query Methods
// ============================================================================

bench("State.getBlobBaseFee - TS", () => {
	FeeMarket.State.getBlobBaseFee.call(testState);
});

bench("State.getBlobBaseFee - WASM", () => {
	FeeMarketWasm.State.getBlobBaseFee.call(testState);
});

await run();

bench("State.getGasTarget - TS", () => {
	FeeMarket.State.getGasTarget.call(testState);
});

bench("State.getGasTarget - WASM", () => {
	FeeMarketWasm.State.getGasTarget.call(testState);
});

await run();

bench("State.isAboveGasTarget - TS", () => {
	FeeMarket.State.isAboveGasTarget.call(testState);
});

bench("State.isAboveGasTarget - WASM", () => {
	FeeMarketWasm.State.isAboveGasTarget.call(testState);
});

await run();

bench("State.isAboveBlobGasTarget - TS", () => {
	FeeMarket.State.isAboveBlobGasTarget.call(testState);
});

bench("State.isAboveBlobGasTarget - WASM", () => {
	FeeMarketWasm.State.isAboveBlobGasTarget.call(testState);
});

await run();

// ============================================================================
// Fee Projection (Multi-block)
// ============================================================================

bench("projectBaseFees - 10 blocks - TS", () => {
	FeeMarket.projectBaseFees(testState, 10, 25_000_000n, 262144n);
});

bench("projectBaseFees - 10 blocks - WASM", () => {
	FeeMarketWasm.projectBaseFees(testState, 10, 25_000_000n, 262144n);
});

await run();

bench("projectBaseFees - 50 blocks - TS", () => {
	FeeMarket.projectBaseFees(testState, 50, 25_000_000n, 262144n);
});

bench("projectBaseFees - 50 blocks - WASM", () => {
	FeeMarketWasm.projectBaseFees(testState, 50, 25_000_000n, 262144n);
});

await run();

bench("projectBaseFees - 100 blocks - TS", () => {
	FeeMarket.projectBaseFees(testState, 100, 25_000_000n, 262144n);
});

bench("projectBaseFees - 100 blocks - WASM", () => {
	FeeMarketWasm.projectBaseFees(testState, 100, 25_000_000n, 262144n);
});

await run();

// ============================================================================
// Validation
// ============================================================================

bench("validateTxFeeParams - valid tx - TS", () => {
	FeeMarket.validateTxFeeParams(testTxParams);
});

bench("validateTxFeeParams - valid tx - WASM", () => {
	FeeMarketWasm.validateTxFeeParams(testTxParams);
});

await run();

bench("validateTxFeeParams - valid blob tx - TS", () => {
	FeeMarket.validateTxFeeParams(testBlobTxParams);
});

bench("validateTxFeeParams - valid blob tx - WASM", () => {
	FeeMarketWasm.validateTxFeeParams(testBlobTxParams);
});

await run();

bench("validateState - valid - TS", () => {
	FeeMarket.validateState(testState);
});

bench("validateState - valid - WASM", () => {
	FeeMarketWasm.validateState(testState);
});

await run();

// ============================================================================
// Unit Conversion Utilities
// ============================================================================

bench("weiToGwei - TS", () => {
	FeeMarket.weiToGwei(1_234_567_890n);
});

bench("weiToGwei - WASM", () => {
	FeeMarketWasm.weiToGwei(1_234_567_890n);
});

await run();

bench("gweiToWei - TS", () => {
	FeeMarket.gweiToWei(1.23456789);
});

bench("gweiToWei - WASM", () => {
	FeeMarketWasm.gweiToWei(1.23456789);
});

await run();
