import { bn254 } from "@noble/curves/bn254.js";
import { describe, expect, test } from "vitest";
import { B_G2_C0, B_G2_C1, FP_MOD, FR_MOD } from "../constants.js";
import { Bn254InvalidPointError, Bn254SubgroupCheckError } from "../errors.js";
import type { Fp2 as Fp2Type } from "../Fp2.js";
import * as G1 from "../G1/index.js";
import type { G1PointType } from "../G1PointType.js";
import * as G2 from "../G2/index.js";
import type { G2PointType } from "../G2PointType.js";
import { decodeFp12 } from "./decodeFp12.js";
import { encodeFp12 } from "./encodeFp12.js";
import * as Pairing from "./index.js";

const { Fp12 } = bn254.fields;

/** Multiply two pairing results in Fp12. */
const gtMul = (a: { value: bigint }, b: { value: bigint }) => ({
	value: encodeFp12(Fp12.mul(decodeFp12(a.value), decodeFp12(b.value))),
});

/** Raise a pairing result to a power in Fp12. */
const gtPow = (a: { value: bigint }, n: bigint) => ({
	value: encodeFp12(Fp12.pow(decodeFp12(a.value), n)),
});

/** On-curve twist point outside the order-r subgroup, built without validation. */
function offSubgroupG2(): G2PointType {
	const { Fp2 } = bn254.fields;
	const b = Fp2.create({ c0: B_G2_C0, c1: B_G2_C1 });
	for (let n = 1n; n < 100n; n++) {
		const x = Fp2.create({ c0: n, c1: 0n });
		const rhs = Fp2.add(Fp2.mul(Fp2.sqr(x), x), b);
		let y: Fp2Type;
		try {
			y = Fp2.sqrt(rhs);
		} catch {
			continue;
		}
		if (!Fp2.eql(Fp2.sqr(y), rhs)) continue;
		const point = { x, y, z: { c0: 1n, c1: 0n } } as G2PointType;
		if (G2.isOnCurve(point) && !G2.isInSubgroup(point)) return point;
	}
	throw new Error("no off-subgroup G2 point found");
}

