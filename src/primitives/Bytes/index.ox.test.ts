/**
 * Ox-based Bytes Module Tests
 * Verifies API compatibility and functionality
 */

import { describe, expect, it } from "vitest";
import * as Bytes from "./index.ox.js";

describe("Bytes (Ox-based)", () => {
	describe("Constructors", () => {
		it("from() - creates bytes from various inputs", () => {
			const arr = new Uint8Array([0x12, 0x34]);
			expect(Bytes.from(arr)).toEqual(arr);
			expect(Bytes.from("0x1234")).toEqual(new Uint8Array([0x12, 0x34]));
		});

		it("fromArray() - creates bytes from array", () => {
			const arr = [0xde, 0xad, 0xbe, 0xef];
			const result = Bytes.fromArray(arr);
			expect(result).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
		});

		it("fromHex() - creates bytes from hex string", () => {
			const result = Bytes.fromHex("0xdeadbeef");
			expect(result).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
		});

		it("fromNumber() - creates bytes from number", () => {
			expect(Bytes.fromNumber(255)).toEqual(new Uint8Array([0xff]));
			expect(Bytes.fromNumber(4660)).toEqual(new Uint8Array([0x12, 0x34]));
		});

		it("fromString() - creates bytes from string", () => {
			const result = Bytes.fromString("hello");
			const expected = new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]);
			expect(result).toEqual(expected);
		});

		it("fromBoolean() - creates bytes from boolean", () => {
			expect(Bytes.fromBoolean(true)).toEqual(new Uint8Array([0x01]));
			expect(Bytes.fromBoolean(false)).toEqual(new Uint8Array([0x00]));
		});
	});

	describe("Converters", () => {
		it("toHex() - converts bytes to hex string", () => {
			const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
			expect(Bytes.toHex(bytes)).toBe("0xdeadbeef");
		});

		it("toNumber() - converts bytes to number", () => {
			expect(Bytes.toNumber(new Uint8Array([0xff]))).toBe(255);
			expect(Bytes.toNumber(new Uint8Array([0x12, 0x34]))).toBe(4660);
		});

		it("toBigInt() - converts bytes to BigInt", () => {
			expect(Bytes.toBigInt(new Uint8Array([0xff]))).toBe(255n);
			expect(Bytes.toBigInt(new Uint8Array([0x12, 0x34]))).toBe(4660n);
		});

		it("toString() - converts bytes to string", () => {
			const bytes = new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]);
			expect(Bytes.toString(bytes)).toBe("hello");
		});

		it("toBoolean() - converts bytes to boolean", () => {
			expect(Bytes.toBoolean(new Uint8Array([0x01]))).toBe(true);
			expect(Bytes.toBoolean(new Uint8Array([0x00]))).toBe(false);
		});
	});

	describe("Manipulations", () => {
		it("concat() - concatenates bytes", () => {
			const result = Bytes.concat(
				new Uint8Array([0x12]),
				new Uint8Array([0x34]),
			);
			expect(result).toEqual(new Uint8Array([0x12, 0x34]));
		});

		it("slice() - slices bytes", () => {
			const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x90]);
			const result = Bytes.slice(bytes, 1, 3);
			expect(result).toEqual(new Uint8Array([0x34, 0x56]));
		});

		it("padLeft() - pads bytes on left", () => {
			const bytes = new Uint8Array([0x12, 0x34]);
			const result = Bytes.padLeft(bytes, 4);
			expect(result).toEqual(new Uint8Array([0x00, 0x00, 0x12, 0x34]));
		});

		it("padRight() - pads bytes on right", () => {
			const bytes = new Uint8Array([0x12, 0x34]);
			const result = Bytes.padRight(bytes, 4);
			expect(result).toEqual(new Uint8Array([0x12, 0x34, 0x00, 0x00]));
		});

		it("trimLeft() - trims zeros from left", () => {
			const bytes = new Uint8Array([0x00, 0x00, 0x12, 0x34]);
			const result = Bytes.trimLeft(bytes);
			expect(result).toEqual(new Uint8Array([0x12, 0x34]));
		});

		it("trimRight() - trims zeros from right", () => {
			const bytes = new Uint8Array([0x12, 0x34, 0x00, 0x00]);
			const result = Bytes.trimRight(bytes);
			expect(result).toEqual(new Uint8Array([0x12, 0x34]));
		});
	});

	describe("Utilities", () => {
		it("size() - returns byte length", () => {
			expect(Bytes.size(new Uint8Array([0x12, 0x34]))).toBe(2);
			expect(Bytes.size(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))).toBe(4);
		});

		it("isEqual() - compares bytes", () => {
			const bytes1 = new Uint8Array([0x12, 0x34]);
			const bytes2 = new Uint8Array([0x12, 0x34]);
			const bytes3 = new Uint8Array([0x56, 0x78]);
			expect(Bytes.isEqual(bytes1, bytes2)).toBe(true);
			expect(Bytes.isEqual(bytes1, bytes3)).toBe(false);
		});

		it("validate() - validates bytes", () => {
			expect(Bytes.validate(new Uint8Array([0x12, 0x34]))).toBe(true);
			expect(Bytes.validate("not bytes" as any)).toBe(false);
		});

		it("random() - generates random bytes", () => {
			const bytes = Bytes.random(32);
			expect(Bytes.size(bytes)).toBe(32);
			expect(bytes instanceof Uint8Array).toBe(true);
		});

		it("assert() - asserts valid bytes", () => {
			expect(() => Bytes.assert(new Uint8Array([0x12, 0x34]))).not.toThrow();
			expect(() => Bytes.assert("not bytes" as any)).toThrow();
		});
	});

	describe("Type Guards and Utilities", () => {
		it("isBytes() - type guard for Uint8Array", () => {
			expect(Bytes.isBytes(new Uint8Array([0x12, 0x34]))).toBe(true);
			expect(Bytes.isBytes([0x12, 0x34])).toBe(false);
			expect(Bytes.isBytes("0x1234")).toBe(false);
			expect(Bytes.isBytes(null)).toBe(false);
		});

		it("clone() - creates a copy of bytes", () => {
			const original = new Uint8Array([0x12, 0x34]);
			const cloned = Bytes.clone(original);

			// Should be equal but not same reference
			expect(cloned).toEqual(original);
			expect(cloned).not.toBe(original);

			// Modifying clone should not affect original
			cloned[0] = 0xff;
			expect(original[0]).toBe(0x12);
		});
	});

	describe("Compatibility Aliases", () => {
		it("equals() - alias for isEqual()", () => {
			const bytes1 = new Uint8Array([0x12, 0x34]);
			const bytes2 = new Uint8Array([0x12, 0x34]);
			const bytes3 = new Uint8Array([0x56, 0x78]);
			expect(Bytes.equals(bytes1, bytes2)).toBe(true);
			expect(Bytes.equals(bytes1, bytes3)).toBe(false);
		});

		it("pad() - alias for padLeft()", () => {
			const bytes = new Uint8Array([0x12, 0x34]);
			const result = Bytes.pad(bytes, 4);
			expect(result).toEqual(new Uint8Array([0x00, 0x00, 0x12, 0x34]));
		});

		it("trim() - alias for trimLeft()", () => {
			const bytes = new Uint8Array([0x00, 0x00, 0x12, 0x34]);
			const result = Bytes.trim(bytes);
			expect(result).toEqual(new Uint8Array([0x12, 0x34]));
		});
	});

	describe("Integration", () => {
		it("round-trip: hex -> bytes -> hex", () => {
			const original = "0xdeadbeef";
			const bytes = Bytes.fromHex(original);
			const hex = Bytes.toHex(bytes);
			expect(hex).toBe(original);
		});

		it("round-trip: string -> bytes -> string", () => {
			const original = "hello world";
			const bytes = Bytes.fromString(original);
			const str = Bytes.toString(bytes);
			expect(str).toBe(original);
		});

		it("round-trip: number -> bytes -> number", () => {
			const original = 12345;
			const bytes = Bytes.fromNumber(original);
			const num = Bytes.toNumber(bytes);
			expect(num).toBe(original);
		});

		it("round-trip: BigInt -> bytes -> BigInt", () => {
			const original = 123456789n;
			const bytes = Bytes.fromNumber(original);
			const bigint = Bytes.toBigInt(bytes);
			expect(bigint).toBe(original);
		});
	});
});
