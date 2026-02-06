/**
 * Benchmark: TypeScript vs WASM Gas Constants
 *
 * Note: WASM intentionally not implemented for GasConstants.
 * These operations (constant lookups, simple arithmetic) are faster in pure TS
 * than WASM due to call overhead (~1-2us per WASM call).
 *
 * This benchmark demonstrates why WASM was not implemented:
 * - Both imports use identical TypeScript implementation
 * - Operations complete in nanoseconds
 * - WASM overhead would make them 10-100x slower
 */

import { bench, run } from "mitata";
import * as GasWasm from "./GasConstants.wasm.js";
import * as GasTS from "./index.js";

// Test data
const emptyCalldata = new Uint8Array(0);
const smallCalldata = new Uint8Array(100);
for (let i = 0; i < 100; i++) {
	smallCalldata[i] = i % 2 === 0 ? 0 : i;
}
const largeCalldata = new Uint8Array(1000).fill(1);

// ============================================================================
// Keccak256 Cost
// ============================================================================

bench("calculateKeccak256Cost - 32 bytes - TS", () => {
	GasTS.calculateKeccak256Cost(32n);
});

bench("calculateKeccak256Cost - 32 bytes - WASM", () => {
	GasWasm.calculateKeccak256Cost(32n);
});

await run();

bench("calculateKeccak256Cost - 1KB - TS", () => {
	GasTS.calculateKeccak256Cost(1024n);
});

bench("calculateKeccak256Cost - 1KB - WASM", () => {
	GasWasm.calculateKeccak256Cost(1024n);
});

await run();

// ============================================================================
// Memory Expansion Cost
// ============================================================================

bench("calculateMemoryExpansionCost - 0 to 64 - TS", () => {
	GasTS.calculateMemoryExpansionCost(0n, 64n);
});

bench("calculateMemoryExpansionCost - 0 to 64 - WASM", () => {
	GasWasm.calculateMemoryExpansionCost(0n, 64n);
});

await run();

bench("calculateMemoryExpansionCost - 0 to 10KB - TS", () => {
	GasTS.calculateMemoryExpansionCost(0n, 10240n);
});

bench("calculateMemoryExpansionCost - 0 to 10KB - WASM", () => {
	GasWasm.calculateMemoryExpansionCost(0n, 10240n);
});

await run();

// ============================================================================
// Transaction Intrinsic Gas
// ============================================================================

bench("calculateTxIntrinsicGas - empty - TS", () => {
	GasTS.calculateTxIntrinsicGas(emptyCalldata, false);
});

bench("calculateTxIntrinsicGas - empty - WASM", () => {
	GasWasm.calculateTxIntrinsicGas(emptyCalldata, false);
});

await run();

bench("calculateTxIntrinsicGas - 100 bytes - TS", () => {
	GasTS.calculateTxIntrinsicGas(smallCalldata, false);
});

bench("calculateTxIntrinsicGas - 100 bytes - WASM", () => {
	GasWasm.calculateTxIntrinsicGas(smallCalldata, false);
});

await run();

bench("calculateTxIntrinsicGas - 1000 bytes - TS", () => {
	GasTS.calculateTxIntrinsicGas(largeCalldata, false);
});

bench("calculateTxIntrinsicGas - 1000 bytes - WASM", () => {
	GasWasm.calculateTxIntrinsicGas(largeCalldata, false);
});

await run();

bench("calculateTxIntrinsicGas - create - TS", () => {
	GasTS.calculateTxIntrinsicGas(smallCalldata, true);
});

bench("calculateTxIntrinsicGas - create - WASM", () => {
	GasWasm.calculateTxIntrinsicGas(smallCalldata, true);
});

await run();

// ============================================================================
// Call Cost
// ============================================================================

bench("calculateCallCost - warm no value - TS", () => {
	GasTS.calculateCallCost(true, false, false, 100000n);
});

bench("calculateCallCost - warm no value - WASM", () => {
	GasWasm.calculateCallCost(true, false, false, 100000n);
});

await run();

