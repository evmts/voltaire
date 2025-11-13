import { describe, expect, it } from "vitest";
import * as Uint128 from "./index.js";

describe("Uint128 - Constants", () => {
	it("should have correct SIZE", () => {
		expect(Uint128.SIZE).toBe(16);
	});

	it("should have correct MAX", () => {
		expect(Uint128.MAX).toBe(340282366920938463463374607431768211455n);
		expect(Uint128.MAX).toBe((1n << 128n) - 1n);
	});

	it("should have correct MIN", () => {
		expect(Uint128.MIN).toBe(0n);
	});

	it("should have correct ZERO", () => {
		expect(Uint128.ZERO).toBe(0n);
	});

	it("should have correct ONE", () => {
		expect(Uint128.ONE).toBe(1n);
	});
});

describe("Uint128 - from", () => {
	it("should create from bigint", () => {
		expect(Uint128.from(100n)).toBe(100n);
		expect(Uint128.from(0n)).toBe(0n);
		expect(Uint128.from(Uint128.MAX)).toBe(Uint128.MAX);
	});

	it("should create from number", () => {
		expect(Uint128.from(100)).toBe(100n);
		expect(Uint128.from(0)).toBe(0n);
	});

	it("should create from decimal string", () => {
		expect(Uint128.from("100")).toBe(100n);
		expect(Uint128.from("0")).toBe(0n);
	});

	it("should create from hex string", () => {
		expect(Uint128.from("0xff")).toBe(255n);
		expect(Uint128.from("0xFF")).toBe(255n);
	});

	it("should reject negative values", () => {
		expect(() => Uint128.from(-1n)).toThrow("cannot be negative");
		expect(() => Uint128.from(-1)).toThrow("cannot be negative");
	});

	it("should reject values exceeding MAX", () => {
		expect(() => Uint128.from(Uint128.MAX + 1n)).toThrow("exceeds maximum");
		expect(() => Uint128.from((1n << 128n))).toThrow("exceeds maximum");
	});

	it("should reject non-integer numbers", () => {
		expect(() => Uint128.from(1.5)).toThrow("must be an integer");
	});
});

describe("Uint128 - fromBigInt", () => {
	it("should create from bigint", () => {
		expect(Uint128.fromBigInt(100n)).toBe(100n);
		expect(Uint128.fromBigInt(Uint128.MAX)).toBe(Uint128.MAX);
	});

	it("should reject out of range", () => {
		expect(() => Uint128.fromBigInt(-1n)).toThrow();
		expect(() => Uint128.fromBigInt(Uint128.MAX + 1n)).toThrow();
	});
});

describe("Uint128 - fromNumber", () => {
	it("should create from number", () => {
		expect(Uint128.fromNumber(100)).toBe(100n);
		expect(Uint128.fromNumber(0)).toBe(0n);
	});

	it("should reject non-integer", () => {
		expect(() => Uint128.fromNumber(1.5)).toThrow();
	});
});

describe("Uint128 - fromHex", () => {
	it("should create from hex with 0x prefix", () => {
		expect(Uint128.fromHex("0xff")).toBe(255n);
		expect(Uint128.fromHex("0x0")).toBe(0n);
	});

	it("should create from hex without prefix", () => {
		expect(Uint128.fromHex("ff")).toBe(255n);
		expect(Uint128.fromHex("0")).toBe(0n);
	});
});

describe("Uint128 - fromBytes", () => {
	it("should create from 16-byte array", () => {
		const bytes = new Uint8Array(16);
		bytes[15] = 255;
		expect(Uint128.fromBytes(bytes)).toBe(255n);
	});

	it("should create from shorter byte array", () => {
		const bytes = new Uint8Array([255]);
		expect(Uint128.fromBytes(bytes)).toBe(255n);
	});

	it("should handle big-endian", () => {
		const bytes = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]);
		expect(Uint128.fromBytes(bytes)).toBe(256n);
	});

	it("should reject >16 bytes", () => {
		const bytes = new Uint8Array(17);
		expect(() => Uint128.fromBytes(bytes)).toThrow("exceeds 16");
	});
});

