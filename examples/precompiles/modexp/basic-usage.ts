/**
 * ModExp Precompile Basic Usage
 *
 * Address: 0x0000000000000000000000000000000000000005
 * Gas Cost: Complex formula, minimum 200 gas
 *
 * Demonstrates:
 * - Modular exponentiation: (base^exponent) mod modulus
 * - Input format: baseLen(32) || expLen(32) || modLen(32) || base || exp || mod
 * - Simple examples with small numbers
 * - Gas cost variations
 */

import {
	execute,
	PrecompileAddress,
} from "../../../src/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

console.log("=== ModExp Precompile Basic Usage ===\n");

// Helper to create ModExp input
function createModExpInput(
	base: bigint,
	exponent: bigint,
	modulus: bigint,
): Uint8Array {
	// Convert to big-endian bytes
	const baseBytes = bigIntToBytes(base);
	const expBytes = bigIntToBytes(exponent);
	const modBytes = bigIntToBytes(modulus);

	// Create input: lengths (96 bytes) + data
	const input = new Uint8Array(
		96 + baseBytes.length + expBytes.length + modBytes.length,
	);
	const view = new DataView(input.buffer);

	// Set lengths (32 bytes each, big-endian)
	view.setBigUint64(24, BigInt(baseBytes.length), false);
	view.setBigUint64(56, BigInt(expBytes.length), false);
	view.setBigUint64(88, BigInt(modBytes.length), false);

	// Set values
	input.set(baseBytes, 96);
	input.set(expBytes, 96 + baseBytes.length);
	input.set(modBytes, 96 + baseBytes.length + expBytes.length);

	return input;
}

function bigIntToBytes(value: bigint): Uint8Array {
	if (value === 0n) return new Uint8Array([0]);
	const hex = value.toString(16);
	const padded = hex.length % 2 === 0 ? hex : "0" + hex;
	return new Uint8Array(
		padded.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
	);
}

function bytesToBigInt(bytes: Uint8Array): bigint {
	let result = 0n;
	for (const byte of bytes) {
		result = (result << 8n) | BigInt(byte);
	}
	return result;
}

// Example 1: Simple modular exponentiation - 2^3 mod 5 = 3
console.log("=== Example 1: 2^3 mod 5 ===");
const input1 = createModExpInput(2n, 3n, 5n);

console.log("Calculation: 2^3 mod 5");
console.log("Expected: 3 (since 2^3 = 8, and 8 mod 5 = 3)");
console.log("Input length:", input1.length, "bytes");

const result1 = execute(
	PrecompileAddress.MODEXP,
	input1,
	10000n,
	Hardfork.CANCUN,
);

if (result1.success) {
	const output = bytesToBigInt(result1.output);
	console.log("Result:", output.toString());
	console.log("Correct:", output === 3n ? "✓ Yes" : "✗ No");
	console.log("Gas used:", result1.gasUsed.toString());
}

// Example 2: 5^0 mod 7 = 1 (zero exponent)
console.log("\n=== Example 2: 5^0 mod 7 (Zero Exponent) ===");
const input2 = createModExpInput(5n, 0n, 7n);

console.log("Calculation: 5^0 mod 7");
console.log("Expected: 1 (any number to power 0 is 1)");

const result2 = execute(
	PrecompileAddress.MODEXP,
	input2,
	10000n,
	Hardfork.CANCUN,
);

if (result2.success) {
	const output = bytesToBigInt(result2.output);
	console.log("Result:", output.toString());
	console.log("Correct:", output === 1n ? "✓ Yes" : "✗ No");
	console.log("Gas used:", result2.gasUsed.toString());
}

// Example 3: Larger numbers - 123^456 mod 789
console.log("\n=== Example 3: 123^456 mod 789 ===");
const input3 = createModExpInput(123n, 456n, 789n);

console.log("Calculation: 123^456 mod 789");

const result3 = execute(
	PrecompileAddress.MODEXP,
	input3,
	100000n,
	Hardfork.CANCUN,
);

if (result3.success) {
	const output = bytesToBigInt(result3.output);
	console.log("Result:", output.toString());
	console.log("Gas used:", result3.gasUsed.toString());

	// Verify manually
	const expected = 123n ** 456n % 789n;
	console.log(
		"Matches JavaScript calculation:",
		output === expected ? "✓ Yes" : "✗ No",
	);
}

// Example 4: Modulus = 1 (always returns 0)
console.log("\n=== Example 4: Any Number mod 1 ===");
const input4 = createModExpInput(100n, 50n, 1n);

console.log("Calculation: 100^50 mod 1");
console.log("Expected: 0 (anything mod 1 is 0)");

const result4 = execute(
	PrecompileAddress.MODEXP,
	input4,
	10000n,
	Hardfork.CANCUN,
);

if (result4.success) {
	const output = bytesToBigInt(result4.output);
	console.log("Result:", output.toString());
	console.log("Correct:", output === 0n ? "✓ Yes" : "✗ No");
	console.log("Gas used:", result4.gasUsed.toString());
}

// Example 5: Gas cost increases with input size
console.log("\n=== Example 5: Gas Costs by Input Size ===");

const testCases = [
	{ base: 2n, exp: 3n, mod: 5n, desc: "Small (1 byte each)" },
	{ base: 256n, exp: 256n, mod: 1000n, desc: "Medium (2 bytes)" },
	{
		base: 2n ** 64n,
		exp: 2n ** 32n,
		mod: 2n ** 64n + 1n,
		desc: "Large (8+ bytes)",
	},
];

for (const tc of testCases) {
	const input = createModExpInput(tc.base, tc.exp, tc.mod);
	const result = execute(
		PrecompileAddress.MODEXP,
		input,
		1000000n,
		Hardfork.CANCUN,
	);

	if (result.success) {
		console.log(`${tc.desc}: ${result.gasUsed.toString()} gas`);
	}
}

// Example 6: Minimum gas cost
console.log("\n=== Example 6: Minimum Gas Cost ===");
console.log("ModExp has a minimum gas cost of 200");

const minInput = createModExpInput(1n, 1n, 2n);
const minResult = execute(
	PrecompileAddress.MODEXP,
	minInput,
	1000n,
	Hardfork.CANCUN,
);

console.log("Gas used for minimal input:", minResult.gasUsed.toString());
console.log("At least 200:", minResult.gasUsed >= 200n ? "✓ Yes" : "✗ No");

console.log("\n=== Summary ===");
console.log("Formula: (base^exponent) mod modulus");
console.log(
	"Input format: baseLen(32) || expLen(32) || modLen(32) || base || exp || mod",
);
console.log("Output length: Same as modulus length");
console.log("Minimum gas: 200");
console.log("Gas cost: Complex formula based on input sizes");
console.log("Use cases: RSA verification, zkSNARKs, cryptographic protocols");
