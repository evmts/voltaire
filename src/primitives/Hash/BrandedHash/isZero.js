import { ZERO } from "./constants.js";

/**
 * Check if hash is zero hash
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {import('./BrandedHash.js').BrandedHash} hash - Hash to check
 * @returns {boolean} True if hash is all zeros
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.from('0x00...');
 * const zero = Hash.isZero(hash); // true
 * ```
 */
export function isZero(hash) {
	if (hash.length !== ZERO.length) {
		return false;
	}
	let result = 0;
	for (let i = 0; i < hash.length; i++) {
		result |= (hash[i] ?? 0) ^ (ZERO[i] ?? 0);
	}
	return result === 0;
}
