import { describe, expect, it } from "vitest";
import { from } from "./from.js";

describe("from", () => {
	describe("from string", () => {
		it("creates hash from hex string with 0x prefix", () => {
			const hash = from(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(hash.length).toBe(32);
			expect(hash[0]).toBe(0x12);
			expect(hash[31]).toBe(0xef);
		});

		it("creates hash from hex string without 0x prefix", () => {
			const hash = from(
				"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(hash.length).toBe(32);
			expect(hash[0]).toBe(0x12);
		});

		it("handles uppercase hex", () => {
			const hash = from(
				"0xABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789",
			);
			expect(hash[0]).toBe(0xab);
		});

		it("throws on invalid hex length", () => {
			expect(() => from("0x1234")).toThrow();
		});

		it("throws on invalid hex characters", () => {
			expect(() =>
				from(
					"0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
				),
			).toThrow();
		});
	});

	describe("from Uint8Array", () => {
		it("creates hash from 32-byte array", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0xaa;
			bytes[31] = 0xbb;
			const hash = from(bytes);
			expect(hash.length).toBe(32);
			expect(hash[0]).toBe(0xaa);
			expect(hash[31]).toBe(0xbb);
		});

		it("creates copy of input bytes", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0x12;
			const hash = from(bytes);
			bytes[0] = 0xff;
			expect(hash[0]).toBe(0x12);
		});

		it("throws on invalid byte length", () => {
			expect(() => from(new Uint8Array(20))).toThrow();
		});
	});

	describe("zero hash", () => {
		it("creates zero hash from string", () => {
			const hash = from(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
			expect(hash.every((b) => b === 0)).toBe(true);
		});

		it("creates zero hash from bytes", () => {
			const hash = from(new Uint8Array(32));
			expect(hash.every((b) => b === 0)).toBe(true);
		});
	});

	describe("consistency", () => {
		it("produces same hash from hex string and bytes", () => {
			const hex =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const bytes = new Uint8Array([
				0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78,
				0x90, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
				0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
			]);
			const hash1 = from(hex);
			const hash2 = from(bytes);
			for (let i = 0; i < 32; i++) {
				expect(hash1[i]).toBe(hash2[i]);
			}
		});
	});

	describe("edge cases", () => {
		it("handles all-ff hash from string", () => {
			const hash = from(
				"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
			);
			expect(hash.every((b) => b === 0xff)).toBe(true);
		});

		it("handles all-ff hash from bytes", () => {
			const bytes = new Uint8Array(32);
			bytes.fill(0xff);
			const hash = from(bytes);
			expect(hash.every((b) => b === 0xff)).toBe(true);
		});
	});
});
