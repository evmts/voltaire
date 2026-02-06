/**
 * ChaCha20-Poly1305 key size in bytes (256 bits)
 *
 * @see https://voltaire.tevm.sh/crypto/chacha20poly1305 for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import * as ChaCha20Poly1305 from './crypto/ChaCha20Poly1305/index.js';
 * const keyBytes = new Uint8Array(ChaCha20Poly1305.KEY_SIZE);
 * ```
 */
export const KEY_SIZE = 32;
/**
 * Nonce/IV size in bytes (96 bits)
 *
 * @see https://voltaire.tevm.sh/crypto/chacha20poly1305 for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import * as ChaCha20Poly1305 from './crypto/ChaCha20Poly1305/index.js';
 * const nonce = new Uint8Array(ChaCha20Poly1305.NONCE_SIZE);
 * ```
 */
export const NONCE_SIZE = 12;
/**
 * Authentication tag size in bytes (128 bits)
 *
 * @see https://voltaire.tevm.sh/crypto/chacha20poly1305 for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import * as ChaCha20Poly1305 from './crypto/ChaCha20Poly1305/index.js';
 * console.log('Tag size:', ChaCha20Poly1305.TAG_SIZE);
 * ```
 */
export const TAG_SIZE = 16;
