// @ts-nocheck
/**
 * BLS12-381 Elliptic Curve Cryptography
 *
 * Complete implementation of BLS12-381 pairing-friendly curve used in
 * Ethereum consensus layer (Beacon Chain) for BLS signatures.
 *
 * Includes G1, G2 point operations and pairing operations.
 *
 * @see https://voltaire.tevm.sh/crypto/bls12-381 for BLS12-381 documentation
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/Bls12381.js';
 *
 * // G1 operations
 * const p1 = Bls12381.G1.generator();
 * const p2 = Bls12381.G1.mul(p1, 5n);
 * const p3 = Bls12381.G1.add(p1, p2);
 *
 * // G2 operations
 * const q1 = Bls12381.G2.generator();
 * const q2 = Bls12381.G2.mul(q1, 3n);
 *
 * // Check if points are on curve
 * console.log(Bls12381.G1.isOnCurve(p3)); // true
 * console.log(Bls12381.G2.isOnCurve(q2)); // true
 * ```
 */

export * from "./errors.js";
export * from "./constants.js";
export * from "./G1PointType.js";
export * from "./G2PointType.js";
export * from "./Fp2Type.js";

import * as Fp from "./Fp/index.js";
import * as Fp2 from "./Fp2/index.js";
import * as Fr from "./Fr/index.js";
import * as G1 from "./G1/index.js";
import * as G2 from "./G2/index.js";
import * as Pairing from "./Pairing/index.js";

export { Fp, Fp2, Fr, G1, G2, Pairing };

/**
 * Bls12381 main export
 */
export const Bls12381 = {
	Fp,
	Fp2,
	Fr,
	G1,
	G2,
	Pairing,
};

export default Bls12381;
