/**
 * Tests for Uint edge cases and boundary conditions
 */

import { describe, expect, it } from "vitest";
import type { BrandedUint } from "./BrandedUint.js";
import * as Uint from "./index.js";

// ============================================================================
// Boundary Value Tests
// ============================================================================

describe("Uint boundary values", () => {
	it("handles ZERO correctly in all operations", () => {
		expect(Uint.plus(Uint.ZERO, Uint.ZERO)).toBe(0n);
		expect(Uint.minus(Uint.ZERO, Uint.ZERO)).toBe(0n);
		expect(Uint.times(Uint.ZERO, Uint.MAX)).toBe(0n);
		expect(Uint.times(Uint.MAX, Uint.ZERO)).toBe(0n);
		expect(Uint.bitwiseAnd(Uint.ZERO, Uint.MAX)).toBe(0n);
		expect(Uint.bitwiseOr(Uint.ZERO, Uint.ZERO)).toBe(0n);
		expect(Uint.bitwiseXor(Uint.ZERO, Uint.ZERO)).toBe(0n);
		expect(Uint.shiftLeft(Uint.ZERO, Uint.from(10))).toBe(0n);
		expect(Uint.shiftRight(Uint.ZERO, Uint.from(10))).toBe(0n);
	});

	it("handles ONE correctly in all operations", () => {
		expect(Uint.plus(Uint.ONE, Uint.ZERO)).toBe(1n);
		expect(Uint.minus(Uint.ONE, Uint.ZERO)).toBe(1n);
		expect(Uint.times(Uint.ONE, Uint.ONE)).toBe(1n);
		expect(Uint.times(Uint.from(100), Uint.ONE)).toBe(100n);
		expect(Uint.dividedBy(Uint.from(100), Uint.ONE)).toBe(100n);
		expect(Uint.modulo(Uint.from(100), Uint.ONE)).toBe(0n);
		expect(Uint.toPower(Uint.from(100), Uint.ONE)).toBe(100n);
	});

	it("handles MAX correctly in all operations", () => {
		expect(Uint.plus(Uint.MAX, Uint.ZERO)).toBe(Uint.MAX);
		expect(Uint.minus(Uint.MAX, Uint.ZERO)).toBe(Uint.MAX);
		expect(Uint.times(Uint.MAX, Uint.ONE)).toBe(Uint.MAX);
		expect(Uint.dividedBy(Uint.MAX, Uint.ONE)).toBe(Uint.MAX);
		expect(Uint.dividedBy(Uint.MAX, Uint.MAX)).toBe(1n);
		expect(Uint.modulo(Uint.MAX, Uint.MAX)).toBe(0n);
		expect(Uint.bitwiseAnd(Uint.MAX, Uint.MAX)).toBe(Uint.MAX);
		expect(Uint.bitwiseOr(Uint.MAX, Uint.ZERO)).toBe(Uint.MAX);
		expect(Uint.bitwiseXor(Uint.MAX, Uint.MAX)).toBe(0n);
	});

	it("handles powers of 2 correctly", () => {
		for (let i = 0; i < 256; i++) {
			const power = Uint.from(2n ** BigInt(i));
			expect(Uint.isPowerOf2(power)).toBe(true);
			expect(Uint.popCount(power)).toBe(1);
		}
	});

	it("handles sequential values at boundaries", () => {
		const boundary = 2n ** 64n;
		const values = [
			boundary - 2n,
			boundary - 1n,
			boundary,
			boundary + 1n,
			boundary + 2n,
		];

		for (const val of values) {
			const uint = Uint.from(val);
			expect(Uint.toBigInt(uint)).toBe(val);
			const bytes = Uint.toBytes(uint);
			const recovered = Uint.fromBytes(bytes);
			expect(recovered).toBe(val);
		}
	});
});

// ============================================================================
// Overflow/Underflow Edge Cases
// ============================================================================

