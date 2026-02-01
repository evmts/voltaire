/**
 * Create a Secp256k1PublicKeyType from various input formats
 *
 * Accepts either a Uint8Array (raw bytes) or hex string.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array | string} input - Public key as raw bytes or hex string (with or without 0x prefix)
 * @returns {import('../Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} Branded public key
 * @throws {InvalidPublicKeyError} If input format or public key is invalid
 * @example
 * ```javascript
 * import * as PublicKey from './crypto/Secp256k1/PublicKey/index.js';
 * // From bytes
 * const pk1 = PublicKey.from(keyBytes);
 * // From hex string
 * const pk2 = PublicKey.from("0x1234...");
 * ```
 */
export function from(input: Uint8Array | string): import("../Secp256k1PublicKeyType.js").Secp256k1PublicKeyType;
//# sourceMappingURL=from.d.ts.map