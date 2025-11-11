import * as Fr from "../Fr/index.js";
import { finalExponentiation } from "./finalExponentiation.js";
import { millerLoop } from "./millerLoop.js";
import { pairingResultOne } from "./pairingResult.js";

/**
 * Multi-pairing: compute product of pairings
 *
 * More efficient than computing pairings individually
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {Array<[import('../BrandedG1Point.js').BrandedG1Point, import('../BrandedG2Point.js').BrandedG2Point]>} pairs - Array of G1/G2 point pairs
 * @returns {{value: bigint}} Pairing result
 * @throws {never}
 * @example
 * ```javascript
 * import * as Pairing from './crypto/bn254/Pairing/index.js';
 * import * as G1 from './crypto/bn254/G1/index.js';
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const p1 = G1.generator();
 * const q1 = G2.generator();
 * const p2 = G1.mul(p1, 2n);
 * const q2 = G2.mul(q1, 3n);
 * const result = Pairing.multiPairing([[p1, q1], [p2, q2]]);
 * ```
 */
export function multiPairing(pairs) {
	const accumulator = pairingResultOne();

	for (const [p, q] of pairs) {
		const result = millerLoop(p, q);
		accumulator.value = Fr.mul(accumulator.value, result.value);
	}

	return finalExponentiation(accumulator);
}
