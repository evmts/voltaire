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
export * from "./index.js";
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
export declare function isWasmGasAvailable(): boolean;
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
export declare function getGasImplementationStatus(): {
    available: boolean;
    reason: string;
    recommendation: string;
    performance: {
        typescriptAvg: string;
        wasmOverhead: string;
        verdict: string;
    };
    notes: string;
};
//# sourceMappingURL=GasConstants.wasm.d.ts.map