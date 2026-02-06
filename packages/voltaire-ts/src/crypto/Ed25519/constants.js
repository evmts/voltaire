/**
 * Ed25519 secret key size in bytes.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {32}
 * @example
 * ```javascript
 * import { SECRET_KEY_SIZE } from './crypto/Ed25519/constants.js';
 * const secretKey = new Uint8Array(SECRET_KEY_SIZE);
 * ```
 */
export const SECRET_KEY_SIZE = 32;

/**
 * Ed25519 public key size in bytes.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {32}
 * @example
 * ```javascript
 * import { PUBLIC_KEY_SIZE } from './crypto/Ed25519/constants.js';
 * const publicKey = new Uint8Array(PUBLIC_KEY_SIZE);
 * ```
 */
export const PUBLIC_KEY_SIZE = 32;

/**
 * Ed25519 signature size in bytes.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {64}
 * @example
 * ```javascript
 * import { SIGNATURE_SIZE } from './crypto/Ed25519/constants.js';
 * const signature = new Uint8Array(SIGNATURE_SIZE);
 * ```
 */
export const SIGNATURE_SIZE = 64;

/**
 * Ed25519 seed size in bytes.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {32}
 * @example
 * ```javascript
 * import { SEED_SIZE } from './crypto/Ed25519/constants.js';
 * const seed = crypto.getRandomValues(new Uint8Array(SEED_SIZE));
 * ```
 */
export const SEED_SIZE = 32;
