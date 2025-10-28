/**
 * Tests for Uint256 module
 */

import { describe, it, expect } from "vitest";
import { Uint } from "./uint.js";

// ============================================================================
// Constants Tests
// ============================================================================

describe("Uint Constants", () => {
  it("should have correct MAX value", () => {
    expect(Uint.MAX).toBe((1n << 256n) - 1n);
  });

  it("should have correct MIN value", () => {
    expect(Uint.MIN).toBe(0n);
  });

  it("should have correct ZERO value", () => {
    expect(Uint.ZERO).toBe(0n);
  });

  it("should have correct ONE value", () => {
    expect(Uint.ONE).toBe(1n);
  });
});

// ============================================================================
// Construction Tests
// ============================================================================

describe("Uint.from", () => {
  it("creates from bigint", () => {
    const value = Uint.from(100n);
    expect(value).toBe(100n);
  });

  it("creates from number", () => {
    const value = Uint.from(255);
    expect(value).toBe(255n);
  });

  it("creates from decimal string", () => {
    const value = Uint.from("1000");
    expect(value).toBe(1000n);
  });

  it("creates from hex string with 0x", () => {
    const value = Uint.from("0xff");
    expect(value).toBe(255n);
  });

  it("creates from hex string with 0X", () => {
    const value = Uint.from("0Xff");
    expect(value).toBe(255n);
  });

  it("creates zero value", () => {
    const value = Uint.from(0n);
    expect(value).toBe(0n);
  });

  it("creates MAX value", () => {
    const value = Uint.from(Uint.MAX);
    expect(value).toBe(Uint.MAX);
  });

  it("throws on negative bigint", () => {
    expect(() => Uint.from(-1n)).toThrow("cannot be negative");
  });

  it("throws on negative number", () => {
    expect(() => Uint.from(-100)).toThrow("cannot be negative");
  });

  it("throws on non-integer number", () => {
    expect(() => Uint.from(3.14)).toThrow("must be an integer");
  });

  it("throws on value exceeding MAX", () => {
    const tooLarge = (Uint.MAX as bigint) + 1n;
    expect(() => Uint.from(tooLarge)).toThrow("exceeds maximum");
  });
});

describe("Uint.fromHex", () => {
  it("creates from hex with 0x prefix", () => {
    const value = Uint.fromHex.call("0xff");
    expect(value).toBe(255n);
  });

  it("creates from hex without prefix", () => {
    const value = Uint.fromHex.call("ff");
    expect(value).toBe(255n);
  });

  it("creates from long hex", () => {
    const value = Uint.fromHex.call("0x1234567890abcdef");
    expect(value).toBe(0x1234567890abcdefn);
  });

  it("creates zero from 0x0", () => {
    const value = Uint.fromHex.call("0x0");
    expect(value).toBe(0n);
  });

  it("throws on value exceeding MAX", () => {
    const hex = "0x" + "f".repeat(65); // Too large
    expect(() => Uint.fromHex.call(hex)).toThrow("exceeds maximum");
  });
});

describe("Uint.fromBigInt", () => {
  it("creates from valid bigint", () => {
    const value = Uint.fromBigInt.call(12345n);
    expect(value).toBe(12345n);
  });

  it("creates from MAX", () => {
    const value = Uint.fromBigInt.call(Uint.MAX as bigint);
    expect(value).toBe(Uint.MAX);
  });

  it("throws on negative", () => {
    expect(() => Uint.fromBigInt.call(-1n)).toThrow("cannot be negative");
  });

  it("throws on exceeding MAX", () => {
    const tooLarge = (Uint.MAX as bigint) + 1n;
    expect(() => Uint.fromBigInt.call(tooLarge)).toThrow("exceeds maximum");
  });
});

