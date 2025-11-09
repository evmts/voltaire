/**
 * ECRECOVER Signature Verification Example
 *
 * Demonstrates real-world signature verification patterns:
 * - Verifying signed messages (EIP-191 style)
 * - Checking multiple signatures efficiently
 * - Gas cost analysis for batch verification
 * - Handling signature malleability (EIP-2)
 */

import { execute, PrecompileAddress } from '../../../src/precompiles/precompiles.js';
import * as Hardfork from '../../../src/primitives/Hardfork/index.js';
import * as Secp256k1 from '../../../src/crypto/Secp256k1/index.js';
import { keccak256 } from '../../../src/primitives/Hash/BrandedHash/keccak256.js';

console.log('=== ECRECOVER Signature Verification ===\n');

// Simulate a signed message scenario
const signerKey = new Uint8Array(32);
crypto.getRandomValues(signerKey);
const signerPubKey = Secp256k1.derivePublicKey(signerKey);
const signerAddress = keccak256(signerPubKey).slice(12);

console.log('Signer address:', '0x' + Buffer.from(signerAddress).toString('hex'));

// Example 1: Verify a signed authentication message
console.log('\n=== Example 1: Authentication Message ===');
const authMessage = 'I authorize this action at timestamp 1234567890';
const authHash = keccak256(new TextEncoder().encode(authMessage));
const authSig = Secp256k1.sign(authHash, signerKey);

// Prepare ECRECOVER input
const authInput = new Uint8Array(128);
authInput.set(authHash, 0);
authInput[63] = authSig.v;
authInput.set(authSig.r, 64);
authInput.set(authSig.s, 96);

const authResult = execute(
	PrecompileAddress.ECRECOVER,
	authInput,
	10000n,
	Hardfork.CANCUN,
);

if (authResult.success) {
	const recoveredAddr = authResult.output.slice(12, 32);
	const isValid = recoveredAddr.every((byte, i) => byte === signerAddress[i]);
	console.log('Message:', authMessage);
	console.log('Signature valid:', isValid ? '✓ Yes' : '✗ No');
	console.log('Gas used:', authResult.gasUsed.toString());
}

// Example 2: Batch signature verification
console.log('\n=== Example 2: Batch Verification ===');
const messages = [
	'Transfer 100 tokens to Alice',
	'Transfer 50 tokens to Bob',
	'Update contract state',
];

let totalGas = 0n;
let validCount = 0;

for (const msg of messages) {
	const msgHash = keccak256(new TextEncoder().encode(msg));
	const sig = Secp256k1.sign(msgHash, signerKey);

	const input = new Uint8Array(128);
	input.set(msgHash, 0);
	input[63] = sig.v;
	input.set(sig.r, 64);
	input.set(sig.s, 96);

	const result = execute(
		PrecompileAddress.ECRECOVER,
		input,
		10000n,
		Hardfork.CANCUN,
	);

	if (result.success) {
		const recoveredAddr = result.output.slice(12, 32);
		const isValid = recoveredAddr.every((byte, i) => byte === signerAddress[i]);
		if (isValid) validCount++;
		totalGas += result.gasUsed;
	}
}

console.log('Total messages:', messages.length);
console.log('Valid signatures:', validCount);
console.log('Total gas:', totalGas.toString(), '(3000 per signature)');
console.log('Average gas:', (totalGas / BigInt(messages.length)).toString());

// Example 3: EIP-2 Signature Malleability Protection
console.log('\n=== Example 3: EIP-2 Malleability Protection ===');

// Create a signature with s in the lower half (valid)
const testMessage = keccak256(new TextEncoder().encode('Test message'));
const validSig = Secp256k1.sign(testMessage, signerKey);

// secp256k1 curve order: n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
const secp256k1_n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
const secp256k1_n_half = secp256k1_n / 2n;

// Check s value
const s_value = Buffer.from(validSig.s).reduce((acc, byte, i) => acc + (BigInt(byte) << BigInt(8 * (31 - i))), 0n);
console.log('s value ≤ n/2:', s_value <= secp256k1_n_half ? '✓ Yes (EIP-2 compliant)' : '✗ No');

// Try with valid signature
const validInput = new Uint8Array(128);
validInput.set(testMessage, 0);
validInput[63] = validSig.v;
validInput.set(validSig.r, 64);
validInput.set(validSig.s, 96);

const validResult = execute(
	PrecompileAddress.ECRECOVER,
	validInput,
	10000n,
	Hardfork.CANCUN,
);

const validRecovered = validResult.output.slice(12, 32);
const validMatch = validRecovered.every((byte, i) => byte === signerAddress[i]);
console.log('Valid s value accepted:', validMatch ? '✓ Yes' : '✗ No');

// Example 4: Wrong signer detection
console.log('\n=== Example 4: Wrong Signer Detection ===');

// Create a different signer
const wrongKey = new Uint8Array(32);
crypto.getRandomValues(wrongKey);
const wrongPubKey = Secp256k1.derivePublicKey(wrongKey);
const wrongAddress = keccak256(wrongPubKey).slice(12);

// Sign message with wrong key
const wrongSig = Secp256k1.sign(testMessage, wrongKey);

const wrongInput = new Uint8Array(128);
wrongInput.set(testMessage, 0);
wrongInput[63] = wrongSig.v;
wrongInput.set(wrongSig.r, 64);
wrongInput.set(wrongSig.s, 96);

const wrongResult = execute(
	PrecompileAddress.ECRECOVER,
	wrongInput,
	10000n,
	Hardfork.CANCUN,
);

const wrongRecovered = wrongResult.output.slice(12, 32);
const wrongMatch = wrongRecovered.every((byte, i) => byte === signerAddress[i]);
console.log('Expected signer:', '0x' + Buffer.from(signerAddress).toString('hex'));
console.log('Recovered signer:', '0x' + Buffer.from(wrongRecovered).toString('hex'));
console.log('Signature from expected signer:', wrongMatch ? '✓ Yes' : '✗ No (correct)');

console.log('\n=== Gas Cost Summary ===');
console.log('Per signature: 3000 gas (fixed cost)');
console.log('Batch of 10 signatures: 30,000 gas');
console.log('Batch of 100 signatures: 300,000 gas');
console.log('Note: Cost is constant regardless of signature validity');
