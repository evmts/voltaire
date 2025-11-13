/**
 * Tests for Uint64 module
 */

import { describe, expect, it } from "vitest";
import * as Uint64 from "./index.js";

describe("Uint64 Constants", () => {
	it("should have correct MAX value", () => {
		expect(Uint64.MAX).toBe(18446744073709551615n);
	});

	it("should have correct MIN value", () => {
		expect(Uint64.MIN).toBe(0n);
	});

	it("should have correct ZERO value", () => {
		expect(Uint64.ZERO).toBe(0n);
	});

	it("should have correct ONE value", () => {
		expect(Uint64.ONE).toBe(1n);
	});

	it("should have correct SIZE", () => {
		expect(Uint64.SIZE).toBe(8);
	});
});

describe("Uint64.from", () => {
	it("creates from bigint", () => {
		const value = Uint64.from(255n);
		expect(value).toBe(255n);
	});

	it("creates from number", () => {
		const value = Uint64.from(100);
		expect(value).toBe(100n);
	});

	it("creates from decimal string", () => {
		const value = Uint64.from("1000");
		expect(value).toBe(1000n);
	});

	it("creates from hex string with 0x", () => {
		const value = Uint64.from("0xff");
		expect(value).toBe(255n);
	});

	it("creates from hex string without 0x", () => {
		const value = Uint64.from("0Xff");
		expect(value).toBe(255n);
	});

	it("creates from zero", () => {
		const value = Uint64.from(0);
		expect(value).toBe(0n);
	});

	it("creates from MAX", () => {
		const value = Uint64.from(18446744073709551615n);
		expect(value).toBe(18446744073709551615n);
	});

	it("creates from large value exceeding Number.MAX_SAFE_INTEGER", () => {
		const largeValue = 10000000000000000n;
		const value = Uint64.from(largeValue);
		expect(value).toBe(largeValue);
	});

	it("throws on negative number", () => {
		expect(() => Uint64.from(-1)).toThrow("cannot be negative");
	});

	it("throws on value exceeding MAX", () => {
		expect(() => Uint64.from(18446744073709551616n)).toThrow("exceeds maximum");
	});

	it("throws on non-integer number", () => {
		expect(() => Uint64.from(1.5)).toThrow("must be an integer");
	});
});

describe("Uint64.fromNumber", () => {
	it("creates from valid number", () => {
		expect(Uint64.fromNumber(42)).toBe(42n);
	});

	it("throws on negative", () => {
		expect(() => Uint64.fromNumber(-1)).toThrow("cannot be negative");
	});

	it("throws on non-integer", () => {
		expect(() => Uint64.fromNumber(1.5)).toThrow("must be an integer");
	});

	it("handles Number.MAX_SAFE_INTEGER", () => {
		const value = Uint64.fromNumber(Number.MAX_SAFE_INTEGER);
		expect(value).toBe(9007199254740991n);
	});
});

describe("Uint64.fromBigInt", () => {
	it("creates from valid bigint", () => {
		expect(Uint64.fromBigInt(42n)).toBe(42n);
	});

	it("throws on negative", () => {
		expect(() => Uint64.fromBigInt(-1n)).toThrow("cannot be negative");
	});

	it("throws on exceeding max", () => {
		expect(() => Uint64.fromBigInt(18446744073709551616n)).toThrow(
			"exceeds maximum",
		);
	});

	it("handles MAX value", () => {
		expect(Uint64.fromBigInt(18446744073709551615n)).toBe(
			18446744073709551615n,
		);
	});
});

describe("Uint64.fromHex", () => {
	it("creates from hex with 0x prefix", () => {
		expect(Uint64.fromHex("0xff")).toBe(255n);
	});

	it("creates from hex without 0x prefix", () => {
		expect(Uint64.fromHex("ff")).toBe(255n);
	});

	it("creates from zero", () => {
		expect(Uint64.fromHex("0x0")).toBe(0n);
	});

	it("creates from MAX", () => {
		expect(Uint64.fromHex("0xffffffffffffffff")).toBe(18446744073709551615n);
	});

	it("throws on exceeding max", () => {
		expect(() => Uint64.fromHex("0x10000000000000000")).toThrow(
			"exceeds maximum",
		);
	});

	it("throws on non-string", () => {
		expect(() => Uint64.fromHex(123 as any)).toThrow("requires string");
	});
});

