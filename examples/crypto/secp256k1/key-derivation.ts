/**
 * Key derivation and address generation
 *
 * Demonstrates:
 * - Secure private key generation
 * - Public key derivation from private key
 * - Ethereum address derivation from public key
 * - Key validation
 * - One-way nature of derivation
 */

import * as Secp256k1 from '../../../src/crypto/Secp256k1/index.js';
import { keccak256 } from '../../../src/primitives/Hash/BrandedHash/keccak256.js';

console.log('=== Key Derivation and Address Generation ===\n');

// 1. Generate secure random private key
console.log('1. Private Key Generation');
const privateKey = new Uint8Array(32);
crypto.getRandomValues(privateKey); // Cryptographically secure random

console.log('   Private key (32 bytes):', Buffer.from(privateKey).toString('hex'));

// Validate private key
const isValidPrivate = Secp256k1.isValidPrivateKey(privateKey);
console.log('   Valid private key:', isValidPrivate ? '✓ Yes' : '✗ No');

// 2. Derive public key from private key
console.log('\n2. Public Key Derivation');
const publicKey = Secp256k1.derivePublicKey(privateKey);

console.log('   Public key (64 bytes):');
console.log('     x:', Buffer.from(publicKey.slice(0, 32)).toString('hex'));
console.log('     y:', Buffer.from(publicKey.slice(32, 64)).toString('hex'));

// Validate public key
const isValidPublic = Secp256k1.isValidPublicKey(publicKey);
console.log('   Point on curve:', isValidPublic ? '✓ Yes' : '✗ No');

// 3. Derive Ethereum address from public key
console.log('\n3. Address Derivation');

// Hash public key with Keccak256
const publicKeyHash = keccak256(publicKey);
console.log('   Keccak256(publicKey):', Buffer.from(publicKeyHash).toString('hex'));

// Take last 20 bytes as address
const addressBytes = publicKeyHash.slice(12);
const addressHex = '0x' + Buffer.from(addressBytes).toString('hex');

console.log('   Ethereum address:', addressHex);

// 4. Demonstrate deterministic derivation
console.log('\n4. Deterministic Derivation');
const publicKey2 = Secp256k1.derivePublicKey(privateKey);
const keysMatch = publicKey.every((byte, i) => byte === publicKey2[i]);
console.log('   Same private key → same public key:', keysMatch ? '✓ Yes' : '✗ No');

// 5. Test edge cases
console.log('\n5. Edge Cases');

// Minimum valid private key (1)
const minKey = new Uint8Array(32);
minKey[31] = 1;
const minKeyValid = Secp256k1.isValidPrivateKey(minKey);
console.log('   Private key = 1:', minKeyValid ? '✓ Valid' : '✗ Invalid');

// Zero private key (invalid)
const zeroKey = new Uint8Array(32);
const zeroKeyValid = Secp256k1.isValidPrivateKey(zeroKey);
console.log('   Private key = 0:', zeroKeyValid ? '✓ Valid' : '✗ Invalid (expected)');

// Short key (invalid)
const shortKey = new Uint8Array(16);
const shortKeyValid = Secp256k1.isValidPrivateKey(shortKey);
console.log('   Private key (16 bytes):', shortKeyValid ? '✓ Valid' : '✗ Invalid (expected)');

// 6. Security demonstration
console.log('\n6. One-Way Function Property');
console.log('   Private key → Public key: ✓ Easy (elliptic curve multiplication)');
console.log('   Public key → Private key: ✗ Infeasible (discrete log problem)');

// Multiple key generation
console.log('\n7. Multiple Account Generation');
for (let i = 0; i < 3; i++) {
	const pk = new Uint8Array(32);
	crypto.getRandomValues(pk);
	const pubKey = Secp256k1.derivePublicKey(pk);
	const hash = keccak256(pubKey);
	const addr = '0x' + Buffer.from(hash.slice(12)).toString('hex');
	console.log(`   Account ${i + 1}:`, addr);
}

// 8. Generator point (private key = 1)
console.log('\n8. Generator Point G (private key = 1)');
const privateKeyOne = new Uint8Array(32);
privateKeyOne[31] = 1;
const generatorPoint = Secp256k1.derivePublicKey(privateKeyOne);

// Expected generator point coordinates
const expectedGx = BigInt(
	'0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798'
);
const expectedGy = BigInt(
	'0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8'
);

const actualGx = BigInt('0x' + Buffer.from(generatorPoint.slice(0, 32)).toString('hex'));
const actualGy = BigInt('0x' + Buffer.from(generatorPoint.slice(32, 64)).toString('hex'));

console.log('   Expected Gx:', expectedGx.toString(16));
console.log('   Actual Gx:  ', actualGx.toString(16));
console.log('   Match:', actualGx === expectedGx ? '✓ Yes' : '✗ No');
