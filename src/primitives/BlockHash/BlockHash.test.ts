import { describe, it, expect } from "vitest";
import * as BlockHash from "./index.js";

describe("BlockHash", () => {
	const testHash =
		"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
	const testBytes = new Uint8Array([
		0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef, 0x12,
		0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90,
		0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90,
	]);

	describe("from", () => {
		it("creates from hex string", () => {
			const hash = BlockHash.from(testHash);
			expect(hash).toHaveLength(32);
		});

		it("creates from bytes", () => {
			const hash = BlockHash.from(testBytes);
			expect(hash).toHaveLength(32);
		});

		it("throws on invalid type", () => {
			expect(() => BlockHash.from(123 as any)).toThrow(
				"Unsupported BlockHash value type",
			);
		});
	});

	describe("fromHex", () => {
		it("parses valid hex", () => {
			const hash = BlockHash.fromHex(testHash);
			expect(hash).toHaveLength(32);
		});

		it("parses hex without 0x prefix", () => {
			const hash = BlockHash.fromHex(testHash.slice(2));
			expect(hash).toHaveLength(32);
		});

		it("throws on wrong length", () => {
			expect(() => BlockHash.fromHex("0x1234")).toThrow(
				"must be 64 characters",
			);
		});

		it("throws on invalid characters", () => {
			expect(() =>
				BlockHash.fromHex(
					"0xgg34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				),
			).toThrow("invalid characters");
		});
	});

	describe("fromBytes", () => {
		it("validates length", () => {
			expect(() => BlockHash.fromBytes(new Uint8Array(31))).toThrow(
				"must be 32 bytes",
			);
			expect(() => BlockHash.fromBytes(new Uint8Array(33))).toThrow(
				"must be 32 bytes",
			);
		});

		it("accepts 32 bytes", () => {
			const hash = BlockHash.fromBytes(testBytes);
			expect(hash).toHaveLength(32);
		});
	});

	describe("toHex", () => {
		it("converts to hex", () => {
			const hash = BlockHash.fromBytes(testBytes);
			const hex = BlockHash.toHex(hash);
			expect(hex).toBe(testHash);
		});
	});

	describe("equals", () => {
		it("returns true for equal hashes", () => {
			const a = BlockHash.fromHex(testHash);
			const b = BlockHash.fromHex(testHash);
			expect(BlockHash.equals(a, b)).toBe(true);
		});

		it("returns false for different hashes", () => {
			const a = BlockHash.fromHex(testHash);
			const b = BlockHash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(BlockHash.equals(a, b)).toBe(false);
		});
	});
});