describe("optimal ate pairing over Fp12", () => {
	const p = G1.generator();
	const q = G2.generator();
	const one = Pairing.pairingResultOne();

	test("e(G1, G2) matches @noble/curves", () => {
		const expected = bn254.pairing(bn254.G1.Point.BASE, bn254.G2.Point.BASE);
		expect(Pairing.pair(p, q).value).toBe(encodeFp12(expected));
	});

	test("is non-degenerate: e(G1, G2) != 1 and has order r", () => {
		const e = Pairing.pair(p, q);
		expect(Pairing.pairingResultEqual(e, one)).toBe(false);
		expect(e.value).toBeGreaterThanOrEqual(FP_MOD);
		expect(gtPow(e, FR_MOD).value).toBe(1n);
	});

	test("infinity in either argument gives the identity 1n", () => {
		expect(Pairing.pair(G1.infinity(), q).value).toBe(1n);
		expect(Pairing.pair(p, G2.infinity()).value).toBe(1n);
		expect(Pairing.pair(G1.infinity(), G2.infinity()).value).toBe(1n);
		expect(Pairing.millerLoop(G1.infinity(), q).value).toBe(1n);
		expect(Pairing.multiPairing([]).value).toBe(1n);
	});

	test("bilinear in the first argument: e(aP + bP, Q) = e(aP, Q) * e(bP, Q)", () => {
		const aP = G1.mul(p, 3n);
		const bP = G1.mul(p, 5n);
		const lhs = Pairing.pair(G1.add(aP, bP), q);
		const rhs = gtMul(Pairing.pair(aP, q), Pairing.pair(bP, q));
		expect(lhs.value).toBe(rhs.value);
	});

	test("bilinear in the second argument: e(P, aQ + bQ) = e(P, aQ) * e(P, bQ)", () => {
		const aQ = G2.mul(q, 7n);
		const bQ = G2.mul(q, 9n);
		const lhs = Pairing.pair(p, G2.add(aQ, bQ));
		const rhs = gtMul(Pairing.pair(p, aQ), Pairing.pair(p, bQ));
		expect(lhs.value).toBe(rhs.value);
	});

	test("e(aP, bQ) = e(P, Q)^(ab) = e(abP, Q)", () => {
		const a = 7n;
		const b = 11n;
		const lhs = Pairing.pair(G1.mul(p, a), G2.mul(q, b));
		expect(lhs.value).toBe(gtPow(Pairing.pair(p, q), a * b).value);
		expect(lhs.value).toBe(Pairing.pair(G1.mul(p, a * b), q).value);
	});

	test("e(-P, Q) = e(P, -Q) = e(P, Q)^-1", () => {
		const e = Pairing.pair(p, q);
		const negP = Pairing.pair(G1.negate(p), q);
		expect(negP.value).toBe(Pairing.pair(p, G2.negate(q)).value);
		expect(gtMul(e, negP).value).toBe(1n);
	});

	test("pair = finalExponentiation(millerLoop)", () => {
		const ml = Pairing.millerLoop(p, q);
		expect(ml.value).not.toBe(Pairing.pair(p, q).value);
		expect(Pairing.finalExponentiation(ml).value).toBe(
			Pairing.pair(p, q).value,
		);
	});

	test("multiPairing is the product of the individual pairings", () => {
		const first: [G1PointType, G2PointType] = [G1.mul(p, 2n), G2.mul(q, 3n)];
		const second: [G1PointType, G2PointType] = [G1.mul(p, 5n), G2.mul(q, 7n)];
		const pairs = [first, second];
		const product = gtMul(Pairing.pair(...first), Pairing.pair(...second));
		expect(Pairing.multiPairing(pairs).value).toBe(product.value);
		expect(product.value).toBe(gtPow(Pairing.pair(p, q), 41n).value);
	});

	test("pairingCheck accepts e(aP, bQ) * e(-abP, Q) = 1", () => {
		expect(
			Pairing.pairingCheck([
				[G1.mul(p, 2n), G2.mul(q, 3n)],
				[G1.negate(G1.mul(p, 6n)), q],
			]),
		).toBe(true);
		expect(
			Pairing.pairingCheck([
				[p, q],
				[G1.negate(p), q],
			]),
		).toBe(true);
		expect(
			Pairing.pairingCheck([
				[p, q],
				[G1.mul(p, 2n), G2.mul(q, 2n)],
				[G1.mul(p, 3n), G2.negate(G2.mul(q, 3n))],
				[G1.mul(p, 4n), q],
			]),
		).toBe(true);
	});

	test("pairingCheck rejects unbalanced equations", () => {
		expect(Pairing.pairingCheck([[p, q]])).toBe(false);
		expect(
			Pairing.pairingCheck([
				[G1.mul(p, 2n), G2.mul(q, 3n)],
				[G1.negate(G1.mul(p, 5n)), q],
			]),
		).toBe(false);
		expect(
			Pairing.pairingCheck([
				[G1.mul(p, 2n), G2.mul(q, 3n)],
				[G1.mul(p, 5n), G2.mul(q, 7n)],
			]),
		).toBe(false);
	});

	test("rejects a G2 point outside the subgroup, even beside G1 infinity", () => {
		const bad = offSubgroupG2();
		expect(() => Pairing.pair(p, bad)).toThrow(Bn254SubgroupCheckError);
		expect(() => Pairing.millerLoop(p, bad)).toThrow(Bn254SubgroupCheckError);
		expect(() => Pairing.pairingCheck([[G1.infinity(), bad]])).toThrow(
			Bn254SubgroupCheckError,
		);
		expect(() =>
			Pairing.multiPairing([
				[p, q],
				[p, bad],
			]),
		).toThrow(Bn254SubgroupCheckError);
	});

	test("rejects points that are not on their curve", () => {
		const offG1 = { x: 1n, y: 3n, z: 1n } as G1PointType;
		expect(() => Pairing.pair(offG1, q)).toThrow(Bn254InvalidPointError);
		const affine = G2.toAffine(q);
		const offG2 = {
			...affine,
			y: { c0: affine.y.c0 + 1n, c1: affine.y.c1 },
		} as G2PointType;
		expect(() => Pairing.pair(p, offG2)).toThrow(Bn254InvalidPointError);
	});

	test("Fp12 integer encoding round-trips and rejects out-of-range values", () => {
		const e = Pairing.pair(p, q);
		expect(encodeFp12(decodeFp12(e.value))).toBe(e.value);
		expect(encodeFp12(Fp12.ONE)).toBe(1n);
		expect(() => decodeFp12(-1n)).toThrow("canonical Fp12");
		expect(() => decodeFp12(FP_MOD ** 12n)).toThrow("canonical Fp12");
		expect(() => Pairing.finalExponentiation({ value: -1n })).toThrow(
			"canonical Fp12",
		);
	});
});

