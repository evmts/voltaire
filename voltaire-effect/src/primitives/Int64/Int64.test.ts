import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as Int64 from "./index.js";
import { BrandedInt64 } from "@tevm/voltaire";

const INT64_MIN = -9223372036854775808n;
const INT64_MAX = 9223372036854775807n;

describe("Int64", () => {
	describe("Schema: Int64.Number", () => {
		it("decodes valid positive number", () => {
			const value = S.decodeSync(Int64.Number)(1000000000);
			expect(S.encodeSync(Int64.Number)(value)).toBe(1000000000);
		});

		it("decodes valid negative number", () => {
			const value = S.decodeSync(Int64.Number)(-1000000000);
			expect(S.encodeSync(Int64.Number)(value)).toBe(-1000000000);
		});

		it("decodes zero", () => {
			const value = S.decodeSync(Int64.Number)(0);
			expect(S.encodeSync(Int64.Number)(value)).toBe(0);
		});

		it("fails on non-integer", () => {
			expect(() => S.decodeSync(Int64.Number)(1.5)).toThrow();
		});
	});

	describe("Schema: Int64.String", () => {
		it("decodes valid positive string", () => {
			const value = S.decodeSync(Int64.String)("1000000000000");
			expect(S.encodeSync(Int64.String)(value)).toBe("1000000000000");
		});

		it("decodes valid negative string", () => {
			const value = S.decodeSync(Int64.String)("-1000000000000");
			expect(S.encodeSync(Int64.String)(value)).toBe("-1000000000000");
		});

		it("decodes INT64_MIN string", () => {
			const value = S.decodeSync(Int64.String)("-9223372036854775808");
			expect(S.encodeSync(Int64.String)(value)).toBe("-9223372036854775808");
		});

		it("decodes INT64_MAX string", () => {
			const value = S.decodeSync(Int64.String)("9223372036854775807");
			expect(S.encodeSync(Int64.String)(value)).toBe("9223372036854775807");
		});
	});

	describe("Schema: Int64.BigInt", () => {
		it("decodes valid positive bigint", () => {
			const value = S.decodeSync(Int64.BigInt)(1000000000000n);
			expect(S.encodeSync(Int64.BigInt)(value)).toBe(1000000000000n);
		});

		it("decodes valid negative bigint", () => {
			const value = S.decodeSync(Int64.BigInt)(-1000000000000n);
			expect(S.encodeSync(Int64.BigInt)(value)).toBe(-1000000000000n);
		});

		it("decodes zero bigint", () => {
			const value = S.decodeSync(Int64.BigInt)(0n);
			expect(S.encodeSync(Int64.BigInt)(value)).toBe(0n);
		});

		it("decodes INT64_MIN bigint", () => {
			const value = S.decodeSync(Int64.BigInt)(INT64_MIN);
			expect(S.encodeSync(Int64.BigInt)(value)).toBe(INT64_MIN);
		});

		it("decodes INT64_MAX bigint", () => {
			const value = S.decodeSync(Int64.BigInt)(INT64_MAX);
			expect(S.encodeSync(Int64.BigInt)(value)).toBe(INT64_MAX);
		});

		it("fails on overflow bigint", () => {
			expect(() => S.decodeSync(Int64.BigInt)(INT64_MAX + 1n)).toThrow();
		});

		it("fails on underflow bigint", () => {
			expect(() => S.decodeSync(Int64.BigInt)(INT64_MIN - 1n)).toThrow();
		});
	});

	describe("Arithmetic: add (via BrandedInt64.plus)", () => {
		it("adds two positive values", () => {
			const a = S.decodeSync(Int64.BigInt)(1000000000000n);
			const b = S.decodeSync(Int64.BigInt)(500000000000n);
			const result = BrandedInt64.plus(a, b);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(1500000000000n);
		});

		it("adds positive and negative", () => {
			const a = S.decodeSync(Int64.BigInt)(1000000000000n);
			const b = S.decodeSync(Int64.BigInt)(-500000000000n);
			const result = BrandedInt64.plus(a, b);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(500000000000n);
		});

		it("handles zero", () => {
			const a = S.decodeSync(Int64.BigInt)(1000000000000n);
			const zero = S.decodeSync(Int64.BigInt)(0n);
			const result = BrandedInt64.plus(a, zero);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(1000000000000n);
		});

		it("wraps on overflow", () => {
			const max = S.decodeSync(Int64.BigInt)(INT64_MAX);
			const one = S.decodeSync(Int64.BigInt)(1n);
			const result = BrandedInt64.plus(max, one);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(INT64_MIN);
		});

		it("wraps on underflow", () => {
			const min = S.decodeSync(Int64.BigInt)(INT64_MIN);
			const negOne = S.decodeSync(Int64.BigInt)(-1n);
			const result = BrandedInt64.plus(min, negOne);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(INT64_MAX);
		});
	});

	describe("Arithmetic: sub", () => {
		it("subtracts two values", () => {
			const a = S.decodeSync(Int64.BigInt)(1000000000000n);
			const b = S.decodeSync(Int64.BigInt)(500000000000n);
			const result = Int64.sub(a, b);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(500000000000n);
		});

		it("subtracts negative (adds)", () => {
			const a = S.decodeSync(Int64.BigInt)(1000000000000n);
			const b = S.decodeSync(Int64.BigInt)(-500000000000n);
			const result = Int64.sub(a, b);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(1500000000000n);
		});

		it("wraps on underflow", () => {
			const min = S.decodeSync(Int64.BigInt)(INT64_MIN);
			const one = S.decodeSync(Int64.BigInt)(1n);
			const result = Int64.sub(min, one);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(INT64_MAX);
		});
	});

	describe("Arithmetic: mul", () => {
		it("multiplies two positive values", () => {
			const a = S.decodeSync(Int64.BigInt)(1000000n);
			const b = S.decodeSync(Int64.BigInt)(1000000n);
			const result = Int64.mul(a, b);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(1000000000000n);
		});

		it("multiplies positive and negative", () => {
			const a = S.decodeSync(Int64.BigInt)(1000000n);
			const b = S.decodeSync(Int64.BigInt)(-1000000n);
			const result = Int64.mul(a, b);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(-1000000000000n);
		});

		it("multiplies by zero", () => {
			const a = S.decodeSync(Int64.BigInt)(1000000000000n);
			const zero = S.decodeSync(Int64.BigInt)(0n);
			const result = Int64.mul(a, zero);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(0n);
		});
	});

	describe("Arithmetic: div", () => {
		it("divides two values", () => {
			const a = S.decodeSync(Int64.BigInt)(1000000000000n);
			const b = S.decodeSync(Int64.BigInt)(1000000n);
			const result = Int64.div(a, b);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(1000000n);
		});

		it("truncates toward zero (positive)", () => {
			const a = S.decodeSync(Int64.BigInt)(7n);
			const b = S.decodeSync(Int64.BigInt)(3n);
			const result = Int64.div(a, b);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(2n);
		});

		it("truncates toward zero (negative)", () => {
			const a = S.decodeSync(Int64.BigInt)(-7n);
			const b = S.decodeSync(Int64.BigInt)(3n);
			const result = Int64.div(a, b);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(-2n);
		});
	});

	describe("Sign handling: negate", () => {
		it("negates positive value", () => {
			const a = S.decodeSync(Int64.BigInt)(1000000000000n);
			const result = Int64.negate(a);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(-1000000000000n);
		});

		it("negates negative value", () => {
			const a = S.decodeSync(Int64.BigInt)(-1000000000000n);
			const result = Int64.negate(a);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(1000000000000n);
		});

		it("negates zero", () => {
			const zero = S.decodeSync(Int64.BigInt)(0n);
			const result = Int64.negate(zero);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(0n);
		});

		it("negates INT64_MIN wraps", () => {
			const min = S.decodeSync(Int64.BigInt)(INT64_MIN);
			const result = Int64.negate(min);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(INT64_MIN);
		});
	});

	describe("Sign handling: abs", () => {
		it("abs of positive value", () => {
			const a = S.decodeSync(Int64.BigInt)(1000000000000n);
			const result = Int64.abs(a);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(1000000000000n);
		});

		it("abs of negative value", () => {
			const a = S.decodeSync(Int64.BigInt)(-1000000000000n);
			const result = Int64.abs(a);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(1000000000000n);
		});

		it("abs of zero", () => {
			const zero = S.decodeSync(Int64.BigInt)(0n);
			const result = Int64.abs(zero);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(0n);
		});

		it("abs of INT64_MIN wraps", () => {
			const min = S.decodeSync(Int64.BigInt)(INT64_MIN);
			const result = Int64.abs(min);
			expect(S.encodeSync(Int64.BigInt)(result)).toBe(INT64_MIN);
		});
	});

	describe("Sign handling: isNegative", () => {
		it("returns false for positive", () => {
			const a = S.decodeSync(Int64.BigInt)(1000000000000n);
			expect(Int64.isNegative(a)).toBe(false);
		});

		it("returns true for negative", () => {
			const a = S.decodeSync(Int64.BigInt)(-1000000000000n);
			expect(Int64.isNegative(a)).toBe(true);
		});

		it("returns false for zero", () => {
			const zero = S.decodeSync(Int64.BigInt)(0n);
			expect(Int64.isNegative(zero)).toBe(false);
		});
	});

	describe("Comparison: compare", () => {
		it("returns 0 for equal values", () => {
			const a = S.decodeSync(Int64.BigInt)(1000000000000n);
			const b = S.decodeSync(Int64.BigInt)(1000000000000n);
			expect(Int64.compare(a, b)).toBe(0);
		});

		it("returns -1 when a < b", () => {
			const a = S.decodeSync(Int64.BigInt)(100n);
			const b = S.decodeSync(Int64.BigInt)(200n);
			expect(Int64.compare(a, b)).toBe(-1);
		});

		it("returns 1 when a > b", () => {
			const a = S.decodeSync(Int64.BigInt)(200n);
			const b = S.decodeSync(Int64.BigInt)(100n);
			expect(Int64.compare(a, b)).toBe(1);
		});

		it("handles negative comparison", () => {
			const a = S.decodeSync(Int64.BigInt)(-200n);
			const b = S.decodeSync(Int64.BigInt)(-100n);
			expect(Int64.compare(a, b)).toBe(-1);
		});
	});

	describe("Utility: isZero", () => {
		it("returns true for zero", () => {
			const zero = S.decodeSync(Int64.BigInt)(0n);
			expect(Int64.isZero(zero)).toBe(true);
		});

		it("returns false for non-zero", () => {
			const a = S.decodeSync(Int64.BigInt)(1n);
			expect(Int64.isZero(a)).toBe(false);
		});
	});

	describe("Constants", () => {
		it("INT64_MIN equals -9223372036854775808n", () => {
			expect(BrandedInt64.toBigInt(Int64.INT64_MIN)).toBe(INT64_MIN);
		});

		it("INT64_MAX equals 9223372036854775807n", () => {
			expect(BrandedInt64.toBigInt(Int64.INT64_MAX)).toBe(INT64_MAX);
		});
	});
});
