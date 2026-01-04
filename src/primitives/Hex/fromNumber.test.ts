import { describe, expect, it } from "vitest";
import { fromNumber } from "./fromNumber.js";
import { toNumber } from "./toNumber.js";

describe("fromNumber", () => {
	it("converts zero", () => {
		expect(fromNumber(0)).toBe("0x0");
	});

	it("converts small numbers", () => {
		expect(fromNumber(1)).toBe("0x1");
		expect(fromNumber(15)).toBe("0xf");
		expect(fromNumber(16)).toBe("0x10");
		expect(fromNumber(255)).toBe("0xff");
		expect(fromNumber(256)).toBe("0x100");
	});

	it("converts larger numbers", () => {
		expect(fromNumber(0x1234)).toBe("0x1234");
		expect(fromNumber(0xdeadbeef)).toBe("0xdeadbeef");
		expect(fromNumber(0xffffffff)).toBe("0xffffffff");
	});

	it("converts with size padding", () => {
		expect(fromNumber(0, 1)).toBe("0x00");
		expect(fromNumber(1, 1)).toBe("0x01");
		expect(fromNumber(255, 1)).toBe("0xff");
		expect(fromNumber(255, 2)).toBe("0x00ff");
		expect(fromNumber(255, 4)).toBe("0x000000ff");
		expect(fromNumber(255, 8)).toBe("0x00000000000000ff");
	});

	it("does not pad when value exceeds size", () => {
		expect(fromNumber(0x1234, 1)).toBe("0x1234");
		expect(fromNumber(0xabcdef, 2)).toBe("0xabcdef");
	});

	it("handles max safe integer", () => {
		const max = Number.MAX_SAFE_INTEGER;
		expect(max).toBe(9007199254740991); // 2^53 - 1
		const hex = fromNumber(max);
		expect(hex).toBe("0x1fffffffffffff");
		expect(toNumber(hex)).toBe(max);
	});

	it("handles values near max safe integer boundary", () => {
		// 2^53 - 2
		expect(fromNumber(9007199254740990)).toBe("0x1ffffffffffffe");
		expect(toNumber(fromNumber(9007199254740990))).toBe(9007199254740990);

		// 2^53 - 1 (MAX_SAFE_INTEGER)
		expect(fromNumber(9007199254740991)).toBe("0x1fffffffffffff");
		expect(toNumber(fromNumber(9007199254740991))).toBe(9007199254740991);
	});

	it("throws for numbers exceeding MAX_SAFE_INTEGER", () => {
		// 2^53 (first unsafe integer)
		expect(() => fromNumber(9007199254740992)).toThrow(/exceeds MAX_SAFE_INTEGER/);

		// Larger values
		expect(() => fromNumber(Number.MAX_SAFE_INTEGER + 1)).toThrow(
			/exceeds MAX_SAFE_INTEGER/,
		);
		expect(() => fromNumber(Number.MAX_SAFE_INTEGER + 100)).toThrow(
			/exceeds MAX_SAFE_INTEGER/,
		);
	});

	it("round-trip conversions", () => {
		const values = [0, 1, 15, 255, 256, 0x1234, 0xabcdef, 0xffffffff];
		values.forEach((val) => {
			const hex = fromNumber(val);
			expect(toNumber(hex)).toBe(val);
		});
	});

	it("converts powers of 2", () => {
		expect(fromNumber(1)).toBe("0x1");
		expect(fromNumber(2)).toBe("0x2");
		expect(fromNumber(4)).toBe("0x4");
		expect(fromNumber(8)).toBe("0x8");
		expect(fromNumber(16)).toBe("0x10");
		expect(fromNumber(256)).toBe("0x100");
		expect(fromNumber(65536)).toBe("0x10000");
	});

	it("throws on negative numbers", () => {
		expect(() => fromNumber(-1)).toThrow(/must be non-negative/);
		expect(() => fromNumber(-100)).toThrow(/must be non-negative/);
	});

	it("throws on non-integer", () => {
		expect(() => fromNumber(1.5)).toThrow(/must be an integer/);
		expect(() => fromNumber(0.1)).toThrow(/must be an integer/);
	});

	it("throws on NaN", () => {
		expect(() => fromNumber(Number.NaN)).toThrow(/must be an integer/);
	});

	it("throws on Infinity", () => {
		expect(() => fromNumber(Number.POSITIVE_INFINITY)).toThrow(
			/exceeds MAX_SAFE_INTEGER/,
		);
		expect(() => fromNumber(Number.NEGATIVE_INFINITY)).toThrow(
			/must be non-negative/,
		);
	});
});