bench("calculateCallCost - cold with value - TS", () => {
	GasTS.calculateCallCost(false, true, false, 100000n);
});

bench("calculateCallCost - cold with value - WASM", () => {
	GasWasm.calculateCallCost(false, true, false, 100000n);
});

await run();

bench("calculateCallCost - new account - TS", () => {
	GasTS.calculateCallCost(false, true, true, 100000n);
});

bench("calculateCallCost - new account - WASM", () => {
	GasWasm.calculateCallCost(false, true, true, 100000n);
});

await run();

// ============================================================================
// SSTORE Cost
// ============================================================================

bench("calculateSstoreCost - warm no-op - TS", () => {
	GasTS.calculateSstoreCost(true, 100n, 100n);
});

bench("calculateSstoreCost - warm no-op - WASM", () => {
	GasWasm.calculateSstoreCost(true, 100n, 100n);
});

await run();

bench("calculateSstoreCost - cold set - TS", () => {
	GasTS.calculateSstoreCost(false, 0n, 100n);
});

bench("calculateSstoreCost - cold set - WASM", () => {
	GasWasm.calculateSstoreCost(false, 0n, 100n);
});

await run();

bench("calculateSstoreCost - clear - TS", () => {
	GasTS.calculateSstoreCost(true, 100n, 0n);
});

bench("calculateSstoreCost - clear - WASM", () => {
	GasWasm.calculateSstoreCost(true, 100n, 0n);
});

await run();

// ============================================================================
// Log Cost
// ============================================================================

bench("calculateLogCost - LOG0 no data - TS", () => {
	GasTS.calculateLogCost(0n, 0n);
});

bench("calculateLogCost - LOG0 no data - WASM", () => {
	GasWasm.calculateLogCost(0n, 0n);
});

await run();

bench("calculateLogCost - LOG2 64 bytes - TS", () => {
	GasTS.calculateLogCost(2n, 64n);
});

bench("calculateLogCost - LOG2 64 bytes - WASM", () => {
	GasWasm.calculateLogCost(2n, 64n);
});

await run();

bench("calculateLogCost - LOG4 1000 bytes - TS", () => {
	GasTS.calculateLogCost(4n, 1000n);
});

bench("calculateLogCost - LOG4 1000 bytes - WASM", () => {
	GasWasm.calculateLogCost(4n, 1000n);
});

await run();

// ============================================================================
// Copy Cost
// ============================================================================

bench("calculateCopyCost - 64 bytes - TS", () => {
	GasTS.calculateCopyCost(64n);
});

bench("calculateCopyCost - 64 bytes - WASM", () => {
	GasWasm.calculateCopyCost(64n);
});

await run();

bench("calculateCopyCost - 1000 bytes - TS", () => {
	GasTS.calculateCopyCost(1000n);
});

bench("calculateCopyCost - 1000 bytes - WASM", () => {
	GasWasm.calculateCopyCost(1000n);
});

await run();

// ============================================================================
// Create Cost
// ============================================================================

bench("calculateCreateCost - minimal - TS", () => {
	GasTS.calculateCreateCost(0n, 0n);
});

bench("calculateCreateCost - minimal - WASM", () => {
	GasWasm.calculateCreateCost(0n, 0n);
});

await run();

bench("calculateCreateCost - typical - TS", () => {
	GasTS.calculateCreateCost(5000n, 2000n);
});

bench("calculateCreateCost - typical - WASM", () => {
	GasWasm.calculateCreateCost(5000n, 2000n);
});

await run();

// ============================================================================
// Max Refund
// ============================================================================

bench("calculateMaxRefund - 100K gas - TS", () => {
	GasTS.calculateMaxRefund(100000n);
});

bench("calculateMaxRefund - 100K gas - WASM", () => {
	GasWasm.calculateMaxRefund(100000n);
});

await run();

// ============================================================================
// Precompile Costs
// ============================================================================

bench("Precompile.calculateSha256Cost - 64 bytes - TS", () => {
	GasTS.Precompile.calculateSha256Cost(64n);
});

bench("Precompile.calculateSha256Cost - 64 bytes - WASM", () => {
	GasWasm.Precompile.calculateSha256Cost(64n);
});

