import { describe, expect, it } from "vitest";
import * as Int64 from "./index.js";

describe("Int64", () => {
	describe("constants", () => {
		it("should have correct MIN value", () => {
			expect(Int64.MIN).toBe(-9223372036854775808n);
		});

		it("should have correct MAX value", () => {
			expect(Int64.MAX).toBe(9223372036854775807n);
		});

		it("should have ZERO", () => {
			expect(Int64.ZERO).toBe(0n);
		});

		it("should have ONE", () => {
			expect(Int64.ONE).toBe(1n);
		});

		it("should have MINUS_ONE", () => {
			expect(Int64.MINUS_ONE).toBe(-1n);
		});

		it("should have SIZE", () => {
			expect(Int64.SIZE).toBe(8);
		});
	});

	describe("from", () => {
		it("should create from positive bigint", () => {
			const val = Int64.from(42n);
			expect(val).toBe(42n);
		});

		it("should create from negative bigint", () => {
			const val = Int64.from(-42n);
			expect(val).toBe(-42n);
		});

		it("should create from zero", () => {
			const val = Int64.from(0n);
			expect(val).toBe(0n);
		});

		it("should create from MIN", () => {
			const val = Int64.from(-9223372036854775808n);
			expect(val).toBe(-9223372036854775808n);
		});

		it("should create from MAX", () => {
			const val = Int64.from(9223372036854775807n);
			expect(val).toBe(9223372036854775807n);
		});

		it("should create from number", () => {
			const val = Int64.from(42);
			expect(val).toBe(42n);
		});

		it("should create from negative number", () => {
			const val = Int64.from(-42);
			expect(val).toBe(-42n);
		});

		it("should create from string", () => {
			const val = Int64.from("42");
			expect(val).toBe(42n);
		});

		it("should create from negative string", () => {
			const val = Int64.from("-42");
			expect(val).toBe(-42n);
		});

		it("should throw IntegerOverflowError on overflow", () => {
			try {
				Int64.from(9223372036854775808n);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
			}
		});

		it("should throw IntegerUnderflowError on underflow", () => {
			try {
				Int64.from(-9223372036854775809n);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerUnderflowError");
			}
		});

		it("should throw InvalidFormatError on NaN", () => {
			try {
				Int64.from(Number.NaN);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidFormatError");
			}
		});

		it("should throw InvalidFormatError on Infinity", () => {
			try {
				Int64.from(Number.POSITIVE_INFINITY);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidFormatError");
			}
		});
	});

	describe("fromBigInt", () => {
		it("should create from bigint", () => {
			expect(Int64.fromBigInt(42n)).toBe(42n);
		});

		it("should create from negative bigint", () => {
			expect(Int64.fromBigInt(-42n)).toBe(-42n);
		});

		it("should create from MIN", () => {
			expect(Int64.fromBigInt(-9223372036854775808n)).toBe(
				-9223372036854775808n,
			);
		});

		it("should create from MAX", () => {
			expect(Int64.fromBigInt(9223372036854775807n)).toBe(9223372036854775807n);
		});

		it("should throw IntegerOverflowError on overflow", () => {
			try {
				Int64.fromBigInt(9223372036854775808n);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
			}
		});

		it("should throw IntegerUnderflowError on underflow", () => {
			try {
				Int64.fromBigInt(-9223372036854775809n);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerUnderflowError");
			}
		});
	});

	describe("fromNumber", () => {
		it("should create from number", () => {
			expect(Int64.fromNumber(42)).toBe(42n);
		});

		it("should create from negative", () => {
			expect(Int64.fromNumber(-42)).toBe(-42n);
		});

		it("should truncate decimal", () => {
			expect(Int64.fromNumber(42.7)).toBe(42n);
		});

		it("should throw InvalidFormatError on NaN", () => {
			try {
				Int64.fromNumber(Number.NaN);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidFormatError");
				expect((e as Error).message).toContain("NaN");
			}
		});

		it("should throw InvalidFormatError on Infinity", () => {
			try {
				Int64.fromNumber(Number.POSITIVE_INFINITY);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidFormatError");
				expect((e as Error).message).toContain("Infinity");
			}
		});
	});

	describe("fromBytes", () => {
		it("should create from single byte positive", () => {
			const bytes = new Uint8Array([0x7f]);
			expect(Int64.fromBytes(bytes)).toBe(127n);
		});

		it("should create from single byte negative", () => {
			const bytes = new Uint8Array([0xff]);
			expect(Int64.fromBytes(bytes)).toBe(-1n);
		});

		it("should create from 8 bytes positive", () => {
			const bytes = new Uint8Array([
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2a,
			]);
			expect(Int64.fromBytes(bytes)).toBe(42n);
		});

		it("should create from 8 bytes negative", () => {
			const bytes = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
			]);
			expect(Int64.fromBytes(bytes)).toBe(-1n);
		});

		it("should create MIN from bytes", () => {
			const bytes = new Uint8Array([
				0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			]);
			expect(Int64.fromBytes(bytes)).toBe(-9223372036854775808n);
		});

		it("should create MAX from bytes", () => {
			const bytes = new Uint8Array([
				0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
			]);
			expect(Int64.fromBytes(bytes)).toBe(9223372036854775807n);
		});

		it("should throw InvalidLengthError if bytes exceed 8", () => {
			const bytes = new Uint8Array(9);
			try {
				Int64.fromBytes(bytes);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidLengthError");
				expect((e as Error).message).toContain("cannot exceed 8 bytes");
			}
		});
	});

	describe("fromHex", () => {
		it("should create from hex with prefix", () => {
			expect(Int64.fromHex("0x2a")).toBe(42n);
		});

		it("should create from hex without prefix", () => {
			expect(Int64.fromHex("2a")).toBe(42n);
		});

		it("should create negative from hex", () => {
			expect(Int64.fromHex("0xffffffffffffffff")).toBe(-1n);
		});

		it("should create MIN from hex", () => {
			expect(Int64.fromHex("0x8000000000000000")).toBe(-9223372036854775808n);
		});

		it("should create MAX from hex", () => {
			expect(Int64.fromHex("0x7fffffffffffffff")).toBe(9223372036854775807n);
		});

		it("should throw InvalidLengthError if hex exceeds 16 chars", () => {
			try {
				Int64.fromHex("0x12345678901234567");
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidLengthError");
				expect((e as Error).message).toContain("cannot exceed 16 characters");
			}
		});

		it("should throw InvalidFormatError on invalid hex", () => {
			try {
				Int64.fromHex("0xgg");
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidFormatError");
				expect((e as Error).message).toContain("Invalid hex");
			}
		});
	});

	describe("toNumber", () => {
		it("should convert to number", () => {
			const val = Int64.from(42n);
			expect(Int64.toNumber(val)).toBe(42);
		});

		it("should convert negative to number", () => {
			const val = Int64.from(-42n);
			expect(Int64.toNumber(val)).toBe(-42);
		});

		it("should throw InvalidRangeError if value exceeds safe integer", () => {
			const val = Int64.from(9007199254740992n);
			try {
				Int64.toNumber(val);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidRangeError");
				expect((e as Error).message).toContain("exceeds Number.MAX_SAFE_INTEGER");
			}
		});
	});

	describe("toBigInt", () => {
		it("should convert to bigint", () => {
			const val = Int64.from(42n);
			expect(Int64.toBigInt(val)).toBe(42n);
		});

		it("should convert negative to bigint", () => {
			const val = Int64.from(-42n);
			expect(Int64.toBigInt(val)).toBe(-42n);
		});
	});

	describe("toBytes", () => {
		it("should convert positive to bytes", () => {
			const val = Int64.from(42n);
			const bytes = Int64.toBytes(val);
			expect(bytes).toEqual(
				new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2a]),
			);
		});

		it("should convert negative to bytes (two's complement)", () => {
			const val = Int64.from(-1n);
			const bytes = Int64.toBytes(val);
			expect(bytes).toEqual(
				new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
			);
		});

		it("should convert MIN to bytes", () => {
			const val = Int64.from(-9223372036854775808n);
			const bytes = Int64.toBytes(val);
			expect(bytes).toEqual(
				new Uint8Array([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
			);
		});

		it("should convert MAX to bytes", () => {
			const val = Int64.from(9223372036854775807n);
			const bytes = Int64.toBytes(val);
			expect(bytes).toEqual(
				new Uint8Array([0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
			);
		});

		it("should always return 8 bytes", () => {
			const bytes = Int64.toBytes(Int64.from(0n));
			expect(bytes.length).toBe(8);
		});
	});

	describe("toHex", () => {
		it("should convert positive to hex", () => {
			const val = Int64.from(42n);
			expect(Int64.toHex(val)).toBe("0x000000000000002a");
		});

		it("should convert negative to hex (two's complement)", () => {
			const val = Int64.from(-1n);
			expect(Int64.toHex(val)).toBe("0xffffffffffffffff");
		});

		it("should convert MIN to hex", () => {
			const val = Int64.from(-9223372036854775808n);
			expect(Int64.toHex(val)).toBe("0x8000000000000000");
		});

		it("should convert MAX to hex", () => {
			const val = Int64.from(9223372036854775807n);
			expect(Int64.toHex(val)).toBe("0x7fffffffffffffff");
		});
	});

	describe("toString", () => {
		it("should convert to string", () => {
			expect(Int64.toString(Int64.from(42n))).toBe("42");
		});

		it("should convert negative to string", () => {
			expect(Int64.toString(Int64.from(-42n))).toBe("-42");
		});
	});

	describe("plus", () => {
		it("should add positive numbers", () => {
			const a = Int64.from(10n);
			const b = Int64.from(20n);
			expect(Int64.plus(a, b)).toBe(30n);
		});

		it("should add negative numbers", () => {
			const a = Int64.from(-10n);
			const b = Int64.from(-20n);
			expect(Int64.plus(a, b)).toBe(-30n);
		});

		it("should add mixed signs", () => {
			const a = Int64.from(50n);
			const b = Int64.from(-20n);
			expect(Int64.plus(a, b)).toBe(30n);
		});

		it("should throw IntegerOverflowError on positive overflow", () => {
			const a = Int64.from(9223372036854775807n);
			const b = Int64.from(1n);
			try {
				Int64.plus(a, b);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
			}
		});

		it("should throw IntegerUnderflowError on negative overflow", () => {
			const a = Int64.from(-9223372036854775808n);
			const b = Int64.from(-1n);
			try {
				Int64.plus(a, b);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerUnderflowError");
			}
		});
	});

	describe("minus", () => {
		it("should subtract positive numbers", () => {
			const a = Int64.from(50n);
			const b = Int64.from(20n);
			expect(Int64.minus(a, b)).toBe(30n);
		});

		it("should subtract negative numbers", () => {
			const a = Int64.from(-50n);
			const b = Int64.from(-20n);
			expect(Int64.minus(a, b)).toBe(-30n);
		});

		it("should subtract mixed signs", () => {
			const a = Int64.from(50n);
			const b = Int64.from(-20n);
			expect(Int64.minus(a, b)).toBe(70n);
		});

		it("should throw IntegerOverflowError on overflow", () => {
			const a = Int64.from(9223372036854775807n);
			const b = Int64.from(-1n);
			try {
				Int64.minus(a, b);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
			}
		});

		it("should throw IntegerUnderflowError on underflow", () => {
			const a = Int64.from(-9223372036854775808n);
			const b = Int64.from(1n);
			try {
				Int64.minus(a, b);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerUnderflowError");
			}
		});
	});

	describe("times", () => {
		it("should multiply positive numbers", () => {
			const a = Int64.from(6n);
			const b = Int64.from(7n);
			expect(Int64.times(a, b)).toBe(42n);
		});

		it("should multiply negative numbers", () => {
			const a = Int64.from(-6n);
			const b = Int64.from(-7n);
			expect(Int64.times(a, b)).toBe(42n);
		});

		it("should multiply mixed signs", () => {
			const a = Int64.from(-6n);
			const b = Int64.from(7n);
			expect(Int64.times(a, b)).toBe(-42n);
		});

		it("should multiply by zero", () => {
			const a = Int64.from(42n);
			const b = Int64.from(0n);
			expect(Int64.times(a, b)).toBe(0n);
		});

		it("should throw IntegerOverflowError on overflow", () => {
			const a = Int64.from(9223372036854775807n);
			const b = Int64.from(2n);
			try {
				Int64.times(a, b);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
			}
		});
	});

	describe("dividedBy", () => {
		it("should divide positive numbers", () => {
			const a = Int64.from(42n);
			const b = Int64.from(6n);
			expect(Int64.dividedBy(a, b)).toBe(7n);
		});

		it("should divide negative numbers", () => {
			const a = Int64.from(-42n);
			const b = Int64.from(-6n);
			expect(Int64.dividedBy(a, b)).toBe(7n);
		});

		it("should divide mixed signs", () => {
			const a = Int64.from(-42n);
			const b = Int64.from(6n);
			expect(Int64.dividedBy(a, b)).toBe(-7n);
		});

		it("should truncate toward zero", () => {
			const a = Int64.from(7n);
			const b = Int64.from(2n);
			expect(Int64.dividedBy(a, b)).toBe(3n);
		});

		it("should truncate toward zero for negative", () => {
			const a = Int64.from(-7n);
			const b = Int64.from(2n);
			expect(Int64.dividedBy(a, b)).toBe(-3n);
		});

		it("should throw InvalidRangeError on division by zero", () => {
			const a = Int64.from(42n);
			const b = Int64.from(0n);
			try {
				Int64.dividedBy(a, b);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidRangeError");
				expect((e as Error).message).toContain("Division by zero");
			}
		});

		it("should throw IntegerOverflowError on MIN / -1 overflow", () => {
			const a = Int64.from(-9223372036854775808n);
			const b = Int64.from(-1n);
			try {
				Int64.dividedBy(a, b);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
			}
		});
	});

	describe("modulo", () => {
		it("should compute modulo of positive numbers", () => {
			const a = Int64.from(42n);
			const b = Int64.from(10n);
			expect(Int64.modulo(a, b)).toBe(2n);
		});

		it("should compute modulo with negative dividend", () => {
			const a = Int64.from(-42n);
			const b = Int64.from(10n);
			expect(Int64.modulo(a, b)).toBe(-2n);
		});

		it("should throw InvalidRangeError on modulo by zero", () => {
			const a = Int64.from(42n);
			const b = Int64.from(0n);
			try {
				Int64.modulo(a, b);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidRangeError");
				expect((e as Error).message).toContain("Modulo by zero");
			}
		});
	});

	describe("abs", () => {
		it("should return positive value unchanged", () => {
			expect(Int64.abs(Int64.from(42n))).toBe(42n);
		});

		it("should return absolute of negative", () => {
			expect(Int64.abs(Int64.from(-42n))).toBe(42n);
		});

		it("should return zero unchanged", () => {
			expect(Int64.abs(Int64.from(0n))).toBe(0n);
		});

		it("should throw IntegerOverflowError on MIN", () => {
			try {
				Int64.abs(Int64.from(-9223372036854775808n));
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
				expect((e as Error).message).toContain("Cannot get absolute value");
			}
		});
	});

	describe("negate", () => {
		it("should negate positive", () => {
			expect(Int64.negate(Int64.from(42n))).toBe(-42n);
		});

		it("should negate negative", () => {
			expect(Int64.negate(Int64.from(-42n))).toBe(42n);
		});

		it("should negate zero", () => {
			expect(Int64.negate(Int64.from(0n))).toBe(0n);
		});

		it("should throw IntegerOverflowError on MIN", () => {
			try {
				Int64.negate(Int64.from(-9223372036854775808n));
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
				expect((e as Error).message).toContain("Cannot negate");
			}
		});
	});

	describe("sign", () => {
		it("should return 1 for positive", () => {
			expect(Int64.sign(Int64.from(42n))).toBe(1);
		});

		it("should return -1 for negative", () => {
			expect(Int64.sign(Int64.from(-42n))).toBe(-1);
		});

		it("should return 0 for zero", () => {
			expect(Int64.sign(Int64.from(0n))).toBe(0);
		});
	});

	describe("isNegative", () => {
		it("should return false for positive", () => {
			expect(Int64.isNegative(Int64.from(42n))).toBe(false);
		});

		it("should return true for negative", () => {
			expect(Int64.isNegative(Int64.from(-42n))).toBe(true);
		});

		it("should return false for zero", () => {
			expect(Int64.isNegative(Int64.from(0n))).toBe(false);
		});
	});

	describe("isPositive", () => {
		it("should return true for positive", () => {
			expect(Int64.isPositive(Int64.from(42n))).toBe(true);
		});

		it("should return false for negative", () => {
			expect(Int64.isPositive(Int64.from(-42n))).toBe(false);
		});

		it("should return false for zero", () => {
			expect(Int64.isPositive(Int64.from(0n))).toBe(false);
		});
	});

	describe("equals", () => {
		it("should return true for equal values", () => {
			const a = Int64.from(42n);
			const b = Int64.from(42n);
			expect(Int64.equals(a, b)).toBe(true);
		});

		it("should return false for different values", () => {
			const a = Int64.from(42n);
			const b = Int64.from(43n);
			expect(Int64.equals(a, b)).toBe(false);
		});
	});

	describe("lessThan", () => {
		it("should return true when first is less", () => {
			expect(Int64.lessThan(Int64.from(1n), Int64.from(2n))).toBe(true);
		});

		it("should return false when equal", () => {
			expect(Int64.lessThan(Int64.from(2n), Int64.from(2n))).toBe(false);
		});

		it("should handle signed comparison", () => {
			expect(Int64.lessThan(Int64.from(-1n), Int64.from(1n))).toBe(true);
		});
	});

	describe("greaterThan", () => {
		it("should return true when first is greater", () => {
			expect(Int64.greaterThan(Int64.from(2n), Int64.from(1n))).toBe(true);
		});

		it("should return false when equal", () => {
			expect(Int64.greaterThan(Int64.from(2n), Int64.from(2n))).toBe(false);
		});

		it("should handle signed comparison", () => {
			expect(Int64.greaterThan(Int64.from(1n), Int64.from(-1n))).toBe(true);
		});
	});

	describe("isZero", () => {
		it("should return true for zero", () => {
			expect(Int64.isZero(Int64.from(0n))).toBe(true);
		});

		it("should return false for non-zero", () => {
			expect(Int64.isZero(Int64.from(42n))).toBe(false);
		});
	});

	describe("isValid", () => {
		it("should return true for valid Int64", () => {
			expect(Int64.isValid(42n)).toBe(true);
		});

		it("should return true for negative", () => {
			expect(Int64.isValid(-42n)).toBe(true);
		});

		it("should return false for non-bigint", () => {
			expect(Int64.isValid(42)).toBe(false);
		});

		it("should return false for overflow", () => {
			expect(Int64.isValid(9223372036854775808n)).toBe(false);
		});
	});

	describe("bitwiseAnd", () => {
		it("should compute bitwise AND", () => {
			const a = Int64.from(0b1100n);
			const b = Int64.from(0b1010n);
			expect(Int64.bitwiseAnd(a, b)).toBe(0b1000n);
		});

		it("should work with negative numbers", () => {
			const a = Int64.from(-1n);
			const b = Int64.from(0xffn);
			expect(Int64.bitwiseAnd(a, b)).toBe(0xffn);
		});
	});

	describe("bitwiseOr", () => {
		it("should compute bitwise OR", () => {
			const a = Int64.from(0b1100n);
			const b = Int64.from(0b1010n);
			expect(Int64.bitwiseOr(a, b)).toBe(0b1110n);
		});
	});

	describe("bitwiseXor", () => {
		it("should compute bitwise XOR", () => {
			const a = Int64.from(0b1100n);
			const b = Int64.from(0b1010n);
			expect(Int64.bitwiseXor(a, b)).toBe(0b0110n);
		});
	});

	describe("bitwiseNot", () => {
		it("should compute bitwise NOT", () => {
			const val = Int64.from(0n);
			expect(Int64.bitwiseNot(val)).toBe(-1n);
		});

		it("should compute NOT of -1", () => {
			const val = Int64.from(-1n);
			expect(Int64.bitwiseNot(val)).toBe(0n);
		});
	});

	describe("shiftLeft", () => {
		it("should shift left", () => {
			const val = Int64.from(1n);
			expect(Int64.shiftLeft(val, 2n)).toBe(4n);
		});

		it("should shift left with sign extension", () => {
			const val = Int64.from(1n);
			expect(Int64.shiftLeft(val, 63n)).toBe(-9223372036854775808n);
		});
	});

	describe("shiftRight", () => {
		it("should arithmetic shift right positive", () => {
			const val = Int64.from(8n);
			expect(Int64.shiftRight(val, 2n)).toBe(2n);
		});

		it("should arithmetic shift right negative (preserve sign)", () => {
			const val = Int64.from(-8n);
			expect(Int64.shiftRight(val, 2n)).toBe(-2n);
		});

		it("should shift MIN correctly", () => {
			const val = Int64.from(-9223372036854775808n);
			expect(Int64.shiftRight(val, 1n)).toBe(-4611686018427387904n);
		});
	});

	describe("minimum", () => {
		it("should return minimum of two values", () => {
			expect(Int64.minimum(Int64.from(1n), Int64.from(2n))).toBe(1n);
		});

		it("should handle negatives", () => {
			expect(Int64.minimum(Int64.from(-1n), Int64.from(1n))).toBe(-1n);
		});
	});

	describe("maximum", () => {
		it("should return maximum of two values", () => {
			expect(Int64.maximum(Int64.from(1n), Int64.from(2n))).toBe(2n);
		});

		it("should handle negatives", () => {
			expect(Int64.maximum(Int64.from(-1n), Int64.from(1n))).toBe(1n);
		});
	});

	describe("clone", () => {
		it("should clone value", () => {
			const val = Int64.from(42n);
			const cloned = Int64.clone(val);
			expect(cloned).toBe(val);
		});
	});
});
