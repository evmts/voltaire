import { describe, expect, it } from "vitest";
import { fromBytes } from "./fromBytes.js";

describe("fromBytes", () => {
	describe("valid inputs", () => {
		it("creates hash from 32-byte array", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0xaa;
			bytes[31] = 0xbb;
			const hash = fromBytes(bytes);
			expect(hash.length).toBe(32);
			expect(hash[0]).toBe(0xaa);
			expect(hash[31]).toBe(0xbb);
		});

		it("creates zero hash from empty bytes", () => {
			const bytes = new Uint8Array(32);
			const hash = fromBytes(bytes);
			expect(hash.length).toBe(32);
			expect(hash.every((b) => b === 0)).toBe(true);
		});

		it("creates all-ff hash", () => {
			const bytes = new Uint8Array(32);
			bytes.fill(0xff);
			const hash = fromBytes(bytes);
			expect(hash.length).toBe(32);
			expect(hash.every((b) => b === 0xff)).toBe(true);
		});

		it("creates copy of input bytes", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0x12;
			const hash = fromBytes(bytes);
			bytes[0] = 0xff;
			expect(hash[0]).toBe(0x12);
		});

		it("does not share reference with input", () => {
			const bytes = new Uint8Array(32);
			bytes[15] = 0xaa;
			const hash = fromBytes(bytes);
			bytes[15] = 0xbb;
			expect(hash[15]).toBe(0xaa);
			expect(bytes[15]).toBe(0xbb);
		});

		it("preserves all bytes correctly", () => {
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				bytes[i] = i;
			}
			const hash = fromBytes(bytes);
			for (let i = 0; i < 32; i++) {
				expect(hash[i]).toBe(i);
			}
		});
	});

	describe("error cases", () => {
		it("throws on too short array", () => {
			const bytes = new Uint8Array(20);
			expect(() => fromBytes(bytes)).toThrow("Hash must be 32 bytes");
		});

		it("throws on too long array", () => {
			const bytes = new Uint8Array(33);
			expect(() => fromBytes(bytes)).toThrow("Hash must be 32 bytes");
		});

		it("throws on empty array", () => {
			const bytes = new Uint8Array(0);
			expect(() => fromBytes(bytes)).toThrow("Hash must be 32 bytes");
		});

		it("throws on single byte", () => {
			const bytes = new Uint8Array(1);
			expect(() => fromBytes(bytes)).toThrow("Hash must be 32 bytes");
		});

		it("throws on 31 bytes", () => {
			const bytes = new Uint8Array(31);
			expect(() => fromBytes(bytes)).toThrow("Hash must be 32 bytes");
		});

		it("error includes actual length", () => {
			try {
				fromBytes(new Uint8Array(20));
			} catch (e) { const error = /** @type {*} */ (e);
				expect(error.message).toContain("got 20");
			}
		});

		it("error includes expected length", () => {
			try {
				fromBytes(new Uint8Array(20));
			} catch (e) { const error = /** @type {*} */ (e);
				expect(error.message).toContain("32 bytes");
			}
		});
	});

	describe("edge cases", () => {
		it("handles Uint8Array subclass", () => {
			class CustomArray extends Uint8Array {}
			const bytes = new CustomArray(32);
			bytes[0] = 0xaa;
			const hash = fromBytes(bytes);
			expect(hash[0]).toBe(0xaa);
		});

		it("handles bytes with max values", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0xff;
			bytes[16] = 0xff;
			bytes[31] = 0xff;
			const hash = fromBytes(bytes);
			expect(hash[0]).toBe(0xff);
			expect(hash[16]).toBe(0xff);
			expect(hash[31]).toBe(0xff);
		});
	});
});
