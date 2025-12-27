import * as Fp2 from "../Fp2/index.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";

/**
 * Double a G2 point using Jacobian coordinates
 * Algorithm: https://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian.html#doubling-dbl-2007-bl
 *
 * @param {import('../G2PointType.js').G2PointType} point - Point to double
 * @returns {import('../G2PointType.js').G2PointType}
 */
export function double_(point) {
	if (isZero(point)) return infinity();

	const { x, y, z } = point;

	// 2P = O if y = 0
	if (Fp2.isZero(y)) return infinity();

	// xx = X1^2
	const xx = Fp2.square(x);
	// yy = Y1^2
	const yy = Fp2.square(y);
	// yyyy = YY^2
	const yyyy = Fp2.square(yy);
	// zz = Z1^2
	const zz = Fp2.square(z);

	// s = 2*((X1+YY)^2-XX-YYYY)
	const xPlusYY = Fp2.add(x, yy);
	const s = Fp2.mulScalar(
		Fp2.sub(Fp2.sub(Fp2.square(xPlusYY), xx), yyyy),
		2n,
	);

	// m = 3*XX (a=0 for BLS12-381 G2)
	const m = Fp2.mulScalar(xx, 3n);

	// X3 = M^2-2*S
	const x3 = Fp2.sub(Fp2.square(m), Fp2.mulScalar(s, 2n));

	// Y3 = M*(S-X3)-8*YYYY
	const y3 = Fp2.sub(Fp2.mul(m, Fp2.sub(s, x3)), Fp2.mulScalar(yyyy, 8n));

	// Z3 = (Y1+Z1)^2-YY-ZZ
	const yPlusZ = Fp2.add(y, z);
	const z3 = Fp2.sub(Fp2.sub(Fp2.square(yPlusZ), yy), zz);

	return /** @type {import('../G2PointType.js').G2PointType} */ ({
		x: x3,
		y: y3,
		z: z3,
	});
}

// Export as double since double is a reserved word
export { double_ as double };
