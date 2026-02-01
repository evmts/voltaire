// @ts-nocheck
/**
 * secp256k1 curve order (number of points on the curve)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { CURVE_ORDER } from './crypto/Secp256k1/index.js';
 * console.log(CURVE_ORDER); // 0xffffffffffff...
 * ```
 */
export const CURVE_ORDER =
	0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

/**
 * Private key size in bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { PRIVATE_KEY_SIZE } from './crypto/Secp256k1/index.js';
 * console.log(PRIVATE_KEY_SIZE); // 32
 * ```
 */
export const PRIVATE_KEY_SIZE = 32;

/**
 * Uncompressed public key size in bytes (64 bytes, no prefix)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { PUBLIC_KEY_SIZE } from './crypto/Secp256k1/index.js';
 * console.log(PUBLIC_KEY_SIZE); // 64
 * ```
 */
export const PUBLIC_KEY_SIZE = 64;

/**
 * Signature component size in bytes (r and s are each 32 bytes)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { SIGNATURE_COMPONENT_SIZE } from './crypto/Secp256k1/index.js';
 * console.log(SIGNATURE_COMPONENT_SIZE); // 32
 * ```
 */
export const SIGNATURE_COMPONENT_SIZE = 32;
