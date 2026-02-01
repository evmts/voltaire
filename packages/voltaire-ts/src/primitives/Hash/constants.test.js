import { describe, expect, it } from "vitest";
import { SIZE, ZERO } from "./constants.js";
import { isHash } from "./isHash.js";
import { isZero } from "./isZero.js";

describe("constants", () => {
	describe("SIZE", () => {
		it("is 32", () => {
			expect(SIZE).toBe(32);
		});

		it("represents byte size", () => {
			expect(SIZE).toBe(32);
			expect(SIZE * 8).toBe(256);
		});

		it("matches hash length requirement", () => {
			const hash = new Uint8Array(SIZE);
			expect(isHash(hash)).toBe(true);
		});
	});

	describe("ZERO", () => {
		it("is a valid hash", () => {
			expect(isHash(ZERO)).toBe(true);
		});

		it("has correct length", () => {
			expect(ZERO.length).toBe(SIZE);
			expect(ZERO.length).toBe(32);
		});

		it("contains all zeros", () => {
			expect(ZERO.every((b) => b === 0)).toBe(true);
		});

		it("is recognized as zero hash", () => {
			expect(isZero(ZERO)).toBe(true);
		});

		it("is a Uint8Array", () => {
			expect(ZERO instanceof Uint8Array).toBe(true);
		});

		it("every byte is zero", () => {
			for (let i = 0; i < ZERO.length; i++) {
				expect(ZERO[i]).toBe(0);
			}
		});

		it("matches expected hex representation", () => {
			const expectedHex =
				"0x0000000000000000000000000000000000000000000000000000000000000000";
			const actualHex = `0x${Array.from(ZERO, (b) => b.toString(16).padStart(2, "0")).join("")}`;
			expect(actualHex).toBe(expectedHex);
		});
	});

	describe("immutability", () => {
		it("ZERO should not be mutated", () => {
			const original = ZERO[0];
			expect(original).toBe(0);
		});

		it("SIZE is a constant value", () => {
			const size1 = SIZE;
			const size2 = SIZE;
			expect(size1).toBe(size2);
			expect(size1).toBe(32);
		});
	});

	describe("relationship", () => {
		it("ZERO length equals SIZE", () => {
			expect(ZERO.length).toBe(SIZE);
		});

		it("SIZE defines valid hash length", () => {
			const validHash = new Uint8Array(SIZE);
			expect(isHash(validHash)).toBe(true);
		});

		it("ZERO is valid hash of SIZE bytes", () => {
			expect(ZERO.length).toBe(SIZE);
			expect(isHash(ZERO)).toBe(true);
		});
	});

	describe("usage", () => {
		it("SIZE for validating hash length", () => {
			const hash = new Uint8Array(SIZE);
			expect(hash.length).toBe(SIZE);
			expect(isHash(hash)).toBe(true);
		});

		it("ZERO as empty/default hash", () => {
			const defaultHash = ZERO;
			expect(isZero(defaultHash)).toBe(true);
		});

		it("ZERO for comparison", () => {
			const testHash = new Uint8Array(SIZE);
			let same = true;
			for (let i = 0; i < SIZE; i++) {
				if (testHash[i] !== ZERO[i]) {
					same = false;
					break;
				}
			}
			expect(same).toBe(true);
		});
	});
});
