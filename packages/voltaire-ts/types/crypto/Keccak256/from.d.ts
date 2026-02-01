/**
 * Hash input with Keccak-256 (constructor pattern)
 *
 * Auto-detects input type and hashes accordingly:
 * - Uint8Array: hash directly
 * - string starting with 0x: parse as hex
 * - string: UTF-8 encode then hash
 *
 * @see https://voltaire.tevm.sh/crypto/keccak256 for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array | string} input - Data to hash
 * @returns {import('./Keccak256HashType.js').Keccak256Hash} 32-byte hash
 * @throws {import('../../primitives/errors/ValidationError.js').InvalidFormatError} If hex string is invalid
 * @example
 * ```javascript
 * import { Keccak256Hash } from './crypto/Keccak256/index.js';
 *
 * const hash1 = Keccak256Hash.from("0x1234");      // Hex
 * const hash2 = Keccak256Hash.from("hello");       // String
 * const hash3 = Keccak256Hash.from(uint8array);    // Bytes
 * ```
 */
export function from(input: Uint8Array | string): import("./Keccak256HashType.js").Keccak256Hash;
//# sourceMappingURL=from.d.ts.map