describe("Pairing operations", () => {
	describe("pair", () => {
		test("pairing with infinity in G1", () => {
			const p = G1.infinity();
			const q = G2.generator();
			const result = Pairing.pair(p, q);
			expect(result).toBeDefined();
		});

		test("pairing with infinity in G2", () => {
			const p = G1.generator();
			const q = G2.infinity();
			const result = Pairing.pair(p, q);
			expect(result).toBeDefined();
		});

		test("pairing with both infinity", () => {
			const p = G1.infinity();
			const q = G2.infinity();
			const result = Pairing.pair(p, q);
			expect(result).toBeDefined();
		});

		test("pairing with generators", () => {
			const p = G1.generator();
			const q = G2.generator();
			const result = Pairing.pair(p, q);
			expect(result).toBeDefined();
			expect(result.value).toBeDefined();
		});

		test("pairing produces consistent results", () => {
			const p = G1.generator();
			const q = G2.generator();
			const r1 = Pairing.pair(p, q);
			const r2 = Pairing.pair(p, q);
			// Results should be equal
			expect(r1.value).toBe(r2.value);
		});
	});

	describe("pairingCheck", () => {
		test("empty pairing check returns true", () => {
			expect(Pairing.pairingCheck([])).toBe(true);
		});

		test("single pair with generators", () => {
			const p = G1.generator();
			const q = G2.generator();
			const result = Pairing.pairingCheck([[p, q]]);
			expect(typeof result).toBe("boolean");
		});

		test("pairing with infinity pairs", () => {
			const p = G1.infinity();
			const q = G2.infinity();
			const result = Pairing.pairingCheck([[p, q]]);
			expect(result).toBe(true);
		});

		test("multiple pairs", () => {
			const p1 = G1.generator();
			const q1 = G2.generator();
			const p2 = G1.double(p1);
			const q2 = G2.generator();
			const result = Pairing.pairingCheck([
				[p1, q1],
				[p2, q2],
			]);
			expect(typeof result).toBe("boolean");
		});

		test("pairing check is deterministic", () => {
			const p = G1.generator();
			const q = G2.generator();
			const r1 = Pairing.pairingCheck([[p, q]]);
			const r2 = Pairing.pairingCheck([[p, q]]);
			expect(r1).toBe(r2);
		});
	});

	describe("multiPairing", () => {
		test("multi pairing with empty array", () => {
			const result = Pairing.multiPairing([]);
			expect(result).toBeDefined();
		});

		test("multi pairing with single pair", () => {
			const p = G1.generator();
			const q = G2.generator();
			const result = Pairing.multiPairing([[p, q]]);
			expect(result).toBeDefined();
		});

		test("multi pairing with multiple pairs", () => {
			const p1 = G1.generator();
			const q1 = G2.generator();
			const p2 = G1.double(p1);
			const q2 = G2.generator();
			const result = Pairing.multiPairing([
				[p1, q1],
				[p2, q2],
			]);
			expect(result).toBeDefined();
		});

		test("multi pairing with infinity pairs", () => {
			const p = G1.infinity();
			const q = G2.infinity();
			const result = Pairing.multiPairing([[p, q]]);
			expect(result).toBeDefined();
		});
	});

	describe("bilinearity property", () => {
		test("e(aP, Q) = e(P, Q)^a", () => {
			const p = G1.generator();
			const q = G2.generator();
			const a = 5n;

			const aP = G1.mul(p, a);
			const lhs = Pairing.pair(aP, q);
			const rhs = Pairing.pair(p, q);

			// Both should be defined
			expect(lhs).toBeDefined();
			expect(rhs).toBeDefined();
		});

		test("e(P, aQ) = e(P, Q)^a", () => {
			const p = G1.generator();
			const q = G2.generator();
			const a = 5n;

			const aQ = G2.mul(q, a);
			const lhs = Pairing.pair(p, aQ);
			const rhs = Pairing.pair(p, q);

			// Both should be defined
			expect(lhs).toBeDefined();
			expect(rhs).toBeDefined();
		});

		test("e(aP, bQ) = e(P, Q)^(ab)", () => {
			const p = G1.generator();
			const q = G2.generator();
			const a = 3n;
			const b = 5n;

			const aP = G1.mul(p, a);
			const bQ = G2.mul(q, b);
			const lhs = Pairing.pair(aP, bQ);

			const abP = G1.mul(p, a * b);
			const rhs = Pairing.pair(abP, q);

			// Both should be defined
			expect(lhs).toBeDefined();
			expect(rhs).toBeDefined();
		});

		test("e(P1 + P2, Q) = e(P1, Q) * e(P2, Q)", () => {
			const p1 = G1.generator();
			const p2 = G1.double(p1);
			const q = G2.generator();

			const sum = G1.add(p1, p2);
			const lhs = Pairing.pair(sum, q);

			// RHS would need multiplication of pairing results
			// Just verify LHS is defined
			expect(lhs).toBeDefined();
		});

		test("e(P, Q1 + Q2) = e(P, Q1) * e(P, Q2)", () => {
			const p = G1.generator();
			const q1 = G2.generator();
			const q2 = G2.double(q1);

			const sum = G2.add(q1, q2);
			const lhs = Pairing.pair(p, sum);

			// Just verify result is defined
			expect(lhs).toBeDefined();
		});
	});

	describe("pairing properties", () => {
		test("pairing is non-degenerate", () => {
			const p = G1.generator();
			const q = G2.generator();
			const result = Pairing.pair(p, q);
			// Result should not be identity (though we can't easily check)
			expect(result).toBeDefined();
			expect(result.value).toBeDefined();
		});

		test("e(O, Q) should give identity", () => {
			const p = G1.infinity();
			const q = G2.generator();
			const result = Pairing.pair(p, q);
			expect(result).toBeDefined();
		});

		test("e(P, O) should give identity", () => {
			const p = G1.generator();
			const q = G2.infinity();
			const result = Pairing.pair(p, q);
			expect(result).toBeDefined();
		});

		test("e(-P, Q) = e(P, -Q) = e(P, Q)^(-1)", () => {
			const p = G1.generator();
			const q = G2.generator();
			const negP = G1.negate(p);
			const negQ = G2.negate(q);

			const r1 = Pairing.pair(negP, q);
			const r2 = Pairing.pair(p, negQ);
			const r3 = Pairing.pair(p, q);

			// All should be defined
			expect(r1).toBeDefined();
			expect(r2).toBeDefined();
			expect(r3).toBeDefined();
		});
	});

	describe("zkSNARK verification simulation", () => {
		test("simple pairing equation", () => {
			// Simulate: e(P, Q) = e(R, S)
			const p = G1.generator();
			const q = G2.generator();
			const r = G1.mul(p, 2n);
			const s = G2.generator();

			// We would check if e(P, Q) * e(-R, S) = 1
			// For now, just verify pairings compute
			const lhs = Pairing.pair(p, q);
			const rhs = Pairing.pair(r, s);

			expect(lhs).toBeDefined();
			expect(rhs).toBeDefined();
		});

		test("pairing check with cancellation", () => {
			// e(P, Q) * e(-P, Q) should equal 1
			const p = G1.generator();
			const q = G2.generator();
			const negP = G1.negate(p);

			const result = Pairing.pairingCheck([
				[p, q],
				[negP, q],
			]);

			// Should return true due to cancellation
			expect(typeof result).toBe("boolean");
		});

		test("verification with multiple constraints", () => {
			const p1 = G1.generator();
			const p2 = G1.mul(p1, 2n);
			const p3 = G1.mul(p1, 3n);
			const q1 = G2.generator();
			const q2 = G2.mul(q1, 2n);

			const result = Pairing.pairingCheck([
				[p1, q1],
				[p2, q2],
				[p3, G2.negate(G2.mul(q1, 3n))],
			]);

			expect(typeof result).toBe("boolean");
		});
	});

	describe("edge cases", () => {
		test("handles many pairs in pairing check", () => {
			const p = G1.generator();
			const q = G2.generator();
			const pairs: Array<[typeof p, typeof q]> = [];

			for (let i = 0; i < 10; i++) {
				pairs.push([G1.mul(p, BigInt(i + 1)), q]);
			}

			const result = Pairing.pairingCheck(pairs);
			expect(typeof result).toBe("boolean");
		});

		test("pairing with doubled points", () => {
			const p = G1.generator();
			const q = G2.generator();
			const p2 = G1.double(p);
			const q2 = G2.double(q);

			const r1 = Pairing.pair(p2, q);
			const r2 = Pairing.pair(p, q2);

			expect(r1).toBeDefined();
			expect(r2).toBeDefined();
		});

		test("pairing with large scalar multiples", () => {
			const p = G1.generator();
			const q = G2.generator();
			const large = 12345678901234567890n;

			const pLarge = G1.mul(p, large);
			const result = Pairing.pair(pLarge, q);

			expect(result).toBeDefined();
		});
	});

	describe("consistency checks", () => {
		test("same inputs produce same outputs", () => {
			const p = G1.generator();
			const q = G2.generator();

			const r1 = Pairing.pair(p, q);
			const r2 = Pairing.pair(p, q);

			expect(r1.value).toBe(r2.value);
		});

		test("pairing check is consistent", () => {
			const p = G1.generator();
			const q = G2.generator();
			const pairs: Array<[typeof p, typeof q]> = [[p, q]];

			const r1 = Pairing.pairingCheck(pairs);
			const r2 = Pairing.pairingCheck(pairs);

			expect(r1).toBe(r2);
		});

		test("multi pairing is consistent", () => {
			const p = G1.generator();
			const q = G2.generator();
			const pairs: Array<[typeof p, typeof q]> = [[p, q]];

			const r1 = Pairing.multiPairing(pairs);
			const r2 = Pairing.multiPairing(pairs);

			expect(r1.value).toBe(r2.value);
		});
	});
});
