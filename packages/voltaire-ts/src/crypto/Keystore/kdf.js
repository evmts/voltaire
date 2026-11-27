import { pbkdf2 } from "@noble/hashes/pbkdf2.js";
import { scrypt } from "@noble/hashes/scrypt.js";
import { sha256 } from "@noble/hashes/sha2.js";
import {
	InvalidPbkdf2IterationsError,
	InvalidScryptNError,
	KeystoreError,
} from "./errors.js";

const MAX_SCRYPT_N = 1 << 20;
const MAX_SCRYPT_R = 16;
const MAX_SCRYPT_P = 16;
const MAX_PBKDF2_ITERATIONS = 10_000_000;

/**
 * Largest derived key length accepted, in bytes. Keystore v3 uses 32. PBKDF2
 * work grows with dklen (one full iteration chain per 32 output bytes), so
 * an unbounded dklen from an untrusted keystore is unbounded work.
 */
export const MAX_DKLEN = 128;

/**
 * @param {number} dklen
 * @throws {KeystoreError} If dklen is not an integer in [1, MAX_DKLEN]
 */
function assertDklen(dklen) {
	if (!Number.isInteger(dklen) || dklen < 1 || dklen > MAX_DKLEN) {
		throw new KeystoreError(
			`dklen must be an integer between 1 and ${MAX_DKLEN}, got ${dklen}`,
		);
	}
}

/**
 * Check if a number is a power of 2
 *
 * @param {number} n - Number to check
 * @returns {boolean} True if n is a power of 2
 */
export function isPowerOfTwo(n) {
	if (!Number.isSafeInteger(n) || n <= 0) return false;
	const value = BigInt(n);
	return (value & (value - 1n)) === 0n;
}

/**
 * Derive key using scrypt KDF
 *
 * @param {string | Uint8Array} password - Password
 * @param {Uint8Array} salt - Salt (32 bytes recommended)
 * @param {number} n - CPU/memory cost parameter (default: 262144). Must be a power of 2.
 * @param {number} r - Block size parameter (default: 8)
 * @param {number} p - Parallelization parameter (default: 1)
 * @param {number} dklen - Derived key length (default: 32)
 * @returns {Uint8Array} Derived key
 * @throws {InvalidScryptNError} If n is not a power of 2
 * @throws {KeystoreError} If n, r, p, or dklen is outside its allowed range
 */
export function deriveScrypt(
	password,
	salt,
	n = 262144,
	r = 8,
	p = 1,
	dklen = 32,
) {
	if (!isPowerOfTwo(n)) {
		throw new InvalidScryptNError(n);
	}
	if (n < 2 || n > MAX_SCRYPT_N) {
		throw new KeystoreError(
			`scrypt N must be between 2 and ${MAX_SCRYPT_N}, got ${n}`,
		);
	}
	if (!Number.isInteger(r) || r < 1 || r > MAX_SCRYPT_R) {
		throw new KeystoreError(
			`scrypt r must be an integer between 1 and ${MAX_SCRYPT_R}, got ${r}`,
		);
	}
	if (!Number.isInteger(p) || p < 1 || p > MAX_SCRYPT_P) {
		throw new KeystoreError(
			`scrypt p must be an integer between 1 and ${MAX_SCRYPT_P}, got ${p}`,
		);
	}
	assertDklen(dklen);

	const passwordBytes =
		typeof password === "string"
			? new TextEncoder().encode(password)
			: password;

	return scrypt(passwordBytes, salt, { N: n, r, p, dkLen: dklen });
}

/**
 * Check if a number is a valid PBKDF2 iteration count
 *
 * @param {number} c - Iteration count to check
 * @returns {boolean} True if c is a valid positive integer
 */
export function isValidIterationCount(c) {
	return Number.isInteger(c) && c >= 1;
}

/**
 * Derive key using PBKDF2-HMAC-SHA256
 *
 * @param {string | Uint8Array} password - Password
 * @param {Uint8Array} salt - Salt (32 bytes recommended)
 * @param {number} c - Iteration count (default: 262144)
 * @param {number} dklen - Derived key length (default: 32)
 * @returns {Uint8Array} Derived key
 * @throws {InvalidPbkdf2IterationsError} If c is not a positive integer
 * @throws {KeystoreError} If c exceeds the allowed maximum or dklen is outside its allowed range
 */
export function derivePbkdf2(password, salt, c = 262144, dklen = 32) {
	if (!isValidIterationCount(c)) {
		throw new InvalidPbkdf2IterationsError(c);
	}
	if (c > MAX_PBKDF2_ITERATIONS) {
		throw new KeystoreError(
			`PBKDF2 iterations must be at most ${MAX_PBKDF2_ITERATIONS}, got ${c}`,
		);
	}
	assertDklen(dklen);

	const passwordBytes =
		typeof password === "string"
			? new TextEncoder().encode(password)
			: password;

	return pbkdf2(sha256, passwordBytes, salt, { c, dkLen: dklen });
}
