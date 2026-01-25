import * as Effect from "effect/Effect";
import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as Uint from "./index.js";

const MAX_UINT256 =
	115792089237316195423570985008687907853269984665640564039457584007913129639935n;

describe("Uint.BigInt", () => {
	describe("decode", () => {
		it("parses valid bigint", () => {
			const value = S.decodeSync(Uint.BigInt)(1000000000000000000n);
			expect(typeof value).toBe("bigint");
		});

		it("parses zero", () => {
			const value = S.decodeSync(Uint.BigInt)(0n);
			expect(S.encodeSync(Uint.BigInt)(value)).toBe(0n);
		});

		it("parses max uint256", () => {
			const value = S.decodeSync(Uint.BigInt)(MAX_UINT256);
			expect(S.encodeSync(Uint.BigInt)(value)).toBe(MAX_UINT256);
		});

		it("fails on negative bigint", () => {
			expect(() => S.decodeSync(Uint.BigInt)(-1n)).toThrow();
		});

		it("fails on overflow", () => {
			expect(() => S.decodeSync(Uint.BigInt)(MAX_UINT256 + 1n)).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to bigint", () => {
			const value = S.decodeSync(Uint.BigInt)(1000n);
			const encoded = S.encodeSync(Uint.BigInt)(value);
			expect(encoded).toBe(1000n);
		});

		it("round-trips correctly", () => {
			const original = 123456789012345678901234567890n;
			const value = S.decodeSync(Uint.BigInt)(original);
			const encoded = S.encodeSync(Uint.BigInt)(value);
			expect(encoded).toBe(original);
		});
	});
});

describe("Uint.Hex", () => {
	describe("decode", () => {
		it("parses valid hex with 0x prefix", () => {
			const value = S.decodeSync(Uint.Hex)("0xde0b6b3a7640000");
			expect(S.encodeSync(Uint.BigInt)(value)).toBe(1000000000000000000n);
		});

		it("parses valid hex without prefix", () => {
			const value = S.decodeSync(Uint.Hex)("de0b6b3a7640000");
			expect(S.encodeSync(Uint.BigInt)(value)).toBe(1000000000000000000n);
		});

		it("parses zero", () => {
			const value = S.decodeSync(Uint.Hex)("0x0");
			expect(S.encodeSync(Uint.BigInt)(value)).toBe(0n);
		});

		it("fails on invalid hex", () => {
			expect(() => S.decodeSync(Uint.Hex)("0xGGGG")).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to padded hex", () => {
			const value = S.decodeSync(Uint.BigInt)(255n);
			const hex = S.encodeSync(Uint.Hex)(value);
			expect(hex).toMatch(/^0x[0-9a-f]{64}$/);
		});

		it("round-trips correctly", () => {
			const original =
				"0x00000000000000000000000000000000000000000000000000000000000003e8";
			const value = S.decodeSync(Uint.Hex)(original);
			const encoded = S.encodeSync(Uint.Hex)(value);
			expect(encoded).toBe(original);
		});
	});
});

describe("Uint.Number", () => {
	describe("decode", () => {
		it("parses valid number", () => {
			const value = S.decodeSync(Uint.Number)(1000);
			expect(S.encodeSync(Uint.Number)(value)).toBe(1000);
		});

		it("parses zero", () => {
			const value = S.decodeSync(Uint.Number)(0);
			expect(S.encodeSync(Uint.Number)(value)).toBe(0);
		});

		it("fails on negative number", () => {
			expect(() => S.decodeSync(Uint.Number)(-1)).toThrow();
		});

		it("fails on non-integer", () => {
			expect(() => S.decodeSync(Uint.Number)(1.5)).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to number", () => {
			const value = S.decodeSync(Uint.Number)(42);
			const encoded = S.encodeSync(Uint.Number)(value);
			expect(encoded).toBe(42);
		});
	});
});

describe("Uint.String", () => {
	describe("decode", () => {
		it("parses valid decimal string", () => {
			const value = S.decodeSync(Uint.String)("1000000000000000000");
			expect(S.encodeSync(Uint.BigInt)(value)).toBe(1000000000000000000n);
		});

		it("parses zero", () => {
			const value = S.decodeSync(Uint.String)("0");
			expect(S.encodeSync(Uint.BigInt)(value)).toBe(0n);
		});

		it("fails on invalid string", () => {
			expect(() => S.decodeSync(Uint.String)("not a number")).toThrow();
		});

		it("fails on negative string", () => {
			expect(() => S.decodeSync(Uint.String)("-1")).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to decimal string", () => {
			const value = S.decodeSync(Uint.BigInt)(1000n);
			const encoded = S.encodeSync(Uint.String)(value);
			expect(encoded).toBe("1000");
		});
	});
});

