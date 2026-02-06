import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { EmptyKeyError } from "./errors.js";
/**
 * HMAC-SHA256 output size in bytes
 */
export const OUTPUT_SIZE = 32;
/**
 * Compute HMAC-SHA256 authentication code
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.1.42
 * @param {Uint8Array} key - Secret key (must not be empty)
 * @param {Uint8Array} message - Message to authenticate
 * @returns {import('./HMACType.js').HMACType} 32-byte HMAC
 * @throws {EmptyKeyError} If key is empty
 * @example
 * ```javascript
 * import { HMAC } from '@voltaire/crypto';
 *
 * const key = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
 * const message = new Uint8Array([104, 101, 108, 108, 111]); // "hello"
 * const mac = HMAC.sha256(key, message);
 * ```
 */
export function sha256Hmac(key, message) {
    if (key.length === 0) {
        throw new EmptyKeyError();
    }
    return /** @type {import('./HMACType.js').HMACType} */ (hmac(sha256, key, message));
}
