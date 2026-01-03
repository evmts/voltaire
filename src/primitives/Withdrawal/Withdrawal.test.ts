import { describe, expect, it } from "vitest";
import * as Withdrawal from "./index.js";

describe("Withdrawal", () => {
	describe("from", () => {
		it("creates Withdrawal from components", () => {
			const withdrawal = Withdrawal.from({
				index: 1000000n,
				validatorIndex: 123456,
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				amount: 32000000000n,
			});

			expect(withdrawal.index).toBe(1000000n);
			expect(withdrawal.validatorIndex).toBe(123456);
			expect(withdrawal.amount).toBe("32000000000");
			expect(withdrawal.address.length).toBe(20);
		});

		it("accepts mixed input types", () => {
			const withdrawal = Withdrawal.from({
				index: 1000000n,
				validatorIndex: "123456",
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				amount: "32000000000",
			});

			expect(withdrawal.index).toBe(1000000n);
			expect(withdrawal.validatorIndex).toBe(123456);
			expect(withdrawal.amount).toBe("32000000000");
		});

		it("accepts mixed types", () => {
			const withdrawal = Withdrawal.from({
				index: "1000000",
				validatorIndex: 123456n,
				address: new Uint8Array(20),
				amount: "0x77359400",
			});

			expect(withdrawal.index).toBe(1000000n);
			expect(withdrawal.validatorIndex).toBe(123456);
			expect(withdrawal.address.length).toBe(20);
		});

		it("accepts uint64 max index (EIP-4895 compliance)", () => {
			const UINT64_MAX = 18446744073709551615n;
			const withdrawal = Withdrawal.from({
				index: UINT64_MAX,
				validatorIndex: 123456,
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				amount: 32000000000n,
			});
			expect(withdrawal.index).toBe(UINT64_MAX);
		});

		it("rejects index exceeding uint64 max", () => {
			const UINT64_MAX = 18446744073709551615n;
			expect(() =>
				Withdrawal.from({
					index: UINT64_MAX + 1n,
					validatorIndex: 123456,
					address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
					amount: 32000000000n,
				}),
			).toThrow("exceeds uint64 max");
		});

		it("rejects invalid index", () => {
			expect(() =>
				Withdrawal.from({
					index: -1,
					validatorIndex: 123456,
					address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
					amount: 32000000000n,
				}),
			).toThrow("cannot be negative");
		});

		it("rejects invalid validator index", () => {
			expect(() =>
				Withdrawal.from({
					index: 1000000n,
					validatorIndex: -1,
					address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
					amount: 32000000000n,
				}),
			).toThrow("cannot be negative");
		});

		it("rejects invalid address", () => {
			expect(() =>
				Withdrawal.from({
					index: 1000000n,
					validatorIndex: 123456,
					address: "0xinvalid",
					amount: 32000000000n,
				}),
			).toThrow();
		});
	});

	describe("equals", () => {
		it("returns true for equal withdrawals", () => {
			const a = Withdrawal.from({
				index: 1000000n,
				validatorIndex: 123456,
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				amount: 32000000000n,
			});

			const b = Withdrawal.from({
				index: 1000000n,
				validatorIndex: 123456,
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				amount: 32000000000n,
			});

			expect(Withdrawal.equals(a, b)).toBe(true);
		});

		it("returns false for different indices", () => {
			const a = Withdrawal.from({
				index: 1000000n,
				validatorIndex: 123456,
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				amount: 32000000000n,
			});

			const b = Withdrawal.from({
				index: 1000001n,
				validatorIndex: 123456,
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				amount: 32000000000n,
			});

			expect(Withdrawal.equals(a, b)).toBe(false);
		});

		it("returns false for different validator indices", () => {
			const a = Withdrawal.from({
				index: 1000000n,
				validatorIndex: 123456,
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				amount: 32000000000n,
			});

			const b = Withdrawal.from({
				index: 1000000n,
				validatorIndex: 123457,
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				amount: 32000000000n,
			});

			expect(Withdrawal.equals(a, b)).toBe(false);
		});

		it("returns false for different addresses", () => {
			const a = Withdrawal.from({
				index: 1000000n,
				validatorIndex: 123456,
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				amount: 32000000000n,
			});

			const b = Withdrawal.from({
				index: 1000000n,
				validatorIndex: 123456,
				address: "0x0000000000000000000000000000000000000000",
				amount: 32000000000n,
			});

			expect(Withdrawal.equals(a, b)).toBe(false);
		});

		it("returns false for different amounts", () => {
			const a = Withdrawal.from({
				index: 1000000n,
				validatorIndex: 123456,
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				amount: 32000000000n,
			});

			const b = Withdrawal.from({
				index: 1000000n,
				validatorIndex: 123456,
				address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				amount: 32000000001n,
			});

			expect(Withdrawal.equals(a, b)).toBe(false);
		});
	});
});
