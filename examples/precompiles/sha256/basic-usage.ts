/**
 * SHA256 Precompile Basic Usage
 *
 * Address: 0x0000000000000000000000000000000000000002
 * Gas Cost: 60 + 12 * ceil(input_length / 32)
 *
 * Demonstrates:
 * - Hashing arbitrary data with SHA-256
 * - Gas cost calculation by input size
 * - Output format: 32 bytes (256 bits)
 * - NIST test vectors
 */

import {
	PrecompileAddress,
	execute,
} from "../../../src/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";
const message = "Hello, Ethereum!";
const messageBytes = new TextEncoder().encode(message);

// Calculate gas: 60 + 12 * ceil(len/32)
const words = Math.ceil(messageBytes.length / 32);
const gasNeeded = 60n + 12n * BigInt(words);

const result = execute(
	PrecompileAddress.SHA256,
	messageBytes,
	gasNeeded,
	Hardfork.CANCUN,
);

if (result.success) {
}

// Test vector 1: empty string
const empty = new Uint8Array(0);
const emptyGas = 60n; // 0 bytes = 0 words
const emptyResult = execute(
	PrecompileAddress.SHA256,
	empty,
	emptyGas,
	Hardfork.CANCUN,
);

const expectedEmpty =
	"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const emptyHash = Buffer.from(emptyResult.output).toString("hex");

// Test vector 2: "abc"
const abc = new TextEncoder().encode("abc");
const abcGas = 60n + 12n; // 3 bytes = 1 word
const abcResult = execute(
	PrecompileAddress.SHA256,
	abc,
	abcGas,
	Hardfork.CANCUN,
);

const expectedAbc =
	"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
const abcHash = Buffer.from(abcResult.output).toString("hex");
const sizes = [0, 1, 32, 33, 64, 100, 1000];

for (const size of sizes) {
	const input = size > 0 ? crypto.getRandomValues(new Uint8Array(size)) : new Uint8Array(0);
	const w = Math.ceil(size / 32);
	const gas = 60n + 12n * BigInt(w);
	const perByte = size > 0 ? Number(gas) / size : 0;
}
const testData = crypto.getRandomValues(new Uint8Array(100));
const insufficientGas = 50n; // Need 60 + 12*4 = 108

const oogResult = execute(
	PrecompileAddress.SHA256,
	testData,
	insufficientGas,
	Hardfork.CANCUN,
);
const largeInput = crypto.getRandomValues(new Uint8Array(10000));

const largeWords = Math.ceil(largeInput.length / 32);
const largeGas = 60n + 12n * BigInt(largeWords);

const largeResult = execute(
	PrecompileAddress.SHA256,
	largeInput,
	largeGas,
	Hardfork.CANCUN,
);

if (largeResult.success) {
}
