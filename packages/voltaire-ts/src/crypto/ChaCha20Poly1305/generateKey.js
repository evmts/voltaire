import { KEY_SIZE } from "./constants.js";

/**
 * Generate random ChaCha20-Poly1305 key
 *
 * @see https://voltaire.tevm.sh/crypto/chacha20poly1305 for crypto documentation
 * @since 0.0.0
 * @returns {Uint8Array} 32-byte random key (256 bits)
 * @throws {never}
 * @example
 * ```javascript
 * import * as ChaCha20Poly1305 from './crypto/ChaCha20Poly1305/index.js';
 * const key = ChaCha20Poly1305.generateKey();
 * console.log(key.length); // 32
 * ```
 */
export function generateKey() {
	return crypto.getRandomValues(new Uint8Array(KEY_SIZE));
}
