import { Hex, ModExp } from "@tevm/voltaire";

// ModExp - Modular Exponentiation (EIP-198/2565 precompile)

// === Basic Modular Exponentiation ===
// Compute: base^exp mod modulus

// Simple example: 2^10 mod 1000 = 24
const result1 = ModExp.modexp(2n, 10n, 1000n);

// Larger numbers: 3^100 mod 7919 (7919 is prime)
const result2 = ModExp.modexp(3n, 100n, 7919n);

// === RSA-style Operations ===
// RSA uses modexp for both encryption and decryption
// Public key: (e, n), Private key: (d, n)
// Encrypt: c = m^e mod n
// Decrypt: m = c^d mod n

// Small RSA example (DO NOT use small primes in production!)
const p = 61n;
const q = 53n;
const n = p * q; // 3233
const e = 17n; // Public exponent
const d = 2753n; // Private exponent (e*d ≡ 1 mod φ(n))

const message = 123n;
const encrypted = ModExp.modexp(message, e, n);

const decrypted = ModExp.modexp(encrypted, d, n);

// === Byte Array Interface ===
// EIP-198 format uses byte arrays
const base = new Uint8Array([0x02]); // 2
const exp = new Uint8Array([0x0a]); // 10
const mod = new Uint8Array([0x03, 0xe8]); // 1000

const bytesResult = ModExp.modexpBytes(base, exp, mod);

// === Gas Calculation (EIP-2565) ===
// Gas cost depends on operand sizes
const baseLen = 1n;
const expLen = 1n;
const modLen = 2n;
const expHighBits = 10n;

const gasCost = ModExp.calculateGas(baseLen, expLen, modLen, expHighBits);

// Larger operands cost more gas
const largeGas = ModExp.calculateGas(32n, 32n, 32n, 256n);

// === Diffie-Hellman Key Exchange ===
// ModExp is used in classic DH (not elliptic curve)
const dhP = 23n; // Prime modulus (use much larger in production!)
const dhG = 5n; // Generator

// Alice generates private/public key
const alicePrivate = 6n;
const alicePublic = ModExp.modexp(dhG, alicePrivate, dhP);

// Bob generates private/public key
const bobPrivate = 15n;
const bobPublic = ModExp.modexp(dhG, bobPrivate, dhP);

// Shared secret
const aliceShared = ModExp.modexp(bobPublic, alicePrivate, dhP);
const bobShared = ModExp.modexp(alicePublic, bobPrivate, dhP);

// === Fermat Primality Test ===
// If p is prime and a is not divisible by p, then a^(p-1) ≡ 1 (mod p)
function isProbablyPrime(n: bigint, witness: bigint): boolean {
	if (n < 2n) return false;
	if (n === 2n) return true;
	return ModExp.modexp(witness, n - 1n, n) === 1n;
}
