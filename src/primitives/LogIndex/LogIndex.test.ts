import { describe, expect, it } from "vitest";
import { InvalidLogIndexError } from "./errors.js";
import * as LogIndex from "./index.js";

describe("LogIndex", () => {
	describe("from", () => {
		it("creates from number", () => {
			const idx = LogIndex.from(5);
			expect(LogIndex.toNumber(idx)).toBe(5);
		});

		it("creates from bigint", () => {
			const idx = LogIndex.from(5n);
			expect(LogIndex.toNumber(idx)).toBe(5);
		});

		it("accepts zero", () => {
			const idx = LogIndex.from(0);
			expect(LogIndex.toNumber(idx)).toBe(0);
		});

		it("throws on negative with correct error type", () => {
			try {
				LogIndex.from(-1);
				expect.fail("Should have thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(InvalidLogIndexError);
				expect((e as InvalidLogIndexError).name).toBe("InvalidLogIndexError");
				expect((e as InvalidLogIndexError).message).toContain(
					"cannot be negative",
				);
			}
		});

		it("throws on non-integer with correct error type", () => {
			try {
				LogIndex.from(2.5);
				expect.fail("Should have thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(InvalidLogIndexError);
				expect((e as InvalidLogIndexError).name).toBe("InvalidLogIndexError");
				expect((e as InvalidLogIndexError).message).toContain(
					"must be an integer",
				);
			}
		});

		it("throws on invalid type with correct error type", () => {
			try {
				// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
				LogIndex.from("5" as any);
				expect.fail("Should have thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(InvalidLogIndexError);
				expect((e as InvalidLogIndexError).name).toBe("InvalidLogIndexError");
				expect((e as InvalidLogIndexError).message).toContain(
					"must be a number or bigint",
				);
			}
		});
	});

	describe("toNumber", () => {
		it("converts to number", () => {
			const idx = LogIndex.from(99);
			expect(LogIndex.toNumber(idx)).toBe(99);
		});
	});

	describe("equals", () => {
		it("returns true for equal indexes", () => {
			const a = LogIndex.from(10);
			const b = LogIndex.from(10);
			expect(LogIndex.equals(a, b)).toBe(true);
		});

		it("returns false for different indexes", () => {
			const a = LogIndex.from(10);
			const b = LogIndex.from(11);
			expect(LogIndex.equals(a, b)).toBe(false);
		});
	});
});
