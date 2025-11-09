/**
 * Hash Validation Example
 *
 * Demonstrates:
 * - Validating hex strings before parsing
 * - Type guards and runtime type checking
 * - Safe parsing patterns
 * - Assertion-based validation
 * - Form input validation
 */

import { Hash } from "../../../src/primitives/Hash/index.js";

const testCases = [
	{
		input: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		expected: true,
		reason: "Valid with 0x prefix",
	},
	{
		input: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		expected: true,
		reason: "Valid without 0x prefix",
	},
	{ input: "0x1234", expected: false, reason: "Too short (4 chars, need 64)" },
	{
		input:
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefff",
		expected: false,
		reason: "Too long (66 chars)",
	},
	{
		input: "0xGGGG567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		expected: false,
		reason: "Invalid hex chars",
	},
	{
		input: "0x1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
		expected: true,
		reason: "Valid uppercase",
	},
	{ input: "", expected: false, reason: "Empty string" },
	{ input: "0x", expected: false, reason: "Only prefix" },
];
testCases.forEach(({ input, expected, reason }) => {
	const isValid = Hash.isValidHex(input);
	const status = isValid === expected ? "✓" : "✗";
	const displayInput =
		input.length > 20 ? `${input.slice(0, 10)}...${input.slice(-6)}` : input;
});

// Pattern 1: Return null on invalid
function parseHashOrNull(input: string): Hash | null {
	if (!Hash.isValidHex(input)) {
		return null;
	}
	try {
		return Hash.fromHex(input);
	} catch (error) {
		console.error(
			`Parse error: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return null;
	}
}

// Pattern 2: Throw on invalid
function parseHashOrThrow(input: string): Hash {
	if (!Hash.isValidHex(input)) {
		throw new Error(`Invalid hash format: ${input}`);
	}
	return Hash.fromHex(input);
}

// Pattern 3: Return result object
interface ParseResult {
	success: boolean;
	hash?: Hash;
	error?: string;
}

function parseHashResult(input: string): ParseResult {
	if (!Hash.isValidHex(input)) {
		return { success: false, error: "Invalid hex format" };
	}
	try {
		return { success: true, hash: Hash.fromHex(input) };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

// Test patterns
const validInput =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const invalidInput = "0x1234";
const result1 = parseHashOrNull(validInput);
const result2 = parseHashOrNull(invalidInput);
try {
	const result3 = parseHashOrThrow(validInput);
} catch (error) {
}

try {
	const result4 = parseHashOrThrow(invalidInput);
} catch (error) {
}
const result5 = parseHashResult(validInput);
const result6 = parseHashResult(invalidInput);

function processUnknownValue(value: unknown, label: string) {
	if (Hash.isHash(value)) {
	} else if (typeof value === "string") {
	} else if (value instanceof Uint8Array) {
	} else {
	}
}

const hash = Hash.random();
const bytes32 = new Uint8Array(32);
const bytes20 = new Uint8Array(20);
const hexString =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const number = 123;
processUnknownValue(hash, "Hash instance");
processUnknownValue(bytes32, "32 bytes");
processUnknownValue(bytes20, "20 bytes");
processUnknownValue(hexString, "Hex string");
processUnknownValue(number, "Number");

const mixedValues: unknown[] = [
	Hash.random(),
	new Uint8Array(32),
	new Uint8Array(20),
	"not a hash",
	Hash.keccak256String("hello"),
	123,
	null,
];

const validHashes = mixedValues.filter(Hash.isHash);
validHashes.forEach((hash, i) => {
});

function processHash(value: unknown): string {
	// Assert will throw if not a hash
	Hash.assert(value, "Expected hash value");

	// TypeScript knows value is Hash after assertion
	return Hash.toHex(value);
}

try {
	const validHash = Hash.random();
	const result = processHash(validHash);
} catch (error) {
}

try {
	const invalidValue = "not a hash";
	const result = processHash(invalidValue);
} catch (error) {
}

interface ValidationError {
	field: string;
	message: string;
}

function validateHashInput(input: string): ValidationError[] {
	const errors: ValidationError[] = [];

	// Required check
	if (!input || input.trim() === "") {
		errors.push({ field: "hash", message: "Hash is required" });
		return errors;
	}

	// Prefix check
	if (!input.startsWith("0x")) {
		errors.push({ field: "hash", message: "Hash must start with 0x prefix" });
	}

	// Length check
	const normalized = input.slice(2);
	if (normalized.length !== 64) {
		errors.push({
			field: "hash",
			message: `Hash must be 64 hex characters, got ${normalized.length}`,
		});
	}

	// Character check
	if (!/^[0-9a-fA-F]+$/.test(normalized)) {
		errors.push({ field: "hash", message: "Hash contains invalid characters" });
	}

	// Or use isValidHex
	if (errors.length === 0 && !Hash.isValidHex(input)) {
		errors.push({ field: "hash", message: "Invalid hash format" });
	}

	return errors;
}

const formInputs = [
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", // Valid
	"", // Empty
	"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", // No prefix
	"0x1234", // Too short
	"0xGGGG567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", // Invalid chars
];
formInputs.forEach((input) => {
	const errors = validateHashInput(input);
	const display =
		input.length > 20 ? `${input.slice(0, 10)}...` : input || "(empty)";

	if (errors.length === 0) {
	} else {
		errors.forEach((err) => );
	}
});

interface GetLogsParams {
	fromBlock: number;
	toBlock: number;
	topics: (string | null)[];
}

function validateGetLogsParams(params: GetLogsParams): void {
	// Validate block range
	if (params.fromBlock < 0) {
		throw new Error("fromBlock must be non-negative");
	}
	if (params.toBlock < params.fromBlock) {
		throw new Error("toBlock must be >= fromBlock");
	}

	// Validate topics
	for (let i = 0; i < params.topics.length; i++) {
		const topic = params.topics[i];
		if (topic !== null && !Hash.isValidHex(topic)) {
			throw new Error(`Invalid topic hash at index ${i}: ${topic}`);
		}
	}
}

// Valid params
try {
	const validParams: GetLogsParams = {
		fromBlock: 1000,
		toBlock: 2000,
		topics: [
			"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			null,
			null,
		],
	};
	validateGetLogsParams(validParams);
} catch (error) {
}

// Invalid params
try {
	const invalidParams: GetLogsParams = {
		fromBlock: 1000,
		toBlock: 2000,
		topics: ["0x1234"], // Too short
	};
	validateGetLogsParams(invalidParams);
} catch (error) {
}

const hashes = [
	Hash.fromBytes(new Uint8Array(32)), // Zero
	Hash.keccak256String("hello"), // Non-zero
	Hash.ZERO, // Zero constant
	Hash.random(), // Non-zero
];
hashes.forEach((hash, i) => {
	const isZero = hash.isZero();
	const status = isZero ? "ZERO" : "NON-ZERO";
});

function validateHashBatch(inputs: string[]): {
	valid: Hash[];
	invalid: string[];
} {
	const valid: Hash[] = [];
	const invalid: string[] = [];

	for (const input of inputs) {
		if (Hash.isValidHex(input)) {
			try {
				valid.push(Hash.fromHex(input));
			} catch {
				invalid.push(input);
			}
		} else {
			invalid.push(input);
		}
	}

	return { valid, invalid };
}

const batchInputs = [
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	"0x1234", // Invalid
	"0xGGGG567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", // Invalid
	"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
];

const batchResult = validateHashBatch(batchInputs);
batchResult.invalid.forEach((input) => {
	const display = input.length > 20 ? `${input.slice(0, 10)}...` : input;
});
