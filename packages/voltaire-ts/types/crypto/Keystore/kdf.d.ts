/**
 * Check if a number is a power of 2
 *
 * @param {number} n - Number to check
 * @returns {boolean} True if n is a power of 2
 */
export function isPowerOfTwo(n: number): boolean;
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
export function deriveScrypt(password: string | Uint8Array, salt: Uint8Array, n?: number, r?: number, p?: number, dklen?: number): Uint8Array;
/**
 * Check if a number is a valid PBKDF2 iteration count
 *
 * @param {number} c - Iteration count to check
 * @returns {boolean} True if c is a valid positive integer
 */
export function isValidIterationCount(c: number): boolean;
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
export function derivePbkdf2(password: string | Uint8Array, salt: Uint8Array, c?: number, dklen?: number): Uint8Array;
//# sourceMappingURL=kdf.d.ts.map