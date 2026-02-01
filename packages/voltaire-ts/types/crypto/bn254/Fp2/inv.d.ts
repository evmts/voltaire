/**
 * Multiplicative inverse in Fp2
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../Fp2.js').Fp2} a - Element to invert
 * @returns {import('../Fp2.js').Fp2} Inverse
 * @throws {Bn254Error} If element is zero (division by zero)
 * @example
 * ```javascript
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const a = { c0: 1n, c1: 2n };
 * const inverse = Fp2.inv(a);
 * ```
 */
export function inv(a: import("../Fp2.js").Fp2): import("../Fp2.js").Fp2;
//# sourceMappingURL=inv.d.ts.map