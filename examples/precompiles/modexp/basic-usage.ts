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
	PrecompileAddress,
	execute,
} from "../../../src/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

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
	const padded = hex.length % 2 === 0 ? hex : `0${hex}`;
	return new Uint8Array(
		padded.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)),
	);
}

function bytesToBigInt(bytes: Uint8Array): bigint {
	let result = 0n;
	for (const byte of bytes) {
		result = (result << 8n) | BigInt(byte);
	}
	return result;
}
const input1 = createModExpInput(2n, 3n, 5n);

const result1 = execute(
	PrecompileAddress.MODEXP,
	input1,
	10000n,
	Hardfork.CANCUN,
);

if (result1.success) {
	const output = bytesToBigInt(result1.output);
}
const input2 = createModExpInput(5n, 0n, 7n);

const result2 = execute(
	PrecompileAddress.MODEXP,
	input2,
	10000n,
	Hardfork.CANCUN,
);

if (result2.success) {
	const output = bytesToBigInt(result2.output);
}
const input3 = createModExpInput(123n, 456n, 789n);

const result3 = execute(
	PrecompileAddress.MODEXP,
	input3,
	100000n,
	Hardfork.CANCUN,
);

if (result3.success) {
	const output = bytesToBigInt(result3.output);

	// Verify manually
	const expected = 123n ** 456n % 789n;
}
const input4 = createModExpInput(100n, 50n, 1n);

const result4 = execute(
	PrecompileAddress.MODEXP,
	input4,
	10000n,
	Hardfork.CANCUN,
);

if (result4.success) {
	const output = bytesToBigInt(result4.output);
}

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
	}
}

const minInput = createModExpInput(1n, 1n, 2n);
const minResult = execute(
	PrecompileAddress.MODEXP,
	minInput,
	1000n,
	Hardfork.CANCUN,
);
