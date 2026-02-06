/**
 * Compare two hashes for equality
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {import('./../BrandedHash.js').BrandedHash} hash - First hash
 * @param {import('./../BrandedHash.js').BrandedHash} other - Hash to compare with
 * @returns {boolean} True if hashes are equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash1 = Hash.from('0x1234...');
 * const hash2 = Hash.from('0x1234...');
 * const same = Hash.equals(hash1, hash2); // true
 * ```
 */
export function equals(hash: import("./../BrandedHash.js").BrandedHash, other: import("./../BrandedHash.js").BrandedHash): boolean;
//# sourceMappingURL=equals.d.ts.map