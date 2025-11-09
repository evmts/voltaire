/**
 * ModExp Precompile - RSA Signature Verification
 *
 * Demonstrates:
 * - Simulated RSA-2048 signature verification
 * - Large modular exponentiation operations
 * - Gas cost analysis for real-world RSA
 * - EIP-2565 gas reduction benefits
 */

import { execute, PrecompileAddress } from '../../../src/precompiles/precompiles.js';
import * as Hardfork from '../../../src/primitives/Hardfork/index.js';

console.log('=== ModExp RSA Signature Verification ===\n');

// Helper to create ModExp input
function createModExpInput(
	base: Uint8Array,
	exponent: Uint8Array,
	modulus: Uint8Array
): Uint8Array {
	const input = new Uint8Array(96 + base.length + exponent.length + modulus.length);
	const view = new DataView(input.buffer);

	// Set lengths (32 bytes each, big-endian)
	view.setBigUint64(24, BigInt(base.length), false);
	view.setBigUint64(56, BigInt(exponent.length), false);
	view.setBigUint64(88, BigInt(modulus.length), false);

	// Set values
	input.set(base, 96);
	input.set(exponent, 96 + base.length);
	input.set(modulus, 96 + base.length + exponent.length);

	return input;
}

// Example 1: RSA-2048 simulation (256-byte values)
console.log('=== Example 1: RSA-2048 Signature Verification (Simulated) ===');

// RSA-2048 uses 256-byte (2048-bit) numbers
const rsaSize = 256;

// Simulate signature (normally this is the signed message hash)
const signature = new Uint8Array(rsaSize);
crypto.getRandomValues(signature);
signature[0] = 0x00; // Ensure it's less than modulus

// Common RSA public exponent: 65537 (0x010001)
const exponent = new Uint8Array(3);
exponent[0] = 0x01;
exponent[1] = 0x00;
exponent[2] = 0x01;

// Simulate RSA modulus (public key)
const modulus = new Uint8Array(rsaSize);
crypto.getRandomValues(modulus);
modulus[0] |= 0x80; // Ensure high bit is set (full 2048 bits)

console.log('RSA-2048 parameters:');
console.log('  Signature size:', signature.length, 'bytes');
console.log('  Exponent:', '65537 (common RSA public exponent)');
console.log('  Modulus size:', modulus.length, 'bytes');

const rsaInput = createModExpInput(signature, exponent, modulus);
console.log('  Total input size:', rsaInput.length, 'bytes');

// Execute with sufficient gas
const rsaResult = execute(
	PrecompileAddress.MODEXP,
	rsaInput,
	1000000n,
	Hardfork.CANCUN,
);

if (rsaResult.success) {
	console.log('\nVerification result:');
	console.log('  Output size:', rsaResult.output.length, 'bytes');
	console.log('  Gas used:', rsaResult.gasUsed.toString());
	console.log('  Output (first 32 bytes):', '0x' + Buffer.from(rsaResult.output.slice(0, 32)).toString('hex'));
	console.log('\nNote: In real RSA, output would be compared to expected message hash');
}

// Example 2: Gas cost comparison - different RSA key sizes
console.log('\n=== Example 2: Gas Costs by RSA Key Size ===');

const rsaSizes = [
	{ bits: 1024, bytes: 128, desc: 'RSA-1024' },
	{ bits: 2048, bytes: 256, desc: 'RSA-2048' },
	{ bits: 4096, bytes: 512, desc: 'RSA-4096' },
];

for (const size of rsaSizes) {
	const sig = new Uint8Array(size.bytes);
	crypto.getRandomValues(sig);
	sig[0] = 0x00;

	const exp = new Uint8Array(3);
	exp[0] = 0x01;
	exp[1] = 0x00;
	exp[2] = 0x01;

	const mod = new Uint8Array(size.bytes);
	crypto.getRandomValues(mod);
	mod[0] |= 0x80;

	const input = createModExpInput(sig, exp, mod);
	const result = execute(
		PrecompileAddress.MODEXP,
		input,
		10000000n,
		Hardfork.CANCUN,
	);

	if (result.success) {
		console.log(`${size.desc} (${size.bits} bits):`);
		console.log(`  Gas used: ${result.gasUsed.toString()}`);
		console.log(`  Cost per bit: ~${(Number(result.gasUsed) / size.bits).toFixed(2)} gas`);
	}
}