describe("Uint64.fromBytes", () => {
	it("creates from 8-byte array", () => {
		const bytes = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 255]);
		expect(Uint64.fromBytes(bytes)).toBe(255n);
	});

	it("creates from big-endian bytes", () => {
		const bytes = new Uint8Array([0, 0, 0, 0, 0, 0, 1, 0]);
		expect(Uint64.fromBytes(bytes)).toBe(256n);
	});

	it("creates zero from zero bytes", () => {
		const bytes = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
		expect(Uint64.fromBytes(bytes)).toBe(0n);
	});

	it("creates MAX from full bytes", () => {
		const bytes = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255]);
		expect(Uint64.fromBytes(bytes)).toBe(18446744073709551615n);
	});

	it("throws on wrong length", () => {
		const bytes = new Uint8Array([0, 0, 0, 0]);
		expect(() => Uint64.fromBytes(bytes)).toThrow("exactly 8 bytes");
	});
});

describe("Uint64.fromAbiEncoded", () => {
	it("creates from 32-byte ABI array", () => {
		const bytes = new Uint8Array(32);
		bytes[31] = 255;
		expect(Uint64.fromAbiEncoded(bytes)).toBe(255n);
	});

	it("creates from ABI with value in last 8 bytes", () => {
		const bytes = new Uint8Array(32);
		bytes[24] = 1;
		bytes[25] = 0;
		bytes[26] = 0;
		bytes[27] = 0;
		bytes[28] = 0;
		bytes[29] = 0;
		bytes[30] = 0;
		bytes[31] = 0;
		expect(Uint64.fromAbiEncoded(bytes)).toBe(72057594037927936n);
	});

	it("throws on wrong length", () => {
		const bytes = new Uint8Array(31);
		expect(() => Uint64.fromAbiEncoded(bytes)).toThrow("must be 32 bytes");
	});
});

describe("Uint64.toNumber", () => {
	it("converts to number", () => {
		const value = Uint64.from(255n);
		expect(Uint64.toNumber(value)).toBe(255);
	});

	it("handles values up to MAX_SAFE_INTEGER", () => {
		const value = Uint64.from(9007199254740991n);
		expect(Uint64.toNumber(value)).toBe(9007199254740991);
	});
});

describe("Uint64.toBigInt", () => {
	it("converts to bigint", () => {
		const value = Uint64.from(255n);
		expect(Uint64.toBigInt(value)).toBe(255n);
	});
});

describe("Uint64.toHex", () => {
	it("converts to hex with 0x prefix", () => {
		const value = Uint64.from(255n);
		expect(Uint64.toHex(value)).toBe("0xff");
	});

	it("converts zero", () => {
		const value = Uint64.from(0n);
		expect(Uint64.toHex(value)).toBe("0x0");
	});

	it("converts MAX", () => {
		const value = Uint64.from(18446744073709551615n);
		expect(Uint64.toHex(value)).toBe("0xffffffffffffffff");
	});
});

describe("Uint64.toBytes", () => {
	it("converts to 8-byte array", () => {
		const value = Uint64.from(255n);
		const bytes = Uint64.toBytes(value);
		expect(bytes).toEqual(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 255]));
	});

	it("converts to big-endian", () => {
		const value = Uint64.from(256n);
		const bytes = Uint64.toBytes(value);
		expect(bytes).toEqual(new Uint8Array([0, 0, 0, 0, 0, 0, 1, 0]));
	});

	it("converts zero", () => {
		const value = Uint64.from(0n);
		const bytes = Uint64.toBytes(value);
		expect(bytes).toEqual(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]));
	});

	it("converts MAX", () => {
		const value = Uint64.from(18446744073709551615n);
		const bytes = Uint64.toBytes(value);
		expect(bytes).toEqual(
			new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255]),
		);
	});

	it("round-trips through fromBytes", () => {
		const original = Uint64.from(12345678901234n);
		const bytes = Uint64.toBytes(original);
		const restored = Uint64.fromBytes(bytes);
		expect(restored).toBe(original);
	});
});

describe("Uint64.toAbiEncoded", () => {
	it("converts to 32-byte ABI array", () => {
		const value = Uint64.from(255n);
		const bytes = Uint64.toAbiEncoded(value);
		expect(bytes.length).toBe(32);
		expect(bytes[31]).toBe(255);
	});

	it("pads with zeros", () => {
		const value = Uint64.from(1n);
		const bytes = Uint64.toAbiEncoded(value);
		for (let i = 0; i < 31; i++) {
			expect(bytes[i]).toBe(0);
		}
		expect(bytes[31]).toBe(1);
	});

	it("round-trips through fromAbiEncoded", () => {
		const original = Uint64.from(12345678901234n);
		const bytes = Uint64.toAbiEncoded(original);
		const restored = Uint64.fromAbiEncoded(bytes);
		expect(restored).toBe(original);
	});
});