describe("Uint.Bytes", () => {
	describe("decode", () => {
		it("parses 32-byte array", () => {
			const bytes = new Uint8Array(32).fill(0);
			bytes[31] = 100;
			const value = S.decodeSync(Uint.Bytes)(bytes);
			expect(S.encodeSync(Uint.BigInt)(value)).toBe(100n);
		});

		it("parses shorter array (zero-padded)", () => {
			const bytes = new Uint8Array([0, 0, 0, 100]);
			const value = S.decodeSync(Uint.Bytes)(bytes);
			expect(S.encodeSync(Uint.BigInt)(value)).toBe(100n);
		});
	});

	describe("encode", () => {
		it("encodes to 32-byte Uint8Array", () => {
			const value = S.decodeSync(Uint.BigInt)(100n);
			const bytes = S.encodeSync(Uint.Bytes)(value);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(32);
			expect(bytes[31]).toBe(100);
		});
	});
});

describe("arithmetic operations", () => {
	const a = S.decodeSync(Uint.BigInt)(100n);
	const b = S.decodeSync(Uint.BigInt)(30n);
	const zero = S.decodeSync(Uint.BigInt)(0n);
	const one = S.decodeSync(Uint.BigInt)(1n);
	const max = S.decodeSync(Uint.BigInt)(MAX_UINT256);

	describe("plus", () => {
		it("adds two values", () => {
			const result = Effect.runSync(Uint.plus(a, b));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(130n);
		});

		it("handles zero", () => {
			const result = Effect.runSync(Uint.plus(a, zero));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(100n);
		});

		it("wraps on overflow", () => {
			const result = Effect.runSync(Uint.plus(max, one));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0n);
		});
	});

	describe("minus", () => {
		it("subtracts two values", () => {
			const result = Effect.runSync(Uint.minus(a, b));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(70n);
		});

		it("handles zero", () => {
			const result = Effect.runSync(Uint.minus(a, zero));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(100n);
		});

		it("wraps on underflow", () => {
			const result = Effect.runSync(Uint.minus(zero, one));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(MAX_UINT256);
		});
	});

	describe("times", () => {
		it("multiplies two values", () => {
			const result = Effect.runSync(Uint.times(a, b));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(3000n);
		});

		it("handles zero", () => {
			const result = Effect.runSync(Uint.times(a, zero));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0n);
		});

		it("handles one", () => {
			const result = Effect.runSync(Uint.times(a, one));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(100n);
		});

		it("wraps on overflow", () => {
			const result = Effect.runSync(
				Uint.times(max, S.decodeSync(Uint.BigInt)(2n)),
			);
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(MAX_UINT256 - 1n);
		});
	});
});

describe("comparison operations", () => {
	const a = S.decodeSync(Uint.BigInt)(100n);
	const b = S.decodeSync(Uint.BigInt)(30n);
	const c = S.decodeSync(Uint.BigInt)(100n);

	describe("equals", () => {
		it("returns true for equal values", () => {
			expect(Effect.runSync(Uint.equals(a, c))).toBe(true);
		});

		it("returns false for different values", () => {
			expect(Effect.runSync(Uint.equals(a, b))).toBe(false);
		});
	});

	describe("lessThan", () => {
		it("returns true when a < b", () => {
			expect(Effect.runSync(Uint.lessThan(b, a))).toBe(true);
		});

		it("returns false when a >= b", () => {
			expect(Effect.runSync(Uint.lessThan(a, b))).toBe(false);
			expect(Effect.runSync(Uint.lessThan(a, c))).toBe(false);
		});
	});

	describe("greaterThan", () => {
		it("returns true when a > b", () => {
			expect(Effect.runSync(Uint.greaterThan(a, b))).toBe(true);
		});

		it("returns false when a <= b", () => {
			expect(Effect.runSync(Uint.greaterThan(b, a))).toBe(false);
			expect(Effect.runSync(Uint.greaterThan(a, c))).toBe(false);
		});
	});

	describe("lessThanOrEqual", () => {
		it("returns true when a <= b", () => {
			expect(Effect.runSync(Uint.lessThanOrEqual(b, a))).toBe(true);
			expect(Effect.runSync(Uint.lessThanOrEqual(a, c))).toBe(true);
		});

		it("returns false when a > b", () => {
			expect(Effect.runSync(Uint.lessThanOrEqual(a, b))).toBe(false);
		});
	});

	describe("greaterThanOrEqual", () => {
		it("returns true when a >= b", () => {
			expect(Effect.runSync(Uint.greaterThanOrEqual(a, b))).toBe(true);
			expect(Effect.runSync(Uint.greaterThanOrEqual(a, c))).toBe(true);
		});

		it("returns false when a < b", () => {
			expect(Effect.runSync(Uint.greaterThanOrEqual(b, a))).toBe(false);
		});
	});
});

