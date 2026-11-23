/**
 * P256 curve order (number of points on the curve)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {bigint}
 */
export const CURVE_ORDER =
	0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;

/**
 * Private key size in bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {number}
 */
export const PRIVATE_KEY_SIZE = 32;

/**
 * Uncompressed public key size in bytes (64 bytes, no prefix)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {number}
 */
export const PUBLIC_KEY_SIZE = 64;

/**
 * Signature component size in bytes (r and s are each 32 bytes)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {number}
 */
export const SIGNATURE_COMPONENT_SIZE = 32;

/**
 * ECDH shared secret size in bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {number}
 */
export const SHARED_SECRET_SIZE = 32;

/**
 * P256 field prime p = 2^256 - 2^224 + 2^192 + 2^96 - 1
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {bigint}
 */
export const FIELD_PRIME =
	0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn;

/**
 * P256 curve coefficient b in y^2 = x^3 - 3x + b (mod p)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {bigint}
 */
export const CURVE_B =
	0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn;
