/**
 * Hash hex string with Keccak-256
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} hex - Hex string to hash (with or without 0x prefix)
 * @returns {import('./Keccak256HashType.js').Keccak256Hash} 32-byte hash
 * @throws {InvalidFormatError} If hex string is invalid or has odd length
 * @example
 * ```javascript
 * import { Keccak256Hash } from './crypto/Keccak256/index.js';
 * const hash = Keccak256Hash.fromHex('0x1234abcd');
 * ```
 */
export function hashHex(hex: string): import("./Keccak256HashType.js").Keccak256Hash;
//# sourceMappingURL=hashHex.d.ts.map