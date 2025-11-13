import { describe, expect, it } from "vitest";
import * as Int16 from "./index.ts";

describe("Int16", () => {
	describe("constructors", () => {
		it("creates from positive number", () => {
			const value = Int16.from(1000);
			expect(Int16.toNumber(value)).toBe(1000);
		});

		it("creates from negative number", () => {
			const value = Int16.from(-1000);
			expect(Int16.toNumber(value)).toBe(-1000);
		});

		it("creates from zero", () => {
			const value = Int16.from(0);
			expect(Int16.toNumber(value)).toBe(0);
		});

		it("creates from INT16_MIN (-32768)", () => {
			const value = Int16.from(-32768);
			expect(Int16.toNumber(value)).toBe(-32768);
		});

		it("creates from INT16_MAX (32767)", () => {
			const value = Int16.from(32767);
			expect(Int16.toNumber(value)).toBe(32767);
		});

		it("throws on value below INT16_MIN", () => {
			expect(() => Int16.from(-32769)).toThrow("out of range");
		});

		it("throws on value above INT16_MAX", () => {
			expect(() => Int16.from(32768)).toThrow("out of range");
		});

		it("throws on non-integer", () => {
			expect(() => Int16.from(42.5)).toThrow("must be an integer");
		});

		it("creates from bigint", () => {
			const value = Int16.fromBigint(-1000n);
			expect(Int16.toNumber(value)).toBe(-1000);
		});

		it("throws on bigint out of range", () => {
			expect(() => Int16.fromBigint(-40000n)).toThrow("out of range");
			expect(() => Int16.fromBigint(40000n)).toThrow("out of range");
		});
	});

	describe("two's complement conversions", () => {
		it("converts -1 to 0xFFFF", () => {
			const value = Int16.from(-1);
			expect(Int16.toHex(value)).toBe("0xffff");
		});

		it("converts -32768 to 0x8000", () => {
			const value = Int16.from(-32768);
			expect(Int16.toHex(value)).toBe("0x8000");
		});

		it("converts 32767 to 0x7FFF", () => {
			const value = Int16.from(32767);
			expect(Int16.toHex(value)).toBe("0x7fff");
		});

		it("converts 0x8000 to -32768", () => {
			const value = Int16.fromHex("0x8000");
			expect(Int16.toNumber(value)).toBe(-32768);
		});

		it("converts 0xFFFF to -1", () => {
			const value = Int16.fromHex("0xFFFF");
			expect(Int16.toNumber(value)).toBe(-1);
		});

		it("converts 0x7FFF to 32767", () => {
			const value = Int16.fromHex("0x7FFF");
			expect(Int16.toNumber(value)).toBe(32767);
		});

		it("converts bytes correctly (big-endian)", () => {
			const bytes = new Uint8Array([0x80, 0x00]);
			const value = Int16.fromBytes(bytes);
			expect(Int16.toNumber(value)).toBe(-32768);
		});

		it("converts to bytes correctly (big-endian)", () => {
			const value = Int16.from(-1);
			const bytes = Int16.toBytes(value);
			expect(bytes).toEqual(new Uint8Array([0xff, 0xff]));
		});

		it("converts 0x1234", () => {
			const value = Int16.fromHex("0x1234");
			expect(Int16.toNumber(value)).toBe(0x1234);
			const bytes = Int16.toBytes(value);
			expect(bytes).toEqual(new Uint8Array([0x12, 0x34]));
		});
	});

	describe("signed arithmetic", () => {
		it("adds positive numbers", () => {
			const result = Int16.plus(1000, 2000);
			expect(Int16.toNumber(result)).toBe(3000);
		});

		it("adds negative numbers", () => {
			const result = Int16.plus(-1000, -2000);
			expect(Int16.toNumber(result)).toBe(-3000);
		});

		it("adds mixed signs", () => {
			const result = Int16.plus(-500, 300);
			expect(Int16.toNumber(result)).toBe(-200);
		});

		it("throws on overflow", () => {
			expect(() => Int16.plus(20000, 15000)).toThrow("overflow");
		});

		it("throws on underflow", () => {
			expect(() => Int16.plus(-20000, -15000)).toThrow("overflow");
		});

		it("subtracts correctly", () => {
			const result = Int16.minus(1000, 2000);
			expect(Int16.toNumber(result)).toBe(-1000);
		});

		it("subtracts negative", () => {
			const result = Int16.minus(-1000, -500);
			expect(Int16.toNumber(result)).toBe(-500);
		});

		it("throws on subtraction overflow", () => {
			expect(() => Int16.minus(-20000, 15000)).toThrow("overflow");
		});

		it("multiplies positive", () => {
			const result = Int16.times(50, 100);
			expect(Int16.toNumber(result)).toBe(5000);
		});

		it("multiplies negative", () => {
			const result = Int16.times(-50, 100);
			expect(Int16.toNumber(result)).toBe(-5000);
		});

		it("multiplies two negatives", () => {
			const result = Int16.times(-50, -100);
			expect(Int16.toNumber(result)).toBe(5000);
		});

		it("throws on multiplication overflow", () => {
			expect(() => Int16.times(200, 200)).toThrow("overflow");
		});
	});

	describe("signed division (SDIV semantics)", () => {
		it("divides positive by positive", () => {
			const result = Int16.dividedBy(1000, 3);
			expect(Int16.toNumber(result)).toBe(333);
		});

		it("divides negative by positive (truncate toward zero)", () => {
			const result = Int16.dividedBy(-1000, 3);
			expect(Int16.toNumber(result)).toBe(-333);
		});

		it("divides positive by negative", () => {
			const result = Int16.dividedBy(1000, -3);
			expect(Int16.toNumber(result)).toBe(-333);
		});

		it("divides negative by negative", () => {
			const result = Int16.dividedBy(-1000, -3);
			expect(Int16.toNumber(result)).toBe(333);
		});

		it("throws on division by zero", () => {
			expect(() => Int16.dividedBy(1000, 0)).toThrow("division by zero");
		});

		it("throws on INT16_MIN / -1 overflow", () => {
			expect(() => Int16.dividedBy(-32768, -1)).toThrow("overflow");
		});
	});

	describe("signed modulo (SMOD semantics)", () => {
		it("modulo positive numbers", () => {
			const result = Int16.modulo(1000, 3);
			expect(Int16.toNumber(result)).toBe(1);
		});

		it("modulo negative dividend (sign follows dividend)", () => {
			const result = Int16.modulo(-1000, 3);
			expect(Int16.toNumber(result)).toBe(-1);
		});

		it("modulo negative divisor", () => {
			const result = Int16.modulo(1000, -3);
			expect(Int16.toNumber(result)).toBe(1);
		});

		it("modulo both negative", () => {
			const result = Int16.modulo(-1000, -3);
			expect(Int16.toNumber(result)).toBe(-1);
		});

		it("throws on modulo by zero", () => {
			expect(() => Int16.modulo(1000, 0)).toThrow("modulo by zero");
		});
	});

	describe("abs and negate", () => {
		it("abs of positive", () => {
			const result = Int16.abs(1000);
			expect(Int16.toNumber(result)).toBe(1000);
		});

		it("abs of negative", () => {
			const result = Int16.abs(-1000);
			expect(Int16.toNumber(result)).toBe(1000);
		});

		it("abs of zero", () => {
			const result = Int16.abs(0);
			expect(Int16.toNumber(result)).toBe(0);
		});

		it("throws on abs(INT16_MIN) overflow", () => {
			expect(() => Int16.abs(-32768)).toThrow("overflow");
		});

		it("negate positive", () => {
			const result = Int16.negate(1000);
			expect(Int16.toNumber(result)).toBe(-1000);
		});

		it("negate negative", () => {
			const result = Int16.negate(-1000);
			expect(Int16.toNumber(result)).toBe(1000);
		});

		it("negate zero", () => {
			const result = Int16.negate(0);
			expect(Int16.toNumber(result)).toBe(0);
		});

		it("throws on negate(INT16_MIN) overflow", () => {
			expect(() => Int16.negate(-32768)).toThrow("overflow");
		});
	});

	describe("comparison", () => {
		it("equals same value", () => {
			expect(Int16.equals(-1000, -1000)).toBe(true);
		});

		it("equals different value", () => {
			expect(Int16.equals(-1000, 1000)).toBe(false);
		});

		it("lessThan negative and positive", () => {
			expect(Int16.lessThan(-1000, 1000)).toBe(true);
			expect(Int16.lessThan(1000, -1000)).toBe(false);
		});

		it("greaterThan", () => {
			expect(Int16.greaterThan(1000, -1000)).toBe(true);
			expect(Int16.greaterThan(-1000, 1000)).toBe(false);
		});

		it("isZero", () => {
			expect(Int16.isZero(0)).toBe(true);
			expect(Int16.isZero(1)).toBe(false);
			expect(Int16.isZero(-1)).toBe(false);
		});

		it("isNegative", () => {
			expect(Int16.isNegative(-1000)).toBe(true);
			expect(Int16.isNegative(0)).toBe(false);
			expect(Int16.isNegative(1000)).toBe(false);
		});

		it("isPositive", () => {
			expect(Int16.isPositive(1000)).toBe(true);
			expect(Int16.isPositive(0)).toBe(false);
			expect(Int16.isPositive(-1000)).toBe(false);
		});

		it("minimum", () => {
			const result = Int16.minimum(-1000, 500);
			expect(Int16.toNumber(result)).toBe(-1000);
		});

		it("maximum", () => {
			const result = Int16.maximum(-1000, 500);
			expect(Int16.toNumber(result)).toBe(500);
		});

		it("sign", () => {
			expect(Int16.sign(-1000)).toBe(-1);
			expect(Int16.sign(0)).toBe(0);
			expect(Int16.sign(1000)).toBe(1);
		});
	});

	describe("arithmetic right shift", () => {
		it("shifts positive right", () => {
			const result = Int16.shiftRight(1024, 1);
			expect(Int16.toNumber(result)).toBe(512);
		});

		it("shifts negative right (preserves sign)", () => {
			const result = Int16.shiftRight(-1024, 1);
			expect(Int16.toNumber(result)).toBe(-512);
		});

		it("shifts -1 right (all bits set)", () => {
			const result = Int16.shiftRight(-1, 1);
			expect(Int16.toNumber(result)).toBe(-1);
		});

		it("shifts -32768 right", () => {
			const result = Int16.shiftRight(-32768, 1);
			expect(Int16.toNumber(result)).toBe(-16384);
		});

		it("shifts by zero", () => {
			const result = Int16.shiftRight(-1024, 0);
			expect(Int16.toNumber(result)).toBe(-1024);
		});

		it("throws on invalid shift amount", () => {
			expect(() => Int16.shiftRight(1000, -1)).toThrow("out of range");
			expect(() => Int16.shiftRight(1000, 16)).toThrow("out of range");
		});
	});

	describe("left shift", () => {
		it("shifts left", () => {
			const result = Int16.shiftLeft(256, 1);
			expect(Int16.toNumber(result)).toBe(512);
		});

		it("shifts with wrapping", () => {
			const result = Int16.shiftLeft(16384, 1);
			expect(Int16.toNumber(result)).toBe(-32768);
		});

		it("throws on invalid shift", () => {
			expect(() => Int16.shiftLeft(1000, -1)).toThrow("out of range");
			expect(() => Int16.shiftLeft(1000, 16)).toThrow("out of range");
		});
	});

	describe("bitwise operations", () => {
		it("bitwise AND", () => {
			const result = Int16.and(0b0101010101010101, 0b0011001100110011);
			expect(Int16.toNumber(result)).toBe(0b0001000100010001);
		});

		it("bitwise AND with negative", () => {
			const result = Int16.and(-1, 0x0fff);
			expect(Int16.toNumber(result)).toBe(0x0fff);
		});

		it("bitwise OR", () => {
			const result = Int16.or(0b0101010101010101, 0b0011001100110011);
			expect(Int16.toNumber(result)).toBe(0b0111011101110111);
		});

		it("bitwise XOR", () => {
			const result = Int16.xor(0b0101010101010101, 0b0011001100110011);
			expect(Int16.toNumber(result)).toBe(0b0110011001100110);
		});

		it("bitwise NOT", () => {
			const result = Int16.not(0);
			expect(Int16.toNumber(result)).toBe(-1);
		});

		it("bitwise NOT of -1", () => {
			const result = Int16.not(-1);
			expect(Int16.toNumber(result)).toBe(0);
		});
	});

	describe("utilities", () => {
		it("bitLength of positive", () => {
			expect(Int16.bitLength(255)).toBe(8);
			expect(Int16.bitLength(256)).toBe(9);
		});

		it("bitLength of negative (uses absolute)", () => {
			expect(Int16.bitLength(-255)).toBe(8);
			expect(Int16.bitLength(-256)).toBe(9);
		});

		it("bitLength of zero", () => {
			expect(Int16.bitLength(0)).toBe(0);
		});

		it("leadingZeros", () => {
			expect(Int16.leadingZeros(0)).toBe(16);
			expect(Int16.leadingZeros(1)).toBe(15);
			expect(Int16.leadingZeros(32767)).toBe(1);
		});

		it("leadingZeros of negative (two's complement)", () => {
			expect(Int16.leadingZeros(-1)).toBe(0); // 0xFFFF
			expect(Int16.leadingZeros(-32768)).toBe(0); // 0x8000
		});

		it("popCount", () => {
			expect(Int16.popCount(0)).toBe(0);
			expect(Int16.popCount(7)).toBe(3); // 0b111
			expect(Int16.popCount(-1)).toBe(16); // all bits set
		});

		it("isValid", () => {
			expect(Int16.isValid(32767)).toBe(true);
			expect(Int16.isValid(-32768)).toBe(true);
			expect(Int16.isValid(0)).toBe(true);
			expect(Int16.isValid(32768)).toBe(false);
			expect(Int16.isValid(-32769)).toBe(false);
			expect(Int16.isValid(42.5)).toBe(false);
		});
	});

	describe("conversions", () => {
		it("toNumber", () => {
			expect(Int16.toNumber(-1000)).toBe(-1000);
		});

		it("toBigint", () => {
			expect(Int16.toBigint(-1000)).toBe(-1000n);
		});

		it("toString", () => {
			expect(Int16.toString(-1000)).toBe("-1000");
		});
	});

	describe("boundary tests", () => {
		it("handles INT16_MIN boundary", () => {
			const min = Int16.from(-32768);
			expect(Int16.toNumber(min)).toBe(-32768);
			expect(Int16.toHex(min)).toBe("0x8000");
			expect(() => Int16.minus(min, 1)).toThrow("overflow");
		});

		it("handles INT16_MAX boundary", () => {
			const max = Int16.from(32767);
			expect(Int16.toNumber(max)).toBe(32767);
			expect(Int16.toHex(max)).toBe("0x7fff");
			expect(() => Int16.plus(max, 1)).toThrow("overflow");
		});

		it("handles zero boundary", () => {
			const zero = Int16.from(0);
			expect(Int16.isZero(zero)).toBe(true);
			expect(Int16.isNegative(zero)).toBe(false);
			expect(Int16.isPositive(zero)).toBe(false);
		});
	});
});
