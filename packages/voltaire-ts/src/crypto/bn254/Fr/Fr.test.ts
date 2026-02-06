import { describe, expect, test } from "vitest";
import { FR_MOD } from "../constants.js";
import * as Fr from "./index.js";

describe("Fr scalar field arithmetic", () => {
	describe("mod", () => {
		test("reduces zero correctly", () => {
			expect(Fr.mod(0n)).toBe(0n);
		});

		test("reduces positive values less than modulus", () => {
			const value = 12345n;
			expect(Fr.mod(value)).toBe(value);
		});

		test("reduces positive values greater than modulus", () => {
			const value = FR_MOD + 1n;
			expect(Fr.mod(value)).toBe(1n);
		});

		test("reduces negative values", () => {
			const result = Fr.mod(-1n);
			expect(result).toBe(FR_MOD - 1n);
		});

		test("reduces exact modulus to zero", () => {
			expect(Fr.mod(FR_MOD)).toBe(0n);
		});
	});

	describe("add", () => {
		test("adds zero to zero", () => {
			expect(Fr.add(0n, 0n)).toBe(0n);
		});

		test("adds value to zero", () => {
			const value = 12345n;
			expect(Fr.add(value, 0n)).toBe(value);
		});

		test("adds with modular reduction", () => {
			const a = FR_MOD - 5n;
			const b = 10n;
			expect(Fr.add(a, b)).toBe(5n);
		});

		test("is commutative", () => {
			const a = 12345n;
			const b = 67890n;
			expect(Fr.add(a, b)).toBe(Fr.add(b, a));
		});
	});

	describe("mul", () => {
		test("multiplies value by zero", () => {
			const value = 12345n;
			expect(Fr.mul(value, 0n)).toBe(0n);
		});

		test("multiplies value by one", () => {
			const value = 12345n;
			expect(Fr.mul(value, 1n)).toBe(value);
		});

		test("is commutative", () => {
			const a = 12345n;
			const b = 67890n;
			expect(Fr.mul(a, b)).toBe(Fr.mul(b, a));
		});
	});

	describe("neg", () => {
		test("negates zero to zero", () => {
			expect(Fr.neg(0n)).toBe(0n);
		});

		test("value plus negation equals zero", () => {
			const value = 12345n;
			expect(Fr.add(value, Fr.neg(value))).toBe(0n);
		});
	});

	describe("inv", () => {
		test("inverts one to one", () => {
			expect(Fr.inv(1n)).toBe(1n);
		});

		test("value times inverse equals one", () => {
			const value = 12345n;
			const inverse = Fr.inv(value);
			expect(Fr.mul(value, inverse)).toBe(1n);
		});
	});

	describe("pow", () => {
		test("raises to zero power gives one", () => {
			const base = 12345n;
			expect(Fr.pow(base, 0n)).toBe(1n);
		});

		test("raises to first power gives base", () => {
			const base = 12345n;
			expect(Fr.pow(base, 1n)).toBe(base);
		});

		test("one to any power is one", () => {
			expect(Fr.pow(1n, 100n)).toBe(1n);
		});
	});

	describe("isValid", () => {
		test("zero is valid", () => {
			expect(Fr.isValid(0n)).toBe(true);
		});

		test("values less than modulus are valid", () => {
			expect(Fr.isValid(1n)).toBe(true);
			expect(Fr.isValid(FR_MOD - 1n)).toBe(true);
		});

		test("modulus is invalid", () => {
			expect(Fr.isValid(FR_MOD)).toBe(false);
		});

		test("values greater than modulus are invalid", () => {
			expect(Fr.isValid(FR_MOD + 1n)).toBe(false);
		});

		test("negative values are invalid", () => {
			expect(Fr.isValid(-1n)).toBe(false);
		});
	});

	describe("scalar field properties", () => {
		test("modulus is the group order", () => {
			// BN254 group order (r)
			expect(FR_MOD).toBe(
				21888242871839275222246405745257275088548364400416034343698204186575808495617n,
			);
		});

		test("field closure under operations", () => {
			const a = FR_MOD - 1n;
			const b = FR_MOD - 1n;
			const sum = Fr.add(a, b);
			const product = Fr.mul(a, b);
			expect(sum).toBeGreaterThanOrEqual(0n);
			expect(sum).toBeLessThan(FR_MOD);
			expect(product).toBeGreaterThanOrEqual(0n);
			expect(product).toBeLessThan(FR_MOD);
		});
	});
});
