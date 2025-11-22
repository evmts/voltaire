import { describe, it, expect } from "vitest";
import { toBigInt } from "./toBigInt.js";
import { from } from "./from.js";
import { ZERO, MAX, ONE } from "./constants.js";

describe("Uint256.toBigInt", () => {
	describe("known values", () => {
		it("converts zero", () => {
			expect(toBigInt(ZERO)).toBe(0n);
		});

		it("converts one", () => {
			expect(toBigInt(ONE)).toBe(1n);
		});

		it("converts small values", () => {
			expect(toBigInt(from(42n))).toBe(42n);
		});

		it("converts large values", () => {
			expect(toBigInt(from(1000000n))).toBe(1000000n);
		});
	});

	describe("edge cases", () => {
		it("converts MAX", () => {
			expect(toBigInt(MAX)).toBe(MAX);
		});

		it("converts MAX - 1", () => {
			expect(toBigInt(MAX - 1n)).toBe(MAX - 1n);
		});
	});

	describe("large values", () => {
		it("converts 128-bit values", () => {
			const value = from(1n << 128n);
			expect(toBigInt(value)).toBe(1n << 128n);
		});

		it("converts high bit set", () => {
			const value = from(1n << 255n);
			expect(toBigInt(value)).toBe(1n << 255n);
		});

		it("converts complex pattern", () => {
			const pattern = from(0x123456789abcdefn);
			expect(toBigInt(pattern)).toBe(0x123456789abcdefn);
		});
	});

	describe("round-trip", () => {
		it("from(toBigInt(x)) = x", () => {
			const values = [0n, 1n, 42n, 1000000n, 1n << 128n, MAX];
			for (const v of values) {
				const uint = from(v);
				const bigint = toBigInt(uint);
				expect(from(bigint)).toBe(uint);
			}
		});
	});
});
