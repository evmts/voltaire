import { describe, expect, it } from "vitest";
import * as FilterId from "./index.js";

describe("FilterId", () => {
	describe("from", () => {
		it("creates FilterId from string", () => {
			const id = FilterId.from("0x1");
			expect(id).toBe("0x1");
		});

		it("creates FilterId from hex string", () => {
			const id = FilterId.from("0xabcdef123456");
			expect(id).toBe("0xabcdef123456");
		});

		it("throws on non-string", () => {
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input type
			expect(() => FilterId.from(123 as any)).toThrow(
				FilterId.InvalidFilterIdError,
			);
		});

		it("throws on empty string", () => {
			expect(() => FilterId.from("")).toThrow(FilterId.InvalidFilterIdError);
		});
	});

	describe("toString", () => {
		it("converts FilterId to string", () => {
			const id = FilterId.from("0x1");
			expect(FilterId.toString(id)).toBe("0x1");
		});
	});

	describe("equals", () => {
		it("returns true for equal FilterIds", () => {
			const id1 = FilterId.from("0x1");
			const id2 = FilterId.from("0x1");
			expect(FilterId.equals(id1, id2)).toBe(true);
		});

		it("returns false for different FilterIds", () => {
			const id1 = FilterId.from("0x1");
			const id2 = FilterId.from("0x2");
			expect(FilterId.equals(id1, id2)).toBe(false);
		});
	});
});
