/**
 * Exponentiation in Fr using square-and-multiply
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} base - Base element
 * @param {bigint} exponent - Exponent
 * @returns {bigint} base^exponent mod FR_MOD
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fr from './crypto/bn254/Fr/index.js';
 * const result = Fr.pow(2n, 256n);
 * ```
 */
export function pow(base: bigint, exponent: bigint): bigint;
//# sourceMappingURL=pow.d.ts.map