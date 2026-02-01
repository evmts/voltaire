/**
 * Compute SHA256 hash of hex string (without 0x prefix)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./SHA256HashType.js').SHA256Hash} 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { SHA256 } from './crypto/SHA256/index.js';
 * const hash = SHA256.hashHex("0xdeadbeef");
 * console.log(hash.length); // 32
 * ```
 */
export function hashHex(hex: string): import("./SHA256HashType.js").SHA256Hash;
//# sourceMappingURL=hashHex.d.ts.map