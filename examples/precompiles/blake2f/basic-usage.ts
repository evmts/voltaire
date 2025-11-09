import {
	execute,
	PrecompileAddress,
} from "../../../src/precompiles/precompiles.js";
import { Hardfork } from "../../../src/primitives/Hardfork/index.js";

/**
 * Blake2f Precompile (0x09) - Basic Usage
 *
 * Address: 0x0000000000000000000000000000000000000009
 * Introduced: Istanbul (EIP-152)
 *
 * Blake2f is the compression function of Blake2b hash algorithm.
 * It processes 128-byte blocks with configurable rounds.
 *
 * Gas Cost: 1 gas per round (e.g., 12 rounds = 12 gas)
 *
 * Input: Exactly 213 bytes
 *   - Bytes 0-3:    rounds (big-endian u32)
 *   - Bytes 4-67:   h (state vector, 8x u64 little-endian)
 *   - Bytes 68-195: m (message block, 16x u64 little-endian)
 *   - Bytes 196-211: t (offset counters, 2x u64 little-endian)
 *   - Byte 212:     f (final block flag, 0x00 or 0x01)
 *
 * Output: 64 bytes (new state vector)
 */

console.log("=== Blake2f Precompile Basic Usage ===\n");

// Blake2b IV (initialization vector) for Blake2b-512
// These are the first 64 bits of the fractional parts of the square roots of the first 8 primes
const BLAKE2B_IV = [
	0x6a09e667f3bcc908n, // sqrt(2)
	0xbb67ae8584caa73bn, // sqrt(3)
	0x3c6ef372fe94f82bn, // sqrt(5)
	0xa54ff53a5f1d36f1n, // sqrt(7)
	0x510e527fade682d1n, // sqrt(11)
	0x9b05688c2b3e6c1fn, // sqrt(13)
	0x1f83d9abfb41bd6bn, // sqrt(17)
	0x5be0cd19137e2179n, // sqrt(19)
];

// Example 1: Basic Blake2f call with 12 rounds (standard)
console.log("1. Standard Blake2f Compression (12 rounds)");
console.log("-".repeat(50));

const input1 = new Uint8Array(213);
const view1 = new DataView(input1.buffer);

// Set rounds: 12 (big-endian at offset 0)
view1.setUint32(0, 12, false);

// Set state h: Blake2b IV XOR parameter block
// For Blake2b-512: digest length = 64 bytes (0x40), fanout = 1, depth = 1
const paramBlock = 0x01010040n; // Parameters encoded as u64
BLAKE2B_IV.forEach((iv, i) => {
	const value = i === 0 ? iv ^ paramBlock : iv;
	view1.setBigUint64(4 + i * 8, value, true); // Little-endian
});

// Set message m: all zeros (empty message)
// Already zero-initialized

// Set offset counter t: [0, 0] for first block
view1.setBigUint64(196, 0n, true);
view1.setBigUint64(204, 0n, true);

// Set final flag f: 0x01 (this is final block)
input1[212] = 0x01;

console.log("Input configuration:");
console.log(`  Rounds: 12`);
console.log(`  State h: Blake2b-512 IV (XOR parameter block)`);
console.log(`  Message: empty (all zeros)`);
console.log(`  Offset: 0 bytes processed`);
console.log(`  Final: true\n`);

const result1 = execute(
	PrecompileAddress.BLAKE2F,
	input1,
	20n, // Provide enough gas
	Hardfork.CANCUN,
);

if (result1.success) {
	console.log(`✓ Success`);
	console.log(`  Gas used: ${result1.gasUsed}`);
	console.log(`  Output: ${result1.output.length} bytes (new state)`);

	// First 32 bytes of output are the hash of empty string
	const hashPrefix = result1.output.slice(0, 16);
	console.log(
		`  Hash prefix: 0x${Array.from(hashPrefix)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")}`,
	);
} else {
	console.log(`✗ Failed: ${result1.error}`);
}

console.log("\n");

// Example 2: Compress message "abc"
console.log('2. Hash Message "abc"');
console.log("-".repeat(50));

const input2 = new Uint8Array(213);
const view2 = new DataView(input2.buffer);

// Set rounds: 12
view2.setUint32(0, 12, false);

// Set state h: same IV
BLAKE2B_IV.forEach((iv, i) => {
	const value = i === 0 ? iv ^ paramBlock : iv;
	view2.setBigUint64(4 + i * 8, value, true);
});

// Set message m: "abc" in little-endian u64 words
// "abc" = 0x61 0x62 0x63
input2[68] = 0x61; // 'a'
input2[69] = 0x62; // 'b'
input2[70] = 0x63; // 'c'

