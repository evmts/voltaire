/**
 * EVM Bytecode Types and Utilities
 *
 * Complete bytecode analysis, validation, and manipulation with type safety.
 *
 * @example
 * ```typescript
 * import * as Bytecode from './bytecode.js';
 *
 * // Types
 * const code: Bytecode.Bytecode = new Uint8Array([0x60, 0x00, 0x5b]);
 *
 * // Operations - standard form
 * const jumpdests = Bytecode.analyzeJumpDestinations(code);
 * const isValid = Bytecode.validate(code);
 * ```
 */

import { Keccak256 } from "../../crypto/keccak256.js";
import type { Hash } from "../Hash/index.js";

// ==========================================================================
// Core Types
// ==========================================================================

/**
 * EVM opcode (single byte instruction)
 */
export type Opcode = number;

/**
 * Jump destination information
 */
export type JumpDest = {
	/** Position in bytecode */
	readonly position: number;
	/** Whether this is a valid jump destination */
	readonly valid: boolean;
};

/**
 * Bytecode instruction
 */
export type Instruction = {
	/** Opcode value */
	readonly opcode: Opcode;
	/** Position in bytecode */
	readonly position: number;
	/** Push data if PUSH instruction */
	readonly pushData?: Uint8Array;
};

/**
 * Bytecode analysis result
 */
export type Analysis = {
	/** Valid JUMPDEST positions */
	readonly jumpDestinations: ReadonlySet<number>;
	/** All instructions */
	readonly instructions: readonly Instruction[];
	/** Whether bytecode is valid */
	readonly valid: boolean;
};

/**
 * Opcode metadata
 */
export type OpcodeMetadata = {
	/** Opcode value */
	readonly opcode: Opcode;
	/** Mnemonic name */
	readonly name: string;
	/** Gas cost (base) */
	readonly gas: number;
	/** Stack items removed */
	readonly inputs: number;
	/** Stack items added */
	readonly outputs: number;
};

// ==========================================================================
// Constants
// ==========================================================================

/** JUMPDEST opcode */
export const JUMPDEST: Opcode = 0x5b;

/** PUSH1 opcode */
export const PUSH1: Opcode = 0x60;

/** PUSH32 opcode */
export const PUSH32: Opcode = 0x7f;

/** STOP opcode */
export const STOP: Opcode = 0x00;

/** RETURN opcode */
export const RETURN: Opcode = 0xf3;

/** REVERT opcode */
export const REVERT: Opcode = 0xfd;

/** INVALID opcode */
export const INVALID: Opcode = 0xfe;

// ==========================================================================
// Opcode Utilities
// ==========================================================================

/**
 * Check if opcode is a PUSH instruction (PUSH1-PUSH32)
 *
 * @example
 * ```typescript
 * isPush(0x60); // true (PUSH1)
 * isPush(0x7f); // true (PUSH32)
 * isPush(0x00); // false
 * ```
 */
export function isPush(opcode: Opcode): boolean {
	return opcode >= PUSH1 && opcode <= PUSH32;
}

/**
 * Get PUSH instruction size (number of bytes pushed)
 *
 * @example
 * ```typescript
 * getPushSize(0x60); // 1 (PUSH1)
 * getPushSize(0x7f); // 32 (PUSH32)
 * ```
 */
export function getPushSize(opcode: Opcode): number {
	if (!isPush(opcode)) return 0;
	return opcode - 0x5f;
}

/**
 * Check if opcode terminates execution
 *
 * @example
 * ```typescript
 * isTerminator(0xf3); // true (RETURN)
 * isTerminator(0xfd); // true (REVERT)
 * isTerminator(0x00); // true (STOP)
 * ```
 */
export function isTerminator(opcode: Opcode): boolean {
	return (
		opcode === STOP ||
		opcode === RETURN ||
		opcode === REVERT ||
		opcode === INVALID
	);
}

// ==========================================================================
// Jump Destination Analysis (Internal)
// ==========================================================================

/**
 * Analyze bytecode to identify valid JUMPDEST locations (internal method)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x5b, 0x5b]);
 * const jumpdests = _analyzeJumpDestinations.call(code);
 * ```
 */
export function _analyzeJumpDestinations(this: Bytecode): Set<number> {
	const validJumpdests = new Set<number>();
	let pc = 0;

	while (pc < this.length) {
		const opcode = this[pc] ?? 0;

		if (opcode === JUMPDEST) {
			validJumpdests.add(pc);
			pc += 1;
		} else if (isPush(opcode)) {
			const pushSize = getPushSize(opcode);
			pc += 1 + pushSize;
		} else {
			pc += 1;
		}
	}

	return validJumpdests;
}

// ==========================================================================
// Validation (Internal)
// ==========================================================================