describe("Uint128 - fromAbiEncoded", () => {
	it("should decode from 32-byte ABI encoding", () => {
		const bytes = new Uint8Array(32);
		bytes[31] = 255;
		expect(Uint128.fromAbiEncoded(bytes)).toBe(255n);
	});

	it("should extract last 16 bytes", () => {
		const bytes = new Uint8Array(32);
		bytes[16] = 1;
		bytes[31] = 0;
		expect(Uint128.fromAbiEncoded(bytes)).toBe(1n << 120n);
	});

	it("should reject non-32 byte input", () => {
		expect(() => Uint128.fromAbiEncoded(new Uint8Array(16))).toThrow("must be 32 bytes");
		expect(() => Uint128.fromAbiEncoded(new Uint8Array(33))).toThrow("must be 32 bytes");
	});
});

describe("Uint128 - tryFrom", () => {
	it("should return value on success", () => {
		expect(Uint128.tryFrom(100n)).toBe(100n);
		expect(Uint128.tryFrom("255")).toBe(255n);
	});

	it("should return null on failure", () => {
		expect(Uint128.tryFrom(-1)).toBe(null);
		expect(Uint128.tryFrom(Uint128.MAX + 1n)).toBe(null);
		expect(Uint128.tryFrom(1.5)).toBe(null);
	});
});

describe("Uint128 - toBigInt", () => {
	it("should convert to bigint", () => {
		expect(Uint128.toBigInt(Uint128.from(100n))).toBe(100n);
		expect(Uint128.toBigInt(Uint128.from(0n))).toBe(0n);
	});
});

describe("Uint128 - toNumber", () => {
	it("should convert to number", () => {
		expect(Uint128.toNumber(Uint128.from(100n))).toBe(100);
		expect(Uint128.toNumber(Uint128.from(0n))).toBe(0);
	});

	it("should throw on overflow", () => {
		const large = Uint128.from(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
		expect(() => Uint128.toNumber(large)).toThrow("exceeds Number.MAX_SAFE_INTEGER");
	});

	it("should handle MAX_SAFE_INTEGER", () => {
		const value = Uint128.from(BigInt(Number.MAX_SAFE_INTEGER));
		expect(Uint128.toNumber(value)).toBe(Number.MAX_SAFE_INTEGER);
	});
});

describe("Uint128 - toHex", () => {
	it("should convert to hex", () => {
		expect(Uint128.toHex(Uint128.from(255n))).toBe("0xff");
		expect(Uint128.toHex(Uint128.from(0n))).toBe("0x0");
	});

	it("should handle large values", () => {
		expect(Uint128.toHex(Uint128.MAX)).toBe("0xffffffffffffffffffffffffffffffff");
	});
});

describe("Uint128 - toBytes", () => {
	it("should convert to 16 bytes", () => {
		const bytes = Uint128.toBytes(Uint128.from(255n));
		expect(bytes.length).toBe(16);
		expect(bytes[15]).toBe(255);
		for (let i = 0; i < 15; i++) {
			expect(bytes[i]).toBe(0);
		}
	});

	it("should handle big-endian", () => {
		const bytes = Uint128.toBytes(Uint128.from(256n));
		expect(bytes[14]).toBe(1);
		expect(bytes[15]).toBe(0);
	});

	it("should handle MAX", () => {
		const bytes = Uint128.toBytes(Uint128.MAX);
		for (let i = 0; i < 16; i++) {
			expect(bytes[i]).toBe(255);
		}
	});

	it("should round-trip with fromBytes", () => {
		const original = Uint128.from(123456789n);
		const bytes = Uint128.toBytes(original);
		const restored = Uint128.fromBytes(bytes);
		expect(restored).toBe(original);
	});
});

describe("Uint128 - toAbiEncoded", () => {
	it("should encode to 32 bytes", () => {
		const bytes = Uint128.toAbiEncoded(Uint128.from(255n));
		expect(bytes.length).toBe(32);
		expect(bytes[31]).toBe(255);
		for (let i = 0; i < 31; i++) {
			expect(bytes[i]).toBe(0);
		}
	});

	it("should round-trip with fromAbiEncoded", () => {
		const original = Uint128.from(123456789n);
		const encoded = Uint128.toAbiEncoded(original);
		const decoded = Uint128.fromAbiEncoded(encoded);
		expect(decoded).toBe(original);
	});
});

describe("Uint128 - toString", () => {
	it("should convert to decimal string", () => {
		expect(Uint128.toString(Uint128.from(100n))).toBe("100");
		expect(Uint128.toString(Uint128.from(0n))).toBe("0");
		expect(Uint128.toString(Uint128.MAX)).toBe("340282366920938463463374607431768211455");
	});
});

describe("Uint128 - plus", () => {
	it("should add values", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(50n);
		expect(Uint128.plus(a, b)).toBe(150n);
	});

	it("should wrap on overflow", () => {
		const a = Uint128.MAX;
		const b = Uint128.from(1n);
		expect(Uint128.plus(a, b)).toBe(0n);
	});

	it("should wrap large overflow", () => {
		const a = Uint128.MAX;
		const b = Uint128.from(10n);
		expect(Uint128.plus(a, b)).toBe(9n);
	});
});

