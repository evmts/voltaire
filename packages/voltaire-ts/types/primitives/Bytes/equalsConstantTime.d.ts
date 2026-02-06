/**
 * Constant-time comparison of two Bytes arrays.
 *
 * This function is resistant to timing attacks - it always takes the same
 * amount of time regardless of where the arrays differ. Use this for
 * security-sensitive comparisons like:
 * - Comparing cryptographic hashes
 * - Comparing MACs/signatures
 * - Comparing passwords or tokens
 *
 * For non-security contexts where performance matters, use `equals()` instead.
 *
 * @param {Uint8Array} a - First Bytes array
 * @param {Uint8Array} b - Second Bytes array
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * import { equalsConstantTime } from './primitives/Bytes/index.js';
 *
 * // Use for cryptographic comparisons
 * const isValid = equalsConstantTime(computedHash, expectedHash);
 * ```
 */
export function equalsConstantTime(a: Uint8Array, b: Uint8Array): boolean;
//# sourceMappingURL=equalsConstantTime.d.ts.map