describe("Uint overflow/underflow edge cases", () => {
	it("wraps addition overflow at multiple boundaries", () => {
		expect(Uint.plus(Uint.MAX, Uint.ONE)).toBe(0n);
		expect(Uint.plus(Uint.MAX, Uint.from(2))).toBe(1n);
		expect(Uint.plus(Uint.MAX, Uint.from(10))).toBe(9n);
		expect(Uint.plus(Uint.MAX, Uint.MAX)).toBe((Uint.MAX as bigint) - 1n);
	});

	it("wraps subtraction underflow at multiple boundaries", () => {
		expect(Uint.minus(Uint.ZERO, Uint.ONE)).toBe(Uint.MAX);
		expect(Uint.minus(Uint.ZERO, Uint.from(2))).toBe((Uint.MAX as bigint) - 1n);
		expect(Uint.minus(Uint.ONE, Uint.from(2))).toBe(Uint.MAX);
		expect(Uint.minus(Uint.from(10), Uint.from(100))).toBe(
			(Uint.MAX as bigint) - 89n,
		);
	});

	it("wraps multiplication overflow", () => {
		const halfMax = Uint.from((Uint.MAX as bigint) / 2n);
		const result = Uint.times(halfMax, Uint.from(3));
		expect(Uint.isValid(result)).toBe(true);
	});

	it("wraps power overflow", () => {
		expect(Uint.toPower(Uint.from(2), Uint.from(256))).toBe(0n);
		expect(Uint.toPower(Uint.from(2), Uint.from(257))).toBe(0n);
		const result = Uint.toPower(Uint.from(2), Uint.from(255));
		expect(result).toBe(2n ** 255n);
	});

	it("wraps shift left overflow", () => {
		expect(Uint.shiftLeft(Uint.ONE, Uint.from(256))).toBe(0n);
		expect(Uint.shiftLeft(Uint.ONE, Uint.from(257))).toBe(0n);
		expect(Uint.shiftLeft(Uint.from(2), Uint.from(255))).toBe(0n);
	});
});

// ============================================================================
// Division by Zero Edge Cases
// ============================================================================

describe("Uint division edge cases", () => {
	it("throws on division by zero", () => {
		expect(() => Uint.dividedBy(Uint.ONE, Uint.ZERO)).toThrow(
			"Division by zero",
		);
		expect(() => Uint.dividedBy(Uint.ZERO, Uint.ZERO)).toThrow(
			"Division by zero",
		);
		expect(() => Uint.dividedBy(Uint.MAX, Uint.ZERO)).toThrow(
			"Division by zero",
		);
	});

	it("throws on modulo by zero", () => {
		expect(() => Uint.modulo(Uint.ONE, Uint.ZERO)).toThrow("Modulo by zero");
		expect(() => Uint.modulo(Uint.ZERO, Uint.ZERO)).toThrow("Modulo by zero");
		expect(() => Uint.modulo(Uint.MAX, Uint.ZERO)).toThrow("Modulo by zero");
	});

	it("handles division where dividend < divisor", () => {
		const small = Uint.from(10);
		const large = Uint.from(100);
		expect(Uint.dividedBy(small, large)).toBe(0n);
		expect(Uint.modulo(small, large)).toBe(10n);
	});

	it("handles division of powers of 2", () => {
		for (let i = 1; i < 128; i++) {
			for (let j = 0; j < i; j++) {
				const dividend = Uint.from(2n ** BigInt(i));
				const divisor = Uint.from(2n ** BigInt(j));
				const quotient = Uint.dividedBy(dividend, divisor);
				expect(quotient).toBe(2n ** BigInt(i - j));
			}
		}
	});
});

// ============================================================================
// Bitwise Edge Cases
// ============================================================================

describe("Uint bitwise edge cases", () => {
	it("handles shift by zero", () => {
		const value = Uint.from(0x12345678);
		expect(Uint.shiftLeft(value, Uint.ZERO)).toBe(0x12345678n);
		expect(Uint.shiftRight(value, Uint.ZERO)).toBe(0x12345678n);
	});

	it("handles shift by large value", () => {
		const value = Uint.from(0xff);
		expect(Uint.shiftLeft(value, Uint.from(300))).toBe(0n);
		expect(Uint.shiftRight(value, Uint.from(300))).toBe(0n);
	});

	it("handles shift right beyond bit length", () => {
		const value = Uint.from(0xff);
		expect(Uint.shiftRight(value, Uint.from(8))).toBe(0n);
		expect(Uint.shiftRight(value, Uint.from(100))).toBe(0n);
		expect(Uint.shiftRight(value, Uint.from(1000))).toBe(0n);
	});

	it("handles bitwise NOT idempotency", () => {
		const values = [
			Uint.ZERO,
			Uint.ONE,
			Uint.from(0xff),
			Uint.from(0xdeadbeef),
			Uint.from(2n ** 128n),
		];

		for (const val of values) {
			const notOnce = Uint.bitwiseNot(val);
			const notTwice = Uint.bitwiseNot(notOnce);
			expect(notTwice).toBe(val);
		}
	});

	it("handles XOR properties", () => {
		const a = Uint.from(0x12345678);
		const b = Uint.from(0x87654321);

		expect(Uint.bitwiseXor(a, a)).toBe(0n);
		expect(Uint.bitwiseXor(a, Uint.ZERO)).toBe(0x12345678n);
		const xor1 = Uint.bitwiseXor(a, b);
		const xor2 = Uint.bitwiseXor(b, a);
		expect(xor1).toBe(xor2);
		expect(Uint.bitwiseXor(xor1, b)).toBe(0x12345678n);
	});

	it("handles AND/OR duality", () => {
		const a = Uint.from(0xf0f0f0f0);
		const b = Uint.from(0x0f0f0f0f);

		const and = Uint.bitwiseAnd(a, b);
		const or = Uint.bitwiseOr(a, b);
		const notA = Uint.bitwiseNot(a);
		const notB = Uint.bitwiseNot(b);

		expect(Uint.bitwiseNot(and)).toBe(Uint.bitwiseOr(notA, notB));
		expect(Uint.bitwiseNot(or)).toBe(Uint.bitwiseAnd(notA, notB));
	});
});