// Example 3: Fermat primality test
console.log('\n=== Example 3: Fermat Primality Test ===');
// Fermat test: if p is prime and a < p, then a^(p-1) ≡ 1 (mod p)

const candidate = 97n; // Known prime
const base = 2n; // Test base
const exp = candidate - 1n; // p - 1

function bigIntToBytes(value: bigint): Uint8Array {
	if (value === 0n) return new Uint8Array([0]);
	const hex = value.toString(16);
	const padded = hex.length % 2 === 0 ? hex : '0' + hex;
	return new Uint8Array(padded.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
}

const fermatInput = createModExpInput(
	bigIntToBytes(base),
	bigIntToBytes(exp),
	bigIntToBytes(candidate)
);

console.log('Testing if 97 is prime using Fermat test:');
console.log(`  Computing: 2^96 mod 97 (should equal 1 if prime)`);

const fermatResult = execute(
	PrecompileAddress.MODEXP,
	fermatInput,
	100000n,
	Hardfork.CANCUN,
);

if (fermatResult.success) {
	const result = fermatResult.output[0];
	console.log('  Result:', result);
	console.log('  Is prime (Fermat test):', result === 1 ? '✓ Yes' : '✗ No');
	console.log('  Gas used:', fermatResult.gasUsed.toString());
}

// Example 4: Modular inverse using Fermat's Little Theorem
console.log('\n=== Example 4: Modular Inverse (Fermat) ===');
// For prime p: a^(-1) ≡ a^(p-2) (mod p)

const a = 3n;
const p = 7n; // Prime modulus
const invExp = p - 2n; // p - 2

const invInput = createModExpInput(
	bigIntToBytes(a),
	bigIntToBytes(invExp),
	bigIntToBytes(p)
);

console.log('Computing modular inverse of 3 mod 7:');
console.log(`  Computing: 3^5 mod 7`);

const invResult = execute(
	PrecompileAddress.MODEXP,
	invInput,
	100000n,
	Hardfork.CANCUN,
);

if (invResult.success) {
	const inverse = invResult.output[0];
	console.log('  Inverse:', inverse);
	// Verify: 3 * inverse ≡ 1 (mod 7)
	const verify = (3n * BigInt(inverse)) % 7n;
	console.log('  Verification (3 * inverse mod 7):', verify.toString());
	console.log('  Correct:', verify === 1n ? '✓ Yes' : '✗ No');
	console.log('  Gas used:', invResult.gasUsed.toString());
}

// Example 5: EIP-2565 gas reduction
console.log('\n=== Example 5: EIP-2565 Gas Reduction Benefits ===');
console.log('EIP-2565 (Berlin fork) reduced ModExp gas costs by ~83%');
console.log('\nEstimated costs for RSA-2048 verification:');
console.log('  Pre-Berlin (Byzantium): ~300,000 gas');
console.log('  Post-Berlin (Berlin+): ~50,000 gas');
console.log('  Reduction: 83%');
console.log('\nThis makes on-chain RSA verification practical for many use cases');

console.log('\n=== Summary ===');
console.log('RSA-2048 verification: ~50,000 gas (post-EIP-2565)');
console.log('RSA-4096 verification: ~200,000 gas (post-EIP-2565)');
console.log('Use cases:');
console.log('  - Verify RSA signatures on-chain');
console.log('  - Primality testing (Fermat, Miller-Rabin)');
console.log('  - Modular inverses for cryptography');
console.log('  - Zero-knowledge proof systems');
console.log('  - Diffie-Hellman key exchange verification');
