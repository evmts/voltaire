import type { brand } from "../../brand.js";

/**
 * BLS12-381 G1 point type in projective coordinates
 *
 * G1 is the base field elliptic curve group over Fp.
 * Points are stored in Jacobian projective coordinates (x, y, z)
 * where the affine point is (x/z^2, y/z^3).
 *
 * Curve equation: y^2 = x^3 + 4 over Fp
 *
 * @since 0.0.0
 */
export type G1PointType = {
	/** x-coordinate in projective form */
	x: bigint;
	/** y-coordinate in projective form */
	y: bigint;
	/** z-coordinate (projective scaling factor) */
	z: bigint;
	readonly [brand]: "Bls12381G1Point";
};
