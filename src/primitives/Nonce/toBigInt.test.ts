import { describe, expect, it } from "vitest";
import * as Nonce from "./index.js";

describe("Nonce.toBigInt", () => {
	describe("conversion", () => {
		it("converts zero to bigint", () => {
			const nonce = Nonce.from(0);
			expect(Nonce.toBigInt(nonce)).toBe(0n);
		});

		it("converts small value to bigint", () => {
			const nonce = Nonce.from(42);
			expect(Nonce.toBigInt(nonce)).toBe(42n);
		});

		it("converts large value to bigint", () => {
			const nonce = Nonce.from(1000000n);
			expect(Nonce.toBigInt(nonce)).toBe(1000000n);
		});

		it("converts value from bigint input", () => {
			const nonce = Nonce.from(999999999999999n);
			expect(Nonce.toBigInt(nonce)).toBe(999999999999999n);
		});

		it("converts value from string input", () => {
			const nonce = Nonce.from("12345");
			expect(Nonce.toBigInt(nonce)).toBe(12345n);
		});

		it("converts max safe integer", () => {
			const nonce = Nonce.from(Number.MAX_SAFE_INTEGER);
			expect(Nonce.toBigInt(nonce)).toBe(9007199254740991n);
		});
	});

	describe("round-trip", () => {
		it("preserves value through from and toBigInt", () => {
			const original = 31337n;
			const nonce = Nonce.from(original);
			const result = Nonce.toBigInt(nonce);
			expect(result).toBe(original);
		});

		it("preserves zero", () => {
			const original = 0n;
			const nonce = Nonce.from(original);
			const result = Nonce.toBigInt(nonce);
			expect(result).toBe(original);
		});

		it("preserves large values", () => {
			// Max uint64 value
			const original = 18446744073709551615n;
			const nonce = Nonce.from(original);
			const result = Nonce.toBigInt(nonce);
			expect(result).toBe(original);
		});
	});

	describe("type consistency", () => {
		it("returns bigint type", () => {
			const nonce = Nonce.from(100);
			const result = Nonce.toBigInt(nonce);
			expect(typeof result).toBe("bigint");
		});
	});
});
