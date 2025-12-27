/**
 * Convert Bytes to number
 *
 * @param {import('./BytesType.js').BytesType} bytes - Bytes to convert
 * @returns {number} Number value
 * @throws {Error} If value exceeds MAX_SAFE_INTEGER
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * Bytes.toNumber(new Uint8Array([0xff]));       // 255
 * Bytes.toNumber(new Uint8Array([0x12, 0x34])); // 4660
 * ```
 */
export function toNumber(bytes) {
	if (bytes.length === 0) {
		return 0;
	}

	// Check if value would exceed MAX_SAFE_INTEGER
	// MAX_SAFE_INTEGER = 2^53 - 1 = 0x1FFFFFFFFFFFFF (7 bytes, but limited)
	if (bytes.length > 7) {
		throw new Error(
			`Bytes too large to convert to number safely. Use Bytes.toBigInt() instead.`,
		);
	}
	if (bytes.length === 7 && /** @type {number} */ (bytes[0]) > 0x1f) {
		throw new Error(
			`Value exceeds MAX_SAFE_INTEGER. Use Bytes.toBigInt() instead.`,
		);
	}

	let result = 0;
	for (let i = 0; i < bytes.length; i++) {
		result = result * 256 + /** @type {number} */ (bytes[i]);
	}

	if (result > Number.MAX_SAFE_INTEGER) {
		throw new Error(
			`Value exceeds MAX_SAFE_INTEGER. Use Bytes.toBigInt() instead.`,
		);
	}

	return result;
}
