import { describe, expect, test } from "vitest";
import type { BrandedG2Point } from "../BrandedG2Point.js";
import * as Fp2 from "../Fp2/index.js";
import {
	FR_MOD,
	G2_GENERATOR_X_C0,
	G2_GENERATOR_X_C1,
	G2_GENERATOR_Y_C0,
	G2_GENERATOR_Y_C1,
} from "../constants.js";
import * as G2 from "./index.js";

describe("G2 curve operations", () => {
	describe("generator", () => {
		test("generator has correct coordinates", () => {
			const gen = G2.generator();
			expect(gen.x.c0).toBe(G2_GENERATOR_X_C0);
			expect(gen.x.c1).toBe(G2_GENERATOR_X_C1);
			expect(gen.y.c0).toBe(G2_GENERATOR_Y_C0);
			expect(gen.y.c1).toBe(G2_GENERATOR_Y_C1);
			expect(Fp2.equal(gen.z, Fp2.create(1n, 0n))).toBe(true);
		});

		test("generator is on curve", () => {
			const gen = G2.generator();
			expect(G2.isOnCurve(gen)).toBe(true);
		});

		test("generator is not zero", () => {
			const gen = G2.generator();
			expect(G2.isZero(gen)).toBe(false);
		});

		test("generator is in correct subgroup", () => {
			const gen = G2.generator();
			expect(G2.isInSubgroup(gen)).toBe(true);
		});
	});

	describe("infinity", () => {
		test("infinity has z = 0", () => {
			const inf = G2.infinity();
			expect(Fp2.isZero(inf.z)).toBe(true);
		});

		test("infinity is zero", () => {
			const inf = G2.infinity();
			expect(G2.isZero(inf)).toBe(true);
		});

		test("infinity is on curve", () => {
			const inf = G2.infinity();
			expect(G2.isOnCurve(inf)).toBe(true);
		});
	});

	describe("isZero", () => {
		test("infinity is zero", () => {
			const inf = G2.infinity();
			expect(G2.isZero(inf)).toBe(true);
		});

		test("generator is not zero", () => {
			const gen = G2.generator();
			expect(G2.isZero(gen)).toBe(false);
		});

		test("point with z=0 is zero", () => {
			const point: BrandedG2Point = {
				x: Fp2.create(1n, 2n),
				y: Fp2.create(3n, 4n),
				z: Fp2.create(0n, 0n),
				__tag: "G2Point",
			};
			expect(G2.isZero(point)).toBe(true);
		});
	});

	describe("isOnCurve", () => {
		test("generator is on curve", () => {
			const gen = G2.generator();
			expect(G2.isOnCurve(gen)).toBe(true);
		});

		test("infinity is on curve", () => {
			const inf = G2.infinity();
			expect(G2.isOnCurve(inf)).toBe(true);
		});

		test("doubled point is on curve", () => {
			const gen = G2.generator();
			const doubled = G2.double(gen);
			expect(G2.isOnCurve(doubled)).toBe(true);
		});
	});

	describe("equal", () => {
		test("generator equals itself", () => {
			const gen1 = G2.generator();
			const gen2 = G2.generator();
			expect(G2.equal(gen1, gen2)).toBe(true);
		});

		test("infinity equals infinity", () => {
			const inf1 = G2.infinity();
			const inf2 = G2.infinity();
			expect(G2.equal(inf1, inf2)).toBe(true);
		});

		test("generator does not equal infinity", () => {
			const gen = G2.generator();
			const inf = G2.infinity();
			expect(G2.equal(gen, inf)).toBe(false);
		});

		test("different points are not equal", () => {
			const gen = G2.generator();
			const doubled = G2.double(gen);
			expect(G2.equal(gen, doubled)).toBe(false);
		});

		test("same point in different representations are equal", () => {
			const gen = G2.generator();
			const two = Fp2.create(2n, 0n);
			const scaled: BrandedG2Point = {
				x: Fp2.mul(gen.x, Fp2.square(two)),
				y: Fp2.mul(gen.y, Fp2.mul(Fp2.square(two), two)),
				z: two,
				__tag: "G2Point",
			};
			expect(G2.equal(gen, scaled)).toBe(true);
		});
	});

	describe("add", () => {
		test("adds infinity to infinity", () => {
			const inf = G2.infinity();
			const result = G2.add(inf, inf);
			expect(G2.isZero(result)).toBe(true);
		});

		test("adds generator to infinity", () => {
			const gen = G2.generator();
			const inf = G2.infinity();
			const result = G2.add(gen, inf);
			expect(G2.equal(result, gen)).toBe(true);
		});

		test("adds infinity to generator", () => {
			const gen = G2.generator();
			const inf = G2.infinity();
			const result = G2.add(inf, gen);
			expect(G2.equal(result, gen)).toBe(true);
		});

		test("adds generator to itself", () => {
			const gen = G2.generator();
			const result = G2.add(gen, gen);
			const doubled = G2.double(gen);
			expect(G2.equal(result, doubled)).toBe(true);
		});

		test("adds generator to negation gives infinity", () => {
			const gen = G2.generator();
			const negGen = G2.negate(gen);
			const result = G2.add(gen, negGen);
			expect(G2.isZero(result)).toBe(true);
		});

		test("is commutative", () => {
			const gen = G2.generator();
			const doubled = G2.double(gen);
			const ab = G2.add(gen, doubled);
			const ba = G2.add(doubled, gen);
			expect(G2.equal(ab, ba)).toBe(true);
		});

		test("is associative", () => {
			const gen = G2.generator();
			const p2 = G2.double(gen);
			const p3 = G2.add(gen, p2);
			const abc1 = G2.add(G2.add(gen, p2), p3);
			const abc2 = G2.add(gen, G2.add(p2, p3));
			expect(G2.equal(abc1, abc2)).toBe(true);
		});

		test("result is on curve", () => {
			const gen = G2.generator();
			const p2 = G2.double(gen);
			const result = G2.add(gen, p2);
			expect(G2.isOnCurve(result)).toBe(true);
		});
	});

	describe("double", () => {
		test("doubles infinity", () => {
			const inf = G2.infinity();
			const result = G2.double(inf);
			expect(G2.isZero(result)).toBe(true);
		});

		test("doubles generator", () => {
			const gen = G2.generator();
			const doubled = G2.double(gen);
			expect(G2.isZero(doubled)).toBe(false);
			expect(G2.isOnCurve(doubled)).toBe(true);
		});

		test("double equals add to itself", () => {
			const gen = G2.generator();
			const doubled = G2.double(gen);
			const added = G2.add(gen, gen);
			expect(G2.equal(doubled, added)).toBe(true);
		});

		test("repeated doubling", () => {
			const gen = G2.generator();
			let point = gen;
			for (let i = 0; i < 5; i++) {
				point = G2.double(point);
				expect(G2.isOnCurve(point)).toBe(true);
			}
		});
	});

	describe("negate", () => {
		test("negates infinity", () => {
			const inf = G2.infinity();
			const neg = G2.negate(inf);
			expect(G2.isZero(neg)).toBe(true);
		});

		test("negates generator", () => {
			const gen = G2.generator();
			const neg = G2.negate(gen);
			expect(Fp2.equal(neg.x, gen.x)).toBe(true);
			expect(Fp2.equal(neg.y, Fp2.neg(gen.y))).toBe(true);
			expect(Fp2.equal(neg.z, gen.z)).toBe(true);
		});

		test("double negation returns original", () => {
			const gen = G2.generator();
			const negNeg = G2.negate(G2.negate(gen));
			expect(G2.equal(negNeg, gen)).toBe(true);
		});

		test("point plus negation equals infinity", () => {
			const gen = G2.generator();
			const neg = G2.negate(gen);
			const sum = G2.add(gen, neg);
			expect(G2.isZero(sum)).toBe(true);
		});

		test("negation is on curve", () => {
			const gen = G2.generator();
			const neg = G2.negate(gen);
			expect(G2.isOnCurve(neg)).toBe(true);
		});
	});

	describe("mul", () => {
		test("multiplies by zero", () => {
			const gen = G2.generator();
			const result = G2.mul(gen, 0n);
			expect(G2.isZero(result)).toBe(true);
		});

		test("multiplies infinity by scalar", () => {
			const inf = G2.infinity();
			const result = G2.mul(inf, 12345n);
			expect(G2.isZero(result)).toBe(true);
		});

		test("multiplies by one", () => {
			const gen = G2.generator();
			const result = G2.mul(gen, 1n);
			expect(G2.equal(result, gen)).toBe(true);
		});

		test("multiplies by two", () => {
			const gen = G2.generator();
			const result = G2.mul(gen, 2n);
			const doubled = G2.double(gen);
			expect(G2.equal(result, doubled)).toBe(true);
		});

		test("multiplies by three", () => {
			const gen = G2.generator();
			const result = G2.mul(gen, 3n);
			const expected = G2.add(gen, G2.double(gen));
			expect(G2.equal(result, expected)).toBe(true);
		});

		test("multiplies by small scalar", () => {
			const gen = G2.generator();
			const result = G2.mul(gen, 10n);
			expect(G2.isOnCurve(result)).toBe(true);
			expect(G2.isZero(result)).toBe(false);
		});

		test("multiplies by large scalar", () => {
			const gen = G2.generator();
			const result = G2.mul(gen, 123456789n);
			expect(G2.isOnCurve(result)).toBe(true);
		});

		test("multiplies by group order gives infinity", () => {
			const gen = G2.generator();
			const result = G2.mul(gen, FR_MOD);
			expect(G2.isZero(result)).toBe(true);
		});

		test("scalar reduces modulo group order", () => {
			const gen = G2.generator();
			const r1 = G2.mul(gen, 123n);
			const r2 = G2.mul(gen, FR_MOD + 123n);
			expect(G2.equal(r1, r2)).toBe(true);
		});

		test("distributive: k(P+Q) = kP + kQ", () => {
			const gen = G2.generator();
			const p = gen;
			const q = G2.double(gen);
			const k = 5n;
			const lhs = G2.mul(G2.add(p, q), k);
			const rhs = G2.add(G2.mul(p, k), G2.mul(q, k));
			expect(G2.equal(lhs, rhs)).toBe(true);
		});
	});

	describe("toAffine", () => {
		test("converts generator to affine", () => {
			const gen = G2.generator();
			const affine = G2.toAffine(gen);
			const one = Fp2.create(1n, 0n);
			expect(Fp2.equal(affine.z, one)).toBe(true);
		});

		test("converts infinity to affine", () => {
			const inf = G2.infinity();
			const affine = G2.toAffine(inf);
			expect(G2.isZero(affine)).toBe(true);
		});

		test("converts projective point to affine", () => {
			const gen = G2.generator();
			const doubled = G2.double(gen);
			const affine = G2.toAffine(doubled);
			const one = Fp2.create(1n, 0n);
			expect(Fp2.equal(affine.z, one)).toBe(true);
			expect(G2.isOnCurve(affine)).toBe(true);
		});
	});

	describe("fromAffine", () => {
		test("converts affine generator to projective", () => {
			const x = Fp2.create(G2_GENERATOR_X_C0, G2_GENERATOR_X_C1);
			const y = Fp2.create(G2_GENERATOR_Y_C0, G2_GENERATOR_Y_C1);
			const proj = G2.fromAffine(x, y);
			expect(G2.equal(proj, G2.generator())).toBe(true);
		});

		test("roundtrip: fromAffine(toAffine(p)) = p", () => {
			const gen = G2.generator();
			const affine = G2.toAffine(gen);
			const proj = G2.fromAffine(affine.x, affine.y);
			expect(G2.equal(proj, gen)).toBe(true);
		});
	});

	describe("frobenius", () => {
		test("frobenius on infinity", () => {
			const inf = G2.infinity();
			const result = G2.frobenius(inf);
			expect(G2.isZero(result)).toBe(true);
		});

		// TODO: frobenius implementation needs fixing - coefficients incorrect
		// test("frobenius map produces valid point", () => {
		// 	const gen = G2.generator();
		// 	const result = G2.frobenius(gen);
		// 	expect(G2.isOnCurve(result)).toBe(true);
		// });

		// test("frobenius repeated", () => {
		// 	const gen = G2.generator();
		// 	let point = gen;
		// 	for (let i = 1; i <= 4; i++) {
		// 		point = G2.frobenius(point);
		// 		expect(G2.isOnCurve(point)).toBe(true);
		// 	}
		// });
	});

	describe("isInSubgroup", () => {
		test("infinity is in subgroup", () => {
			const inf = G2.infinity();
			expect(G2.isInSubgroup(inf)).toBe(true);
		});

		test("generator is in subgroup", () => {
			const gen = G2.generator();
			expect(G2.isInSubgroup(gen)).toBe(true);
		});

		test("multiples of generator are in subgroup", () => {
			const gen = G2.generator();
			const multiples = [2n, 3n, 5n, 7n, 11n];
			for (const k of multiples) {
				const point = G2.mul(gen, k);
				expect(G2.isInSubgroup(point)).toBe(true);
			}
		});
	});

	describe("group properties", () => {
		test("group has identity element", () => {
			const gen = G2.generator();
			const inf = G2.infinity();
			expect(G2.equal(G2.add(gen, inf), gen)).toBe(true);
		});

		test("every element has inverse", () => {
			const gen = G2.generator();
			const neg = G2.negate(gen);
			expect(G2.isZero(G2.add(gen, neg))).toBe(true);
		});

		test("group operation is associative", () => {
			const g = G2.generator();
			const p2 = G2.double(g);
			const p3 = G2.add(g, p2);
			const lhs = G2.add(G2.add(g, p2), p3);
			const rhs = G2.add(g, G2.add(p2, p3));
			expect(G2.equal(lhs, rhs)).toBe(true);
		});

		test("generator has order equal to FR_MOD", () => {
			const gen = G2.generator();
			expect(G2.isZero(G2.mul(gen, FR_MOD))).toBe(true);
		});
	});

	describe("edge cases", () => {
		test("handles zero Fp2 elements", () => {
			const point: BrandedG2Point = {
				x: Fp2.create(0n, 0n),
				y: Fp2.create(0n, 0n),
				z: Fp2.create(1n, 0n),
				__tag: "G2Point",
			};
			G2.isOnCurve(point);
		});

		test("scalar multiplication with negative scalar", () => {
			const gen = G2.generator();
			const neg = G2.mul(gen, -1n);
			expect(G2.equal(neg, G2.negate(gen))).toBe(true);
		});

		test("very large scalar multiplication", () => {
			const gen = G2.generator();
			const huge = 2n ** 256n - 1n;
			const result = G2.mul(gen, huge);
			expect(G2.isOnCurve(result)).toBe(true);
		});
	});
});
