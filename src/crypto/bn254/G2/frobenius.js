import * as Fp2 from "../Fp2/index.js";

/**
 * Frobenius endomorphism for G2
 *
 * @param {import('../BrandedG2Point.js').BrandedG2Point} point - Point
 * @returns {import('../BrandedG2Point.js').BrandedG2Point} Frobenius map result
 *
 * @example
 * ```typescript
 * const frob = frobenius(point);
 * ```
 */
export function frobenius(point) {
	const x_frob = Fp2.frobeniusMap(point.x);
	const y_frob = Fp2.frobeniusMap(point.y);
	const z_frob = Fp2.frobeniusMap(point.z);

	const frob_x_coeff = Fp2.create(
		9383897711787803092255416352689191878403287165598960768464489826468298733608n,
		0n,
	);
	const frob_y_coeff = Fp2.create(
		3691141430098779044309249828556373330968186103586981319701354368538621085069n,
		19668488431335630914265087332861993377664586457237624504494953988981847398421n,
	);

	return /** @type {import('../BrandedG2Point.js').BrandedG2Point} */ ({
		x: Fp2.mul(x_frob, frob_x_coeff),
		y: Fp2.mul(y_frob, frob_y_coeff),
		z: z_frob,
	});
}
