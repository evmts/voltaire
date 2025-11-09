/**
 * Basic Bytecode Usage Example
 *
 * Demonstrates:
 * - Creating bytecode from hex strings and bytes
 * - Converting to different formats
 * - Basic validation
 * - Size and equality operations
 */

import { Bytecode } from "../../../src/primitives/Bytecode/index.js";
import { Hash } from "../../../src/primitives/Hash/index.js";

console.log("\n=== Basic Bytecode Usage ===\n");

// ============================================================
// Creating Bytecode
// ============================================================

console.log("--- Creating Bytecode ---\n");

// From hex string (most common)
const code1 = Bytecode.fromHex("0x60016002015b00");
console.log(`From hex: ${Bytecode.toHex(code1)}`);

// Without 0x prefix
const code2 = Bytecode.fromHex("60016002015b00");
console.log(`Without prefix: ${Bytecode.toHex(code2)}`);

// From bytes
const bytes = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x5b, 0x00]);
const code3 = Bytecode.from(bytes);
console.log(`From bytes: ${Bytecode.toHex(code3)}`);

// Empty bytecode
const empty = Bytecode.fromHex("0x");
console.log(`Empty: ${Bytecode.toHex(empty)}`);
console.log();

// ============================================================
// Real Contract Bytecode
// ============================================================

console.log("--- Real Contract Bytecode ---\n");

// Simple contract bytecode (PUSH1 0x80, PUSH1 0x40, MSTORE, STOP)
const simpleContract = Bytecode.fromHex("0x608060405200");
console.log(`Simple contract: ${Bytecode.toHex(simpleContract)}`);
console.log(`Size: ${Bytecode.size(simpleContract)} bytes`);

// More complex bytecode with multiple opcodes
const complexCode = Bytecode.fromHex(
	"0x608060405234801561001057600080fd5b50600436106100415760003560e01c8063",
);
console.log(`Complex code: ${Bytecode.toHex(complexCode).substring(0, 40)}...`);
console.log(`Size: ${Bytecode.size(complexCode)} bytes`);
console.log();

// ============================================================
// Validation
// ============================================================

console.log("--- Validation ---\n");

// Valid bytecode
const validCode = Bytecode.fromHex("0x60016002015b");
console.log(`Valid code: ${Bytecode.validate(validCode)}`);

// Invalid bytecode - incomplete PUSH1 (needs 1 data byte)
const invalidCode1 = Bytecode.fromHex("0x60");
console.log(`Incomplete PUSH1: ${Bytecode.validate(invalidCode1)}`);

// Invalid bytecode - incomplete PUSH2 (needs 2 data bytes)
const invalidCode2 = Bytecode.fromHex("0x6101");
console.log(`Incomplete PUSH2: ${Bytecode.validate(invalidCode2)}`);

// Valid PUSH32 (32 data bytes)
const validPush32 = Bytecode.fromHex(
	"0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00",
);
console.log(`Valid PUSH32: ${Bytecode.validate(validPush32)}`);

// Invalid PUSH32 (only 1 data byte)
const invalidPush32 = Bytecode.fromHex("0x7fff");
console.log(`Incomplete PUSH32: ${Bytecode.validate(invalidPush32)}`);
console.log();

// ============================================================
// Format Conversions
// ============================================================

console.log("--- Format Conversions ---\n");

const code = Bytecode.fromHex("0x60016002015b00");

// To hex
console.log(`Hex: ${Bytecode.toHex(code)}`);

// Size
console.log(`Size: ${Bytecode.size(code)} bytes`);

// Hash (keccak256)
const hash = Bytecode.hash(code);
console.log(`Hash: ${Hash.toHex(hash)}`);
console.log(`Hash (short): ${Hash.format(hash)}`);
console.log();

// ============================================================
// Equality Comparison
// ============================================================

console.log("--- Equality Comparison ---\n");

const codeA = Bytecode.fromHex("0x60016002015b00");
const codeB = Bytecode.fromHex("0x60016002015b00");
const codeC = Bytecode.fromHex("0x60ff60aa01");

console.log(`Code A: ${Bytecode.toHex(codeA)}`);
console.log(`Code B: ${Bytecode.toHex(codeB)}`);
console.log(`Code C: ${Bytecode.toHex(codeC)}`);
console.log(`A equals B: ${Bytecode.equals(codeA, codeB)}`); // true
console.log(`A equals C: ${Bytecode.equals(codeA, codeC)}`); // false
console.log();

