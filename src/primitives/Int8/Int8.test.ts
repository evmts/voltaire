import { describe, expect, it } from "vitest";
import * as Int8 from "./index.js";

describe("Int8", () => {
	describe("constructors", () => {
		it("creates from positive number", () => {
			const value = Int8.from(42);
			expect(Int8.toNumber(value)).toBe(42);
		});

		it("creates from negative number", () => {
			const value = Int8.from(-42);
			expect(Int8.toNumber(value)).toBe(-42);
		});

		it("creates from zero", () => {
			const value = Int8.from(0);
			expect(Int8.toNumber(value)).toBe(0);
		});

		it("creates from INT8_MIN (-128)", () => {
			const value = Int8.from(-128);
			expect(Int8.toNumber(value)).toBe(-128);
		});

		it("creates from INT8_MAX (127)", () => {
			const value = Int8.from(127);
			expect(Int8.toNumber(value)).toBe(127);
		});

		it("throws IntegerUnderflowError on value below INT8_MIN", () => {
			try {
				Int8.from(-129);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerUnderflowError");
				expect((e as Error).message).toContain("below minimum");
			}
		});

		it("throws IntegerOverflowError on value above INT8_MAX", () => {
			try {
				Int8.from(128);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
				expect((e as Error).message).toContain("exceeds maximum");
			}
		});

		it("throws InvalidFormatError on non-integer", () => {
			try {
				Int8.from(42.5);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidFormatError");
				expect((e as Error).message).toContain("must be an integer");
			}
		});

		it("creates from bigint", () => {
			const value = Int8.fromBigint(-42n);
			expect(Int8.toNumber(value)).toBe(-42);
		});

		it("throws IntegerUnderflowError on bigint below range", () => {
			try {
				Int8.fromBigint(-200n);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerUnderflowError");
			}
		});

		it("throws IntegerOverflowError on bigint above range", () => {
			try {
				Int8.fromBigint(200n);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
			}
		});
	});

	describe("two's complement conversions", () => {
		it("converts -1 to 0xFF", () => {
			const value = Int8.from(-1);
			expect(Int8.toHex(value)).toBe("0xff");
		});

		it("converts -128 to 0x80", () => {
			const value = Int8.from(-128);
			expect(Int8.toHex(value)).toBe("0x80");
		});

		it("converts 127 to 0x7F", () => {
			const value = Int8.from(127);
			expect(Int8.toHex(value)).toBe("0x7f");
		});

		it("converts 0x80 to -128", () => {
			const value = Int8.fromHex("0x80");
			expect(Int8.toNumber(value)).toBe(-128);
		});

		it("converts 0xFF to -1", () => {
			const value = Int8.fromHex("0xFF");
			expect(Int8.toNumber(value)).toBe(-1);
		});

		it("converts 0x7F to 127", () => {
			const value = Int8.fromHex("0x7F");
			expect(Int8.toNumber(value)).toBe(127);
		});

		it("converts bytes correctly", () => {
			const bytes = new Uint8Array([0x80]);
			const value = Int8.fromBytes(bytes);
			expect(Int8.toNumber(value)).toBe(-128);
		});

		it("converts to bytes correctly", () => {
			const value = Int8.from(-1);
			const bytes = Int8.toBytes(value);
			expect(bytes).toEqual(new Uint8Array([0xff]));
		});
	});

	describe("signed arithmetic", () => {
		it("adds positive numbers", () => {
			const result = Int8.plus(10, 20);
			expect(Int8.toNumber(result)).toBe(30);
		});

		it("adds negative numbers", () => {
			const result = Int8.plus(-10, -20);
			expect(Int8.toNumber(result)).toBe(-30);
		});

		it("adds mixed signs", () => {
			const result = Int8.plus(-5, 3);
			expect(Int8.toNumber(result)).toBe(-2);
		});

		it("throws IntegerOverflowError on overflow", () => {
			try {
				Int8.plus(100, 50);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
			}
		});

		it("throws IntegerUnderflowError on underflow", () => {
			try {
				Int8.plus(-100, -50);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerUnderflowError");
			}
		});

		it("subtracts correctly", () => {
			const result = Int8.minus(10, 20);
			expect(Int8.toNumber(result)).toBe(-10);
		});

		it("subtracts negative", () => {
			const result = Int8.minus(-10, -5);
			expect(Int8.toNumber(result)).toBe(-5);
		});

		it("throws IntegerUnderflowError on subtraction underflow", () => {
			try {
				Int8.minus(-100, 50);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerUnderflowError");
			}
		});

		it("multiplies positive", () => {
			const result = Int8.times(5, 10);
			expect(Int8.toNumber(result)).toBe(50);
		});

		it("multiplies negative", () => {
			const result = Int8.times(-5, 10);
			expect(Int8.toNumber(result)).toBe(-50);
		});

		it("multiplies two negatives", () => {
			const result = Int8.times(-5, -10);
			expect(Int8.toNumber(result)).toBe(50);
		});

		it("throws IntegerOverflowError on multiplication overflow", () => {
			try {
				Int8.times(20, 10);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
			}
		});
	});

	describe("signed division (SDIV semantics)", () => {
		it("divides positive by positive", () => {
			const result = Int8.dividedBy(10, 3);
			expect(Int8.toNumber(result)).toBe(3);
		});

		it("divides negative by positive (truncate toward zero)", () => {
			const result = Int8.dividedBy(-10, 3);
			expect(Int8.toNumber(result)).toBe(-3);
		});

		it("divides positive by negative", () => {
			const result = Int8.dividedBy(10, -3);
			expect(Int8.toNumber(result)).toBe(-3);
		});

		it("divides negative by negative", () => {
			const result = Int8.dividedBy(-10, -3);
			expect(Int8.toNumber(result)).toBe(3);
		});

		it("throws InvalidRangeError on division by zero", () => {
			try {
				Int8.dividedBy(10, 0);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidRangeError");
				expect((e as Error).message).toContain("division by zero");
			}
		});

		it("throws IntegerOverflowError on INT8_MIN / -1", () => {
			try {
				Int8.dividedBy(-128, -1);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
			}
		});
	});

	describe("signed modulo (SMOD semantics)", () => {
		it("modulo positive numbers", () => {
			const result = Int8.modulo(10, 3);
			expect(Int8.toNumber(result)).toBe(1);
		});

		it("modulo negative dividend (sign follows dividend)", () => {
			const result = Int8.modulo(-10, 3);
			expect(Int8.toNumber(result)).toBe(-1);
		});

		it("modulo negative divisor", () => {
			const result = Int8.modulo(10, -3);
			expect(Int8.toNumber(result)).toBe(1);
		});

		it("modulo both negative", () => {
			const result = Int8.modulo(-10, -3);
			expect(Int8.toNumber(result)).toBe(-1);
		});

		it("throws InvalidRangeError on modulo by zero", () => {
			try {
				Int8.modulo(10, 0);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidRangeError");
				expect((e as Error).message).toContain("modulo by zero");
			}
		});
	});

	describe("abs and negate", () => {
		it("abs of positive", () => {
			const result = Int8.abs(42);
			expect(Int8.toNumber(result)).toBe(42);
		});

		it("abs of negative", () => {
			const result = Int8.abs(-42);
			expect(Int8.toNumber(result)).toBe(42);
		});

		it("abs of zero", () => {
			const result = Int8.abs(0);
			expect(Int8.toNumber(result)).toBe(0);
		});

		it("throws IntegerOverflowError on abs(INT8_MIN)", () => {
			try {
				Int8.abs(-128);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
			}
		});

		it("negate positive", () => {
			const result = Int8.negate(42);
			expect(Int8.toNumber(result)).toBe(-42);
		});

		it("negate negative", () => {
			const result = Int8.negate(-42);
			expect(Int8.toNumber(result)).toBe(42);
		});

		it("negate zero", () => {
			const result = Int8.negate(0);
			expect(Int8.toNumber(result)).toBe(0);
		});

		it("throws IntegerOverflowError on negate(INT8_MIN)", () => {
			try {
				Int8.negate(-128);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
			}
		});
	});

	describe("comparison", () => {
		it("equals same value", () => {
			expect(Int8.equals(-42, -42)).toBe(true);
		});

		it("equals different value", () => {
			expect(Int8.equals(-42, 42)).toBe(false);
		});

		it("lessThan negative and positive", () => {
			expect(Int8.lessThan(-42, 42)).toBe(true);
			expect(Int8.lessThan(42, -42)).toBe(false);
		});

		it("greaterThan", () => {
			expect(Int8.greaterThan(42, -42)).toBe(true);
			expect(Int8.greaterThan(-42, 42)).toBe(false);
		});

		it("isZero", () => {
			expect(Int8.isZero(0)).toBe(true);
			expect(Int8.isZero(1)).toBe(false);
			expect(Int8.isZero(-1)).toBe(false);
		});

		it("isNegative", () => {
			expect(Int8.isNegative(-42)).toBe(true);
			expect(Int8.isNegative(0)).toBe(false);
			expect(Int8.isNegative(42)).toBe(false);
		});

		it("isPositive", () => {
			expect(Int8.isPositive(42)).toBe(true);
			expect(Int8.isPositive(0)).toBe(false);
			expect(Int8.isPositive(-42)).toBe(false);
		});

		it("minimum", () => {
			const result = Int8.minimum(-10, 5);
			expect(Int8.toNumber(result)).toBe(-10);
		});

		it("maximum", () => {
			const result = Int8.maximum(-10, 5);
			expect(Int8.toNumber(result)).toBe(5);
		});

		it("sign", () => {
			expect(Int8.sign(-42)).toBe(-1);
			expect(Int8.sign(0)).toBe(0);
			expect(Int8.sign(42)).toBe(1);
		});
	});

	describe("arithmetic right shift", () => {
		it("shifts positive right", () => {
			const result = Int8.shiftRight(8, 1);
			expect(Int8.toNumber(result)).toBe(4);
		});

		it("shifts negative right (preserves sign)", () => {
			const result = Int8.shiftRight(-8, 1);
			expect(Int8.toNumber(result)).toBe(-4);
		});

		it("shifts -1 right (all bits set)", () => {
			const result = Int8.shiftRight(-1, 1);
			expect(Int8.toNumber(result)).toBe(-1);
		});

		it("shifts -128 right", () => {
			const result = Int8.shiftRight(-128, 1);
			expect(Int8.toNumber(result)).toBe(-64);
		});

		it("shifts by zero", () => {
			const result = Int8.shiftRight(-8, 0);
			expect(Int8.toNumber(result)).toBe(-8);
		});

		it("throws InvalidRangeError on invalid shift amount", () => {
			try {
				Int8.shiftRight(10, -1);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidRangeError");
			}
			try {
				Int8.shiftRight(10, 8);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidRangeError");
			}
		});
	});

	describe("left shift", () => {
		it("shifts left", () => {
			const result = Int8.shiftLeft(4, 1);
			expect(Int8.toNumber(result)).toBe(8);
		});

		it("shifts with wrapping", () => {
			const result = Int8.shiftLeft(64, 1);
			expect(Int8.toNumber(result)).toBe(-128);
		});

		it("throws InvalidRangeError on invalid shift", () => {
			try {
				Int8.shiftLeft(10, -1);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidRangeError");
			}
			try {
				Int8.shiftLeft(10, 8);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidRangeError");
			}
		});
	});

	describe("bitwise operations", () => {
		it("bitwise AND", () => {
			const result = Int8.and(0b01010101, 0b00110011);
			expect(Int8.toNumber(result)).toBe(0b00010001);
		});

		it("bitwise AND with negative", () => {
			const result = Int8.and(-1, 0x0f);
			expect(Int8.toNumber(result)).toBe(0x0f);
		});

		it("bitwise OR", () => {
			const result = Int8.or(0b01010101, 0b00110011);
			expect(Int8.toNumber(result)).toBe(0b01110111);
		});

		it("bitwise XOR", () => {
			const result = Int8.xor(0b01010101, 0b00110011);
			expect(Int8.toNumber(result)).toBe(0b01100110);
		});

		it("bitwise NOT", () => {
			const result = Int8.not(0);
			expect(Int8.toNumber(result)).toBe(-1);
		});

		it("bitwise NOT of -1", () => {
			const result = Int8.not(-1);
			expect(Int8.toNumber(result)).toBe(0);
		});
	});

	describe("utilities", () => {
		it("bitLength of positive", () => {
			expect(Int8.bitLength(7)).toBe(3);
			expect(Int8.bitLength(8)).toBe(4);
		});

		it("bitLength of negative (uses absolute)", () => {
			expect(Int8.bitLength(-7)).toBe(3);
			expect(Int8.bitLength(-8)).toBe(4);
		});

		it("bitLength of zero", () => {
			expect(Int8.bitLength(0)).toBe(0);
		});

		it("leadingZeros", () => {
			expect(Int8.leadingZeros(0)).toBe(8);
			expect(Int8.leadingZeros(1)).toBe(7);
			expect(Int8.leadingZeros(127)).toBe(1);
		});

		it("leadingZeros of negative (two's complement)", () => {
			expect(Int8.leadingZeros(-1)).toBe(0); // 0xFF
			expect(Int8.leadingZeros(-128)).toBe(0); // 0x80
		});

		it("popCount", () => {
			expect(Int8.popCount(0)).toBe(0);
			expect(Int8.popCount(7)).toBe(3); // 0b111
			expect(Int8.popCount(-1)).toBe(8); // all bits set
		});

		it("isValid", () => {
			expect(Int8.isValid(127)).toBe(true);
			expect(Int8.isValid(-128)).toBe(true);
			expect(Int8.isValid(0)).toBe(true);
			expect(Int8.isValid(128)).toBe(false);
			expect(Int8.isValid(-129)).toBe(false);
			expect(Int8.isValid(42.5)).toBe(false);
		});
	});

	describe("conversions", () => {
		it("toNumber", () => {
			expect(Int8.toNumber(-42)).toBe(-42);
		});

		it("toBigint", () => {
			expect(Int8.toBigint(-42)).toBe(-42n);
		});

		it("toString", () => {
			expect(Int8.toString(-42)).toBe("-42");
		});
	});

	describe("boundary tests", () => {
		it("handles INT8_MIN boundary", () => {
			const min = Int8.from(-128);
			expect(Int8.toNumber(min)).toBe(-128);
			expect(Int8.toHex(min)).toBe("0x80");
			try {
				Int8.minus(min, 1);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerUnderflowError");
			}
		});

		it("handles INT8_MAX boundary", () => {
			const max = Int8.from(127);
			expect(Int8.toNumber(max)).toBe(127);
			expect(Int8.toHex(max)).toBe("0x7f");
			try {
				Int8.plus(max, 1);
				expect.fail("Should throw");
			} catch (e) {
				expect((e as Error).name).toBe("IntegerOverflowError");
			}
		});

		it("handles zero boundary", () => {
			const zero = Int8.from(0);
			expect(Int8.isZero(zero)).toBe(true);
			expect(Int8.isNegative(zero)).toBe(false);
			expect(Int8.isPositive(zero)).toBe(false);
		});
	});
});