// ============================================================================
// Comparison Edge Cases
// ============================================================================

describe("Uint comparison edge cases", () => {
	it("handles comparison with self", () => {
		const values = [Uint.ZERO, Uint.ONE, Uint.MAX, Uint.from(12345)];

		for (const val of values) {
			expect(Uint.equals(val, val)).toBe(true);
			expect(Uint.notEquals(val, val)).toBe(false);
			expect(Uint.lessThan(val, val)).toBe(false);
			expect(Uint.greaterThan(val, val)).toBe(false);
			expect(Uint.lessThanOrEqual(val, val)).toBe(true);
			expect(Uint.greaterThanOrEqual(val, val)).toBe(true);
		}
	});

	it("handles comparison ordering", () => {
		const values: BrandedUint[] = [
			Uint.ZERO,
			Uint.ONE,
			Uint.from(100),
			Uint.from(1000),
			Uint.from(2n ** 64n),
			Uint.from(2n ** 128n),
			Uint.MAX,
		];

		for (let i = 0; i < values.length; i++) {
			for (let j = 0; j < values.length; j++) {
				const a = values[i]!;
				const b = values[j]!;

				if (i < j) {
					expect(Uint.lessThan(a, b)).toBe(true);
					expect(Uint.greaterThan(a, b)).toBe(false);
					expect(Uint.lessThanOrEqual(a, b)).toBe(true);
					expect(Uint.greaterThanOrEqual(a, b)).toBe(false);
				} else if (i > j) {
					expect(Uint.lessThan(a, b)).toBe(false);
					expect(Uint.greaterThan(a, b)).toBe(true);
					expect(Uint.lessThanOrEqual(a, b)).toBe(false);
					expect(Uint.greaterThanOrEqual(a, b)).toBe(true);
				} else {
					expect(Uint.equals(a, b)).toBe(true);
				}
			}
		}
	});

	it("handles min/max with equal values", () => {
		const value = Uint.from(42);
		expect(Uint.minimum(value, value)).toBe(42n);
		expect(Uint.maximum(value, value)).toBe(42n);
	});

	it("handles min/max with extremes", () => {
		expect(Uint.minimum(Uint.ZERO, Uint.MAX)).toBe(0n);
		expect(Uint.maximum(Uint.ZERO, Uint.MAX)).toBe(Uint.MAX);
		expect(Uint.minimum(Uint.MAX, Uint.ZERO)).toBe(0n);
		expect(Uint.maximum(Uint.MAX, Uint.ZERO)).toBe(Uint.MAX);
	});
});

// ============================================================================
// Utility Edge Cases
// ============================================================================

describe("Uint utility edge cases", () => {
	it("handles bitLength for all bit positions", () => {
		expect(Uint.bitLength(Uint.ZERO)).toBe(0);
		for (let i = 0; i < 256; i++) {
			const value = Uint.from(2n ** BigInt(i));
			expect(Uint.bitLength(value)).toBe(i + 1);
		}
		expect(Uint.bitLength(Uint.MAX)).toBe(256);
	});

	it("handles leadingZeros for all bit positions", () => {
		expect(Uint.leadingZeros(Uint.ZERO)).toBe(256);
		for (let i = 0; i < 256; i++) {
			const value = Uint.from(2n ** BigInt(i));
			expect(Uint.leadingZeros(value)).toBe(255 - i);
		}
		expect(Uint.leadingZeros(Uint.MAX)).toBe(0);
	});

	it("handles popCount for various patterns", () => {
		expect(Uint.popCount(Uint.ZERO)).toBe(0);
		expect(Uint.popCount(Uint.MAX)).toBe(256);

		for (let i = 0; i < 256; i++) {
			const value = Uint.from(2n ** BigInt(i));
			expect(Uint.popCount(value)).toBe(1);
		}

		const alternating =
			Uint.from(
				0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaan,
			);
		expect(Uint.popCount(alternating)).toBe(128);
	});

	it("validates isValid correctly", () => {
		expect(Uint.isValid(0n)).toBe(true);
		expect(Uint.isValid(Uint.MAX as bigint)).toBe(true);
		expect(Uint.isValid(-1n)).toBe(false);
		expect(Uint.isValid((Uint.MAX as bigint) + 1n)).toBe(false);
		expect(Uint.isValid(2n ** 256n)).toBe(false);
	});
});

