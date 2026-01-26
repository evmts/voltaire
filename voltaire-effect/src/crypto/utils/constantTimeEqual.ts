/**
 * @fileoverview Constant-time comparison utility for cryptographic operations.
 * @module utils/constantTimeEqual
 * @since 0.0.1
 */

/**
 * Compares two Uint8Arrays in constant time to prevent timing attacks.
 *
 * This function always takes the same amount of time regardless of where
 * the arrays differ. Use this for security-sensitive comparisons like:
 * - Comparing public keys
 * - Comparing signatures
 * - Comparing MACs/HMACs
 *
 * @param a - First array
 * @param b - Second array
 * @returns true if arrays are equal
 *
 * @example
 * ```typescript
 * import { constantTimeEqual } from 'voltaire-effect/crypto/utils/constantTimeEqual'
 *
 * const isValid = constantTimeEqual(computedMac, expectedMac)
 * ```
 *
 * @since 0.0.1
 */
export const constantTimeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a[i]! ^ b[i]!;
	}
	return result === 0;
};
