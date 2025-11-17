import { describe, expect, it } from "vitest";
import * as Int128 from "./index.js";

describe("Int128 - Constructors", () => {
	it("from: creates from bigint", () => {
		expect(Int128.from(-42n)).toBe(-42n);
		expect(Int128.from(0n)).toBe(0n);
		expect(Int128.from(Int128.MAX)).toBe(Int128.MAX);
		expect(Int128.from(Int128.MIN)).toBe(Int128.MIN);
	});

	it("from: creates from number", () => {
		expect(Int128.from(-42)).toBe(-42n);
		expect(Int128.from(0)).toBe(0n);
		expect(Int128.from(255)).toBe(255n);
	});

	it("from: creates from string", () => {
		expect(Int128.from("-42")).toBe(-42n);
		expect(Int128.from("0")).toBe(0n);
		expect(Int128.from("0xff")).toBe(255n);
	});

	it("from: throws on non-integer", () => {
		expect(() => Int128.from(3.14)).toThrow("must be an integer");
	});

	it("from: throws on overflow", () => {
		expect(() => Int128.from(Int128.MAX + 1n)).toThrow("exceeds maximum");
		expect(() => Int128.from(Int128.MIN - 1n)).toThrow("below minimum");
	});

	it("fromNumber: validates range", () => {
		expect(Int128.fromNumber(-100)).toBe(-100n);
		expect(Int128.fromNumber(100)).toBe(100n);
		expect(() => Int128.fromNumber(3.14)).toThrow();
	});

	it("fromBigInt: validates range", () => {
		expect(Int128.fromBigInt(-100n)).toBe(-100n);
		expect(Int128.fromBigInt(100n)).toBe(100n);
		expect(() => Int128.fromBigInt(Int128.MAX + 1n)).toThrow();
	});
});

describe("Int128 - Two's Complement Encoding", () => {
	it("fromHex: handles positive values", () => {
		expect(Int128.fromHex("0x00")).toBe(0n);
		expect(Int128.fromHex("0x7f")).toBe(127n);
		expect(Int128.fromHex("0x7fffffffffffffffffffffffffffffff")).toBe(
			Int128.MAX,
		);
	});

	it("fromHex: handles negative values (two's complement)", () => {
		expect(Int128.fromHex("0xffffffffffffffffffffffffffffffff")).toBe(-1n);
		expect(Int128.fromHex("0x80000000000000000000000000000000")).toBe(
			Int128.MIN,
		);
		expect(Int128.fromHex("0xff")).toBe(255n); // Positive (no high bit in 128-bit context)
	});

	it("fromBytes: handles two's complement", () => {
		const negOne = new Uint8Array(16).fill(0xff);
		expect(Int128.fromBytes(negOne)).toBe(-1n);

		const min = new Uint8Array(16);
		min[0] = 0x80;
		expect(Int128.fromBytes(min)).toBe(Int128.MIN);

		const max = new Uint8Array(16).fill(0xff);
		max[0] = 0x7f;
		expect(Int128.fromBytes(max)).toBe(Int128.MAX);
	});

	it("toHex: encodes two's complement", () => {
		expect(Int128.toHex(-1n)).toBe("0xffffffffffffffffffffffffffffffff");
		expect(Int128.toHex(Int128.MIN)).toBe("0x80000000000000000000000000000000");
		expect(Int128.toHex(Int128.MAX)).toBe("0x7fffffffffffffffffffffffffffffff");
		expect(Int128.toHex(255n)).toBe("0x000000000000000000000000000000ff");
	});

	it("toBytes: encodes two's complement", () => {
		const negOne = Int128.toBytes(-1n);
		expect(Array.from(negOne)).toEqual(Array(16).fill(0xff));

		const min = Int128.toBytes(Int128.MIN);
		expect(min[0]).toBe(0x80);
		expect(min.slice(1)).toEqual(new Uint8Array(15));
	});

	it("roundtrip: hex encoding", () => {
		const values = [-1n, 0n, 1n, Int128.MIN, Int128.MAX, -42n, 255n];
		for (const val of values) {
			expect(Int128.fromHex(Int128.toHex(val))).toBe(val);
		}
	});

	it("roundtrip: bytes encoding", () => {
		const values = [-1n, 0n, 1n, Int128.MIN, Int128.MAX, -42n, 255n];
		for (const val of values) {
			expect(Int128.fromBytes(Int128.toBytes(val))).toBe(val);
		}
	});
});

