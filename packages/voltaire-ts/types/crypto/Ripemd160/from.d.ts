/**
 * Hash input with RIPEMD160 (constructor pattern)
 *
 * Auto-detects input type and hashes accordingly:
 * - Uint8Array: hash directly
 * - string: UTF-8 encode then hash
 *
 * @see https://voltaire.tevm.sh/crypto/ripemd160 for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array | string} input - Data to hash
 * @returns {import('./Ripemd160HashType.js').Ripemd160Hash} 20-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { Ripemd160Hash } from './crypto/Ripemd160/index.js';
 *
 * const hash1 = Ripemd160Hash.from("hello");           // String
 * const hash2 = Ripemd160Hash.from(uint8array);        // Bytes
 * ```
 */
export function from(input: Uint8Array | string): import("./Ripemd160HashType.js").Ripemd160Hash;
//# sourceMappingURL=from.d.ts.map