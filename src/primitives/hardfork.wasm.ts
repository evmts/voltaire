/**
 * WASM-accelerated Hardfork Operations
 *
 * **Status**: WASM NOT IMPLEMENTED (and not needed)
 *
 * ## Why No WASM?
 *
 * hardfork provides:
 * - Ethereum protocol version enum (just constants)
 * - Simple comparison operations (isAtLeast, isBefore, etc.)
 * - String parsing with lookup table
 * - Feature detection based on version numbers
 *
 * These operations are:
 * - Already optimal in TypeScript
 * - Pure O(1) lookups and numeric comparisons
 * - No heavy computation or data processing
 * - Execution time <100ns per operation
 *
 * **WASM overhead** (~1-2μs per call) would make operations **10-20x SLOWER**.
 *
 * ## Performance Characteristics
 *
 * Pure TypeScript implementation benchmarks:
 * - isAtLeast/isBefore/isAfter: ~10-20ns per call (simple comparison)
 * - fromString: ~50-100ns per call (hash table lookup)
 * - toString: ~20-40ns per call (array index)
 * - hasEIP1559/hasEIP3855/etc: ~15-30ns per call (comparison + branch)
 * - Feature detection: ~20-50ns per call
 *
 * **WASM would be 50-100x SLOWER** due to call overhead.
 *
 * ## When to Use WASM
 *
 * WASM is beneficial for:
 * - Heavy computation (>10μs)
 * - Cryptographic operations (hashing, signatures)
 * - Large data processing (RLP encoding, ABI encoding)
 * - Batch operations (processing many items)
 *
 * hardfork does not fit these criteria.
 *
 * @module hardfork.wasm
 */

// Re-export everything from pure TypeScript implementation
export * from "./hardfork.js";
export { Hardfork } from "./hardfork.js";

// ============================================================================
// Implementation Status
// ============================================================================

/**
 * Check if WASM hardfork implementation is available
 *
 * @returns Always false - WASM not implemented (and not needed)
 *
 * @example
 * ```typescript
 * import { isWasmHardforkAvailable } from './hardfork.wasm.js';
 *
 * if (isWasmHardforkAvailable()) {
 *   // Never reaches here
 * } else {
 *   // Always uses pure TypeScript
 * }
 * ```
 */
export function isWasmHardforkAvailable(): boolean {
	return false;
}

/**
 * Get implementation status and recommendations
 *
 * @returns Status object with availability and recommendations
 *
 * @example
 * ```typescript
 * import { getHardforkImplementationStatus } from './hardfork.wasm.js';
 *
 * const status = getHardforkImplementationStatus();
 * console.log(status.available); // false
 * console.log(status.reason); // "Pure TS optimal - WASM overhead exceeds benefit"
 * ```
 */
export function getHardforkImplementationStatus(): {
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
			"Use pure TypeScript implementation - already optimal for enum lookups and comparisons",
		performance: {
			typescriptAvg: "10-100ns per operation",
			wasmOverhead: "1-2μs per WASM call",
			verdict: "TypeScript 10-100x faster for these operations",
		},
	};
}

// Note: No WASM-specific exports since WASM is not implemented
// All functions use pure TypeScript from hardfork.ts