describe("Int128 - Arithmetic", () => {
	it("plus: adds values", () => {
		expect(Int128.plus(-10n, 5n)).toBe(-5n);
		expect(Int128.plus(-10n, -5n)).toBe(-15n);
		expect(Int128.plus(10n, 5n)).toBe(15n);
	});

	it("plus: wraps on overflow", () => {
		const result = Int128.plus(Int128.MAX, 1n);
		expect(result).toBe(Int128.MIN);
	});

	it("minus: subtracts values", () => {
		expect(Int128.minus(10n, 5n)).toBe(5n);
		expect(Int128.minus(-10n, 5n)).toBe(-15n);
		expect(Int128.minus(10n, -5n)).toBe(15n);
	});

	it("minus: wraps on underflow", () => {
		const result = Int128.minus(Int128.MIN, 1n);
		expect(result).toBe(Int128.MAX);
	});

	it("times: multiplies values", () => {
		expect(Int128.times(10n, 5n)).toBe(50n);
		expect(Int128.times(-10n, 5n)).toBe(-50n);
		expect(Int128.times(-10n, -5n)).toBe(50n);
	});

	it("times: wraps on overflow", () => {
		const result = Int128.times(Int128.MAX, 2n);
		expect(result).not.toBe(Int128.MAX * 2n); // Should wrap
	});

	it("dividedBy: divides truncating toward zero", () => {
		expect(Int128.dividedBy(10n, 3n)).toBe(3n);
		expect(Int128.dividedBy(-10n, 3n)).toBe(-3n); // Not -4
		expect(Int128.dividedBy(10n, -3n)).toBe(-3n); // Not -4
		expect(Int128.dividedBy(-10n, -3n)).toBe(3n);
	});

	it("dividedBy: throws on division by zero", () => {
		expect(() => Int128.dividedBy(10n, 0n)).toThrow("Division by zero");
	});

	it("dividedBy: throws on MIN / -1 overflow", () => {
		expect(() => Int128.dividedBy(Int128.MIN, -1n)).toThrow("overflow");
	});

	it("modulo: sign follows dividend", () => {
		expect(Int128.modulo(10n, 3n)).toBe(1n);
		expect(Int128.modulo(-10n, 3n)).toBe(-1n); // Not 2
		expect(Int128.modulo(10n, -3n)).toBe(1n); // Not -2
		expect(Int128.modulo(-10n, -3n)).toBe(-1n);
	});

	it("modulo: throws on division by zero", () => {
		expect(() => Int128.modulo(10n, 0n)).toThrow("Division by zero");
	});

	it("abs: returns absolute value", () => {
		expect(Int128.abs(-42n)).toBe(42n);
		expect(Int128.abs(42n)).toBe(42n);
		expect(Int128.abs(0n)).toBe(0n);
	});

	it("abs: throws on MIN", () => {
		expect(() => Int128.abs(Int128.MIN)).toThrow("overflow");
	});

	it("negate: negates value", () => {
		expect(Int128.negate(42n)).toBe(-42n);
		expect(Int128.negate(-42n)).toBe(42n);
		expect(Int128.negate(0n)).toBe(0n);
	});

	it("negate: wraps MIN", () => {
		expect(Int128.negate(Int128.MIN)).toBe(Int128.MIN);
	});
});

describe("Int128 - Comparison", () => {
	it("equals: compares equality", () => {
		expect(Int128.equals(-42n, -42n)).toBe(true);
		expect(Int128.equals(-42n, 42n)).toBe(false);
		expect(Int128.equals(0n, 0n)).toBe(true);
	});

	it("lessThan: signed comparison", () => {
		expect(Int128.lessThan(-1n, 0n)).toBe(true);
		expect(Int128.lessThan(0n, -1n)).toBe(false);
		expect(Int128.lessThan(-42n, -10n)).toBe(true);
		expect(Int128.lessThan(Int128.MIN, Int128.MAX)).toBe(true);
	});

	it("greaterThan: signed comparison", () => {
		expect(Int128.greaterThan(0n, -1n)).toBe(true);
		expect(Int128.greaterThan(-1n, 0n)).toBe(false);
		expect(Int128.greaterThan(-10n, -42n)).toBe(true);
		expect(Int128.greaterThan(Int128.MAX, Int128.MIN)).toBe(true);
	});

	it("isZero: checks zero", () => {
		expect(Int128.isZero(0n)).toBe(true);
		expect(Int128.isZero(1n)).toBe(false);
		expect(Int128.isZero(-1n)).toBe(false);
	});

	it("isNegative: checks sign", () => {
		expect(Int128.isNegative(-1n)).toBe(true);
		expect(Int128.isNegative(0n)).toBe(false);
		expect(Int128.isNegative(1n)).toBe(false);
		expect(Int128.isNegative(Int128.MIN)).toBe(true);
	});

	it("isPositive: checks sign", () => {
		expect(Int128.isPositive(1n)).toBe(true);
		expect(Int128.isPositive(0n)).toBe(false);
		expect(Int128.isPositive(-1n)).toBe(false);
		expect(Int128.isPositive(Int128.MAX)).toBe(true);
	});

	it("sign: returns sign indicator", () => {
		expect(Int128.sign(-42n)).toBe(-1);
		expect(Int128.sign(0n)).toBe(0);
		expect(Int128.sign(42n)).toBe(1);
	});

	it("minimum: returns smaller value", () => {
		expect(Int128.minimum(-42n, 10n)).toBe(-42n);
		expect(Int128.minimum(10n, 5n)).toBe(5n);
		expect(Int128.minimum(Int128.MIN, Int128.MAX)).toBe(Int128.MIN);
	});

	it("maximum: returns larger value", () => {
		expect(Int128.maximum(-42n, 10n)).toBe(10n);
		expect(Int128.maximum(10n, 5n)).toBe(10n);
		expect(Int128.maximum(Int128.MIN, Int128.MAX)).toBe(Int128.MAX);
	});
});