describe("Uint64.toString", () => {
	it("converts to decimal string", () => {
		const value = Uint64.from(255n);
		expect(Uint64.toString(value)).toBe("255");
	});

	it("converts large value", () => {
		const value = Uint64.from(18446744073709551615n);
		expect(Uint64.toString(value)).toBe("18446744073709551615");
	});
});

describe("Uint64.plus", () => {
	it("adds two values", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(50n);
		expect(Uint64.plus(a, b)).toBe(150n);
	});

	it("wraps on overflow", () => {
		const a = Uint64.from(18446744073709551615n);
		const b = Uint64.from(1n);
		expect(Uint64.plus(a, b)).toBe(0n);
	});

	it("wraps correctly on large overflow", () => {
		const a = Uint64.from(18446744073709551615n);
		const b = Uint64.from(10n);
		expect(Uint64.plus(a, b)).toBe(9n);
	});
});

describe("Uint64.minus", () => {
	it("subtracts two values", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(50n);
		expect(Uint64.minus(a, b)).toBe(50n);
	});

	it("wraps on underflow", () => {
		const a = Uint64.from(0n);
		const b = Uint64.from(1n);
		expect(Uint64.minus(a, b)).toBe(18446744073709551615n);
	});

	it("wraps correctly on large underflow", () => {
		const a = Uint64.from(5n);
		const b = Uint64.from(10n);
		expect(Uint64.minus(a, b)).toBe(18446744073709551611n);
	});
});

describe("Uint64.times", () => {
	it("multiplies two values", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(2n);
		expect(Uint64.times(a, b)).toBe(200n);
	});

	it("wraps on overflow", () => {
		const a = Uint64.from(18446744073709551615n);
		const b = Uint64.from(2n);
		expect(Uint64.times(a, b)).toBe(18446744073709551614n);
	});

	it("returns zero when multiplied by zero", () => {
		const a = Uint64.from(123456789n);
		const b = Uint64.from(0n);
		expect(Uint64.times(a, b)).toBe(0n);
	});
});

describe("Uint64.dividedBy", () => {
	it("divides two values", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(3n);
		expect(Uint64.dividedBy(a, b)).toBe(33n);
	});

	it("returns zero when zero divided", () => {
		const a = Uint64.from(0n);
		const b = Uint64.from(10n);
		expect(Uint64.dividedBy(a, b)).toBe(0n);
	});

	it("throws on division by zero", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(0n);
		expect(() => Uint64.dividedBy(a, b)).toThrow("Division by zero");
	});
});

describe("Uint64.modulo", () => {
	it("calculates remainder", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(3n);
		expect(Uint64.modulo(a, b)).toBe(1n);
	});

	it("returns zero for exact division", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(10n);
		expect(Uint64.modulo(a, b)).toBe(0n);
	});

	it("throws on modulo by zero", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(0n);
		expect(() => Uint64.modulo(a, b)).toThrow("Modulo by zero");
	});
});

describe("Uint64.toPower", () => {
	it("raises to power", () => {
		const base = Uint64.from(2n);
		const exp = Uint64.from(10n);
		expect(Uint64.toPower(base, exp)).toBe(1024n);
	});

	it("returns 1 for zero exponent", () => {
		const base = Uint64.from(123n);
		const exp = Uint64.from(0n);
		expect(Uint64.toPower(base, exp)).toBe(1n);
	});

	it("returns base for exponent 1", () => {
		const base = Uint64.from(123n);
		const exp = Uint64.from(1n);
		expect(Uint64.toPower(base, exp)).toBe(123n);
	});

	it("wraps on overflow", () => {
		const base = Uint64.from(2n);
		const exp = Uint64.from(64n);
		expect(Uint64.toPower(base, exp)).toBe(0n);
	});
});

describe("Uint64.bitwiseAnd", () => {
	it("performs bitwise AND", () => {
		const a = Uint64.from(0b1100n);
		const b = Uint64.from(0b1010n);
		expect(Uint64.bitwiseAnd(a, b)).toBe(0b1000n);
	});

	it("ANDs with zero returns zero", () => {
		const a = Uint64.from(255n);
		const b = Uint64.from(0n);
		expect(Uint64.bitwiseAnd(a, b)).toBe(0n);
	});

	it("ANDs with MAX returns value", () => {
		const a = Uint64.from(255n);
		const b = Uint64.from(18446744073709551615n);
		expect(Uint64.bitwiseAnd(a, b)).toBe(255n);
	});
});

