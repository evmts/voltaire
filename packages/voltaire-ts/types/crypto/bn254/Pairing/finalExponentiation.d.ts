/**
 * Final exponentiation (simplified)
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {{value: bigint}} f - Miller loop result
 * @returns {{value: bigint}} Final exponentiation result
 * @throws {never}
 * @example
 * ```javascript
 * import * as Pairing from './crypto/bn254/Pairing/index.js';
 * import * as G1 from './crypto/bn254/G1/index.js';
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const ml = Pairing.millerLoop(G1.generator(), G2.generator());
 * const result = Pairing.finalExponentiation(ml);
 * ```
 */
export function finalExponentiation(f: {
    value: bigint;
}): {
    value: bigint;
};
//# sourceMappingURL=finalExponentiation.d.ts.map