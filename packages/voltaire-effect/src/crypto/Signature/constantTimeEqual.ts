/**
 * @fileoverview Constant-time comparison utility for cryptographic operations.
 * @module Signature/constantTimeEqual
 * @since 0.0.1
 */

/**
 * Performs constant-time comparison of two Uint8Arrays.
 *
 * @description
 * This function is resistant to timing attacks - it always takes the same
 * amount of time regardless of where the arrays differ. Use this for
 * security-sensitive comparisons like:
 * - Comparing cryptographic hashes
 * - Comparing MACs/signatures
 * - Comparing addresses for verification
 *
 * The implementation:
 * 1. Returns false immediately if lengths differ (length is public information)
 * 2. XORs all bytes and accumulates - no early exit on mismatch
 * 3. Returns true only if all bytes match (XOR result is 0)
 *
 * @param a - First Uint8Array
 * @param b - Second Uint8Array
 * @returns true if arrays are equal, false otherwise
 *
 * @example
 * ```typescript
 * import { constantTimeEqual } from 'voltaire-effect/crypto/Signature'
 *
 * // Use for cryptographic comparisons
 * const isValid = constantTimeEqual(computedHash, expectedHash)
 * const addressMatch = constantTimeEqual(recoveredAddr, expectedAddr)
 * ```
 *
 * @since 0.0.1
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
	// Length comparison is inherently timing-safe for fixed-size types.
	// For variable-length inputs, the length itself may leak information,
	// but this is unavoidable without padding.
	if (a.length !== b.length) {
		return false;
	}

	// XOR all bytes and accumulate - no early exit
	let result = 0;
	for (let i = 0; i < a.length; i++) {
		// biome-ignore lint/style/noNonNullAssertion: index is always valid due to length check
		result |= a[i]! ^ b[i]!;
	}

	return result === 0;
}
