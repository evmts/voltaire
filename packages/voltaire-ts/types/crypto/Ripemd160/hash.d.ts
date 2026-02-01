/**
 * Compute RIPEMD160 hash (20 bytes)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array | string} data - Input data (Uint8Array or string)
 * @returns {import('./Ripemd160HashType.js').Ripemd160Hash} 20-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { Ripemd160 } from './crypto/Ripemd160/index.js';
 * const hash = Ripemd160.hash(new Uint8Array([1, 2, 3]));
 * console.log(hash.length); // 20
 * ```
 */
export function hash(data: Uint8Array | string): import("./Ripemd160HashType.js").Ripemd160Hash;
//# sourceMappingURL=hash.d.ts.map