import { describe, expect, it } from "vitest";
import * as BloomFilter from "./index.js";

describe("BloomFilter batch operations", () => {
	describe("combine", () => {
		it("combines multiple bloom filters", () => {
			const f1 = BloomFilter.create(2048, 3);
			const f2 = BloomFilter.create(2048, 3);
			const f3 = BloomFilter.create(2048, 3);

			BloomFilter.add(f1, "test1");
			BloomFilter.add(f2, "test2");
			BloomFilter.add(f3, "test3");

			const combined = BloomFilter.combine(f1, f2, f3);

			expect(BloomFilter.contains(combined, "test1")).toBe(true);
			expect(BloomFilter.contains(combined, "test2")).toBe(true);
			expect(BloomFilter.contains(combined, "test3")).toBe(true);
		});

		it("throws for empty input", () => {
			expect(() => BloomFilter.combine()).toThrow(
				"combine requires at least one filter",
			);
		});

		it("throws for mismatched parameters", () => {
			const f1 = BloomFilter.create(2048, 3);
			const f2 = BloomFilter.create(4096, 3);

			expect(() => BloomFilter.combine(f1, f2)).toThrow(
				"Cannot combine filters with different parameters",
			);
		});
	});

	describe("density", () => {
		it("calculates density of empty filter", () => {
			const filter = BloomFilter.create(2048, 3);
			const d = BloomFilter.density(filter);
			expect(d).toBe(0);
		});

		it("calculates density after adding items", () => {
			const filter = BloomFilter.create(2048, 3);
			BloomFilter.add(filter, "test");
			const d = BloomFilter.density(filter);
			// With k=3, we expect approximately 3 bits set out of 2048
			expect(d).toBeGreaterThan(0);
			expect(d).toBeLessThan(0.01);
		});

		it("density increases with more items", () => {
			const filter = BloomFilter.create(2048, 3);
			BloomFilter.add(filter, "test1");
			const d1 = BloomFilter.density(filter);

			BloomFilter.add(filter, "test2");
			BloomFilter.add(filter, "test3");
			const d2 = BloomFilter.density(filter);

			expect(d2).toBeGreaterThan(d1);
		});
	});

	describe("expectedFalsePositiveRate", () => {
		it("calculates false positive rate", () => {
			const filter = BloomFilter.create(2048, 3);
			const fpr = BloomFilter.expectedFalsePositiveRate(filter, 100);
			expect(fpr).toBeGreaterThan(0);
			expect(fpr).toBeLessThan(0.01);
		});

		it("increases with more items", () => {
			const filter = BloomFilter.create(2048, 3);
			const fpr1 = BloomFilter.expectedFalsePositiveRate(filter, 10);
			const fpr2 = BloomFilter.expectedFalsePositiveRate(filter, 100);
			expect(fpr2).toBeGreaterThan(fpr1);
		});

		it("returns low rate for well-sized filter", () => {
			const filter = BloomFilter.create(10000, 5);
			const fpr = BloomFilter.expectedFalsePositiveRate(filter, 100);
			expect(fpr).toBeLessThan(0.001);
		});
	});
});
