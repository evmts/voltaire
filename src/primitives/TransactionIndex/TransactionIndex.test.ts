import { describe, expect, it } from "vitest";
import * as TransactionIndex from "./index.js";

describe("TransactionIndex", () => {
	describe("from", () => {
		it("creates from number", () => {
			const idx = TransactionIndex.from(42);
			expect(TransactionIndex.toNumber(idx)).toBe(42);
		});

		it("creates from bigint", () => {
			const idx = TransactionIndex.from(42n);
			expect(TransactionIndex.toNumber(idx)).toBe(42);
		});

		it("accepts zero", () => {
			const idx = TransactionIndex.from(0);
			expect(TransactionIndex.toNumber(idx)).toBe(0);
		});

		it("throws on negative", () => {
			expect(() => TransactionIndex.from(-1)).toThrow("cannot be negative");
		});

		it("throws on non-integer", () => {
			expect(() => TransactionIndex.from(1.5)).toThrow("must be an integer");
		});

		it("throws on invalid type", () => {
			expect(() => TransactionIndex.from("42" as any)).toThrow(
				"must be a number or bigint",
			);
		});
	});

	describe("toNumber", () => {
		it("converts to number", () => {
			const idx = TransactionIndex.from(123);
			expect(TransactionIndex.toNumber(idx)).toBe(123);
		});
	});

	describe("equals", () => {
		it("returns true for equal indexes", () => {
			const a = TransactionIndex.from(42);
			const b = TransactionIndex.from(42);
			expect(TransactionIndex.equals(a, b)).toBe(true);
		});

		it("returns false for different indexes", () => {
			const a = TransactionIndex.from(42);
			const b = TransactionIndex.from(43);
			expect(TransactionIndex.equals(a, b)).toBe(false);
		});
	});
});
