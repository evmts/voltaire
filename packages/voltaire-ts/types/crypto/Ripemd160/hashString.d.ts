/**
 * Compute RIPEMD160 hash of UTF-8 string
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} str - Input string
 * @returns {import('./Ripemd160HashType.js').Ripemd160Hash} 20-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { Ripemd160 } from './crypto/Ripemd160/index.js';
 * const hash = Ripemd160.hashString("hello");
 * console.log(hash.length); // 20
 * ```
 */
export function hashString(str: string): import("./Ripemd160HashType.js").Ripemd160Hash;
//# sourceMappingURL=hashString.d.ts.map