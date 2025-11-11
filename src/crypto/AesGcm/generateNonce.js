import { NONCE_SIZE } from "./constants.js";

/**
 * Generate random nonce
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @returns {Uint8Array} 12-byte random nonce
 * @throws {never}
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 * const nonce = AesGcm.generateNonce();
 * ```
 */
export function generateNonce() {
	return crypto.getRandomValues(new Uint8Array(NONCE_SIZE));
}
