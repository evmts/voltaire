/**
 * Point at infinity for G1
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @returns {import('../G1PointType.js').G1PointType} Point at infinity
 * @throws {never}
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const inf = G1.infinity();
 * ```
 */
export function infinity() {
    return /** @type {import('../G1PointType.js').G1PointType} */ ({
        x: 0n,
        y: 0n,
        z: 0n,
    });
}
