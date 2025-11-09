/**
 * EIP-191 Personal Message Signing
 *
 * Demonstrates:
 * - Personal message signing with EIP-191 prefix
 * - Preventing transaction signature reuse
 * - Recovering signer from personal_sign signature
 * - Wallet authentication pattern
 */

import * as Secp256k1 from '../../../src/crypto/Secp256k1/index.js';
import { keccak256 } from '../../../src/primitives/Hash/BrandedHash/keccak256.js';

// Helper: Derive Ethereum address from public key
function deriveAddress(publicKey: Uint8Array): string {
	const hash = keccak256(publicKey);
	const addressBytes = hash.slice(12);
	return '0x' + Buffer.from(addressBytes).toString('hex');
}

// EIP-191: Personal message signing
function personalSign(
	message: string,
	privateKey: Uint8Array
): { r: Uint8Array; s: Uint8Array; v: number } {
	// Add EIP-191 prefix to prevent transaction signing
	const prefix = `\x19Ethereum Signed Message:\n${message.length}`;
	const prefixedMessage = new TextEncoder().encode(prefix + message);

	// Hash the prefixed message
	const messageHash = keccak256(prefixedMessage);

	// Sign
	return Secp256k1.sign(messageHash, privateKey);
}

// Verify personal_sign signature
function personalVerify(
	message: string,
	signature: { r: Uint8Array; s: Uint8Array; v: number },
	expectedAddress: string
): boolean {
	// Reconstruct the EIP-191 hash
	const prefix = `\x19Ethereum Signed Message:\n${message.length}`;
	const prefixedMessage = new TextEncoder().encode(prefix + message);
	const messageHash = keccak256(prefixedMessage);

	// Recover signer's public key
	const publicKey = Secp256k1.recoverPublicKey(signature, messageHash);
	const signerAddress = deriveAddress(publicKey);

	// Compare addresses (case-insensitive)
	return signerAddress.toLowerCase() === expectedAddress.toLowerCase();
}

console.log('=== EIP-191 Personal Message Signing ===\n');

// Generate keypair
const privateKey = new Uint8Array(32);
crypto.getRandomValues(privateKey);
const publicKey = Secp256k1.derivePublicKey(privateKey);
const signerAddress = deriveAddress(publicKey);

console.log('Signer address:', signerAddress);

// Sign a personal message
const message = 'I agree to the terms of service';
console.log('\nMessage:', message);

const signature = personalSign(message, privateKey);
console.log('\nSignature:');
console.log('  r:', Buffer.from(signature.r).toString('hex').slice(0, 16) + '...');
console.log('  s:', Buffer.from(signature.s).toString('hex').slice(0, 16) + '...');
console.log('  v:', signature.v);

// Verify signature
const isValid = personalVerify(message, signature, signerAddress);
console.log('\nSignature verification:', isValid ? '✓ Valid' : '✗ Invalid');

// Test with wrong address
const wrongAddress = '0x0000000000000000000000000000000000000000';
const invalidVerification = personalVerify(message, signature, wrongAddress);
console.log('Wrong address verification:', invalidVerification ? '✓ Valid' : '✗ Invalid (expected)');

// Demonstrate prefix importance
console.log('\n=== EIP-191 Prefix Importance ===\n');

// Without prefix (vulnerable to transaction replay)
const unprefixedBytes = new TextEncoder().encode(message);
const unprefixedHash = keccak256(unprefixedBytes);
const unprefixedSig = Secp256k1.sign(unprefixedHash, privateKey);

// With prefix (safe)
const prefixedSig = personalSign(message, privateKey);

const signaturesMatch =
	unprefixedSig.r.every((byte, i) => byte === prefixedSig.r[i]) &&
	unprefixedSig.s.every((byte, i) => byte === prefixedSig.s[i]);

console.log('Signatures differ (prefix protection):', !signaturesMatch ? '✓ Yes' : '✗ No');

// Wallet authentication example
console.log('\n=== Wallet Authentication Example ===\n');

const nonce = Math.floor(Math.random() * 1000000);
const authMessage = `Sign this message to authenticate.\nNonce: ${nonce}`;
console.log('Challenge:', authMessage);

const authSignature = personalSign(authMessage, privateKey);
const authenticated = personalVerify(authMessage, authSignature, signerAddress);

console.log('Authentication:', authenticated ? '✓ Success' : '✗ Failed');
console.log('Authenticated as:', signerAddress);
