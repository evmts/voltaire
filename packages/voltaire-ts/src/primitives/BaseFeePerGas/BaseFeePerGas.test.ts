import { describe, expect, it } from "vitest";
import * as BaseFeePerGas from "./index.js";

describe("BaseFeePerGas", () => {
	describe("from", () => {
		it("creates from bigint", () => {
			const fee = BaseFeePerGas.from(25000000000n);
			expect(fee).toBe(25000000000n);
		});

		it("creates from number", () => {
			const fee = BaseFeePerGas.from(25000000000);
			expect(fee).toBe(25000000000n);
		});

		it("creates from hex string", () => {
			const fee = BaseFeePerGas.from("0x5d21dba00");
			expect(fee).toBe(25000000000n);
		});

		it("throws on negative value", () => {
			expect(() => BaseFeePerGas.from(-1n)).toThrow("cannot be negative");
		});

		it("throws on non-integer number", () => {
			expect(() => BaseFeePerGas.from(1.5)).toThrow("must be an integer");
		});

		it("throws on invalid string", () => {
			expect(() => BaseFeePerGas.from("invalid")).toThrow(
				"must be hex with 0x prefix",
			);
		});
	});

	describe("fromGwei", () => {
		it("converts Gwei to Wei", () => {
			const fee = BaseFeePerGas.fromGwei(25n);
			expect(fee).toBe(25000000000n);
		});

		it("converts number Gwei to Wei", () => {
			const fee = BaseFeePerGas.fromGwei(25);
			expect(fee).toBe(25000000000n);
		});
	});

	describe("fromWei", () => {
		it("creates from Wei", () => {
			const fee = BaseFeePerGas.fromWei(25000000000n);
			expect(fee).toBe(25000000000n);
		});
	});

	describe("toGwei", () => {
		it("converts Wei to Gwei", () => {
			const fee = BaseFeePerGas.from(25000000000n);
			expect(BaseFeePerGas.toGwei(fee)).toBe(25n);
		});
	});

	describe("toWei", () => {
		it("returns Wei value", () => {
			const fee = BaseFeePerGas.from(25000000000n);
			expect(BaseFeePerGas.toWei(fee)).toBe(25000000000n);
		});
	});

	describe("toNumber", () => {
		it("converts to number", () => {
			const fee = BaseFeePerGas.from(25000000000n);
			expect(BaseFeePerGas.toNumber(fee)).toBe(25000000000);
		});
	});

	describe("toBigInt", () => {
		it("returns bigint value", () => {
			const fee = BaseFeePerGas.from(25000000000n);
			expect(BaseFeePerGas.toBigInt(fee)).toBe(25000000000n);
		});
	});

	describe("equals", () => {
		it("returns true for equal values", () => {
			const fee1 = BaseFeePerGas.from(25000000000n);
			const fee2 = BaseFeePerGas.from(25000000000n);
			expect(BaseFeePerGas.equals(fee1, fee2)).toBe(true);
		});

		it("returns false for different values", () => {
			const fee1 = BaseFeePerGas.from(25000000000n);
			const fee2 = BaseFeePerGas.from(30000000000n);
			expect(BaseFeePerGas.equals(fee1, fee2)).toBe(false);
		});
	});

	describe("compare", () => {
		it("returns -1 when first is less", () => {
			const fee1 = BaseFeePerGas.from(25000000000n);
			const fee2 = BaseFeePerGas.from(30000000000n);
			expect(BaseFeePerGas.compare(fee1, fee2)).toBe(-1);
		});

		it("returns 0 when equal", () => {
			const fee1 = BaseFeePerGas.from(25000000000n);
			const fee2 = BaseFeePerGas.from(25000000000n);
			expect(BaseFeePerGas.compare(fee1, fee2)).toBe(0);
		});

		it("returns 1 when first is greater", () => {
			const fee1 = BaseFeePerGas.from(30000000000n);
			const fee2 = BaseFeePerGas.from(25000000000n);
			expect(BaseFeePerGas.compare(fee1, fee2)).toBe(1);
		});
	});

	describe("real-world scenarios", () => {
		it("handles typical mainnet base fees", () => {
			const lowCongestion = BaseFeePerGas.fromGwei(15n); // Low congestion
			const mediumCongestion = BaseFeePerGas.fromGwei(30n); // Medium
			const highCongestion = BaseFeePerGas.fromGwei(100n); // High congestion

			expect(BaseFeePerGas.toGwei(lowCongestion)).toBe(15n);
			expect(BaseFeePerGas.toGwei(mediumCongestion)).toBe(30n);
			expect(BaseFeePerGas.toGwei(highCongestion)).toBe(100n);
		});

		it("handles zero base fee (testnets)", () => {
			const fee = BaseFeePerGas.from(0n);
			expect(BaseFeePerGas.toGwei(fee)).toBe(0n);
		});
	});
});
