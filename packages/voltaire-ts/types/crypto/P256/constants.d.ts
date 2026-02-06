/**
 * P256 curve order (number of points on the curve)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {bigint}
 */
export const CURVE_ORDER: bigint;
/**
 * Private key size in bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {number}
 */
export const PRIVATE_KEY_SIZE: number;
/**
 * Uncompressed public key size in bytes (64 bytes, no prefix)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {number}
 */
export const PUBLIC_KEY_SIZE: number;
/**
 * Signature component size in bytes (r and s are each 32 bytes)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {number}
 */
export const SIGNATURE_COMPONENT_SIZE: number;
/**
 * ECDH shared secret size in bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {number}
 */
export const SHARED_SECRET_SIZE: number;
//# sourceMappingURL=constants.d.ts.map