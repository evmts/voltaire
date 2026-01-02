import { describe, expect, it } from "vitest";
import { trimLeft } from "./trimLeft.js";
import { padLeft } from "./padLeft.js";

describe("Bytes.trimLeft", () => {
	it("removes leading zeros", () => {
		expect(trimLeft(new Uint8Array([0, 0, 0x12, 0x34]))).toEqual(
			new Uint8Array([0x12, 0x34]),
		);
	});

	it("returns original if no leading zeros", () => {
		const bytes = new Uint8Array([0x12, 0x34]);
		expect(trimLeft(bytes)).toBe(bytes);
	});

	it("handles all zeros", () => {
		expect(trimLeft(new Uint8Array([0, 0, 0]))).toEqual(new Uint8Array([]));
	});

	it("handles empty bytes", () => {
		const empty = new Uint8Array([]);
		expect(trimLeft(empty)).toBe(empty);
	});

	it("preserves non-leading zeros", () => {
		expect(trimLeft(new Uint8Array([0, 0x12, 0, 0x34]))).toEqual(
			new Uint8Array([0x12, 0, 0x34]),
		);
	});

	describe("fixed-width value handling", () => {
		it("removes significant zeros from fixed-width values", () => {
			// A 4-byte value representing 0x00000001 (value: 1)
			const fixedWidth = new Uint8Array([0x00, 0x00, 0x00, 0x01]);
			const trimmed = trimLeft(fixedWidth);
			// trimLeft removes ALL leading zeros, changing length
			expect(trimmed).toEqual(new Uint8Array([0x01]));
			expect(trimmed.length).toBe(1); // Length reduced from 4 to 1
		});

		it("can restore fixed-width with padLeft after trimming", () => {
			// Simulate round-trip: trim then pad back to original width
			const original = new Uint8Array([0x00, 0x00, 0x00, 0x01]);
			const trimmed = trimLeft(original);
			const restored = padLeft(trimmed, 4);
			expect(restored).toEqual(original);
			expect(restored.length).toBe(4);
		});

		it("returns empty array when all zeros are trimmed", () => {
			// 32-byte zero value (like a null hash)
			const zeroHash = new Uint8Array(32).fill(0);
			const trimmed = trimLeft(zeroHash);
			expect(trimmed).toEqual(new Uint8Array([]));
			expect(trimmed.length).toBe(0);
			// Restore with padLeft if needed
			const restored = padLeft(trimmed, 32);
			expect(restored.length).toBe(32);
		});
	});
});
