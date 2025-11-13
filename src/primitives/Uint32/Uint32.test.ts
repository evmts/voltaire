/**
 * Tests for Uint32 module
 */

import { describe, expect, it } from "vitest";
import * as Uint32 from "./index.js";

describe("Uint32 Constants", () => {
	it("should have correct MAX value", () => {
		expect(Uint32.MAX).toBe(4294967295);
	});

	it("should have correct MIN value", () => {
		expect(Uint32.MIN).toBe(0);
	});

	it("should have correct ZERO value", () => {
		expect(Uint32.ZERO).toBe(0);
	});

	it("should have correct ONE value", () => {
		expect(Uint32.ONE).toBe(1);
	});

	it("should have correct SIZE", () => {
		expect(Uint32.SIZE).toBe(4);
	});
});

describe("Uint32.from", () => {
	it("creates from number", () => {
		const value = Uint32.from(255);
		expect(value).toBe(255);
	});

	it("creates from bigint", () => {
		const value = Uint32.from(100n);
		expect(value).toBe(100);
	});

	it("creates from decimal string", () => {
		const value = Uint32.from("1000");
		expect(value).toBe(1000);
	});

	it("creates from hex string with 0x", () => {
		const value = Uint32.from("0xff");
		expect(value).toBe(255);
	});

	it("creates from hex string without 0x", () => {
		const value = Uint32.from("0Xff");
		expect(value).toBe(255);
	});

	it("creates from zero", () => {
		const value = Uint32.from(0);
		expect(value).toBe(0);
	});

	it("creates from MAX", () => {
		const value = Uint32.from(4294967295);
		expect(value).toBe(4294967295);
	});

	it("throws on negative number", () => {
		expect(() => Uint32.from(-1)).toThrow("cannot be negative");
	});

	it("throws on value exceeding MAX", () => {
		expect(() => Uint32.from(4294967296)).toThrow("exceeds maximum");
	});

	it("throws on non-integer number", () => {
		expect(() => Uint32.from(1.5)).toThrow("safe integer");
	});
});

describe("Uint32.fromNumber", () => {
	it("creates from valid number", () => {
		expect(Uint32.fromNumber(42)).toBe(42);
	});

	it("throws on negative", () => {
		expect(() => Uint32.fromNumber(-1)).toThrow("cannot be negative");
	});

	it("throws on exceeding max", () => {
		expect(() => Uint32.fromNumber(4294967296)).toThrow("exceeds maximum");
	});

	it("throws on non-integer", () => {
		expect(() => Uint32.fromNumber(1.5)).toThrow("safe integer");
	});
});

describe("Uint32.fromBigInt", () => {
	it("creates from valid bigint", () => {
		expect(Uint32.fromBigInt(42n)).toBe(42);
	});

	it("throws on negative", () => {
		expect(() => Uint32.fromBigInt(-1n)).toThrow("cannot be negative");
	});

	it("throws on exceeding max", () => {
		expect(() => Uint32.fromBigInt(4294967296n)).toThrow("exceeds maximum");
	});
});

describe("Uint32.fromHex", () => {
	it("creates from hex with 0x prefix", () => {
		expect(Uint32.fromHex("0xff")).toBe(255);
	});

	it("creates from hex without 0x prefix", () => {
		expect(Uint32.fromHex("ff")).toBe(255);
	});

	it("creates from zero", () => {
		expect(Uint32.fromHex("0x0")).toBe(0);
	});

	it("creates from MAX", () => {
		expect(Uint32.fromHex("0xffffffff")).toBe(4294967295);
	});

	it("throws on exceeding max", () => {
		expect(() => Uint32.fromHex("0x100000000")).toThrow("exceeds maximum");
	});

	it("throws on non-string", () => {
		expect(() => Uint32.fromHex(123 as any)).toThrow("requires string");
	});
});

