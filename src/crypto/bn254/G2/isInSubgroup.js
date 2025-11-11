import { FR_MOD } from "../constants.js";
import { isOnCurve } from "./isOnCurve.js";
import { isZero } from "./isZero.js";
import { mul } from "./mul.js";

/**
 * Check if G2 point is in the correct subgroup
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../BrandedG2Point.js').BrandedG2Point} point - Point to check
 * @returns {boolean} True if in subgroup
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const point = G2.generator();
 * if (G2.isInSubgroup(point)) {
 *   console.log('Point is in subgroup');
 * }
 * ```
 */
export function isInSubgroup(point) {
	if (isZero(point)) return true;
	if (!isOnCurve(point)) return false;

	const orderMul = mul(point, FR_MOD);
	return isZero(orderMul);
}
