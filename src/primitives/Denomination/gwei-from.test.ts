import { describe, expect, it } from "vitest";
import { from } from "./gwei-from.js";

describe("from", () => {
	describe("from bigint", () => {
		it("creates Gwei from bigint", () => {
			const gwei = from(1n);
			expect(typeof gwei).toBe("string");
			expect(gwei).toBe("1");
		});

		it("creates Gwei from zero", () => {
			const gwei = from(0n);
			expect(gwei).toBe("0");
		});

		it("creates Gwei from large value", () => {
			const gwei = from(1000n);
			expect(gwei).toBe("1000");
		});
	});

	describe("from number", () => {
		it("creates Gwei from number", () => {
			const gwei = from(42);
			expect(typeof gwei).toBe("string");
			expect(gwei).toBe("42");
		});

		it("creates Gwei from zero number", () => {
			const gwei = from(0);
			expect(gwei).toBe("0");
		});
	});

	describe("from string", () => {
		it("creates Gwei from decimal string", () => {
			const gwei = from("1.5");
			expect(typeof gwei).toBe("string");
			expect(gwei).toBe("1.5");
		});

		it("creates Gwei from fractional string", () => {
			const gwei = from("0.001");
			expect(typeof gwei).toBe("string");
			expect(gwei).toBe("0.001");
		});

		it("creates Gwei from zero string", () => {
			const gwei = from("0");
			expect(gwei).toBe("0");
		});
	});

	describe("edge cases", () => {
		it("handles max safe integer", () => {
			const gwei = from(Number.MAX_SAFE_INTEGER);
			expect(gwei).toBe(Number.MAX_SAFE_INTEGER.toString());
		});

		it("handles very large bigint", () => {
			const large = 2n ** 64n;
			const gwei = from(large);
			expect(gwei).toBe(large.toString());
		});
	});

	describe("negative values", () => {
		it("throws on negative bigint", () => {
			expect(() => from(-1n)).toThrow("cannot be negative");
		});

		it("throws on negative number", () => {
			expect(() => from(-1)).toThrow("cannot be negative");
		});

		it("throws on negative string", () => {
			expect(() => from("-1")).toThrow("cannot be negative");
		});

		it("throws on negative decimal string", () => {
			expect(() => from("-0.5")).toThrow("cannot be negative");
		});
	});
});
