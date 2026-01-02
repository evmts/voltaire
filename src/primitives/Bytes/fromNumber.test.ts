import { describe, expect, it } from "vitest";
import {
	NegativeNumberError,
	NonIntegerError,
	SizeExceededError,
	UnsafeIntegerError,
} from "./errors.js";
import { fromNumber } from "./fromNumber.js";
import { toNumber } from "./toNumber.js";

describe("Bytes.fromNumber", () => {
	it("converts zero", () => {
		const result = fromNumber(0);
		expect(result).toEqual(new Uint8Array([0]));
	});

	it("converts small numbers", () => {
		expect(fromNumber(1)).toEqual(new Uint8Array([1]));
		expect(fromNumber(255)).toEqual(new Uint8Array([255]));
		expect(fromNumber(256)).toEqual(new Uint8Array([1, 0]));
	});

	it("converts with size padding", () => {
		expect(fromNumber(1, 2)).toEqual(new Uint8Array([0, 1]));
		expect(fromNumber(255, 4)).toEqual(new Uint8Array([0, 0, 0, 255]));
		expect(fromNumber(0x1234, 4)).toEqual(new Uint8Array([0, 0, 0x12, 0x34]));
	});

	it("throws SizeExceededError when value exceeds size", () => {
		try {
			fromNumber(256, 1);
			expect.fail("Expected SizeExceededError");
		} catch (e) {
			expect(e).toBeInstanceOf(SizeExceededError);
			expect((e as SizeExceededError).name).toBe("BytesSizeExceededError");
		}
	});

	it("throws NegativeNumberError on negative numbers", () => {
		try {
			fromNumber(-1);
			expect.fail("Expected NegativeNumberError");
		} catch (e) {
			expect(e).toBeInstanceOf(NegativeNumberError);
			expect((e as NegativeNumberError).name).toBe("NegativeNumberError");
		}
	});

	it("throws NonIntegerError on non-integers", () => {
		try {
			fromNumber(1.5);
			expect.fail("Expected NonIntegerError");
		} catch (e) {
			expect(e).toBeInstanceOf(NonIntegerError);
			expect((e as NonIntegerError).name).toBe("NonIntegerError");
		}
	});

	it("throws UnsafeIntegerError on unsafe integers", () => {
		try {
			fromNumber(Number.MAX_SAFE_INTEGER + 1);
			expect.fail("Expected UnsafeIntegerError");
		} catch (e) {
			expect(e).toBeInstanceOf(UnsafeIntegerError);
			expect((e as UnsafeIntegerError).name).toBe("UnsafeIntegerError");
		}
	});

	it("round-trips with toNumber", () => {
		const values = [0, 1, 255, 256, 0x1234, 0xabcdef];
		for (const val of values) {
			expect(toNumber(fromNumber(val))).toBe(val);
		}
	});
});
