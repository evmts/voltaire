import * as Fp2 from "../Fp2/index.js";

const frob_x_coeff = Fp2.create(
	21575463638280843010398324269430826099269044274347216827212613867836435027261n,
	10307601595873709700152284273816112264069230130616436755625194854815875713954n,
);

const frob_y_coeff = Fp2.create(
	2821565182194536844548159561693502659359617185244120367078079554186484126554n,
	3505843767911556378687030309984248845540243509899259641013678093033130930403n,
);

/**
 * Frobenius endomorphism for G2
 *
 * @param {import('../BrandedG2Point.js').BrandedG2Point} point - Point
 * @param {bigint} power - Number of times to apply frobenius
 * @returns {import('../BrandedG2Point.js').BrandedG2Point} Frobenius map result
 *
 * @example
 * ```typescript
 * const frob = frobenius(point, 1n);
 * ```
 */
export function frobenius(point, power = 1n) {
	if (power === 0n) return point;

	let result = point;
	for (let i = 0n; i < power; i++) {
		const x_frob = Fp2.frobeniusMap(result.x);
		const y_frob = Fp2.frobeniusMap(result.y);
		const z_frob = Fp2.frobeniusMap(result.z);

		result = /** @type {import('../BrandedG2Point.js').BrandedG2Point} */ ({
			x: Fp2.mul(x_frob, frob_x_coeff),
			y: Fp2.mul(y_frob, frob_y_coeff),
			z: z_frob,
		});
	}
	return result;
}
