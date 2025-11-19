import { describe, it, expect } from "vitest";
import * as BlockNumber from "./index.js";

describe("BlockNumber", () => {
	describe("from", () => {
		it("creates from bigint", () => {
			const bn = BlockNumber.from(123456n);
			expect(BlockNumber.toBigInt(bn)).toBe(123456n);
		});

		it("creates from number", () => {
			const bn = BlockNumber.from(123456);
			expect(BlockNumber.toBigInt(bn)).toBe(123456n);
		});

		it("accepts zero", () => {
			const bn = BlockNumber.from(0n);
			expect(BlockNumber.toBigInt(bn)).toBe(0n);
		});

		it("throws on negative", () => {
			expect(() => BlockNumber.from(-1n)).toThrow("cannot be negative");
		});

		it("throws on invalid type", () => {
			expect(() => BlockNumber.from("123" as any)).toThrow(
				"must be a number or bigint",
			);
		});
	});

	describe("toBigInt", () => {
		it("converts to bigint", () => {
			const bn = BlockNumber.from(999n);
			expect(BlockNumber.toBigInt(bn)).toBe(999n);
		});
	});

	describe("toNumber", () => {
		it("converts to number", () => {
			const bn = BlockNumber.from(1000);
			expect(BlockNumber.toNumber(bn)).toBe(1000);
		});
	});

	describe("equals", () => {
		it("returns true for equal block numbers", () => {
			const a = BlockNumber.from(100n);
			const b = BlockNumber.from(100n);
			expect(BlockNumber.equals(a, b)).toBe(true);
		});

		it("returns false for different block numbers", () => {
			const a = BlockNumber.from(100n);
			const b = BlockNumber.from(101n);
			expect(BlockNumber.equals(a, b)).toBe(false);
		});
	});
});
