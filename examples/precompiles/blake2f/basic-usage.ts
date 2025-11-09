import {
	PrecompileAddress,
	execute,
} from "../../../src/precompiles/precompiles.js";
import { Hardfork } from "../../../src/primitives/Hardfork/index.js";

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

const result1 = execute(
	PrecompileAddress.BLAKE2F,
	input1,
	20n, // Provide enough gas
	Hardfork.CANCUN,
);

if (result1.success) {
	// First 32 bytes of output are the hash of empty string
	const hashPrefix = result1.output.slice(0, 16);
} else {
}

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

const result2 = execute(
	PrecompileAddress.BLAKE2F,
	input2,
	20n,
	Hardfork.CANCUN,
);

if (result2.success) {
	// Display hash
	const hash = result2.output;
} else {
}

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
	}
}

// Wrong input length
const wrongLength = new Uint8Array(212); // Should be 213
const result4a = execute(
	PrecompileAddress.BLAKE2F,
	wrongLength,
	20n,
	Hardfork.CANCUN,
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

// Demonstrate little-endian encoding
const testValue = 0x0102030405060708n;
const leBytes = new Uint8Array(8);
const view5 = new DataView(leBytes.buffer);
view5.setBigUint64(0, testValue, true); // Little-endian
