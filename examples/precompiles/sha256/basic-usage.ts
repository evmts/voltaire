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

import { execute, PrecompileAddress } from '../../../src/precompiles/precompiles.js';
import * as Hardfork from '../../../src/primitives/Hardfork/index.js';

console.log('=== SHA256 Precompile Basic Usage ===\n');

// Example 1: Hash a simple message
console.log('=== Example 1: Simple Message ===');
const message = 'Hello, Ethereum!';
const messageBytes = new TextEncoder().encode(message);

// Calculate gas: 60 + 12 * ceil(len/32)
const words = Math.ceil(messageBytes.length / 32);
const gasNeeded = 60n + 12n * BigInt(words);

console.log('Message:', message);
console.log('Input length:', messageBytes.length, 'bytes');
console.log('Words (32-byte):', words);
console.log('Gas needed:', gasNeeded.toString());

const result = execute(
	PrecompileAddress.SHA256,
	messageBytes,
	gasNeeded,
	Hardfork.CANCUN,
);

if (result.success) {
	console.log('SHA-256 hash:', '0x' + Buffer.from(result.output).toString('hex'));
	console.log('Gas used:', result.gasUsed.toString());
}

// Example 2: NIST test vectors
console.log('\n=== Example 2: NIST Test Vectors ===');

// Test vector 1: empty string
const empty = new Uint8Array(0);
const emptyGas = 60n; // 0 bytes = 0 words
const emptyResult = execute(
	PrecompileAddress.SHA256,
	empty,
	emptyGas,
	Hardfork.CANCUN,
);

const expectedEmpty = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const emptyHash = Buffer.from(emptyResult.output).toString('hex');
console.log('Empty string:');
console.log('  Hash:', emptyHash);
console.log('  Expected:', expectedEmpty);
console.log('  Match:', emptyHash === expectedEmpty ? '✓ Yes' : '✗ No');

// Test vector 2: "abc"
const abc = new TextEncoder().encode('abc');
const abcGas = 60n + 12n; // 3 bytes = 1 word
const abcResult = execute(
	PrecompileAddress.SHA256,
	abc,
	abcGas,
	Hardfork.CANCUN,
);

const expectedAbc = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
const abcHash = Buffer.from(abcResult.output).toString('hex');
console.log('\n"abc":');
console.log('  Hash:', abcHash);
console.log('  Expected:', expectedAbc);
console.log('  Match:', abcHash === expectedAbc ? '✓ Yes' : '✗ No');

// Example 3: Different input sizes and gas costs
console.log('\n=== Example 3: Gas Costs by Input Size ===');
const sizes = [0, 1, 32, 33, 64, 100, 1000];

for (const size of sizes) {
	const input = new Uint8Array(size);
	const w = Math.ceil(size / 32);
	const gas = 60n + 12n * BigInt(w);
	const perByte = size > 0 ? Number(gas) / size : 0;

	console.log(`${size.toString().padStart(4)} bytes: ${gas.toString().padStart(4)} gas (${w} words, ~${perByte.toFixed(3)} gas/byte)`);
}

// Example 4: Out of gas
console.log('\n=== Example 4: Out of Gas ===');
const testData = new Uint8Array(100);
const insufficientGas = 50n; // Need 60 + 12*4 = 108

const oogResult = execute(
	PrecompileAddress.SHA256,
	testData,
	insufficientGas,
	Hardfork.CANCUN,
);

console.log('Insufficient gas:', !oogResult.success ? '✓ Fails as expected' : '✗ Unexpected success');
console.log('Error:', oogResult.error);

// Example 5: Large input
console.log('\n=== Example 5: Large Input ===');
const largeInput = new Uint8Array(10000);
crypto.getRandomValues(largeInput);

const largeWords = Math.ceil(largeInput.length / 32);
const largeGas = 60n + 12n * BigInt(largeWords);

console.log('Large input size:', largeInput.length, 'bytes');
console.log('Gas needed:', largeGas.toString());

const largeResult = execute(
	PrecompileAddress.SHA256,
	largeInput,
	largeGas,
	Hardfork.CANCUN,
);

if (largeResult.success) {
	console.log('Hash:', '0x' + Buffer.from(largeResult.output).toString('hex'));
	console.log('Gas used:', largeResult.gasUsed.toString());
}

console.log('\n=== Summary ===');
console.log('Base cost: 60 gas');
console.log('Per-word cost: 12 gas (32 bytes per word)');
console.log('Per-byte cost: ~0.375 gas');
console.log('Output size: Always 32 bytes');
