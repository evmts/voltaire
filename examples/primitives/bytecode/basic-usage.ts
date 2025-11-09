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

// From hex string (most common)
const code1 = Bytecode.fromHex("0x60016002015b00");

// Without 0x prefix
const code2 = Bytecode.fromHex("60016002015b00");

// From bytes
const bytes = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x5b, 0x00]);
const code3 = Bytecode.from(bytes);

// Empty bytecode
const empty = Bytecode.fromHex("0x");

// Simple contract bytecode (PUSH1 0x80, PUSH1 0x40, MSTORE, STOP)
const simpleContract = Bytecode.fromHex("0x608060405200");

// More complex bytecode with multiple opcodes
const complexCode = Bytecode.fromHex(
	"0x608060405234801561001057600080fd5b50600436106100415760003560e01c8063",
);

// Valid bytecode
const validCode = Bytecode.fromHex("0x60016002015b");

// Invalid bytecode - incomplete PUSH1 (needs 1 data byte)
const invalidCode1 = Bytecode.fromHex("0x60");

// Invalid bytecode - incomplete PUSH2 (needs 2 data bytes)
const invalidCode2 = Bytecode.fromHex("0x6101");

// Valid PUSH32 (32 data bytes)
const validPush32 = Bytecode.fromHex(
	"0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00",
);

// Invalid PUSH32 (only 1 data byte)
const invalidPush32 = Bytecode.fromHex("0x7fff");

const code = Bytecode.fromHex("0x60016002015b00");

// Hash (keccak256)
const hash = Bytecode.hash(code);

const codeA = Bytecode.fromHex("0x60016002015b00");
const codeB = Bytecode.fromHex("0x60016002015b00");
const codeC = Bytecode.fromHex("0x60ff60aa01");

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
} catch (err) {
	console.error(
		`Error: ${err instanceof Error ? err.message : "Unknown error"}`,
	);
}

try {
	const invalid = safeParse("0x60"); // Incomplete PUSH1
} catch (err) {
	console.error(
		`Caught invalid: ${err instanceof Error ? err.message : "Unknown error"}`,
	);
}

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

function processBytecode(value: unknown): void {
	if (value instanceof Uint8Array) {
		const code = Bytecode.from(value);
	} else if (typeof value === "string") {
		const code = Bytecode.fromHex(value);
	} else {
	}
}
processBytecode("0x60016002015b00");
processBytecode(new Uint8Array([0x60, 0x01, 0x00]));

const fullCode = Bytecode.fromHex("0x60016002015b60ff60aa01");

// Slice first 5 bytes
const sliced = Bytecode.from(fullCode.slice(0, 5));
