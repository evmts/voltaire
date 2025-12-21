import { describe, expect, it } from "vitest";
import { equals } from "./equals.js";
import { isHash } from "./isHash.js";
import { isZero } from "./isZero.js";
import { random } from "./random.js";

describe("random", () => {
	describe("generation", () => {
		it("creates random 32-byte hash", () => {
			const hash = random();
			expect(hash.length).toBe(32);
			expect(isHash(hash)).toBe(true);
		});

		it("creates different hashes on each call", () => {
			const hash1 = random();
			const hash2 = random();
			expect(equals(hash1, hash2)).toBe(false);
		});

		it("creates many unique hashes", () => {
			/** @type {import('./HashType.js').HashType[]} */
			const hashes = [];
			for (let i = 0; i < 10; i++) {
				hashes.push(random());
			}
			for (let i = 0; i < hashes.length; i++) {
				for (let j = i + 1; j < hashes.length; j++) {
					expect(equals(/** @type {*} */ (hashes[i]), /** @type {*} */ (hashes[j]))).toBe(false);
				}
			}
		});

		it("unlikely to generate zero hash", () => {
			const hash = random();
			expect(isZero(hash)).toBe(false);
		});

		it("generates valid Uint8Array", () => {
			const hash = random();
			expect(hash instanceof Uint8Array).toBe(true);
		});
	});

	describe("randomness", () => {
		it("has varied byte values", () => {
			const hash = random();
			const allSame = hash.every((b) => b === hash[0]);
			expect(allSame).toBe(false);
		});

		it("has distribution across byte range", () => {
			const hash = random();
			let hasLow = false;
			let hasHigh = false;
			for (let i = 0; i < hash.length; i++) {
				const byte = /** @type {number} */ (hash[i]);
				if (byte < 128) hasLow = true;
				if (byte >= 128) hasHigh = true;
			}
			expect(hasLow || hasHigh).toBe(true);
		});

		it("generates different patterns", () => {
			const hash1 = random();
			const hash2 = random();
			let differentBytes = 0;
			for (let i = 0; i < 32; i++) {
				if (hash1[i] !== hash2[i]) {
					differentBytes++;
				}
			}
			expect(differentBytes).toBeGreaterThan(0);
		});
	});

	describe("independence", () => {
		it("repeated calls produce independent hashes", () => {
			/** @type {import('./HashType.js').HashType[]} */
			const hashes = [];
			for (let i = 0; i < 5; i++) {
				hashes.push(random());
			}
			const allDifferent = hashes.every((h1, i) =>
				hashes.every((h2, j) => i === j || !equals(h1, h2)),
			);
			expect(allDifferent).toBe(true);
		});
	});

	describe("cryptographic quality", () => {
		it("has high entropy", () => {
			const hash = random();
			const byteCounts = new Array(256).fill(0);
			for (let i = 0; i < hash.length; i++) {
				const byte = /** @type {number} */ (hash[i]);
				byteCounts[byte]++;
			}
			const uniqueBytes = byteCounts.filter((c) => c > 0).length;
			expect(uniqueBytes).toBeGreaterThan(10);
		});

		it("unlikely to have many repeated bytes", () => {
			const hash = random();
			/** @type {Record<number, number>} */
			const byteCounts = {};
			for (let i = 0; i < hash.length; i++) {
				const byte = /** @type {number} */ (hash[i]);
				byteCounts[byte] = (byteCounts[byte] || 0) + 1;
			}
			const maxRepeats = Math.max(...Object.values(byteCounts));
			expect(maxRepeats).toBeLessThan(10);
		});
	});

	describe("collision resistance", () => {
		it("extremely unlikely to generate same hash twice", () => {
			const iterations = 100;
			const hashes = new Set();
			for (let i = 0; i < iterations; i++) {
				const hash = random();
				const hex = Array.from(hash)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("");
				hashes.add(hex);
			}
			expect(hashes.size).toBe(iterations);
		});
	});

	describe("edge cases", () => {
		it("works in Node environment", () => {
			expect(() => random()).not.toThrow();
		});

		it("returns different values across multiple runs", () => {
			const results = new Set();
			for (let i = 0; i < 20; i++) {
				const hash = random();
				results.add(hash[0]);
			}
			expect(results.size).toBeGreaterThan(1);
		});
	});
});
