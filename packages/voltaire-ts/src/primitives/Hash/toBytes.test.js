import { describe, expect, it } from "vitest";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { toBytes } from "./toBytes.js";

describe("toBytes", () => {
	describe("conversion", () => {
		it("returns copy of hash", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const bytes = toBytes(hash);
			expect(bytes.length).toBe(32);
			expect(bytes[0]).toBe(0x12);
			expect(bytes[31]).toBe(0xef);
		});

		it("converts zero hash", () => {
			const hash = fromBytes(new Uint8Array(32));
			const bytes = toBytes(hash);
			expect(bytes.length).toBe(32);
			expect(bytes.every((b) => b === 0)).toBe(true);
		});

		it("converts all-ff hash", () => {
			const input = new Uint8Array(32);
			input.fill(0xff);
			const hash = fromBytes(input);
			const bytes = toBytes(hash);
			expect(bytes.every((b) => b === 0xff)).toBe(true);
		});

		it("preserves all bytes", () => {
			const input = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				input[i] = i;
			}
			const hash = fromBytes(input);
			const bytes = toBytes(hash);
			for (let i = 0; i < 32; i++) {
				expect(bytes[i]).toBe(i);
			}
		});
	});

	describe("independence", () => {
		it("copy is independent from original", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const bytes = toBytes(hash);
			bytes[0] = 0xff;
			expect(hash[0]).toBe(0x12);
		});

		it("modifying original does not affect copy", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const bytes = toBytes(hash);
			hash[0] = 0xff;
			expect(bytes[0]).toBe(0x12);
		});

		it("multiple calls return independent copies", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const bytes1 = toBytes(hash);
			const bytes2 = toBytes(hash);
			bytes1[0] = 0xaa;
			bytes2[0] = 0xbb;
			expect(hash[0]).toBe(0x12);
			expect(bytes1[0]).toBe(0xaa);
			expect(bytes2[0]).toBe(0xbb);
		});
	});

	describe("roundtrip", () => {
		it("roundtrips through fromBytes", () => {
			const original = new Uint8Array(32);
			original[0] = 0x12;
			original[31] = 0xef;
			const hash = fromBytes(original);
			const bytes = toBytes(hash);
			expect(bytes[0]).toBe(original[0]);
			expect(bytes[31]).toBe(original[31]);
		});

		it("maintains exact byte values", () => {
			const original = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				original[i] = (i * 7) % 256;
			}
			const hash = fromBytes(original);
			const bytes = toBytes(hash);
			for (let i = 0; i < 32; i++) {
				expect(bytes[i]).toBe(original[i]);
			}
		});
	});

	describe("edge cases", () => {
		it("handles hash with mixed values", () => {
			const hash = fromHex(
				"0x00ff0aa0123456789abcdef0123456789abcdef0123456789abcdef012345678",
			);
			const bytes = toBytes(hash);
			expect(bytes[0]).toBe(0x00);
			expect(bytes[1]).toBe(0xff);
			expect(bytes[2]).toBe(0x0a);
			expect(bytes[3]).toBe(0xa0);
		});

		it("handles sequential byte pattern", () => {
			const hash = fromHex(
				"0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20",
			);
			const bytes = toBytes(hash);
			for (let i = 0; i < 32; i++) {
				expect(bytes[i]).toBe(i + 1);
			}
		});

		it("returns Uint8Array instance", () => {
			const hash = fromBytes(new Uint8Array(32));
			const bytes = toBytes(hash);
			expect(bytes instanceof Uint8Array).toBe(true);
		});
	});
});
