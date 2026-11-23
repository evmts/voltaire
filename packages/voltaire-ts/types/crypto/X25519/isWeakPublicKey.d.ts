/**
 * Check whether an X25519 public key is a known weak (low-order) point
 *
 * The key is decoded exactly as RFC 7748 section 5 prescribes (little-endian,
 * bit 255 masked, reduced mod p) and compared against the five low-order
 * u-coordinates. Decoding first means every alias is caught as well: the
 * non-canonical encodings `p` (= 0) and `p + 1` (= 1), and all seven byte
 * strings again with bit 255 set (14 encodings in total).
 *
 * Public keys are public, so this comparison does not need to be
 * constant-time.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @see https://www.rfc-editor.org/rfc/rfc7748#section-6.1
 * @since 0.0.0
 * @param {import('./PublicKey.js').PublicKey} publicKey - 32-byte public key
 * @returns {boolean} True if the key is a low-order point. False for keys of any other length.
 * @throws {never}
 * @example
 * ```javascript
 * import { X25519 } from './crypto/X25519/index.js';
 * X25519.isWeakPublicKey(new Uint8Array(32)); // true
 * ```
 */
export function isWeakPublicKey(publicKey: import("./PublicKey.js").PublicKey): boolean;
//# sourceMappingURL=isWeakPublicKey.d.ts.map