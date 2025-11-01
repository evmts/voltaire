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
 *
 * // Operations - convenience form
 * const jumpdests2 = Bytecode.analyzeJumpDestinations.call(code);
 * const isValid2 = Bytecode.validate.call(code);
 * ```
 */

import * as Keccak256 from "../../crypto/keccak256.js";
import type { Hash } from "./Hash/index.js";

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
  return opcode === STOP || opcode === RETURN || opcode === REVERT || opcode === INVALID;
}

// ==========================================================================
// Jump Destination Analysis
// ==========================================================================

/**
 * Analyze bytecode to identify valid JUMPDEST locations (standard form)
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
export function analyzeJumpDestinations(code: Uint8Array): Set<number> {
  const validJumpdests = new Set<number>();
  let pc = 0;

  while (pc < code.length) {
    const opcode = code[pc] ?? 0;

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

/**
 * Analyze bytecode to identify valid JUMPDEST locations (convenience form)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x5b, 0x5b]);
 * const jumpdests = analyzeJumpDestinations.call(code);
 * ```
 */
export function analyzeJumpDests(this: Uint8Array): Set<number> {
  return analyzeJumpDestinations(this);
}

// ==========================================================================
// Validation
// ==========================================================================

/**
 * Check if a position is a valid JUMPDEST (standard form)
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
export function isValidJumpDest(code: Uint8Array, position: number): boolean {
  const validJumpdests = analyzeJumpDestinations(code);
  return validJumpdests.has(position);
}

/**
 * Check if a position is a valid JUMPDEST (convenience form)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x5b]);
 * isValidJumpDest.call(code, 0); // true
 * ```
 */
export function isJumpDest(this: Uint8Array, position: number): boolean {
  return isValidJumpDest(this, position);
}

/**
 * Validate bytecode structure (standard form)
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
export function validate(code: Uint8Array): boolean {
  let pc = 0;

  while (pc < code.length) {
    const opcode = code[pc] ?? 0;

    if (isPush(opcode)) {
      const pushSize = getPushSize(opcode);

      // Check if we have enough bytes for the PUSH data
      if (pc + pushSize >= code.length) {
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

/**
 * Validate bytecode structure (convenience form)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * validate.call(code); // true
 * ```
 */
export function isValid(this: Uint8Array): boolean {
  return validate(this);
}

// ==========================================================================
// Instruction Parsing
// ==========================================================================

/**
 * Parse bytecode into instructions (standard form)
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
export function parseInstructions(code: Uint8Array): Instruction[] {
  const instructions: Instruction[] = [];
  let pc = 0;

  while (pc < code.length) {
    const opcode = code[pc] ?? 0;

    if (isPush(opcode)) {
      const pushSize = getPushSize(opcode);
      const pushData = code.slice(pc + 1, pc + 1 + pushSize);
      instructions.push({ opcode, position: pc, pushData });
      pc += 1 + pushSize;
    } else {
      instructions.push({ opcode, position: pc });
      pc += 1;
    }
  }

  return instructions;
}

/**
 * Parse bytecode into instructions (convenience form)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * const instructions = parseInstructions.call(code);
 * ```
 */
export function parse(this: Uint8Array): Instruction[] {
  return parseInstructions(this);
}

// ==========================================================================
// Complete Analysis
// ==========================================================================

/**
 * Perform complete bytecode analysis (standard form)
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
export function analyze(code: Uint8Array): Analysis {
  return {
    valid: validate(code),
    jumpDestinations: analyzeJumpDestinations(code),
    instructions: parseInstructions(code),
  };
}

/**
 * Perform complete bytecode analysis (convenience form)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01, 0x5b, 0x00]);
 * const analysis = analyze.call(code);
 * ```
 */
export function getAnalysis(this: Uint8Array): Analysis {
  return analyze(this);
}

// ==========================================================================
// Size and Slicing Operations
// ==========================================================================

/**
 * Get bytecode size in bytes (standard form)
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
export function size(code: Uint8Array): number {
  return code.length;
}

/**
 * Get bytecode size in bytes (convenience form)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * size.call(code); // 2
 * ```
 */
export function getSize(this: Uint8Array): number {
  return size(this);
}

