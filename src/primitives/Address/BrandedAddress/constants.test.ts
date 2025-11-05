import { describe, expect, it } from "vitest";
import { HEX_SIZE, SIZE } from "./constants.js";

describe("constants", () => {
	describe("SIZE", () => {
		it("equals 20", () => {
			expect(SIZE).toBe(20);
		});

		it("is the byte length of an address", () => {
			expect(SIZE).toBe(20);
		});
	});

	describe("HEX_SIZE", () => {
		it("equals 42", () => {
			expect(HEX_SIZE).toBe(42);
		});

		it("is the string length of hex address with 0x prefix", () => {
			const hex = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			expect(hex.length).toBe(HEX_SIZE);
		});

		it("equals SIZE * 2 + 2 for 0x prefix", () => {
			expect(HEX_SIZE).toBe(SIZE * 2 + 2);
		});
	});
});