describe("Uint128 - minus", () => {
	it("should subtract values", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(50n);
		expect(Uint128.minus(a, b)).toBe(50n);
	});

	it("should wrap on underflow", () => {
		const a = Uint128.from(0n);
		const b = Uint128.from(1n);
		expect(Uint128.minus(a, b)).toBe(Uint128.MAX);
	});

	it("should wrap large underflow", () => {
		const a = Uint128.from(5n);
		const b = Uint128.from(10n);
		expect(Uint128.minus(a, b)).toBe(Uint128.MAX - 4n);
	});
});

describe("Uint128 - times", () => {
	it("should multiply values", () => {
		const a = Uint128.from(10n);
		const b = Uint128.from(5n);
		expect(Uint128.times(a, b)).toBe(50n);
	});

	it("should wrap on overflow", () => {
		const a = Uint128.MAX;
		const b = Uint128.from(2n);
		expect(Uint128.times(a, b)).toBe(Uint128.MAX - 1n);
	});

	it("should handle zero", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(0n);
		expect(Uint128.times(a, b)).toBe(0n);
	});
});

describe("Uint128 - dividedBy", () => {
	it("should divide values", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(5n);
		expect(Uint128.dividedBy(a, b)).toBe(20n);
	});

	it("should handle integer division", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(7n);
		expect(Uint128.dividedBy(a, b)).toBe(14n);
	});

	it("should throw on division by zero", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(0n);
		expect(() => Uint128.dividedBy(a, b)).toThrow("Division by zero");
	});
});

describe("Uint128 - modulo", () => {
	it("should calculate remainder", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(7n);
		expect(Uint128.modulo(a, b)).toBe(2n);
	});

	it("should handle exact division", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(5n);
		expect(Uint128.modulo(a, b)).toBe(0n);
	});

	it("should throw on modulo by zero", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(0n);
		expect(() => Uint128.modulo(a, b)).toThrow("Modulo by zero");
	});
});

describe("Uint128 - toPower", () => {
	it("should calculate power", () => {
		const base = Uint128.from(2n);
		const exp = Uint128.from(10n);
		expect(Uint128.toPower(base, exp)).toBe(1024n);
	});

	it("should handle zero exponent", () => {
		const base = Uint128.from(100n);
		const exp = Uint128.from(0n);
		expect(Uint128.toPower(base, exp)).toBe(1n);
	});

	it("should handle one exponent", () => {
		const base = Uint128.from(100n);
		const exp = Uint128.from(1n);
		expect(Uint128.toPower(base, exp)).toBe(100n);
	});

	it("should wrap on overflow", () => {
		const base = Uint128.from(2n);
		const exp = Uint128.from(128n);
		expect(Uint128.toPower(base, exp)).toBe(0n);
	});

	it("should handle large exponents with wrapping", () => {
		const base = Uint128.from(2n);
		const exp = Uint128.from(127n);
		expect(Uint128.toPower(base, exp)).toBe(1n << 127n);
	});
});

describe("Uint128 - equals", () => {
	it("should compare equal values", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(100n);
		expect(Uint128.equals(a, b)).toBe(true);
	});

	it("should compare unequal values", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(50n);
		expect(Uint128.equals(a, b)).toBe(false);
	});
});

