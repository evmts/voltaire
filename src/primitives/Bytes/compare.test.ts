import { describe, expect, it } from "vitest";
import * as Bytes from "./Bytes.index.js";

describe("compare", () => {
	describe("equal bytes", () => {
		it("should return 0 for identical bytes", () => {
			const a = Bytes.from([0x01, 0x02, 0x03]);
			const b = Bytes.from([0x01, 0x02, 0x03]);
			expect(Bytes.compare(a, b)).toBe(0);
		});

		it("should return 0 for empty bytes", () => {
			const a = Bytes.from([]);
			const b = Bytes.from([]);
			expect(Bytes.compare(a, b)).toBe(0);
		});

		it("should return 0 for single equal byte", () => {
			const a = Bytes.from([0xff]);
			const b = Bytes.from([0xff]);
			expect(Bytes.compare(a, b)).toBe(0);
		});
	});

	describe("byte value comparison", () => {
		it("should return -1 when first byte is less", () => {
			const a = Bytes.from([0x00]);
			const b = Bytes.from([0x01]);
			expect(Bytes.compare(a, b)).toBe(-1);
		});

		it("should return 1 when first byte is greater", () => {
			const a = Bytes.from([0x02]);
			const b = Bytes.from([0x01]);
			expect(Bytes.compare(a, b)).toBe(1);
		});

		it("should return -1 when later byte is less", () => {
			const a = Bytes.from([0x01, 0x02]);
			const b = Bytes.from([0x01, 0x03]);
			expect(Bytes.compare(a, b)).toBe(-1);
		});

		it("should return 1 when later byte is greater", () => {
			const a = Bytes.from([0x01, 0x03]);
			const b = Bytes.from([0x01, 0x02]);
			expect(Bytes.compare(a, b)).toBe(1);
		});

		it("should compare first differing byte only", () => {
			// First difference at index 1 determines result
			const a = Bytes.from([0x01, 0x00, 0xff]);
			const b = Bytes.from([0x01, 0x01, 0x00]);
			expect(Bytes.compare(a, b)).toBe(-1);
		});
	});

	describe("length comparison", () => {
		it("should return -1 when first is shorter (prefix match)", () => {
			const a = Bytes.from([0x01]);
			const b = Bytes.from([0x01, 0x02]);
			expect(Bytes.compare(a, b)).toBe(-1);
		});

		it("should return 1 when first is longer (prefix match)", () => {
			const a = Bytes.from([0x01, 0x02]);
			const b = Bytes.from([0x01]);
			expect(Bytes.compare(a, b)).toBe(1);
		});

		it("should return -1 for empty vs non-empty", () => {
			const a = Bytes.from([]);
			const b = Bytes.from([0x00]);
			expect(Bytes.compare(a, b)).toBe(-1);
		});

		it("should return 1 for non-empty vs empty", () => {
			const a = Bytes.from([0x00]);
			const b = Bytes.from([]);
			expect(Bytes.compare(a, b)).toBe(1);
		});
	});

	describe("edge cases", () => {
		it("should handle 0x00 bytes correctly", () => {
			const a = Bytes.from([0x00, 0x00]);
			const b = Bytes.from([0x00, 0x01]);
			expect(Bytes.compare(a, b)).toBe(-1);
		});

		it("should handle 0xff bytes correctly", () => {
			const a = Bytes.from([0xff, 0xff]);
			const b = Bytes.from([0xff, 0xfe]);
			expect(Bytes.compare(a, b)).toBe(1);
		});

		it("should handle boundary values 0x00 vs 0xff", () => {
			const a = Bytes.from([0x00]);
			const b = Bytes.from([0xff]);
			expect(Bytes.compare(a, b)).toBe(-1);
			expect(Bytes.compare(b, a)).toBe(1);
		});
	});

	describe("sorting compatibility", () => {
		it("should work with Array.prototype.sort()", () => {
			const arr = [
				Bytes.from([0x03]),
				Bytes.from([0x01]),
				Bytes.from([0x02]),
			];
			arr.sort(Bytes.compare);
			expect(arr[0]).toEqual(Bytes.from([0x01]));
			expect(arr[1]).toEqual(Bytes.from([0x02]));
			expect(arr[2]).toEqual(Bytes.from([0x03]));
		});

		it("should sort by length when prefixes match", () => {
			const arr = [
				Bytes.from([0x01, 0x02, 0x03]),
				Bytes.from([0x01]),
				Bytes.from([0x01, 0x02]),
			];
			arr.sort(Bytes.compare);
			expect(arr[0]).toEqual(Bytes.from([0x01]));
			expect(arr[1]).toEqual(Bytes.from([0x01, 0x02]));
			expect(arr[2]).toEqual(Bytes.from([0x01, 0x02, 0x03]));
		});

		it("should produce stable sort order", () => {
			const arr = [
				Bytes.from([0x02]),
				Bytes.from([0x01]),
				Bytes.from([0x02]),
				Bytes.from([0x01]),
			];
			arr.sort(Bytes.compare);
			expect(arr[0]).toEqual(Bytes.from([0x01]));
			expect(arr[1]).toEqual(Bytes.from([0x01]));
			expect(arr[2]).toEqual(Bytes.from([0x02]));
			expect(arr[3]).toEqual(Bytes.from([0x02]));
		});
	});

	describe("return value contract", () => {
		it("should return exactly -1, 0, or 1", () => {
			const cases = [
				{ a: [0x01], b: [0x02], expected: -1 },
				{ a: [0x01], b: [0x01], expected: 0 },
				{ a: [0x02], b: [0x01], expected: 1 },
				{ a: [], b: [0x01], expected: -1 },
				{ a: [0x01], b: [], expected: 1 },
				{ a: [], b: [], expected: 0 },
			];

			for (const { a, b, expected } of cases) {
				const result = Bytes.compare(Bytes.from(a), Bytes.from(b));
				expect(result).toBe(expected);
				expect([-1, 0, 1]).toContain(result);
			}
		});
	});
});
