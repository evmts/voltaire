/**
 * Constant-time comparison of two Bytes arrays.
 * Prevents timing attacks by always comparing in O(max(a.length, b.length)) time,
 * regardless of where differences occur or if lengths differ.
 *
 * @param {import('./BytesType.js').BytesType} a - First Bytes
 * @param {import('./BytesType.js').BytesType} b - Second Bytes
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * // Use for security-sensitive comparisons (e.g., HMAC, signatures)
 * const equal = Bytes.constantTimeEquals(secret1, secret2);
 * ```
 */
export function constantTimeEquals(a, b) {
	const maxLen = Math.max(a.length, b.length);
	// XOR lengths - will be non-zero if different
	let result = a.length ^ b.length;

	for (let i = 0; i < maxLen; i++) {
		// Use 0 for out-of-bounds access to maintain constant time
		const ai = i < a.length ? a[i] : 0;
		const bi = i < b.length ? b[i] : 0;
		result |= ai ^ bi;
	}

	return result === 0;
}
