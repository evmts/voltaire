import { describe, expect, it } from "vitest";
import * as WithdrawalIndex from "./index.js";

describe("WithdrawalIndex", () => {
	describe("UINT64_MAX", () => {
		it("equals 2^64 - 1", () => {
			expect(WithdrawalIndex.UINT64_MAX).toBe(18446744073709551615n);
			expect(WithdrawalIndex.UINT64_MAX).toBe(2n ** 64n - 1n);
		});
	});

	describe("from", () => {
		it("creates WithdrawalIndex from bigint", () => {
			const idx = WithdrawalIndex.from(1000000n);
			expect(idx).toBe(1000000n);
		});

		it("creates WithdrawalIndex from number", () => {
			const idx = WithdrawalIndex.from(1000000);
			expect(idx).toBe(1000000n);
		});

		it("creates WithdrawalIndex from hex string", () => {
			const idx = WithdrawalIndex.from("0xf4240");
			expect(idx).toBe(1000000n);
		});

		it("creates WithdrawalIndex from decimal string", () => {
			const idx = WithdrawalIndex.from("1000000");
			expect(idx).toBe(1000000n);
		});

		it("accepts uint64 max value", () => {
			const idx = WithdrawalIndex.from(WithdrawalIndex.UINT64_MAX);
			expect(idx).toBe(18446744073709551615n);
		});

		it("accepts uint64 max value from hex string", () => {
			const idx = WithdrawalIndex.from("0xffffffffffffffff");
			expect(idx).toBe(18446744073709551615n);
		});

		it("rejects value exceeding uint64 max", () => {
			expect(() =>
				WithdrawalIndex.from(WithdrawalIndex.UINT64_MAX + 1n),
			).toThrow("exceeds uint64 max");
		});

		it("rejects large value exceeding uint64 max from string", () => {
			expect(() => WithdrawalIndex.from("0x10000000000000000")).toThrow(
				"exceeds uint64 max",
			);
		});

		it("rejects negative number", () => {
			expect(() => WithdrawalIndex.from(-1)).toThrow("cannot be negative");
		});

		it("rejects negative bigint", () => {
			expect(() => WithdrawalIndex.from(-1n)).toThrow("cannot be negative");
		});

		it("rejects non-integer number", () => {
			expect(() => WithdrawalIndex.from(1.5)).toThrow("safe integer");
		});
	});

	describe("toNumber", () => {
		it("converts to number", () => {
			const idx = WithdrawalIndex.from(1000000n);
			expect(WithdrawalIndex.toNumber(idx)).toBe(1000000);
		});

		it("rejects value exceeding MAX_SAFE_INTEGER", () => {
			const idx = WithdrawalIndex.from(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
			expect(() => WithdrawalIndex.toNumber(idx)).toThrow(
				"exceeds MAX_SAFE_INTEGER",
			);
		});
	});

	describe("toBigInt", () => {
		it("converts to bigint", () => {
			const idx = WithdrawalIndex.from(1000000);
			expect(WithdrawalIndex.toBigInt(idx)).toBe(1000000n);
		});
	});

	describe("equals", () => {
		it("returns true for equal indices", () => {
			const a = WithdrawalIndex.from(1000000n);
			const b = WithdrawalIndex.from(1000000n);
			expect(WithdrawalIndex.equals(a, b)).toBe(true);
		});

		it("returns false for unequal indices", () => {
			const a = WithdrawalIndex.from(1000000n);
			const b = WithdrawalIndex.from(1000001n);
			expect(WithdrawalIndex.equals(a, b)).toBe(false);
		});
	});
});
