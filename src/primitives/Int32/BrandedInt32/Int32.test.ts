import { describe, expect, it } from "vitest";
import * as Int32 from "./index.js";

describe("Int32", () => {
	describe("constants", () => {
		it("should have correct MIN value", () => {
			expect(Int32.MIN).toBe(-2147483648);
		});

		it("should have correct MAX value", () => {
			expect(Int32.MAX).toBe(2147483647);
		});

		it("should have ZERO", () => {
			expect(Int32.ZERO).toBe(0);
		});

		it("should have ONE", () => {
			expect(Int32.ONE).toBe(1);
		});

		it("should have MINUS_ONE", () => {
			expect(Int32.MINUS_ONE).toBe(-1);
		});

		it("should have SIZE", () => {
			expect(Int32.SIZE).toBe(4);
		});
	});

	describe("from", () => {
		it("should create from positive number", () => {
			const val = Int32.from(42);
			expect(val).toBe(42);
		});

		it("should create from negative number", () => {
			const val = Int32.from(-42);
			expect(val).toBe(-42);
		});

		it("should create from zero", () => {
			const val = Int32.from(0);
			expect(val).toBe(0);
		});

		it("should create from MIN", () => {
			const val = Int32.from(-2147483648);
			expect(val).toBe(-2147483648);
		});

		it("should create from MAX", () => {
			const val = Int32.from(2147483647);
			expect(val).toBe(2147483647);
		});

		it("should create from bigint", () => {
			const val = Int32.from(42n);
			expect(val).toBe(42);
		});

		it("should create from negative bigint", () => {
			const val = Int32.from(-42n);
			expect(val).toBe(-42);
		});

		it("should create from string", () => {
			const val = Int32.from("42");
			expect(val).toBe(42);
		});

		it("should create from negative string", () => {
			const val = Int32.from("-42");
			expect(val).toBe(-42);
		});

		it("should throw on overflow", () => {
			expect(() => Int32.from(2147483648n)).toThrow("out of range");
		});

		it("should throw on underflow", () => {
			expect(() => Int32.from(-2147483649n)).toThrow("out of range");
		});

		it("should throw on invalid string", () => {
			expect(() => Int32.from("not a number")).toThrow();
		});
	});

	describe("fromNumber", () => {
		it("should create from number", () => {
			expect(Int32.fromNumber(42)).toBe(42);
		});

		it("should create from negative", () => {
			expect(Int32.fromNumber(-42)).toBe(-42);
		});

		it("should truncate to 32-bit", () => {
			expect(Int32.fromNumber(2147483647.5)).toBe(2147483647);
		});

		it("should throw on NaN", () => {
			expect(() => Int32.fromNumber(Number.NaN)).toThrow("NaN");
		});
	});

	describe("fromBigInt", () => {
		it("should create from bigint", () => {
			expect(Int32.fromBigInt(42n)).toBe(42);
		});

		it("should create from negative bigint", () => {
			expect(Int32.fromBigInt(-42n)).toBe(-42);
		});

		it("should create from MIN", () => {
			expect(Int32.fromBigInt(-2147483648n)).toBe(-2147483648);
		});

		it("should create from MAX", () => {
			expect(Int32.fromBigInt(2147483647n)).toBe(2147483647);
		});

		it("should throw on overflow", () => {
			expect(() => Int32.fromBigInt(2147483648n)).toThrow("out of range");
		});

		it("should throw on underflow", () => {
			expect(() => Int32.fromBigInt(-2147483649n)).toThrow("out of range");
		});
	});

	describe("fromBytes", () => {
		it("should create from single byte positive", () => {
			const bytes = new Uint8Array([0x7f]);
			expect(Int32.fromBytes(bytes)).toBe(127);
		});

		it("should create from single byte negative", () => {
			const bytes = new Uint8Array([0xff]);
			expect(Int32.fromBytes(bytes)).toBe(-1);
		});

		it("should create from 4 bytes positive", () => {
			const bytes = new Uint8Array([0x00, 0x00, 0x00, 0x2a]);
			expect(Int32.fromBytes(bytes)).toBe(42);
		});

		it("should create from 4 bytes negative", () => {
			const bytes = new Uint8Array([0xff, 0xff, 0xff, 0xff]);
			expect(Int32.fromBytes(bytes)).toBe(-1);
		});

		it("should create MIN from bytes", () => {
			const bytes = new Uint8Array([0x80, 0x00, 0x00, 0x00]);
			expect(Int32.fromBytes(bytes)).toBe(-2147483648);
		});

		it("should create MAX from bytes", () => {
			const bytes = new Uint8Array([0x7f, 0xff, 0xff, 0xff]);
			expect(Int32.fromBytes(bytes)).toBe(2147483647);
		});

		it("should throw if bytes exceed 4", () => {
			const bytes = new Uint8Array(5);
			expect(() => Int32.fromBytes(bytes)).toThrow("cannot exceed 4 bytes");
		});
	});

	describe("fromHex", () => {
		it("should create from hex with prefix", () => {
			expect(Int32.fromHex("0x2a")).toBe(42);
		});

		it("should create from hex without prefix", () => {
			expect(Int32.fromHex("2a")).toBe(42);
		});

		it("should create negative from hex", () => {
			expect(Int32.fromHex("0xffffffff")).toBe(-1);
		});

		it("should create MIN from hex", () => {
			expect(Int32.fromHex("0x80000000")).toBe(-2147483648);
		});

		it("should create MAX from hex", () => {
			expect(Int32.fromHex("0x7fffffff")).toBe(2147483647);
		});

		it("should throw if hex exceeds 8 chars", () => {
			expect(() => Int32.fromHex("0x123456789")).toThrow(
				"cannot exceed 8 characters",
			);
		});

		it("should throw on invalid hex", () => {
			expect(() => Int32.fromHex("0xgg")).toThrow("Invalid hex");
		});
	});

	describe("toNumber", () => {
		it("should convert to number", () => {
			const val = Int32.from(42);
			expect(Int32.toNumber(val)).toBe(42);
		});

		it("should convert negative to number", () => {
			const val = Int32.from(-42);
			expect(Int32.toNumber(val)).toBe(-42);
		});
	});

	describe("toBigInt", () => {
		it("should convert to bigint", () => {
			const val = Int32.from(42);
			expect(Int32.toBigInt(val)).toBe(42n);
		});

		it("should convert negative to bigint", () => {
			const val = Int32.from(-42);
			expect(Int32.toBigInt(val)).toBe(-42n);
		});
	});

	describe("toBytes", () => {
		it("should convert positive to bytes", () => {
			const val = Int32.from(42);
			const bytes = Int32.toBytes(val);
			expect(bytes).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x2a]));
		});

		it("should convert negative to bytes (two's complement)", () => {
			const val = Int32.from(-1);
			const bytes = Int32.toBytes(val);
			expect(bytes).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
		});

		it("should convert MIN to bytes", () => {
			const val = Int32.from(-2147483648);
			const bytes = Int32.toBytes(val);
			expect(bytes).toEqual(new Uint8Array([0x80, 0x00, 0x00, 0x00]));
		});

		it("should convert MAX to bytes", () => {
			const val = Int32.from(2147483647);
			const bytes = Int32.toBytes(val);
			expect(bytes).toEqual(new Uint8Array([0x7f, 0xff, 0xff, 0xff]));
		});

		it("should always return 4 bytes", () => {
			const bytes = Int32.toBytes(Int32.from(0));
			expect(bytes.length).toBe(4);
		});
	});

	describe("toHex", () => {
		it("should convert positive to hex", () => {
			const val = Int32.from(42);
			expect(Int32.toHex(val)).toBe("0x0000002a");
		});

		it("should convert negative to hex (two's complement)", () => {
			const val = Int32.from(-1);
			expect(Int32.toHex(val)).toBe("0xffffffff");
		});

		it("should convert MIN to hex", () => {
			const val = Int32.from(-2147483648);
			expect(Int32.toHex(val)).toBe("0x80000000");
		});

		it("should convert MAX to hex", () => {
			const val = Int32.from(2147483647);
			expect(Int32.toHex(val)).toBe("0x7fffffff");
		});
	});

	describe("toString", () => {
		it("should convert to string", () => {
			expect(Int32.toString(Int32.from(42))).toBe("42");
		});

		it("should convert negative to string", () => {
			expect(Int32.toString(Int32.from(-42))).toBe("-42");
		});
	});

	describe("plus", () => {
		it("should add positive numbers", () => {
			const a = Int32.from(10);
			const b = Int32.from(20);
			expect(Int32.plus(a, b)).toBe(30);
		});

		it("should add negative numbers", () => {
			const a = Int32.from(-10);
			const b = Int32.from(-20);
			expect(Int32.plus(a, b)).toBe(-30);
		});

		it("should add mixed signs", () => {
			const a = Int32.from(50);
			const b = Int32.from(-20);
			expect(Int32.plus(a, b)).toBe(30);
		});

		it("should throw on positive overflow", () => {
			const a = Int32.from(2147483647);
			const b = Int32.from(1);
			expect(() => Int32.plus(a, b)).toThrow("overflow");
		});

		it("should throw on negative overflow", () => {
			const a = Int32.from(-2147483648);
			const b = Int32.from(-1);
			expect(() => Int32.plus(a, b)).toThrow("overflow");
		});
	});

	describe("minus", () => {
		it("should subtract positive numbers", () => {
			const a = Int32.from(50);
			const b = Int32.from(20);
			expect(Int32.minus(a, b)).toBe(30);
		});

		it("should subtract negative numbers", () => {
			const a = Int32.from(-50);
			const b = Int32.from(-20);
			expect(Int32.minus(a, b)).toBe(-30);
		});

		it("should subtract mixed signs", () => {
			const a = Int32.from(50);
			const b = Int32.from(-20);
			expect(Int32.minus(a, b)).toBe(70);
		});

		it("should throw on overflow", () => {
			const a = Int32.from(2147483647);
			const b = Int32.from(-1);
			expect(() => Int32.minus(a, b)).toThrow("overflow");
		});

		it("should throw on underflow", () => {
			const a = Int32.from(-2147483648);
			const b = Int32.from(1);
			expect(() => Int32.minus(a, b)).toThrow("overflow");
		});
	});

	describe("times", () => {
		it("should multiply positive numbers", () => {
			const a = Int32.from(6);
			const b = Int32.from(7);
			expect(Int32.times(a, b)).toBe(42);
		});

		it("should multiply negative numbers", () => {
			const a = Int32.from(-6);
			const b = Int32.from(-7);
			expect(Int32.times(a, b)).toBe(42);
		});

		it("should multiply mixed signs", () => {
			const a = Int32.from(-6);
			const b = Int32.from(7);
			expect(Int32.times(a, b)).toBe(-42);
		});

		it("should multiply by zero", () => {
			const a = Int32.from(42);
			const b = Int32.from(0);
			expect(Int32.times(a, b)).toBe(0);
		});

		it("should throw on overflow", () => {
			const a = Int32.from(2147483647);
			const b = Int32.from(2);
			expect(() => Int32.times(a, b)).toThrow("overflow");
		});
	});

	describe("dividedBy", () => {
		it("should divide positive numbers", () => {
			const a = Int32.from(42);
			const b = Int32.from(6);
			expect(Int32.dividedBy(a, b)).toBe(7);
		});

		it("should divide negative numbers", () => {
			const a = Int32.from(-42);
			const b = Int32.from(-6);
			expect(Int32.dividedBy(a, b)).toBe(7);
		});

		it("should divide mixed signs", () => {
			const a = Int32.from(-42);
			const b = Int32.from(6);
			expect(Int32.dividedBy(a, b)).toBe(-7);
		});

		it("should truncate toward zero", () => {
			const a = Int32.from(7);
			const b = Int32.from(2);
			expect(Int32.dividedBy(a, b)).toBe(3);
		});

		it("should truncate toward zero for negative", () => {
			const a = Int32.from(-7);
			const b = Int32.from(2);
			expect(Int32.dividedBy(a, b)).toBe(-3);
		});

		it("should throw on division by zero", () => {
			const a = Int32.from(42);
			const b = Int32.from(0);
			expect(() => Int32.dividedBy(a, b)).toThrow("Division by zero");
		});

		it("should throw on MIN / -1 overflow", () => {
			const a = Int32.from(-2147483648);
			const b = Int32.from(-1);
			expect(() => Int32.dividedBy(a, b)).toThrow("overflow");
		});
	});

	describe("modulo", () => {
		it("should compute modulo of positive numbers", () => {
			const a = Int32.from(42);
			const b = Int32.from(10);
			expect(Int32.modulo(a, b)).toBe(2);
		});

		it("should compute modulo with negative dividend", () => {
			const a = Int32.from(-42);
			const b = Int32.from(10);
			expect(Int32.modulo(a, b)).toBe(-2);
		});

		it("should throw on modulo by zero", () => {
			const a = Int32.from(42);
			const b = Int32.from(0);
			expect(() => Int32.modulo(a, b)).toThrow("Modulo by zero");
		});
	});

	describe("abs", () => {
		it("should return positive value unchanged", () => {
			expect(Int32.abs(Int32.from(42))).toBe(42);
		});

		it("should return absolute of negative", () => {
			expect(Int32.abs(Int32.from(-42))).toBe(42);
		});

		it("should return zero unchanged", () => {
			expect(Int32.abs(Int32.from(0))).toBe(0);
		});

		it("should throw on MIN", () => {
			expect(() => Int32.abs(Int32.from(-2147483648))).toThrow(
				"Cannot get absolute value",
			);
		});
	});

	describe("negate", () => {
		it("should negate positive", () => {
			expect(Int32.negate(Int32.from(42))).toBe(-42);
		});

		it("should negate negative", () => {
			expect(Int32.negate(Int32.from(-42))).toBe(42);
		});

		it("should negate zero", () => {
			const result = Int32.negate(Int32.from(0));
			expect(result === 0 || result === -0).toBe(true);
		});

		it("should throw on MIN", () => {
			expect(() => Int32.negate(Int32.from(-2147483648))).toThrow(
				"Cannot negate",
			);
		});
	});

	describe("sign", () => {
		it("should return 1 for positive", () => {
			expect(Int32.sign(Int32.from(42))).toBe(1);
		});

		it("should return -1 for negative", () => {
			expect(Int32.sign(Int32.from(-42))).toBe(-1);
		});

		it("should return 0 for zero", () => {
			expect(Int32.sign(Int32.from(0))).toBe(0);
		});
	});

	describe("isNegative", () => {
		it("should return false for positive", () => {
			expect(Int32.isNegative(Int32.from(42))).toBe(false);
		});

		it("should return true for negative", () => {
			expect(Int32.isNegative(Int32.from(-42))).toBe(true);
		});

		it("should return false for zero", () => {
			expect(Int32.isNegative(Int32.from(0))).toBe(false);
		});
	});

	describe("isPositive", () => {
		it("should return true for positive", () => {
			expect(Int32.isPositive(Int32.from(42))).toBe(true);
		});

		it("should return false for negative", () => {
			expect(Int32.isPositive(Int32.from(-42))).toBe(false);
		});

		it("should return false for zero", () => {
			expect(Int32.isPositive(Int32.from(0))).toBe(false);
		});
	});

	describe("equals", () => {
		it("should return true for equal values", () => {
			const a = Int32.from(42);
			const b = Int32.from(42);
			expect(Int32.equals(a, b)).toBe(true);
		});

		it("should return false for different values", () => {
			const a = Int32.from(42);
			const b = Int32.from(43);
			expect(Int32.equals(a, b)).toBe(false);
		});
	});

	describe("lessThan", () => {
		it("should return true when first is less", () => {
			expect(Int32.lessThan(Int32.from(1), Int32.from(2))).toBe(true);
		});

		it("should return false when equal", () => {
			expect(Int32.lessThan(Int32.from(2), Int32.from(2))).toBe(false);
		});

		it("should handle signed comparison", () => {
			expect(Int32.lessThan(Int32.from(-1), Int32.from(1))).toBe(true);
		});
	});

	describe("greaterThan", () => {
		it("should return true when first is greater", () => {
			expect(Int32.greaterThan(Int32.from(2), Int32.from(1))).toBe(true);
		});

		it("should return false when equal", () => {
			expect(Int32.greaterThan(Int32.from(2), Int32.from(2))).toBe(false);
		});

		it("should handle signed comparison", () => {
			expect(Int32.greaterThan(Int32.from(1), Int32.from(-1))).toBe(true);
		});
	});

	describe("isZero", () => {
		it("should return true for zero", () => {
			expect(Int32.isZero(Int32.from(0))).toBe(true);
		});

		it("should return false for non-zero", () => {
			expect(Int32.isZero(Int32.from(42))).toBe(false);
		});
	});

	describe("isValid", () => {
		it("should return true for valid Int32", () => {
			expect(Int32.isValid(42)).toBe(true);
		});

		it("should return true for negative", () => {
			expect(Int32.isValid(-42)).toBe(true);
		});

		it("should return false for non-number", () => {
			expect(Int32.isValid("42")).toBe(false);
		});

		it("should return false for NaN", () => {
			expect(Int32.isValid(Number.NaN)).toBe(false);
		});

		it("should return false for Infinity", () => {
			expect(Int32.isValid(Number.POSITIVE_INFINITY)).toBe(false);
		});

		it("should return false for overflow", () => {
			expect(Int32.isValid(2147483648)).toBe(false);
		});
	});

	describe("bitwiseAnd", () => {
		it("should compute bitwise AND", () => {
			const a = Int32.from(0b1100);
			const b = Int32.from(0b1010);
			expect(Int32.bitwiseAnd(a, b)).toBe(0b1000);
		});

		it("should work with negative numbers", () => {
			const a = Int32.from(-1);
			const b = Int32.from(0xff);
			expect(Int32.bitwiseAnd(a, b)).toBe(0xff);
		});
	});

	describe("bitwiseOr", () => {
		it("should compute bitwise OR", () => {
			const a = Int32.from(0b1100);
			const b = Int32.from(0b1010);
			expect(Int32.bitwiseOr(a, b)).toBe(0b1110);
		});
	});

	describe("bitwiseXor", () => {
		it("should compute bitwise XOR", () => {
			const a = Int32.from(0b1100);
			const b = Int32.from(0b1010);
			expect(Int32.bitwiseXor(a, b)).toBe(0b0110);
		});
	});

	describe("bitwiseNot", () => {
		it("should compute bitwise NOT", () => {
			const val = Int32.from(0);
			expect(Int32.bitwiseNot(val)).toBe(-1);
		});

		it("should compute NOT of -1", () => {
			const val = Int32.from(-1);
			expect(Int32.bitwiseNot(val)).toBe(0);
		});
	});

	describe("shiftLeft", () => {
		it("should shift left", () => {
			const val = Int32.from(1);
			expect(Int32.shiftLeft(val, 2)).toBe(4);
		});

		it("should shift left with sign extension", () => {
			const val = Int32.from(1);
			expect(Int32.shiftLeft(val, 31)).toBe(-2147483648);
		});
	});

	describe("shiftRight", () => {
		it("should arithmetic shift right positive", () => {
			const val = Int32.from(8);
			expect(Int32.shiftRight(val, 2)).toBe(2);
		});

		it("should arithmetic shift right negative (preserve sign)", () => {
			const val = Int32.from(-8);
			expect(Int32.shiftRight(val, 2)).toBe(-2);
		});

		it("should shift MIN correctly", () => {
			const val = Int32.from(-2147483648);
			expect(Int32.shiftRight(val, 1)).toBe(-1073741824);
		});
	});

	describe("minimum", () => {
		it("should return minimum of two values", () => {
			expect(Int32.minimum(Int32.from(1), Int32.from(2))).toBe(1);
		});

		it("should handle negatives", () => {
			expect(Int32.minimum(Int32.from(-1), Int32.from(1))).toBe(-1);
		});
	});

	describe("maximum", () => {
		it("should return maximum of two values", () => {
			expect(Int32.maximum(Int32.from(1), Int32.from(2))).toBe(2);
		});

		it("should handle negatives", () => {
			expect(Int32.maximum(Int32.from(-1), Int32.from(1))).toBe(1);
		});
	});

	describe("clone", () => {
		it("should clone value", () => {
			const val = Int32.from(42);
			const cloned = Int32.clone(val);
			expect(cloned).toBe(val);
		});
	});
});
