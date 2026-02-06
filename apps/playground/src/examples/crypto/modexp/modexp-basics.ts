/**
 * ModExp Basics - Modular Exponentiation Overview
 *
 * Modular exponentiation computes: base^exponent mod modulus
 * This is fundamental to many cryptographic operations including RSA,
 * Diffie-Hellman, and digital signatures.
 *
 * Ethereum's MODEXP precompile (0x05) implements this per EIP-198/EIP-2565.
 */

import { ModExp } from "@tevm/voltaire";

// === Simple Examples ===

// 2^10 mod 1000 = 1024 mod 1000 = 24
const simple = ModExp.modexp(2n, 10n, 1000n);

// 3^5 mod 7 = 243 mod 7 = 5
const small = ModExp.modexp(3n, 5n, 7n);

// 7^256 mod 13 - large exponent, small result
const largeExp = ModExp.modexp(7n, 256n, 13n);

// Any number^0 mod m = 1 (when m > 1)
const expZero = ModExp.modexp(5n, 0n, 17n);

// 0^n mod m = 0 (when n > 0)
const baseZero = ModExp.modexp(0n, 5n, 17n);

// Any base mod 1 = 0
const modOne = ModExp.modexp(12345n, 67890n, 1n);

// 256-bit numbers (common in cryptography)
const base256 =
	0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefn;
const exp256 =
	0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210n;
const mod256 =
	0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn; // secp256k1 prime

const result256 = ModExp.modexp(base256, exp256, mod256);

// 512-bit computation
const base512 =
	0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefn;
const mod512 =
	0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;

const result512 = ModExp.modexp(base512, 65537n, mod512);

const a = 7n;
const b = 11n;
const m = 13n;

// (a * b) mod m = ((a mod m) * (b mod m)) mod m
const product = ModExp.modexp(a * b, 1n, m);
const productMod = (ModExp.modexp(a, 1n, m) * ModExp.modexp(b, 1n, m)) % m;

// a^(x+y) mod m = (a^x mod m * a^y mod m) mod m
const x = 5n;
const y = 3n;
const sumExp = ModExp.modexp(a, x + y, m);
const productExp = (ModExp.modexp(a, x, m) * ModExp.modexp(a, y, m)) % m;

// (a^x)^y mod m = a^(x*y) mod m
const nested = ModExp.modexp(ModExp.modexp(a, x, m), y, m);
const combined = ModExp.modexp(a, x * y, m);

// Quick benchmark
const start = performance.now();
const iterations = 1000;
for (let i = 0; i < iterations; i++) {
	ModExp.modexp(base256, 65537n, mod256);
}
const elapsed = performance.now() - start;
