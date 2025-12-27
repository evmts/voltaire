import { describe, expect, test } from "vitest";
import * as Fp2 from "../Fp2/index.js";
import type { G2PointType } from "../G2PointType.js";
import { FR_MOD, G2_GENERATOR_X, G2_GENERATOR_Y } from "../constants.js";
import * as G2 from "./index.js";

describe("BLS12-381 G2 curve operations", () => {
	describe("generator", () => {
		test("generator has correct coordinates", () => {
			const gen = G2.generator();
			expect(gen.x.c0).toBe(G2_GENERATOR_X.c0);
			expect(gen.x.c1).toBe(G2_GENERATOR_X.c1);
			expect(gen.y.c0).toBe(G2_GENERATOR_Y.c0);
			expect(gen.y.c1).toBe(G2_GENERATOR_Y.c1);
			expect(gen.z.c0).toBe(1n);
			expect(gen.z.c1).toBe(0n);
		});

		test("generator is on curve", () => {
			const gen = G2.generator();
			expect(G2.isOnCurve(gen)).toBe(true);
		});

		test("generator is not zero", () => {
			const gen = G2.generator();
			expect(G2.isZero(gen)).toBe(false);
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

		test("arbitrary valid point is on curve", () => {
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

		test("has identity element (infinity)", () => {
			const gen = G2.generator();
			const inf = G2.infinity();
			const result = G2.add(gen, inf);
			expect(G2.equal(result, gen)).toBe(true);
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

		test("result is on curve", () => {
			const gen = G2.generator();
			const doubled = G2.double(gen);
			expect(G2.isOnCurve(doubled)).toBe(true);
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

		test("multiplies by group order gives infinity", () => {
			const gen = G2.generator();
			const result = G2.mul(gen, FR_MOD);
			expect(G2.isZero(result)).toBe(true);
		});

		test("multiplies by group order plus one gives generator", () => {
			const gen = G2.generator();
			const result = G2.mul(gen, FR_MOD + 1n);
			expect(G2.equal(result, gen)).toBe(true);
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

		test("associative: (a*b)P = a(bP)", () => {
			const gen = G2.generator();
			const a = 3n;
			const b = 5n;
			const lhs = G2.mul(gen, a * b);
			const rhs = G2.mul(G2.mul(gen, b), a);
			expect(G2.equal(lhs, rhs)).toBe(true);
		});
	});

	describe("toAffine", () => {
		test("converts generator to affine", () => {
			const gen = G2.generator();
			const affine = G2.toAffine(gen);
			expect(affine.z.c0).toBe(1n);
			expect(affine.z.c1).toBe(0n);
			expect(Fp2.equal(affine.x, G2_GENERATOR_X)).toBe(true);
			expect(Fp2.equal(affine.y, G2_GENERATOR_Y)).toBe(true);
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
			expect(affine.z.c0).toBe(1n);
			expect(affine.z.c1).toBe(0n);
			expect(G2.isOnCurve(affine)).toBe(true);
		});
	});

	describe("fromAffine", () => {
		test("converts affine generator to projective", () => {
			const proj = G2.fromAffine(G2_GENERATOR_X, G2_GENERATOR_Y);
			expect(Fp2.equal(proj.x, G2_GENERATOR_X)).toBe(true);
			expect(Fp2.equal(proj.y, G2_GENERATOR_Y)).toBe(true);
			expect(proj.z.c0).toBe(1n);
			expect(proj.z.c1).toBe(0n);
		});

		test("roundtrip: fromAffine(toAffine(p)) = p", () => {
			const gen = G2.generator();
			const affine = G2.toAffine(gen);
			const proj = G2.fromAffine(affine.x, affine.y);
			expect(G2.equal(proj, gen)).toBe(true);
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

		test("group is cyclic", () => {
			const gen = G2.generator();
			const multiples: G2PointType[] = [];
			for (let i = 1n; i <= 10n; i++) {
				multiples.push(G2.mul(gen, i));
			}
			// All should be distinct
			for (let i = 0; i < multiples.length; i++) {
				for (let j = i + 1; j < multiples.length; j++) {
					const pi = multiples[i];
					const pj = multiples[j];
					if (pi !== undefined && pj !== undefined) {
						expect(G2.equal(pi, pj)).toBe(false);
					}
				}
			}
		});

		test("generator has order equal to FR_MOD", () => {
			const gen = G2.generator();
			expect(G2.isZero(G2.mul(gen, FR_MOD))).toBe(true);
			expect(G2.isZero(G2.mul(gen, FR_MOD - 1n))).toBe(false);
		});
	});

	describe("edge cases", () => {
		test("scalar multiplication with negative scalar", () => {
			const gen = G2.generator();
			const neg = G2.mul(gen, -1n);
			expect(G2.equal(neg, G2.negate(gen))).toBe(true);
		});
	});
});
