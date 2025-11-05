import { describe, expect, it } from "vitest";
import { from } from "./from.js";

describe("from", () => {
	describe("from bigint", () => {
		it("creates Wei from bigint", () => {
			const wei = from(1_000_000_000n);
			expect(typeof wei).toBe("bigint");
			expect(wei).toBe(1_000_000_000n);
		});

		it("creates Wei from zero", () => {
			const wei = from(0n);
			expect(wei).toBe(0n);
		});

		it("creates Wei from large value", () => {
			const wei = from(1_000_000_000_000_000_000n);
			expect(wei).toBe(1_000_000_000_000_000_000n);
		});
	});

	describe("from number", () => {
		it("creates Wei from number", () => {
			const wei = from(42);
			expect(typeof wei).toBe("bigint");
			expect(wei).toBe(42n);
		});

		it("creates Wei from zero number", () => {
			const wei = from(0);
			expect(wei).toBe(0n);
		});
	});

	describe("from string", () => {
		it("creates Wei from decimal string", () => {
			const wei = from("1000000000");
			expect(typeof wei).toBe("bigint");
			expect(wei).toBe(1_000_000_000n);
		});

		it("creates Wei from hex string", () => {
			const wei = from("0x3b9aca00");
			expect(typeof wei).toBe("bigint");
			expect(wei).toBe(1_000_000_000n);
		});

		it("creates Wei from zero string", () => {
			const wei = from("0");
			expect(wei).toBe(0n);
		});
	});

	describe("edge cases", () => {
		it("handles max safe integer", () => {
			const wei = from(Number.MAX_SAFE_INTEGER);
			expect(wei).toBe(BigInt(Number.MAX_SAFE_INTEGER));
		});

		it("handles very large bigint", () => {
			const large = 2n ** 256n - 1n;
			const wei = from(large);
			expect(wei).toBe(large);
		});
	});
});
