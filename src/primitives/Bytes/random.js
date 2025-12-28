/**
 * Generate random Bytes of specified size
 *
 * @param {number} size - Number of random bytes to generate
 * @returns {import('./BytesType.js').BytesType} Random bytes
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * const random32 = Bytes.random(32); // 32 random bytes
 * const random16 = Bytes.random(16); // 16 random bytes
 * ```
 */
export function random(size) {
	if (size < 0) {
		throw new Error(`Size must be non-negative. Got: ${size}`);
	}
	if (!Number.isInteger(size)) {
		throw new Error(`Size must be an integer. Got: ${size}`);
	}

	const bytes = new Uint8Array(size);
	if (size > 0) {
		// Use crypto.getRandomValues if available (browser/Node.js)
		if (
			typeof globalThis.crypto !== "undefined" &&
			globalThis.crypto.getRandomValues
		) {
			globalThis.crypto.getRandomValues(bytes);
		} else {
			// Fallback for environments without crypto
			for (let i = 0; i < size; i++) {
				bytes[i] = Math.floor(Math.random() * 256);
			}
		}
	}

	return /** @type {import('./BytesType.js').BytesType} */ (bytes);
}
