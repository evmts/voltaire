import { describe, expect, it } from "vitest";
import * as Uint8 from "./index.js";

describe("Uint8", () => {
	describe("constants", () => {
		it("MIN should be 0", () => {
			expect(Uint8.MIN).toBe(0);
		});

		it("MAX should be 255", () => {
			expect(Uint8.MAX).toBe(255);
		});

		it("ZERO should be 0", () => {
			expect(Uint8.ZERO).toBe(0);
		});

		it("ONE should be 1", () => {
			expect(Uint8.ONE).toBe(1);
		});

		it("SIZE should be 8", () => {
			expect(Uint8.SIZE).toBe(8);
		});
	});

	describe("from", () => {
		it("should create from number", () => {
			expect(Uint8.from(0)).toBe(0);
			expect(Uint8.from(100)).toBe(100);
			expect(Uint8.from(255)).toBe(255);
		});

		it("should create from decimal string", () => {
			expect(Uint8.from("0")).toBe(0);
			expect(Uint8.from("100")).toBe(100);
			expect(Uint8.from("255")).toBe(255);
		});

		it("should create from hex string", () => {
			expect(Uint8.from("0x00")).toBe(0);
			expect(Uint8.from("0x64")).toBe(100);
			expect(Uint8.from("0xff")).toBe(255);
			expect(Uint8.from("0xFF")).toBe(255);
		});

		it("should throw on non-integer", () => {
			expect(() => Uint8.from(1.5)).toThrow("must be an integer");
		});

		it("should throw on negative", () => {
			expect(() => Uint8.from(-1)).toThrow("cannot be negative");
		});

		it("should throw on overflow", () => {
			expect(() => Uint8.from(256)).toThrow("exceeds maximum");
			expect(() => Uint8.from(1000)).toThrow("exceeds maximum");
		});

		it("should throw on invalid string", () => {
			expect(() => Uint8.from("invalid")).toThrow("Invalid Uint8 string");
			expect(() => Uint8.from("0xgg")).toThrow("Invalid Uint8 string");
		});
	});

	describe("fromNumber", () => {
		it("should create from valid numbers", () => {
			expect(Uint8.fromNumber(0)).toBe(0);
			expect(Uint8.fromNumber(128)).toBe(128);
			expect(Uint8.fromNumber(255)).toBe(255);
		});

		it("should throw on non-integer", () => {
			expect(() => Uint8.fromNumber(1.5)).toThrow("must be an integer");
		});

		it("should throw on negative", () => {
			expect(() => Uint8.fromNumber(-1)).toThrow("cannot be negative");
		});

		it("should throw on overflow", () => {
			expect(() => Uint8.fromNumber(256)).toThrow("exceeds maximum");
		});
	});

	describe("fromBigint", () => {
		it("should create from valid bigints", () => {
			expect(Uint8.fromBigint(0n)).toBe(0);
			expect(Uint8.fromBigint(128n)).toBe(128);
			expect(Uint8.fromBigint(255n)).toBe(255);
		});

		it("should throw on negative", () => {
			expect(() => Uint8.fromBigint(-1n)).toThrow("cannot be negative");
		});

		it("should throw on overflow", () => {
			expect(() => Uint8.fromBigint(256n)).toThrow("exceeds maximum");
		});
	});

	describe("fromHex", () => {
		it("should create from hex with 0x prefix", () => {
			expect(Uint8.fromHex("0x00")).toBe(0);
			expect(Uint8.fromHex("0x80")).toBe(128);
			expect(Uint8.fromHex("0xff")).toBe(255);
		});

		it("should create from hex without prefix", () => {
			expect(Uint8.fromHex("00")).toBe(0);
			expect(Uint8.fromHex("80")).toBe(128);
			expect(Uint8.fromHex("ff")).toBe(255);
		});

		it("should handle uppercase", () => {
			expect(Uint8.fromHex("0xFF")).toBe(255);
			expect(Uint8.fromHex("FF")).toBe(255);
		});

		it("should throw on invalid hex", () => {
			expect(() => Uint8.fromHex("0xgg")).toThrow("Invalid hex string");
		});

		it("should throw on overflow", () => {
			expect(() => Uint8.fromHex("0x100")).toThrow("exceeds maximum");
		});
	});

	describe("fromBytes", () => {
		it("should create from 1-byte Uint8Array", () => {
			expect(Uint8.fromBytes(new Uint8Array([0]))).toBe(0);
			expect(Uint8.fromBytes(new Uint8Array([128]))).toBe(128);
			expect(Uint8.fromBytes(new Uint8Array([255]))).toBe(255);
		});

		it("should throw on wrong length", () => {
			expect(() => Uint8.fromBytes(new Uint8Array([]))).toThrow(
				"exactly 1 byte",
			);
			expect(() => Uint8.fromBytes(new Uint8Array([1, 2]))).toThrow(
				"exactly 1 byte",
			);
		});
	});

	describe("toNumber", () => {
		it("should convert to number", () => {
			expect(Uint8.toNumber(Uint8.from(0))).toBe(0);
			expect(Uint8.toNumber(Uint8.from(128))).toBe(128);
			expect(Uint8.toNumber(Uint8.from(255))).toBe(255);
		});
	});

	describe("toBigint", () => {
		it("should convert to bigint", () => {
			expect(Uint8.toBigint(Uint8.from(0))).toBe(0n);
			expect(Uint8.toBigint(Uint8.from(128))).toBe(128n);
			expect(Uint8.toBigint(Uint8.from(255))).toBe(255n);
		});
	});

	describe("toHex", () => {
		it("should convert to padded hex", () => {
			expect(Uint8.toHex(Uint8.from(0))).toBe("0x00");
			expect(Uint8.toHex(Uint8.from(15))).toBe("0x0f");
			expect(Uint8.toHex(Uint8.from(255))).toBe("0xff");
		});

		it("should convert to unpadded hex", () => {
			expect(Uint8.toHex(Uint8.from(0), false)).toBe("0x0");
			expect(Uint8.toHex(Uint8.from(15), false)).toBe("0xf");
			expect(Uint8.toHex(Uint8.from(255), false)).toBe("0xff");
		});
	});

	describe("toBytes", () => {
		it("should convert to Uint8Array", () => {
			expect(Uint8.toBytes(Uint8.from(0))).toEqual(new Uint8Array([0]));
			expect(Uint8.toBytes(Uint8.from(128))).toEqual(new Uint8Array([128]));
			expect(Uint8.toBytes(Uint8.from(255))).toEqual(new Uint8Array([255]));
		});
	});

	describe("toString", () => {
		it("should convert to decimal string", () => {
			expect(Uint8.toString(Uint8.from(0))).toBe("0");
			expect(Uint8.toString(Uint8.from(128))).toBe("128");
			expect(Uint8.toString(Uint8.from(255))).toBe("255");
		});
	});

	describe("conversion round-trips", () => {
		it("number round-trip", () => {
			const original = 128;
			const uint = Uint8.fromNumber(original);
			expect(Uint8.toNumber(uint)).toBe(original);
		});

		it("bigint round-trip", () => {
			const original = 128n;
			const uint = Uint8.fromBigint(original);
			expect(Uint8.toBigint(uint)).toBe(original);
		});

		it("hex round-trip", () => {
			const original = "0xff";
			const uint = Uint8.fromHex(original);
			expect(Uint8.toHex(uint)).toBe("0xff");
		});

		it("bytes round-trip", () => {
			const original = new Uint8Array([128]);
			const uint = Uint8.fromBytes(original);
			expect(Uint8.toBytes(uint)).toEqual(original);
		});
	});

	describe("plus", () => {
		it("should add values", () => {
			expect(Uint8.plus(Uint8.from(10), Uint8.from(20))).toBe(30);
			expect(Uint8.plus(Uint8.from(100), Uint8.from(155))).toBe(255);
			expect(Uint8.plus(Uint8.from(0), Uint8.from(0))).toBe(0);
		});

		it("should throw on overflow", () => {
			expect(() => Uint8.plus(Uint8.from(200), Uint8.from(100))).toThrow(
				"overflow",
			);
			expect(() => Uint8.plus(Uint8.from(255), Uint8.from(1))).toThrow(
				"overflow",
			);
		});
	});

	describe("minus", () => {
		it("should subtract values", () => {
			expect(Uint8.minus(Uint8.from(100), Uint8.from(50))).toBe(50);
			expect(Uint8.minus(Uint8.from(255), Uint8.from(255))).toBe(0);
			expect(Uint8.minus(Uint8.from(10), Uint8.from(0))).toBe(10);
		});

		it("should throw on underflow", () => {
			expect(() => Uint8.minus(Uint8.from(50), Uint8.from(100))).toThrow(
				"underflow",
			);
			expect(() => Uint8.minus(Uint8.from(0), Uint8.from(1))).toThrow(
				"underflow",
			);
		});
	});

	describe("times", () => {
		it("should multiply values", () => {
			expect(Uint8.times(Uint8.from(10), Uint8.from(20))).toBe(200);
			expect(Uint8.times(Uint8.from(15), Uint8.from(17))).toBe(255);
			expect(Uint8.times(Uint8.from(0), Uint8.from(100))).toBe(0);
		});

		it("should throw on overflow", () => {
			expect(() => Uint8.times(Uint8.from(16), Uint8.from(16))).toThrow(
				"overflow",
			);
			expect(() => Uint8.times(Uint8.from(100), Uint8.from(3))).toThrow(
				"overflow",
			);
		});
	});

	describe("dividedBy", () => {
		it("should divide values", () => {
			expect(Uint8.dividedBy(Uint8.from(100), Uint8.from(5))).toBe(20);
			expect(Uint8.dividedBy(Uint8.from(255), Uint8.from(255))).toBe(1);
			expect(Uint8.dividedBy(Uint8.from(0), Uint8.from(10))).toBe(0);
		});

		it("should perform integer division", () => {
			expect(Uint8.dividedBy(Uint8.from(7), Uint8.from(2))).toBe(3);
			expect(Uint8.dividedBy(Uint8.from(10), Uint8.from(3))).toBe(3);
		});

		it("should throw on division by zero", () => {
			expect(() => Uint8.dividedBy(Uint8.from(10), Uint8.from(0))).toThrow(
				"Division by zero",
			);
		});
	});

	describe("modulo", () => {
		it("should compute modulo", () => {
			expect(Uint8.modulo(Uint8.from(10), Uint8.from(3))).toBe(1);
			expect(Uint8.modulo(Uint8.from(100), Uint8.from(7))).toBe(2);
			expect(Uint8.modulo(Uint8.from(255), Uint8.from(256))).toBe(255);
		});

		it("should throw on division by zero", () => {
			expect(() => Uint8.modulo(Uint8.from(10), Uint8.from(0))).toThrow(
				"Division by zero",
			);
		});
	});

	describe("equals", () => {
		it("should return true for equal values", () => {
			expect(Uint8.equals(Uint8.from(100), Uint8.from(100))).toBe(true);
			expect(Uint8.equals(Uint8.from(0), Uint8.from(0))).toBe(true);
			expect(Uint8.equals(Uint8.from(255), Uint8.from(255))).toBe(true);
		});

		it("should return false for different values", () => {
			expect(Uint8.equals(Uint8.from(100), Uint8.from(101))).toBe(false);
			expect(Uint8.equals(Uint8.from(0), Uint8.from(255))).toBe(false);
		});
	});

	describe("lessThan", () => {
		it("should compare values", () => {
			expect(Uint8.lessThan(Uint8.from(50), Uint8.from(100))).toBe(true);
			expect(Uint8.lessThan(Uint8.from(0), Uint8.from(1))).toBe(true);
			expect(Uint8.lessThan(Uint8.from(100), Uint8.from(50))).toBe(false);
			expect(Uint8.lessThan(Uint8.from(100), Uint8.from(100))).toBe(false);
		});
	});

	describe("greaterThan", () => {
		it("should compare values", () => {
			expect(Uint8.greaterThan(Uint8.from(100), Uint8.from(50))).toBe(true);
			expect(Uint8.greaterThan(Uint8.from(255), Uint8.from(0))).toBe(true);
			expect(Uint8.greaterThan(Uint8.from(50), Uint8.from(100))).toBe(false);
			expect(Uint8.greaterThan(Uint8.from(100), Uint8.from(100))).toBe(false);
		});
	});

	describe("isZero", () => {
		it("should detect zero", () => {
			expect(Uint8.isZero(Uint8.from(0))).toBe(true);
			expect(Uint8.isZero(Uint8.ZERO)).toBe(true);
		});

		it("should return false for non-zero", () => {
			expect(Uint8.isZero(Uint8.from(1))).toBe(false);
			expect(Uint8.isZero(Uint8.from(255))).toBe(false);
		});
	});

	describe("minimum", () => {
		it("should return minimum value", () => {
			expect(Uint8.minimum(Uint8.from(100), Uint8.from(50))).toBe(50);
			expect(Uint8.minimum(Uint8.from(0), Uint8.from(255))).toBe(0);
			expect(Uint8.minimum(Uint8.from(100), Uint8.from(100))).toBe(100);
		});
	});

	describe("maximum", () => {
		it("should return maximum value", () => {
			expect(Uint8.maximum(Uint8.from(100), Uint8.from(50))).toBe(100);
			expect(Uint8.maximum(Uint8.from(0), Uint8.from(255))).toBe(255);
			expect(Uint8.maximum(Uint8.from(100), Uint8.from(100))).toBe(100);
		});
	});

	describe("bitwiseAnd", () => {
		it("should perform bitwise AND", () => {
			expect(
				Uint8.bitwiseAnd(Uint8.from(0b11110000), Uint8.from(0b11001100)),
			).toBe(0b11000000);
			expect(Uint8.bitwiseAnd(Uint8.from(255), Uint8.from(0))).toBe(0);
			expect(Uint8.bitwiseAnd(Uint8.from(255), Uint8.from(255))).toBe(255);
		});
	});

	describe("bitwiseOr", () => {
		it("should perform bitwise OR", () => {
			expect(
				Uint8.bitwiseOr(Uint8.from(0b11110000), Uint8.from(0b00001111)),
			).toBe(0b11111111);
			expect(Uint8.bitwiseOr(Uint8.from(0), Uint8.from(0))).toBe(0);
			expect(Uint8.bitwiseOr(Uint8.from(240), Uint8.from(15))).toBe(255);
		});
	});

	describe("bitwiseXor", () => {
		it("should perform bitwise XOR", () => {
			expect(
				Uint8.bitwiseXor(Uint8.from(0b11110000), Uint8.from(0b11001100)),
			).toBe(0b00111100);
			expect(Uint8.bitwiseXor(Uint8.from(255), Uint8.from(255))).toBe(0);
			expect(Uint8.bitwiseXor(Uint8.from(255), Uint8.from(0))).toBe(255);
		});
	});

	describe("bitwiseNot", () => {
		it("should perform bitwise NOT", () => {
			expect(Uint8.bitwiseNot(Uint8.from(0b11110000))).toBe(0b00001111);
			expect(Uint8.bitwiseNot(Uint8.from(0))).toBe(255);
			expect(Uint8.bitwiseNot(Uint8.from(255))).toBe(0);
		});
	});

	describe("shiftLeft", () => {
		it("should shift left", () => {
			expect(Uint8.shiftLeft(Uint8.from(0b00001111), 4)).toBe(0b11110000);
			expect(Uint8.shiftLeft(Uint8.from(1), 7)).toBe(128);
			expect(Uint8.shiftLeft(Uint8.from(1), 0)).toBe(1);
		});

		it("should mask to 8 bits", () => {
			expect(Uint8.shiftLeft(Uint8.from(255), 1)).toBe(254);
			expect(Uint8.shiftLeft(Uint8.from(128), 1)).toBe(0);
		});
	});

	describe("shiftRight", () => {
		it("should shift right", () => {
			expect(Uint8.shiftRight(Uint8.from(0b11110000), 4)).toBe(0b00001111);
			expect(Uint8.shiftRight(Uint8.from(128), 7)).toBe(1);
			expect(Uint8.shiftRight(Uint8.from(255), 0)).toBe(255);
		});
	});

	describe("bitLength", () => {
		it("should compute bit length", () => {
			expect(Uint8.bitLength(Uint8.from(0))).toBe(0);
			expect(Uint8.bitLength(Uint8.from(1))).toBe(1);
			expect(Uint8.bitLength(Uint8.from(2))).toBe(2);
			expect(Uint8.bitLength(Uint8.from(3))).toBe(2);
			expect(Uint8.bitLength(Uint8.from(127))).toBe(7);
			expect(Uint8.bitLength(Uint8.from(128))).toBe(8);
			expect(Uint8.bitLength(Uint8.from(255))).toBe(8);
		});
	});

	describe("leadingZeros", () => {
		it("should count leading zeros", () => {
			expect(Uint8.leadingZeros(Uint8.from(0))).toBe(8);
			expect(Uint8.leadingZeros(Uint8.from(1))).toBe(7);
			expect(Uint8.leadingZeros(Uint8.from(2))).toBe(6);
			expect(Uint8.leadingZeros(Uint8.from(127))).toBe(1);
			expect(Uint8.leadingZeros(Uint8.from(128))).toBe(0);
			expect(Uint8.leadingZeros(Uint8.from(255))).toBe(0);
		});
	});

	describe("popCount", () => {
		it("should count set bits", () => {
			expect(Uint8.popCount(Uint8.from(0))).toBe(0);
			expect(Uint8.popCount(Uint8.from(1))).toBe(1);
			expect(Uint8.popCount(Uint8.from(255))).toBe(8);
			expect(Uint8.popCount(Uint8.from(0b10101010))).toBe(4);
			expect(Uint8.popCount(Uint8.from(0b11111111))).toBe(8);
		});
	});

	describe("isValid", () => {
		it("should validate valid values", () => {
			expect(Uint8.isValid(0)).toBe(true);
			expect(Uint8.isValid(100)).toBe(true);
			expect(Uint8.isValid(255)).toBe(true);
		});

		it("should reject invalid values", () => {
			expect(Uint8.isValid(256)).toBe(false);
			expect(Uint8.isValid(-1)).toBe(false);
			expect(Uint8.isValid(1.5)).toBe(false);
			expect(Uint8.isValid("100")).toBe(false);
			expect(Uint8.isValid(null)).toBe(false);
			expect(Uint8.isValid(undefined)).toBe(false);
		});
	});

	describe("boundary tests", () => {
		it("should handle minimum boundary", () => {
			const min = Uint8.from(0);
			expect(Uint8.toNumber(min)).toBe(0);
			expect(() => Uint8.minus(min, Uint8.from(1))).toThrow();
		});

		it("should handle maximum boundary", () => {
			const max = Uint8.from(255);
			expect(Uint8.toNumber(max)).toBe(255);
			expect(() => Uint8.plus(max, Uint8.from(1))).toThrow();
		});

		it("should handle overflow at boundary", () => {
			expect(() => Uint8.from(256)).toThrow();
			expect(() => Uint8.fromNumber(256)).toThrow();
			expect(() => Uint8.fromBigint(256n)).toThrow();
			expect(() => Uint8.fromHex("0x100")).toThrow();
		});
	});
});