describe("Uint128 - notEquals", () => {
	it("should compare unequal values", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(50n);
		expect(Uint128.notEquals(a, b)).toBe(true);
	});

	it("should compare equal values", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(100n);
		expect(Uint128.notEquals(a, b)).toBe(false);
	});
});

describe("Uint128 - lessThan", () => {
	it("should compare less than", () => {
		const a = Uint128.from(50n);
		const b = Uint128.from(100n);
		expect(Uint128.lessThan(a, b)).toBe(true);
		expect(Uint128.lessThan(b, a)).toBe(false);
	});

	it("should handle equal values", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(100n);
		expect(Uint128.lessThan(a, b)).toBe(false);
	});
});

describe("Uint128 - lessThanOrEqual", () => {
	it("should compare less than or equal", () => {
		const a = Uint128.from(50n);
		const b = Uint128.from(100n);
		expect(Uint128.lessThanOrEqual(a, b)).toBe(true);
		expect(Uint128.lessThanOrEqual(b, a)).toBe(false);
	});

	it("should handle equal values", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(100n);
		expect(Uint128.lessThanOrEqual(a, b)).toBe(true);
	});
});

describe("Uint128 - greaterThan", () => {
	it("should compare greater than", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(50n);
		expect(Uint128.greaterThan(a, b)).toBe(true);
		expect(Uint128.greaterThan(b, a)).toBe(false);
	});

	it("should handle equal values", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(100n);
		expect(Uint128.greaterThan(a, b)).toBe(false);
	});
});

describe("Uint128 - greaterThanOrEqual", () => {
	it("should compare greater than or equal", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(50n);
		expect(Uint128.greaterThanOrEqual(a, b)).toBe(true);
		expect(Uint128.greaterThanOrEqual(b, a)).toBe(false);
	});

	it("should handle equal values", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(100n);
		expect(Uint128.greaterThanOrEqual(a, b)).toBe(true);
	});
});

describe("Uint128 - minimum", () => {
	it("should return minimum", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(50n);
		expect(Uint128.minimum(a, b)).toBe(50n);
		expect(Uint128.minimum(b, a)).toBe(50n);
	});

	it("should handle equal values", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(100n);
		expect(Uint128.minimum(a, b)).toBe(100n);
	});
});

describe("Uint128 - maximum", () => {
	it("should return maximum", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(50n);
		expect(Uint128.maximum(a, b)).toBe(100n);
		expect(Uint128.maximum(b, a)).toBe(100n);
	});

	it("should handle equal values", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(100n);
		expect(Uint128.maximum(a, b)).toBe(100n);
	});
});

describe("Uint128 - min", () => {
	it("should return minimum from array", () => {
		const values = [
			Uint128.from(100n),
			Uint128.from(50n),
			Uint128.from(75n),
			Uint128.from(25n),
		];
		expect(Uint128.min(values)).toBe(25n);
	});

	it("should handle single element", () => {
		expect(Uint128.min([Uint128.from(100n)])).toBe(100n);
	});

	it("should throw on empty array", () => {
		expect(() => Uint128.min([])).toThrow("empty array");
	});
});

describe("Uint128 - max", () => {
	it("should return maximum from array", () => {
		const values = [
			Uint128.from(100n),
			Uint128.from(50n),
			Uint128.from(75n),
			Uint128.from(125n),
		];
		expect(Uint128.max(values)).toBe(125n);
	});

	it("should handle single element", () => {
		expect(Uint128.max([Uint128.from(100n)])).toBe(100n);
	});

	it("should throw on empty array", () => {
		expect(() => Uint128.max([])).toThrow("empty array");
	});
});

describe("Uint128 - bitwiseAnd", () => {
	it("should perform AND", () => {
		const a = Uint128.from(0xffn);
		const b = Uint128.from(0x0fn);
		expect(Uint128.bitwiseAnd(a, b)).toBe(0x0fn);
	});

	it("should handle zero", () => {
		const a = Uint128.from(0xffn);
		const b = Uint128.from(0n);
		expect(Uint128.bitwiseAnd(a, b)).toBe(0n);
	});
});

