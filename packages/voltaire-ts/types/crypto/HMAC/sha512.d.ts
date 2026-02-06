/**
 * Compute HMAC-SHA512 authentication code
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.1.42
 * @param {Uint8Array} key - Secret key (must not be empty)
 * @param {Uint8Array} message - Message to authenticate
 * @returns {import('./HMACType.js').HMACType} 64-byte HMAC
 * @throws {EmptyKeyError} If key is empty
 * @example
 * ```javascript
 * import { HMAC } from '@voltaire/crypto';
 *
 * const key = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
 * const message = new Uint8Array([104, 101, 108, 108, 111]); // "hello"
 * const mac = HMAC.sha512(key, message);
 * ```
 */
export function sha512Hmac(key: Uint8Array, message: Uint8Array): import("./HMACType.js").HMACType;
/**
 * HMAC-SHA512 output size in bytes
 */
export const OUTPUT_SIZE: 64;
//# sourceMappingURL=sha512.d.ts.map