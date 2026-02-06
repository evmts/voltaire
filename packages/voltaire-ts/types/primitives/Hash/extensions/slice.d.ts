/**
 * Extract a portion of a hash
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {import('./../BrandedHash.js').BrandedHash} hash - Hash to slice
 * @param {number} [start] - Start position (default 0)
 * @param {number} [end] - End position (default length)
 * @returns {Uint8Array} Sliced portion
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.from('0x1234...');
 * const portion = Hash.slice(hash, 0, 4);
 * ```
 */
export function slice(hash: import("./../BrandedHash.js").BrandedHash, start?: number, end?: number): Uint8Array;
//# sourceMappingURL=slice.d.ts.map