describe("Uint128 - bitwiseOr", () => {
	it("should perform OR", () => {
		const a = Uint128.from(0xf0n);
		const b = Uint128.from(0x0fn);
		expect(Uint128.bitwiseOr(a, b)).toBe(0xffn);
	});

	it("should handle zero", () => {
		const a = Uint128.from(0xffn);
		const b = Uint128.from(0n);
		expect(Uint128.bitwiseOr(a, b)).toBe(0xffn);
	});
});

describe("Uint128 - bitwiseXor", () => {
	it("should perform XOR", () => {
		const a = Uint128.from(0xffn);
		const b = Uint128.from(0x0fn);
		expect(Uint128.bitwiseXor(a, b)).toBe(0xf0n);
	});

	it("should handle same values", () => {
		const a = Uint128.from(0xffn);
		expect(Uint128.bitwiseXor(a, a)).toBe(0n);
	});
});

describe("Uint128 - bitwiseNot", () => {
	it("should perform NOT", () => {
		const a = Uint128.from(0n);
		expect(Uint128.bitwiseNot(a)).toBe(Uint128.MAX);
	});

	it("should invert all bits", () => {
		const a = Uint128.from(0xffffffffffffffffn);
		const expected = Uint128.MAX ^ 0xffffffffffffffffn;
		expect(Uint128.bitwiseNot(a)).toBe(expected);
	});

	it("should double invert to original", () => {
		const a = Uint128.from(12345n);
		expect(Uint128.bitwiseNot(Uint128.bitwiseNot(a))).toBe(a);
	});
});

describe("Uint128 - shiftLeft", () => {
	it("should shift left", () => {
		const a = Uint128.from(1n);
		expect(Uint128.shiftLeft(a, 8)).toBe(256n);
	});

	it("should wrap on large shift", () => {
		const a = Uint128.from(1n);
		expect(Uint128.shiftLeft(a, 128)).toBe(0n);
	});

	it("should handle zero shift", () => {
		const a = Uint128.from(255n);
		expect(Uint128.shiftLeft(a, 0)).toBe(255n);
	});

	it("should mask to 128 bits", () => {
		const a = Uint128.from(1n << 127n);
		expect(Uint128.shiftLeft(a, 1)).toBe(0n);
	});
});

describe("Uint128 - shiftRight", () => {
	it("should shift right", () => {
		const a = Uint128.from(256n);
		expect(Uint128.shiftRight(a, 8)).toBe(1n);
	});

	it("should return zero on large shift", () => {
		const a = Uint128.from(255n);
		expect(Uint128.shiftRight(a, 128)).toBe(0n);
	});

	it("should handle zero shift", () => {
		const a = Uint128.from(255n);
		expect(Uint128.shiftRight(a, 0)).toBe(255n);
	});
});

describe("Uint128 - isZero", () => {
	it("should identify zero", () => {
		expect(Uint128.isZero(Uint128.from(0n))).toBe(true);
		expect(Uint128.isZero(Uint128.from(1n))).toBe(false);
		expect(Uint128.isZero(Uint128.from(100n))).toBe(false);
	});
});

describe("Uint128 - isValid", () => {
	it("should validate bigint", () => {
		expect(Uint128.isValid(0n)).toBe(true);
		expect(Uint128.isValid(100n)).toBe(true);
		expect(Uint128.isValid(Uint128.MAX)).toBe(true);
		expect(Uint128.isValid(-1n)).toBe(false);
		expect(Uint128.isValid(Uint128.MAX + 1n)).toBe(false);
	});

	it("should validate number", () => {
		expect(Uint128.isValid(0)).toBe(true);
		expect(Uint128.isValid(100)).toBe(true);
		expect(Uint128.isValid(-1)).toBe(false);
		expect(Uint128.isValid(1.5)).toBe(false);
	});

	it("should validate string", () => {
		expect(Uint128.isValid("0")).toBe(true);
		expect(Uint128.isValid("100")).toBe(true);
		expect(Uint128.isValid("0xff")).toBe(true);
		expect(Uint128.isValid("-1")).toBe(false);
		expect(Uint128.isValid("invalid")).toBe(false);
	});

	it("should reject invalid types", () => {
		expect(Uint128.isValid(null)).toBe(false);
		expect(Uint128.isValid(undefined)).toBe(false);
		expect(Uint128.isValid({})).toBe(false);
	});
});

