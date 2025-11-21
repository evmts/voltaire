import { describe, expect, it } from "vitest";
import type { BlockHashType } from "../BlockHash/BlockHashType.js";
import { from } from "./index.js";

describe("ChainHead", () => {
	const mockHash = new Uint8Array(32) as BlockHashType;
	mockHash[0] = 0xaa;
	mockHash[31] = 0xff;

	describe("from", () => {
		it("creates from minimal object", () => {
			const head = from({
				number: 18000000n,
				hash: mockHash,
				timestamp: 1699000000n,
			});

			expect(head.number).toBe(18000000n);
			expect(head.hash).toBe(mockHash);
			expect(head.timestamp).toBe(1699000000n);
			expect(head.difficulty).toBeUndefined();
			expect(head.totalDifficulty).toBeUndefined();
		});

		it("creates with difficulty fields", () => {
			const head = from({
				number: 15000000n,
				hash: mockHash,
				timestamp: 1650000000n,
				difficulty: 12000000000000000n,
				totalDifficulty: 58750003716598352816469n,
			});

			expect(head.difficulty).toBe(12000000000000000n);
			expect(head.totalDifficulty).toBe(58750003716598352816469n);
		});

		it("converts string/number to bigint", () => {
			const head = from({
				number: "18000000",
				hash: mockHash,
				timestamp: 1699000000,
			});

			expect(head.number).toBe(18000000n);
			expect(head.timestamp).toBe(1699000000n);
		});

		it("converts hex string hash to bytes", () => {
			const hexHash =
				"0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

			const head = from({
				number: 100n,
				hash: hexHash,
				timestamp: 1000n,
			});

			expect(head.hash).toBeInstanceOf(Uint8Array);
			expect(head.hash).toHaveLength(32);
			expect(head.hash[0]).toBe(0xab);
			expect(head.hash[1]).toBe(0xcd);
			expect(head.hash[31]).toBe(0x89);
		});

		it("handles hash without 0x prefix", () => {
			const hexHash =
				"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

			const head = from({
				number: 100n,
				hash: hexHash,
				timestamp: 1000n,
			});

			expect(head.hash).toBeInstanceOf(Uint8Array);
			expect(head.hash[0]).toBe(0x12);
		});

		it("throws on missing required fields", () => {
			expect(() =>
				from({
					hash: mockHash,
					timestamp: 1000n,
				} as any),
			).toThrow("requires number, hash, and timestamp");

			expect(() =>
				from({
					number: 100n,
					timestamp: 1000n,
				} as any),
			).toThrow("requires number, hash, and timestamp");

			expect(() =>
				from({
					number: 100n,
					hash: mockHash,
				} as any),
			).toThrow("requires number, hash, and timestamp");
		});

		it("throws on invalid hash length", () => {
			expect(() =>
				from({
					number: 100n,
					hash: "0xabcd",
					timestamp: 1000n,
				}),
			).toThrow("Invalid block hash length");
		});

		it("throws on null input", () => {
			expect(() => from(null as any)).toThrow("Invalid ChainHead input");
		});

		it("throws on non-object input", () => {
			expect(() => from(123 as any)).toThrow("Invalid ChainHead input");
		});
	});

	describe("post-merge blocks", () => {
		it("represents PoS block (zero difficulty)", () => {
			const head = from({
				number: 18000000n,
				hash: mockHash,
				timestamp: 1699000000n,
				difficulty: 0n,
			});

			expect(head.difficulty).toBe(0n);
		});
	});

	describe("pre-merge blocks", () => {
		it("represents PoW block with difficulty", () => {
			const head = from({
				number: 15000000n,
				hash: mockHash,
				timestamp: 1650000000n,
				difficulty: 12000000000000000n,
				totalDifficulty: 58750003716598352816469n,
			});

			expect(head.difficulty).toBeGreaterThan(0n);
			expect(head.totalDifficulty).toBeGreaterThan(0n);
		});
	});
});
