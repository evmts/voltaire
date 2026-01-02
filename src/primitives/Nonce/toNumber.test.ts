import { describe, expect, it } from "vitest";
import * as Nonce from "./index.js";

describe("Nonce.toNumber", () => {
	describe("conversion", () => {
		it("converts zero to number", () => {
			const nonce = Nonce.from(0);
			expect(Nonce.toNumber(nonce)).toBe(0);
		});

		it("converts small value to number", () => {
			const nonce = Nonce.from(42);
			expect(Nonce.toNumber(nonce)).toBe(42);
		});

		it("converts value from bigint input", () => {
			const nonce = Nonce.from(1000n);
			expect(Nonce.toNumber(nonce)).toBe(1000);
		});

		it("converts value from string input", () => {
			const nonce = Nonce.from("12345");
			expect(Nonce.toNumber(nonce)).toBe(12345);
		});

		it("converts max safe integer", () => {
			const nonce = Nonce.from(Number.MAX_SAFE_INTEGER);
			expect(Nonce.toNumber(nonce)).toBe(9007199254740991);
		});
	});

	describe("round-trip", () => {
		it("preserves value through from and toNumber", () => {
			const original = 31337;
			const nonce = Nonce.from(original);
			const result = Nonce.toNumber(nonce);
			expect(result).toBe(original);
		});

		it("preserves zero", () => {
			const original = 0;
			const nonce = Nonce.from(original);
			const result = Nonce.toNumber(nonce);
			expect(result).toBe(original);
		});

		it("preserves typical transaction nonce values", () => {
			const values = [0, 1, 10, 100, 1000, 10000];
			for (const val of values) {
				const nonce = Nonce.from(val);
				expect(Nonce.toNumber(nonce)).toBe(val);
			}
		});
	});

	describe("error cases", () => {
		it("throws on value exceeding MAX_SAFE_INTEGER", () => {
			const nonce = Nonce.from(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
			expect(() => Nonce.toNumber(nonce)).toThrow();
		});

		it("throws on very large value", () => {
			// Use a value larger than MAX_SAFE_INTEGER but within uint64 range
			const nonce = Nonce.from(BigInt(Number.MAX_SAFE_INTEGER) + 1000n);
			expect(() => Nonce.toNumber(nonce)).toThrow();
		});
	});

	describe("type consistency", () => {
		it("returns number type", () => {
			const nonce = Nonce.from(100);
			const result = Nonce.toNumber(nonce);
			expect(typeof result).toBe("number");
		});
	});
});
