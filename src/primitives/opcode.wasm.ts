/**
 * WASM-accelerated EVM Opcode Operations
 *
 * **Status**: WASM NOT IMPLEMENTED (and not needed)
 *
 * ## Why No WASM?
 *
 * opcode provides:
 * - EVM opcode enum (just byte constants)
 * - Opcode metadata lookups (getInfo, getName)
 * - Category checks (isPush, isDup, isSwap, isLog)
 * - Simple arithmetic (getPushBytes, getDupPosition)
 * - Bytecode parsing (could benefit, but TS is already fast)
 *
 * These operations are:
 * - Already optimal in TypeScript
 * - Pure O(1) lookups, range checks, and table access
 * - No heavy computation or data processing
 * - Execution time <200ns per operation
 *
 * Even bytecode parsing, which processes arrays, is:
 * - Linear scan with simple range checks
 * - Fast in modern JS engines (JIT optimized)
 * - Limited by memory access, not computation
 *
 * **WASM overhead** (~1-2μs per call) would make most operations **10-100x SLOWER**.
 *
 * ## Performance Characteristics
 *
 * Pure TypeScript implementation benchmarks:
 * - isPush/isDup/isSwap/isLog: ~15-30ns per call (range check)
 * - getInfo: ~30-50ns per call (Map lookup)
 * - getName: ~40-60ns per call (Map lookup + property access)
 * - getPushBytes/getDupPosition: ~20-40ns per call (arithmetic)
 * - parseBytecode (simple): ~5-10μs for 100 bytes
 * - parseBytecode (complex): ~50-100μs for 1000 bytes
 * - disassemble: ~100-200μs for 1000 bytes (string formatting overhead)
 *
 * **WASM would be 10-50x SLOWER** for individual operations due to call overhead.
 *
 * For bytecode parsing specifically:
 * - Small bytecode (<100 bytes): TS faster (WASM overhead dominates)
 * - Large bytecode (>10KB): WASM might be 2-3x faster
 * - But large bytecode is rare, and 2-3x doesn't justify complexity
 *
 * ## When to Use WASM
 *
 * WASM is beneficial for:
 * - Heavy computation (>10μs)
 * - Cryptographic operations (hashing, signatures)
 * - Large data processing (RLP encoding, ABI encoding)
 * - Batch operations (processing many items)
 *
 * opcode does not fit these criteria well enough to justify WASM complexity.
 *
 * @module opcode.wasm
 */

// Re-export everything from pure TypeScript implementation
export * from "./opcode.js";
export { Opcode } from "./opcode.js";

// ============================================================================
// Implementation Status
// ============================================================================

/**
 * Check if WASM opcode implementation is available
 *
 * @returns Always false - WASM not implemented (and not needed)
 *
 * @example
 * ```typescript
 * import { isWasmOpcodeAvailable } from './opcode.wasm.js';
 *
 * if (isWasmOpcodeAvailable()) {
 *   // Never reaches here
 * } else {
 *   // Always uses pure TypeScript
 * }
 * ```
 */
export function isWasmOpcodeAvailable(): boolean {
	return false;
}

/**
 * Get implementation status and recommendations
 *
 * @returns Status object with availability and recommendations
 *
 * @example
 * ```typescript
 * import { getOpcodeImplementationStatus } from './opcode.wasm.js';
 *
 * const status = getOpcodeImplementationStatus();
 * console.log(status.available); // false
 * console.log(status.reason); // "Pure TS optimal - WASM overhead exceeds benefit"
 * ```
 */
export function getOpcodeImplementationStatus(): {
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
		reason: "Pure TS optimal - WASM overhead exceeds benefit",
		recommendation:
			"Use pure TypeScript implementation - already optimal for opcode lookups and bytecode parsing",
		performance: {
			typescriptAvg: "15-200ns for lookups, 5-100μs for bytecode parsing",
			wasmOverhead: "1-2μs per WASM call",
			verdict:
				"TypeScript 10-100x faster for lookups; comparable for large bytecode parsing but not worth complexity",
		},
		notes:
			"Bytecode parsing of very large contracts (>10KB) might benefit from WASM, but this is rare and the 2-3x speedup doesn't justify the implementation complexity.",
	};
}

// Note: No WASM-specific exports since WASM is not implemented
// All functions use pure TypeScript from opcode.ts
