import { Hex, ModExp } from "@tevm/voltaire";

// ModExp - Modular Exponentiation (EIP-198/2565 precompile)

// === Basic Modular Exponentiation ===
// Compute: base^exp mod modulus

// Simple example: 2^10 mod 1000 = 24
const result1 = ModExp.modexp(2n, 10n, 1000n);
console.log("2^10 mod 1000 =", result1.toString());

// Larger numbers: 3^100 mod 7919 (7919 is prime)
const result2 = ModExp.modexp(3n, 100n, 7919n);
console.log("3^100 mod 7919 =", result2.toString());

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
console.log("\nRSA encryption:");
console.log("  Original:", message.toString());
console.log("  Encrypted:", encrypted.toString());

const decrypted = ModExp.modexp(encrypted, d, n);
console.log("  Decrypted:", decrypted.toString());
console.log("  Match:", message === decrypted);

// === Byte Array Interface ===
// EIP-198 format uses byte arrays
const base = new Uint8Array([0x02]); // 2
const exp = new Uint8Array([0x0a]); // 10
const mod = new Uint8Array([0x03, 0xe8]); // 1000

const bytesResult = ModExp.modexpBytes(base, exp, mod);
console.log("\nByte array result:", Hex.fromBytes(bytesResult));

// === Gas Calculation (EIP-2565) ===
// Gas cost depends on operand sizes
const baseLen = 1n;
const expLen = 1n;
const modLen = 2n;
const expHighBits = 10n;

const gasCost = ModExp.calculateGas(baseLen, expLen, modLen, expHighBits);
console.log("\nGas cost for small modexp:", gasCost.toString());

// Larger operands cost more gas
const largeGas = ModExp.calculateGas(32n, 32n, 32n, 256n);
console.log("Gas cost for 256-bit modexp:", largeGas.toString());

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

console.log("\nDiffie-Hellman:");
console.log("  Alice public:", alicePublic.toString());
console.log("  Bob public:", bobPublic.toString());
console.log("  Alice shared:", aliceShared.toString());
console.log("  Bob shared:", bobShared.toString());
console.log("  Secrets match:", aliceShared === bobShared);

// === Fermat Primality Test ===
// If p is prime and a is not divisible by p, then a^(p-1) ≡ 1 (mod p)
function isProbablyPrime(n: bigint, witness: bigint): boolean {
	if (n < 2n) return false;
	if (n === 2n) return true;
	return ModExp.modexp(witness, n - 1n, n) === 1n;
}

console.log("\nFermat primality test:");
console.log("  7919 is prime (witness 2):", isProbablyPrime(7919n, 2n));
console.log("  7920 is prime (witness 2):", isProbablyPrime(7920n, 2n));