/**
 * Check if a position is a valid JUMPDEST (internal method)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x5b]);
 * _isValidJumpDest.call(code, 0); // true
 * ```
 */
export function _isValidJumpDest(this: Bytecode, position: number): boolean {
	const validJumpdests = _analyzeJumpDestinations.call(this);
	return validJumpdests.has(position);
}

/**
 * Validate bytecode structure (internal method)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * _validate.call(code); // true
 * ```
 */
export function _validate(this: Bytecode): boolean {
	let pc = 0;

	while (pc < this.length) {
		const opcode = this[pc] ?? 0;

		if (isPush(opcode)) {
			const pushSize = getPushSize(opcode);

			// Check if we have enough bytes for the PUSH data
			if (pc + pushSize >= this.length) {
				// Incomplete PUSH instruction
				return false;
			}

			pc += 1 + pushSize;
		} else {
			pc += 1;
		}
	}

	return true;
}

// ==========================================================================
// Instruction Parsing (Internal)
// ==========================================================================

/**
 * Parse bytecode into instructions (internal method)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * const instructions = _parseInstructions.call(code);
 * ```
 */
export function _parseInstructions(this: Bytecode): Instruction[] {
	const instructions: Instruction[] = [];
	let pc = 0;

	while (pc < this.length) {
		const opcode = this[pc] ?? 0;

		if (isPush(opcode)) {
			const pushSize = getPushSize(opcode);
			const pushData = this.slice(pc + 1, pc + 1 + pushSize);
			instructions.push({ opcode, position: pc, pushData });
			pc += 1 + pushSize;
		} else {
			instructions.push({ opcode, position: pc });
			pc += 1;
		}
	}

	return instructions;
}

// ==========================================================================
// Complete Analysis (Internal)
// ==========================================================================

/**
 * Perform complete bytecode analysis (internal method)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01, 0x5b]);
 * const analysis = _analyze.call(code);
 * ```
 */
export function _analyze(this: Bytecode): Analysis {
	return {
		valid: _validate.call(this),
		jumpDestinations: _analyzeJumpDestinations.call(this),
		instructions: _parseInstructions.call(this),
	};
}

// ==========================================================================
// Size and Slicing Operations (Internal)
// ==========================================================================

/**
 * Get bytecode size in bytes (internal method)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * _size.call(code); // 2
 * ```
 */
export function _size(this: Bytecode): number {
	return this.length;
}

/**
 * Extract runtime bytecode from creation bytecode (internal method)
 *
 * @example
 * ```typescript
 * const creation = new Uint8Array([...constructor, ...runtime]);
 * const runtime = _extractRuntime.call(creation, constructorLength);
 * ```
 */
export function _extractRuntime(this: Bytecode, offset: number): Bytecode {
	return this.slice(offset) as Bytecode;
}

// ==========================================================================
// Bytecode Comparison (Internal)
// ==========================================================================

/**
 * Compare two bytecode arrays for equality (internal method)
 *
 * @example
 * ```typescript
 * const code1 = new Uint8Array([0x60, 0x01]);
 * const code2 = new Uint8Array([0x60, 0x01]);
 * _equals.call(code1, code2); // true
 * ```
 */
export function _equals(this: Bytecode, other: Bytecode): boolean {
	if (this.length !== other.length) return false;
	for (let i = 0; i < this.length; i++) {
		if (this[i] !== other[i]) return false;
	}
	return true;
}

// ==========================================================================
// Bytecode Hashing (Internal)
// ==========================================================================

/**
 * Compute bytecode hash (keccak256) (internal method)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * const hash = _hash.call(code);
 * ```
 */
export function _hash(this: Bytecode): Hash {
	return Keccak256.hash(this) as Hash;
}

// ==========================================================================
// Bytecode Formatting (Internal)
// ==========================================================================

/**
 * Format bytecode as hex string (internal method)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * _toHex.call(code); // "0x6001"
 * ```
 */
export function _toHex(this: Bytecode, prefix = true): string {
	const hex = Array.from(this)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return prefix ? `0x${hex}` : hex;
}

/**
 * Format all instructions to human-readable strings (internal method)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01, 0x5b]);
 * const formatted = _formatInstructions.call(code);
 * ```
 */
export function _formatInstructions(this: Bytecode): string[] {
	const instructions = _parseInstructions.call(this);
	return instructions.map(formatInstruction);
}

// ==========================================================================
// Metadata Extraction (Internal)
// ==========================================================================

/**
 * Check if bytecode contains CBOR metadata (internal method)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([...bytecode, ...metadata]);
 * _hasMetadata.call(code); // true
 * ```
 */
