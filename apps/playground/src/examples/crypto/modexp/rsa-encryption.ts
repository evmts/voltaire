/**
 * RSA Encryption with ModExp
 *
 * RSA is a public-key cryptosystem where modular exponentiation is
 * the core operation for both encryption and decryption.
 *
 * - Public key: (n, e) where n = p*q, e is public exponent
 * - Private key: (n, d) where d is the modular inverse of e
 * - Encrypt: ciphertext = message^e mod n
 * - Decrypt: message = ciphertext^d mod n
 *
 * WARNING: This is for educational purposes only. Real RSA requires:
 * - Large primes (2048+ bits)
 * - Proper padding (OAEP, PKCS#1)
 * - Side-channel resistance
 */

import { ModExp } from "@tevm/voltaire";

// === Toy RSA Example ===
// Small primes for demonstration (NEVER use in production!)
const p = 61n;
const q = 53n;
const n = p * q; // 3233 - the modulus
const phi = (p - 1n) * (q - 1n); // 3120 - Euler's totient

// Common public exponent (Fermat prime)
const e = 17n;

// Private exponent: d such that e*d ≡ 1 (mod phi)
// Extended Euclidean algorithm gives d = 2753
const d = 2753n;

// Encrypt a message
const message = 42n;

const ciphertext = ModExp.modexp(message, e, n);

// Decrypt the ciphertext
const decrypted = ModExp.modexp(ciphertext, d, n);

// Sign: signature = hash^d mod n (using private key)
const messageHash = 123n; // Pretend this is a hash of a message
const signature = ModExp.modexp(messageHash, d, n);

// Verify: hash = signature^e mod n (using public key)
const verified = ModExp.modexp(signature, e, n);

// Pre-computed 256-bit primes (for demo only)
const p512 =
	0xd4bcd52406f2244ba94de5a51d19a9c27e8f3aa42d31e38f59e6c8a8d1c3b2a7n;
const q512 =
	0xc7f9d8e6b5a4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8n;
const n512 = p512 * q512;
const phi512 = (p512 - 1n) * (q512 - 1n);
const e512 = 65537n; // Common RSA exponent (2^16 + 1)

// Compute modular inverse using extended Euclidean algorithm
function modInverse(a: bigint, m: bigint): bigint {
	let [old_r, r] = [a, m];
	let [old_s, s] = [1n, 0n];

	while (r !== 0n) {
		const q = old_r / r;
		[old_r, r] = [r, old_r - q * r];
		[old_s, s] = [s, old_s - q * s];
	}

	return old_s < 0n ? old_s + m : old_s;
}

const d512 = modInverse(e512, phi512);

const msg512 = 0xdeadbeefcafebabe1234567890abcdefn;
const cipher512 = ModExp.modexp(msg512, e512, n512);
const plain512 = ModExp.modexp(cipher512, d512, n512);

// Encrypting multiple values with same keys
const blocks = [10n, 20n, 30n, 40n, 50n];

const encrypted = blocks.map((block) => ModExp.modexp(block, e, n));

const decryptedBlocks = encrypted.map((block) => ModExp.modexp(block, d, n));

const allMatch = blocks.every((b, i) => b === decryptedBlocks[i]);

const dp = d % (p - 1n);
const dq = d % (q - 1n);
const qinv = modInverse(q, p);

// CRT decryption
const m1 = ModExp.modexp(ciphertext, dp, p);
const m2 = ModExp.modexp(ciphertext, dq, q);
const h = (qinv * ((m1 - m2 + p) % p)) % p;
const crtDecrypted = m2 + h * q;
