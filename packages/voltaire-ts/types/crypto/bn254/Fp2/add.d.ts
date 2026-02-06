/**
 * Add two Fp2 elements
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../Fp2.js').Fp2} a - First element
 * @param {import('../Fp2.js').Fp2} b - Second element
 * @returns {import('../Fp2.js').Fp2} Sum
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const a = { c0: 1n, c1: 2n };
 * const b = { c0: 3n, c1: 4n };
 * const sum = Fp2.add(a, b);
 * ```
 */
export function add(a: import("../Fp2.js").Fp2, b: import("../Fp2.js").Fp2): import("../Fp2.js").Fp2;
//# sourceMappingURL=add.d.ts.map