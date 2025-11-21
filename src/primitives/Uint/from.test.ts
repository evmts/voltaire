import { describe, it, expect } from "vitest";
import { from } from "./from.js";
import { MAX } from "./constants.js";

describe("Uint256.from", () => {
	describe("from bigint", () => {
		it("creates from zero", () => {
			const result = from(0n);
			expect(result).toBe(0n);
		});

		it("creates from small value", () => {
			const result = from(42n);
			expect(result).toBe(42n);
		});

		it("creates from max value", () => {
			const result = from(MAX);
			expect(result).toBe((1n << 256n) - 1n);
		});

		it("throws on negative", () => {
			expect(() => from(-1n)).toThrow("cannot be negative");
		});

		it("throws on overflow", () => {
			expect(() => from(MAX + 1n)).toThrow("exceeds maximum");
		});
	});

	describe("from number", () => {
		it("creates from zero", () => {
			const result = from(0);
			expect(result).toBe(0n);
		});

		it("creates from integer", () => {
			const result = from(12345);
			expect(result).toBe(12345n);
		});

		it("creates from Number.MAX_SAFE_INTEGER", () => {
			const result = from(Number.MAX_SAFE_INTEGER);
			expect(result).toBe(9007199254740991n);
		});

		it("throws on negative", () => {
			expect(() => from(-42)).toThrow("cannot be negative");
		});

		it("throws on float", () => {
			expect(() => from(3.14)).toThrow("must be an integer");
		});

		it("throws on NaN", () => {
			expect(() => from(Number.NaN)).toThrow("must be an integer");
		});
	});

	describe("from string", () => {
		it("creates from decimal string", () => {
			const result = from("12345");
			expect(result).toBe(12345n);
		});

		it("creates from hex string", () => {
			const result = from("0xff");
			expect(result).toBe(255n);
		});

		it("creates from hex string uppercase", () => {
			const result = from("0XFF");
			expect(result).toBe(255n);
		});

		it("creates from large value string", () => {
			const largeValue =
				"115792089237316195423570985008687907853269984665640564039457584007913129639935";
			const result = from(largeValue);
			expect(result).toBe(MAX);
		});

		it("creates from max value hex string", () => {
			const result = from(
				"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
			);
			expect(result).toBe(MAX);
		});

		it("throws on negative", () => {
			expect(() => from("-1")).toThrow("cannot be negative");
		});

		it("throws on overflow", () => {
			const overflowValue =
				"115792089237316195423570985008687907853269984665640564039457584007913129639936";
			expect(() => from(overflowValue)).toThrow("exceeds maximum");
		});
	});

	describe("edge cases", () => {
		it("creates from one", () => {
			const result = from(1n);
			expect(result).toBe(1n);
		});

		it("creates from MAX - 1", () => {
			const result = from(MAX - 1n);
			expect(result).toBe((1n << 256n) - 2n);
		});

		it("creates from power of 2", () => {
			const result = from(1n << 128n);
			expect(result).toBe(340282366920938463463374607431768211456n);
		});

		it("creates from Uint128 max", () => {
			const result = from((1n << 128n) - 1n);
			expect(result).toBe(340282366920938463463374607431768211455n);
		});

		it("creates from Uint64 max", () => {
			const result = from(18446744073709551615n);
			expect(result).toBe(18446744073709551615n);
		});
	});
});
