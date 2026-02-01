import { NONCE_SIZE } from "./constants.js";
/**
 * Generate random nonce
 *
 * @see https://voltaire.tevm.sh/crypto/chacha20poly1305 for crypto documentation
 * @since 0.0.0
 * @returns {Uint8Array} 12-byte random nonce (96 bits)
 * @throws {never}
 * @example
 * ```javascript
 * import * as ChaCha20Poly1305 from './crypto/ChaCha20Poly1305/index.js';
 * const nonce = ChaCha20Poly1305.generateNonce();
 * console.log(nonce.length); // 12
 * ```
 */
export function generateNonce() {
    return crypto.getRandomValues(new Uint8Array(NONCE_SIZE));
}