export function _hasMetadata(this: Bytecode): boolean {
	// Solidity metadata starts with 0xa2 0x64 ('ipfs') or 0xa2 0x65 ('bzzr')
	// and ends with 0x00 0x33 (length 51) at the very end
	if (this.length < 2) return false;

	const lastTwo = this.slice(-2);
	const b0 = lastTwo[0] ?? 0;
	const b1 = lastTwo[1] ?? 0;
	// Check for common metadata length markers
	return b0 === 0x00 && b1 >= 0x20 && b1 <= 0x40;
}

/**
 * Extract bytecode without metadata (internal method)
 *
 * @example
 * ```typescript
 * const withMeta = new Uint8Array([...bytecode, ...metadata]);
 * const without = _stripMetadata.call(withMeta);
 * ```
 */
export function _stripMetadata(this: Bytecode): Bytecode {
	if (!_hasMetadata.call(this)) return this;

	// Last 2 bytes indicate metadata length
	const metadataLength = (this[this.length - 1] ?? 0) + 2;
	return this.slice(0, -metadataLength) as Bytecode;
}

// ==========================================================================
// Standalone Utility Functions
// ==========================================================================

/**
 * Parse hex string to bytecode
 *
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Bytecode
 *
 * @example
 * ```typescript
 * const code = fromHex("0x6001");
 * // Uint8Array([0x60, 0x01])
 * ```
 */
