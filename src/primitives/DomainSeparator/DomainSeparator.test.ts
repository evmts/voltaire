import { describe, expect, it } from "vitest";
import * as DomainSeparator from "./index.js";

describe("DomainSeparator", () => {
	const testHash = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		testHash[i] = i;
	}

	describe("from", () => {
		it("should create from hex string", () => {
			const hex =
				"0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
			const sep = DomainSeparator.from(hex);
			expect(sep.length).toBe(32);
			expect(sep[0]).toBe(0);
			expect(sep[31]).toBe(31);
		});

		it("should create from bytes", () => {
			const sep = DomainSeparator.from(testHash);
			expect(sep.length).toBe(32);
			expect(sep[0]).toBe(0);
			expect(sep[31]).toBe(31);
		});

		it("should throw on invalid length", () => {
			expect(() => DomainSeparator.from(new Uint8Array(31))).toThrow();
			expect(() => DomainSeparator.from(new Uint8Array(33))).toThrow();
		});
	});

	describe("fromBytes", () => {
		it("should create from 32 bytes", () => {
			const sep = DomainSeparator.fromBytes(testHash);
			expect(sep.length).toBe(32);
		});

		it("should throw on wrong length", () => {
			expect(() => DomainSeparator.fromBytes(new Uint8Array(16))).toThrow(
				"DomainSeparator must be 32 bytes",
			);
		});
	});

	describe("fromHex", () => {
		it("should create from hex with 0x prefix", () => {
			const hex =
				"0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
			const sep = DomainSeparator.fromHex(hex);
			expect(sep.length).toBe(32);
			expect(sep[0]).toBe(0);
		});

		it("should throw on hex without 0x prefix", () => {
			const hex =
				"000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
			expect(() => DomainSeparator.fromHex(hex)).toThrow();
		});
	});

	describe("toHex", () => {
		it("should convert to hex string", () => {
			const sep = DomainSeparator.fromBytes(testHash);
			const hex = DomainSeparator.toHex(sep);
			expect(hex).toBe(
				"0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
			);
		});
	});

	describe("equals", () => {
		it("should return true for equal separators", () => {
			const sep1 = DomainSeparator.fromBytes(testHash);
			const sep2 = DomainSeparator.fromBytes(testHash);
			expect(DomainSeparator.equals(sep1, sep2)).toBe(true);
		});

		it("should return false for different separators", () => {
			const sep1 = DomainSeparator.fromBytes(testHash);
			const testHash2 = new Uint8Array(32);
			testHash2[0] = 1;
			const sep2 = DomainSeparator.fromBytes(testHash2);
			expect(DomainSeparator.equals(sep1, sep2)).toBe(false);
		});
	});
});
