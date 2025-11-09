/**
 * Identity Precompile Basic Usage
 *
 * Address: 0x0000000000000000000000000000000000000004
 * Gas Cost: 15 + 3 * ceil(input_length / 32)
 *
 * Demonstrates:
 * - Data copying via identity precompile
 * - Gas cost analysis (cheapest per-word cost)
 * - Use cases: memory operations, gas metering, testing
 * - Output equals input (unchanged)
 */

import { execute, PrecompileAddress } from '../../../src/precompiles/precompiles.js';
import * as Hardfork from '../../../src/primitives/Hardfork/index.js';

console.log('=== Identity Precompile Basic Usage ===\n');

// Example 1: Simple data copy
console.log('=== Example 1: Simple Data Copy ===');
const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

const words = Math.ceil(data.length / 32);
const gasNeeded = 15n + 3n * BigInt(words);

console.log('Input:', Array.from(data));
console.log('Input length:', data.length, 'bytes');
console.log('Gas needed:', gasNeeded.toString());

const result = execute(
	PrecompileAddress.IDENTITY,
	data,
	gasNeeded,
	Hardfork.CANCUN,
);

if (result.success) {
	console.log('Output:', Array.from(result.output));
	console.log('Gas used:', result.gasUsed.toString());

	// Verify output equals input
	const matches = result.output.every((byte, i) => byte === data[i]);
	console.log('Output equals input:', matches ? '✓ Yes' : '✗ No');
}

// Example 2: Empty input
console.log('\n=== Example 2: Empty Input ===');
const empty = new Uint8Array(0);
const emptyGas = 15n; // Base cost only

const emptyResult = execute(
	PrecompileAddress.IDENTITY,
	empty,
	emptyGas,
	Hardfork.CANCUN,
);

console.log('Input length:', 0);
console.log('Gas used:', emptyResult.gasUsed.toString());
console.log('Output length:', emptyResult.output.length);

// Example 3: Gas costs by input size
console.log('\n=== Example 3: Gas Costs by Input Size ===');
const sizes = [0, 1, 32, 33, 64, 100, 1000, 10000];

for (const size of sizes) {
	const w = Math.ceil(size / 32);
	const gas = 15n + 3n * BigInt(w);
	const perByte = size > 0 ? Number(gas) / size : 0;

	console.log(`${size.toString().padStart(5)} bytes: ${gas.toString().padStart(4)} gas (${w.toString().padStart(3)} words, ~${perByte.toFixed(4)} gas/byte)`);
}

// Example 4: Large data copy
console.log('\n=== Example 4: Large Data Copy ===');
const largeData = new Uint8Array(1024);
crypto.getRandomValues(largeData);

const largeWords = Math.ceil(largeData.length / 32);
const largeGas = 15n + 3n * BigInt(largeWords);

console.log('Input size:', largeData.length, 'bytes');
console.log('Gas needed:', largeGas.toString());

const largeResult = execute(
	PrecompileAddress.IDENTITY,
	largeData,
	largeGas,
	Hardfork.CANCUN,
);

if (largeResult.success) {
	const matches = largeResult.output.every((byte, i) => byte === largeData[i]);
	console.log('Output matches input:', matches ? '✓ Yes' : '✗ No');
	console.log('Gas used:', largeResult.gasUsed.toString());
}

// Example 5: Comparison with other precompiles
console.log('\n=== Example 5: Gas Comparison (1000 bytes) ===');
const testSize = 1000;
const testWords = Math.ceil(testSize / 32);

const identityGas = 15n + 3n * BigInt(testWords);
const sha256Gas = 60n + 12n * BigInt(testWords);
const ripemd160Gas = 600n + 120n * BigInt(testWords);

console.log('Identity:', identityGas.toString(), 'gas (cheapest)');
console.log('SHA-256:', sha256Gas.toString(), 'gas');
console.log('RIPEMD-160:', ripemd160Gas.toString(), 'gas');
console.log('\nIdentity is the cheapest data operation precompile');

// Example 6: Use case - data forwarding
console.log('\n=== Example 6: Data Forwarding Pattern ===');
// Simulate forwarding calldata through a proxy
const calldata = new TextEncoder().encode('transfer(address,uint256)');

const forwardGas = 15n + 3n * BigInt(Math.ceil(calldata.length / 32));

const forwarded = execute(
	PrecompileAddress.IDENTITY,
	calldata,
	forwardGas,
	Hardfork.CANCUN,
);

console.log('Original calldata:', new TextDecoder().decode(calldata));
console.log('Forwarded data:', new TextDecoder().decode(forwarded.output));
console.log('Gas cost for forwarding:', forwarded.gasUsed.toString());

// Example 7: Out of gas
console.log('\n=== Example 7: Out of Gas ===');
const testData = new Uint8Array(100);
const insufficientGas = 10n; // Need 15 + 3*4 = 27

const oogResult = execute(
	PrecompileAddress.IDENTITY,
	testData,
	insufficientGas,
	Hardfork.CANCUN,
);

console.log('Insufficient gas:', !oogResult.success ? '✓ Fails as expected' : '✗ Unexpected success');
console.log('Error:', oogResult.error);

console.log('\n=== Summary ===');
console.log('Base cost: 15 gas (lowest among precompiles)');
console.log('Per-word cost: 3 gas (32 bytes)');
console.log('Per-byte cost: ~0.09375 gas (cheapest)');
console.log('Output: Identical to input');
console.log('Use cases:');
console.log('  - Efficient data copying in EVM');
console.log('  - Proxy contract data forwarding');
console.log('  - Gas accounting for memory operations');
console.log('  - Testing precompile execution mechanics');
