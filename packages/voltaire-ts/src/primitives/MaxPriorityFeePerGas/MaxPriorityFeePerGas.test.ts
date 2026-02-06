import { describe, expect, it } from "vitest";
import * as MaxPriorityFeePerGas from "./index.js";

describe("MaxPriorityFeePerGas", () => {
	describe("from", () => {
		it("creates from bigint", () => {
			const fee = MaxPriorityFeePerGas.from(2000000000n);
			expect(fee).toBe(2000000000n);
		});

		it("creates from number", () => {
			const fee = MaxPriorityFeePerGas.from(2000000000);
			expect(fee).toBe(2000000000n);
		});

		it("creates from hex string", () => {
			const fee = MaxPriorityFeePerGas.from("0x77359400");
			expect(fee).toBe(2000000000n);
		});

		it("throws on negative value", () => {
			expect(() => MaxPriorityFeePerGas.from(-1n)).toThrow(
				"cannot be negative",
			);
		});

		it("throws on non-integer number", () => {
			expect(() => MaxPriorityFeePerGas.from(1.5)).toThrow(
				"must be an integer",
			);
		});

		it("throws on invalid string", () => {
			expect(() => MaxPriorityFeePerGas.from("invalid")).toThrow(
				"must be hex with 0x prefix",
			);
		});
	});

	describe("fromGwei", () => {
		it("converts Gwei to Wei", () => {
			const fee = MaxPriorityFeePerGas.fromGwei(2n);
			expect(fee).toBe(2000000000n);
		});

		it("converts number Gwei to Wei", () => {
			const fee = MaxPriorityFeePerGas.fromGwei(2);
			expect(fee).toBe(2000000000n);
		});
	});

	describe("fromWei", () => {
		it("creates from Wei", () => {
			const fee = MaxPriorityFeePerGas.fromWei(2000000000n);
			expect(fee).toBe(2000000000n);
		});
	});

	describe("toGwei", () => {
		it("converts Wei to Gwei", () => {
			const fee = MaxPriorityFeePerGas.from(2000000000n);
			expect(MaxPriorityFeePerGas.toGwei(fee)).toBe(2n);
		});
	});

	describe("toWei", () => {
		it("returns Wei value", () => {
			const fee = MaxPriorityFeePerGas.from(2000000000n);
			expect(MaxPriorityFeePerGas.toWei(fee)).toBe(2000000000n);
		});
	});

	describe("toNumber", () => {
		it("converts to number", () => {
			const fee = MaxPriorityFeePerGas.from(2000000000n);
			expect(MaxPriorityFeePerGas.toNumber(fee)).toBe(2000000000);
		});
	});

	describe("toBigInt", () => {
		it("returns bigint value", () => {
			const fee = MaxPriorityFeePerGas.from(2000000000n);
			expect(MaxPriorityFeePerGas.toBigInt(fee)).toBe(2000000000n);
		});
	});

	describe("equals", () => {
		it("returns true for equal values", () => {
			const fee1 = MaxPriorityFeePerGas.from(2000000000n);
			const fee2 = MaxPriorityFeePerGas.from(2000000000n);
			expect(MaxPriorityFeePerGas.equals(fee1, fee2)).toBe(true);
		});

		it("returns false for different values", () => {
			const fee1 = MaxPriorityFeePerGas.from(2000000000n);
			const fee2 = MaxPriorityFeePerGas.from(5000000000n);
			expect(MaxPriorityFeePerGas.equals(fee1, fee2)).toBe(false);
		});
	});

	describe("compare", () => {
		it("returns -1 when first is less", () => {
			const fee1 = MaxPriorityFeePerGas.from(2000000000n);
			const fee2 = MaxPriorityFeePerGas.from(5000000000n);
			expect(MaxPriorityFeePerGas.compare(fee1, fee2)).toBe(-1);
		});

		it("returns 0 when equal", () => {
			const fee1 = MaxPriorityFeePerGas.from(2000000000n);
			const fee2 = MaxPriorityFeePerGas.from(2000000000n);
			expect(MaxPriorityFeePerGas.compare(fee1, fee2)).toBe(0);
		});

		it("returns 1 when first is greater", () => {
			const fee1 = MaxPriorityFeePerGas.from(5000000000n);
			const fee2 = MaxPriorityFeePerGas.from(2000000000n);
			expect(MaxPriorityFeePerGas.compare(fee1, fee2)).toBe(1);
		});
	});

	describe("real-world scenarios", () => {
		it("handles typical priority fees", () => {
			const low = MaxPriorityFeePerGas.fromGwei(1n); // Low priority
			const normal = MaxPriorityFeePerGas.fromGwei(2n); // Normal
			const high = MaxPriorityFeePerGas.fromGwei(5n); // High priority

			expect(MaxPriorityFeePerGas.toGwei(low)).toBe(1n);
			expect(MaxPriorityFeePerGas.toGwei(normal)).toBe(2n);
			expect(MaxPriorityFeePerGas.toGwei(high)).toBe(5n);
		});

		it("handles zero tip (minimum priority)", () => {
			const fee = MaxPriorityFeePerGas.from(0n);
			expect(MaxPriorityFeePerGas.toGwei(fee)).toBe(0n);
		});

		it("handles urgent priority fees", () => {
			const urgentFee = MaxPriorityFeePerGas.fromGwei(10n);
			expect(MaxPriorityFeePerGas.toGwei(urgentFee)).toBe(10n);
		});
	});
});
