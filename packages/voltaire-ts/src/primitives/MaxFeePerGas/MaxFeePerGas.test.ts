import { describe, expect, it } from "vitest";
import * as MaxFeePerGas from "./index.js";

describe("MaxFeePerGas", () => {
	describe("from", () => {
		it("creates from bigint", () => {
			const fee = MaxFeePerGas.from(100000000000n);
			expect(fee).toBe(100000000000n);
		});

		it("creates from number", () => {
			const fee = MaxFeePerGas.from(100000000000);
			expect(fee).toBe(100000000000n);
		});

		it("creates from hex string", () => {
			const fee = MaxFeePerGas.from("0x174876e800");
			expect(fee).toBe(100000000000n);
		});

		it("throws on negative value", () => {
			expect(() => MaxFeePerGas.from(-1n)).toThrow("cannot be negative");
		});

		it("throws on non-integer number", () => {
			expect(() => MaxFeePerGas.from(1.5)).toThrow("must be an integer");
		});

		it("throws on invalid string", () => {
			expect(() => MaxFeePerGas.from("invalid")).toThrow(
				"must be hex with 0x prefix",
			);
		});
	});

	describe("fromGwei", () => {
		it("converts Gwei to Wei", () => {
			const fee = MaxFeePerGas.fromGwei(100n);
			expect(fee).toBe(100000000000n);
		});

		it("converts number Gwei to Wei", () => {
			const fee = MaxFeePerGas.fromGwei(100);
			expect(fee).toBe(100000000000n);
		});
	});

	describe("fromWei", () => {
		it("creates from Wei", () => {
			const fee = MaxFeePerGas.fromWei(100000000000n);
			expect(fee).toBe(100000000000n);
		});
	});

	describe("toGwei", () => {
		it("converts Wei to Gwei", () => {
			const fee = MaxFeePerGas.from(100000000000n);
			expect(MaxFeePerGas.toGwei(fee)).toBe(100n);
		});
	});

	describe("toWei", () => {
		it("returns Wei value", () => {
			const fee = MaxFeePerGas.from(100000000000n);
			expect(MaxFeePerGas.toWei(fee)).toBe(100000000000n);
		});
	});

	describe("toNumber", () => {
		it("converts to number", () => {
			const fee = MaxFeePerGas.from(100000000000n);
			expect(MaxFeePerGas.toNumber(fee)).toBe(100000000000);
		});
	});

	describe("toBigInt", () => {
		it("returns bigint value", () => {
			const fee = MaxFeePerGas.from(100000000000n);
			expect(MaxFeePerGas.toBigInt(fee)).toBe(100000000000n);
		});
	});

	describe("equals", () => {
		it("returns true for equal values", () => {
			const fee1 = MaxFeePerGas.from(100000000000n);
			const fee2 = MaxFeePerGas.from(100000000000n);
			expect(MaxFeePerGas.equals(fee1, fee2)).toBe(true);
		});

		it("returns false for different values", () => {
			const fee1 = MaxFeePerGas.from(100000000000n);
			const fee2 = MaxFeePerGas.from(120000000000n);
			expect(MaxFeePerGas.equals(fee1, fee2)).toBe(false);
		});
	});

	describe("compare", () => {
		it("returns -1 when first is less", () => {
			const fee1 = MaxFeePerGas.from(100000000000n);
			const fee2 = MaxFeePerGas.from(120000000000n);
			expect(MaxFeePerGas.compare(fee1, fee2)).toBe(-1);
		});

		it("returns 0 when equal", () => {
			const fee1 = MaxFeePerGas.from(100000000000n);
			const fee2 = MaxFeePerGas.from(100000000000n);
			expect(MaxFeePerGas.compare(fee1, fee2)).toBe(0);
		});

		it("returns 1 when first is greater", () => {
			const fee1 = MaxFeePerGas.from(120000000000n);
			const fee2 = MaxFeePerGas.from(100000000000n);
			expect(MaxFeePerGas.compare(fee1, fee2)).toBe(1);
		});
	});

	describe("real-world scenarios", () => {
		it("handles typical transaction max fees", () => {
			const conservative = MaxFeePerGas.fromGwei(50n); // Conservative
			const normal = MaxFeePerGas.fromGwei(100n); // Normal
			const aggressive = MaxFeePerGas.fromGwei(200n); // Aggressive

			expect(MaxFeePerGas.toGwei(conservative)).toBe(50n);
			expect(MaxFeePerGas.toGwei(normal)).toBe(100n);
			expect(MaxFeePerGas.toGwei(aggressive)).toBe(200n);
		});

		it("handles high-priority transactions", () => {
			const urgentFee = MaxFeePerGas.fromGwei(500n);
			expect(MaxFeePerGas.toGwei(urgentFee)).toBe(500n);
		});
	});
});
