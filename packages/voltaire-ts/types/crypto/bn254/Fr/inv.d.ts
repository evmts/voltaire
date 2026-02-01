/**
 * Multiplicative inverse in Fr
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} a - Element to invert
 * @returns {bigint} a^(-1) mod FR_MOD
 * @throws {Bn254Error} If a is zero (division by zero)
 * @example
 * ```javascript
 * import * as Fr from './crypto/bn254/Fr/index.js';
 * const inverse = Fr.inv(123n);
 * ```
 */
export function inv(a: bigint): bigint;
//# sourceMappingURL=inv.d.ts.map