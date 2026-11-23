/**
 * Validate an Ed25519 public key
 *
 * A key is valid only when all of the following hold:
 * - it is 32 bytes
 * - the encoding is canonical per RFC 8032 section 5.1.3: `y < p`, and the
 *   sign bit is clear when `x = 0`
 * - the point is on the twisted Edwards curve `-x^2 + y^2 = 1 + d*x^2*y^2`
 * - the point is not the identity and not one of the other 7 small-order
 *   (8-torsion) points
 * - the point is in the prime-order subgroup (`L * A = identity`), which
 *   also rejects mixed-order points `A + T` with `T` a torsion point
 *
 * Every key produced by RFC 8032 key generation (`A = s * B`) passes. A
 * small-order key makes signatures verify for attacker-chosen messages and
 * breaks protocols that assume keys are unique to their owner.
 *
 * Public keys are public, so this check does not need to be constant-time.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @see https://www.rfc-editor.org/rfc/rfc8032#section-5.1.3
 * @since 0.0.0
 * @param {import('./PublicKey.js').PublicKey} publicKey - Ed25519 public key to validate
 * @returns {boolean} True if the key is a canonical, prime-order curve point, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Ed25519 from './crypto/Ed25519/index.js';
 * const isValid = Ed25519.validatePublicKey(publicKey);
 * if (!isValid) throw new Error('Invalid public key');
 * ```
 */
export function validatePublicKey(publicKey: import("./PublicKey.js").PublicKey): boolean;
//# sourceMappingURL=validatePublicKey.d.ts.map