/**
 * Convert a byte array key to nibbles (half-bytes).
 * Each byte produces two nibbles (high, low).
 *
 * @param {Uint8Array} key
 * @returns {Uint8Array} Nibble array (length = key.length * 2)
 */
export function keyToNibbles(key) {
	const nibbles = new Uint8Array(key.length * 2);
	for (let i = 0; i < key.length; i++) {
		nibbles[i * 2] = /** @type {number} */ (key[i]) >> 4;
		nibbles[i * 2 + 1] = /** @type {number} */ (key[i]) & 0x0f;
	}
	return nibbles;
}

/**
 * Convert nibbles back to a byte array key.
 * Nibble count must be even.
 *
 * @param {Uint8Array} nibbles
 * @returns {Uint8Array}
 */
export function nibblesToKey(nibbles) {
	const key = new Uint8Array(nibbles.length >> 1);
	for (let i = 0; i < key.length; i++) {
		const hi = /** @type {number} */ (nibbles[i * 2]);
		const lo = /** @type {number} */ (nibbles[i * 2 + 1]);
		key[i] = (hi << 4) | lo;
	}
	return key;
}

/**
 * Find the length of the common prefix between two nibble arrays.
 *
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {number}
 */
export function commonPrefixLength(a, b) {
	const len = Math.min(a.length, b.length);
	for (let i = 0; i < len; i++) {
		if (a[i] !== b[i]) return i;
	}
	return len;
}
