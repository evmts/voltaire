/**
 * Hash string with BLAKE2b (convenience function)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} str - Input string to hash
 * @param {number} [outputLength=64] - Output length in bytes (1-64, default 64)
 * @returns {import('./Blake2HashType.js').Blake2Hash} BLAKE2b hash
 * @throws {Error} If outputLength is invalid
 * @example
 * ```javascript
 * import * as Blake2 from './crypto/Blake2/index.js';
 * const hash = Blake2.hashString("hello world");
 * const hash48 = Blake2.hashString("hello world", 48);
 * ```
 */
export function hashString(str: string, outputLength?: number): import("./Blake2HashType.js").Blake2Hash;
//# sourceMappingURL=hashString.d.ts.map