describe("bitwise operations", () => {
	const a = S.decodeSync(Uint.BigInt)(0b1100n);
	const b = S.decodeSync(Uint.BigInt)(0b1010n);
	const zero = S.decodeSync(Uint.BigInt)(0n);
	const max = S.decodeSync(Uint.BigInt)(MAX_UINT256);

	describe("bitwiseAnd", () => {
		it("performs AND operation", () => {
			const result = Effect.runSync(Uint.bitwiseAnd(a, b));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0b1000n);
		});

		it("AND with zero is zero", () => {
			const result = Effect.runSync(Uint.bitwiseAnd(a, zero));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0n);
		});
	});

	describe("bitwiseOr", () => {
		it("performs OR operation", () => {
			const result = Effect.runSync(Uint.bitwiseOr(a, b));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0b1110n);
		});

		it("OR with zero is identity", () => {
			const result = Effect.runSync(Uint.bitwiseOr(a, zero));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0b1100n);
		});
	});

	describe("bitwiseXor", () => {
		it("performs XOR operation", () => {
			const result = Effect.runSync(Uint.bitwiseXor(a, b));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0b0110n);
		});

		it("XOR with self is zero", () => {
			const result = Effect.runSync(Uint.bitwiseXor(a, a));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0n);
		});
	});

	describe("bitwiseNot", () => {
		it("performs NOT operation", () => {
			const result = Effect.runSync(Uint.bitwiseNot(zero));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(MAX_UINT256);
		});

		it("NOT of max is zero", () => {
			const result = Effect.runSync(Uint.bitwiseNot(max));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0n);
		});
	});

	describe("shiftLeft", () => {
		it("shifts left", () => {
			const one = S.decodeSync(Uint.BigInt)(1n);
			const bits = S.decodeSync(Uint.BigInt)(8n);
			const result = Effect.runSync(Uint.shiftLeft(one, bits));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(256n);
		});

		it("shift by zero is identity", () => {
			const result = Effect.runSync(Uint.shiftLeft(a, zero));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0b1100n);
		});
	});

	describe("shiftRight", () => {
		it("shifts right", () => {
			const val = S.decodeSync(Uint.BigInt)(256n);
			const bits = S.decodeSync(Uint.BigInt)(8n);
			const result = Effect.runSync(Uint.shiftRight(val, bits));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(1n);
		});

		it("shift by zero is identity", () => {
			const result = Effect.runSync(Uint.shiftRight(a, zero));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0b1100n);
		});
	});
});

describe("utility functions", () => {
	const zero = S.decodeSync(Uint.BigInt)(0n);
	const one = S.decodeSync(Uint.BigInt)(1n);
	const two = S.decodeSync(Uint.BigInt)(2n);
	const sixteen = S.decodeSync(Uint.BigInt)(16n);
	const fifteen = S.decodeSync(Uint.BigInt)(15n);

	describe("isZero", () => {
		it("returns true for zero", () => {
			expect(Effect.runSync(Uint.isZero(zero))).toBe(true);
		});

		it("returns false for non-zero", () => {
			expect(Effect.runSync(Uint.isZero(one))).toBe(false);
		});
	});

	describe("isPowerOf2", () => {
		it("returns true for powers of 2", () => {
			expect(Effect.runSync(Uint.isPowerOf2(one))).toBe(true);
			expect(Effect.runSync(Uint.isPowerOf2(two))).toBe(true);
			expect(Effect.runSync(Uint.isPowerOf2(sixteen))).toBe(true);
		});

		it("returns false for non-powers of 2", () => {
			expect(Effect.runSync(Uint.isPowerOf2(zero))).toBe(false);
			expect(Effect.runSync(Uint.isPowerOf2(fifteen))).toBe(false);
		});
	});

	describe("bitLength", () => {
		it("returns correct bit length", () => {
			expect(Effect.runSync(Uint.bitLength(zero))).toBe(0);
			expect(Effect.runSync(Uint.bitLength(one))).toBe(1);
			expect(Effect.runSync(Uint.bitLength(fifteen))).toBe(4);
			expect(Effect.runSync(Uint.bitLength(sixteen))).toBe(5);
		});
	});

	describe("popCount", () => {
		it("returns number of set bits", () => {
			expect(Effect.runSync(Uint.popCount(zero))).toBe(0);
			expect(Effect.runSync(Uint.popCount(one))).toBe(1);
			expect(Effect.runSync(Uint.popCount(fifteen))).toBe(4);
		});
	});

	describe("leadingZeros", () => {
		it("returns number of leading zeros", () => {
			expect(Effect.runSync(Uint.leadingZeros(zero))).toBe(256);
			expect(Effect.runSync(Uint.leadingZeros(one))).toBe(255);
		});
	});

	describe("clone", () => {
		it("creates a copy with same value", () => {
			const original = S.decodeSync(Uint.BigInt)(12345n);
			const cloned = Effect.runSync(Uint.clone(original));
			expect(S.encodeSync(Uint.BigInt)(cloned)).toBe(12345n);
		});
	});
});

