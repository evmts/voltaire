import { describe, expect, it } from "vitest";
import { trimRight } from "./trimRight.js";

describe("Bytes.trimRight", () => {
	it("removes trailing zeros", () => {
		expect(trimRight(new Uint8Array([0x12, 0x34, 0, 0]))).toEqual(
			new Uint8Array([0x12, 0x34]),
		);
	});

	it("returns original if no trailing zeros", () => {
		const bytes = new Uint8Array([0x12, 0x34]);
		expect(trimRight(bytes)).toBe(bytes);
	});

	it("handles all zeros", () => {
		expect(trimRight(new Uint8Array([0, 0, 0]))).toEqual(new Uint8Array([]));
	});

	it("handles empty bytes", () => {
		const empty = new Uint8Array([]);
		expect(trimRight(empty)).toBe(empty);
	});

	it("preserves non-trailing zeros", () => {
		expect(trimRight(new Uint8Array([0x12, 0, 0x34, 0]))).toEqual(
			new Uint8Array([0x12, 0, 0x34]),
		);
	});
});
