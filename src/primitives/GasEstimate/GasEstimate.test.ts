import { describe, expect, it } from "vitest";
import * as GasEstimate from "./index.js";

describe("GasEstimate", () => {
	describe("from", () => {
		it("creates from bigint", () => {
			const estimate = GasEstimate.from(51234n);
			expect(estimate).toBe(51234n);
		});

		it("creates from number", () => {
			const estimate = GasEstimate.from(21000);
			expect(estimate).toBe(21000n);
		});

		it("creates from string", () => {
			const estimate = GasEstimate.from("51234");
			expect(estimate).toBe(51234n);
		});

		it("throws on negative value", () => {
			expect(() => GasEstimate.from(-1n)).toThrow(
				"Gas estimate must be non-negative",
			);
		});

		it("accepts zero", () => {
			const estimate = GasEstimate.from(0n);
			expect(estimate).toBe(0n);
		});

		it("accepts large values", () => {
			const estimate = GasEstimate.from(30_000_000n);
			expect(estimate).toBe(30_000_000n);
		});
	});

	describe("toNumber", () => {
		it("converts to number", () => {
			const estimate = GasEstimate.from(51234n);
			expect(GasEstimate.toNumber(estimate)).toBe(51234);
		});

		it("converts with wrapper", () => {
			expect(GasEstimate.toNumber(51234n)).toBe(51234);
		});
	});

	describe("toBigInt", () => {
		it("returns bigint identity", () => {
			const estimate = GasEstimate.from(51234n);
			expect(GasEstimate.toBigInt(estimate)).toBe(51234n);
		});

		it("converts with wrapper", () => {
			expect(GasEstimate.toBigInt(51234)).toBe(51234n);
		});
	});

	describe("toHex", () => {
		it("converts to hex", () => {
			const estimate = GasEstimate.from(51234n);
			expect(GasEstimate.toHex(estimate)).toBe("0xc822");
		});

		it("converts zero", () => {
			expect(GasEstimate.toHex(0n)).toBe("0x0");
		});

		it("converts large value", () => {
			expect(GasEstimate.toHex(30_000_000n)).toBe("0x1c9c380");
		});
	});

	describe("equals", () => {
		it("returns true for equal values", () => {
			const a = GasEstimate.from(51234n);
			const b = GasEstimate.from(51234n);
			expect(GasEstimate._equals.call(a, b)).toBe(true);
		});

		it("returns false for different values", () => {
			const a = GasEstimate.from(51234n);
			const b = GasEstimate.from(21000n);
			expect(GasEstimate._equals.call(a, b)).toBe(false);
		});

		it("works with wrapper", () => {
			expect(GasEstimate.equals(51234n, 51234n)).toBe(true);
			expect(GasEstimate.equals(51234n, 21000n)).toBe(false);
		});
	});

	describe("compare", () => {
		it("returns -1 when first is smaller", () => {
			const a = GasEstimate.from(21000n);
			const b = GasEstimate.from(51234n);
			expect(GasEstimate._compare.call(a, b)).toBe(-1);
		});

		it("returns 0 when equal", () => {
			const a = GasEstimate.from(51234n);
			const b = GasEstimate.from(51234n);
			expect(GasEstimate._compare.call(a, b)).toBe(0);
		});

		it("returns 1 when first is larger", () => {
			const a = GasEstimate.from(51234n);
			const b = GasEstimate.from(21000n);
			expect(GasEstimate._compare.call(a, b)).toBe(1);
		});

		it("works with wrapper", () => {
			expect(GasEstimate.compare(21000n, 51234n)).toBe(-1);
			expect(GasEstimate.compare(51234n, 51234n)).toBe(0);
			expect(GasEstimate.compare(51234n, 21000n)).toBe(1);
		});
	});

	describe("withBuffer", () => {
		it("adds 20% buffer", () => {
			const estimate = GasEstimate.from(100_000n);
			const buffered = GasEstimate._withBuffer.call(estimate, 20);
			expect(buffered).toBe(120_000n);
		});

		it("adds 30% buffer", () => {
			const estimate = GasEstimate.from(100_000n);
			const buffered = GasEstimate._withBuffer.call(estimate, 30);
			expect(buffered).toBe(130_000n);
		});

		it("adds 50% buffer", () => {
			const estimate = GasEstimate.from(50_000n);
			const buffered = GasEstimate._withBuffer.call(estimate, 50);
			expect(buffered).toBe(75_000n);
		});

		it("handles 0% buffer", () => {
			const estimate = GasEstimate.from(100_000n);
			const buffered = GasEstimate._withBuffer.call(estimate, 0);
			expect(buffered).toBe(100_000n);
		});

		it("throws on negative buffer", () => {
			const estimate = GasEstimate.from(100_000n);
			expect(() => GasEstimate._withBuffer.call(estimate, -10)).toThrow(
				"Buffer percentage must be non-negative",
			);
		});

		it("works with wrapper", () => {
			const buffered = GasEstimate.withBuffer(100_000n, 20);
			expect(buffered).toBe(120_000n);
		});

		it("handles fractional percentages", () => {
			const estimate = GasEstimate.from(100_000n);
			const buffered = GasEstimate._withBuffer.call(estimate, 12.5);
			expect(buffered).toBe(112_500n);
		});

		it("handles realistic estimate", () => {
			const estimate = GasEstimate.from(51_234n);
			const buffered = GasEstimate._withBuffer.call(estimate, 25);
			expect(buffered).toBe(64_042n);
		});
	});

	describe("toGasLimit", () => {
		it("converts to gas limit", () => {
			const estimate = GasEstimate.from(100_000n);
			const limit = GasEstimate._toGasLimit.call(estimate);
			expect(limit).toBe(100_000n);
		});

		it("works after adding buffer", () => {
			const estimate = GasEstimate.from(100_000n);
			const buffered = GasEstimate._withBuffer.call(estimate, 20);
			const limit = GasEstimate._toGasLimit.call(buffered);
			expect(limit).toBe(120_000n);
		});

		it("works with wrapper", () => {
			const limit = GasEstimate.toGasLimit(100_000n);
			expect(limit).toBe(100_000n);
		});

		it("handles realistic flow", () => {
			// Simulate: eth_estimateGas -> add buffer -> set gasLimit
			const rpcEstimate = GasEstimate.from(51_234n);
			const withBuffer = GasEstimate._withBuffer.call(rpcEstimate, 25);
			const gasLimit = GasEstimate._toGasLimit.call(withBuffer);
			expect(gasLimit).toBe(64_042n);
		});
	});

	describe("namespace", () => {
		it("exports all methods", () => {
			expect(GasEstimate.from).toBeDefined();
			expect(GasEstimate.toNumber).toBeDefined();
			expect(GasEstimate.toBigInt).toBeDefined();
			expect(GasEstimate.toHex).toBeDefined();
			expect(GasEstimate.equals).toBeDefined();
			expect(GasEstimate.compare).toBeDefined();
			expect(GasEstimate.withBuffer).toBeDefined();
			expect(GasEstimate.toGasLimit).toBeDefined();
		});
	});
});
