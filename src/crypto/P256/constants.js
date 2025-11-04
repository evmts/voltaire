/**
 * P256 curve order (number of points on the curve)
 */
export const CURVE_ORDER =
	0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;

/**
 * Private key size in bytes
 */
export const PRIVATE_KEY_SIZE = 32;

/**
 * Uncompressed public key size in bytes (64 bytes, no prefix)
 */
export const PUBLIC_KEY_SIZE = 64;

/**
 * Signature component size in bytes (r and s are each 32 bytes)
 */
export const SIGNATURE_COMPONENT_SIZE = 32;

/**
 * ECDH shared secret size in bytes
 */
export const SHARED_SECRET_SIZE = 32;
