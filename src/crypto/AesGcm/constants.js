/**
 * AES-128 key size in bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 * const keyBytes = new Uint8Array(AesGcm.AES128_KEY_SIZE);
 * ```
 */
export const AES128_KEY_SIZE = 16;

/**
 * AES-256 key size in bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 * const keyBytes = new Uint8Array(AesGcm.AES256_KEY_SIZE);
 * ```
 */
export const AES256_KEY_SIZE = 32;

/**
 * Nonce/IV size in bytes (standard for GCM)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 * const nonce = new Uint8Array(AesGcm.NONCE_SIZE);
 * ```
 */
export const NONCE_SIZE = 12;

/**
 * Authentication tag size in bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 * console.log('Tag size:', AesGcm.TAG_SIZE);
 * ```
 */
export const TAG_SIZE = 16;
