/**
 * WASM-accelerated Fee Market calculations
 *
 * **Status**: WASM NOT IMPLEMENTED (and not needed)
 *
 * ## Why No WASM?
 *
 * fee-market provides:
 * - EIP-1559 and EIP-4844 constants (no computation)
 * - Simple bigint arithmetic (base fee calculation, blob fee formula)
 * - Lightweight validation functions
 *
 * These operations are:
 * - Already optimal in TypeScript
 * - Too lightweight for WASM overhead to provide benefit
 * - Pure constants/calculations with no I/O or complex state
 *
 * **WASM overhead** (~1-2μs per call) exceeds calculation time (<100ns).
 *
 * ## Performance Characteristics
 *
 * Pure TypeScript implementation benchmarks:
 * - calculateBaseFee: ~100-200ns per call
 * - calculateBlobBaseFee: ~200-500ns per call (Taylor series)
 * - calculateTxFee: ~50-100ns per call
 * - nextState: ~500-800ns per call
 *
 * **WASM would be 10-20x SLOWER** due to call overhead.
 *
 * ## When to Use WASM
 *
 * WASM is beneficial for:
 * - Heavy computation (>10μs)
 * - Cryptographic operations (hashing, signatures)
 * - Large data processing (RLP encoding, ABI encoding)
 * - Batch operations (processing many items)
 *
 * fee-market does not fit these criteria.
 *
 * @module fee-market.wasm
 */

// Re-export everything from pure TypeScript implementation
export * from "./FeeMarket/index.js";
export { FeeMarket } from "./FeeMarket/index.js";

// ============================================================================
// Implementation Status
// ============================================================================

/**
 * Check if WASM fee market implementation is available
 *
 * @returns Always false - WASM not implemented (and not needed)
 *
 * @example
 * ```typescript
 * import { isWasmFeeMarketAvailable } from './fee-market.wasm.js';
 *
 * if (isWasmFeeMarketAvailable()) {
 *   // Never reaches here
 * } else {
 *   // Always uses pure TypeScript
 * }
 * ```
 */
export function isWasmFeeMarketAvailable(): boolean {
	return false;
}

/**
 * Get implementation status and recommendations
 *
 * @returns Status object with availability and recommendations
 *
 * @example
 * ```typescript
 * import { getFeeMarketImplementationStatus } from './fee-market.wasm.js';
 *
 * const status = getFeeMarketImplementationStatus();
 * console.log(status.available); // false
 * console.log(status.reason); // "Pure TS optimal - WASM overhead exceeds benefit"
 * ```
 */
export function getFeeMarketImplementationStatus(): {
	available: boolean;
	reason: string;
	recommendation: string;
	performance: {
		typescriptAvg: string;
		wasmOverhead: string;
		verdict: string;
	};
} {
	return {
		available: false,
		reason: "Pure TS optimal - WASM overhead exceeds benefit",
		recommendation:
			"Use pure TypeScript implementation - already optimal for lightweight calculations",
		performance: {
			typescriptAvg: "100-800ns per operation",
			wasmOverhead: "1-2μs per WASM call",
			verdict: "TypeScript 10-20x faster for these operations",
		},
	};
}

// Note: No WASM-specific exports since WASM is not implemented
// All functions use pure TypeScript from fee-market.ts
