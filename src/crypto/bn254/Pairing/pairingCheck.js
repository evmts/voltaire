import * as Fr from "../Fr/index.js";
import { finalExponentiation } from "./finalExponentiation.js";
import { millerLoop } from "./millerLoop.js";
import { pairingResultEqual, pairingResultOne } from "./pairingResult.js";

/**
 * Pairing product check: e(P1,Q1) * e(P2,Q2) * ... = 1
 *
 * Used for zkSNARK verification
 *
 * @param {Array<[import('../BrandedG1Point.js').BrandedG1Point, import('../BrandedG2Point.js').BrandedG2Point]>} pairs - Array of G1/G2 point pairs
 * @returns {boolean} True if pairing product equals 1
 *
 * @example
 * ```typescript
 * const valid = pairingCheck([[p1, q1], [p2, q2]]);
 * ```
 */
export function pairingCheck(pairs) {
	if (pairs.length === 0) return true;

	const accumulator = pairingResultOne();

	for (const [p, q] of pairs) {
		const result = millerLoop(p, q);
		accumulator.value = Fr.mul(accumulator.value, result.value);
	}

	const final = finalExponentiation(accumulator);
	return pairingResultEqual(final, pairingResultOne());
}
