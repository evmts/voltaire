import { describe, expect, it } from "vitest";
import { padLeft } from "./padLeft.js";

describe("Bytes.padLeft", () => {
	it("pads to target size", () => {
		expect(padLeft(new Uint8Array([0x12, 0x34]), 4)).toEqual(
			new Uint8Array([0, 0, 0x12, 0x34]),
		);
	});

	it("returns original if already at target size", () => {
		const bytes = new Uint8Array([1, 2, 3, 4]);
		expect(padLeft(bytes, 4)).toBe(bytes);
	});

	it("throws if bytes exceed target size", () => {
		expect(() => padLeft(new Uint8Array([1, 2, 3, 4]), 2)).toThrow(
			/exceeds padding size/,
		);
	});

	it("handles empty bytes", () => {
		expect(padLeft(new Uint8Array([]), 4)).toEqual(
			new Uint8Array([0, 0, 0, 0]),
		);
	});
});