describe("Uint32.fromBytes", () => {
	it("creates from 4-byte array", () => {
		const bytes = new Uint8Array([0, 0, 0, 255]);
		expect(Uint32.fromBytes(bytes)).toBe(255);
	});

	it("creates from big-endian bytes", () => {
		const bytes = new Uint8Array([0, 0, 1, 0]);
		expect(Uint32.fromBytes(bytes)).toBe(256);
	});

	it("creates zero from zero bytes", () => {
		const bytes = new Uint8Array([0, 0, 0, 0]);
		expect(Uint32.fromBytes(bytes)).toBe(0);
	});

	it("creates MAX from full bytes", () => {
		const bytes = new Uint8Array([255, 255, 255, 255]);
		expect(Uint32.fromBytes(bytes)).toBe(4294967295);
	});

	it("throws on wrong length", () => {
		const bytes = new Uint8Array([0, 0, 0]);
		expect(() => Uint32.fromBytes(bytes)).toThrow("exactly 4 bytes");
	});
});

describe("Uint32.fromAbiEncoded", () => {
	it("creates from 32-byte ABI array", () => {
		const bytes = new Uint8Array(32);
		bytes[31] = 255;
		expect(Uint32.fromAbiEncoded(bytes)).toBe(255);
	});

	it("creates from ABI with value in last 4 bytes", () => {
		const bytes = new Uint8Array(32);
		bytes[28] = 1;
		bytes[29] = 0;
		bytes[30] = 0;
		bytes[31] = 0;
		expect(Uint32.fromAbiEncoded(bytes)).toBe(16777216);
	});

	it("throws on wrong length", () => {
		const bytes = new Uint8Array(31);
		expect(() => Uint32.fromAbiEncoded(bytes)).toThrow("must be 32 bytes");
	});
});

describe("Uint32.toNumber", () => {
	it("converts to number", () => {
		const value = Uint32.from(255);
		expect(Uint32.toNumber(value)).toBe(255);
	});
});

describe("Uint32.toBigInt", () => {
	it("converts to bigint", () => {
		const value = Uint32.from(255);
		expect(Uint32.toBigInt(value)).toBe(255n);
	});
});

describe("Uint32.toHex", () => {
	it("converts to hex with 0x prefix", () => {
		const value = Uint32.from(255);
		expect(Uint32.toHex(value)).toBe("0xff");
	});

	it("converts zero", () => {
		const value = Uint32.from(0);
		expect(Uint32.toHex(value)).toBe("0x0");
	});

	it("converts MAX", () => {
		const value = Uint32.from(4294967295);
		expect(Uint32.toHex(value)).toBe("0xffffffff");
	});
});

describe("Uint32.toBytes", () => {
	it("converts to 4-byte array", () => {
		const value = Uint32.from(255);
		const bytes = Uint32.toBytes(value);
		expect(bytes).toEqual(new Uint8Array([0, 0, 0, 255]));
	});

	it("converts to big-endian", () => {
		const value = Uint32.from(256);
		const bytes = Uint32.toBytes(value);
		expect(bytes).toEqual(new Uint8Array([0, 0, 1, 0]));
	});

	it("converts zero", () => {
		const value = Uint32.from(0);
		const bytes = Uint32.toBytes(value);
		expect(bytes).toEqual(new Uint8Array([0, 0, 0, 0]));
	});

	it("converts MAX", () => {
		const value = Uint32.from(4294967295);
		const bytes = Uint32.toBytes(value);
		expect(bytes).toEqual(new Uint8Array([255, 255, 255, 255]));
	});

	it("round-trips through fromBytes", () => {
		const original = Uint32.from(12345);
		const bytes = Uint32.toBytes(original);
		const restored = Uint32.fromBytes(bytes);
		expect(restored).toBe(original);
	});
});

describe("Uint32.toAbiEncoded", () => {
	it("converts to 32-byte ABI array", () => {
		const value = Uint32.from(255);
		const bytes = Uint32.toAbiEncoded(value);
		expect(bytes.length).toBe(32);
		expect(bytes[31]).toBe(255);
	});

	it("pads with zeros", () => {
		const value = Uint32.from(1);
		const bytes = Uint32.toAbiEncoded(value);
		for (let i = 0; i < 31; i++) {
			expect(bytes[i]).toBe(0);
		}
		expect(bytes[31]).toBe(1);
	});

	it("round-trips through fromAbiEncoded", () => {
		const original = Uint32.from(12345);
		const bytes = Uint32.toAbiEncoded(original);
		const restored = Uint32.fromAbiEncoded(bytes);
		expect(restored).toBe(original);
	});
});

