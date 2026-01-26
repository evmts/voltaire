import * as S from "effect/Schema";
import { describe, expect, it } from "@effect/vitest";
import * as Int256 from "./index.js";
import { BrandedInt256 } from "@tevm/voltaire";

const INT256_MIN = -(2n ** 255n);
const INT256_MAX = 2n ** 255n - 1n;

describe("Int256", () => {
	describe("Schema: Int256.Number", () => {
		it("decodes valid positive number", () => {
			const value = S.decodeSync(Int256.Number)(1000000000);
			expect(S.encodeSync(Int256.Number)(value)).toBe(1000000000);
		});

		it("decodes valid negative number", () => {
			const value = S.decodeSync(Int256.Number)(-1000000000);
			expect(S.encodeSync(Int256.Number)(value)).toBe(-1000000000);
		});

		it("decodes zero", () => {
			const value = S.decodeSync(Int256.Number)(0);
			expect(S.encodeSync(Int256.Number)(value)).toBe(0);
		});

		it("fails on non-integer", () => {
			expect(() => S.decodeSync(Int256.Number)(1.5)).toThrow();
		});
	});

	describe("Schema: Int256.String", () => {
		it("decodes valid positive string", () => {
			const value = S.decodeSync(Int256.String)("12345678901234567890123456789012345678901234567890");
			expect(S.encodeSync(Int256.String)(value)).toBe("12345678901234567890123456789012345678901234567890");
		});

		it("decodes valid negative string", () => {
			const value = S.decodeSync(Int256.String)("-12345678901234567890123456789012345678901234567890");
			expect(S.encodeSync(Int256.String)(value)).toBe("-12345678901234567890123456789012345678901234567890");
		});

		it("decodes zero string", () => {
			const value = S.decodeSync(Int256.String)("0");
			expect(S.encodeSync(Int256.String)(value)).toBe("0");
		});

		it("decodes INT256_MIN string", () => {
			const value = S.decodeSync(Int256.String)(INT256_MIN.toString());
			expect(S.encodeSync(Int256.String)(value)).toBe(INT256_MIN.toString());
		});

		it("decodes INT256_MAX string", () => {
			const value = S.decodeSync(Int256.String)(INT256_MAX.toString());
			expect(S.encodeSync(Int256.String)(value)).toBe(INT256_MAX.toString());
		});
	});

	describe("Schema: Int256.BigInt", () => {
		it("decodes valid positive bigint", () => {
			const big = 12345678901234567890123456789012345678901234567890n;
			const value = S.decodeSync(Int256.BigInt)(big);
			expect(S.encodeSync(Int256.BigInt)(value)).toBe(big);
		});

		it("decodes valid negative bigint", () => {
			const big = -12345678901234567890123456789012345678901234567890n;
			const value = S.decodeSync(Int256.BigInt)(big);
			expect(S.encodeSync(Int256.BigInt)(value)).toBe(big);
		});

		it("decodes zero bigint", () => {
			const value = S.decodeSync(Int256.BigInt)(0n);
			expect(S.encodeSync(Int256.BigInt)(value)).toBe(0n);
		});

		it("decodes INT256_MIN bigint", () => {
			const value = S.decodeSync(Int256.BigInt)(INT256_MIN);
			expect(S.encodeSync(Int256.BigInt)(value)).toBe(INT256_MIN);
		});

		it("decodes INT256_MAX bigint", () => {
			const value = S.decodeSync(Int256.BigInt)(INT256_MAX);
			expect(S.encodeSync(Int256.BigInt)(value)).toBe(INT256_MAX);
		});

		it("fails on overflow bigint", () => {
			expect(() => S.decodeSync(Int256.BigInt)(INT256_MAX + 1n)).toThrow();
		});

		it("fails on underflow bigint", () => {
			expect(() => S.decodeSync(Int256.BigInt)(INT256_MIN - 1n)).toThrow();
		});
	});

	describe("BrandedInt256 conversion", () => {
		it("round-trips fromBigInt/toBigInt", () => {
			const value = 1234567890123456789n;
			const branded = BrandedInt256.from(value);
			expect(BrandedInt256.toBigInt(branded)).toBe(value);
		});
	});

	describe("Arithmetic: add (via BrandedInt256.plus)", () => {
		it("adds two positive values", () => {
			const a = S.decodeSync(Int256.BigInt)(10000000000000000000000000000000000000000n);
			const b = S.decodeSync(Int256.BigInt)(5000000000000000000000000000000000000000n);
			const result = BrandedInt256.plus(a, b);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(15000000000000000000000000000000000000000n);
		});

		it("adds using Int256.add", () => {
			const a = S.decodeSync(Int256.BigInt)(12345n);
			const b = S.decodeSync(Int256.BigInt)(67890n);
			const result = Int256.add(a, b);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(80235n);
		});

		it("adds positive and negative", () => {
			const a = S.decodeSync(Int256.BigInt)(10000000000000000000000000000000000000000n);
			const b = S.decodeSync(Int256.BigInt)(-5000000000000000000000000000000000000000n);
			const result = BrandedInt256.plus(a, b);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(5000000000000000000000000000000000000000n);
		});

		it("adds two negative values", () => {
			const a = S.decodeSync(Int256.BigInt)(-10000000000000000000000000000000000000000n);
			const b = S.decodeSync(Int256.BigInt)(-5000000000000000000000000000000000000000n);
			const result = BrandedInt256.plus(a, b);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(-15000000000000000000000000000000000000000n);
		});

		it("handles zero", () => {
			const a = S.decodeSync(Int256.BigInt)(12345n);
			const zero = S.decodeSync(Int256.BigInt)(0n);
			const result = BrandedInt256.plus(a, zero);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(12345n);
		});

		it("wraps on overflow", () => {
			const max = S.decodeSync(Int256.BigInt)(INT256_MAX);
			const one = S.decodeSync(Int256.BigInt)(1n);
			const result = BrandedInt256.plus(max, one);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(INT256_MIN);
		});

		it("wraps on underflow", () => {
			const min = S.decodeSync(Int256.BigInt)(INT256_MIN);
			const negOne = S.decodeSync(Int256.BigInt)(-1n);
			const result = BrandedInt256.plus(min, negOne);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(INT256_MAX);
		});
	});

	describe("Arithmetic: sub", () => {
		it("subtracts two values", () => {
			const a = S.decodeSync(Int256.BigInt)(10000000000000000000000000000000000000000n);
			const b = S.decodeSync(Int256.BigInt)(5000000000000000000000000000000000000000n);
			const result = Int256.sub(a, b);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(5000000000000000000000000000000000000000n);
		});

		it("subtracts negative (adds)", () => {
			const a = S.decodeSync(Int256.BigInt)(10000000000000000000000000000000000000000n);
			const b = S.decodeSync(Int256.BigInt)(-5000000000000000000000000000000000000000n);
			const result = Int256.sub(a, b);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(15000000000000000000000000000000000000000n);
		});

		it("wraps on underflow", () => {
			const min = S.decodeSync(Int256.BigInt)(INT256_MIN);
			const one = S.decodeSync(Int256.BigInt)(1n);
			const result = Int256.sub(min, one);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(INT256_MAX);
		});

		it("wraps on overflow", () => {
			const max = S.decodeSync(Int256.BigInt)(INT256_MAX);
			const negOne = S.decodeSync(Int256.BigInt)(-1n);
			const result = Int256.sub(max, negOne);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(INT256_MIN);
		});
	});

	describe("Arithmetic: mul", () => {
		it("multiplies two positive values", () => {
			const a = S.decodeSync(Int256.BigInt)(100000000000000000000n);
			const b = S.decodeSync(Int256.BigInt)(100000000000000000000n);
			const result = Int256.mul(a, b);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(10000000000000000000000000000000000000000n);
		});

		it("multiplies positive and negative", () => {
			const a = S.decodeSync(Int256.BigInt)(100000000000000000000n);
			const b = S.decodeSync(Int256.BigInt)(-100000000000000000000n);
			const result = Int256.mul(a, b);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(-10000000000000000000000000000000000000000n);
		});

		it("multiplies two negative values", () => {
			const a = S.decodeSync(Int256.BigInt)(-100000000000000000000n);
			const b = S.decodeSync(Int256.BigInt)(-100000000000000000000n);
			const result = Int256.mul(a, b);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(10000000000000000000000000000000000000000n);
		});

		it("multiplies by zero", () => {
			const a = S.decodeSync(Int256.BigInt)(10000000000000000000000000000000000000000n);
			const zero = S.decodeSync(Int256.BigInt)(0n);
			const result = Int256.mul(a, zero);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(0n);
		});

		it("multiplies by one", () => {
			const a = S.decodeSync(Int256.BigInt)(10000000000000000000000000000000000000000n);
			const one = S.decodeSync(Int256.BigInt)(1n);
			const result = Int256.mul(a, one);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(10000000000000000000000000000000000000000n);
		});

		it("multiplies by negative one", () => {
			const a = S.decodeSync(Int256.BigInt)(10000000000000000000000000000000000000000n);
			const negOne = S.decodeSync(Int256.BigInt)(-1n);
			const result = Int256.mul(a, negOne);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(-10000000000000000000000000000000000000000n);
		});
	});

	describe("Arithmetic: div", () => {
		it("divides two values", () => {
			const a = S.decodeSync(Int256.BigInt)(10000000000000000000000000000000000000000n);
			const b = S.decodeSync(Int256.BigInt)(100000000000000000000n);
			const result = Int256.div(a, b);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(100000000000000000000n);
		});

		it("truncates toward zero (positive)", () => {
			const a = S.decodeSync(Int256.BigInt)(7n);
			const b = S.decodeSync(Int256.BigInt)(3n);
			const result = Int256.div(a, b);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(2n);
		});

		it("truncates toward zero (negative)", () => {
			const a = S.decodeSync(Int256.BigInt)(-7n);
			const b = S.decodeSync(Int256.BigInt)(3n);
			const result = Int256.div(a, b);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(-2n);
		});

		it("divides zero by anything", () => {
			const zero = S.decodeSync(Int256.BigInt)(0n);
			const b = S.decodeSync(Int256.BigInt)(5n);
			const result = Int256.div(zero, b);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(0n);
		});
	});

	describe("Sign handling: negate", () => {
		it("negates positive value", () => {
			const a = S.decodeSync(Int256.BigInt)(10000000000000000000000000000000000000000n);
			const result = Int256.negate(a);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(-10000000000000000000000000000000000000000n);
		});

		it("negates negative value", () => {
			const a = S.decodeSync(Int256.BigInt)(-10000000000000000000000000000000000000000n);
			const result = Int256.negate(a);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(10000000000000000000000000000000000000000n);
		});

		it("negates zero", () => {
			const zero = S.decodeSync(Int256.BigInt)(0n);
			const result = Int256.negate(zero);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(0n);
		});

		it("negates INT256_MAX", () => {
			const max = S.decodeSync(Int256.BigInt)(INT256_MAX);
			const result = Int256.negate(max);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(-INT256_MAX);
		});

		it("negate of INT256_MIN wraps", () => {
			const min = S.decodeSync(Int256.BigInt)(INT256_MIN);
			const result = Int256.negate(min);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(INT256_MIN);
		});
	});

	describe("Sign handling: abs", () => {
		it("abs of positive value", () => {
			const a = S.decodeSync(Int256.BigInt)(10000000000000000000000000000000000000000n);
			const result = Int256.abs(a);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(10000000000000000000000000000000000000000n);
		});

		it("abs of negative value", () => {
			const a = S.decodeSync(Int256.BigInt)(-10000000000000000000000000000000000000000n);
			const result = Int256.abs(a);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(10000000000000000000000000000000000000000n);
		});

		it("abs of zero", () => {
			const zero = S.decodeSync(Int256.BigInt)(0n);
			const result = Int256.abs(zero);
			expect(S.encodeSync(Int256.BigInt)(result)).toBe(0n);
		});

		it("abs of INT256_MIN throws overflow", () => {
			const min = S.decodeSync(Int256.BigInt)(INT256_MIN);
			expect(() => Int256.abs(min)).toThrow();
		});
	});

	describe("Sign handling: isNegative", () => {
		it("returns false for positive", () => {
			const a = S.decodeSync(Int256.BigInt)(10000000000000000000000000000000000000000n);
			expect(Int256.isNegative(a)).toBe(false);
		});

		it("returns true for negative", () => {
			const a = S.decodeSync(Int256.BigInt)(-10000000000000000000000000000000000000000n);
			expect(Int256.isNegative(a)).toBe(true);
		});

		it("returns false for zero", () => {
			const zero = S.decodeSync(Int256.BigInt)(0n);
			expect(Int256.isNegative(zero)).toBe(false);
		});

		it("returns false for INT256_MAX", () => {
			const max = S.decodeSync(Int256.BigInt)(INT256_MAX);
			expect(Int256.isNegative(max)).toBe(false);
		});

		it("returns true for INT256_MIN", () => {
			const min = S.decodeSync(Int256.BigInt)(INT256_MIN);
			expect(Int256.isNegative(min)).toBe(true);
		});
	});

	describe("Comparison: compare", () => {
		it("returns 0 for equal values", () => {
			const a = S.decodeSync(Int256.BigInt)(10000000000000000000000000000000000000000n);
			const b = S.decodeSync(Int256.BigInt)(10000000000000000000000000000000000000000n);
			expect(Int256.compare(a, b)).toBe(0);
		});

		it("returns -1 when a < b", () => {
			const a = S.decodeSync(Int256.BigInt)(100n);
			const b = S.decodeSync(Int256.BigInt)(200n);
			expect(Int256.compare(a, b)).toBe(-1);
		});

		it("returns 1 when a > b", () => {
			const a = S.decodeSync(Int256.BigInt)(200n);
			const b = S.decodeSync(Int256.BigInt)(100n);
			expect(Int256.compare(a, b)).toBe(1);
		});

		it("handles negative comparison", () => {
			const a = S.decodeSync(Int256.BigInt)(-200n);
			const b = S.decodeSync(Int256.BigInt)(-100n);
			expect(Int256.compare(a, b)).toBe(-1);
		});

		it("handles mixed sign comparison", () => {
			const a = S.decodeSync(Int256.BigInt)(-1n);
			const b = S.decodeSync(Int256.BigInt)(1n);
			expect(Int256.compare(a, b)).toBe(-1);
		});

		it("handles extreme values", () => {
			const min = S.decodeSync(Int256.BigInt)(INT256_MIN);
			const max = S.decodeSync(Int256.BigInt)(INT256_MAX);
			expect(Int256.compare(min, max)).toBe(-1);
			expect(Int256.compare(max, min)).toBe(1);
		});
	});

	describe("Utility: isZero", () => {
		it("returns true for zero", () => {
			const zero = S.decodeSync(Int256.BigInt)(0n);
			expect(Int256.isZero(zero)).toBe(true);
		});

		it("returns false for positive", () => {
			const a = S.decodeSync(Int256.BigInt)(1n);
			expect(Int256.isZero(a)).toBe(false);
		});

		it("returns false for negative", () => {
			const a = S.decodeSync(Int256.BigInt)(-1n);
			expect(Int256.isZero(a)).toBe(false);
		});
	});

	describe("Constants", () => {
		it("MIN equals -(2^255)", () => {
			expect(BrandedInt256.toBigInt(Int256.MIN)).toBe(INT256_MIN);
		});

		it("MAX equals 2^255 - 1", () => {
			expect(BrandedInt256.toBigInt(Int256.MAX)).toBe(INT256_MAX);
		});

		it("ZERO equals 0n", () => {
			expect(BrandedInt256.toBigInt(Int256.ZERO)).toBe(0n);
		});

		it("ONE equals 1n", () => {
			expect(BrandedInt256.toBigInt(Int256.ONE)).toBe(1n);
		});

		it("NEG_ONE equals -1n", () => {
			expect(BrandedInt256.toBigInt(Int256.NEG_ONE)).toBe(-1n);
		});
	});
});
