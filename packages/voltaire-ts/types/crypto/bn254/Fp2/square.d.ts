/**
 * Square an Fp2 element
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../Fp2.js').Fp2} a - Element to square
 * @returns {import('../Fp2.js').Fp2} Square
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const a = { c0: 1n, c1: 2n };
 * const squared = Fp2.square(a);
 * ```
 */
export function square(a: import("../Fp2.js").Fp2): import("../Fp2.js").Fp2;
//# sourceMappingURL=square.d.ts.map