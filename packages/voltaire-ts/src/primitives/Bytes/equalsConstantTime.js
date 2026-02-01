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
export function equalsConstantTime(a, b) {
	// Length comparison is inherently timing-safe for fixed-size types.
	// For variable-length inputs, the length itself may leak information,
	// but this is unavoidable without padding. Document this limitation.
	if (a.length !== b.length) {
		return false;
	}

	// XOR all bytes and accumulate - no early exit
	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= /** @type {number} */ (a[i]) ^ /** @type {number} */ (b[i]);
	}

	return result === 0;
}
