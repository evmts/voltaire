import { describe, expect, it } from "vitest";
import { ONE, ZERO } from "./constants.js";
import { from } from "./from.js";
import { toNumber } from "./toNumber.js";

describe("Uint256.toNumber", () => {
	describe("known values", () => {
		it("converts zero", () => {
			expect(toNumber(ZERO)).toBe(0);
		});

		it("converts one", () => {
			expect(toNumber(ONE)).toBe(1);
		});

		it("converts small values", () => {
			expect(toNumber(from(42n))).toBe(42);
		});

		it("converts larger values", () => {
			expect(toNumber(from(1000000n))).toBe(1000000);
		});
	});

	describe("safe integer range", () => {
		it("converts Number.MAX_SAFE_INTEGER", () => {
			const safe = from(BigInt(Number.MAX_SAFE_INTEGER));
			expect(toNumber(safe)).toBe(Number.MAX_SAFE_INTEGER);
		});

		it("throws on values above MAX_SAFE_INTEGER", () => {
			const unsafe = from(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
			expect(() => toNumber(unsafe)).toThrow();
		});

		it("converts negative zero edge case", () => {
			expect(toNumber(ZERO)).toBe(0);
			expect(Object.is(toNumber(ZERO), 0)).toBe(true);
		});
	});

	describe("edge cases", () => {
		it("throws on large Uint256 values", () => {
			expect(() => toNumber(from(1n << 128n))).toThrow();
		});

		it("throws on MAX", () => {
			expect(() =>
				toNumber(from((1n << 256n) - 1n) & ((1n << 256n) - 1n)),
			).toThrow();
		});
	});

	describe("round-trip within safe range", () => {
		it("from(toNumber(x)) = x for safe integers", () => {
			const values = [0, 1, 42, 1000, 999999];
			for (const v of values) {
				const uint = from(BigInt(v));
				const num = toNumber(uint);
				expect(from(BigInt(num))).toBe(uint);
			}
		});
	});
});
