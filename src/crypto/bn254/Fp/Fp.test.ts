import { describe, expect, test } from "vitest";
import * as Fp from "./index.js";
import { FP_MOD } from "../constants.js";

describe("Fp field arithmetic", () => {
	describe("mod", () => {
		test("reduces zero correctly", () => {
			expect(Fp.mod(0n)).toBe(0n);
		});

		test("reduces positive values less than modulus", () => {
			const value = 12345n;
			expect(Fp.mod(value)).toBe(value);
		});

		test("reduces positive values greater than modulus", () => {
			const value = FP_MOD + 1n;
			expect(Fp.mod(value)).toBe(1n);
		});

		test("reduces negative values", () => {
			const result = Fp.mod(-1n);
			expect(result).toBe(FP_MOD - 1n);
		});

		test("reduces large negative values", () => {
			const result = Fp.mod(-FP_MOD - 1n);
			expect(result).toBe(FP_MOD - 1n);
		});

		test("reduces exact modulus to zero", () => {
			expect(Fp.mod(FP_MOD)).toBe(0n);
		});

		test("reduces twice modulus to zero", () => {
			expect(Fp.mod(FP_MOD * 2n)).toBe(0n);
		});
	});

	describe("add", () => {
		test("adds zero to zero", () => {
			expect(Fp.add(0n, 0n)).toBe(0n);
		});

		test("adds value to zero", () => {
			const value = 12345n;
			expect(Fp.add(value, 0n)).toBe(value);
			expect(Fp.add(0n, value)).toBe(value);
		});

		test("adds two values without overflow", () => {
			const a = 100n;
			const b = 200n;
			expect(Fp.add(a, b)).toBe(300n);
		});

		test("adds with modular reduction", () => {
			const a = FP_MOD - 5n;
			const b = 10n;
			expect(Fp.add(a, b)).toBe(5n);
		});

		test("is commutative", () => {
			const a = 12345n;
			const b = 67890n;
			expect(Fp.add(a, b)).toBe(Fp.add(b, a));
		});

		test("is associative", () => {
			const a = 123n;
			const b = 456n;
			const c = 789n;
			expect(Fp.add(Fp.add(a, b), c)).toBe(Fp.add(a, Fp.add(b, c)));
		});

		test("has identity element (zero)", () => {
			const value = 12345n;
			expect(Fp.add(value, 0n)).toBe(value);
		});
	});

	describe("sub", () => {
		test("subtracts zero from zero", () => {
			expect(Fp.sub(0n, 0n)).toBe(0n);
		});

		test("subtracts zero from value", () => {
			const value = 12345n;
			expect(Fp.sub(value, 0n)).toBe(value);
		});

		test("subtracts value from zero", () => {
			const value = 12345n;
			expect(Fp.sub(0n, value)).toBe(FP_MOD - value);
		});

		test("subtracts with modular reduction", () => {
			const a = 5n;
			const b = 10n;
			expect(Fp.sub(a, b)).toBe(FP_MOD - 5n);
		});

		test("subtracts equal values gives zero", () => {
			const value = 12345n;
			expect(Fp.sub(value, value)).toBe(0n);
		});

		test("add and sub are inverses", () => {
			const a = 12345n;
			const b = 67890n;
			expect(Fp.sub(Fp.add(a, b), b)).toBe(a);
		});
	});

	describe("mul", () => {
		test("multiplies zero by zero", () => {
			expect(Fp.mul(0n, 0n)).toBe(0n);
		});

		test("multiplies value by zero", () => {
			const value = 12345n;
			expect(Fp.mul(value, 0n)).toBe(0n);
			expect(Fp.mul(0n, value)).toBe(0n);
		});

		test("multiplies value by one", () => {
			const value = 12345n;
			expect(Fp.mul(value, 1n)).toBe(value);
		});

		test("multiplies two values", () => {
			const a = 123n;
			const b = 456n;
			expect(Fp.mul(a, b)).toBe(Fp.mod(a * b));
		});

		test("is commutative", () => {
			const a = 12345n;
			const b = 67890n;
			expect(Fp.mul(a, b)).toBe(Fp.mul(b, a));
		});

		test("is associative", () => {
			const a = 123n;
			const b = 456n;
			const c = 789n;
			expect(Fp.mul(Fp.mul(a, b), c)).toBe(Fp.mul(a, Fp.mul(b, c)));
		});

		test("has identity element (one)", () => {
			const value = 12345n;
			expect(Fp.mul(value, 1n)).toBe(value);
		});

		test("distributes over addition", () => {
			const a = 123n;
			const b = 456n;
			const c = 789n;
			expect(Fp.mul(a, Fp.add(b, c))).toBe(Fp.add(Fp.mul(a, b), Fp.mul(a, c)));
		});
	});

	describe("neg", () => {
		test("negates zero to zero", () => {
			expect(Fp.neg(0n)).toBe(0n);
		});

		test("negates non-zero value", () => {
			const value = 12345n;
			expect(Fp.neg(value)).toBe(FP_MOD - value);
		});

		test("double negation returns original", () => {
			const value = 12345n;
			expect(Fp.neg(Fp.neg(value))).toBe(value);
		});

		test("value plus negation equals zero", () => {
			const value = 12345n;
			expect(Fp.add(value, Fp.neg(value))).toBe(0n);
		});

		test("negates maximum field element", () => {
			const value = FP_MOD - 1n;
			expect(Fp.neg(value)).toBe(1n);
		});
	});

	describe("inv", () => {
		test("inverts one to one", () => {
			expect(Fp.inv(1n)).toBe(1n);
		});

		test("value times inverse equals one", () => {
			const value = 12345n;
			const inverse = Fp.inv(value);
			expect(Fp.mul(value, inverse)).toBe(1n);
		});

		test("inverts several known values", () => {
			const values = [2n, 3n, 5n, 7n, 11n, 13n, 17n];
			for (const value of values) {
				const inverse = Fp.inv(value);
				expect(Fp.mul(value, inverse)).toBe(1n);
			}
		});

		test("double inversion returns original", () => {
			const value = 12345n;
			expect(Fp.inv(Fp.inv(value))).toBe(value);
		});

		test("inverts large value", () => {
			const value = FP_MOD - 1n;
			const inverse = Fp.inv(value);
			expect(Fp.mul(value, inverse)).toBe(1n);
		});
	});

	describe("pow", () => {
		test("raises to zero power gives one", () => {
			const base = 12345n;
			expect(Fp.pow(base, 0n)).toBe(1n);
		});

		test("raises to first power gives base", () => {
			const base = 12345n;
			expect(Fp.pow(base, 1n)).toBe(base);
		});

		test("raises to second power", () => {
			const base = 123n;
			expect(Fp.pow(base, 2n)).toBe(Fp.mul(base, base));
		});

		test("raises to third power", () => {
			const base = 123n;
			expect(Fp.pow(base, 3n)).toBe(Fp.mul(Fp.mul(base, base), base));
		});

		test("zero to any positive power is zero", () => {
			expect(Fp.pow(0n, 1n)).toBe(0n);
			expect(Fp.pow(0n, 100n)).toBe(0n);
		});

		test("one to any power is one", () => {
			expect(Fp.pow(1n, 0n)).toBe(1n);
			expect(Fp.pow(1n, 100n)).toBe(1n);
		});

		test("pow with large exponent", () => {
			const base = 2n;
			const exp = 256n;
			const result = Fp.pow(base, exp);
			expect(result).toBeDefined();
		});

		test("Fermat's little theorem: a^(p-1) = 1", () => {
			const base = 12345n;
			expect(Fp.pow(base, FP_MOD - 1n)).toBe(1n);
		});
	});

	describe("sqrt", () => {
		test("sqrt of zero is zero", () => {
			expect(Fp.sqrt(0n)).toBe(0n);
		});

		test("sqrt of one is one", () => {
			expect(Fp.sqrt(1n)).toBe(1n);
		});

		test("sqrt of perfect square", () => {
			const values = [1n, 4n, 9n, 16n, 25n];
			for (const value of values) {
				const sqrt = Fp.sqrt(value);
				expect(Fp.mul(sqrt, sqrt)).toBe(value);
			}
		});

		test("sqrt squared returns original for quadratic residues", () => {
			const value = 12345n;
			const square = Fp.mul(value, value);
			const sqrt = Fp.sqrt(square);
			// sqrt could be value or -value (FP_MOD - value)
			expect(sqrt === value || sqrt === FP_MOD - value).toBe(true);
		});
	});

	describe("field properties", () => {
		test("modulus is prime", () => {
			// BN254 field modulus
			expect(FP_MOD).toBe(
				21888242871839275222246405745257275088696311157297823662689037894645226208583n,
			);
		});

		test("field closure under addition", () => {
			const a = FP_MOD - 1n;
			const b = FP_MOD - 1n;
			const sum = Fp.add(a, b);
			expect(sum).toBeGreaterThanOrEqual(0n);
			expect(sum).toBeLessThan(FP_MOD);
		});

		test("field closure under multiplication", () => {
			const a = FP_MOD - 1n;
			const b = FP_MOD - 1n;
			const product = Fp.mul(a, b);
			expect(product).toBeGreaterThanOrEqual(0n);
			expect(product).toBeLessThan(FP_MOD);
		});

		test("additive inverse exists", () => {
			const values = [1n, 2n, 3n, 12345n, FP_MOD - 1n];
			for (const value of values) {
				const neg = Fp.neg(value);
				expect(Fp.add(value, neg)).toBe(0n);
			}
		});

		test("multiplicative inverse exists for non-zero", () => {
			const values = [1n, 2n, 3n, 12345n, FP_MOD - 1n];
			for (const value of values) {
				const inv = Fp.inv(value);
				expect(Fp.mul(value, inv)).toBe(1n);
			}
		});
	});

	describe("edge cases", () => {
		test("handles maximum field element", () => {
			const max = FP_MOD - 1n;
			expect(Fp.add(max, 0n)).toBe(max);
			expect(Fp.mul(max, 1n)).toBe(max);
		});

		test("handles operations near modulus boundary", () => {
			const a = FP_MOD - 1n;
			const b = FP_MOD - 2n;
			expect(Fp.add(a, b)).toBe(FP_MOD - 3n);
		});

		test("handles very large inputs", () => {
			const large = FP_MOD * 1000n + 12345n;
			expect(Fp.mod(large)).toBe(12345n);
		});
	});
});
