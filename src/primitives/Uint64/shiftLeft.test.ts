import { describe, expect, it } from "vitest";
import { ONE, ZERO } from "./constants.js";
import { from } from "./from.js";
import { shiftLeft } from "./shiftLeft.js";

describe("Uint64.shiftLeft", () => {
	describe("known values", () => {
		it("1 << 0 = 1", () => {
			const result = shiftLeft(ONE, 0);
			expect(result).toBe(1n);
		});

		it("1 << 1 = 2", () => {
			const result = shiftLeft(ONE, 1);
			expect(result).toBe(2n);
		});

		it("1 << 8 = 256", () => {
			const result = shiftLeft(ONE, 8);
			expect(result).toBe(256n);
		});

		it("2 << 3 = 16", () => {
			const result = shiftLeft(from(2n), 3);
			expect(result).toBe(16n);
		});

		it("5 << 4 = 80", () => {
			const result = shiftLeft(from(5n), 4);
			expect(result).toBe(80n);
		});

		it("0xff << 8 = 0xff00", () => {
			const result = shiftLeft(from(0xffn), 8);
			expect(result).toBe(0xff00n);
		});
	});

	describe("edge cases", () => {
		it("0 << n = 0", () => {
			const result = shiftLeft(ZERO, 10);
			expect(result).toBe(0n);
		});

		it("n << 0 = n", () => {
			const result = shiftLeft(from(42n), 0);
			expect(result).toBe(42n);
		});

		it("1 << 63 sets high bit", () => {
			const result = shiftLeft(ONE, 63);
			expect(result).toBe(1n << 63n);
		});

		it("wraps on overflow", () => {
			const result = shiftLeft(ONE, 64);
			expect(result).toBe(0n);
		});

		it("large shift wraps", () => {
			const result = shiftLeft(ONE, 65);
			expect(result).toBe(0n);
		});
	});

	describe("properties", () => {
		it("equivalent to multiplication: a << n = a * 2^n", () => {
			const a = from(5n);
			const n = 3;
			expect(shiftLeft(a, n)).toBe(a * (1n << BigInt(n)));
		});

		it("chaining: (a << m) << n = a << (m + n)", () => {
			const a = from(5n);
			const m = 2;
			const n = 3;
			expect(shiftLeft(shiftLeft(a, m), n)).toBe(shiftLeft(a, m + n));
		});
	});
});
