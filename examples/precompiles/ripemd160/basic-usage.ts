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
	execute,
	PrecompileAddress,
} from "../../../src/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

console.log("=== RIPEMD160 Precompile Basic Usage ===\n");

// Example 1: Basic hashing
console.log("=== Example 1: Basic Hashing ===");
const message = "Hello, RIPEMD160!";
const messageBytes = new TextEncoder().encode(message);

// Calculate gas: 600 + 120 * ceil(len/32)
const words = Math.ceil(messageBytes.length / 32);
const gasNeeded = 600n + 120n * BigInt(words);

console.log("Message:", message);
console.log("Input length:", messageBytes.length, "bytes");
console.log("Words (32-byte):", words);
console.log("Gas needed:", gasNeeded.toString());

const result = execute(
	PrecompileAddress.RIPEMD160,
	messageBytes,
	gasNeeded,
	Hardfork.CANCUN,
);

if (result.success) {
	// Extract 20-byte hash from right side (12 bytes padding)
	const hash = result.output.slice(12, 32);
	console.log(
		"RIPEMD-160 hash (20 bytes):",
		"0x" + Buffer.from(hash).toString("hex"),
	);
	console.log(
		"Full output (32 bytes):",
		"0x" + Buffer.from(result.output).toString("hex"),
	);
	console.log("Gas used:", result.gasUsed.toString());

	// Verify padding
	const padding = result.output.slice(0, 12);
	const isZeroPadded = padding.every((byte) => byte === 0);
	console.log("Correct zero padding:", isZeroPadded ? "✓ Yes" : "✗ No");
}

// Example 2: Empty input
console.log("\n=== Example 2: Empty Input ===");
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
	console.log(
		"Empty string hash:",
		"0x" + Buffer.from(emptyHash).toString("hex"),
	);
	console.log("Gas used:", emptyResult.gasUsed.toString());
}

// Example 3: Gas costs by input size
console.log("\n=== Example 3: Gas Costs by Input Size ===");
const sizes = [0, 1, 32, 33, 64, 100, 1000];

for (const size of sizes) {
	const w = Math.ceil(size / 32);
	const gas = 600n + 120n * BigInt(w);
	const perByte = size > 0 ? Number(gas) / size : 0;

	console.log(
		`${size.toString().padStart(4)} bytes: ${gas.toString().padStart(5)} gas (${w} words, ~${perByte.toFixed(2)} gas/byte)`,
	);
}

// Example 4: Comparison with SHA-256
console.log("\n=== Example 4: SHA-256 vs RIPEMD-160 Gas Comparison ===");
const testSize = 100;
const testWords = Math.ceil(testSize / 32);

const ripemd160Gas = 600n + 120n * BigInt(testWords);
const sha256Gas = 60n + 12n * BigInt(testWords);
const ratio = Number(ripemd160Gas) / Number(sha256Gas);

console.log("Hashing", testSize, "bytes:");
console.log("  RIPEMD-160:", ripemd160Gas.toString(), "gas");
console.log("  SHA-256:", sha256Gas.toString(), "gas");
console.log("  Ratio:", ratio.toFixed(1) + "x more expensive");

// Example 5: Multiple hashes (batch processing)
console.log("\n=== Example 5: Batch Processing ===");
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

console.log("Processed", inputs.length, "inputs");
console.log("Total gas:", totalGas.toString());
console.log("Average gas:", (totalGas / BigInt(inputs.length)).toString());
for (let i = 0; i < hashes.length; i++) {
	console.log(`Hash ${i + 1}:`, "0x" + Buffer.from(hashes[i]).toString("hex"));
}

// Example 6: Out of gas
console.log("\n=== Example 6: Out of Gas ===");
const testData = new Uint8Array(100);
const insufficientGas = 500n; // Need 600 + 120*4 = 1080

const oogResult = execute(
	PrecompileAddress.RIPEMD160,
	testData,
	insufficientGas,
	Hardfork.CANCUN,
);

console.log(
	"Insufficient gas:",
	!oogResult.success ? "✓ Fails as expected" : "✗ Unexpected success",
);
console.log("Error:", oogResult.error);

console.log("\n=== Summary ===");
console.log("Base cost: 600 gas (10x SHA-256)");
console.log("Per-word cost: 120 gas (10x SHA-256)");
console.log("Per-byte cost: ~3.75 gas");
console.log("Output: 20-byte hash, left-padded to 32 bytes");
console.log("Use case: Bitcoin address generation, legacy systems");
