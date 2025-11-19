/**
 * Check if two Bytes are equal
 *
 * @param {import('./BytesType.js').BytesType} a - First Bytes
 * @param {import('./BytesType.js').BytesType} b - Second Bytes
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * const equal = Bytes.equals(bytes1, bytes2);
 * ```
 */
export function equals(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