describe("Uint64.bitwiseOr", () => {
	it("performs bitwise OR", () => {
		const a = Uint64.from(0b1100n);
		const b = Uint64.from(0b1010n);
		expect(Uint64.bitwiseOr(a, b)).toBe(0b1110n);
	});

	it("ORs with zero returns value", () => {
		const a = Uint64.from(255n);
		const b = Uint64.from(0n);
		expect(Uint64.bitwiseOr(a, b)).toBe(255n);
	});
});

describe("Uint64.bitwiseXor", () => {
	it("performs bitwise XOR", () => {
		const a = Uint64.from(0b1100n);
		const b = Uint64.from(0b1010n);
		expect(Uint64.bitwiseXor(a, b)).toBe(0b0110n);
	});

	it("XORs with zero returns value", () => {
		const a = Uint64.from(255n);
		const b = Uint64.from(0n);
		expect(Uint64.bitwiseXor(a, b)).toBe(255n);
	});

	it("XORs with self returns zero", () => {
		const a = Uint64.from(255n);
		expect(Uint64.bitwiseXor(a, a)).toBe(0n);
	});
});

describe("Uint64.bitwiseNot", () => {
	it("performs bitwise NOT", () => {
		const a = Uint64.from(0n);
		expect(Uint64.bitwiseNot(a)).toBe(18446744073709551615n);
	});

	it("NOTs MAX returns zero", () => {
		const a = Uint64.from(18446744073709551615n);
		expect(Uint64.bitwiseNot(a)).toBe(0n);
	});

	it("double NOT returns original", () => {
		const a = Uint64.from(255n);
		const notA = Uint64.bitwiseNot(a);
		const notNotA = Uint64.bitwiseNot(notA);
		expect(notNotA).toBe(255n);
	});
});

describe("Uint64.shiftLeft", () => {
	it("shifts left by 8", () => {
		const a = Uint64.from(1n);
		expect(Uint64.shiftLeft(a, 8n)).toBe(256n);
	});

	it("shifts left by 0", () => {
		const a = Uint64.from(255n);
		expect(Uint64.shiftLeft(a, 0n)).toBe(255n);
	});

	it("shifts large amount", () => {
		const a = Uint64.from(1n);
		expect(Uint64.shiftLeft(a, 63n)).toBe(9223372036854775808n);
	});

	it("accepts number as shift amount", () => {
		const a = Uint64.from(1n);
		expect(Uint64.shiftLeft(a, 8)).toBe(256n);
	});
});

describe("Uint64.shiftRight", () => {
	it("shifts right by 8", () => {
		const a = Uint64.from(256n);
		expect(Uint64.shiftRight(a, 8n)).toBe(1n);
	});

	it("shifts right by 0", () => {
		const a = Uint64.from(255n);
		expect(Uint64.shiftRight(a, 0n)).toBe(255n);
	});

	it("shifts to zero", () => {
		const a = Uint64.from(255n);
		expect(Uint64.shiftRight(a, 64n)).toBe(0n);
	});

	it("accepts number as shift amount", () => {
		const a = Uint64.from(256n);
		expect(Uint64.shiftRight(a, 8)).toBe(1n);
	});
});

describe("Uint64.equals", () => {
	it("returns true for equal values", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(100n);
		expect(Uint64.equals(a, b)).toBe(true);
	});

	it("returns false for different values", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(200n);
		expect(Uint64.equals(a, b)).toBe(false);
	});

	it("returns true for zero", () => {
		const a = Uint64.from(0n);
		const b = Uint64.from(0n);
		expect(Uint64.equals(a, b)).toBe(true);
	});
});

describe("Uint64.lessThan", () => {
	it("returns true when first is less", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(200n);
		expect(Uint64.lessThan(a, b)).toBe(true);
	});

	it("returns false when first is greater", () => {
		const a = Uint64.from(200n);
		const b = Uint64.from(100n);
		expect(Uint64.lessThan(a, b)).toBe(false);
	});

	it("returns false when equal", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(100n);
		expect(Uint64.lessThan(a, b)).toBe(false);
	});
});

describe("Uint64.greaterThan", () => {
	it("returns true when first is greater", () => {
		const a = Uint64.from(200n);
		const b = Uint64.from(100n);
		expect(Uint64.greaterThan(a, b)).toBe(true);
	});

	it("returns false when first is less", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(200n);
		expect(Uint64.greaterThan(a, b)).toBe(false);
	});

	it("returns false when equal", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(100n);
		expect(Uint64.greaterThan(a, b)).toBe(false);
	});
});

describe("Uint64.isZero", () => {
	it("returns true for zero", () => {
		const a = Uint64.from(0n);
		expect(Uint64.isZero(a)).toBe(true);
	});

	it("returns false for non-zero", () => {
		const a = Uint64.from(1n);
		expect(Uint64.isZero(a)).toBe(false);
	});
});