// Set offset counter t: [3, 0] (3 bytes processed)
view2.setBigUint64(196, 3n, true);
view2.setBigUint64(204, 0n, true);

// Set final flag f: 0x01
input2[212] = 0x01;

console.log("Input configuration:");
console.log(`  Rounds: 12`);
console.log(`  Message: "abc" (3 bytes)`);
console.log(`  Offset: 3 bytes processed`);
console.log(`  Final: true\n`);

const result2 = execute(
	PrecompileAddress.BLAKE2F,
	input2,
	20n,
	Hardfork.CANCUN,
);

if (result2.success) {
	console.log(`✓ Success`);
	console.log(`  Gas used: ${result2.gasUsed}`);

	// Display hash
	const hash = result2.output;
	console.log(
		`  Blake2b("abc"): 0x${Array.from(hash)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")}`,
	);
} else {
	console.log(`✗ Failed: ${result2.error}`);
}

console.log("\n");

// Example 3: Variable rounds (gas cost demonstration)
console.log("3. Variable Rounds (Gas Cost)");
console.log("-".repeat(50));

const roundTests = [1, 12, 100, 1000];

for (const rounds of roundTests) {
	const input = new Uint8Array(213);
	const view = new DataView(input.buffer);

	view.setUint32(0, rounds, false);

	BLAKE2B_IV.forEach((iv, i) => {
		const value = i === 0 ? iv ^ paramBlock : iv;
		view.setBigUint64(4 + i * 8, value, true);
	});

	input[212] = 0x01;

	const result = execute(
		PrecompileAddress.BLAKE2F,
		input,
		BigInt(rounds + 10), // Ensure enough gas
		Hardfork.CANCUN,
	);

	if (result.success) {
		console.log(
			`  ${rounds.toString().padStart(4)} rounds → ${result.gasUsed} gas`,
		);
	}
}

console.log("\n");

// Example 4: Error cases
console.log("4. Error Cases");
console.log("-".repeat(50));

// Wrong input length
const wrongLength = new Uint8Array(212); // Should be 213
const result4a = execute(
	PrecompileAddress.BLAKE2F,
	wrongLength,
	20n,
	Hardfork.CANCUN,
);
console.log(
	`Wrong input length (212): ${result4a.success ? "unexpected success" : "✓ failed as expected"}`,
);

// Out of gas
const input4b = new Uint8Array(213);
new DataView(input4b.buffer).setUint32(0, 100, false); // 100 rounds
input4b[212] = 0x01;
const result4b = execute(
	PrecompileAddress.BLAKE2F,
	input4b,
	50n, // Not enough for 100 rounds
	Hardfork.CANCUN,
);
console.log(
	`Out of gas (50 gas for 100 rounds): ${result4b.success ? "unexpected success" : "✓ failed as expected"}`,
);

// Invalid final flag
const input4c = new Uint8Array(213);
new DataView(input4c.buffer).setUint32(0, 12, false);
input4c[212] = 0x02; // Invalid (must be 0x00 or 0x01)
const result4c = execute(
	PrecompileAddress.BLAKE2F,
	input4c,
	20n,
	Hardfork.CANCUN,
);
console.log(
	`Invalid final flag (0x02): ${result4c.success ? "unexpected success" : "✓ failed as expected"}`,
);

console.log("\n");

// Example 5: Byte order demonstration
console.log("5. Byte Order (Little-Endian)");
console.log("-".repeat(50));
console.log("Blake2f uses little-endian for h, m, t (unlike most EVM)");
console.log("Only the rounds field is big-endian.\n");

// Demonstrate little-endian encoding
const testValue = 0x0102030405060708n;
const leBytes = new Uint8Array(8);
const view5 = new DataView(leBytes.buffer);
view5.setBigUint64(0, testValue, true); // Little-endian

console.log(`Value: 0x${testValue.toString(16)}`);
console.log(
	`Little-endian bytes: ${Array.from(leBytes)
		.map((b) => "0x" + b.toString(16).padStart(2, "0"))
		.join(" ")}`,
);
console.log(`Expected: 0x08 0x07 0x06 0x05 0x04 0x03 0x02 0x01\n`);

console.log("=== Complete ===\n");
console.log("Key Points:");
console.log("- Blake2f is extremely gas-efficient: ~0.09 gas/byte");
console.log("- 12 rounds is standard Blake2b compression");
console.log("- Input must be exactly 213 bytes");
console.log("- Most fields are little-endian (except rounds)");
console.log("- Used for Zcash bridges and efficient hashing");
