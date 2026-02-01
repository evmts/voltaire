/**
 * Secret key size in bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {32}
 * @throws {never}
 * @example
 * ```javascript
 * import { SECRET_KEY_SIZE } from './crypto/X25519/index.js';
 * console.log(SECRET_KEY_SIZE); // 32
 * ```
 */
export const SECRET_KEY_SIZE = 32;

/**
 * Public key size in bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {32}
 * @throws {never}
 * @example
 * ```javascript
 * import { PUBLIC_KEY_SIZE } from './crypto/X25519/index.js';
 * console.log(PUBLIC_KEY_SIZE); // 32
 * ```
 */
export const PUBLIC_KEY_SIZE = 32;

/**
 * Shared secret size in bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {32}
 * @throws {never}
 * @example
 * ```javascript
 * import { SHARED_SECRET_SIZE } from './crypto/X25519/index.js';
 * console.log(SHARED_SECRET_SIZE); // 32
 * ```
 */
export const SHARED_SECRET_SIZE = 32;
