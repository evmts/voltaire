/**
 * Compute SHA256 hash of UTF-8 string
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} str - Input string
 * @returns {import('./SHA256HashType.js').SHA256Hash} 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { SHA256 } from './crypto/SHA256/index.js';
 * const hash = SHA256.hashString("hello world");
 * console.log(hash.length); // 32
 * ```
 */
export function hashString(str: string): import("./SHA256HashType.js").SHA256Hash;
//# sourceMappingURL=hashString.d.ts.map