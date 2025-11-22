/**
 * Clone hash
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {import('./HashType.js').HashType} hash - Hash to clone
 * @returns {import('./HashType.js').HashType} New hash with same value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.from('0x1234...');
 * const copy = Hash.clone(hash);
 * ```
 */
export function clone(hash) {
	return /** @type {import('./HashType.js').HashType} */ (
		new Uint8Array(hash)
	);
}