export function fromHex(hex: string): Bytecode {
	const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (cleaned.length % 2 !== 0) {
		throw new Error("Invalid hex string: odd length");
	}
	const bytes = new Uint8Array(cleaned.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes as Bytecode;
}

/**
 * Format instruction to human-readable string
 *
 * @param instruction - Instruction to format
 * @returns Human-readable string
 *
 * @example
 * ```typescript
 * const inst = { opcode: 0x60, position: 0, pushData: new Uint8Array([0x01]) };
 * formatInstruction(inst); // "0x0000: PUSH1 0x01"
 * ```
 */
export function formatInstruction(instruction: Instruction): string {
	const pos = instruction.position.toString(16).padStart(4, "0");
	const opcode = instruction.opcode.toString(16).padStart(2, "0").toUpperCase();

	if (instruction.pushData) {
		const data = Array.from(instruction.pushData)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return `0x${pos}: PUSH${instruction.pushData.length} 0x${data}`;
	}

	return `0x${pos}: 0x${opcode}`;
}

// ==========================================================================
// Branded Types
// ==========================================================================

/**
 * Complete Bytecode type (Uint8Array)
 */
export type Bytecode = Uint8Array;

// ==========================================================================
// from() - Main Type Constructor
// ==========================================================================

/**
 * Create Bytecode from various input types
 *
 * @param value - Hex string or Uint8Array
 * @returns Bytecode
 *
 * @example
 * ```typescript
 * const code1 = from("0x6001");
 * const code2 = from(new Uint8Array([0x60, 0x01]));
 * ```
 */
export function from(value: string | Uint8Array): Bytecode {
	if (typeof value === "string") {
		return fromHex(value);
	}
	return value as Bytecode;
}

// ==========================================================================
// Public Wrapper Functions (Namespace+Type Overloading Pattern)
// ==========================================================================

/**
 * Analyze bytecode to identify valid JUMPDEST locations
 *
 * This must skip over PUSH instruction immediate data to avoid
 * treating data bytes as instructions.
 *
 * @param code - Bytecode to analyze
 * @returns Set of valid JUMPDEST positions
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x5b, 0x5b]); // PUSH1 0x5b, JUMPDEST
 * const jumpdests = analyzeJumpDestinations(code);
 * jumpdests.has(1); // false (inside PUSH data)
 * jumpdests.has(2); // true (actual JUMPDEST)
 * ```
 */
export function analyzeJumpDestinations(code: Bytecode | string): Set<number> {
	return _analyzeJumpDestinations.call(from(code));
}

/**
 * Check if a position is a valid JUMPDEST
 *
 * @param code - Bytecode to check
 * @param position - Position to check
 * @returns true if position is a valid JUMPDEST
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x5b, 0x60, 0x5b, 0x5b]);
 * isValidJumpDest(code, 0); // true
 * isValidJumpDest(code, 2); // false (inside PUSH data)
 * isValidJumpDest(code, 3); // true
 * ```
 */
export function isValidJumpDest(
	code: Bytecode | string,
	position: number,
): boolean {
	return _isValidJumpDest.call(from(code), position);
}

/**
 * Validate bytecode structure
 *
 * Performs basic validation checks on bytecode:
 * - Checks for incomplete PUSH instructions
 * - Validates bytecode can be parsed without errors
 *
 * @param code - Bytecode to validate
 * @returns true if bytecode is valid
 *
 * @example
 * ```typescript
 * const valid = new Uint8Array([0x60, 0x01]); // PUSH1 0x01
 * validate(valid); // true
 *
 * const invalid = new Uint8Array([0x60]); // PUSH1 with no data
 * validate(invalid); // false
 * ```
 */
export function validate(code: Bytecode | string): boolean {
	return _validate.call(from(code));
}

/**
 * Parse bytecode into instructions
 *
 * @param code - Bytecode to parse
 * @returns Array of instructions
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
 * const instructions = parseInstructions(code);
 * // [
 * //   { opcode: 0x60, position: 0, pushData: Uint8Array([0x01]) },
 * //   { opcode: 0x60, position: 2, pushData: Uint8Array([0x02]) },
 * //   { opcode: 0x01, position: 4 }
 * // ]
 * ```
 */
export function parseInstructions(code: Bytecode | string): Instruction[] {
	return _parseInstructions.call(from(code));
}

/**
 * Perform complete bytecode analysis
 *
 * @param code - Bytecode to analyze
 * @returns Complete analysis result
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01, 0x5b, 0x00]);
 * const analysis = analyze(code);
 * // {
 * //   valid: true,
 * //   jumpDestinations: Set([2]),
 * //   instructions: [...],
 * // }
 * ```
 */
export function analyze(code: Bytecode | string): Analysis {
	return _analyze.call(from(code));
}

/**
 * Get bytecode size in bytes
 *
 * @param code - Bytecode
 * @returns Size in bytes
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * size(code); // 2
 * ```
 */
export function size(code: Bytecode | string): number {
	return _size.call(from(code));
}

/**
 * Extract runtime bytecode from creation bytecode
 *
 * Creation bytecode typically contains constructor code followed by
 * runtime code. This extracts just the runtime portion.
 *
 * @param code - Creation bytecode
 * @param offset - Offset where runtime code starts
 * @returns Runtime bytecode
 *
 * @example
 * ```typescript
 * const creation = new Uint8Array([...constructor, ...runtime]);
 * const runtime = extractRuntime(creation, constructorLength);
 * ```
 */
export function extractRuntime(
	code: Bytecode | string,
	offset: number,
): Bytecode {
	return _extractRuntime.call(from(code), offset);
}

/**
 * Compare two bytecode arrays for equality
 *
 * @param a - First bytecode
 * @param b - Second bytecode
 * @returns true if bytecode is identical
 *
 * @example
 * ```typescript
 * const code1 = new Uint8Array([0x60, 0x01]);
 * const code2 = new Uint8Array([0x60, 0x01]);
 * equals(code1, code2); // true
 * ```
 */
export function equals(a: Bytecode | string, b: Bytecode | string): boolean {
	return _equals.call(from(a), from(b));
}

/**
 * Compute bytecode hash (keccak256)
 *
 * @param code - Bytecode to hash
 * @returns Bytecode hash (32 bytes)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * const hash = hash(code);
 * ```
 */
export function hash(code: Bytecode | string): Hash {
	return _hash.call(from(code));
}

/**
 * Format bytecode as hex string
 *
 * @param code - Bytecode to format
 * @param prefix - Whether to include 0x prefix
 * @returns Hex string
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * toHex(code); // "0x6001"
 * toHex(code, false); // "6001"
 * ```
 */
export function toHex(code: Bytecode | string, prefix = true): string {
	return _toHex.call(from(code), prefix);
}

/**
 * Format all instructions to human-readable strings
 *
 * @param code - Bytecode to format
 * @returns Array of formatted instructions
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01, 0x5b]);
 * const formatted = formatInstructions(code);
 * // ["0x0000: PUSH1 0x01", "0x0002: JUMPDEST"]
 * ```
 */
export function formatInstructions(code: Bytecode | string): string[] {
	return _formatInstructions.call(from(code));
}

/**
 * Check if bytecode contains CBOR metadata
 *
 * Solidity compiler includes CBOR-encoded metadata at the end of bytecode.
 *
 * @param code - Bytecode to check
 * @returns true if metadata is present
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([...bytecode, 0xa2, 0x64, ...metadata]);
 * hasMetadata(code); // true
 * ```
 */
export function hasMetadata(code: Bytecode | string): boolean {
	return _hasMetadata.call(from(code));
}

/**
 * Extract bytecode without metadata
 *
 * @param code - Bytecode with metadata
 * @returns Bytecode without metadata
 *
 * @example
 * ```typescript
 * const withMeta = new Uint8Array([...bytecode, ...metadata]);
 * const without = stripMetadata(withMeta);
 * ```
 */
export function stripMetadata(code: Bytecode | string): Bytecode {
	return _stripMetadata.call(from(code));
}