// ============================================================
// Safe Parsing Pattern
// ============================================================

console.log("--- Safe Parsing Pattern ---\n");

function safeParse(hex: string): typeof Bytecode.prototype {
	try {
		const code = Bytecode.fromHex(hex);

		if (!Bytecode.validate(code)) {
			throw new Error("Invalid bytecode structure");
		}

		return code;
	} catch (err) {
		throw new Error(
			`Failed to parse bytecode: ${err instanceof Error ? err.message : "Unknown error"}`,
		);
	}
}

try {
	const valid = safeParse("0x60016002015b00");
	console.log(`Valid parse: ${Bytecode.toHex(valid)}`);
} catch (err) {
	console.error(
		`Error: ${err instanceof Error ? err.message : "Unknown error"}`,
	);
}

try {
	const invalid = safeParse("0x60"); // Incomplete PUSH1
	console.log(`Should not reach here: ${Bytecode.toHex(invalid)}`);
} catch (err) {
	console.error(
		`Caught invalid: ${err instanceof Error ? err.message : "Unknown error"}`,
	);
}
console.log();

// ============================================================
// Bytecode Construction Pattern
// ============================================================

console.log("--- Bytecode Construction ---\n");

// Build simple bytecode programmatically
function buildSimpleBytecode(): Uint8Array {
	return new Uint8Array([
		0x60,
		0x01, // PUSH1 0x01
		0x60,
		0x02, // PUSH1 0x02
		0x01, // ADD
		0x5b, // JUMPDEST
		0x00, // STOP
	]);
}

const constructed = Bytecode.from(buildSimpleBytecode());
console.log(`Constructed: ${Bytecode.toHex(constructed)}`);
console.log(`Valid: ${Bytecode.validate(constructed)}`);
console.log(`Size: ${Bytecode.size(constructed)} bytes`);
console.log();

// ============================================================
// Common Opcode Constants
// ============================================================

console.log("--- Common Opcode Constants ---\n");

console.log(`STOP:     0x${Bytecode.STOP.toString(16).padStart(2, "0")}`);
console.log(`JUMPDEST: 0x${Bytecode.JUMPDEST.toString(16).padStart(2, "0")}`);
console.log(`PUSH1:    0x${Bytecode.PUSH1.toString(16).padStart(2, "0")}`);
console.log(`PUSH32:   0x${Bytecode.PUSH32.toString(16).padStart(2, "0")}`);
console.log(`RETURN:   0x${Bytecode.RETURN.toString(16).padStart(2, "0")}`);
console.log(`REVERT:   0x${Bytecode.REVERT.toString(16).padStart(2, "0")}`);
console.log(`INVALID:  0x${Bytecode.INVALID.toString(16).padStart(2, "0")}`);
console.log();

// ============================================================
// Type Guards
// ============================================================

console.log("--- Type Guards ---\n");

function processBytecode(value: unknown): void {
	if (value instanceof Uint8Array) {
		const code = Bytecode.from(value);
		console.log(`  Size: ${Bytecode.size(code)} bytes`);
		console.log(`  Valid: ${Bytecode.validate(code)}`);
	} else if (typeof value === "string") {
		const code = Bytecode.fromHex(value);
		console.log(`  Hex: ${Bytecode.toHex(code)}`);
	} else {
		console.log(`  Unknown type: ${typeof value}`);
	}
}

console.log("Processing hex string:");
processBytecode("0x60016002015b00");

console.log("\nProcessing Uint8Array:");
processBytecode(new Uint8Array([0x60, 0x01, 0x00]));
console.log();

// ============================================================
// Bytecode Slicing
// ============================================================

console.log("--- Bytecode Slicing ---\n");

const fullCode = Bytecode.fromHex("0x60016002015b60ff60aa01");
console.log(`Full code: ${Bytecode.toHex(fullCode)}`);
console.log(`Size: ${Bytecode.size(fullCode)} bytes`);

// Slice first 5 bytes
const sliced = Bytecode.from(fullCode.slice(0, 5));
console.log(`First 5 bytes: ${Bytecode.toHex(sliced)}`);
console.log(`Valid: ${Bytecode.validate(sliced)}`);
console.log();

console.log("=== Example Complete ===\n");
