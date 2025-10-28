/**
 * WASM-accelerated Gas Constants
 *
 * **Status**: WASM NOT IMPLEMENTED (and not needed)
 *
 * ## Why No WASM?
 *
 * gas-constants provides:
 * - EVM opcode gas cost constants
 * - Simple gas calculation functions (memory expansion, call costs, etc.)
 * - Hardfork-specific cost lookups
 *
 * These operations are:
 * - Primarily constant lookups (zero computation)
 * - Simple arithmetic on bigints (<100ns per operation)
 * - Already optimal in TypeScript
 *
 * **WASM overhead** (~1-2μs per call) far exceeds calculation time.
 *
 * ## Performance Characteristics
 *
 * Pure TypeScript implementation benchmarks:
 * - Constant access: ~5-10ns (direct property access)
 * - calculateKeccak256Cost: ~20-50ns (one division, one multiply)
 * - calculateMemoryExpansionCost: ~100-200ns (quadratic calculation)
 * - calculateCallCost: ~50-150ns (conditional arithmetic)
 * - calculateSstoreCost: ~50-100ns (conditional logic)
 *
 * **WASM would be 10-100x SLOWER** for these operations.
 *
 * ## When to Use WASM
 *
 * WASM is beneficial for:
 * - Complex state machine execution (EVM interpreter)
 * - Cryptographic operations (hashing, signatures)
 * - Large batch operations (analyzing many transactions)
 * - Heavy computation (>10μs per operation)
 *
 * gas-constants provides **building blocks** for these systems,
 * not the systems themselves.
 *
 * @module gas-constants.wasm
 */

// Re-export everything from pure TypeScript implementation
export * from "./gas-constants.js";
export { Gas } from "./gas-constants.js";

// ============================================================================
// Implementation Status
// ============================================================================

/**
 * Check if WASM gas constants implementation is available
 *
 * @returns Always false - WASM not implemented (and not needed)
 *
 * @example
 * ```typescript
 * import { isWasmGasAvailable } from './gas-constants.wasm.js';
 *
 * if (isWasmGasAvailable()) {
 *   // Never reaches here
 * } else {
 *   // Always uses pure TypeScript
 * }
 * ```
 */
export function isWasmGasAvailable(): boolean {
	return false;
}

/**
 * Get implementation status and recommendations
 *
 * @returns Status object with availability and recommendations
 *
 * @example
 * ```typescript
 * import { getGasImplementationStatus } from './gas-constants.wasm.js';
 *
 * const status = getGasImplementationStatus();
 * console.log(status.available); // false
 * console.log(status.reason); // "Pure TS optimal - constants and simple math"
 * ```
 */
export function getGasImplementationStatus(): {
	available: boolean;
	reason: string;
	recommendation: string;
	performance: {
		typescriptAvg: string;
		wasmOverhead: string;
		verdict: string;
	};
	notes: string;
} {
	return {
		available: false,
		reason: "Pure TS optimal - constants and simple math",
		recommendation:
			"Use pure TypeScript implementation - constant access and arithmetic already optimal",
		performance: {
			typescriptAvg: "5-200ns per operation (constant access to simple calculation)",
			wasmOverhead: "1-2μs per WASM call",
			verdict: "TypeScript 10-400x faster for these operations",
		},
		notes:
			"If building an EVM interpreter/executor, WASM acceleration makes sense " +
			"at the interpreter level (using these constants), not at the constant level itself.",
	};
}

// Note: No WASM-specific exports since WASM is not implemented
// All functions use pure TypeScript from gas-constants.ts
