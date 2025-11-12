/**
 * Bytecode Validation Example
 *
 * Demonstrates:
 * - Validating bytecode structure
 * - Detecting incomplete PUSH instructions
 * - Safe parsing patterns
 * - Validation edge cases
 */

import { Bytecode } from "../../../src/primitives/Bytecode/index.js";

// Valid bytecode - all PUSH instructions complete
const validCode = Bytecode.fromHex("0x60016002015b00");

// Invalid - PUSH1 without data
const invalidPush1 = Bytecode.fromHex("0x60");

// Invalid - PUSH2 with only 1 byte
const invalidPush2 = Bytecode.fromHex("0x6101");

// Test all PUSH sizes
const pushTests = [
	{ opcode: 0x60, size: 1, name: "PUSH1" },
	{ opcode: 0x61, size: 2, name: "PUSH2" },
	{ opcode: 0x6f, size: 16, name: "PUSH16" },
	{ opcode: 0x7f, size: 32, name: "PUSH32" },
];

for (const test of pushTests) {
	// Valid - complete PUSH
	const validBytes = new Uint8Array(1 + test.size);
	validBytes[0] = test.opcode;
	for (let i = 1; i <= test.size; i++) {
		validBytes[i] = 0xff;
	}
	const valid = Bytecode(validBytes);

	// Invalid - incomplete PUSH (missing 1 byte)
	const invalidBytes = new Uint8Array(test.size); // Missing 1 byte
	invalidBytes[0] = test.opcode;
	for (let i = 1; i < test.size; i++) {
		invalidBytes[i] = 0xff;
	}
	const invalid = Bytecode(invalidBytes);
}

// Bytecode that ends mid-instruction
const truncatedExamples = [
	{
		name: "Ends with PUSH1 opcode",
		hex: "0x6001600260",
		valid: false,
	},
	{
		name: "Ends with PUSH2 opcode + 1 byte",
		hex: "0x60016101ff",
		valid: false,
	},
	{
		name: "Complete bytecode",
		hex: "0x600161ffff00",
		valid: true,
	},
	{
		name: "Ends with PUSH32 + partial data",
		hex: "0x7fffffffffffffffffffff",
		valid: false,
	},
];

for (const example of truncatedExamples) {
	const code = Bytecode.fromHex(example.hex);
	const valid = Bytecode.validate(code);
	const status = valid ? "✓" : "✗";
}

function safeParse(hex: string): typeof Bytecode.prototype {
	try {
		const code = Bytecode.fromHex(hex);

		if (!Bytecode.validate(code)) {
			throw new Error(
				"Invalid bytecode structure: incomplete PUSH instruction",
			);
		}

		return code;
	} catch (err) {
		throw new Error(
			`Failed to parse bytecode: ${err instanceof Error ? err.message : "Unknown error"}`,
		);
	}
}

const testCases = [
	{ hex: "0x60016002015b00", shouldPass: true },
	{ hex: "0x60", shouldPass: false },
	{ hex: "0x6101", shouldPass: false },
	{ hex: "invalid", shouldPass: false },
];

for (const test of testCases) {
	try {
		const code = safeParse(test.hex);
	} catch (err) {
		const expected = test.shouldPass ? "unexpected" : "expected";
	}
}

function analyzeWithValidation(code: typeof Bytecode.prototype) {
	if (!Bytecode.validate(code)) {
		throw new Error("Cannot analyze invalid bytecode");
	}

	return Bytecode.analyze(code);
}

try {
	const validAnalysis = Bytecode.fromHex("0x60016002015b00");
	const analysis = analyzeWithValidation(validAnalysis);
} catch (err) {
	console.error(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
}

try {
	const invalidAnalysis = Bytecode.fromHex("0x60");
	const analysis = analyzeWithValidation(invalidAnalysis);
} catch (err) {}

const edgeCases = [
	{
		name: "Empty bytecode",
		code: Bytecode.fromHex("0x"),
		expectedValid: true,
	},
	{
		name: "Single STOP opcode",
		code: Bytecode.fromHex("0x00"),
		expectedValid: true,
	},
	{
		name: "Only non-PUSH opcodes",
		code: Bytecode.fromHex("0x010203045b00"),
		expectedValid: true,
	},
	{
		name: "PUSH32 with all data",
		code: Bytecode.fromHex(
			"0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00",
		),
		expectedValid: true,
	},
	{
		name: "PUSH32 missing 1 byte",
		code: Bytecode.fromHex(
			"0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		),
		expectedValid: false,
	},
	{
		name: "Multiple incomplete PUSH",
		code: Bytecode.fromHex("0x60016161"),
		expectedValid: false,
	},
];

for (const test of edgeCases) {
	const valid = Bytecode.validate(test.code);
	const match = valid === test.expectedValid;
	const status = match ? "✓" : "✗";
}

const semanticTests = [
	{
		name: "Stack underflow (ADD with empty stack)",
		code: Bytecode.fromHex("0x01"),
		validStructure: true,
		note: "Valid structure but would fail at runtime",
	},
	{
		name: "Dead code after RETURN",
		code: Bytecode.fromHex("0xf360016002"),
		validStructure: true,
		note: "Valid structure but unreachable code",
	},
	{
		name: "Undefined opcode",
		code: Bytecode.fromHex("0xef00"),
		validStructure: true,
		note: "0xef not defined but structurally valid",
	},
	{
		name: "Invalid jump target",
		code: Bytecode.fromHex("0x6000560000"),
		validStructure: true,
		note: "Jump to non-JUMPDEST (detected by analysis)",
	},
];

for (const test of semanticTests) {
	const valid = Bytecode.validate(test.code);
	const analysis = Bytecode.analyze(test.code);
}

const bytecodes = [
	"0x60016002015b00",
	"0x608060405234801561001057600080fd5b50",
	"0x60",
	"0x6101",
	"0x",
	"0x00",
];

let validCount = 0;
let invalidCount = 0;
for (const hex of bytecodes) {
	const code = Bytecode.fromHex(hex);
	const valid = Bytecode.validate(code);

	if (valid) {
		validCount++;
	} else {
		invalidCount++;
	}
}
