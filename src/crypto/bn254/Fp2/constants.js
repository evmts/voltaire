/**
 * Fp2 Constants
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 */

/**
 * Zero element in Fp2
 *
 * @since 0.0.0
 * @type {import('../Fp2.js').Fp2}
 * @example
 * ```javascript
 * import { ZERO } from './crypto/bn254/Fp2/constants.js';
 * console.log(ZERO); // { c0: 0n, c1: 0n }
 * ```
 */
export const ZERO = { c0: 0n, c1: 0n };

/**
 * One element in Fp2
 *
 * @since 0.0.0
 * @type {import('../Fp2.js').Fp2}
 * @example
 * ```javascript
 * import { ONE } from './crypto/bn254/Fp2/constants.js';
 * console.log(ONE); // { c0: 1n, c1: 0n }
 * ```
 */
export const ONE = { c0: 1n, c1: 0n };