await run();

bench("Precompile.calculateModExpCost - RSA-2048 - TS", () => {
	GasTS.Precompile.calculateModExpCost(256n, 256n, 256n, 65537n);
});

bench("Precompile.calculateModExpCost - RSA-2048 - WASM", () => {
	GasWasm.Precompile.calculateModExpCost(256n, 256n, 256n, 65537n);
});

await run();

bench("Precompile.calculateEcPairingCost - 3 pairs - TS", () => {
	GasTS.Precompile.calculateEcPairingCost(3n, "istanbul");
});

bench("Precompile.calculateEcPairingCost - 3 pairs - WASM", () => {
	GasWasm.Precompile.calculateEcPairingCost(3n, "istanbul");
});

await run();

// ============================================================================
// EIP Check Functions
// ============================================================================

bench("hasEIP2929 - Berlin - TS", () => {
	GasTS.hasEIP2929("berlin");
});

bench("hasEIP2929 - Berlin - WASM", () => {
	GasWasm.hasEIP2929("berlin");
});

await run();

bench("hasEIP3529 - London - TS", () => {
	GasTS.hasEIP3529("london");
});

bench("hasEIP3529 - London - WASM", () => {
	GasWasm.hasEIP3529("london");
});

await run();

// ============================================================================
// Hardfork-specific Costs
// ============================================================================

bench("getColdSloadCost - Berlin - TS", () => {
	GasTS.getColdSloadCost("berlin");
});

bench("getColdSloadCost - Berlin - WASM", () => {
	GasWasm.getColdSloadCost("berlin");
});

await run();

bench("getColdAccountAccessCost - London - TS", () => {
	GasTS.getColdAccountAccessCost("london");
});

bench("getColdAccountAccessCost - London - WASM", () => {
	GasWasm.getColdAccountAccessCost("london");
});

await run();

bench("getSstoreRefund - London - TS", () => {
	GasTS.getSstoreRefund("london");
});

bench("getSstoreRefund - London - WASM", () => {
	GasWasm.getSstoreRefund("london");
});

await run();

// ============================================================================
// Combined Operations (Real-world scenarios)
// ============================================================================

bench("Full tx cost calculation - TS", () => {
	const intrinsic = GasTS.calculateTxIntrinsicGas(smallCalldata, false);
	const sstore = GasTS.calculateSstoreCost(false, 0n, 100n);
	const log = GasTS.calculateLogCost(2n, 64n);
	return intrinsic + sstore.cost + log;
});

bench("Full tx cost calculation - WASM", () => {
	const intrinsic = GasWasm.calculateTxIntrinsicGas(smallCalldata, false);
	const sstore = GasWasm.calculateSstoreCost(false, 0n, 100n);
	const log = GasWasm.calculateLogCost(2n, 64n);
	return intrinsic + sstore.cost + log;
});

await run();

bench("Contract deployment estimation - TS", () => {
	const create = GasTS.calculateCreateCost(5000n, 2000n);
	const memory = GasTS.calculateMemoryExpansionCost(0n, 5000n);
	return create.total + memory.expansionCost;
});

bench("Contract deployment estimation - WASM", () => {
	const create = GasWasm.calculateCreateCost(5000n, 2000n);
	const memory = GasWasm.calculateMemoryExpansionCost(0n, 5000n);
	return create.total + memory.expansionCost;
});

await run();

bench("Complex call with storage and logs - TS", () => {
	const call = GasTS.calculateCallCost(false, true, false, 100000n);
	const sstore = GasTS.calculateSstoreCost(true, 100n, 200n);
	const log = GasTS.calculateLogCost(3n, 256n);
	return call.total + sstore.cost + log;
});

bench("Complex call with storage and logs - WASM", () => {
	const call = GasWasm.calculateCallCost(false, true, false, 100000n);
	const sstore = GasWasm.calculateSstoreCost(true, 100n, 200n);
	const log = GasWasm.calculateLogCost(3n, 256n);
	return call.total + sstore.cost + log;
});

await run();
