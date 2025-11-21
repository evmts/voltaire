import { describe, expect, it } from "vitest";
import * as TransactionHash from "./index.js";

describe("TransactionHash", () => {
	const testHash =
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
	const testBytes = new Uint8Array([
		0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78,
		0x90, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
		0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
	]);

	describe("from", () => {
		it("creates from hex string", () => {
			const hash = TransactionHash.from(testHash);
			expect(hash).toHaveLength(32);
		});

		it("creates from bytes", () => {
			const hash = TransactionHash.from(testBytes);
			expect(hash).toHaveLength(32);
		});

		it("throws on invalid type", () => {
			expect(() => TransactionHash.from(123 as any)).toThrow(
				"Unsupported TransactionHash value type",
			);
		});
	});

	describe("fromHex", () => {
		it("parses valid hex", () => {
			const hash = TransactionHash.fromHex(testHash);
			expect(hash).toHaveLength(32);
		});

		it("parses hex without 0x prefix", () => {
			const hash = TransactionHash.fromHex(testHash.slice(2));
			expect(hash).toHaveLength(32);
		});

		it("throws on wrong length", () => {
			expect(() => TransactionHash.fromHex("0x1234")).toThrow(
				"must be 64 characters",
			);
		});

		it("throws on invalid characters", () => {
			expect(() =>
				TransactionHash.fromHex(
					"0xgg34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				),
			).toThrow("invalid characters");
		});
	});

	describe("fromBytes", () => {
		it("validates length", () => {
			expect(() => TransactionHash.fromBytes(new Uint8Array(31))).toThrow(
				"must be 32 bytes",
			);
			expect(() => TransactionHash.fromBytes(new Uint8Array(33))).toThrow(
				"must be 32 bytes",
			);
		});

		it("accepts 32 bytes", () => {
			const hash = TransactionHash.fromBytes(testBytes);
			expect(hash).toHaveLength(32);
		});
	});

	describe("toHex", () => {
		it("converts to hex", () => {
			const hash = TransactionHash.fromBytes(testBytes);
			const hex = TransactionHash.toHex(hash);
			expect(hex).toBe(testHash);
		});
	});

	describe("equals", () => {
		it("returns true for equal hashes", () => {
			const a = TransactionHash.fromHex(testHash);
			const b = TransactionHash.fromHex(testHash);
			expect(TransactionHash.equals(a, b)).toBe(true);
		});

		it("returns false for different hashes", () => {
			const a = TransactionHash.fromHex(testHash);
			const b = TransactionHash.fromHex(
				"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
			);
			expect(TransactionHash.equals(a, b)).toBe(false);
		});
	});
});