describe("Uint32.toString", () => {
	it("converts to decimal string", () => {
		const value = Uint32.from(255);
		expect(Uint32.toString(value)).toBe("255");
	});
});

describe("Uint32.plus", () => {
	it("adds two values", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(50);
		expect(Uint32.plus(a, b)).toBe(150);
	});

	it("wraps on overflow", () => {
		const a = Uint32.from(4294967295);
		const b = Uint32.from(1);
		expect(Uint32.plus(a, b)).toBe(0);
	});

	it("wraps correctly on large overflow", () => {
		const a = Uint32.from(4294967295);
		const b = Uint32.from(10);
		expect(Uint32.plus(a, b)).toBe(9);
	});
});

describe("Uint32.minus", () => {
	it("subtracts two values", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(50);
		expect(Uint32.minus(a, b)).toBe(50);
	});

	it("wraps on underflow", () => {
		const a = Uint32.from(0);
		const b = Uint32.from(1);
		expect(Uint32.minus(a, b)).toBe(4294967295);
	});

	it("wraps correctly on large underflow", () => {
		const a = Uint32.from(5);
		const b = Uint32.from(10);
		expect(Uint32.minus(a, b)).toBe(4294967291);
	});
});

describe("Uint32.times", () => {
	it("multiplies two values", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(2);
		expect(Uint32.times(a, b)).toBe(200);
	});

	it("wraps on overflow", () => {
		const a = Uint32.from(4294967295);
		const b = Uint32.from(2);
		expect(Uint32.times(a, b)).toBe(4294967294);
	});

	it("returns zero when multiplied by zero", () => {
		const a = Uint32.from(12345);
		const b = Uint32.from(0);
		expect(Uint32.times(a, b)).toBe(0);
	});
});

describe("Uint32.dividedBy", () => {
	it("divides two values", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(3);
		expect(Uint32.dividedBy(a, b)).toBe(33);
	});

	it("returns zero when zero divided", () => {
		const a = Uint32.from(0);
		const b = Uint32.from(10);
		expect(Uint32.dividedBy(a, b)).toBe(0);
	});

	it("throws on division by zero", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(0);
		expect(() => Uint32.dividedBy(a, b)).toThrow("Division by zero");
	});
});

describe("Uint32.modulo", () => {
	it("calculates remainder", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(3);
		expect(Uint32.modulo(a, b)).toBe(1);
	});

	it("returns zero for exact division", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(10);
		expect(Uint32.modulo(a, b)).toBe(0);
	});

	it("throws on modulo by zero", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(0);
		expect(() => Uint32.modulo(a, b)).toThrow("Modulo by zero");
	});
});

describe("Uint32.toPower", () => {
	it("raises to power", () => {
		const base = Uint32.from(2);
		const exp = Uint32.from(10);
		expect(Uint32.toPower(base, exp)).toBe(1024);
	});

	it("returns 1 for zero exponent", () => {
		const base = Uint32.from(123);
		const exp = Uint32.from(0);
		expect(Uint32.toPower(base, exp)).toBe(1);
	});

	it("returns base for exponent 1", () => {
		const base = Uint32.from(123);
		const exp = Uint32.from(1);
		expect(Uint32.toPower(base, exp)).toBe(123);
	});

	it("wraps on overflow", () => {
		const base = Uint32.from(2);
		const exp = Uint32.from(32);
		expect(Uint32.toPower(base, exp)).toBe(0);
	});
});

describe("Uint32.bitwiseAnd", () => {
	it("performs bitwise AND", () => {
		const a = Uint32.from(0b1100);
		const b = Uint32.from(0b1010);
		expect(Uint32.bitwiseAnd(a, b)).toBe(0b1000);
	});

	it("ANDs with zero returns zero", () => {
		const a = Uint32.from(255);
		const b = Uint32.from(0);
		expect(Uint32.bitwiseAnd(a, b)).toBe(0);
	});

	it("ANDs with MAX returns value", () => {
		const a = Uint32.from(255);
		const b = Uint32.from(4294967295);
		expect(Uint32.bitwiseAnd(a, b)).toBe(255);
	});
});