describe("Uint64.minimum", () => {
	it("returns smaller value", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(200n);
		expect(Uint64.minimum(a, b)).toBe(100n);
	});

	it("returns first when equal", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(100n);
		expect(Uint64.minimum(a, b)).toBe(100n);
	});
});

describe("Uint64.maximum", () => {
	it("returns larger value", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(200n);
		expect(Uint64.maximum(a, b)).toBe(200n);
	});

	it("returns first when equal", () => {
		const a = Uint64.from(100n);
		const b = Uint64.from(100n);
		expect(Uint64.maximum(a, b)).toBe(100n);
	});
});

describe("Uint64.bitLength", () => {
	it("returns correct bit length", () => {
		expect(Uint64.bitLength(Uint64.from(0n))).toBe(0);
		expect(Uint64.bitLength(Uint64.from(1n))).toBe(1);
		expect(Uint64.bitLength(Uint64.from(255n))).toBe(8);
		expect(Uint64.bitLength(Uint64.from(256n))).toBe(9);
		expect(Uint64.bitLength(Uint64.from(18446744073709551615n))).toBe(64);
	});
});

describe("Uint64.leadingZeros", () => {
	it("returns correct leading zeros", () => {
		expect(Uint64.leadingZeros(Uint64.from(0n))).toBe(64);
		expect(Uint64.leadingZeros(Uint64.from(1n))).toBe(63);
		expect(Uint64.leadingZeros(Uint64.from(255n))).toBe(56);
		expect(Uint64.leadingZeros(Uint64.from(18446744073709551615n))).toBe(0);
	});
});

describe("Uint64.popCount", () => {
	it("counts set bits", () => {
		expect(Uint64.popCount(Uint64.from(0n))).toBe(0);
		expect(Uint64.popCount(Uint64.from(1n))).toBe(1);
		expect(Uint64.popCount(Uint64.from(0b1111n))).toBe(4);
		expect(Uint64.popCount(Uint64.from(18446744073709551615n))).toBe(64);
	});
});

describe("Uint64.isValid", () => {
	it("returns true for valid values", () => {
		expect(Uint64.isValid(0n)).toBe(true);
		expect(Uint64.isValid(100n)).toBe(true);
		expect(Uint64.isValid(18446744073709551615n)).toBe(true);
	});

	it("returns false for invalid values", () => {
		expect(Uint64.isValid(-1n)).toBe(false);
		expect(Uint64.isValid(18446744073709551616n)).toBe(false);
		expect(Uint64.isValid(100)).toBe(false);
		expect(Uint64.isValid("100")).toBe(false);
	});
});

describe("Uint64.tryFrom", () => {
	it("returns value for valid bigint", () => {
		expect(Uint64.tryFrom(100n)).toBe(100n);
		expect(Uint64.tryFrom(0n)).toBe(0n);
	});

	it("returns null for invalid input", () => {
		expect(Uint64.tryFrom(-1n)).toBe(null);
		expect(Uint64.tryFrom(18446744073709551616n)).toBe(null);
		expect(Uint64.tryFrom(100)).toBe(null);
		expect(Uint64.tryFrom("100")).toBe(null);
	});
});

describe("Uint64.clone", () => {
	it("clones value", () => {
		const a = Uint64.from(100n);
		const b = Uint64.clone(a);
		expect(b).toBe(a);
	});
});

describe("Uint64 boundary testing", () => {
	it("handles zero correctly", () => {
		const zero = Uint64.from(0n);
		expect(zero).toBe(0n);
		expect(Uint64.isZero(zero)).toBe(true);
	});

	it("handles MAX correctly", () => {
		const max = Uint64.from(18446744073709551615n);
		expect(max).toBe(18446744073709551615n);
		expect(Uint64.plus(max, Uint64.ONE)).toBe(0n);
	});

	it("handles MAX-1 correctly", () => {
		const almostMax = Uint64.from(18446744073709551614n);
		expect(Uint64.plus(almostMax, Uint64.ONE)).toBe(18446744073709551615n);
	});

	it("rejects MAX+1", () => {
		expect(() => Uint64.from(18446744073709551616n)).toThrow();
	});

	it("handles Number.MAX_SAFE_INTEGER crossing", () => {
		const atBoundary = Uint64.from(9007199254740991n);
		const aboveBoundary = Uint64.from(9007199254740992n);
		expect(Uint64.lessThan(atBoundary, aboveBoundary)).toBe(true);
	});
});
