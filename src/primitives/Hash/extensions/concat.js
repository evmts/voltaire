/**
 * Concatenate multiple hashes
 *
 * @param {...import('./BrandedHash.ts').BrandedHash} hashes - Hashes to concatenate
 * @returns {Uint8Array} Concatenated bytes
 *
 * @example
 * ```js
 * const hash1 = Hash.from('0x1234...');
 * const hash2 = Hash.from('0x5678...');
 * const combined = Hash.concat(hash1, hash2);
 * ```
 */
export function concat(...hashes) {
	const totalLength = hashes.reduce((sum, h) => sum + h.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const hash of hashes) {
		result.set(hash, offset);
		offset += hash.length;
	}
	return result;
}