describe("Uint.fromNumber", () => {
  it("creates from valid number", () => {
    const value = Uint.fromNumber.call(1000);
    expect(value).toBe(1000n);
  });

  it("creates from zero", () => {
    const value = Uint.fromNumber.call(0);
    expect(value).toBe(0n);
  });

  it("creates from MAX_SAFE_INTEGER", () => {
    const value = Uint.fromNumber.call(Number.MAX_SAFE_INTEGER);
    expect(value).toBe(BigInt(Number.MAX_SAFE_INTEGER));
  });

  it("throws on float", () => {
    expect(() => Uint.fromNumber.call(3.14)).toThrow("must be an integer");
  });

  it("throws on negative", () => {
    expect(() => Uint.fromNumber.call(-100)).toThrow("cannot be negative");
  });
});

describe("Uint.fromBytes", () => {
  it("creates from single byte", () => {
    const bytes = new Uint8Array([0xff]);
    const value = Uint.fromBytes.call(bytes);
    expect(value).toBe(255n);
  });

  it("creates from multiple bytes", () => {
    const bytes = new Uint8Array([0x01, 0x02, 0x03]);
    const value = Uint.fromBytes.call(bytes);
    expect(value).toBe(0x010203n);
  });

  it("creates from 32 bytes", () => {
    const bytes = new Uint8Array(32);
    bytes[31] = 0xff;
    const value = Uint.fromBytes.call(bytes);
    expect(value).toBe(255n);
  });

  it("creates zero from empty-like bytes", () => {
    const bytes = new Uint8Array(32); // All zeros
    const value = Uint.fromBytes.call(bytes);
    expect(value).toBe(0n);
  });

  it("throws on bytes exceeding 32", () => {
    const bytes = new Uint8Array(33);
    expect(() => Uint.fromBytes.call(bytes)).toThrow("cannot exceed 32 bytes");
  });
});

describe("Uint.tryFrom", () => {
  it("returns value on valid input", () => {
    const value = Uint.tryFrom(100n);
    expect(value).toBe(100n);
  });

  it("returns undefined on negative", () => {
    const value = Uint.tryFrom(-1n);
    expect(value).toBeUndefined();
  });

  it("returns undefined on overflow", () => {
    const tooLarge = (Uint.MAX as bigint) + 1n;
    const value = Uint.tryFrom(tooLarge);
    expect(value).toBeUndefined();
  });

  it("returns undefined on invalid string", () => {
    const value = Uint.tryFrom("not a number");
    expect(value).toBeUndefined();
  });
});

// ============================================================================
// Conversion Tests
// ============================================================================

describe("Uint.toHex", () => {
  it("converts to padded hex by default", () => {
    const value = Uint.from(255);
    const hex = Uint.toHex.call(value);
    expect(hex).toBe("0x" + "0".repeat(62) + "ff");
    expect(hex.length).toBe(66); // 0x + 64 chars
  });

  it("converts to unpadded hex", () => {
    const value = Uint.from(255);
    const hex = Uint.toHex.call(value, false);
    expect(hex).toBe("0xff");
  });

  it("converts zero correctly", () => {
    const value = Uint.ZERO;
    const hex = Uint.toHex.call(value, false);
    expect(hex).toBe("0x0");
  });

  it("converts MAX correctly", () => {
    const value = Uint.MAX;
    const hex = Uint.toHex.call(value, false);
    expect(hex).toBe("0x" + "f".repeat(64));
  });
});

describe("Uint.toBigInt", () => {
  it("converts to bigint", () => {
    const value = Uint.from(12345);
    const bigint = Uint.toBigInt.call(value);
    expect(bigint).toBe(12345n);
    expect(typeof bigint).toBe("bigint");
  });

  it("converts MAX correctly", () => {
    const bigint = Uint.toBigInt.call(Uint.MAX);
    expect(bigint).toBe((1n << 256n) - 1n);
  });
});