describe("Uint128 - bitLength", () => {
	it("should calculate bit length", () => {
		expect(Uint128.bitLength(Uint128.from(0n))).toBe(0);
		expect(Uint128.bitLength(Uint128.from(1n))).toBe(1);
		expect(Uint128.bitLength(Uint128.from(2n))).toBe(2);
		expect(Uint128.bitLength(Uint128.from(255n))).toBe(8);
		expect(Uint128.bitLength(Uint128.from(256n))).toBe(9);
	});

	it("should handle MAX", () => {
		expect(Uint128.bitLength(Uint128.MAX)).toBe(128);
	});

	it("should handle powers of 2", () => {
		expect(Uint128.bitLength(Uint128.from(1n << 10n))).toBe(11);
		expect(Uint128.bitLength(Uint128.from(1n << 64n))).toBe(65);
		expect(Uint128.bitLength(Uint128.from(1n << 127n))).toBe(128);
	});
});

describe("Uint128 - leadingZeros", () => {
	it("should count leading zeros", () => {
		expect(Uint128.leadingZeros(Uint128.from(0n))).toBe(128);
		expect(Uint128.leadingZeros(Uint128.from(1n))).toBe(127);
		expect(Uint128.leadingZeros(Uint128.from(255n))).toBe(120);
		expect(Uint128.leadingZeros(Uint128.MAX)).toBe(0);
	});

	it("should handle powers of 2", () => {
		expect(Uint128.leadingZeros(Uint128.from(1n << 127n))).toBe(0);
		expect(Uint128.leadingZeros(Uint128.from(1n << 64n))).toBe(63);
	});
});

describe("Uint128 - popCount", () => {
	it("should count set bits", () => {
		expect(Uint128.popCount(Uint128.from(0n))).toBe(0);
		expect(Uint128.popCount(Uint128.from(1n))).toBe(1);
		expect(Uint128.popCount(Uint128.from(0xffn))).toBe(8);
		expect(Uint128.popCount(Uint128.from(0b1010101n))).toBe(4);
	});

	it("should handle MAX", () => {
		expect(Uint128.popCount(Uint128.MAX)).toBe(128);
	});
});

describe("Uint128 - clone", () => {
	it("should clone value", () => {
		const a = Uint128.from(100n);
		const b = Uint128.clone(a);
		expect(b).toBe(a);
	});
});

describe("Uint128 - sum", () => {
	it("should sum array", () => {
		const values = [
			Uint128.from(100n),
			Uint128.from(50n),
			Uint128.from(75n),
		];
		expect(Uint128.sum(values)).toBe(225n);
	});

	it("should handle empty array", () => {
		expect(Uint128.sum([])).toBe(0n);
	});

	it("should wrap on overflow", () => {
		const values = [Uint128.MAX, Uint128.from(10n)];
		expect(Uint128.sum(values)).toBe(9n);
	});
});

describe("Uint128 - product", () => {
	it("should multiply array", () => {
		const values = [
			Uint128.from(10n),
			Uint128.from(5n),
			Uint128.from(2n),
		];
		expect(Uint128.product(values)).toBe(100n);
	});

	it("should handle empty array", () => {
		expect(Uint128.product([])).toBe(1n);
	});

	it("should handle single element", () => {
		expect(Uint128.product([Uint128.from(100n)])).toBe(100n);
	});

	it("should wrap on overflow", () => {
		const values = [Uint128.MAX, Uint128.from(2n)];
		expect(Uint128.product(values)).toBe(Uint128.MAX - 1n);
	});
});

describe("Uint128 - gcd", () => {
	it("should calculate GCD", () => {
		const a = Uint128.from(48n);
		const b = Uint128.from(18n);
		expect(Uint128.gcd(a, b)).toBe(6n);
	});

	it("should handle coprime numbers", () => {
		const a = Uint128.from(17n);
		const b = Uint128.from(19n);
		expect(Uint128.gcd(a, b)).toBe(1n);
	});

	it("should handle zero", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(0n);
		expect(Uint128.gcd(a, b)).toBe(100n);
	});
});

