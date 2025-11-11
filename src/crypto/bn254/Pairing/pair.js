import { finalExponentiation } from "./finalExponentiation.js";
import { millerLoop } from "./millerLoop.js";

/**
 * Compute optimal ate pairing e(P, Q)
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../BrandedG1Point.js').BrandedG1Point} p - Point in G1
 * @param {import('../BrandedG2Point.js').BrandedG2Point} q - Point in G2
 * @returns {{value: bigint}} Pairing result
 * @throws {never}
 * @example
 * ```javascript
 * import * as Pairing from './crypto/bn254/Pairing/index.js';
 * import * as G1 from './crypto/bn254/G1/index.js';
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const result = Pairing.pair(G1.generator(), G2.generator());
 * ```
 */
export function pair(p, q) {
	const ml = millerLoop(p, q);
	return finalExponentiation(ml);
}
