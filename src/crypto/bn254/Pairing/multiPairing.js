import * as Fr from "../Fr/index.js";
import { finalExponentiation } from "./finalExponentiation.js";
import { millerLoop } from "./millerLoop.js";
import { pairingResultOne } from "./pairingResult.js";

/**
 * Multi-pairing: compute product of pairings
 *
 * More efficient than computing pairings individually
 *
 * @param {Array<[import('../BrandedG1Point.js').BrandedG1Point, import('../BrandedG2Point.js').BrandedG2Point]>} pairs - Array of G1/G2 point pairs
 * @returns {{value: bigint}} Pairing result
 *
 * @example
 * ```typescript
 * const result = multiPairing([[p1, q1], [p2, q2]]);
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
