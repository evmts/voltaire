/**
 * Exponentiation in Fp using square-and-multiply
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} base - Base element
 * @param {bigint} exponent - Exponent
 * @returns {bigint} base^exponent mod FP_MOD
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp from './crypto/bn254/Fp/index.js';
 * const result = Fp.pow(2n, 256n);
 * ```
 */
export function pow(base: bigint, exponent: bigint): bigint;
//# sourceMappingURL=pow.d.ts.map