/**
 * Extract runtime bytecode from creation bytecode (standard form)
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
export function extractRuntime(code: Uint8Array, offset: number): Uint8Array {
  return code.slice(offset);
}

/**
 * Extract runtime bytecode from creation bytecode (convenience form)
 *
 * @example
 * ```typescript
 * const creation = new Uint8Array([...constructor, ...runtime]);
 * const runtime = extractRuntime.call(creation, constructorLength);
 * ```
 */
export function getRuntime(this: Uint8Array, offset: number): Uint8Array {
  return extractRuntime(this, offset);
}

// ==========================================================================
// Bytecode Comparison
// ==========================================================================

/**
 * Compare two bytecode arrays for equality (standard form)
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
export function equals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Compare two bytecode arrays for equality (convenience form)
 *
 * @example
 * ```typescript
 * const code1 = new Uint8Array([0x60, 0x01]);
 * const code2 = new Uint8Array([0x60, 0x01]);
 * equals.call(code1, code2); // true
 * ```
 */
export function isEqual(this: Uint8Array, other: Uint8Array): boolean {
  return equals(this, other);
}

// ==========================================================================
// Bytecode Hashing
// ==========================================================================

/**
 * Compute bytecode hash (keccak256) (standard form)
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
export function hash(code: Uint8Array): Hash {
  return Keccak256.hash(code);
}

/**
 * Compute bytecode hash (keccak256) (convenience form)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * const hash = hash.call(code);
 * ```
 */
export function getHash(this: Uint8Array): Hash {
  return hash(this);
}

// ==========================================================================
// Bytecode Formatting
// ==========================================================================

/**
 * Format bytecode as hex string (standard form)
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
export function toHex(code: Uint8Array, prefix = true): string {
  const hex = Array.from(code)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return prefix ? `0x${hex}` : hex;
}

/**
 * Format bytecode as hex string (convenience form)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * toHex.call(code); // "0x6001"
 * ```
 */
export function asHex(this: Uint8Array, prefix = true): string {
  return toHex(this, prefix);
}

/**
 * Parse hex string to bytecode (standard form)
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
export function fromHex(hex: string): Uint8Array {
  const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (cleaned.length % 2 !== 0) {
    throw new Error("Invalid hex string: odd length");
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Format instruction to human-readable string (standard form)
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

/**
 * Format all instructions to human-readable strings (standard form)
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
export function formatInstructions(code: Uint8Array): string[] {
  const instructions = parseInstructions(code);
  return instructions.map(formatInstruction);
}

/**
 * Format all instructions to human-readable strings (convenience form)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01, 0x5b]);
 * const formatted = formatInstructions.call(code);
 * ```
 */
export function disassemble(this: Uint8Array): string[] {
  return formatInstructions(this);
}

// ==========================================================================
// Metadata Extraction
// ==========================================================================

/**
 * Check if bytecode contains CBOR metadata (standard form)
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
export function hasMetadata(code: Uint8Array): boolean {
  // Solidity metadata starts with 0xa2 0x64 ('ipfs') or 0xa2 0x65 ('bzzr')
  // and ends with 0x00 0x33 (length 51) at the very end
  if (code.length < 2) return false;

  const lastTwo = code.slice(-2);
  const b0 = lastTwo[0] ?? 0;
  const b1 = lastTwo[1] ?? 0;
  // Check for common metadata length markers
  return b0 === 0x00 && b1 >= 0x20 && b1 <= 0x40;
}

/**
 * Check if bytecode contains CBOR metadata (convenience form)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([...bytecode, ...metadata]);
 * hasMetadata.call(code); // true
 * ```
 */
export function containsMetadata(this: Uint8Array): boolean {
  return hasMetadata(this);
}

/**
 * Extract bytecode without metadata (standard form)
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
export function stripMetadata(code: Uint8Array): Uint8Array {
  if (!hasMetadata(code)) return code;

  // Last 2 bytes indicate metadata length
  const metadataLength = (code[code.length - 1] ?? 0) + 2;
  return code.slice(0, -metadataLength);
}

/**
 * Extract bytecode without metadata (convenience form)
 *
 * @example
 * ```typescript
 * const withMeta = new Uint8Array([...bytecode, ...metadata]);
 * const without = stripMetadata.call(withMeta);
 * ```
 */
export function withoutMetadata(this: Uint8Array): Uint8Array {
  return stripMetadata(this);
}

// ==========================================================================
// Branded Types
// ==========================================================================

/**
 * Complete Bytecode type (Uint8Array)
 */
export type Bytecode = Uint8Array;
