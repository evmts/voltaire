// @ts-nocheck
/**
 * BN254 (BN128) Elliptic Curve Cryptography
 *
 * Complete implementation of BN254 pairing-friendly curve used in zkSNARKs.
 * Includes G1, G2 point operations and optimal ate pairing.
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @example
 * ```javascript
 * import { BN254 } from './crypto/bn254/BN254.js';
 *
 * // G1 operations
 * const p1 = BN254.G1.generator();
 * const p2 = BN254.G1.mul(p1, 5n);
 * const p3 = BN254.G1.add(p1, p2);
 *
 * // G2 operations
 * const q1 = BN254.G2.generator();
 * const q2 = BN254.G2.mul(q1, 3n);
 *
 * // Pairing
 * const result = BN254.Pairing.pair(p1, q1);
 * const valid = BN254.Pairing.pairingCheck([[p1, q1], [p2, q2]]);
 * ```
 */

export * from "./errors.js";
export * from "./constants.js";
export * from "./BrandedG1Point.js";
export * from "./BrandedG2Point.js";
export * from "./Fp2.js";

import * as Fp from "./Fp/index.js";
import * as Fp2 from "./Fp2/index.js";
import * as Fr from "./Fr/index.js";
import * as G1 from "./G1/index.js";
import * as G2 from "./G2/index.js";
import * as Pairing from "./Pairing/index.js";
import { deserializeG1 } from "./deserializeG1.js";
import { deserializeG2 } from "./deserializeG2.js";
import { serializeG1 } from "./serializeG1.js";
import { serializeG2 } from "./serializeG2.js";

export { Fp, Fp2, Fr, G1, G2, Pairing };

export { serializeG1, deserializeG1, serializeG2, deserializeG2 };

/**
 * BN254 main export
 */
export const BN254 = {
	Fp,
	Fp2,
	Fr,
	G1,
	G2,
	Pairing,
	serializeG1,
	deserializeG1,
	serializeG2,
	deserializeG2,
};

export default BN254;