describe("Uint32.bitwiseOr", () => {
	it("performs bitwise OR", () => {
		const a = Uint32.from(0b1100);
		const b = Uint32.from(0b1010);
		expect(Uint32.bitwiseOr(a, b)).toBe(0b1110);
	});

	it("ORs with zero returns value", () => {
		const a = Uint32.from(255);
		const b = Uint32.from(0);
		expect(Uint32.bitwiseOr(a, b)).toBe(255);
	});
});

describe("Uint32.bitwiseXor", () => {
	it("performs bitwise XOR", () => {
		const a = Uint32.from(0b1100);
		const b = Uint32.from(0b1010);
		expect(Uint32.bitwiseXor(a, b)).toBe(0b0110);
	});

	it("XORs with zero returns value", () => {
		const a = Uint32.from(255);
		const b = Uint32.from(0);
		expect(Uint32.bitwiseXor(a, b)).toBe(255);
	});

	it("XORs with self returns zero", () => {
		const a = Uint32.from(255);
		expect(Uint32.bitwiseXor(a, a)).toBe(0);
	});
});

describe("Uint32.bitwiseNot", () => {
	it("performs bitwise NOT", () => {
		const a = Uint32.from(0);
		expect(Uint32.bitwiseNot(a)).toBe(4294967295);
	});

	it("NOTs MAX returns zero", () => {
		const a = Uint32.from(4294967295);
		expect(Uint32.bitwiseNot(a)).toBe(0);
	});

	it("double NOT returns original", () => {
		const a = Uint32.from(255);
		const notA = Uint32.bitwiseNot(a);
		const notNotA = Uint32.bitwiseNot(notA);
		expect(notNotA).toBe(255);
	});
});

describe("Uint32.shiftLeft", () => {
	it("shifts left by 8", () => {
		const a = Uint32.from(1);
		expect(Uint32.shiftLeft(a, 8)).toBe(256);
	});

	it("shifts left by 0", () => {
		const a = Uint32.from(255);
		expect(Uint32.shiftLeft(a, 0)).toBe(255);
	});

	it("wraps when shifting beyond 32 bits", () => {
		const a = Uint32.from(1);
		expect(Uint32.shiftLeft(a, 32)).toBe(1);
	});
});

describe("Uint32.shiftRight", () => {
	it("shifts right by 8", () => {
		const a = Uint32.from(256);
		expect(Uint32.shiftRight(a, 8)).toBe(1);
	});

	it("shifts right by 0", () => {
		const a = Uint32.from(255);
		expect(Uint32.shiftRight(a, 0)).toBe(255);
	});

	it("shifts large amount", () => {
		const a = Uint32.from(255);
		expect(Uint32.shiftRight(a, 16)).toBe(0);
	});
});

describe("Uint32.equals", () => {
	it("returns true for equal values", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(100);
		expect(Uint32.equals(a, b)).toBe(true);
	});

	it("returns false for different values", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(200);
		expect(Uint32.equals(a, b)).toBe(false);
	});

	it("returns true for zero", () => {
		const a = Uint32.from(0);
		const b = Uint32.from(0);
		expect(Uint32.equals(a, b)).toBe(true);
	});
});

describe("Uint32.lessThan", () => {
	it("returns true when first is less", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(200);
		expect(Uint32.lessThan(a, b)).toBe(true);
	});

	it("returns false when first is greater", () => {
		const a = Uint32.from(200);
		const b = Uint32.from(100);
		expect(Uint32.lessThan(a, b)).toBe(false);
	});

	it("returns false when equal", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(100);
		expect(Uint32.lessThan(a, b)).toBe(false);
	});
});

describe("Uint32.greaterThan", () => {
	it("returns true when first is greater", () => {
		const a = Uint32.from(200);
		const b = Uint32.from(100);
		expect(Uint32.greaterThan(a, b)).toBe(true);
	});

	it("returns false when first is less", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(200);
		expect(Uint32.greaterThan(a, b)).toBe(false);
	});

	it("returns false when equal", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(100);
		expect(Uint32.greaterThan(a, b)).toBe(false);
	});
});

