/**
 * Internal hash function for bloom filter
 * Uses simple multiplicative hashing with seed
 *
 * @param {Uint8Array} item - Item to hash
 * @param {number} seed - Hash seed/index
 * @param {number} m - Number of bits in filter
 * @returns {number} Hash value modulo m
 */
export function hash(item, seed, m) {
	let h = seed;
	for (let i = 0; i < item.length; i++) {
		h = (h * 31 + item[i]) >>> 0;
	}
	return h % m;
}
