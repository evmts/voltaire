import type { brand } from "../../brand.js";
import type { Fp2Type } from "./Fp2Type.js";

/**
 * BLS12-381 G2 point type in projective coordinates
 *
 * G2 is the extension field elliptic curve group over Fp2.
 * Points are stored in Jacobian projective coordinates (x, y, z)
 * where x, y, z are Fp2 elements.
 *
 * Curve equation: y^2 = x^3 + 4(1+i) over Fp2
 *
 * @since 0.0.0
 */
export type G2PointType = {
	/** x-coordinate in projective form (Fp2 element) */
	x: Fp2Type;
	/** y-coordinate in projective form (Fp2 element) */
	y: Fp2Type;
	/** z-coordinate (projective scaling factor, Fp2 element) */
	z: Fp2Type;
	readonly [brand]: "Bls12381G2Point";
};
