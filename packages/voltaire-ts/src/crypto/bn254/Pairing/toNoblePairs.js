import { bn254 } from "@noble/curves/bn254.js";
import { Bn254InvalidPointError, Bn254SubgroupCheckError } from "../errors.js";
import * as G1 from "../G1/index.js";
import * as G2 from "../G2/index.js";

/**
 * Validate G1/G2 pairs and convert them to `@noble/curves` points.
 *
 * Pairs holding a point at infinity contribute the identity to a pairing
 * product, so they are dropped.
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {ReadonlyArray<readonly [import('../G1PointType.js').G1PointType, import('../G2PointType.js').G2PointType]>} pairs - G1/G2 point pairs
 * @returns {{ g1: import('@noble/curves/abstract/weierstrass.js').WeierstrassPoint<bigint>, g2: import('@noble/curves/abstract/weierstrass.js').WeierstrassPoint<import('../Fp2.js').Fp2> }[]} Pairs for `bn254.pairingBatch`
 * @throws {Bn254InvalidPointError} If a point is not on its curve
 * @throws {Bn254SubgroupCheckError} If a G2 point is outside the order-r subgroup
 * @example
 * ```javascript
 * import { toNoblePairs } from './crypto/bn254/Pairing/toNoblePairs.js';
 * const pairs = toNoblePairs([[G1.generator(), G2.generator()]]);
 * ```
 */
export function toNoblePairs(pairs) {
	const out = [];
	for (const [p, q] of pairs) {
		if (!G1.isOnCurve(p)) {
			throw new Bn254InvalidPointError("Point not on bn254 G1 curve", {
				code: -32602,
				context: { curve: "G1" },
				docsPath: "/crypto/bn254#pairing",
			});
		}
		if (!G2.isOnCurve(q)) {
			throw new Bn254InvalidPointError("Point not on bn254 G2 curve", {
				code: -32602,
				context: { curve: "G2" },
				docsPath: "/crypto/bn254#pairing",
			});
		}
		if (!G2.isInSubgroup(q)) {
			throw new Bn254SubgroupCheckError("Point not in bn254 G2 subgroup", {
				code: -32602,
				docsPath: "/crypto/bn254#subgroup-check",
			});
		}
		if (G1.isZero(p) || G2.isZero(q)) continue;
		const pa = G1.toAffine(p);
		const qa = G2.toAffine(q);
		out.push({
			g1: bn254.G1.Point.fromAffine({ x: pa.x, y: pa.y }),
			g2: bn254.G2.Point.fromAffine({ x: qa.x, y: qa.y }),
		});
	}
	return out;
}