describe("Uint128 - lcm", () => {
	it("should calculate LCM", () => {
		const a = Uint128.from(12n);
		const b = Uint128.from(18n);
		expect(Uint128.lcm(a, b)).toBe(36n);
	});

	it("should handle coprime numbers", () => {
		const a = Uint128.from(7n);
		const b = Uint128.from(11n);
		expect(Uint128.lcm(a, b)).toBe(77n);
	});

	it("should handle zero", () => {
		const a = Uint128.from(100n);
		const b = Uint128.from(0n);
		expect(Uint128.lcm(a, b)).toBe(0n);
	});
});

describe("Uint128 - isPowerOf2", () => {
	it("should identify powers of 2", () => {
		expect(Uint128.isPowerOf2(Uint128.from(1n))).toBe(true);
		expect(Uint128.isPowerOf2(Uint128.from(2n))).toBe(true);
		expect(Uint128.isPowerOf2(Uint128.from(4n))).toBe(true);
		expect(Uint128.isPowerOf2(Uint128.from(16n))).toBe(true);
		expect(Uint128.isPowerOf2(Uint128.from(1n << 64n))).toBe(true);
		expect(Uint128.isPowerOf2(Uint128.from(1n << 127n))).toBe(true);
	});

	it("should identify non-powers of 2", () => {
		expect(Uint128.isPowerOf2(Uint128.from(0n))).toBe(false);
		expect(Uint128.isPowerOf2(Uint128.from(3n))).toBe(false);
		expect(Uint128.isPowerOf2(Uint128.from(15n))).toBe(false);
		expect(Uint128.isPowerOf2(Uint128.from(100n))).toBe(false);
		expect(Uint128.isPowerOf2(Uint128.MAX)).toBe(false);
	});
});

describe("Uint128 - Boundary Tests", () => {
	it("should handle zero boundary", () => {
		const zero = Uint128.from(0n);
		expect(Uint128.isZero(zero)).toBe(true);
		expect(Uint128.plus(zero, zero)).toBe(0n);
		expect(Uint128.minus(zero, zero)).toBe(0n);
		expect(Uint128.times(zero, Uint128.from(100n))).toBe(0n);
	});

	it("should handle MAX boundary", () => {
		const max = Uint128.MAX;
		expect(Uint128.isValid(max)).toBe(true);
		expect(Uint128.plus(max, Uint128.from(1n))).toBe(0n);
		expect(Uint128.minus(Uint128.from(0n), Uint128.from(1n))).toBe(max);
	});

	it("should reject values beyond MAX", () => {
		expect(() => Uint128.from((1n << 128n))).toThrow();
		expect(() => Uint128.from(Uint128.MAX + 1n)).toThrow();
	});

	it("should handle 2^127 boundary", () => {
		const halfMax = Uint128.from(1n << 127n);
		expect(Uint128.isValid(halfMax)).toBe(true);
		expect(Uint128.bitLength(halfMax)).toBe(128);
		expect(Uint128.shiftLeft(halfMax, 1)).toBe(0n);
	});
});

describe("Uint128 - Round-trip Tests", () => {
	const testValues = [
		0n,
		1n,
		255n,
		256n,
		65535n,
		65536n,
		(1n << 64n) - 1n,
		1n << 64n,
		(1n << 127n) - 1n,
		1n << 127n,
		Uint128.MAX,
	];

	it("should round-trip through bytes", () => {
		for (const value of testValues) {
			const uint = Uint128.from(value);
			const bytes = Uint128.toBytes(uint);
			const restored = Uint128.fromBytes(bytes);
			expect(restored).toBe(uint);
		}
	});

	it("should round-trip through hex", () => {
		for (const value of testValues) {
			const uint = Uint128.from(value);
			const hex = Uint128.toHex(uint);
			const restored = Uint128.fromHex(hex);
			expect(restored).toBe(uint);
		}
	});

	it("should round-trip through string", () => {
		for (const value of testValues) {
			const uint = Uint128.from(value);
			const str = Uint128.toString(uint);
			const restored = Uint128.from(str);
			expect(restored).toBe(uint);
		}
	});

	it("should round-trip through ABI encoding", () => {
		for (const value of testValues) {
			const uint = Uint128.from(value);
			const encoded = Uint128.toAbiEncoded(uint);
			const decoded = Uint128.fromAbiEncoded(encoded);
			expect(decoded).toBe(uint);
		}
	});
});
