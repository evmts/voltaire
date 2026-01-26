import * as S from "effect/Schema";
import { describe, expect, it } from "@effect/vitest";
import * as Int8 from "./index.js";
import { BrandedInt8 } from "@tevm/voltaire";

const INT8_MIN = -128;
const INT8_MAX = 127;

describe("Int8", () => {
	describe("Schema: Int8.Number", () => {
		it("decodes valid positive number", () => {
			const value = S.decodeSync(Int8.Number)(42);
			expect(S.encodeSync(Int8.Number)(value)).toBe(42);
		});

		it("decodes valid negative number", () => {
			const value = S.decodeSync(Int8.Number)(-42);
			expect(S.encodeSync(Int8.Number)(value)).toBe(-42);
		});

		it("decodes zero", () => {
			const value = S.decodeSync(Int8.Number)(0);
			expect(S.encodeSync(Int8.Number)(value)).toBe(0);
		});

		it("decodes INT8_MIN (-128)", () => {
			const value = S.decodeSync(Int8.Number)(INT8_MIN);
			expect(S.encodeSync(Int8.Number)(value)).toBe(INT8_MIN);
		});

		it("decodes INT8_MAX (127)", () => {
			const value = S.decodeSync(Int8.Number)(INT8_MAX);
			expect(S.encodeSync(Int8.Number)(value)).toBe(INT8_MAX);
		});

		it("fails on overflow (128)", () => {
			expect(() => S.decodeSync(Int8.Number)(128)).toThrow();
		});

		it("fails on underflow (-129)", () => {
			expect(() => S.decodeSync(Int8.Number)(-129)).toThrow();
		});

		it("fails on non-integer", () => {
			expect(() => S.decodeSync(Int8.Number)(1.5)).toThrow();
		});
	});

	describe("Schema: Int8.String", () => {
		it("decodes valid positive string", () => {
			const value = S.decodeSync(Int8.String)("42");
			expect(S.encodeSync(Int8.String)(value)).toBe("42");
		});

		it("decodes valid negative string", () => {
			const value = S.decodeSync(Int8.String)("-42");
			expect(S.encodeSync(Int8.String)(value)).toBe("-42");
		});

		it("decodes zero string", () => {
			const value = S.decodeSync(Int8.String)("0");
			expect(S.encodeSync(Int8.String)(value)).toBe("0");
		});

		it("decodes INT8_MIN string", () => {
			const value = S.decodeSync(Int8.String)("-128");
			expect(S.encodeSync(Int8.String)(value)).toBe("-128");
		});

		it("decodes INT8_MAX string", () => {
			const value = S.decodeSync(Int8.String)("127");
			expect(S.encodeSync(Int8.String)(value)).toBe("127");
		});

		it("fails on overflow string", () => {
			expect(() => S.decodeSync(Int8.String)("128")).toThrow();
		});

		it("fails on invalid string", () => {
			expect(() => S.decodeSync(Int8.String)("abc")).toThrow();
		});
	});

	describe("Schema: Int8.BigInt", () => {
		it("decodes valid positive bigint", () => {
			const value = S.decodeSync(Int8.BigInt)(42n);
			expect(S.encodeSync(Int8.BigInt)(value)).toBe(42n);
		});

		it("decodes valid negative bigint", () => {
			const value = S.decodeSync(Int8.BigInt)(-42n);
			expect(S.encodeSync(Int8.BigInt)(value)).toBe(-42n);
		});

		it("decodes zero bigint", () => {
			const value = S.decodeSync(Int8.BigInt)(0n);
			expect(S.encodeSync(Int8.BigInt)(value)).toBe(0n);
		});

		it("decodes INT8_MIN bigint", () => {
			const value = S.decodeSync(Int8.BigInt)(BigInt(INT8_MIN));
			expect(S.encodeSync(Int8.BigInt)(value)).toBe(BigInt(INT8_MIN));
		});

		it("decodes INT8_MAX bigint", () => {
			const value = S.decodeSync(Int8.BigInt)(BigInt(INT8_MAX));
			expect(S.encodeSync(Int8.BigInt)(value)).toBe(BigInt(INT8_MAX));
		});

		it("fails on overflow bigint", () => {
			expect(() => S.decodeSync(Int8.BigInt)(128n)).toThrow();
		});

		it("fails on underflow bigint", () => {
			expect(() => S.decodeSync(Int8.BigInt)(-129n)).toThrow();
		});
	});

	describe("Arithmetic: add (via BrandedInt8.plus)", () => {
		it("adds two positive values", () => {
			const a = S.decodeSync(Int8.Number)(50);
			const b = S.decodeSync(Int8.Number)(30);
			const result = BrandedInt8.plus(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(80);
		});

		it("adds positive and negative", () => {
			const a = S.decodeSync(Int8.Number)(50);
			const b = S.decodeSync(Int8.Number)(-30);
			const result = BrandedInt8.plus(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(20);
		});

		it("adds two negative values", () => {
			const a = S.decodeSync(Int8.Number)(-50);
			const b = S.decodeSync(Int8.Number)(-30);
			const result = BrandedInt8.plus(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(-80);
		});

		it("handles zero", () => {
			const a = S.decodeSync(Int8.Number)(42);
			const zero = S.decodeSync(Int8.Number)(0);
			const result = BrandedInt8.plus(a, zero);
			expect(S.encodeSync(Int8.Number)(result)).toBe(42);
		});

		it("wraps on overflow (127 + 1)", () => {
			const max = S.decodeSync(Int8.Number)(INT8_MAX);
			const one = S.decodeSync(Int8.Number)(1);
			const result = BrandedInt8.plus(max, one);
			expect(S.encodeSync(Int8.Number)(result)).toBe(INT8_MIN);
		});

		it("wraps on underflow (-128 + -1)", () => {
			const min = S.decodeSync(Int8.Number)(INT8_MIN);
			const negOne = S.decodeSync(Int8.Number)(-1);
			const result = BrandedInt8.plus(min, negOne);
			expect(S.encodeSync(Int8.Number)(result)).toBe(INT8_MAX);
		});
	});

	describe("Arithmetic: sub", () => {
		it("subtracts two positive values", () => {
			const a = S.decodeSync(Int8.Number)(50);
			const b = S.decodeSync(Int8.Number)(30);
			const result = Int8.sub(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(20);
		});

		it("subtracts negative from positive", () => {
			const a = S.decodeSync(Int8.Number)(50);
			const b = S.decodeSync(Int8.Number)(-30);
			const result = Int8.sub(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(80);
		});

		it("subtracts positive from negative", () => {
			const a = S.decodeSync(Int8.Number)(-50);
			const b = S.decodeSync(Int8.Number)(30);
			const result = Int8.sub(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(-80);
		});

		it("handles zero subtraction", () => {
			const a = S.decodeSync(Int8.Number)(42);
			const zero = S.decodeSync(Int8.Number)(0);
			const result = Int8.sub(a, zero);
			expect(S.encodeSync(Int8.Number)(result)).toBe(42);
		});

		it("wraps on underflow (-128 - 1)", () => {
			const min = S.decodeSync(Int8.Number)(INT8_MIN);
			const one = S.decodeSync(Int8.Number)(1);
			const result = Int8.sub(min, one);
			expect(S.encodeSync(Int8.Number)(result)).toBe(INT8_MAX);
		});

		it("wraps on overflow (127 - (-1))", () => {
			const max = S.decodeSync(Int8.Number)(INT8_MAX);
			const negOne = S.decodeSync(Int8.Number)(-1);
			const result = Int8.sub(max, negOne);
			expect(S.encodeSync(Int8.Number)(result)).toBe(INT8_MIN);
		});
	});

	describe("Arithmetic: mul", () => {
		it("multiplies two positive values", () => {
			const a = S.decodeSync(Int8.Number)(5);
			const b = S.decodeSync(Int8.Number)(6);
			const result = Int8.mul(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(30);
		});

		it("multiplies positive and negative", () => {
			const a = S.decodeSync(Int8.Number)(5);
			const b = S.decodeSync(Int8.Number)(-6);
			const result = Int8.mul(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(-30);
		});

		it("multiplies two negative values", () => {
			const a = S.decodeSync(Int8.Number)(-5);
			const b = S.decodeSync(Int8.Number)(-6);
			const result = Int8.mul(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(30);
		});

		it("multiplies by zero", () => {
			const a = S.decodeSync(Int8.Number)(42);
			const zero = S.decodeSync(Int8.Number)(0);
			const result = Int8.mul(a, zero);
			expect(S.encodeSync(Int8.Number)(result)).toBe(0);
		});

		it("multiplies by one", () => {
			const a = S.decodeSync(Int8.Number)(42);
			const one = S.decodeSync(Int8.Number)(1);
			const result = Int8.mul(a, one);
			expect(S.encodeSync(Int8.Number)(result)).toBe(42);
		});

		it("multiplies by negative one", () => {
			const a = S.decodeSync(Int8.Number)(42);
			const negOne = S.decodeSync(Int8.Number)(-1);
			const result = Int8.mul(a, negOne);
			expect(S.encodeSync(Int8.Number)(result)).toBe(-42);
		});

		it("wraps on overflow", () => {
			const a = S.decodeSync(Int8.Number)(64);
			const b = S.decodeSync(Int8.Number)(2);
			const result = Int8.mul(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(INT8_MIN);
		});
	});

	describe("Arithmetic: div", () => {
		it("divides two positive values", () => {
			const a = S.decodeSync(Int8.Number)(30);
			const b = S.decodeSync(Int8.Number)(5);
			const result = Int8.div(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(6);
		});

		it("divides positive by negative", () => {
			const a = S.decodeSync(Int8.Number)(30);
			const b = S.decodeSync(Int8.Number)(-5);
			const result = Int8.div(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(-6);
		});

		it("divides negative by positive", () => {
			const a = S.decodeSync(Int8.Number)(-30);
			const b = S.decodeSync(Int8.Number)(5);
			const result = Int8.div(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(-6);
		});

		it("divides two negative values", () => {
			const a = S.decodeSync(Int8.Number)(-30);
			const b = S.decodeSync(Int8.Number)(-5);
			const result = Int8.div(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(6);
		});

		it("truncates toward zero", () => {
			const a = S.decodeSync(Int8.Number)(7);
			const b = S.decodeSync(Int8.Number)(3);
			const result = Int8.div(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(2);
		});

		it("truncates negative toward zero", () => {
			const a = S.decodeSync(Int8.Number)(-7);
			const b = S.decodeSync(Int8.Number)(3);
			const result = Int8.div(a, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(-2);
		});

		it("divides zero by anything", () => {
			const zero = S.decodeSync(Int8.Number)(0);
			const b = S.decodeSync(Int8.Number)(5);
			const result = Int8.div(zero, b);
			expect(S.encodeSync(Int8.Number)(result)).toBe(0);
		});
	});

	describe("Sign handling: negate", () => {
		it("negates positive value", () => {
			const a = S.decodeSync(Int8.Number)(42);
			const result = Int8.negate(a);
			expect(S.encodeSync(Int8.Number)(result)).toBe(-42);
		});

		it("negates negative value", () => {
			const a = S.decodeSync(Int8.Number)(-42);
			const result = Int8.negate(a);
			expect(S.encodeSync(Int8.Number)(result)).toBe(42);
		});

		it("negates zero", () => {
			const zero = S.decodeSync(Int8.Number)(0);
			const result = Int8.negate(zero);
			expect(S.encodeSync(Int8.Number)(result)).toBe(0);
		});

		it("negates INT8_MAX", () => {
			const max = S.decodeSync(Int8.Number)(INT8_MAX);
			const result = Int8.negate(max);
			expect(S.encodeSync(Int8.Number)(result)).toBe(-127);
		});

		it("negates INT8_MIN wraps to INT8_MIN", () => {
			const min = S.decodeSync(Int8.Number)(INT8_MIN);
			const result = Int8.negate(min);
			expect(S.encodeSync(Int8.Number)(result)).toBe(INT8_MIN);
		});
	});

	describe("Sign handling: abs", () => {
		it("abs of positive value", () => {
			const a = S.decodeSync(Int8.Number)(42);
			const result = Int8.abs(a);
			expect(S.encodeSync(Int8.Number)(result)).toBe(42);
		});

		it("abs of negative value", () => {
			const a = S.decodeSync(Int8.Number)(-42);
			const result = Int8.abs(a);
			expect(S.encodeSync(Int8.Number)(result)).toBe(42);
		});

		it("abs of zero", () => {
			const zero = S.decodeSync(Int8.Number)(0);
			const result = Int8.abs(zero);
			expect(S.encodeSync(Int8.Number)(result)).toBe(0);
		});

		it("abs of INT8_MAX", () => {
			const max = S.decodeSync(Int8.Number)(INT8_MAX);
			const result = Int8.abs(max);
			expect(S.encodeSync(Int8.Number)(result)).toBe(INT8_MAX);
		});

		it("abs of INT8_MIN wraps", () => {
			const min = S.decodeSync(Int8.Number)(INT8_MIN);
			const result = Int8.abs(min);
			expect(S.encodeSync(Int8.Number)(result)).toBe(INT8_MIN);
		});
	});

	describe("Sign handling: isNegative", () => {
		it("returns false for positive value", () => {
			const a = S.decodeSync(Int8.Number)(42);
			expect(Int8.isNegative(a)).toBe(false);
		});

		it("returns true for negative value", () => {
			const a = S.decodeSync(Int8.Number)(-42);
			expect(Int8.isNegative(a)).toBe(true);
		});

		it("returns false for zero", () => {
			const zero = S.decodeSync(Int8.Number)(0);
			expect(Int8.isNegative(zero)).toBe(false);
		});

		it("returns false for INT8_MAX", () => {
			const max = S.decodeSync(Int8.Number)(INT8_MAX);
			expect(Int8.isNegative(max)).toBe(false);
		});

		it("returns true for INT8_MIN", () => {
			const min = S.decodeSync(Int8.Number)(INT8_MIN);
			expect(Int8.isNegative(min)).toBe(true);
		});
	});

	describe("Comparison: equals", () => {
		it("returns true for equal positive values", () => {
			const a = S.decodeSync(Int8.Number)(42);
			const b = S.decodeSync(Int8.Number)(42);
			expect(BrandedInt8.equals(a, b)).toBe(true);
		});

		it("returns true for equal negative values", () => {
			const a = S.decodeSync(Int8.Number)(-42);
			const b = S.decodeSync(Int8.Number)(-42);
			expect(BrandedInt8.equals(a, b)).toBe(true);
		});

		it("returns false for different values", () => {
			const a = S.decodeSync(Int8.Number)(42);
			const b = S.decodeSync(Int8.Number)(-42);
			expect(BrandedInt8.equals(a, b)).toBe(false);
		});

		it("returns true for zero", () => {
			const a = S.decodeSync(Int8.Number)(0);
			const b = S.decodeSync(Int8.Number)(0);
			expect(BrandedInt8.equals(a, b)).toBe(true);
		});
	});

	describe("Comparison: compare", () => {
		it("returns 0 for equal values", () => {
			const a = S.decodeSync(Int8.Number)(42);
			const b = S.decodeSync(Int8.Number)(42);
			expect(Int8.compare(a, b)).toBe(0);
		});

		it("returns -1 when a < b", () => {
			const a = S.decodeSync(Int8.Number)(10);
			const b = S.decodeSync(Int8.Number)(20);
			expect(Int8.compare(a, b)).toBe(-1);
		});

		it("returns 1 when a > b", () => {
			const a = S.decodeSync(Int8.Number)(20);
			const b = S.decodeSync(Int8.Number)(10);
			expect(Int8.compare(a, b)).toBe(1);
		});

		it("handles negative comparison", () => {
			const a = S.decodeSync(Int8.Number)(-20);
			const b = S.decodeSync(Int8.Number)(-10);
			expect(Int8.compare(a, b)).toBe(-1);
		});

		it("handles mixed sign comparison", () => {
			const a = S.decodeSync(Int8.Number)(-1);
			const b = S.decodeSync(Int8.Number)(1);
			expect(Int8.compare(a, b)).toBe(-1);
		});
	});

	describe("Utility: isZero", () => {
		it("returns true for zero", () => {
			const zero = S.decodeSync(Int8.Number)(0);
			expect(Int8.isZero(zero)).toBe(true);
		});

		it("returns false for positive value", () => {
			const a = S.decodeSync(Int8.Number)(1);
			expect(Int8.isZero(a)).toBe(false);
		});

		it("returns false for negative value", () => {
			const a = S.decodeSync(Int8.Number)(-1);
			expect(Int8.isZero(a)).toBe(false);
		});
	});

	describe("Constants", () => {
		it("INT8_MIN equals -128", () => {
			expect(BrandedInt8.toNumber(Int8.INT8_MIN)).toBe(-128);
		});

		it("INT8_MAX equals 127", () => {
			expect(BrandedInt8.toNumber(Int8.INT8_MAX)).toBe(127);
		});
	});
});
