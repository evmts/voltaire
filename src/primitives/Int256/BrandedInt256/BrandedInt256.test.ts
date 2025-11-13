import { describe, expect, it } from "vitest";
import * as Int256 from "./index.js";

describe("Int256 - Constructors", () => {
	it("from: creates from bigint", () => {
		expect(Int256.from(-42n)).toBe(-42n);
		expect(Int256.from(0n)).toBe(0n);
		expect(Int256.from(Int256.MAX)).toBe(Int256.MAX);
		expect(Int256.from(Int256.MIN)).toBe(Int256.MIN);
	});

	it("from: creates from number", () => {
		expect(Int256.from(-42)).toBe(-42n);
		expect(Int256.from(0)).toBe(0n);
		expect(Int256.from(255)).toBe(255n);
	});

	it("from: creates from string", () => {
		expect(Int256.from("-42")).toBe(-42n);
		expect(Int256.from("0")).toBe(0n);
		expect(Int256.from("0xff")).toBe(255n);
	});

	it("from: throws on overflow", () => {
		expect(() => Int256.from(Int256.MAX + 1n)).toThrow("exceeds maximum");
		expect(() => Int256.from(Int256.MIN - 1n)).toThrow("below minimum");
	});
});

describe("Int256 - Two's Complement Encoding (EVM)", () => {
	it("fromHex: handles EVM positive values", () => {
		expect(Int256.fromHex("0x00")).toBe(0n);
		expect(Int256.fromHex("0x7f")).toBe(127n);
		expect(
			Int256.fromHex(
				"0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
			),
		).toBe(Int256.MAX);
	});

	it("fromHex: handles EVM negative values (two's complement)", () => {
		// -1 in EVM
		expect(
			Int256.fromHex(
				"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
			),
		).toBe(-1n);

		// MIN in EVM
		expect(
			Int256.fromHex(
				"0x8000000000000000000000000000000000000000000000000000000000000000",
			),
		).toBe(Int256.MIN);
	});

	it("toHex: encodes EVM two's complement", () => {
		// -1 encodes as all F's
		expect(Int256.toHex(-1n)).toBe(
			"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		);

		// MIN encodes with high bit set
		expect(Int256.toHex(Int256.MIN)).toBe(
			"0x8000000000000000000000000000000000000000000000000000000000000000",
		);

		// MAX encodes as 0x7f...
		expect(Int256.toHex(Int256.MAX)).toBe(
			"0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		);
	});

	it("roundtrip: EVM hex encoding", () => {
		const evmValues = [-1n, 0n, 1n, Int256.MIN, Int256.MAX, -42n, 255n];
		for (const val of evmValues) {
			expect(Int256.fromHex(Int256.toHex(val))).toBe(val);
		}
	});

	it("roundtrip: EVM bytes encoding", () => {
		const evmValues = [-1n, 0n, 1n, Int256.MIN, Int256.MAX, -42n, 255n];
		for (const val of evmValues) {
			expect(Int256.fromBytes(Int256.toBytes(val))).toBe(val);
		}
	});
});

describe("Int256 - EVM SDIV (Signed Division)", () => {
	it("SDIV: truncates toward zero (not floor)", () => {
		// -10 / 3 = -3 (not -4)
		expect(Int256.dividedBy(-10n, 3n)).toBe(-3n);

		// 10 / -3 = -3 (not -4)
		expect(Int256.dividedBy(10n, -3n)).toBe(-3n);

		// -10 / -3 = 3
		expect(Int256.dividedBy(-10n, -3n)).toBe(3n);

		// 10 / 3 = 3
		expect(Int256.dividedBy(10n, 3n)).toBe(3n);
	});

	it("SDIV: handles large negative dividend", () => {
		const large = -(2n ** 200n);
		expect(Int256.dividedBy(large, 2n)).toBe(large / 2n);
	});

	it("SDIV: MIN / -1 overflows (EVM undefined behavior)", () => {
		// In EVM, MIN / -1 overflows because -MIN doesn't fit in Int256
		expect(() => Int256.dividedBy(Int256.MIN, -1n)).toThrow("overflow");
	});

	it("SDIV: division by zero throws", () => {
		expect(() => Int256.dividedBy(10n, 0n)).toThrow("Division by zero");
		expect(() => Int256.dividedBy(-10n, 0n)).toThrow("Division by zero");
	});

	it("SDIV: edge cases", () => {
		expect(Int256.dividedBy(0n, 1n)).toBe(0n);
		expect(Int256.dividedBy(Int256.MAX, 1n)).toBe(Int256.MAX);
		expect(Int256.dividedBy(Int256.MAX, -1n)).toBe(-Int256.MAX);
	});
});

describe("Int256 - EVM SMOD (Signed Modulo)", () => {
	it("SMOD: sign follows dividend", () => {
		// -10 % 3 = -1 (sign of -10)
		expect(Int256.modulo(-10n, 3n)).toBe(-1n);

		// 10 % -3 = 1 (sign of 10)
		expect(Int256.modulo(10n, -3n)).toBe(1n);

		// -10 % -3 = -1 (sign of -10)
		expect(Int256.modulo(-10n, -3n)).toBe(-1n);

		// 10 % 3 = 1
		expect(Int256.modulo(10n, 3n)).toBe(1n);
	});

	it("SMOD: property a = (a/b)*b + (a%b)", () => {
		const testCases = [
			[-10n, 3n],
			[10n, -3n],
			[-10n, -3n],
			[17n, 5n],
			[-17n, 5n],
		];

		for (const [a, b] of testCases) {
			const quotient = Int256.dividedBy(a, b);
			const remainder = Int256.modulo(a, b);
			expect(quotient * b + remainder).toBe(a);
		}
	});

	it("SMOD: division by zero throws", () => {
		expect(() => Int256.modulo(10n, 0n)).toThrow("Division by zero");
		expect(() => Int256.modulo(-10n, 0n)).toThrow("Division by zero");
	});

	it("SMOD: edge cases", () => {
		expect(Int256.modulo(0n, 1n)).toBe(0n);
		expect(Int256.modulo(Int256.MAX, 2n)).toBe(1n);
	});
});

describe("Int256 - EVM SLT/SGT (Signed Comparison)", () => {
	it("SLT: signed less than", () => {
		// Negative < Positive
		expect(Int256.lessThan(-1n, 0n)).toBe(true);
		expect(Int256.lessThan(-1n, 1n)).toBe(true);

		// MIN is smallest value
		expect(Int256.lessThan(Int256.MIN, Int256.MAX)).toBe(true);
		expect(Int256.lessThan(Int256.MIN, 0n)).toBe(true);
		expect(Int256.lessThan(Int256.MIN, -1n)).toBe(true);

		// Comparison with same sign
		expect(Int256.lessThan(-42n, -10n)).toBe(true);
		expect(Int256.lessThan(10n, 42n)).toBe(true);
	});

	it("SGT: signed greater than", () => {
		// Positive > Negative
		expect(Int256.greaterThan(0n, -1n)).toBe(true);
		expect(Int256.greaterThan(1n, -1n)).toBe(true);

		// MAX is largest value
		expect(Int256.greaterThan(Int256.MAX, Int256.MIN)).toBe(true);
		expect(Int256.greaterThan(Int256.MAX, 0n)).toBe(true);
		expect(Int256.greaterThan(Int256.MAX, -1n)).toBe(true);

		// Comparison with same sign
		expect(Int256.greaterThan(-10n, -42n)).toBe(true);
		expect(Int256.greaterThan(42n, 10n)).toBe(true);
	});

	it("signed comparison edge cases", () => {
		expect(Int256.lessThan(Int256.MIN, Int256.MAX)).toBe(true);
		expect(Int256.greaterThan(Int256.MAX, Int256.MIN)).toBe(true);
		expect(Int256.equals(Int256.MIN, Int256.MIN)).toBe(true);
		expect(Int256.equals(Int256.MAX, Int256.MAX)).toBe(true);
	});
});

describe("Int256 - EVM SAR (Arithmetic Right Shift)", () => {
	it("SAR: preserves sign bit", () => {
		// -256 >> 1 = -128 (sign preserved)
		expect(Int256.shiftRight(-256n, 1)).toBe(-128n);

		// -1 >> 8 = -1 (all 1s remain)
		expect(Int256.shiftRight(-1n, 8)).toBe(-1n);

		// Positive values shift normally
		expect(Int256.shiftRight(256n, 1)).toBe(128n);
	});

	it("SAR: large shifts", () => {
		// Negative shifts to all 1s (-1)
		expect(Int256.shiftRight(-1n, 255)).toBe(-1n);
		expect(Int256.shiftRight(-100n, 300)).toBe(-1n);

		// Positive shifts to 0
		expect(Int256.shiftRight(100n, 255)).toBe(0n);
		expect(Int256.shiftRight(100n, 300)).toBe(0n);
	});

	it("SAR: MIN right shift", () => {
		// MIN >> 1 = MIN / 2 (sign preserved)
		expect(Int256.shiftRight(Int256.MIN, 1)).toBe(Int256.MIN / 2n);
	});

	it("SAR: equivalent to floor division by power of 2 for negative", () => {
		const testCases = [
			[-256n, 1],
			[-100n, 2],
			[-1000n, 3],
		];

		for (const [value, shift] of testCases) {
			const sarResult = Int256.shiftRight(value, shift);
			const divResult = value >> BigInt(shift);
			expect(sarResult).toBe(divResult);
		}
	});
});

describe("Int256 - Arithmetic", () => {
	it("plus: adds with wrapping", () => {
		expect(Int256.plus(-10n, 5n)).toBe(-5n);
		expect(Int256.plus(Int256.MAX, 1n)).toBe(Int256.MIN);
	});

	it("minus: subtracts with wrapping", () => {
		expect(Int256.minus(10n, 5n)).toBe(5n);
		expect(Int256.minus(Int256.MIN, 1n)).toBe(Int256.MAX);
	});

	it("times: multiplies with wrapping", () => {
		expect(Int256.times(10n, -5n)).toBe(-50n);
		expect(Int256.times(-10n, -5n)).toBe(50n);
	});

	it("abs: returns absolute value", () => {
		expect(Int256.abs(-42n)).toBe(42n);
		expect(() => Int256.abs(Int256.MIN)).toThrow("overflow");
	});

	it("negate: negates with wrapping", () => {
		expect(Int256.negate(42n)).toBe(-42n);
		expect(Int256.negate(Int256.MIN)).toBe(Int256.MIN);
	});
});

describe("Int256 - Bitwise", () => {
	it("bitwiseAnd: AND operation", () => {
		expect(Int256.bitwiseAnd(0x0fn, 0x07n)).toBe(0x07n);
	});

	it("bitwiseOr: OR operation", () => {
		expect(Int256.bitwiseOr(0x0fn, 0x70n)).toBe(0x7fn);
	});

	it("bitwiseXor: XOR operation", () => {
		expect(Int256.bitwiseXor(0x0fn, 0x07n)).toBe(0x08n);
	});

	it("bitwiseNot: NOT operation", () => {
		expect(Int256.bitwiseNot(0n)).toBe(-1n);
	});

	it("shiftLeft: left shift", () => {
		expect(Int256.shiftLeft(1n, 8)).toBe(256n);
	});
});

describe("Int256 - Comparison", () => {
	it("equals: equality", () => {
		expect(Int256.equals(-42n, -42n)).toBe(true);
		expect(Int256.equals(-42n, 42n)).toBe(false);
	});

	it("isZero: checks zero", () => {
		expect(Int256.isZero(0n)).toBe(true);
		expect(Int256.isZero(1n)).toBe(false);
	});

	it("isNegative: checks sign", () => {
		expect(Int256.isNegative(-1n)).toBe(true);
		expect(Int256.isNegative(0n)).toBe(false);
	});

	it("isPositive: checks sign", () => {
		expect(Int256.isPositive(1n)).toBe(true);
		expect(Int256.isPositive(0n)).toBe(false);
	});

	it("sign: returns sign indicator", () => {
		expect(Int256.sign(-42n)).toBe(-1);
		expect(Int256.sign(0n)).toBe(0);
		expect(Int256.sign(42n)).toBe(1);
	});
});

describe("Int256 - Utilities", () => {
	it("bitLength: counts significant bits", () => {
		expect(Int256.bitLength(0n)).toBe(0);
		expect(Int256.bitLength(255n)).toBe(8);
	});

	it("leadingZeros: counts leading zeros", () => {
		expect(Int256.leadingZeros(0n)).toBe(256);
		expect(Int256.leadingZeros(1n)).toBe(255);
	});

	it("popCount: counts set bits", () => {
		expect(Int256.popCount(0n)).toBe(0);
		expect(Int256.popCount(0x0fn)).toBe(4);
		expect(Int256.popCount(-1n)).toBe(256);
	});

	it("isValid: validates range", () => {
		expect(Int256.isValid(0n)).toBe(true);
		expect(Int256.isValid(Int256.MIN)).toBe(true);
		expect(Int256.isValid(Int256.MAX)).toBe(true);
		expect(Int256.isValid(Int256.MAX + 1n)).toBe(false);
	});
});

describe("Int256 - Edge Cases", () => {
	it("boundary values", () => {
		expect(Int256.MIN).toBe(-(2n ** 255n));
		expect(Int256.MAX).toBe(2n ** 255n - 1n);
	});

	it("constants", () => {
		expect(Int256.ZERO).toBe(0n);
		expect(Int256.ONE).toBe(1n);
		expect(Int256.NEG_ONE).toBe(-1n);
		expect(Int256.SIZE).toBe(32);
		expect(Int256.BITS).toBe(256);
	});
});
