import { describe, expect, it } from "vitest";
import { clone } from "./clone.js";
import { fromHex } from "./fromHex.js";
import { fromBytes } from "./fromBytes.js";
import { equals } from "./equals.js";

describe("clone", () => {
	describe("cloning", () => {
		it("creates copy of hash", () => {
			const original = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const copy = clone(original);
			expect(equals(original, copy)).toBe(true);
		});

		it("creates independent copy", () => {
			const original = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const copy = clone(original);
			expect(original).not.toBe(copy);
		});

		it("clones zero hash", () => {
			const original = fromBytes(new Uint8Array(32));
			const copy = clone(original);
			expect(equals(original, copy)).toBe(true);
			expect(original).not.toBe(copy);
		});

		it("clones all-ff hash", () => {
			const bytes = new Uint8Array(32);
			bytes.fill(0xff);
			const original = fromBytes(bytes);
			const copy = clone(original);
			expect(equals(original, copy)).toBe(true);
		});
	});

	describe("independence", () => {
		it("copy is independent from original", () => {
			const original = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const copy = clone(original);
			original[0] = 0xff;
			expect(copy[0]).toBe(0x12);
		});

		it("modifying copy does not affect original", () => {
			const original = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const copy = clone(original);
			copy[0] = 0xff;
			expect(original[0]).toBe(0x12);
		});

		it("multiple clones are independent", () => {
			const original = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const copy1 = clone(original);
			const copy2 = clone(original);
			copy1[0] = 0xaa;
			copy2[0] = 0xbb;
			expect(original[0]).toBe(0x12);
			expect(copy1[0]).toBe(0xaa);
			expect(copy2[0]).toBe(0xbb);
		});
	});

	describe("deep copy", () => {
		it("copies all bytes", () => {
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				bytes[i] = i;
			}
			const original = fromBytes(bytes);
			const copy = clone(original);
			for (let i = 0; i < 32; i++) {
				expect(copy[i]).toBe(i);
			}
		});

		it("preserves byte values exactly", () => {
			const original = fromHex(
				"0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20",
			);
			const copy = clone(original);
			for (let i = 0; i < 32; i++) {
				expect(copy[i]).toBe(original[i]);
			}
		});
	});

	describe("edge cases", () => {
		it("clones hash with specific pattern", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0xff;
			bytes[15] = 0xaa;
			bytes[31] = 0x55;
			const original = fromBytes(bytes);
			const copy = clone(original);
			expect(copy[0]).toBe(0xff);
			expect(copy[15]).toBe(0xaa);
			expect(copy[31]).toBe(0x55);
		});

		it("clone of clone is independent", () => {
			const original = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const copy1 = clone(original);
			const copy2 = clone(copy1);
			copy1[0] = 0xff;
			expect(copy2[0]).toBe(0x12);
		});

		it("handles repeated cloning", () => {
			let hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			for (let i = 0; i < 10; i++) {
				hash = clone(hash);
			}
			expect(hash[0]).toBe(0x12);
		});
	});
});
