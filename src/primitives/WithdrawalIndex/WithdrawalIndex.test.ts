import { describe, expect, it } from "vitest";
import * as WithdrawalIndex from "./index.js";

describe("WithdrawalIndex", () => {
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

		it("rejects negative number", () => {
			expect(() => WithdrawalIndex.from(-1)).toThrow("cannot be negative");
		});

		it("rejects negative bigint", () => {
			expect(() => WithdrawalIndex.from(-1n)).toThrow("cannot be negative");
		});

		it("rejects non-integer number", () => {
			expect(() => WithdrawalIndex.from(1.5)).toThrow("safe integer");
		});

		it("accepts max uint64 value", () => {
			const maxUint64 = 18446744073709551615n;
			const idx = WithdrawalIndex.from(maxUint64);
			expect(idx).toBe(maxUint64);
		});

		it("rejects value exceeding uint64 max", () => {
			const overMax = 18446744073709551616n;
			expect(() => WithdrawalIndex.from(overMax)).toThrow("exceeds uint64 max");
		});

		it("rejects large string value exceeding uint64", () => {
			expect(() => WithdrawalIndex.from("18446744073709551616")).toThrow(
				"exceeds uint64 max",
			);
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
