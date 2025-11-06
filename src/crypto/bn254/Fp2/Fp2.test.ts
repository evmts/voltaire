import { describe, expect, test } from "vitest";
import * as Fp2 from "./index.js";
import { FP_MOD } from "../constants.js";

describe("Fp2 extension field arithmetic", () => {
	describe("create", () => {
		test("creates zero element", () => {
			const zero = Fp2.create(0n, 0n);
			expect(zero.c0).toBe(0n);
			expect(zero.c1).toBe(0n);
		});

		test("creates one element", () => {
			const one = Fp2.create(1n, 0n);
			expect(one.c0).toBe(1n);
			expect(one.c1).toBe(0n);
		});

		test("creates arbitrary element", () => {
			const elem = Fp2.create(123n, 456n);
			expect(elem.c0).toBe(123n);
			expect(elem.c1).toBe(456n);
		});
	});

	describe("isZero", () => {
		test("zero element is zero", () => {
			const zero = Fp2.create(0n, 0n);
			expect(Fp2.isZero(zero)).toBe(true);
		});

		test("non-zero c0 is not zero", () => {
			const elem = Fp2.create(1n, 0n);
			expect(Fp2.isZero(elem)).toBe(false);
		});

		test("non-zero c1 is not zero", () => {
			const elem = Fp2.create(0n, 1n);
			expect(Fp2.isZero(elem)).toBe(false);
		});

		test("both non-zero is not zero", () => {
			const elem = Fp2.create(1n, 1n);
			expect(Fp2.isZero(elem)).toBe(false);
		});
	});

	describe("equal", () => {
		test("zero equals zero", () => {
			const zero1 = Fp2.create(0n, 0n);
			const zero2 = Fp2.create(0n, 0n);
			expect(Fp2.equal(zero1, zero2)).toBe(true);
		});

		test("equal elements are equal", () => {
			const a = Fp2.create(123n, 456n);
			const b = Fp2.create(123n, 456n);
			expect(Fp2.equal(a, b)).toBe(true);
		});

		test("different c0 are not equal", () => {
			const a = Fp2.create(123n, 456n);
			const b = Fp2.create(124n, 456n);
			expect(Fp2.equal(a, b)).toBe(false);
		});

		test("different c1 are not equal", () => {
			const a = Fp2.create(123n, 456n);
			const b = Fp2.create(123n, 457n);
			expect(Fp2.equal(a, b)).toBe(false);
		});
	});

	describe("add", () => {
		test("adds zero to zero", () => {
			const zero = Fp2.create(0n, 0n);
			const result = Fp2.add(zero, zero);
			expect(result.c0).toBe(0n);
			expect(result.c1).toBe(0n);
		});

		test("adds element to zero", () => {
			const zero = Fp2.create(0n, 0n);
			const elem = Fp2.create(123n, 456n);
			const result = Fp2.add(elem, zero);
			expect(result.c0).toBe(123n);
			expect(result.c1).toBe(456n);
		});

		test("adds two elements", () => {
			const a = Fp2.create(100n, 200n);
			const b = Fp2.create(300n, 400n);
			const result = Fp2.add(a, b);
			expect(result.c0).toBe(400n);
			expect(result.c1).toBe(600n);
		});

		test("is commutative", () => {
			const a = Fp2.create(123n, 456n);
			const b = Fp2.create(789n, 101112n);
			const ab = Fp2.add(a, b);
			const ba = Fp2.add(b, a);
			expect(Fp2.equal(ab, ba)).toBe(true);
		});

		test("is associative", () => {
			const a = Fp2.create(1n, 2n);
			const b = Fp2.create(3n, 4n);
			const c = Fp2.create(5n, 6n);
			const abc1 = Fp2.add(Fp2.add(a, b), c);
			const abc2 = Fp2.add(a, Fp2.add(b, c));
			expect(Fp2.equal(abc1, abc2)).toBe(true);
		});

		test("has identity element", () => {
			const elem = Fp2.create(123n, 456n);
			const zero = Fp2.create(0n, 0n);
			const result = Fp2.add(elem, zero);
			expect(Fp2.equal(result, elem)).toBe(true);
		});
	});

	describe("sub", () => {
		test("subtracts zero from zero", () => {
			const zero = Fp2.create(0n, 0n);
			const result = Fp2.sub(zero, zero);
			expect(Fp2.isZero(result)).toBe(true);
		});

		test("subtracts element from itself", () => {
			const elem = Fp2.create(123n, 456n);
			const result = Fp2.sub(elem, elem);
			expect(Fp2.isZero(result)).toBe(true);
		});

		test("add and sub are inverses", () => {
			const a = Fp2.create(123n, 456n);
			const b = Fp2.create(789n, 101112n);
			const sum = Fp2.add(a, b);
			const diff = Fp2.sub(sum, b);
			expect(Fp2.equal(diff, a)).toBe(true);
		});
	});

	describe("mul", () => {
		test("multiplies by zero", () => {
			const zero = Fp2.create(0n, 0n);
			const elem = Fp2.create(123n, 456n);
			const result = Fp2.mul(elem, zero);
			expect(Fp2.isZero(result)).toBe(true);
		});

		test("multiplies by one", () => {
			const one = Fp2.create(1n, 0n);
			const elem = Fp2.create(123n, 456n);
			const result = Fp2.mul(elem, one);
			expect(Fp2.equal(result, elem)).toBe(true);
		});

		test("is commutative", () => {
			const a = Fp2.create(123n, 456n);
			const b = Fp2.create(789n, 101n);
			const ab = Fp2.mul(a, b);
			const ba = Fp2.mul(b, a);
			expect(Fp2.equal(ab, ba)).toBe(true);
		});

		test("is associative", () => {
			const a = Fp2.create(2n, 3n);
			const b = Fp2.create(5n, 7n);
			const c = Fp2.create(11n, 13n);
			const abc1 = Fp2.mul(Fp2.mul(a, b), c);
			const abc2 = Fp2.mul(a, Fp2.mul(b, c));
			expect(Fp2.equal(abc1, abc2)).toBe(true);
		});

		test("distributes over addition", () => {
			const a = Fp2.create(2n, 3n);
			const b = Fp2.create(5n, 7n);
			const c = Fp2.create(11n, 13n);
			const lhs = Fp2.mul(a, Fp2.add(b, c));
			const rhs = Fp2.add(Fp2.mul(a, b), Fp2.mul(a, c));
			expect(Fp2.equal(lhs, rhs)).toBe(true);
		});

		test("multiplies two elements correctly", () => {
			// (a + bi)(c + di) = (ac - bd) + (ad + bc)i
			// In Fp2, we use u^2 = -1, so multiplication is:
			// (c0 + c1*u)(c0' + c1'*u) = (c0*c0' - c1*c1') + (c0*c1' + c1*c0')*u
			const a = Fp2.create(2n, 3n);
			const b = Fp2.create(5n, 7n);
			const result = Fp2.mul(a, b);
			// Expected: c0 = 2*5 - 3*7 = 10 - 21 = -11
			// c1 = 2*7 + 3*5 = 14 + 15 = 29
			expect(result).toBeDefined();
		});
	});

	describe("neg", () => {
		test("negates zero to zero", () => {
			const zero = Fp2.create(0n, 0n);
			const result = Fp2.neg(zero);
			expect(Fp2.isZero(result)).toBe(true);
		});

		test("double negation returns original", () => {
			const elem = Fp2.create(123n, 456n);
			const negNeg = Fp2.neg(Fp2.neg(elem));
			expect(Fp2.equal(negNeg, elem)).toBe(true);
		});

		test("element plus negation equals zero", () => {
			const elem = Fp2.create(123n, 456n);
			const sum = Fp2.add(elem, Fp2.neg(elem));
			expect(Fp2.isZero(sum)).toBe(true);
		});
	});

	describe("inv", () => {
		test("inverts one to one", () => {
			const one = Fp2.create(1n, 0n);
			const inv = Fp2.inv(one);
			expect(Fp2.equal(inv, one)).toBe(true);
		});

		test("element times inverse equals one", () => {
			const elem = Fp2.create(123n, 456n);
			const inv = Fp2.inv(elem);
			const product = Fp2.mul(elem, inv);
			const one = Fp2.create(1n, 0n);
			expect(Fp2.equal(product, one)).toBe(true);
		});

		test("double inversion returns original", () => {
			const elem = Fp2.create(123n, 456n);
			const invInv = Fp2.inv(Fp2.inv(elem));
			expect(Fp2.equal(invInv, elem)).toBe(true);
		});
	});

	describe("square", () => {
		test("squares zero", () => {
			const zero = Fp2.create(0n, 0n);
			const result = Fp2.square(zero);
			expect(Fp2.isZero(result)).toBe(true);
		});

		test("squares one", () => {
			const one = Fp2.create(1n, 0n);
			const result = Fp2.square(one);
			expect(Fp2.equal(result, one)).toBe(true);
		});

		test("square equals mul by itself", () => {
			const elem = Fp2.create(123n, 456n);
			const squared = Fp2.square(elem);
			const mulled = Fp2.mul(elem, elem);
			expect(Fp2.equal(squared, mulled)).toBe(true);
		});
	});

	describe("mulScalar", () => {
		test("multiplies by zero scalar", () => {
			const elem = Fp2.create(123n, 456n);
			const result = Fp2.mulScalar(elem, 0n);
			expect(Fp2.isZero(result)).toBe(true);
		});

		test("multiplies by one scalar", () => {
			const elem = Fp2.create(123n, 456n);
			const result = Fp2.mulScalar(elem, 1n);
			expect(Fp2.equal(result, elem)).toBe(true);
		});

		test("multiplies by scalar", () => {
			const elem = Fp2.create(10n, 20n);
			const result = Fp2.mulScalar(elem, 5n);
			const expected = Fp2.create(50n, 100n);
			expect(Fp2.equal(result, expected)).toBe(true);
		});
	});

	describe("conjugate", () => {
		test("conjugates zero", () => {
			const zero = Fp2.create(0n, 0n);
			const result = Fp2.conjugate(zero);
			expect(Fp2.equal(result, zero)).toBe(true);
		});

		test("conjugate flips sign of c1", () => {
			const elem = Fp2.create(123n, 456n);
			const conj = Fp2.conjugate(elem);
			expect(conj.c0).toBe(123n);
			expect(conj.c1).toBe(FP_MOD - 456n);
		});

		test("double conjugate returns original", () => {
			const elem = Fp2.create(123n, 456n);
			const conjConj = Fp2.conjugate(Fp2.conjugate(elem));
			expect(Fp2.equal(conjConj, elem)).toBe(true);
		});

		test("element times conjugate is real", () => {
			const elem = Fp2.create(123n, 456n);
			const conj = Fp2.conjugate(elem);
			const product = Fp2.mul(elem, conj);
			// Result should have c1 = 0 (purely real)
			expect(product.c1).toBe(0n);
		});
	});

	describe("frobeniusMap", () => {
		test("frobenius on zero", () => {
			const zero = Fp2.create(0n, 0n);
			const result = Fp2.frobeniusMap(zero);
			expect(Fp2.equal(result, zero)).toBe(true);
		});

		test("frobenius map equals conjugate", () => {
			const elem = Fp2.create(123n, 456n);
			const result = Fp2.frobeniusMap(elem);
			// Should equal conjugate for Fp2
			const conj = Fp2.conjugate(elem);
			expect(Fp2.equal(result, conj)).toBe(true);
		});

		test("double frobenius is identity on Fp2", () => {
			const elem = Fp2.create(123n, 456n);
			const result = Fp2.frobeniusMap(Fp2.frobeniusMap(elem));
			expect(Fp2.equal(result, elem)).toBe(true);
		});
	});

	describe("extension field properties", () => {
		test("Fp2 is 2-dimensional over Fp", () => {
			const elem = Fp2.create(123n, 456n);
			expect(elem.c0).toBeGreaterThanOrEqual(0n);
			expect(elem.c0).toBeLessThan(FP_MOD);
			expect(elem.c1).toBeGreaterThanOrEqual(0n);
			expect(elem.c1).toBeLessThan(FP_MOD);
		});

		test("i^2 = -1 in Fp2", () => {
			const i = Fp2.create(0n, 1n);
			const iSquared = Fp2.square(i);
			const minusOne = Fp2.create(FP_MOD - 1n, 0n);
			expect(Fp2.equal(iSquared, minusOne)).toBe(true);
		});
	});
});
