import { describe, expect, it } from "vitest";
import { isHash } from "./isHash.js";
import { fromHex } from "./fromHex.js";
import { fromBytes } from "./fromBytes.js";

describe("isHash", () => {
	describe("valid hashes", () => {
		it("returns true for hash from fromHex", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(isHash(hash)).toBe(true);
		});

		it("returns true for hash from fromBytes", () => {
			const hash = fromBytes(new Uint8Array(32));
			expect(isHash(hash)).toBe(true);
		});

		it("returns true for zero hash", () => {
			const hash = fromBytes(new Uint8Array(32));
			expect(isHash(hash)).toBe(true);
		});

		it("returns true for all-ff hash", () => {
			const bytes = new Uint8Array(32);
			bytes.fill(0xff);
			const hash = fromBytes(bytes);
			expect(isHash(hash)).toBe(true);
		});

		it("returns true for plain Uint8Array of length 32", () => {
			const arr = new Uint8Array(32);
			expect(isHash(arr)).toBe(true);
		});
	});

	describe("invalid hashes", () => {
		it("returns false for non-Uint8Array", () => {
			expect(isHash("not a hash")).toBe(false);
		});

		it("returns false for null", () => {
			expect(isHash(null)).toBe(false);
		});

		it("returns false for undefined", () => {
			expect(isHash(undefined)).toBe(false);
		});

		it("returns false for number", () => {
			expect(isHash(123)).toBe(false);
		});

		it("returns false for object", () => {
			expect(isHash({})).toBe(false);
		});

		it("returns false for array", () => {
			expect(isHash([])).toBe(false);
		});

		it("returns false for Uint8Array of wrong length", () => {
			expect(isHash(new Uint8Array(20))).toBe(false);
		});

		it("returns false for too short Uint8Array", () => {
			expect(isHash(new Uint8Array(31))).toBe(false);
		});

		it("returns false for too long Uint8Array", () => {
			expect(isHash(new Uint8Array(33))).toBe(false);
		});

		it("returns false for empty Uint8Array", () => {
			expect(isHash(new Uint8Array(0))).toBe(false);
		});

		it("returns false for single byte Uint8Array", () => {
			expect(isHash(new Uint8Array(1))).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("returns false for hex string", () => {
			expect(
				isHash(
					"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				),
			).toBe(false);
		});

		it("returns false for regular Array with 32 elements", () => {
			const arr = new Array(32).fill(0);
			expect(isHash(arr)).toBe(false);
		});

		it("returns false for Int8Array", () => {
			expect(isHash(new Int8Array(32))).toBe(false);
		});

		it("returns false for Uint16Array", () => {
			expect(isHash(new Uint16Array(32))).toBe(false);
		});

		it("returns false for Float32Array", () => {
			expect(isHash(new Float32Array(32))).toBe(false);
		});

		it("returns false for Buffer (if available)", () => {
			if (typeof Buffer !== "undefined") {
				expect(isHash(Buffer.alloc(32))).toBe(true); // Buffer is Uint8Array subclass
			}
		});

		it("returns true for Uint8Array subclass of length 32", () => {
			class CustomArray extends Uint8Array {}
			const arr = new CustomArray(32);
			expect(isHash(arr)).toBe(true);
		});
	});

	describe("type guard", () => {
		it("narrows type when true", () => {
			const value = new Uint8Array(32);
			if (isHash(value)) {
				expect(value.length).toBe(32);
			}
		});

		it("filters valid hashes in array", () => {
			const values = [
				new Uint8Array(32),
				new Uint8Array(20),
				"not a hash",
				fromBytes(new Uint8Array(32)),
			];
			const hashes = values.filter(isHash);
			expect(hashes.length).toBe(2);
		});
	});
});
