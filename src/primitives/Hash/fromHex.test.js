import { describe, expect, it } from "vitest";
import { fromHex } from "./fromHex.js";

describe("fromHex", () => {
	describe("valid inputs", () => {
		it("creates hash from hex string with 0x prefix", () => {
			const hex =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const hash = fromHex(hex);
			expect(hash.length).toBe(32);
			expect(hash[0]).toBe(0x12);
			expect(hash[1]).toBe(0x34);
			expect(hash[31]).toBe(0xef);
		});

		it("creates hash from hex string without 0x prefix", () => {
			const hex =
				"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const hash = fromHex(hex);
			expect(hash.length).toBe(32);
			expect(hash[0]).toBe(0x12);
			expect(hash[31]).toBe(0xef);
		});

		it("handles uppercase hex", () => {
			const hex =
				"0xABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789";
			const hash = fromHex(hex);
			expect(hash[0]).toBe(0xab);
			expect(hash[1]).toBe(0xcd);
			expect(hash[2]).toBe(0xef);
		});

		it("handles mixed case hex", () => {
			const hex =
				"0xAbCdEf0123456789aBcDeF0123456789AbCdEf0123456789aBcDeF0123456789";
			const hash = fromHex(hex);
			expect(hash[0]).toBe(0xab);
			expect(hash[1]).toBe(0xcd);
			expect(hash[2]).toBe(0xef);
		});

		it("creates zero hash", () => {
			const hex =
				"0x0000000000000000000000000000000000000000000000000000000000000000";
			const hash = fromHex(hex);
			expect(hash.length).toBe(32);
			expect(hash.every((b) => b === 0)).toBe(true);
		});

		it("creates all-ff hash", () => {
			const hex =
				"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
			const hash = fromHex(hex);
			expect(hash.length).toBe(32);
			expect(hash.every((b) => b === 0xff)).toBe(true);
		});

		it("handles leading zeros correctly", () => {
			const hex =
				"0x000000000000000000000000000000000000000000000000000000000000000a";
			const hash = fromHex(hex);
			expect(hash[31]).toBe(0x0a);
			expect(hash.slice(0, 31).every((b) => b === 0)).toBe(true);
		});
	});

	describe("error cases", () => {
		it("throws on too short hex string", () => {
			expect(() => fromHex("0x1234")).toThrow("Hash hex must be 64 characters");
		});

		it("throws on too long hex string", () => {
			expect(() =>
				fromHex(
					"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00",
				),
			).toThrow("Hash hex must be 64 characters");
		});

		it("throws on empty string", () => {
			expect(() => fromHex("")).toThrow("Hash hex must be 64 characters");
		});

		it("throws on 0x only", () => {
			expect(() => fromHex("0x")).toThrow("Hash hex must be 64 characters");
		});

		it("throws on invalid hex characters", () => {
			expect(() =>
				fromHex(
					"0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
				),
			).toThrow("Invalid hex string");
		});

		it("throws on space in hex", () => {
			expect(() =>
				fromHex(
					"0x1234567890abcdef 234567890abcdef1234567890abcdef1234567890abcdef",
				),
			).toThrow("Invalid hex string");
		});

		it("throws on dash in hex", () => {
			expect(() =>
				fromHex(
					"0x1234567890abcdef-234567890abcdef1234567890abcdef1234567890abcdef",
				),
			).toThrow("Invalid hex string");
		});

		it("throws on special characters", () => {
			expect(() =>
				fromHex(
					"0x1234567890abcdef@234567890abcdef1234567890abcdef1234567890abcdef",
				),
			).toThrow("Invalid hex string");
		});

		it("error includes actual length", () => {
			try {
				fromHex("0x1234");
			} catch (e) { const error = /** @type {*} */ (e);
				expect(error.message).toContain("got 4");
			}
		});

		it("error includes expected length", () => {
			try {
				fromHex("0x1234");
			} catch (e) { const error = /** @type {*} */ (e);
				expect(error.message).toContain("64 characters");
			}
		});
	});

	describe("edge cases", () => {
		it("parses hex with only numbers", () => {
			const hex =
				"0x0123456789012345678901234567890123456789012345678901234567890123";
			const hash = fromHex(hex);
			expect(hash[0]).toBe(0x01);
			expect(hash[1]).toBe(0x23);
		});

		it("parses hex with only letters", () => {
			const hex =
				"0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd";
			const hash = fromHex(hex);
			expect(hash[0]).toBe(0xab);
			expect(hash[1]).toBe(0xcd);
		});

		it("preserves byte order", () => {
			const hex =
				"0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20";
			const hash = fromHex(hex);
			for (let i = 0; i < 32; i++) {
				expect(hash[i]).toBe(i + 1);
			}
		});
	});
});
