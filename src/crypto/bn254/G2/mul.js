import * as Fr from "../Fr/index.js";
import { add } from "./add.js";
import { double } from "./double.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";

/**
 * Scalar multiplication of G2 point
 *
 * @param {import('../BrandedG2Point.js').BrandedG2Point} point - Point to multiply
 * @param {bigint} scalar - Scalar multiplier
 * @returns {import('../BrandedG2Point.js').BrandedG2Point} Result
 *
 * @example
 * ```typescript
 * const result = mul(point, 5n);
 * ```
 */
export function mul(point, scalar) {
	if (scalar === 0n || isZero(point)) return infinity();

	const s = Fr.mod(scalar);
	let result = infinity();
	let base = point;

	let n = s;
	while (n > 0n) {
		if (n & 1n) {
			result = add(result, base);
		}
		base = double(base);
		n >>= 1n;
	}

	return result;
}
