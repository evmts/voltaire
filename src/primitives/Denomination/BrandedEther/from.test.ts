import { describe, expect, it } from "vitest";
import { from } from "./from.js";

describe("from", () => {
	describe("from bigint", () => {
		it("creates Ether from bigint", () => {
			const ether = from(1_000_000_000_000_000_000n);
			expect(typeof ether).toBe("bigint");
			expect(ether).toBe(1_000_000_000_000_000_000n);
		});

		it("creates Ether from zero", () => {
			const ether = from(0n);
			expect(ether).toBe(0n);
		});

		it("creates Ether from large value", () => {
			const ether = from(1_000_000_000_000_000_000_000n);
			expect(ether).toBe(1_000_000_000_000_000_000_000n);
		});
	});

	describe("from number", () => {
		it("creates Ether from number", () => {
			const ether = from(42);
			expect(typeof ether).toBe("bigint");
			expect(ether).toBe(42n);
		});

		it("creates Ether from zero number", () => {
			const ether = from(0);
			expect(ether).toBe(0n);
		});
	});

	describe("from string", () => {
		it("creates Ether from decimal string", () => {
			const ether = from("1000000000000000000");
			expect(typeof ether).toBe("bigint");
			expect(ether).toBe(1_000_000_000_000_000_000n);
		});

		it("creates Ether from hex string", () => {
			const ether = from("0xde0b6b3a7640000");
			expect(typeof ether).toBe("bigint");
			expect(ether).toBe(1_000_000_000_000_000_000n);
		});

		it("creates Ether from zero string", () => {
			const ether = from("0");
			expect(ether).toBe(0n);
		});
	});

	describe("edge cases", () => {
		it("handles max safe integer", () => {
			const ether = from(Number.MAX_SAFE_INTEGER);
			expect(ether).toBe(BigInt(Number.MAX_SAFE_INTEGER));
		});

		it("handles very large bigint", () => {
			const large = 2n ** 256n - 1n;
			const ether = from(large);
			expect(ether).toBe(large);
		});
	});
});
