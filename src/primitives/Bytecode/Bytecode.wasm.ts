// @ts-nocheck
/**
 * WASM implementation of EVM bytecode operations
 * Uses WebAssembly bindings to Zig implementation
 */

import * as loader from "../../wasm-loader/loader.js";
import type { BrandedBytecode } from "./BrandedBytecode/BrandedBytecode.js";

// ============================================================================
// Re-export constructors (no WASM benefit)
// ============================================================================

export { from, fromHex } from "./BrandedBytecode/index.js";

// ============================================================================
// WASM-accelerated analysis methods
// ============================================================================

/**
 * Analyze bytecode to find all valid JUMPDEST locations (WASM accelerated)
 *
 * @param {BrandedBytecode} bytecode - EVM bytecode
 * @returns {number[]} Array of valid JUMPDEST positions
 *
 * @example
 * ```typescript
 * const code = Bytecode.from("0x6001...");
 * const jumpdests = Bytecode.analyzeJumpDestinations(code);
 * ```
 */
export function analyzeJumpDestinations(bytecode: BrandedBytecode): number[] {
	return loader.bytecodeAnalyzeJumpdests(bytecode);
}

/**
 * Check if a position is at a bytecode boundary (WASM accelerated)
 * Position must not be inside PUSH data
 *
 * @param {BrandedBytecode} bytecode - EVM bytecode
 * @param {number} position - Position to check
 * @returns {boolean} True if position is a valid instruction boundary
 *
 * @example
 * ```typescript
 * const code = Bytecode.from("0x6001...");
 * if (Bytecode.isBytecodeBoundary(code, 0)) {
 *   console.log("Valid boundary");
 * }
 * ```
 */
export function isBytecodeBoundary(
	bytecode: BrandedBytecode,
	position: number,
): boolean {
	return loader.bytecodeIsBoundary(bytecode, position);
}

/**
 * Check if a position contains a valid JUMPDEST (WASM accelerated)
 *
 * @param {BrandedBytecode} bytecode - EVM bytecode
 * @param {number} position - Position to check
 * @returns {boolean} True if position contains JUMPDEST opcode
 *
 * @example
 * ```typescript
 * const code = Bytecode.from("0x5b...");  // 0x5b is JUMPDEST
 * if (Bytecode.isValidJumpDest(code, 0)) {
 *   console.log("Valid JUMPDEST");
 * }
 * ```
 */
export function isValidJumpDest(
	bytecode: BrandedBytecode,
	position: number,
): boolean {
	return loader.bytecodeIsValidJumpdest(bytecode, position);
}

/**
 * Validate bytecode structure (WASM accelerated)
 * Checks that PUSH instructions have enough data bytes
 *
 * @param {BrandedBytecode} bytecode - EVM bytecode
 * @throws {Error} If bytecode is invalid
 *
 * @example
 * ```typescript
 * const code = Bytecode.from("0x6001...");
 * Bytecode.validate(code);  // Throws if invalid
 * ```
 */
export function validate(bytecode: BrandedBytecode): void {
	loader.bytecodeValidate(bytecode);
}

// ============================================================================
// TypeScript-only methods (re-export from BrandedBytecode)
// ============================================================================

export {
	analyze,
	analyzeBlocks,
	analyzeGas,
	analyzeStack,
	detectFusions,
	equals,
	extractRuntime,
	formatInstruction,
	formatInstructions,
	getBlock,
	getPushSize,
	hash,
	hasMetadata,
	isPush,
	isTerminator,
	parseInstructions,
	prettyPrint,
	scan,
	size,
	stripMetadata,
	toAbi,
	toHex,
	_getNextPc,
} from "./BrandedBytecode/index.js";
