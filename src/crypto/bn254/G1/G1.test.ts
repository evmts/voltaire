import { describe, expect, test } from "vitest";
import * as G1 from "./index.js";
import * as Fp from "../Fp/index.js";
import {
	FP_MOD,
	FR_MOD,
	G1_GENERATOR_X,
	G1_GENERATOR_Y,
	B_G1,
} from "../constants.js";
import type { BrandedG1Point } from "../BrandedG1Point.js";

describe("G1 curve operations", () => {
	describe("generator", () => {
		test("generator has correct coordinates", () => {
			const gen = G1.generator();
			expect(gen.x).toBe(G1_GENERATOR_X);
			expect(gen.y).toBe(G1_GENERATOR_Y);
			expect(gen.z).toBe(1n);
		});

		test("generator is on curve", () => {
			const gen = G1.generator();
			expect(G1.isOnCurve(gen)).toBe(true);
		});

		test("generator is not zero", () => {
			const gen = G1.generator();
			expect(G1.isZero(gen)).toBe(false);
		});
	});

	describe("infinity", () => {
		test("infinity has z = 0", () => {
			const inf = G1.infinity();
			expect(inf.z).toBe(0n);
		});

		test("infinity is zero", () => {
			const inf = G1.infinity();
			expect(G1.isZero(inf)).toBe(true);
		});

		test("infinity is on curve", () => {
			const inf = G1.infinity();
			expect(G1.isOnCurve(inf)).toBe(true);
		});
	});

	describe("isZero", () => {
		test("infinity is zero", () => {
			const inf = G1.infinity();
			expect(G1.isZero(inf)).toBe(true);
		});

		test("generator is not zero", () => {
			const gen = G1.generator();
			expect(G1.isZero(gen)).toBe(false);
		});

		test("point with z=0 is zero", () => {
			const point: BrandedG1Point = { x: 1n, y: 2n, z: 0n, __tag: "G1Point" };
			expect(G1.isZero(point)).toBe(true);
		});
	});

	describe("isOnCurve", () => {
		test("generator is on curve", () => {
			const gen = G1.generator();
			expect(G1.isOnCurve(gen)).toBe(true);
		});

		test("infinity is on curve", () => {
			const inf = G1.infinity();
			expect(G1.isOnCurve(inf)).toBe(true);
		});

		test("arbitrary valid point is on curve", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			expect(G1.isOnCurve(doubled)).toBe(true);
		});

		test("verifies curve equation y^2 = x^3 + 3", () => {
			const gen = G1.generator();
			// In affine: y^2 = x^3 + b where b = 3
			const ySq = Fp.mul(gen.y, gen.y);
			const xCubed = Fp.mul(Fp.mul(gen.x, gen.x), gen.x);
			const rhs = Fp.add(xCubed, B_G1);
			expect(ySq).toBe(rhs);
		});
	});

	describe("equal", () => {
		test("generator equals itself", () => {
			const gen1 = G1.generator();
			const gen2 = G1.generator();
			expect(G1.equal(gen1, gen2)).toBe(true);
		});

		test("infinity equals infinity", () => {
			const inf1 = G1.infinity();
			const inf2 = G1.infinity();
			expect(G1.equal(inf1, inf2)).toBe(true);
		});

		test("generator does not equal infinity", () => {
			const gen = G1.generator();
			const inf = G1.infinity();
			expect(G1.equal(gen, inf)).toBe(false);
		});

		test("different points are not equal", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			expect(G1.equal(gen, doubled)).toBe(false);
		});

		test("same point in different representations are equal", () => {
			const gen = G1.generator();
			const scaled: BrandedG1Point = {
				x: Fp.mul(gen.x, 4n),
				y: Fp.mul(gen.y, 8n),
				z: 2n,
				__tag: "G1Point",
			};
			expect(G1.equal(gen, scaled)).toBe(true);
		});
	});

	describe("add", () => {
		test("adds infinity to infinity", () => {
			const inf = G1.infinity();
			const result = G1.add(inf, inf);
			expect(G1.isZero(result)).toBe(true);
		});

		test("adds generator to infinity", () => {
			const gen = G1.generator();
			const inf = G1.infinity();
			const result = G1.add(gen, inf);
			expect(G1.equal(result, gen)).toBe(true);
		});

		test("adds infinity to generator", () => {
			const gen = G1.generator();
			const inf = G1.infinity();
			const result = G1.add(inf, gen);
			expect(G1.equal(result, gen)).toBe(true);
		});

		test("adds generator to itself", () => {
			const gen = G1.generator();
			const result = G1.add(gen, gen);
			const doubled = G1.double(gen);
			expect(G1.equal(result, doubled)).toBe(true);
		});

		test("adds generator to negation gives infinity", () => {
			const gen = G1.generator();
			const negGen = G1.negate(gen);
			const result = G1.add(gen, negGen);
			expect(G1.isZero(result)).toBe(true);
		});

		test("is commutative", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			const ab = G1.add(gen, doubled);
			const ba = G1.add(doubled, gen);
			expect(G1.equal(ab, ba)).toBe(true);
		});

		test("is associative", () => {
			const gen = G1.generator();
			const p2 = G1.double(gen);
			const p3 = G1.add(gen, p2);
			const abc1 = G1.add(G1.add(gen, p2), p3);
			const abc2 = G1.add(gen, G1.add(p2, p3));
			expect(G1.equal(abc1, abc2)).toBe(true);
		});

		test("result is on curve", () => {
			const gen = G1.generator();
			const p2 = G1.double(gen);
			const result = G1.add(gen, p2);
			expect(G1.isOnCurve(result)).toBe(true);
		});

		test("has identity element (infinity)", () => {
			const gen = G1.generator();
			const inf = G1.infinity();
			const result = G1.add(gen, inf);
			expect(G1.equal(result, gen)).toBe(true);
		});
	});

	describe("double", () => {
		test("doubles infinity", () => {
			const inf = G1.infinity();
			const result = G1.double(inf);
			expect(G1.isZero(result)).toBe(true);
		});

		test("doubles generator", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			expect(G1.isZero(doubled)).toBe(false);
			expect(G1.isOnCurve(doubled)).toBe(true);
		});

		test("double equals add to itself", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			const added = G1.add(gen, gen);
			expect(G1.equal(doubled, added)).toBe(true);
		});

		test("result is on curve", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			expect(G1.isOnCurve(doubled)).toBe(true);
		});

		test("repeated doubling", () => {
			const gen = G1.generator();
			let point = gen;
			for (let i = 0; i < 5; i++) {
				point = G1.double(point);
				expect(G1.isOnCurve(point)).toBe(true);
			}
		});
	});

	describe("negate", () => {
		test("negates infinity", () => {
			const inf = G1.infinity();
			const neg = G1.negate(inf);
			expect(G1.isZero(neg)).toBe(true);
		});

		test("negates generator", () => {
			const gen = G1.generator();
			const neg = G1.negate(gen);
			expect(neg.x).toBe(gen.x);
			expect(neg.y).toBe(Fp.neg(gen.y));
			expect(neg.z).toBe(gen.z);
		});

		test("double negation returns original", () => {
			const gen = G1.generator();
			const negNeg = G1.negate(G1.negate(gen));
			expect(G1.equal(negNeg, gen)).toBe(true);
		});

		test("point plus negation equals infinity", () => {
			const gen = G1.generator();
			const neg = G1.negate(gen);
			const sum = G1.add(gen, neg);
			expect(G1.isZero(sum)).toBe(true);
		});

		test("negation is on curve", () => {
			const gen = G1.generator();
			const neg = G1.negate(gen);
			expect(G1.isOnCurve(neg)).toBe(true);
		});
	});

	describe("mul", () => {
		test("multiplies by zero", () => {
			const gen = G1.generator();
			const result = G1.mul(gen, 0n);
			expect(G1.isZero(result)).toBe(true);
		});

		test("multiplies infinity by scalar", () => {
			const inf = G1.infinity();
			const result = G1.mul(inf, 12345n);
			expect(G1.isZero(result)).toBe(true);
		});

		test("multiplies by one", () => {
			const gen = G1.generator();
			const result = G1.mul(gen, 1n);
			expect(G1.equal(result, gen)).toBe(true);
		});

		test("multiplies by two", () => {
			const gen = G1.generator();
			const result = G1.mul(gen, 2n);
			const doubled = G1.double(gen);
			expect(G1.equal(result, doubled)).toBe(true);
		});

		test("multiplies by three", () => {
			const gen = G1.generator();
			const result = G1.mul(gen, 3n);
			const expected = G1.add(gen, G1.double(gen));
			expect(G1.equal(result, expected)).toBe(true);
		});

		test("multiplies by small scalar", () => {
			const gen = G1.generator();
			const result = G1.mul(gen, 10n);
			expect(G1.isOnCurve(result)).toBe(true);
			expect(G1.isZero(result)).toBe(false);
		});

		test("multiplies by large scalar", () => {
			const gen = G1.generator();
			const result = G1.mul(gen, 123456789n);
			expect(G1.isOnCurve(result)).toBe(true);
		});

		test("multiplies by group order gives infinity", () => {
			const gen = G1.generator();
			const result = G1.mul(gen, FR_MOD);
			expect(G1.isZero(result)).toBe(true);
		});

		test("multiplies by group order plus one gives generator", () => {
			const gen = G1.generator();
			const result = G1.mul(gen, FR_MOD + 1n);
			expect(G1.equal(result, gen)).toBe(true);
		});

		test("scalar reduces modulo group order", () => {
			const gen = G1.generator();
			const r1 = G1.mul(gen, 123n);
			const r2 = G1.mul(gen, FR_MOD + 123n);
			expect(G1.equal(r1, r2)).toBe(true);
		});

		test("distributive: k(P+Q) = kP + kQ", () => {
			const gen = G1.generator();
			const p = gen;
			const q = G1.double(gen);
			const k = 5n;
			const lhs = G1.mul(G1.add(p, q), k);
			const rhs = G1.add(G1.mul(p, k), G1.mul(q, k));
			expect(G1.equal(lhs, rhs)).toBe(true);
		});

		test("associative: (a*b)P = a(bP)", () => {
			const gen = G1.generator();
			const a = 3n;
			const b = 5n;
			const lhs = G1.mul(gen, a * b);
			const rhs = G1.mul(G1.mul(gen, b), a);
			expect(G1.equal(lhs, rhs)).toBe(true);
		});
	});

	describe("toAffine", () => {
		test("converts generator to affine", () => {
			const gen = G1.generator();
			const affine = G1.toAffine(gen);
			expect(affine.z).toBe(1n);
			expect(affine.x).toBe(G1_GENERATOR_X);
			expect(affine.y).toBe(G1_GENERATOR_Y);
		});

		test("converts infinity to affine", () => {
			const inf = G1.infinity();
			const affine = G1.toAffine(inf);
			expect(G1.isZero(affine)).toBe(true);
		});

		test("converts projective point to affine", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			const affine = G1.toAffine(doubled);
			expect(affine.z).toBe(1n);
			expect(G1.isOnCurve(affine)).toBe(true);
		});

		test("affine form is unique", () => {
			const gen = G1.generator();
			const scaled: BrandedG1Point = {
				x: Fp.mul(gen.x, 4n),
				y: Fp.mul(gen.y, 8n),
				z: 2n,
				__tag: "G1Point",
			};
			const affine1 = G1.toAffine(gen);
			const affine2 = G1.toAffine(scaled);
			expect(affine1.x).toBe(affine2.x);
			expect(affine1.y).toBe(affine2.y);
			expect(affine1.z).toBe(affine2.z);
		});
	});

	describe("fromAffine", () => {
		test("converts affine generator to projective", () => {
			const proj = G1.fromAffine(G1_GENERATOR_X, G1_GENERATOR_Y);
			expect(proj.x).toBe(G1_GENERATOR_X);
			expect(proj.y).toBe(G1_GENERATOR_Y);
			expect(proj.z).toBe(1n);
		});

		test("roundtrip: fromAffine(toAffine(p)) = p", () => {
			const gen = G1.generator();
			const affine = G1.toAffine(gen);
			const proj = G1.fromAffine(affine.x, affine.y);
			expect(G1.equal(proj, gen)).toBe(true);
		});
	});

	describe("group properties", () => {
		test("group has identity element", () => {
			const gen = G1.generator();
			const inf = G1.infinity();
			expect(G1.equal(G1.add(gen, inf), gen)).toBe(true);
		});

		test("every element has inverse", () => {
			const gen = G1.generator();
			const neg = G1.negate(gen);
			expect(G1.isZero(G1.add(gen, neg))).toBe(true);
		});

		test("group operation is associative", () => {
			const g = G1.generator();
			const p2 = G1.double(g);
			const p3 = G1.add(g, p2);
			const lhs = G1.add(G1.add(g, p2), p3);
			const rhs = G1.add(g, G1.add(p2, p3));
			expect(G1.equal(lhs, rhs)).toBe(true);
		});

		test("group is cyclic", () => {
			const gen = G1.generator();
			const multiples: BrandedG1Point[] = [];
			for (let i = 1n; i <= 10n; i++) {
				multiples.push(G1.mul(gen, i));
			}
			// All should be distinct
			for (let i = 0; i < multiples.length; i++) {
				for (let j = i + 1; j < multiples.length; j++) {
					expect(G1.equal(multiples[i]!, multiples[j]!)).toBe(false);
				}
			}
		});

		test("generator has order equal to FR_MOD", () => {
			const gen = G1.generator();
			expect(G1.isZero(G1.mul(gen, FR_MOD))).toBe(true);
			expect(G1.isZero(G1.mul(gen, FR_MOD - 1n))).toBe(false);
		});
	});

	describe("edge cases", () => {
		test("handles maximum field elements", () => {
			const point: BrandedG1Point = {
				x: FP_MOD - 1n,
				y: FP_MOD - 1n,
				z: 1n,
				__tag: "G1Point",
			};
			// May or may not be on curve, but shouldn't crash
			G1.isOnCurve(point);
		});

		test("handles zero coordinates", () => {
			const point: BrandedG1Point = { x: 0n, y: 0n, z: 1n, __tag: "G1Point" };
			G1.isOnCurve(point);
		});

		test("scalar multiplication with negative scalar", () => {
			const gen = G1.generator();
			const neg = G1.mul(gen, -1n);
			expect(G1.equal(neg, G1.negate(gen))).toBe(true);
		});

		test("very large scalar multiplication", () => {
			const gen = G1.generator();
			const huge = 2n ** 256n - 1n;
			const result = G1.mul(gen, huge);
			expect(G1.isOnCurve(result)).toBe(true);
		});
	});
});
