import { describe, expect, it } from "vitest";
import * as Hash from "./index.js";

describe("Hash batch operations", () => {
	describe("concat", () => {
		it("concatenates and hashes multiple hashes", () => {
			const h1 = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const h2 = Hash.keccak256(new Uint8Array([4, 5, 6]));
			const result = Hash.concat(h1, h2);

			expect(result).toHaveLength(32);
			expect(Hash.isHash(result)).toBe(true);
		});

		it("returns consistent result for same input", () => {
			const h1 = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const h2 = Hash.keccak256(new Uint8Array([4, 5, 6]));
			const result1 = Hash.concat(h1, h2);
			const result2 = Hash.concat(h1, h2);

			expect(Hash.equals(result1, result2)).toBe(true);
		});

		it("handles single hash", () => {
			const h1 = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const result = Hash.concat(h1);

			expect(result).toHaveLength(32);
			expect(Hash.isHash(result)).toBe(true);
		});

		it("handles three hashes", () => {
			const h1 = Hash.keccak256(new Uint8Array([1]));
			const h2 = Hash.keccak256(new Uint8Array([2]));
			const h3 = Hash.keccak256(new Uint8Array([3]));
			const result = Hash.concat(h1, h2, h3);

			expect(result).toHaveLength(32);
			expect(Hash.isHash(result)).toBe(true);
		});
	});

	describe("merkleRoot", () => {
		it("returns zero for empty array", () => {
			const result = Hash.merkleRoot([]);
			expect(Hash.equals(result, Hash.ZERO)).toBe(true);
		});

		it("returns single hash for single element", () => {
			const h1 = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const result = Hash.merkleRoot([h1]);

			expect(Hash.equals(result, h1)).toBe(true);
		});

		it("calculates root for two hashes", () => {
			const h1 = Hash.keccak256(new Uint8Array([1]));
			const h2 = Hash.keccak256(new Uint8Array([2]));
			const result = Hash.merkleRoot([h1, h2]);

			expect(result).toHaveLength(32);
			expect(Hash.isHash(result)).toBe(true);
			expect(Hash.equals(result, h1)).toBe(false);
			expect(Hash.equals(result, h2)).toBe(false);
		});

		it("calculates root for four hashes", () => {
			const h1 = Hash.keccak256(new Uint8Array([1]));
			const h2 = Hash.keccak256(new Uint8Array([2]));
			const h3 = Hash.keccak256(new Uint8Array([3]));
			const h4 = Hash.keccak256(new Uint8Array([4]));
			const result = Hash.merkleRoot([h1, h2, h3, h4]);

			expect(result).toHaveLength(32);
			expect(Hash.isHash(result)).toBe(true);
		});

		it("handles odd number of hashes", () => {
			const h1 = Hash.keccak256(new Uint8Array([1]));
			const h2 = Hash.keccak256(new Uint8Array([2]));
			const h3 = Hash.keccak256(new Uint8Array([3]));
			const result = Hash.merkleRoot([h1, h2, h3]);

			expect(result).toHaveLength(32);
			expect(Hash.isHash(result)).toBe(true);
		});

		it("returns consistent result for same input", () => {
			const h1 = Hash.keccak256(new Uint8Array([1]));
			const h2 = Hash.keccak256(new Uint8Array([2]));
			const h3 = Hash.keccak256(new Uint8Array([3]));
			const result1 = Hash.merkleRoot([h1, h2, h3]);
			const result2 = Hash.merkleRoot([h1, h2, h3]);

			expect(Hash.equals(result1, result2)).toBe(true);
		});

		it("produces different roots for different orders", () => {
			const h1 = Hash.keccak256(new Uint8Array([1]));
			const h2 = Hash.keccak256(new Uint8Array([2]));
			const result1 = Hash.merkleRoot([h1, h2]);
			const result2 = Hash.merkleRoot([h2, h1]);

			expect(Hash.equals(result1, result2)).toBe(false);
		});
	});
});
