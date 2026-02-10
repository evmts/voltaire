/**
 * Hex-prefix encoding for MPT paths (Yellow Paper Appendix C).
 *
 * Encodes nibble path with a flag indicating leaf vs extension.
 * Format:
 *   - If odd nibbles: first byte = (flag ? 0x3 : 0x1) << 4 | first_nibble, then remaining pairs
 *   - If even nibbles: first byte = (flag ? 0x20 : 0x00), then all pairs
 *
 * @param {Uint8Array} nibbles - Path nibbles to encode
 * @param {boolean} isLeaf - True for leaf nodes, false for extension nodes
 * @returns {Uint8Array} Hex-prefix encoded path
 */
export function encodePath(nibbles, isLeaf) {
	const odd = nibbles.length % 2 !== 0;
	const flag = isLeaf ? 2 : 0;

	if (odd) {
		const out = new Uint8Array(1 + ((nibbles.length - 1) >> 1));
		out[0] = ((flag + 1) << 4) | /** @type {number} */ (nibbles[0]);
		for (let i = 1; i < nibbles.length; i += 2) {
			out[(i + 1) >> 1] = (/** @type {number} */ (nibbles[i]) << 4) | /** @type {number} */ (nibbles[i + 1]);
		}
		return out;
	}

	const out = new Uint8Array(1 + (nibbles.length >> 1));
	out[0] = flag << 4;
	for (let i = 0; i < nibbles.length; i += 2) {
		out[1 + (i >> 1)] = (/** @type {number} */ (nibbles[i]) << 4) | /** @type {number} */ (nibbles[i + 1]);
	}
	return out;
}

/**
 * Decode a hex-prefix encoded path back to nibbles + leaf flag.
 *
 * @param {Uint8Array} encoded - Hex-prefix encoded path
 * @returns {{ nibbles: Uint8Array; isLeaf: boolean }}
 */
export function decodePath(encoded) {
	const firstByte = /** @type {number} */ (encoded[0]);
	const flag = firstByte >> 4;
	const isLeaf = flag >= 2;
	const odd = (flag & 1) !== 0;

	if (odd) {
		const nibbles = new Uint8Array((encoded.length - 1) * 2 + 1);
		nibbles[0] = firstByte & 0x0f;
		for (let i = 1; i < encoded.length; i++) {
			nibbles[1 + (i - 1) * 2] = /** @type {number} */ (encoded[i]) >> 4;
			nibbles[1 + (i - 1) * 2 + 1] = /** @type {number} */ (encoded[i]) & 0x0f;
		}
		return { nibbles, isLeaf };
	}

	const nibbles = new Uint8Array((encoded.length - 1) * 2);
	for (let i = 1; i < encoded.length; i++) {
		nibbles[(i - 1) * 2] = /** @type {number} */ (encoded[i]) >> 4;
		nibbles[(i - 1) * 2 + 1] = /** @type {number} */ (encoded[i]) & 0x0f;
	}
	return { nibbles, isLeaf };
}