// ============================================================================
// Conversion Edge Cases
// ============================================================================

describe("Uint conversion edge cases", () => {
	it("handles hex conversion with various formats", () => {
		const testCases = [
			{ hex: "0x0", value: 0n },
			{ hex: "0x00", value: 0n },
			{ hex: "0x1", value: 1n },
			{ hex: "0x01", value: 1n },
			{ hex: "0xff", value: 255n },
			{ hex: "0xFF", value: 255n },
			{ hex: `0x${"f".repeat(64)}`, value: Uint.MAX },
		];

		for (const tc of testCases) {
			expect(Uint.fromHex(tc.hex)).toBe(tc.value);
		}
	});

	it("handles toHex padding correctly", () => {
		const padded = Uint.toHex(Uint.from(255), true);
		expect(padded.length).toBe(66);
		expect(padded).toBe(`0x${"0".repeat(62)}ff`);

		const unpadded = Uint.toHex(Uint.from(255), false);
		expect(unpadded).toBe("0xff");
	});

	it("handles toNumber bounds checking", () => {
		expect(() =>
			Uint.toNumber(Uint.from(BigInt(Number.MAX_SAFE_INTEGER) + 1n)),
		).toThrow("exceeds MAX_SAFE_INTEGER");

		const safe = Uint.toNumber(Uint.from(Number.MAX_SAFE_INTEGER));
		expect(safe).toBe(Number.MAX_SAFE_INTEGER);
	});

	it("handles fromNumber validation", () => {
		expect(() => Uint.fromNumber(-1)).toThrow("cannot be negative");
		expect(() => Uint.fromNumber(3.14)).toThrow("must be an integer");
		expect(() => Uint.fromNumber(Number.NaN)).toThrow();
		expect(() => Uint.fromNumber(Number.POSITIVE_INFINITY)).toThrow();
	});

	it("handles bytes conversion for all sizes", () => {
		for (let size = 1; size <= 32; size++) {
			const bytes = new Uint8Array(size);
			bytes[size - 1] = 0xff;
			const value = Uint.fromBytes(bytes);
			expect(value).toBe(255n);

			const converted = Uint.toBytes(value);
			expect(converted.length).toBe(32);
			expect(converted[31]).toBe(0xff);
		}
	});

	it("handles toString with various radixes", () => {
		const value = Uint.from(255);
		expect(Uint.toString(value, 2)).toBe("11111111");
		expect(Uint.toString(value, 8)).toBe("377");
		expect(Uint.toString(value, 10)).toBe("255");
		expect(Uint.toString(value, 16)).toBe("ff");
	});
});

// ============================================================================
// Special Cases from Known Issues
// ============================================================================

describe("Uint special cases", () => {
	it("handles adjacent value arithmetic correctly", () => {
		const value = Uint.from(0x8000000000000000n);
		const next = Uint.plus(value, Uint.ONE);
		const prev = Uint.minus(value, Uint.ONE);

		expect(next).toBe(0x8000000000000001n);
		expect(prev).toBe(0x7fffffffffffffffn);
		expect(Uint.minus(next, prev)).toBe(2n);
	});

	it("handles commutative property of addition", () => {
		const pairs: [BrandedUint, BrandedUint][] = [
			[Uint.from(100), Uint.from(200)],
			[Uint.from(2n ** 64n), Uint.from(2n ** 128n)],
			[Uint.MAX, Uint.ONE],
		];

		for (const [a, b] of pairs) {
			expect(Uint.plus(a, b)).toBe(Uint.plus(b, a));
		}
	});

	it("handles associative property of addition", () => {
		const a = Uint.from(100);
		const b = Uint.from(200);
		const c = Uint.from(300);

		const left = Uint.plus(Uint.plus(a, b), c);
		const right = Uint.plus(a, Uint.plus(b, c));
		expect(left).toBe(right);
	});

	it("handles distributive property", () => {
		const a = Uint.from(10);
		const b = Uint.from(20);
		const c = Uint.from(30);

		const left = Uint.times(a, Uint.plus(b, c));
		const right = Uint.plus(Uint.times(a, b), Uint.times(a, c));
		expect(left).toBe(right);
	});

	it("handles zero property of multiplication", () => {
		const values = [Uint.ONE, Uint.from(12345), Uint.MAX];
		for (const val of values) {
			expect(Uint.times(val, Uint.ZERO)).toBe(0n);
			expect(Uint.times(Uint.ZERO, val)).toBe(0n);
		}
	});
});
