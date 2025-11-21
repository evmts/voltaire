/**
 * ERC-1167 Minimal Proxy Tests
 * @see https://eips.ethereum.org/EIPS/eip-1167
 */

import { describe, expect, test } from "vitest";
import { generateErc1167 } from "./generateErc1167.js";
import { isErc1167 } from "./isErc1167.js";
import { parseErc1167 } from "./parseErc1167.js";

describe("ERC-1167 Minimal Proxy", () => {
	const testAddress = new Uint8Array([
		0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc,
		0xdd, 0xee, 0xff, 0x00, 0x11, 0x22, 0x33, 0x44,
	]);

	describe("generateErc1167", () => {
		test("generates valid 55-byte creation code", () => {
			const bytecode = generateErc1167(testAddress);

			expect(bytecode).toHaveLength(55);
		});

		test("throws on invalid address length", () => {
			const invalidAddress = new Uint8Array(19);
			expect(() => generateErc1167(invalidAddress)).toThrow(
				"Implementation address must be 20 bytes",
			);
		});

		test("embeds implementation address at correct offset", () => {
			const bytecode = generateErc1167(testAddress);

			// Address should be at offset 20
			const embeddedAddress = bytecode.slice(20, 40);
			expect(embeddedAddress).toEqual(testAddress);
		});

		test("has correct creation code prefix", () => {
			const bytecode = generateErc1167(testAddress);

			// 3d602d80600a3d3981f3
			expect(bytecode[0]).toBe(0x3d);
			expect(bytecode[1]).toBe(0x60);
			expect(bytecode[2]).toBe(0x2d);
			expect(bytecode[3]).toBe(0x80);
			expect(bytecode[9]).toBe(0xf3);
		});

		test("has correct runtime code within creation code", () => {
			const bytecode = generateErc1167(testAddress);

			// Runtime prefix starts at offset 10
			expect(bytecode[10]).toBe(0x36);
			expect(bytecode[19]).toBe(0x73); // PUSH20
		});

		test("has correct suffix", () => {
			const bytecode = generateErc1167(testAddress);

			// 5af43d82803e903d91602b57fd5bf3
			expect(bytecode[40]).toBe(0x5a);
			expect(bytecode[41]).toBe(0xf4);
			expect(bytecode[54]).toBe(0xf3);
		});

		test("deterministic - same address produces same bytecode", () => {
			const bytecode1 = generateErc1167(testAddress);
			const bytecode2 = generateErc1167(testAddress);

			expect(bytecode1).toEqual(bytecode2);
		});

		test("different addresses produce different bytecode", () => {
			const address2 = new Uint8Array(20).fill(0xff);
			const bytecode1 = generateErc1167(testAddress);
			const bytecode2 = generateErc1167(address2);

			expect(bytecode1).not.toEqual(bytecode2);
		});
	});

	describe("parseErc1167", () => {
		test("extracts implementation address from creation code", () => {
			const bytecode = generateErc1167(testAddress);
			const extracted = parseErc1167(bytecode);

			expect(extracted).toEqual(testAddress);
		});

		test("extracts implementation address from runtime code", () => {
			const bytecode = generateErc1167(testAddress);
			// Extract runtime portion (bytes 10-54, which is 45 bytes)
			const runtimeCode = bytecode.slice(10);

			const extracted = parseErc1167(runtimeCode);
			expect(extracted).toEqual(testAddress);
		});

		test("returns null for invalid bytecode length", () => {
			const invalidBytecode = new Uint8Array(30);
			const extracted = parseErc1167(invalidBytecode);

			expect(extracted).toBeNull();
		});

		test("returns null for invalid prefix pattern", () => {
			const invalidBytecode = new Uint8Array(55).fill(0xff);
			const extracted = parseErc1167(invalidBytecode);

			expect(extracted).toBeNull();
		});

		test("handles zero address", () => {
			const zeroAddress = new Uint8Array(20);
			const bytecode = generateErc1167(zeroAddress);
			const extracted = parseErc1167(bytecode);

			expect(extracted).toEqual(zeroAddress);
		});

		test("handles max address", () => {
			const maxAddress = new Uint8Array(20).fill(0xff);
			const bytecode = generateErc1167(maxAddress);
			const extracted = parseErc1167(bytecode);

			expect(extracted).toEqual(maxAddress);
		});
	});

	describe("isErc1167", () => {
		test("validates creation code", () => {
			const bytecode = generateErc1167(testAddress);
			expect(isErc1167(bytecode)).toBe(true);
		});

		test("validates runtime code", () => {
			const bytecode = generateErc1167(testAddress);
			const runtimeCode = bytecode.slice(10);

			expect(isErc1167(runtimeCode)).toBe(true);
		});

		test("rejects invalid length", () => {
			const invalidBytecode = new Uint8Array(30);
			expect(isErc1167(invalidBytecode)).toBe(false);
		});

		test("rejects invalid prefix", () => {
			const invalidBytecode = new Uint8Array(55).fill(0xff);
			expect(isErc1167(invalidBytecode)).toBe(false);
		});

		test("rejects corrupted creation code", () => {
			const bytecode = generateErc1167(testAddress);
			bytecode[0] = 0xff; // Corrupt first byte

			expect(isErc1167(bytecode)).toBe(false);
		});

		test("rejects corrupted runtime code", () => {
			const bytecode = generateErc1167(testAddress);
			const runtimeCode = bytecode.slice(10);
			runtimeCode[0] = 0xff; // Corrupt first byte

			expect(isErc1167(runtimeCode)).toBe(false);
		});

		test("rejects corrupted suffix", () => {
			const bytecode = generateErc1167(testAddress);
			bytecode[54] = 0xff; // Corrupt last byte

			expect(isErc1167(bytecode)).toBe(false);
		});

		test("validates with different implementation addresses", () => {
			const addresses = [
				new Uint8Array(20),
				new Uint8Array(20).fill(0xff),
				testAddress,
			];

			for (const address of addresses) {
				const bytecode = generateErc1167(address);
				expect(isErc1167(bytecode)).toBe(true);
			}
		});
	});

	describe("round-trip", () => {
		test("generate -> parse -> validate", () => {
			const bytecode = generateErc1167(testAddress);
			const extracted = parseErc1167(bytecode);
			const valid = isErc1167(bytecode);

			expect(extracted).toEqual(testAddress);
			expect(valid).toBe(true);
		});

		test("multiple addresses", () => {
			const testAddresses = [
				new Uint8Array(20),
				new Uint8Array(20).fill(0xff),
				testAddress,
				new Uint8Array([
					0xd9, 0xe1, 0x45, 0x9a, 0x7a, 0x48, 0x21, 0xad, 0xb4, 0x99, 0xd9,
					0xad, 0x3a, 0x96, 0x02, 0xec, 0x80, 0x62, 0x16, 0xec,
				]),
			];

			for (const address of testAddresses) {
				const bytecode = generateErc1167(address);
				const extracted = parseErc1167(bytecode);

				expect(extracted).toEqual(address);
				expect(isErc1167(bytecode)).toBe(true);
			}
		});
	});
});
