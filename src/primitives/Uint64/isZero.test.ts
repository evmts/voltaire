import { describe, it, expect } from "vitest";
import { isZero } from "./isZero.js";
import { from } from "./from.js";
import { ZERO, ONE, MAX } from "./constants.js";

describe("Uint64.isZero", () => {
	describe("true cases", () => {
		it("returns true for 0", () => {
			expect(isZero(ZERO)).toBe(true);
		});

		it("returns true for from(0)", () => {
			expect(isZero(from(0n))).toBe(true);
		});
	});

	describe("false cases", () => {
		it("returns false for 1", () => {
			expect(isZero(ONE)).toBe(false);
		});

		it("returns false for 42", () => {
			expect(isZero(from(42n))).toBe(false);
		});

		it("returns false for MAX", () => {
			expect(isZero(MAX)).toBe(false);
		});

		it("returns false for negative wrap", () => {
			expect(isZero(MAX)).toBe(false);
		});
	});
});
