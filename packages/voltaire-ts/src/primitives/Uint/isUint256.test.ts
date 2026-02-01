import { describe, expect, it } from "vitest";
import * as Uint from "./index.js";
import { isUint256 } from "./isUint256.js";

describe("isUint256", () => {
	it("returns true for valid bigint values", () => {
		expect(isUint256(0n)).toBe(true);
		expect(isUint256(1n)).toBe(true);
		expect(isUint256(100n)).toBe(true);
		expect(isUint256(2n ** 128n)).toBe(true);
	});

	it("returns true for MAX value", () => {
		expect(isUint256(Uint.MAX as bigint)).toBe(true);
	});

	it("returns false for negative bigint", () => {
		expect(isUint256(-1n)).toBe(false);
		expect(isUint256(-100n)).toBe(false);
	});

	it("returns false for value exceeding MAX", () => {
		const tooLarge = (Uint.MAX as bigint) + 1n;
		expect(isUint256(tooLarge)).toBe(false);
		expect(isUint256(2n ** 256n)).toBe(false);
	});

	it("returns false for number", () => {
		expect(isUint256(100)).toBe(false);
		expect(isUint256(0)).toBe(false);
	});

	it("returns false for string", () => {
		expect(isUint256("100")).toBe(false);
		expect(isUint256("0x64")).toBe(false);
	});

	it("returns false for null", () => {
		expect(isUint256(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isUint256(undefined)).toBe(false);
	});

	it("returns false for object", () => {
		expect(isUint256({})).toBe(false);
	});

	it("returns false for Uint8Array", () => {
		expect(isUint256(new Uint8Array(32))).toBe(false);
	});

	it("can be used as type guard", () => {
		const value: unknown = 42n;
		if (isUint256(value)) {
			// TypeScript now knows value is Uint256Type
			expect(value + 1n).toBe(43n);
		}
	});
});
