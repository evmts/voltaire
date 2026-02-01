/**
 * Compute RIPEMD160 hash of hex string (without 0x prefix)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./Ripemd160HashType.js').Ripemd160Hash} 20-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { Ripemd160 } from './crypto/Ripemd160/index.js';
 * const hash = Ripemd160.hashHex("0xdeadbeef");
 * console.log(hash.length); // 20
 * ```
 */
export function hashHex(hex: string): import("./Ripemd160HashType.js").Ripemd160Hash;
//# sourceMappingURL=hashHex.d.ts.map