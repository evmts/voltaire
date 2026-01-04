// @ts-nocheck
import { pbkdf2 } from "@noble/hashes/pbkdf2.js";
import { scrypt } from "@noble/hashes/scrypt.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { InvalidPbkdf2IterationsError, InvalidScryptNError } from "./errors.js";

/**
 * Check if a number is a power of 2
 *
 * @param {number} n - Number to check
 * @returns {boolean} True if n is a power of 2
 */
export function isPowerOfTwo(n) {
	return Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0;
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
 */
export function derivePbkdf2(password, salt, c = 262144, dklen = 32) {
	if (!isValidIterationCount(c)) {
		throw new InvalidPbkdf2IterationsError(c);
	}

	const passwordBytes =
		typeof password === "string"
			? new TextEncoder().encode(password)
			: password;

	return pbkdf2(sha256, passwordBytes, salt, { c, dkLen: dklen });
}