describe("Int128 - Bitwise", () => {
	it("bitwiseAnd: AND operation", () => {
		expect(Int128.bitwiseAnd(0x0fn, 0x07n)).toBe(0x07n);
		expect(Int128.bitwiseAnd(-1n, 0xffn)).toBe(0xffn);
	});

	it("bitwiseOr: OR operation", () => {
		expect(Int128.bitwiseOr(0x0fn, 0x70n)).toBe(0x7fn);
		expect(Int128.bitwiseOr(-1n, 0n)).toBe(-1n);
	});

	it("bitwiseXor: XOR operation", () => {
		expect(Int128.bitwiseXor(0x0fn, 0x07n)).toBe(0x08n);
		expect(Int128.bitwiseXor(-1n, -1n)).toBe(0n);
	});

	it("bitwiseNot: NOT operation", () => {
		expect(Int128.bitwiseNot(0n)).toBe(-1n);
		expect(Int128.bitwiseNot(-1n)).toBe(0n);
	});

	it("shiftLeft: left shift", () => {
		expect(Int128.shiftLeft(1n, 8)).toBe(256n);
		expect(Int128.shiftLeft(1n, 0)).toBe(1n);
	});

	it("shiftRight: arithmetic right shift (sign-preserving)", () => {
		expect(Int128.shiftRight(-256n, 1)).toBe(-128n);
		expect(Int128.shiftRight(256n, 1)).toBe(128n);
		expect(Int128.shiftRight(-1n, 8)).toBe(-1n);
	});

	it("shiftRight: large shifts", () => {
		expect(Int128.shiftRight(-1n, 200)).toBe(-1n);
		expect(Int128.shiftRight(1n, 200)).toBe(0n);
	});
});

describe("Int128 - Utilities", () => {
	it("bitLength: counts significant bits", () => {
		expect(Int128.bitLength(0n)).toBe(0);
		expect(Int128.bitLength(255n)).toBe(8);
		expect(Int128.bitLength(256n)).toBe(9);
	});

	it("leadingZeros: counts leading zeros", () => {
		expect(Int128.leadingZeros(0n)).toBe(128);
		expect(Int128.leadingZeros(1n)).toBe(127);
		expect(Int128.leadingZeros(255n)).toBe(120);
	});

	it("popCount: counts set bits", () => {
		expect(Int128.popCount(0n)).toBe(0);
		expect(Int128.popCount(0x0fn)).toBe(4);
		expect(Int128.popCount(-1n)).toBe(128);
	});

	it("isValid: validates range", () => {
		expect(Int128.isValid(0n)).toBe(true);
		expect(Int128.isValid(Int128.MIN)).toBe(true);
		expect(Int128.isValid(Int128.MAX)).toBe(true);
		expect(Int128.isValid(Int128.MAX + 1n)).toBe(false);
		expect(Int128.isValid(Int128.MIN - 1n)).toBe(false);
	});

	it("toNumber: converts to number", () => {
		expect(Int128.toNumber(-42n)).toBe(-42);
		expect(Int128.toNumber(0n)).toBe(0);
		expect(Int128.toNumber(42n)).toBe(42);
	});

	it("toNumber: throws on overflow", () => {
		expect(() => Int128.toNumber(Int128.MAX)).toThrow();
		expect(() => Int128.toNumber(Int128.MIN)).toThrow();
	});

	it("toBigInt: converts to bigint", () => {
		expect(Int128.toBigInt(-42n)).toBe(-42n);
		expect(Int128.toBigInt(0n)).toBe(0n);
	});

	it("toString: converts to string", () => {
		expect(Int128.toString(-42n)).toBe("-42");
		expect(Int128.toString(0n)).toBe("0");
		expect(Int128.toString(42n)).toBe("42");
	});
});

describe("Int128 - Edge Cases", () => {
	it("boundary values", () => {
		expect(Int128.isValid(Int128.MIN)).toBe(true);
		expect(Int128.isValid(Int128.MAX)).toBe(true);
		expect(Int128.MIN).toBe(-(2n ** 127n));
		expect(Int128.MAX).toBe(2n ** 127n - 1n);
	});

	it("constants", () => {
		expect(Int128.ZERO).toBe(0n);
		expect(Int128.ONE).toBe(1n);
		expect(Int128.NEG_ONE).toBe(-1n);
		expect(Int128.SIZE).toBe(16);
		expect(Int128.BITS).toBe(128);
	});
});