describe("Uint32.isZero", () => {
	it("returns true for zero", () => {
		const a = Uint32.from(0);
		expect(Uint32.isZero(a)).toBe(true);
	});

	it("returns false for non-zero", () => {
		const a = Uint32.from(1);
		expect(Uint32.isZero(a)).toBe(false);
	});
});

describe("Uint32.minimum", () => {
	it("returns smaller value", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(200);
		expect(Uint32.minimum(a, b)).toBe(100);
	});

	it("returns first when equal", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(100);
		expect(Uint32.minimum(a, b)).toBe(100);
	});
});

describe("Uint32.maximum", () => {
	it("returns larger value", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(200);
		expect(Uint32.maximum(a, b)).toBe(200);
	});

	it("returns first when equal", () => {
		const a = Uint32.from(100);
		const b = Uint32.from(100);
		expect(Uint32.maximum(a, b)).toBe(100);
	});
});

describe("Uint32.bitLength", () => {
	it("returns correct bit length", () => {
		expect(Uint32.bitLength(Uint32.from(0))).toBe(0);
		expect(Uint32.bitLength(Uint32.from(1))).toBe(1);
		expect(Uint32.bitLength(Uint32.from(255))).toBe(8);
		expect(Uint32.bitLength(Uint32.from(256))).toBe(9);
		expect(Uint32.bitLength(Uint32.from(4294967295))).toBe(32);
	});
});

describe("Uint32.leadingZeros", () => {
	it("returns correct leading zeros", () => {
		expect(Uint32.leadingZeros(Uint32.from(0))).toBe(32);
		expect(Uint32.leadingZeros(Uint32.from(1))).toBe(31);
		expect(Uint32.leadingZeros(Uint32.from(255))).toBe(24);
		expect(Uint32.leadingZeros(Uint32.from(4294967295))).toBe(0);
	});
});

describe("Uint32.popCount", () => {
	it("counts set bits", () => {
		expect(Uint32.popCount(Uint32.from(0))).toBe(0);
		expect(Uint32.popCount(Uint32.from(1))).toBe(1);
		expect(Uint32.popCount(Uint32.from(0b1111))).toBe(4);
		expect(Uint32.popCount(Uint32.from(4294967295))).toBe(32);
	});
});

describe("Uint32.isValid", () => {
	it("returns true for valid values", () => {
		expect(Uint32.isValid(0)).toBe(true);
		expect(Uint32.isValid(100)).toBe(true);
		expect(Uint32.isValid(4294967295)).toBe(true);
	});

	it("returns false for invalid values", () => {
		expect(Uint32.isValid(-1)).toBe(false);
		expect(Uint32.isValid(4294967296)).toBe(false);
		expect(Uint32.isValid(1.5)).toBe(false);
		expect(Uint32.isValid("100")).toBe(false);
		expect(Uint32.isValid(100n)).toBe(false);
	});
});

describe("Uint32.tryFrom", () => {
	it("returns value for valid input", () => {
		expect(Uint32.tryFrom(100)).toBe(100);
		expect(Uint32.tryFrom(0)).toBe(0);
	});

	it("returns null for invalid input", () => {
		expect(Uint32.tryFrom(-1)).toBe(null);
		expect(Uint32.tryFrom(4294967296)).toBe(null);
		expect(Uint32.tryFrom("100")).toBe(null);
	});
});

describe("Uint32.clone", () => {
	it("clones value", () => {
		const a = Uint32.from(100);
		const b = Uint32.clone(a);
		expect(b).toBe(a);
	});
});

describe("Uint32 boundary testing", () => {
	it("handles zero correctly", () => {
		const zero = Uint32.from(0);
		expect(zero).toBe(0);
		expect(Uint32.isZero(zero)).toBe(true);
	});

	it("handles MAX correctly", () => {
		const max = Uint32.from(4294967295);
		expect(max).toBe(4294967295);
		expect(Uint32.plus(max, Uint32.ONE)).toBe(0);
	});

	it("handles MAX-1 correctly", () => {
		const almostMax = Uint32.from(4294967294);
		expect(Uint32.plus(almostMax, Uint32.ONE)).toBe(4294967295);
	});

	it("rejects MAX+1", () => {
		expect(() => Uint32.from(4294967296)).toThrow();
	});
});
