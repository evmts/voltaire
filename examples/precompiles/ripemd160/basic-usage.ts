/**
 * RIPEMD160 Precompile Basic Usage
 *
 * Address: 0x0000000000000000000000000000000000000003
 * Gas Cost: 600 + 120 * ceil(input_length / 32)
 *
 * Demonstrates:
 * - Hashing data with RIPEMD-160
 * - Output format: 32 bytes (12 zero padding + 20-byte hash)
 * - Gas cost calculation (10x more expensive than SHA-256)
 * - Bitcoin address generation use case
 */

import {
	PrecompileAddress,
	execute,
} from "../../../src/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";
const message = "Hello, RIPEMD160!";
const messageBytes = new TextEncoder().encode(message);

// Calculate gas: 600 + 120 * ceil(len/32)
const words = Math.ceil(messageBytes.length / 32);
const gasNeeded = 600n + 120n * BigInt(words);

const result = execute(
	PrecompileAddress.RIPEMD160,
	messageBytes,
	gasNeeded,
	Hardfork.CANCUN,
);

if (result.success) {
	// Extract 20-byte hash from right side (12 bytes padding)
	const hash = result.output.slice(12, 32);

	// Verify padding
	const padding = result.output.slice(0, 12);
	const isZeroPadded = padding.every((byte) => byte === 0);
}
const empty = new Uint8Array(0);
const emptyGas = 600n; // 0 bytes = 0 words

const emptyResult = execute(
	PrecompileAddress.RIPEMD160,
	empty,
	emptyGas,
	Hardfork.CANCUN,
);

if (emptyResult.success) {
	const emptyHash = emptyResult.output.slice(12, 32);
}
const sizes = [0, 1, 32, 33, 64, 100, 1000];

for (const size of sizes) {
	const w = Math.ceil(size / 32);
	const gas = 600n + 120n * BigInt(w);
	const perByte = size > 0 ? Number(gas) / size : 0;
}
const testSize = 100;
const testWords = Math.ceil(testSize / 32);

const ripemd160Gas = 600n + 120n * BigInt(testWords);
const sha256Gas = 60n + 12n * BigInt(testWords);
const ratio = Number(ripemd160Gas) / Number(sha256Gas);
const inputs = [
	new TextEncoder().encode("Input 1"),
	new TextEncoder().encode("Input 2"),
	new TextEncoder().encode("Input 3"),
];

let totalGas = 0n;
const hashes: Uint8Array[] = [];

for (let i = 0; i < inputs.length; i++) {
	const input = inputs[i];
	const w = Math.ceil(input.length / 32);
	const gas = 600n + 120n * BigInt(w);

	const res = execute(PrecompileAddress.RIPEMD160, input, gas, Hardfork.CANCUN);

	if (res.success) {
		hashes.push(res.output.slice(12, 32));
		totalGas += res.gasUsed;
	}
}
for (let i = 0; i < hashes.length; i++) {}
const testData = crypto.getRandomValues(new Uint8Array(100));
const insufficientGas = 500n; // Need 600 + 120*4 = 1080

const oogResult = execute(
	PrecompileAddress.RIPEMD160,
	testData,
	insufficientGas,
	Hardfork.CANCUN,
);
