
/**
 * @typedef {import('./BundleHashType.js').BundleHashType} BundleHashType
 */

/**
 * Checks if two BundleHashes are equal
 *
 * @param {BundleHashType} a - First hash
 * @param {BundleHashType} b - Second hash
 * @returns {boolean} True if hashes are equal
 * @example
 * ```typescript
 * import * as BundleHash from './BundleHash/index.js';
 * const equal = BundleHash.equals(hash1, hash2);
 * ```
 */
export function equals(a, b) {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}
