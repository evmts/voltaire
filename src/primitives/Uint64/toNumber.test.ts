import { describe, it, expect } from "vitest";
import { toNumber } from "./toNumber.js";
import { from } from "./from.js";
import { ZERO, ONE } from "./constants.js";

describe("Uint64.toNumber", () => {
	describe("safe conversions", () => {
		it("converts zero", () => {
			expect(toNumber(ZERO)).toBe(0);
		});

		it("converts one", () => {
			expect(toNumber(ONE)).toBe(1);
		});

		it("converts small value", () => {
			expect(toNumber(from(42n))).toBe(42);
		});

		it("converts Number.MAX_SAFE_INTEGER", () => {
			const safe = from(BigInt(Number.MAX_SAFE_INTEGER));
			expect(toNumber(safe)).toBe(Number.MAX_SAFE_INTEGER);
		});

		it("converts large safe value", () => {
			expect(toNumber(from(1000000n))).toBe(1000000);
		});
	});

	describe("unsafe conversions", () => {
		it("logs warning on value exceeding Number.MAX_SAFE_INTEGER", () => {
			const unsafe = from(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
			const result = toNumber(unsafe);
			expect(typeof result).toBe("number");
		});

		it("converts MAX with precision loss", () => {
			const max = from(18446744073709551615n);
			const result = toNumber(max);
			expect(typeof result).toBe("number");
		});

		it("converts large value with precision loss", () => {
			const large = from(99999999999999999n);
			const result = toNumber(large);
			expect(typeof result).toBe("number");
		});
	});

	describe("round-trip", () => {
		it("preserves safe integer through round-trip", () => {
			const original = 12345;
			const uint = from(original);
			expect(toNumber(uint)).toBe(original);
		});
	});
});
