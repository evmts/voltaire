import { describe, expect, it } from "vitest";
import { equals } from "./equals.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";

describe("equals", () => {
	describe("equality", () => {
		it("returns true for equal hashes", () => {
			const a = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const b = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(equals(a, b)).toBe(true);
		});

		it("returns true for same instance", () => {
			const a = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(equals(a, a)).toBe(true);
		});

		it("returns true for zero hashes", () => {
			const a = fromBytes(new Uint8Array(32));
			const b = fromBytes(new Uint8Array(32));
			expect(equals(a, b)).toBe(true);
		});

		it("returns true for all-ff hashes", () => {
			const bytesA = new Uint8Array(32);
			bytesA.fill(0xff);
			const bytesB = new Uint8Array(32);
			bytesB.fill(0xff);
			const a = fromBytes(bytesA);
			const b = fromBytes(bytesB);
			expect(equals(a, b)).toBe(true);
		});
	});

	describe("inequality", () => {
		it("returns false for different hashes", () => {
			const a = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const b = fromHex(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
			expect(equals(a, b)).toBe(false);
		});

		it("returns false when only first byte differs", () => {
			const a = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const b = fromHex(
				"0xff34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(equals(a, b)).toBe(false);
		});

		it("returns false when only last byte differs", () => {
			const a = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const b = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdff",
			);
			expect(equals(a, b)).toBe(false);
		});

		it("returns false when middle byte differs", () => {
			const a = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const b = fromHex(
				"0x1234567890abcdef1234567890ffcdef1234567890abcdef1234567890abcdef",
			);
			expect(equals(a, b)).toBe(false);
		});

		it("returns false when single bit differs", () => {
			const a = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const b = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdee",
			);
			expect(equals(a, b)).toBe(false);
		});
	});

	describe("constant-time comparison", () => {
		it("detects difference at start", () => {
			const a = fromHex(
				"0xff34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const b = fromHex(
				"0x0034567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(equals(a, b)).toBe(false);
		});

		it("detects difference at end", () => {
			const a = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdff",
			);
			const b = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd00",
			);
			expect(equals(a, b)).toBe(false);
		});

		it("detects multiple differences", () => {
			const a = fromHex(
				"0xff34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdff",
			);
			const b = fromHex(
				"0x0034567890abcdef1234567890abcdef1234567890abcdef1234567890abcd00",
			);
			expect(equals(a, b)).toBe(false);
		});

		it("scans all bytes even with early difference", () => {
			const a = fromHex(
				"0xff00000000000000000000000000000000000000000000000000000000000000",
			);
			const b = fromHex(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
			expect(equals(a, b)).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("handles empty-looking hashes correctly", () => {
			const a = fromBytes(new Uint8Array(32));
			const b = fromBytes(new Uint8Array(32));
			expect(equals(a, b)).toBe(true);
		});

		it("returns false for different length arrays", () => {
			const a = fromBytes(new Uint8Array(32));
			const b = new Uint8Array(20);
			expect(equals(a, b)).toBe(false);
		});

		it("handles hashes that differ by one", () => {
			const bytesA = new Uint8Array(32);
			const bytesB = new Uint8Array(32);
			bytesB[31] = 1;
			const a = fromBytes(bytesA);
			const b = fromBytes(bytesB);
			expect(equals(a, b)).toBe(false);
		});

		it("handles maximum values", () => {
			const bytesA = new Uint8Array(32);
			bytesA.fill(0xff);
			const bytesB = new Uint8Array(32);
			bytesB.fill(0xff);
			const a = fromBytes(bytesA);
			const b = fromBytes(bytesB);
			expect(equals(a, b)).toBe(true);
		});
	});
});
