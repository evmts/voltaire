import { multiPairing } from "./multiPairing.js";

/**
 * Compute optimal ate pairing e(P, Q)
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../G1PointType.js').G1PointType} p - Point in G1
 * @param {import('../G2PointType.js').G2PointType} q - Point in G2
 * @returns {{value: bigint}} Element of GT, encoded as a canonical integer (identity is `1n`)
 * @throws {import('../errors.js').Bn254InvalidPointError} If a point is not on its curve
 * @throws {import('../errors.js').Bn254SubgroupCheckError} If q is outside the G2 subgroup
 * @example
 * ```javascript
 * import * as Pairing from './crypto/bn254/Pairing/index.js';
 * import * as G1 from './crypto/bn254/G1/index.js';
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const result = Pairing.pair(G1.generator(), G2.generator());
 * ```
 */
export function pair(p, q) {
	return multiPairing([[p, q]]);
}
