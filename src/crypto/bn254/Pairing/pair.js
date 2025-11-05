import { finalExponentiation } from "./finalExponentiation.js";
import { millerLoop } from "./millerLoop.js";

/**
 * Compute optimal ate pairing e(P, Q)
 *
 * @param {import('../BrandedG1Point.js').BrandedG1Point} p - Point in G1
 * @param {import('../BrandedG2Point.js').BrandedG2Point} q - Point in G2
 * @returns {{value: bigint}} Pairing result
 *
 * @example
 * ```typescript
 * const result = pair(p, q);
 * ```
 */
export function pair(p, q) {
	const ml = millerLoop(p, q);
	return finalExponentiation(ml);
}
