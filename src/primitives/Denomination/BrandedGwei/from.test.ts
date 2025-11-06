import { describe, expect, it } from "vitest";
import { from } from "./from.js";

describe("from", () => {
	describe("from bigint", () => {
		it("creates Gwei from bigint", () => {
			const gwei = from(1_000_000_000n);
			expect(typeof gwei).toBe("bigint");
			expect(gwei).toBe(1_000_000_000n);
		});

		it("creates Gwei from zero", () => {
			const gwei = from(0n);
			expect(gwei).toBe(0n);
		});

		it("creates Gwei from large value", () => {
			const gwei = from(1_000_000_000_000_000_000n);
			expect(gwei).toBe(1_000_000_000_000_000_000n);
		});
	});

	describe("from number", () => {
		it("creates Gwei from number", () => {
			const gwei = from(42);
			expect(typeof gwei).toBe("bigint");
			expect(gwei).toBe(42n);
		});

		it("creates Gwei from zero number", () => {
			const gwei = from(0);
			expect(gwei).toBe(0n);
		});
	});

	describe("from string", () => {
		it("creates Gwei from decimal string", () => {
			const gwei = from("1000000000");
			expect(typeof gwei).toBe("bigint");
			expect(gwei).toBe(1_000_000_000n);
		});

		it("creates Gwei from hex string", () => {
			const gwei = from("0x3b9aca00");
			expect(typeof gwei).toBe("bigint");
			expect(gwei).toBe(1_000_000_000n);
		});

		it("creates Gwei from zero string", () => {
			const gwei = from("0");
			expect(gwei).toBe(0n);
		});
	});

	describe("edge cases", () => {
		it("handles max safe integer", () => {
			const gwei = from(Number.MAX_SAFE_INTEGER);
			expect(gwei).toBe(BigInt(Number.MAX_SAFE_INTEGER));
		});

		it("handles very large bigint", () => {
			const large = 2n ** 256n - 1n;
			const gwei = from(large);
			expect(gwei).toBe(large);
		});
	});
});
