/**
 * Check if hash is zero hash
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {import('./HashType.js').HashType} hash - Hash to check
 * @returns {boolean} True if hash is all zeros
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.from('0x00...');
 * const zero = Hash.isZero(hash); // true
 * ```
 */
export function isZero(hash: import("./HashType.js").HashType): boolean;
//# sourceMappingURL=isZero.d.ts.map