/**
 * Create a copy of a hash
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {import('./../BrandedHash.js').BrandedHash} hash - Hash to clone
 * @returns {import('./../BrandedHash.js').BrandedHash} Copy of hash
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.from('0x1234...');
 * const copy = Hash.clone(hash);
 * ```
 */
export function clone(hash) {
    return /** @type {import('./../BrandedHash.js').BrandedHash} */ (new Uint8Array(hash));
}
