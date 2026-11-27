const ALPHABET =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Encode bytes to standard base64 string
 *
 * Uses standard base64 alphabet (A-Z, a-z, 0-9, +, /)
 * with padding (=)
 *
 * @param {Uint8Array} data - Bytes to encode
 * @returns {import('./Base64Type.js').BrandedBase64} Base64-encoded string
 *
 * @example
 * ```typescript
 * const data = new Uint8Array([72, 101, 108, 108, 111]);
 * const encoded = Base64.encode(data);
 * // "SGVsbG8="
 * ```
 */
export function encode(data) {
	const len = data.length;
	if (len === 0) {
		return /** @type {import('./Base64Type.js').BrandedBase64} */ ("");
	}

	/** @type {string[]} */
	const parts = [];
	const limit = len - (len % 3);
	let i = 0;

	while (i < limit) {
		const b0 = /** @type {number} */ (data[i++]);
		const b1 = /** @type {number} */ (data[i++]);
		const b2 = /** @type {number} */ (data[i++]);
		const triplet = (b0 << 16) | (b1 << 8) | b2;
		parts.push(
			ALPHABET.charAt((triplet >> 18) & 0x3f) +
				ALPHABET.charAt((triplet >> 12) & 0x3f) +
				ALPHABET.charAt((triplet >> 6) & 0x3f) +
				ALPHABET.charAt(triplet & 0x3f),
		);
	}

	const rem = len - limit;
	if (rem === 1) {
		const b0 = /** @type {number} */ (data[i]);
		parts.push(
			`${ALPHABET.charAt(b0 >> 2)}${ALPHABET.charAt((b0 & 0x03) << 4)}==`,
		);
	} else if (rem === 2) {
		const b0 = /** @type {number} */ (data[i]);
		const b1 = /** @type {number} */ (data[i + 1]);
		parts.push(
			`${ALPHABET.charAt(b0 >> 2)}${ALPHABET.charAt(((b0 & 0x03) << 4) | (b1 >> 4))}${ALPHABET.charAt((b1 & 0x0f) << 2)}=`,
		);
	}

	return /** @type {import('./Base64Type.js').BrandedBase64} */ (
		parts.join("")
	);
}
