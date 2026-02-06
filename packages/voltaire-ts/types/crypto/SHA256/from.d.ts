/**
 * Hash input with SHA256 (constructor pattern)
 *
 * Auto-detects input type and hashes accordingly:
 * - Uint8Array: hash directly
 * - string starting with 0x: parse as hex
 * - string: UTF-8 encode then hash
 *
 * @see https://voltaire.tevm.sh/crypto/sha256 for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array | string} input - Data to hash
 * @returns {import('./SHA256HashType.js').SHA256Hash} 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { SHA256Hash } from './crypto/SHA256/index.js';
 *
 * const hash1 = SHA256Hash.from("0x1234");      // Hex
 * const hash2 = SHA256Hash.from("hello");       // String
 * const hash3 = SHA256Hash.from(uint8array);    // Bytes
 * ```
 */
export function from(input: Uint8Array | string): import("./SHA256HashType.js").SHA256Hash;
//# sourceMappingURL=from.d.ts.map