describe("aggregate functions", () => {
	const a = S.decodeSync(Uint.BigInt)(10n);
	const b = S.decodeSync(Uint.BigInt)(20n);
	const c = S.decodeSync(Uint.BigInt)(30n);

	describe("min", () => {
		it("returns minimum of multiple values", () => {
			const result = Effect.runSync(Uint.min(a, b, c));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(10n);
		});

		it("handles single value", () => {
			const result = Effect.runSync(Uint.min(b));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(20n);
		});
	});

	describe("max", () => {
		it("returns maximum of multiple values", () => {
			const result = Effect.runSync(Uint.max(a, b, c));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(30n);
		});

		it("handles single value", () => {
			const result = Effect.runSync(Uint.max(b));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(20n);
		});
	});

	describe("sum", () => {
		it("returns sum of multiple values", () => {
			const result = Effect.runSync(Uint.sum(a, b, c));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(60n);
		});
	});

	describe("product", () => {
		it("returns product of multiple values", () => {
			const result = Effect.runSync(Uint.product(a, b, c));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(6000n);
		});
	});

	describe("gcd", () => {
		it("returns greatest common divisor", () => {
			const x = S.decodeSync(Uint.BigInt)(48n);
			const y = S.decodeSync(Uint.BigInt)(18n);
			const result = Effect.runSync(Uint.gcd(x, y));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(6n);
		});

		it("gcd with zero returns other value", () => {
			const zero = S.decodeSync(Uint.BigInt)(0n);
			const result = Effect.runSync(Uint.gcd(a, zero));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(10n);
		});
	});

	describe("lcm", () => {
		it("returns least common multiple", () => {
			const x = S.decodeSync(Uint.BigInt)(4n);
			const y = S.decodeSync(Uint.BigInt)(6n);
			const result = Effect.runSync(Uint.lcm(x, y));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(12n);
		});
	});
});

describe("edge cases", () => {
	describe("zero", () => {
		it("zero + zero = zero", () => {
			const zero = S.decodeSync(Uint.BigInt)(0n);
			const result = Effect.runSync(Uint.plus(zero, zero));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0n);
		});

		it("zero * anything = zero", () => {
			const zero = S.decodeSync(Uint.BigInt)(0n);
			const max = S.decodeSync(Uint.BigInt)(MAX_UINT256);
			const result = Effect.runSync(Uint.times(zero, max));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0n);
		});
	});

	describe("max uint256", () => {
		it("max + max wraps correctly", () => {
			const max = S.decodeSync(Uint.BigInt)(MAX_UINT256);
			const result = Effect.runSync(Uint.plus(max, max));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(MAX_UINT256 - 1n);
		});

		it("max AND max = max", () => {
			const max = S.decodeSync(Uint.BigInt)(MAX_UINT256);
			const result = Effect.runSync(Uint.bitwiseAnd(max, max));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(MAX_UINT256);
		});

		it("max XOR max = zero", () => {
			const max = S.decodeSync(Uint.BigInt)(MAX_UINT256);
			const result = Effect.runSync(Uint.bitwiseXor(max, max));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0n);
		});
	});

	describe("shift edge cases", () => {
		it("shift left by 256 or more results in zero", () => {
			const one = S.decodeSync(Uint.BigInt)(1n);
			const bits = S.decodeSync(Uint.BigInt)(256n);
			const result = Effect.runSync(Uint.shiftLeft(one, bits));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0n);
		});

		it("shift right by 256 or more results in zero", () => {
			const max = S.decodeSync(Uint.BigInt)(MAX_UINT256);
			const bits = S.decodeSync(Uint.BigInt)(256n);
			const result = Effect.runSync(Uint.shiftRight(max, bits));
			expect(S.encodeSync(Uint.BigInt)(result)).toBe(0n);
		});
	});
});
