/**
 * Ox-based Hex Module Tests
 * Verifies API compatibility and functionality
 */

import { describe, expect, it } from "vitest";
import * as Hex from "./index.ox.js";

describe("Hex (Ox-based)", () => {
	describe("Constructors", () => {
		it("from() - creates hex from various inputs", () => {
			expect(Hex.from("0x1234")).toBe("0x1234");
			expect(Hex.from(new Uint8Array([0x12, 0x34]))).toBe("0x1234");
		});

		it("fromBytes() - creates hex from Uint8Array", () => {
			const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
			expect(Hex.fromBytes(bytes)).toBe("0xdeadbeef");
		});

		it("fromNumber() - creates hex from number", () => {
			expect(Hex.fromNumber(255)).toBe("0xff");
			expect(Hex.fromNumber(4660)).toBe("0x1234");
		});

		it("fromBigInt() - creates hex from BigInt", () => {
			expect(Hex.fromBigInt(255n)).toBe("0xff");
			expect(Hex.fromBigInt(BigInt(Number.MAX_SAFE_INTEGER))).toContain("0x");
		});

		it("fromString() - creates hex from string", () => {
			expect(Hex.fromString("hello")).toBe("0x68656c6c6f");
		});

		it("fromBoolean() - creates hex from boolean", () => {
			// Ox returns minimal representation
			expect(Hex.fromBoolean(true)).toBe("0x1");
			expect(Hex.fromBoolean(false)).toBe("0x0");
		});
	});

	describe("Converters", () => {
		it("toBytes() - converts hex to Uint8Array", () => {
			const bytes = Hex.toBytes("0xdeadbeef");
			expect(bytes).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
		});

		it("toNumber() - converts hex to number", () => {
			expect(Hex.toNumber("0xff")).toBe(255);
			expect(Hex.toNumber("0x1234")).toBe(4660);
		});

		it("toBigInt() - converts hex to BigInt", () => {
			expect(Hex.toBigInt("0xff")).toBe(255n);
			expect(Hex.toBigInt("0xffffffffffffffffff")).toBe(
				BigInt("0xffffffffffffffffff"),
			);
		});

		it("toString() - converts hex to string", () => {
			expect(Hex.toString("0x68656c6c6f")).toBe("hello");
		});

		it("toBoolean() - converts hex to boolean", () => {
			expect(Hex.toBoolean("0x01")).toBe(true);
			expect(Hex.toBoolean("0x00")).toBe(false);
		});
	});

	describe("Manipulations", () => {
		it("concat() - concatenates hex values", () => {
			expect(Hex.concat("0x12", "0x34")).toBe("0x1234");
			expect(Hex.concat("0xaa", "0xbb", "0xcc")).toBe("0xaabbcc");
		});

		it("slice() - slices hex value", () => {
			expect(Hex.slice("0x1234567890", 1, 3)).toBe("0x3456");
		});

		it("padLeft() - pads hex on left", () => {
			expect(Hex.padLeft("0x1234", 4)).toBe("0x00001234");
		});

		it("padRight() - pads hex on right", () => {
			expect(Hex.padRight("0x1234", 4)).toBe("0x12340000");
		});

		it("trimLeft() - trims zeros from left", () => {
			expect(Hex.trimLeft("0x00001234")).toBe("0x1234");
		});

		it("trimRight() - trims zeros from right", () => {
			expect(Hex.trimRight("0x12340000")).toBe("0x1234");
		});
	});

	describe("Utilities", () => {
		it("size() - returns byte size", () => {
			expect(Hex.size("0x1234")).toBe(2);
			expect(Hex.size("0xdeadbeef")).toBe(4);
		});

		it("isEqual() - compares hex values", () => {
			expect(Hex.isEqual("0x1234", "0x1234")).toBe(true);
			expect(Hex.isEqual("0x1234", "0x5678")).toBe(false);
		});

		it("validate() - validates hex format", () => {
			// Ox's validate returns boolean
			expect(Hex.validate("0x1234")).toBe(true);
			expect(Hex.validate("not hex")).toBe(false);
		});

		it("random() - generates random hex", () => {
			const hex = Hex.random(32);
			expect(Hex.size(hex)).toBe(32);
			expect(hex).toMatch(/^0x[0-9a-f]+$/);
		});
	});

	describe("Voltaire Extensions", () => {
		it("xor() - performs bitwise XOR", () => {
			expect(Hex.xor("0xff", "0x0f")).toBe("0xf0");
			expect(Hex.xor("0xaaaa", "0x5555")).toBe("0xffff");
		});

		it("zero() - generates zero-filled hex", () => {
			expect(Hex.zero(4)).toBe("0x00000000");
			expect(Hex.zero(1)).toBe("0x00");
			expect(Hex.size(Hex.zero(32))).toBe(32);
		});

		it("isSized() - checks hex size", () => {
			expect(Hex.isSized("0x1234", 2)).toBe(true);
			expect(Hex.isSized("0x1234", 4)).toBe(false);
		});

		it("assertSize() - asserts hex size", () => {
			expect(() => Hex.assertSize("0x1234", 2)).not.toThrow();
			expect(() => Hex.assertSize("0x1234", 4)).toThrow(/Invalid hex size/);
		});

		it("isHex() - type guard for hex", () => {
			expect(Hex.isHex("0x1234")).toBe(true);
			expect(Hex.isHex("not hex")).toBe(false);
			expect(Hex.isHex(1234)).toBe(false);
		});

		it("clone() - clones hex value", () => {
			const original = "0x1234" as Hex.Hex;
			const cloned = Hex.clone(original);
			expect(cloned).toBe(original); // Same value since hex is immutable
		});
	});

	describe("Compatibility Aliases", () => {
		it("equals() - alias for isEqual()", () => {
			expect(Hex.equals("0x1234", "0x1234")).toBe(true);
			expect(Hex.equals("0x1234", "0x5678")).toBe(false);
		});

		it("pad() - alias for padLeft()", () => {
			expect(Hex.pad("0x1234", 4)).toBe("0x00001234");
		});

		it("trim() - alias for trimLeft()", () => {
			expect(Hex.trim("0x00001234")).toBe("0x1234");
		});
	});
});
