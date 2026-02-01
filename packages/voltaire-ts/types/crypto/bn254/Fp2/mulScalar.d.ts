/**
 * Multiply Fp2 element by scalar
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../Fp2.js').Fp2} a - Fp2 element
 * @param {bigint} scalar - Scalar value
 * @returns {import('../Fp2.js').Fp2} Product
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const a = { c0: 1n, c1: 2n };
 * const result = Fp2.mulScalar(a, 2n);
 * ```
 */
export function mulScalar(a: import("../Fp2.js").Fp2, scalar: bigint): import("../Fp2.js").Fp2;
//# sourceMappingURL=mulScalar.d.ts.map