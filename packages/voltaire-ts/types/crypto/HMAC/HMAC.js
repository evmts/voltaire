// @ts-nocheck
export { EmptyKeyError } from "./errors.js";
export { OUTPUT_SIZE as SHA256_OUTPUT_SIZE, sha256Hmac as sha256, } from "./sha256.js";
export { OUTPUT_SIZE as SHA512_OUTPUT_SIZE, sha512Hmac as sha512, } from "./sha512.js";
import { EmptyKeyError } from "./errors.js";
import { OUTPUT_SIZE as SHA256_OUTPUT_SIZE, sha256Hmac } from "./sha256.js";
import { OUTPUT_SIZE as SHA512_OUTPUT_SIZE, sha512Hmac } from "./sha512.js";
/**
 * HMAC - Hash-based Message Authentication Code
 *
 * Secure HMAC implementation with key validation.
 * Empty keys are rejected to prevent security vulnerabilities.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.1.42
 * @example
 * ```javascript
 * import { HMAC } from '@voltaire/crypto';
 *
 * const key = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
 * const message = new Uint8Array([104, 101, 108, 108, 111]);
 *
 * // HMAC-SHA256 (32 bytes)
 * const mac256 = HMAC.sha256(key, message);
 *
 * // HMAC-SHA512 (64 bytes)
 * const mac512 = HMAC.sha512(key, message);
 * ```
 */
export const HMAC = {
    sha256: sha256Hmac,
    sha512: sha512Hmac,
    SHA256_OUTPUT_SIZE,
    SHA512_OUTPUT_SIZE,
    EmptyKeyError,
};
