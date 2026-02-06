import { describe, expect, it } from "vitest";
import * as EffectiveGasPrice from "./index.js";

describe("EffectiveGasPrice", () => {
	describe("from", () => {
		it("creates from bigint", () => {
			const price = EffectiveGasPrice.from(27000000000n);
			expect(price).toBe(27000000000n);
		});

		it("creates from number", () => {
			const price = EffectiveGasPrice.from(27000000000);
			expect(price).toBe(27000000000n);
		});

		it("creates from hex string", () => {
			const price = EffectiveGasPrice.from("0x64da46800");
			expect(price).toBe(27072423936n);
		});

		it("throws on negative value", () => {
			expect(() => EffectiveGasPrice.from(-1n)).toThrow("cannot be negative");
		});

		it("throws on non-integer number", () => {
			expect(() => EffectiveGasPrice.from(1.5)).toThrow("must be an integer");
		});

		it("throws on invalid string", () => {
			expect(() => EffectiveGasPrice.from("invalid")).toThrow(
				"must be hex with 0x prefix",
			);
		});
	});

	describe("calculate", () => {
		it("calculates effective gas price when within limits", () => {
			const baseFee = 25000000000n; // 25 Gwei
			const maxFee = 100000000000n; // 100 Gwei
			const maxPriorityFee = 2000000000n; // 2 Gwei

			const effective = EffectiveGasPrice.calculate(
				baseFee,
				maxFee,
				maxPriorityFee,
			);
			expect(effective).toBe(27000000000n); // 25 + 2 = 27 Gwei
		});

		it("caps priority fee when maxFee is close to baseFee", () => {
			const baseFee = 25000000000n; // 25 Gwei
			const maxFee = 26000000000n; // 26 Gwei (only 1 Gwei room)
			const maxPriorityFee = 2000000000n; // 2 Gwei requested

			const effective = EffectiveGasPrice.calculate(
				baseFee,
				maxFee,
				maxPriorityFee,
			);
			expect(effective).toBe(26000000000n); // 25 + 1 = 26 Gwei (capped)
		});

		it("handles zero priority fee", () => {
			const baseFee = 25000000000n; // 25 Gwei
			const maxFee = 100000000000n; // 100 Gwei
			const maxPriorityFee = 0n; // 0 Gwei

			const effective = EffectiveGasPrice.calculate(
				baseFee,
				maxFee,
				maxPriorityFee,
			);
			expect(effective).toBe(25000000000n); // 25 + 0 = 25 Gwei
		});

		it("handles maxFee equal to baseFee", () => {
			const baseFee = 25000000000n; // 25 Gwei
			const maxFee = 25000000000n; // 25 Gwei
			const maxPriorityFee = 2000000000n; // 2 Gwei requested

			const effective = EffectiveGasPrice.calculate(
				baseFee,
				maxFee,
				maxPriorityFee,
			);
			expect(effective).toBe(25000000000n); // Capped at maxFee
		});

		it("handles large priority fee within maxFee budget", () => {
			const baseFee = 25000000000n; // 25 Gwei
			const maxFee = 100000000000n; // 100 Gwei
			const maxPriorityFee = 10000000000n; // 10 Gwei

			const effective = EffectiveGasPrice.calculate(
				baseFee,
				maxFee,
				maxPriorityFee,
			);
			expect(effective).toBe(35000000000n); // 25 + 10 = 35 Gwei
		});

		it("handles priority fee larger than available budget", () => {
			const baseFee = 25000000000n; // 25 Gwei
			const maxFee = 30000000000n; // 30 Gwei
			const maxPriorityFee = 10000000000n; // 10 Gwei requested

			const effective = EffectiveGasPrice.calculate(
				baseFee,
				maxFee,
				maxPriorityFee,
			);
			expect(effective).toBe(30000000000n); // Capped at maxFee
		});
	});

	describe("fromGwei", () => {
		it("converts Gwei to Wei", () => {
			const price = EffectiveGasPrice.fromGwei(27n);
			expect(price).toBe(27000000000n);
		});

		it("converts number Gwei to Wei", () => {
			const price = EffectiveGasPrice.fromGwei(27);
			expect(price).toBe(27000000000n);
		});
	});

	describe("fromWei", () => {
		it("creates from Wei", () => {
			const price = EffectiveGasPrice.fromWei(27000000000n);
			expect(price).toBe(27000000000n);
		});
	});

	describe("toGwei", () => {
		it("converts Wei to Gwei", () => {
			const price = EffectiveGasPrice.from(27000000000n);
			expect(EffectiveGasPrice.toGwei(price)).toBe(27n);
		});
	});

	describe("toWei", () => {
		it("returns Wei value", () => {
			const price = EffectiveGasPrice.from(27000000000n);
			expect(EffectiveGasPrice.toWei(price)).toBe(27000000000n);
		});
	});

	describe("toNumber", () => {
		it("converts to number", () => {
			const price = EffectiveGasPrice.from(27000000000n);
			expect(EffectiveGasPrice.toNumber(price)).toBe(27000000000);
		});
	});

	describe("toBigInt", () => {
		it("returns bigint value", () => {
			const price = EffectiveGasPrice.from(27000000000n);
			expect(EffectiveGasPrice.toBigInt(price)).toBe(27000000000n);
		});
	});

	describe("equals", () => {
		it("returns true for equal values", () => {
			const price1 = EffectiveGasPrice.from(27000000000n);
			const price2 = EffectiveGasPrice.from(27000000000n);
			expect(EffectiveGasPrice.equals(price1, price2)).toBe(true);
		});

		it("returns false for different values", () => {
			const price1 = EffectiveGasPrice.from(27000000000n);
			const price2 = EffectiveGasPrice.from(30000000000n);
			expect(EffectiveGasPrice.equals(price1, price2)).toBe(false);
		});
	});

	describe("compare", () => {
		it("returns -1 when first is less", () => {
			const price1 = EffectiveGasPrice.from(27000000000n);
			const price2 = EffectiveGasPrice.from(30000000000n);
			expect(EffectiveGasPrice.compare(price1, price2)).toBe(-1);
		});

		it("returns 0 when equal", () => {
			const price1 = EffectiveGasPrice.from(27000000000n);
			const price2 = EffectiveGasPrice.from(27000000000n);
			expect(EffectiveGasPrice.compare(price1, price2)).toBe(0);
		});

		it("returns 1 when first is greater", () => {
			const price1 = EffectiveGasPrice.from(30000000000n);
			const price2 = EffectiveGasPrice.from(27000000000n);
			expect(EffectiveGasPrice.compare(price1, price2)).toBe(1);
		});
	});

	describe("real-world scenarios", () => {
		it("handles typical mainnet transaction", () => {
			const baseFee = 25000000000n; // 25 Gwei
			const maxFee = 100000000000n; // 100 Gwei
			const maxPriorityFee = 2000000000n; // 2 Gwei tip

			const effective = EffectiveGasPrice.calculate(
				baseFee,
				maxFee,
				maxPriorityFee,
			);
			expect(EffectiveGasPrice.toGwei(effective)).toBe(27n);
		});

		it("handles high congestion period", () => {
			const baseFee = 150000000000n; // 150 Gwei
			const maxFee = 200000000000n; // 200 Gwei
			const maxPriorityFee = 5000000000n; // 5 Gwei tip

			const effective = EffectiveGasPrice.calculate(
				baseFee,
				maxFee,
				maxPriorityFee,
			);
			expect(EffectiveGasPrice.toGwei(effective)).toBe(155n);
		});

		it("handles low congestion (near zero base fee)", () => {
			const baseFee = 1000000000n; // 1 Gwei
			const maxFee = 50000000000n; // 50 Gwei
			const maxPriorityFee = 2000000000n; // 2 Gwei tip

			const effective = EffectiveGasPrice.calculate(
				baseFee,
				maxFee,
				maxPriorityFee,
			);
			expect(EffectiveGasPrice.toGwei(effective)).toBe(3n);
		});
	});
});