describe("Uint.toNumber", () => {
  it("converts small values to number", () => {
    const value = Uint.from(1000);
    const num = Uint.toNumber.call(value);
    expect(num).toBe(1000);
    expect(typeof num).toBe("number");
  });

  it("converts MAX_SAFE_INTEGER correctly", () => {
    const value = Uint.from(Number.MAX_SAFE_INTEGER);
    const num = Uint.toNumber.call(value);
    expect(num).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("throws on value exceeding MAX_SAFE_INTEGER", () => {
    const value = Uint.from(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
    expect(() => Uint.toNumber.call(value)).toThrow("exceeds MAX_SAFE_INTEGER");
  });

  it("throws on MAX value", () => {
    expect(() => Uint.toNumber.call(Uint.MAX)).toThrow("exceeds MAX_SAFE_INTEGER");
  });
});

describe("Uint.toBytes", () => {
  it("converts to 32 bytes", () => {
    const value = Uint.from(255);
    const bytes = Uint.toBytes.call(value);
    expect(bytes.length).toBe(32);
    expect(bytes[31]).toBe(0xff);
    expect(bytes[30]).toBe(0x00);
  });

  it("converts zero correctly", () => {
    const value = Uint.ZERO;
    const bytes = Uint.toBytes.call(value);
    expect(bytes.length).toBe(32);
    expect(bytes.every(b => b === 0)).toBe(true);
  });

  it("converts MAX correctly", () => {
    const value = Uint.MAX;
    const bytes = Uint.toBytes.call(value);
    expect(bytes.length).toBe(32);
    expect(bytes.every(b => b === 0xff)).toBe(true);
  });

  it("roundtrips correctly", () => {
    const original = Uint.from(0x123456789abcdefn);
    const bytes = Uint.toBytes.call(original);
    const recovered = Uint.fromBytes.call(bytes);
    expect(recovered).toBe(original);
  });
});

describe("Uint.toString", () => {
  it("converts to decimal by default", () => {
    const value = Uint.from(255);
    const str = Uint.toString.call(value);
    expect(str).toBe("255");
  });

  it("converts to hexadecimal", () => {
    const value = Uint.from(255);
    const str = Uint.toString.call(value, 16);
    expect(str).toBe("ff");
  });

  it("converts to binary", () => {
    const value = Uint.from(5);
    const str = Uint.toString.call(value, 2);
    expect(str).toBe("101");
  });

  it("converts to octal", () => {
    const value = Uint.from(8);
    const str = Uint.toString.call(value, 8);
    expect(str).toBe("10");
  });
});

// ============================================================================
// Arithmetic Tests
// ============================================================================

describe("Uint.plus", () => {
  it("adds two values", () => {
    const a = Uint.from(100);
    const b = Uint.from(50);
    const sum = Uint.plus.call(a, b);
    expect(sum).toBe(150n);
  });

  it("adds zero", () => {
    const a = Uint.from(100);
    const sum = Uint.plus.call(a, Uint.ZERO);
    expect(sum).toBe(100n);
  });

  it("wraps on overflow", () => {
    const sum = Uint.plus.call(Uint.MAX, Uint.ONE);
    expect(sum).toBe(0n);
  });

  it("wraps correctly on large overflow", () => {
    const a = Uint.MAX;
    const b = Uint.from(10);
    const sum = Uint.plus.call(a, b);
    expect(sum).toBe(9n);
  });
});

describe("Uint.minus", () => {
  it("subtracts two values", () => {
    const a = Uint.from(100);
    const b = Uint.from(50);
    const diff = Uint.minus.call(a, b);
    expect(diff).toBe(50n);
  });

  it("subtracts zero", () => {
    const a = Uint.from(100);
    const diff = Uint.minus.call(a, Uint.ZERO);
    expect(diff).toBe(100n);
  });

  it("wraps on underflow", () => {
    const diff = Uint.minus.call(Uint.ZERO, Uint.ONE);
    expect(diff).toBe(Uint.MAX);
  });

  it("wraps correctly on large underflow", () => {
    const a = Uint.from(5);
    const b = Uint.from(10);
    const diff = Uint.minus.call(a, b);
    expect(diff).toBe((Uint.MAX as bigint) - 4n);
  });
});

describe("Uint.times", () => {
  it("multiplies two values", () => {
    const a = Uint.from(10);
    const b = Uint.from(5);
    const product = Uint.times.call(a, b);
    expect(product).toBe(50n);
  });

  it("multiplies by zero", () => {
    const a = Uint.from(100);
    const product = Uint.times.call(a, Uint.ZERO);
    expect(product).toBe(0n);
  });

  it("multiplies by one", () => {
    const a = Uint.from(100);
    const product = Uint.times.call(a, Uint.ONE);
    expect(product).toBe(100n);
  });

  it("wraps on overflow", () => {
    const a = Uint.MAX;
    const b = Uint.from(2);
    const product = Uint.times.call(a, b);
    // MAX * 2 = 2^257 - 2, which wraps to (2^257 - 2) & (2^256 - 1) = 2^256 - 2
    expect(product).toBe((Uint.MAX as bigint) - 1n);
  });
});

describe("Uint.dividedBy", () => {
  it("divides two values", () => {
    const a = Uint.from(100);
    const b = Uint.from(10);
    const quotient = Uint.dividedBy.call(a, b);
    expect(quotient).toBe(10n);
  });

  it("floors division", () => {
    const a = Uint.from(100);
    const b = Uint.from(30);
    const quotient = Uint.dividedBy.call(a, b);
    expect(quotient).toBe(3n);
  });

  it("divides by one", () => {
    const a = Uint.from(100);
    const quotient = Uint.dividedBy.call(a, Uint.ONE);
    expect(quotient).toBe(100n);
  });

  it("divides MAX by MAX", () => {
    const quotient = Uint.dividedBy.call(Uint.MAX, Uint.MAX);
    expect(quotient).toBe(1n);
  });

  it("throws on division by zero", () => {
    const a = Uint.from(100);
    expect(() => Uint.dividedBy.call(a, Uint.ZERO)).toThrow("Division by zero");
  });
});

describe("Uint.modulo", () => {
  it("calculates modulo", () => {
    const a = Uint.from(100);
    const b = Uint.from(30);
    const remainder = Uint.modulo.call(a, b);
    expect(remainder).toBe(10n);
  });

  it("returns zero for exact division", () => {
    const a = Uint.from(100);
    const b = Uint.from(10);
    const remainder = Uint.modulo.call(a, b);
    expect(remainder).toBe(0n);
  });

  it("modulo by one is zero", () => {
    const a = Uint.from(100);
    const remainder = Uint.modulo.call(a, Uint.ONE);
    expect(remainder).toBe(0n);
  });

  it("throws on modulo by zero", () => {
    const a = Uint.from(100);
    expect(() => Uint.modulo.call(a, Uint.ZERO)).toThrow("Modulo by zero");
  });
});

describe("Uint.toPower", () => {
  it("calculates exponentiation", () => {
    const base = Uint.from(2);
    const exp = Uint.from(8);
    const result = Uint.toPower.call(base, exp);
    expect(result).toBe(256n);
  });

  it("handles exponent of zero", () => {
    const base = Uint.from(100);
    const result = Uint.toPower.call(base, Uint.ZERO);
    expect(result).toBe(1n);
  });

  it("handles base of zero", () => {
    const result = Uint.toPower.call(Uint.ZERO, Uint.from(10));
    expect(result).toBe(0n);
  });

  it("handles exponent of one", () => {
    const base = Uint.from(100);
    const result = Uint.toPower.call(base, Uint.ONE);
    expect(result).toBe(100n);
  });

  it("wraps on overflow", () => {
    const base = Uint.from(2);
    const exp = Uint.from(256);
    const result = Uint.toPower.call(base, exp);
    // 2^256 wraps to 0
    expect(result).toBe(0n);
  });
});

// ============================================================================
// Bitwise Tests
// ============================================================================

describe("Uint.bitwiseAnd", () => {
  it("performs bitwise AND", () => {
    const a = Uint.from(0xff);
    const b = Uint.from(0x0f);
    const result = Uint.bitwiseAnd.call(a, b);
    expect(result).toBe(0x0fn);
  });

  it("AND with zero is zero", () => {
    const a = Uint.from(0xff);
    const result = Uint.bitwiseAnd.call(a, Uint.ZERO);
    expect(result).toBe(0n);
  });

  it("AND with MAX is identity", () => {
    const a = Uint.from(0xff);
    const result = Uint.bitwiseAnd.call(a, Uint.MAX);
    expect(result).toBe(0xffn);
  });
});

describe("Uint.bitwiseOr", () => {
  it("performs bitwise OR", () => {
    const a = Uint.from(0xf0);
    const b = Uint.from(0x0f);
    const result = Uint.bitwiseOr.call(a, b);
    expect(result).toBe(0xffn);
  });

  it("OR with zero is identity", () => {
    const a = Uint.from(0xff);
    const result = Uint.bitwiseOr.call(a, Uint.ZERO);
    expect(result).toBe(0xffn);
  });

  it("OR with MAX is MAX", () => {
    const a = Uint.from(0xff);
    const result = Uint.bitwiseOr.call(a, Uint.MAX);
    expect(result).toBe(Uint.MAX);
  });
});

describe("Uint.bitwiseXor", () => {
  it("performs bitwise XOR", () => {
    const a = Uint.from(0xff);
    const b = Uint.from(0x0f);
    const result = Uint.bitwiseXor.call(a, b);
    expect(result).toBe(0xf0n);
  });

  it("XOR with zero is identity", () => {
    const a = Uint.from(0xff);
    const result = Uint.bitwiseXor.call(a, Uint.ZERO);
    expect(result).toBe(0xffn);
  });

  it("XOR with self is zero", () => {
    const a = Uint.from(0xff);
    const result = Uint.bitwiseXor.call(a, a);
    expect(result).toBe(0n);
  });
});

describe("Uint.bitwiseNot", () => {
  it("performs bitwise NOT", () => {
    const result = Uint.bitwiseNot.call(Uint.ZERO);
    expect(result).toBe(Uint.MAX);
  });

  it("NOT of MAX is ZERO", () => {
    const result = Uint.bitwiseNot.call(Uint.MAX);
    expect(result).toBe(Uint.ZERO);
  });

  it("double NOT is identity", () => {
    const a = Uint.from(0xff);
    const result = Uint.bitwiseNot.call(Uint.bitwiseNot.call(a));
    expect(result).toBe(0xffn);
  });
});

describe("Uint.shiftLeft", () => {
  it("shifts left by 1", () => {
    const a = Uint.from(1);
    const result = Uint.shiftLeft.call(a, Uint.ONE);
    expect(result).toBe(2n);
  });

  it("shifts left by 8", () => {
    const a = Uint.from(1);
    const result = Uint.shiftLeft.call(a, Uint.from(8));
    expect(result).toBe(256n);
  });

  it("shifts left by 0", () => {
    const a = Uint.from(100);
    const result = Uint.shiftLeft.call(a, Uint.ZERO);
    expect(result).toBe(100n);
  });

  it("wraps on overflow", () => {
    const a = Uint.from(1);
    const result = Uint.shiftLeft.call(a, Uint.from(256));
    expect(result).toBe(0n);
  });
});

describe("Uint.shiftRight", () => {
  it("shifts right by 1", () => {
    const a = Uint.from(4);
    const result = Uint.shiftRight.call(a, Uint.ONE);
    expect(result).toBe(2n);
  });

  it("shifts right by 8", () => {
    const a = Uint.from(256);
    const result = Uint.shiftRight.call(a, Uint.from(8));
    expect(result).toBe(1n);
  });

  it("shifts right by 0", () => {
    const a = Uint.from(100);
    const result = Uint.shiftRight.call(a, Uint.ZERO);
    expect(result).toBe(100n);
  });

  it("shift right beyond bit length gives zero", () => {
    const a = Uint.from(0xff);
    const result = Uint.shiftRight.call(a, Uint.from(256));
    expect(result).toBe(0n);
  });
});

// ============================================================================
// Comparison Tests
// ============================================================================

describe("Uint.equals", () => {
  it("returns true for equal values", () => {
    const a = Uint.from(100);
    const b = Uint.from(100);
    expect(Uint.equals.call(a, b)).toBe(true);
  });

  it("returns false for unequal values", () => {
    const a = Uint.from(100);
    const b = Uint.from(200);
    expect(Uint.equals.call(a, b)).toBe(false);
  });

  it("compares zero correctly", () => {
    expect(Uint.equals.call(Uint.ZERO, Uint.ZERO)).toBe(true);
    expect(Uint.equals.call(Uint.ZERO, Uint.ONE)).toBe(false);
  });

  it("compares MAX correctly", () => {
    expect(Uint.equals.call(Uint.MAX, Uint.MAX)).toBe(true);
    expect(Uint.equals.call(Uint.MAX, Uint.ZERO)).toBe(false);
  });
});

describe("Uint.notEquals", () => {
  it("returns false for equal values", () => {
    const a = Uint.from(100);
    const b = Uint.from(100);
    expect(Uint.notEquals.call(a, b)).toBe(false);
  });

  it("returns true for unequal values", () => {
    const a = Uint.from(100);
    const b = Uint.from(200);
    expect(Uint.notEquals.call(a, b)).toBe(true);
  });
});

describe("Uint.lessThan", () => {
  it("returns true when first is less", () => {
    const a = Uint.from(100);
    const b = Uint.from(200);
    expect(Uint.lessThan.call(a, b)).toBe(true);
  });

  it("returns false when first is greater", () => {
    const a = Uint.from(200);
    const b = Uint.from(100);
    expect(Uint.lessThan.call(a, b)).toBe(false);
  });

  it("returns false when equal", () => {
    const a = Uint.from(100);
    const b = Uint.from(100);
    expect(Uint.lessThan.call(a, b)).toBe(false);
  });
});

describe("Uint.lessThanOrEqual", () => {
  it("returns true when first is less", () => {
    const a = Uint.from(100);
    const b = Uint.from(200);
    expect(Uint.lessThanOrEqual.call(a, b)).toBe(true);
  });

  it("returns true when equal", () => {
    const a = Uint.from(100);
    const b = Uint.from(100);
    expect(Uint.lessThanOrEqual.call(a, b)).toBe(true);
  });

  it("returns false when first is greater", () => {
    const a = Uint.from(200);
    const b = Uint.from(100);
    expect(Uint.lessThanOrEqual.call(a, b)).toBe(false);
  });
});

describe("Uint.greaterThan", () => {
  it("returns true when first is greater", () => {
    const a = Uint.from(200);
    const b = Uint.from(100);
    expect(Uint.greaterThan.call(a, b)).toBe(true);
  });

  it("returns false when first is less", () => {
    const a = Uint.from(100);
    const b = Uint.from(200);
    expect(Uint.greaterThan.call(a, b)).toBe(false);
  });

  it("returns false when equal", () => {
    const a = Uint.from(100);
    const b = Uint.from(100);
    expect(Uint.greaterThan.call(a, b)).toBe(false);
  });
});

describe("Uint.greaterThanOrEqual", () => {
  it("returns true when first is greater", () => {
    const a = Uint.from(200);
    const b = Uint.from(100);
    expect(Uint.greaterThanOrEqual.call(a, b)).toBe(true);
  });

  it("returns true when equal", () => {
    const a = Uint.from(100);
    const b = Uint.from(100);
    expect(Uint.greaterThanOrEqual.call(a, b)).toBe(true);
  });

  it("returns false when first is less", () => {
    const a = Uint.from(100);
    const b = Uint.from(200);
    expect(Uint.greaterThanOrEqual.call(a, b)).toBe(false);
  });
});

describe("Uint.isZero", () => {
  it("returns true for zero", () => {
    expect(Uint.isZero.call(Uint.ZERO)).toBe(true);
    expect(Uint.isZero.call(Uint.from(0))).toBe(true);
  });

  it("returns false for non-zero", () => {
    expect(Uint.isZero.call(Uint.ONE)).toBe(false);
    expect(Uint.isZero.call(Uint.from(100))).toBe(false);
  });
});

describe("Uint.minimum", () => {
  it("returns smaller value", () => {
    const a = Uint.from(100);
    const b = Uint.from(200);
    expect(Uint.minimum.call(a, b)).toBe(100n);
    expect(Uint.minimum.call(b, a)).toBe(100n);
  });

  it("returns either when equal", () => {
    const a = Uint.from(100);
    const b = Uint.from(100);
    expect(Uint.minimum.call(a, b)).toBe(100n);
  });
});

describe("Uint.maximum", () => {
  it("returns larger value", () => {
    const a = Uint.from(100);
    const b = Uint.from(200);
    expect(Uint.maximum.call(a, b)).toBe(200n);
    expect(Uint.maximum.call(b, a)).toBe(200n);
  });

  it("returns either when equal", () => {
    const a = Uint.from(100);
    const b = Uint.from(100);
    expect(Uint.maximum.call(a, b)).toBe(100n);
  });
});

// ============================================================================
// Utility Tests
// ============================================================================

describe("Uint.isValid", () => {
  it("returns true for valid bigint", () => {
    expect(Uint.isValid(100n)).toBe(true);
    expect(Uint.isValid(0n)).toBe(true);
  });

  it("returns true for MAX", () => {
    expect(Uint.isValid(Uint.MAX as bigint)).toBe(true);
  });

  it("returns false for negative", () => {
    expect(Uint.isValid(-1n)).toBe(false);
  });

  it("returns false for exceeding MAX", () => {
    const tooLarge = (Uint.MAX as bigint) + 1n;
    expect(Uint.isValid(tooLarge)).toBe(false);
  });

  it("returns false for non-bigint", () => {
    expect(Uint.isValid(100)).toBe(false);
    expect(Uint.isValid("100")).toBe(false);
    expect(Uint.isValid(null)).toBe(false);
    expect(Uint.isValid(undefined)).toBe(false);
  });
});

describe("Uint.bitLength", () => {
  it("returns 0 for zero", () => {
    expect(Uint.bitLength.call(Uint.ZERO)).toBe(0);
  });

  it("returns 1 for one", () => {
    expect(Uint.bitLength.call(Uint.ONE)).toBe(1);
  });

  it("returns correct length for powers of 2", () => {
    expect(Uint.bitLength.call(Uint.from(2))).toBe(2);   // 10
    expect(Uint.bitLength.call(Uint.from(4))).toBe(3);   // 100
    expect(Uint.bitLength.call(Uint.from(8))).toBe(4);   // 1000
    expect(Uint.bitLength.call(Uint.from(256))).toBe(9); // 100000000
  });

  it("returns correct length for non-powers of 2", () => {
    expect(Uint.bitLength.call(Uint.from(255))).toBe(8);  // 11111111
    expect(Uint.bitLength.call(Uint.from(1000))).toBe(10); // 1111101000
  });

  it("returns 256 for MAX", () => {
    expect(Uint.bitLength.call(Uint.MAX)).toBe(256);
  });
});

describe("Uint.leadingZeros", () => {
  it("returns 256 for zero", () => {
    expect(Uint.leadingZeros.call(Uint.ZERO)).toBe(256);
  });

  it("returns 255 for one", () => {
    expect(Uint.leadingZeros.call(Uint.ONE)).toBe(255);
  });

  it("returns 0 for MAX", () => {
    expect(Uint.leadingZeros.call(Uint.MAX)).toBe(0);
  });

  it("returns correct count for powers of 2", () => {
    expect(Uint.leadingZeros.call(Uint.from(2))).toBe(254);
    expect(Uint.leadingZeros.call(Uint.from(256))).toBe(247);
  });
});

describe("Uint.popCount", () => {
  it("returns 0 for zero", () => {
    expect(Uint.popCount.call(Uint.ZERO)).toBe(0);
  });

  it("returns 1 for one", () => {
    expect(Uint.popCount.call(Uint.ONE)).toBe(1);
  });

  it("returns 256 for MAX", () => {
    expect(Uint.popCount.call(Uint.MAX)).toBe(256);
  });

  it("returns correct count for 0xff", () => {
    expect(Uint.popCount.call(Uint.from(0xff))).toBe(8);
  });

  it("returns correct count for powers of 2", () => {
    expect(Uint.popCount.call(Uint.from(2))).toBe(1);
    expect(Uint.popCount.call(Uint.from(4))).toBe(1);
    expect(Uint.popCount.call(Uint.from(256))).toBe(1);
  });

  it("returns correct count for mixed bits", () => {
    expect(Uint.popCount.call(Uint.from(0b10101010))).toBe(4);
    expect(Uint.popCount.call(Uint.from(0b11110000))).toBe(4);
  });
});
