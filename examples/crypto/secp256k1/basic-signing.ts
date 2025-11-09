/**
 * Basic secp256k1 signing and verification
 *
 * Demonstrates:
 * - Signing a message hash with a private key
 * - Deriving public key from private key
 * - Verifying signature with public key
 * - RFC 6979 deterministic signatures
 */

import * as Secp256k1 from '../../../src/crypto/Secp256k1/index.js';
import { keccak256 } from '../../../src/primitives/Hash/BrandedHash/keccak256.js';

// Generate random private key (in production, use secure key management)
const privateKey = new Uint8Array(32);
crypto.getRandomValues(privateKey);

// Create message hash
const message = 'Hello, Ethereum!';
const messageBytes = new TextEncoder().encode(message);
const messageHash = keccak256(messageBytes);

console.log('=== Basic Secp256k1 Signing ===\n');
console.log('Message:', message);
console.log('Message hash:', Buffer.from(messageHash).toString('hex'));

// Sign the message hash
const signature = Secp256k1.sign(messageHash, privateKey);
console.log('\nSignature components:');
console.log('  r:', Buffer.from(signature.r).toString('hex'));
console.log('  s:', Buffer.from(signature.s).toString('hex'));
console.log('  v:', signature.v);

// Derive public key from private key
const publicKey = Secp256k1.derivePublicKey(privateKey);
console.log('\nPublic key (64 bytes):');
console.log('  x:', Buffer.from(publicKey.slice(0, 32)).toString('hex'));
console.log('  y:', Buffer.from(publicKey.slice(32, 64)).toString('hex'));

// Verify signature
const isValid = Secp256k1.verify(signature, messageHash, publicKey);
console.log('\nSignature verification:', isValid ? '✓ Valid' : '✗ Invalid');

// Test with wrong public key
const wrongKey = new Uint8Array(64);
crypto.getRandomValues(wrongKey);
const invalidVerification = Secp256k1.verify(signature, messageHash, wrongKey);
console.log('Wrong key verification:', invalidVerification ? '✓ Valid' : '✗ Invalid (expected)');

// Demonstrate deterministic signatures (RFC 6979)
console.log('\n=== Deterministic Signatures ===\n');
const sig1 = Secp256k1.sign(messageHash, privateKey);
const sig2 = Secp256k1.sign(messageHash, privateKey);

const isDeterministic = sig1.r.every((byte, i) => byte === sig2.r[i]) &&
                       sig1.s.every((byte, i) => byte === sig2.s[i]) &&
                       sig1.v === sig2.v;

console.log('Same message + key produces identical signature:', isDeterministic ? '✓ Yes' : '✗ No');
