/**
 * SHA256 output size in bytes (256 bits / 8)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { OUTPUT_SIZE } from './crypto/SHA256/index.js';
 * console.log(OUTPUT_SIZE); // 32
 * ```
 */
export const OUTPUT_SIZE = 32;

/**
 * SHA256 block size in bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { BLOCK_SIZE } from './crypto/SHA256/index.js';
 * console.log(BLOCK_SIZE); // 64
 * ```
 */
export const BLOCK_SIZE = 64;
