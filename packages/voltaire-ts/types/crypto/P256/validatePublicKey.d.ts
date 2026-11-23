/**
 * Validate a P256 public key
 *
 * Accepted encodings:
 * - 64 bytes: raw `x || y` (the library's native format)
 * - 65 bytes: SEC1 uncompressed `0x04 || x || y`
 * - 33 bytes: SEC1 compressed `0x02 | 0x03 || x`
 *
 * Rejects:
 * - any other length or SEC1 prefix (including hybrid `0x06`/`0x07` and the
 *   `0x00` infinity encoding)
 * - the point at infinity `(0, 0)`
 * - non-canonical coordinates `x >= p` or `y >= p`
 * - points that do not satisfy `y^2 = x^3 - 3x + b (mod p)`
 *
 * Accepting an off-curve point in ECDH enables invalid-curve attacks that
 * recover the private key, so every ECDH and verify path runs this check.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./P256PublicKeyType.js').P256PublicKeyType | Uint8Array} publicKey - Public key to validate
 * @returns {boolean} True if the key encodes a valid curve point, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as P256 from './crypto/P256/index.js';
 * const publicKey = new Uint8Array(64);
 * const isValid = P256.validatePublicKey(publicKey); // false: point at infinity
 * ```
 */
export function validatePublicKey(publicKey: import("./P256PublicKeyType.js").P256PublicKeyType | Uint8Array): boolean;
//# sourceMappingURL=validatePublicKey.d.ts.map