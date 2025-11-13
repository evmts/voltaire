import { describe, expect, it } from "vitest";
import * as Uint16 from "./index.js";

describe("Uint16", () => {
	describe("constants", () => {
		it("MIN should be 0", () => {
			expect(Uint16.MIN).toBe(0);
		});

		it("MAX should be 65535", () => {
			expect(Uint16.MAX).toBe(65535);
		});

		it("ZERO should be 0", () => {
			expect(Uint16.ZERO).toBe(0);
		});

		it("ONE should be 1", () => {
			expect(Uint16.ONE).toBe(1);
		});

		it("SIZE should be 16", () => {
			expect(Uint16.SIZE).toBe(16);
		});
	});

	describe("from", () => {
		it("should create from number", () => {
			expect(Uint16.from(0)).toBe(0);
			expect(Uint16.from(30000)).toBe(30000);
			expect(Uint16.from(65535)).toBe(65535);
		});

		it("should create from decimal string", () => {
			expect(Uint16.from("0")).toBe(0);
			expect(Uint16.from("30000")).toBe(30000);
			expect(Uint16.from("65535")).toBe(65535);
		});

		it("should create from hex string", () => {
			expect(Uint16.from("0x0000")).toBe(0);
			expect(Uint16.from("0x7530")).toBe(30000);
			expect(Uint16.from("0xffff")).toBe(65535);
			expect(Uint16.from("0xFFFF")).toBe(65535);
		});

		it("should throw on non-integer", () => {
			expect(() => Uint16.from(1.5)).toThrow("must be an integer");
		});

		it("should throw on negative", () => {
			expect(() => Uint16.from(-1)).toThrow("cannot be negative");
		});

		it("should throw on overflow", () => {
			expect(() => Uint16.from(65536)).toThrow("exceeds maximum");
			expect(() => Uint16.from(100000)).toThrow("exceeds maximum");
		});

		it("should throw on invalid string", () => {
			expect(() => Uint16.from("invalid")).toThrow("Invalid Uint16 string");
			expect(() => Uint16.from("0xgggg")).toThrow("Invalid Uint16 string");
		});
	});

	describe("fromNumber", () => {
		it("should create from valid numbers", () => {
			expect(Uint16.fromNumber(0)).toBe(0);
			expect(Uint16.fromNumber(32768)).toBe(32768);
			expect(Uint16.fromNumber(65535)).toBe(65535);
		});

		it("should throw on non-integer", () => {
			expect(() => Uint16.fromNumber(1.5)).toThrow("must be an integer");
		});

		it("should throw on negative", () => {
			expect(() => Uint16.fromNumber(-1)).toThrow("cannot be negative");
		});

		it("should throw on overflow", () => {
			expect(() => Uint16.fromNumber(65536)).toThrow("exceeds maximum");
		});
	});

	describe("fromBigint", () => {
		it("should create from valid bigints", () => {
			expect(Uint16.fromBigint(0n)).toBe(0);
			expect(Uint16.fromBigint(32768n)).toBe(32768);
			expect(Uint16.fromBigint(65535n)).toBe(65535);
		});

		it("should throw on negative", () => {
			expect(() => Uint16.fromBigint(-1n)).toThrow("cannot be negative");
		});

		it("should throw on overflow", () => {
			expect(() => Uint16.fromBigint(65536n)).toThrow("exceeds maximum");
		});
	});

	describe("fromHex", () => {
		it("should create from hex with 0x prefix", () => {
			expect(Uint16.fromHex("0x0000")).toBe(0);
			expect(Uint16.fromHex("0x8000")).toBe(32768);
			expect(Uint16.fromHex("0xffff")).toBe(65535);
		});

		it("should create from hex without prefix", () => {
			expect(Uint16.fromHex("0000")).toBe(0);
			expect(Uint16.fromHex("8000")).toBe(32768);
			expect(Uint16.fromHex("ffff")).toBe(65535);
		});

		it("should handle uppercase", () => {
			expect(Uint16.fromHex("0xFFFF")).toBe(65535);
			expect(Uint16.fromHex("FFFF")).toBe(65535);
		});

		it("should throw on invalid hex", () => {
			expect(() => Uint16.fromHex("0xgggg")).toThrow("Invalid hex string");
		});

		it("should throw on overflow", () => {
			expect(() => Uint16.fromHex("0x10000")).toThrow("exceeds maximum");
		});
	});

	describe("fromBytes", () => {
		it("should create from 2-byte Uint8Array", () => {
			expect(Uint16.fromBytes(new Uint8Array([0, 0]))).toBe(0);
			expect(Uint16.fromBytes(new Uint8Array([0x80, 0x00]))).toBe(32768);
			expect(Uint16.fromBytes(new Uint8Array([0xff, 0xff]))).toBe(65535);
			expect(Uint16.fromBytes(new Uint8Array([0x12, 0x34]))).toBe(4660);
		});

		it("should throw on wrong length", () => {
			expect(() => Uint16.fromBytes(new Uint8Array([]))).toThrow(
				"exactly 2 bytes",
			);
			expect(() => Uint16.fromBytes(new Uint8Array([1]))).toThrow(
				"exactly 2 bytes",
			);
			expect(() => Uint16.fromBytes(new Uint8Array([1, 2, 3]))).toThrow(
				"exactly 2 bytes",
			);
		});
	});

	describe("toNumber", () => {
		it("should convert to number", () => {
			expect(Uint16.toNumber(Uint16.from(0))).toBe(0);
			expect(Uint16.toNumber(Uint16.from(32768))).toBe(32768);
			expect(Uint16.toNumber(Uint16.from(65535))).toBe(65535);
		});
	});

	describe("toBigint", () => {
		it("should convert to bigint", () => {
			expect(Uint16.toBigint(Uint16.from(0))).toBe(0n);
			expect(Uint16.toBigint(Uint16.from(32768))).toBe(32768n);
			expect(Uint16.toBigint(Uint16.from(65535))).toBe(65535n);
		});
	});

	describe("toHex", () => {
		it("should convert to padded hex", () => {
			expect(Uint16.toHex(Uint16.from(0))).toBe("0x0000");
			expect(Uint16.toHex(Uint16.from(15))).toBe("0x000f");
			expect(Uint16.toHex(Uint16.from(65535))).toBe("0xffff");
		});

		it("should convert to unpadded hex", () => {
			expect(Uint16.toHex(Uint16.from(0), false)).toBe("0x0");
			expect(Uint16.toHex(Uint16.from(15), false)).toBe("0xf");
			expect(Uint16.toHex(Uint16.from(65535), false)).toBe("0xffff");
		});
	});

	describe("toBytes", () => {
		it("should convert to Uint8Array", () => {
			expect(Uint16.toBytes(Uint16.from(0))).toEqual(new Uint8Array([0, 0]));
			expect(Uint16.toBytes(Uint16.from(32768))).toEqual(
				new Uint8Array([0x80, 0x00]),
			);
			expect(Uint16.toBytes(Uint16.from(65535))).toEqual(
				new Uint8Array([0xff, 0xff]),
			);
			expect(Uint16.toBytes(Uint16.from(4660))).toEqual(
				new Uint8Array([0x12, 0x34]),
			);
		});
	});

	describe("toString", () => {
		it("should convert to decimal string", () => {
			expect(Uint16.toString(Uint16.from(0))).toBe("0");
			expect(Uint16.toString(Uint16.from(32768))).toBe("32768");
			expect(Uint16.toString(Uint16.from(65535))).toBe("65535");
		});
	});

	describe("conversion round-trips", () => {
		it("number round-trip", () => {
			const original = 32768;
			const uint = Uint16.fromNumber(original);
			expect(Uint16.toNumber(uint)).toBe(original);
		});

		it("bigint round-trip", () => {
			const original = 32768n;
			const uint = Uint16.fromBigint(original);
			expect(Uint16.toBigint(uint)).toBe(original);
		});

		it("hex round-trip", () => {
			const original = "0xffff";
			const uint = Uint16.fromHex(original);
			expect(Uint16.toHex(uint)).toBe("0xffff");
		});

		it("bytes round-trip", () => {
			const original = new Uint8Array([0x80, 0x00]);
			const uint = Uint16.fromBytes(original);
			expect(Uint16.toBytes(uint)).toEqual(original);
		});
	});

	describe("plus", () => {
		it("should add values", () => {
			expect(Uint16.plus(Uint16.from(1000), Uint16.from(2000))).toBe(3000);
			expect(Uint16.plus(Uint16.from(30000), Uint16.from(35535))).toBe(65535);
			expect(Uint16.plus(Uint16.from(0), Uint16.from(0))).toBe(0);
		});

		it("should throw on overflow", () => {
			expect(() => Uint16.plus(Uint16.from(40000), Uint16.from(30000))).toThrow(
				"overflow",
			);
			expect(() => Uint16.plus(Uint16.from(65535), Uint16.from(1))).toThrow(
				"overflow",
			);
		});
	});

	describe("minus", () => {
		it("should subtract values", () => {
			expect(Uint16.minus(Uint16.from(30000), Uint16.from(20000))).toBe(10000);
			expect(Uint16.minus(Uint16.from(65535), Uint16.from(65535))).toBe(0);
			expect(Uint16.minus(Uint16.from(10000), Uint16.from(0))).toBe(10000);
		});

		it("should throw on underflow", () => {
			expect(() =>
				Uint16.minus(Uint16.from(20000), Uint16.from(30000)),
			).toThrow("underflow");
			expect(() => Uint16.minus(Uint16.from(0), Uint16.from(1))).toThrow(
				"underflow",
			);
		});
	});

	describe("times", () => {
		it("should multiply values", () => {
			expect(Uint16.times(Uint16.from(100), Uint16.from(200))).toBe(20000);
			expect(Uint16.times(Uint16.from(255), Uint16.from(257))).toBe(65535);
			expect(Uint16.times(Uint16.from(0), Uint16.from(1000))).toBe(0);
		});

		it("should throw on overflow", () => {
			expect(() => Uint16.times(Uint16.from(256), Uint16.from(256))).toThrow(
				"overflow",
			);
			expect(() => Uint16.times(Uint16.from(1000), Uint16.from(100))).toThrow(
				"overflow",
			);
		});
	});

	describe("dividedBy", () => {
		it("should divide values", () => {
			expect(Uint16.dividedBy(Uint16.from(10000), Uint16.from(100))).toBe(100);
			expect(Uint16.dividedBy(Uint16.from(65535), Uint16.from(65535))).toBe(1);
			expect(Uint16.dividedBy(Uint16.from(0), Uint16.from(100))).toBe(0);
		});

		it("should perform integer division", () => {
			expect(Uint16.dividedBy(Uint16.from(7), Uint16.from(2))).toBe(3);
			expect(Uint16.dividedBy(Uint16.from(100), Uint16.from(3))).toBe(33);
		});

		it("should throw on division by zero", () => {
			expect(() => Uint16.dividedBy(Uint16.from(100), Uint16.from(0))).toThrow(
				"Division by zero",
			);
		});
	});

	describe("modulo", () => {
		it("should compute modulo", () => {
			expect(Uint16.modulo(Uint16.from(10), Uint16.from(3))).toBe(1);
			expect(Uint16.modulo(Uint16.from(10007), Uint16.from(1000))).toBe(7);
			expect(Uint16.modulo(Uint16.from(65535), Uint16.from(10000))).toBe(5535);
		});

		it("should throw on division by zero", () => {
			expect(() => Uint16.modulo(Uint16.from(100), Uint16.from(0))).toThrow(
				"Division by zero",
			);
		});
	});

	describe("equals", () => {
		it("should return true for equal values", () => {
			expect(Uint16.equals(Uint16.from(30000), Uint16.from(30000))).toBe(true);
			expect(Uint16.equals(Uint16.from(0), Uint16.from(0))).toBe(true);
			expect(Uint16.equals(Uint16.from(65535), Uint16.from(65535))).toBe(true);
		});

		it("should return false for different values", () => {
			expect(Uint16.equals(Uint16.from(30000), Uint16.from(30001))).toBe(false);
			expect(Uint16.equals(Uint16.from(0), Uint16.from(65535))).toBe(false);
		});
	});

	describe("lessThan", () => {
		it("should compare values", () => {
			expect(Uint16.lessThan(Uint16.from(10000), Uint16.from(30000))).toBe(
				true,
			);
			expect(Uint16.lessThan(Uint16.from(0), Uint16.from(1))).toBe(true);
			expect(Uint16.lessThan(Uint16.from(30000), Uint16.from(10000))).toBe(
				false,
			);
			expect(Uint16.lessThan(Uint16.from(30000), Uint16.from(30000))).toBe(
				false,
			);
		});
	});

	describe("greaterThan", () => {
		it("should compare values", () => {
			expect(Uint16.greaterThan(Uint16.from(30000), Uint16.from(10000))).toBe(
				true,
			);
			expect(Uint16.greaterThan(Uint16.from(65535), Uint16.from(0))).toBe(true);
			expect(Uint16.greaterThan(Uint16.from(10000), Uint16.from(30000))).toBe(
				false,
			);
			expect(Uint16.greaterThan(Uint16.from(30000), Uint16.from(30000))).toBe(
				false,
			);
		});
	});

	describe("isZero", () => {
		it("should detect zero", () => {
			expect(Uint16.isZero(Uint16.from(0))).toBe(true);
			expect(Uint16.isZero(Uint16.ZERO)).toBe(true);
		});

		it("should return false for non-zero", () => {
			expect(Uint16.isZero(Uint16.from(1))).toBe(false);
			expect(Uint16.isZero(Uint16.from(65535))).toBe(false);
		});
	});

	describe("minimum", () => {
		it("should return minimum value", () => {
			expect(Uint16.minimum(Uint16.from(30000), Uint16.from(10000))).toBe(
				10000,
			);
			expect(Uint16.minimum(Uint16.from(0), Uint16.from(65535))).toBe(0);
			expect(Uint16.minimum(Uint16.from(30000), Uint16.from(30000))).toBe(
				30000,
			);
		});
	});

	describe("maximum", () => {
		it("should return maximum value", () => {
			expect(Uint16.maximum(Uint16.from(30000), Uint16.from(10000))).toBe(
				30000,
			);
			expect(Uint16.maximum(Uint16.from(0), Uint16.from(65535))).toBe(65535);
			expect(Uint16.maximum(Uint16.from(30000), Uint16.from(30000))).toBe(
				30000,
			);
		});
	});

	describe("bitwiseAnd", () => {
		it("should perform bitwise AND", () => {
			expect(
				Uint16.bitwiseAnd(
					Uint16.from(0b1111111100000000),
					Uint16.from(0b1111000011110000),
				),
			).toBe(0b1111000000000000);
			expect(Uint16.bitwiseAnd(Uint16.from(65535), Uint16.from(0))).toBe(0);
			expect(Uint16.bitwiseAnd(Uint16.from(65535), Uint16.from(65535))).toBe(
				65535,
			);
		});
	});

	describe("bitwiseOr", () => {
		it("should perform bitwise OR", () => {
			expect(
				Uint16.bitwiseOr(
					Uint16.from(0b1111111100000000),
					Uint16.from(0b0000000011111111),
				),
			).toBe(0b1111111111111111);
			expect(Uint16.bitwiseOr(Uint16.from(0), Uint16.from(0))).toBe(0);
			expect(Uint16.bitwiseOr(Uint16.from(65280), Uint16.from(255))).toBe(
				65535,
			);
		});
	});

	describe("bitwiseXor", () => {
		it("should perform bitwise XOR", () => {
			expect(
				Uint16.bitwiseXor(
					Uint16.from(0b1111111100000000),
					Uint16.from(0b1111000011110000),
				),
			).toBe(0b0000111111110000);
			expect(Uint16.bitwiseXor(Uint16.from(65535), Uint16.from(65535))).toBe(0);
			expect(Uint16.bitwiseXor(Uint16.from(65535), Uint16.from(0))).toBe(65535);
		});
	});

	describe("bitwiseNot", () => {
		it("should perform bitwise NOT", () => {
			expect(Uint16.bitwiseNot(Uint16.from(0b1111111100000000))).toBe(
				0b0000000011111111,
			);
			expect(Uint16.bitwiseNot(Uint16.from(0))).toBe(65535);
			expect(Uint16.bitwiseNot(Uint16.from(65535))).toBe(0);
		});
	});

	describe("shiftLeft", () => {
		it("should shift left", () => {
			expect(Uint16.shiftLeft(Uint16.from(0b0000000011111111), 8)).toBe(
				0b1111111100000000,
			);
			expect(Uint16.shiftLeft(Uint16.from(1), 15)).toBe(32768);
			expect(Uint16.shiftLeft(Uint16.from(1), 0)).toBe(1);
		});

		it("should mask to 16 bits", () => {
			expect(Uint16.shiftLeft(Uint16.from(65535), 1)).toBe(65534);
			expect(Uint16.shiftLeft(Uint16.from(32768), 1)).toBe(0);
		});
	});

	describe("shiftRight", () => {
		it("should shift right", () => {
			expect(Uint16.shiftRight(Uint16.from(0b1111111100000000), 8)).toBe(
				0b0000000011111111,
			);
			expect(Uint16.shiftRight(Uint16.from(32768), 15)).toBe(1);
			expect(Uint16.shiftRight(Uint16.from(65535), 0)).toBe(65535);
		});
	});

	describe("bitLength", () => {
		it("should compute bit length", () => {
			expect(Uint16.bitLength(Uint16.from(0))).toBe(0);
			expect(Uint16.bitLength(Uint16.from(1))).toBe(1);
			expect(Uint16.bitLength(Uint16.from(2))).toBe(2);
			expect(Uint16.bitLength(Uint16.from(3))).toBe(2);
			expect(Uint16.bitLength(Uint16.from(32767))).toBe(15);
			expect(Uint16.bitLength(Uint16.from(32768))).toBe(16);
			expect(Uint16.bitLength(Uint16.from(65535))).toBe(16);
		});
	});

	describe("leadingZeros", () => {
		it("should count leading zeros", () => {
			expect(Uint16.leadingZeros(Uint16.from(0))).toBe(16);
			expect(Uint16.leadingZeros(Uint16.from(1))).toBe(15);
			expect(Uint16.leadingZeros(Uint16.from(2))).toBe(14);
			expect(Uint16.leadingZeros(Uint16.from(32767))).toBe(1);
			expect(Uint16.leadingZeros(Uint16.from(32768))).toBe(0);
			expect(Uint16.leadingZeros(Uint16.from(65535))).toBe(0);
		});
	});

	describe("popCount", () => {
		it("should count set bits", () => {
			expect(Uint16.popCount(Uint16.from(0))).toBe(0);
			expect(Uint16.popCount(Uint16.from(1))).toBe(1);
			expect(Uint16.popCount(Uint16.from(65535))).toBe(16);
			expect(Uint16.popCount(Uint16.from(0b1010101010101010))).toBe(8);
			expect(Uint16.popCount(Uint16.from(0b1111111111111111))).toBe(16);
		});
	});

	describe("isValid", () => {
		it("should validate valid values", () => {
			expect(Uint16.isValid(0)).toBe(true);
			expect(Uint16.isValid(30000)).toBe(true);
			expect(Uint16.isValid(65535)).toBe(true);
		});

		it("should reject invalid values", () => {
			expect(Uint16.isValid(65536)).toBe(false);
			expect(Uint16.isValid(-1)).toBe(false);
			expect(Uint16.isValid(1.5)).toBe(false);
			expect(Uint16.isValid("30000")).toBe(false);
			expect(Uint16.isValid(null)).toBe(false);
			expect(Uint16.isValid(undefined)).toBe(false);
		});
	});

	describe("boundary tests", () => {
		it("should handle minimum boundary", () => {
			const min = Uint16.from(0);
			expect(Uint16.toNumber(min)).toBe(0);
			expect(() => Uint16.minus(min, Uint16.from(1))).toThrow();
		});

		it("should handle maximum boundary", () => {
			const max = Uint16.from(65535);
			expect(Uint16.toNumber(max)).toBe(65535);
			expect(() => Uint16.plus(max, Uint16.from(1))).toThrow();
		});

		it("should handle overflow at boundary", () => {
			expect(() => Uint16.from(65536)).toThrow();
			expect(() => Uint16.fromNumber(65536)).toThrow();
			expect(() => Uint16.fromBigint(65536n)).toThrow();
			expect(() => Uint16.fromHex("0x10000")).toThrow();
		});
	});
});
