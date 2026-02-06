import { describe, expect, it } from "@effect/vitest";
import { BrandedInt32 } from "@tevm/voltaire";
import * as S from "effect/Schema";
import * as Int32 from "./index.js";

const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;

describe("Int32", () => {
	describe("Schema: Int32.Number", () => {
		it("decodes valid positive number", () => {
			const value = S.decodeSync(Int32.Number)(1000000);
			expect(S.encodeSync(Int32.Number)(value)).toBe(1000000);
		});

		it("decodes valid negative number", () => {
			const value = S.decodeSync(Int32.Number)(-1000000);
			expect(S.encodeSync(Int32.Number)(value)).toBe(-1000000);
		});

		it("decodes zero", () => {
			const value = S.decodeSync(Int32.Number)(0);
			expect(S.encodeSync(Int32.Number)(value)).toBe(0);
		});

		it("decodes INT32_MIN", () => {
			const value = S.decodeSync(Int32.Number)(INT32_MIN);
			expect(S.encodeSync(Int32.Number)(value)).toBe(INT32_MIN);
		});

		it("decodes INT32_MAX", () => {
			const value = S.decodeSync(Int32.Number)(INT32_MAX);
			expect(S.encodeSync(Int32.Number)(value)).toBe(INT32_MAX);
		});

		it("fails on overflow", () => {
			expect(() => S.decodeSync(Int32.Number)(INT32_MAX + 1)).toThrow();
		});

		it("fails on underflow", () => {
			expect(() => S.decodeSync(Int32.Number)(INT32_MIN - 1)).toThrow();
		});
	});

	describe("Schema: Int32.String", () => {
		it("decodes valid positive string", () => {
			const value = S.decodeSync(Int32.String)("1000000");
			expect(S.encodeSync(Int32.String)(value)).toBe("1000000");
		});

		it("decodes valid negative string", () => {
			const value = S.decodeSync(Int32.String)("-1000000");
			expect(S.encodeSync(Int32.String)(value)).toBe("-1000000");
		});

		it("decodes INT32_MIN string", () => {
			const value = S.decodeSync(Int32.String)("-2147483648");
			expect(S.encodeSync(Int32.String)(value)).toBe("-2147483648");
		});

		it("decodes INT32_MAX string", () => {
			const value = S.decodeSync(Int32.String)("2147483647");
			expect(S.encodeSync(Int32.String)(value)).toBe("2147483647");
		});
	});

	describe("Schema: Int32.BigInt", () => {
		it("decodes valid bigint", () => {
			const value = S.decodeSync(Int32.BigInt)(1000000n);
			expect(S.encodeSync(Int32.BigInt)(value)).toBe(1000000n);
		});

		it("decodes INT32_MIN bigint", () => {
			const value = S.decodeSync(Int32.BigInt)(BigInt(INT32_MIN));
			expect(S.encodeSync(Int32.BigInt)(value)).toBe(BigInt(INT32_MIN));
		});

		it("decodes INT32_MAX bigint", () => {
			const value = S.decodeSync(Int32.BigInt)(BigInt(INT32_MAX));
			expect(S.encodeSync(Int32.BigInt)(value)).toBe(BigInt(INT32_MAX));
		});

		it("fails on overflow bigint", () => {
			expect(() =>
				S.decodeSync(Int32.BigInt)(BigInt(INT32_MAX) + 1n),
			).toThrow();
		});
	});

	describe("Arithmetic: add (via BrandedInt32.plus)", () => {
		it("adds two positive values", () => {
			const a = S.decodeSync(Int32.Number)(1000000);
			const b = S.decodeSync(Int32.Number)(500000);
			const result = BrandedInt32.plus(a, b);
			expect(S.encodeSync(Int32.Number)(result)).toBe(1500000);
		});

		it("throws on overflow", () => {
			const max = S.decodeSync(Int32.Number)(INT32_MAX);
			const one = S.decodeSync(Int32.Number)(1);
			expect(() => BrandedInt32.plus(max, one)).toThrow();
		});

		it("throws on underflow", () => {
			const min = S.decodeSync(Int32.Number)(INT32_MIN);
			const negOne = S.decodeSync(Int32.Number)(-1);
			expect(() => BrandedInt32.plus(min, negOne)).toThrow();
		});
	});

	describe("Arithmetic: sub", () => {
		it("subtracts two values", () => {
			const a = S.decodeSync(Int32.Number)(1000000);
			const b = S.decodeSync(Int32.Number)(500000);
			const result = Int32.sub(a, b);
			expect(S.encodeSync(Int32.Number)(result)).toBe(500000);
		});

		it("throws on underflow", () => {
			const min = S.decodeSync(Int32.Number)(INT32_MIN);
			const one = S.decodeSync(Int32.Number)(1);
			expect(() => Int32.sub(min, one)).toThrow();
		});
	});

	describe("Arithmetic: mul", () => {
		it("multiplies two values", () => {
			const a = S.decodeSync(Int32.Number)(1000);
			const b = S.decodeSync(Int32.Number)(1000);
			const result = Int32.mul(a, b);
			expect(S.encodeSync(Int32.Number)(result)).toBe(1000000);
		});

		it("multiplies with negative", () => {
			const a = S.decodeSync(Int32.Number)(1000);
			const b = S.decodeSync(Int32.Number)(-1000);
			const result = Int32.mul(a, b);
			expect(S.encodeSync(Int32.Number)(result)).toBe(-1000000);
		});
	});

	describe("Arithmetic: div", () => {
		it("divides two values", () => {
			const a = S.decodeSync(Int32.Number)(1000000);
			const b = S.decodeSync(Int32.Number)(1000);
			const result = Int32.div(a, b);
			expect(S.encodeSync(Int32.Number)(result)).toBe(1000);
		});

		it("truncates toward zero (positive)", () => {
			const a = S.decodeSync(Int32.Number)(7);
			const b = S.decodeSync(Int32.Number)(3);
			const result = Int32.div(a, b);
			expect(S.encodeSync(Int32.Number)(result)).toBe(2);
		});

		it("truncates toward zero (negative)", () => {
			const a = S.decodeSync(Int32.Number)(-7);
			const b = S.decodeSync(Int32.Number)(3);
			const result = Int32.div(a, b);
			expect(S.encodeSync(Int32.Number)(result)).toBe(-2);
		});
	});

	describe("Sign handling: negate", () => {
		it("negates positive value", () => {
			const a = S.decodeSync(Int32.Number)(1000000);
			const result = Int32.negate(a);
			expect(S.encodeSync(Int32.Number)(result)).toBe(-1000000);
		});

		it("negates negative value", () => {
			const a = S.decodeSync(Int32.Number)(-1000000);
			const result = Int32.negate(a);
			expect(S.encodeSync(Int32.Number)(result)).toBe(1000000);
		});

		it("negates zero", () => {
			const zero = S.decodeSync(Int32.Number)(0);
			const result = Int32.negate(zero);
			expect(S.encodeSync(Int32.Number)(result) === 0).toBe(true);
		});

		it("negate of INT32_MIN throws overflow", () => {
			const min = S.decodeSync(Int32.Number)(INT32_MIN);
			expect(() => Int32.negate(min)).toThrow();
		});
	});

	describe("Sign handling: abs", () => {
		it("abs of positive value", () => {
			const a = S.decodeSync(Int32.Number)(1000000);
			const result = Int32.abs(a);
			expect(S.encodeSync(Int32.Number)(result)).toBe(1000000);
		});

		it("abs of negative value", () => {
			const a = S.decodeSync(Int32.Number)(-1000000);
			const result = Int32.abs(a);
			expect(S.encodeSync(Int32.Number)(result)).toBe(1000000);
		});

		it("abs of INT32_MIN throws overflow", () => {
			const min = S.decodeSync(Int32.Number)(INT32_MIN);
			expect(() => Int32.abs(min)).toThrow();
		});
	});

	describe("Sign handling: isNegative", () => {
		it("returns false for positive", () => {
			const a = S.decodeSync(Int32.Number)(1000000);
			expect(Int32.isNegative(a)).toBe(false);
		});

		it("returns true for negative", () => {
			const a = S.decodeSync(Int32.Number)(-1000000);
			expect(Int32.isNegative(a)).toBe(true);
		});

		it("returns false for zero", () => {
			const zero = S.decodeSync(Int32.Number)(0);
			expect(Int32.isNegative(zero)).toBe(false);
		});
	});

	describe("Comparison: compare", () => {
		it("returns 0 for equal values", () => {
			const a = S.decodeSync(Int32.Number)(1000000);
			const b = S.decodeSync(Int32.Number)(1000000);
			expect(Int32.compare(a, b)).toBe(0);
		});

		it("returns -1 when a < b", () => {
			const a = S.decodeSync(Int32.Number)(100);
			const b = S.decodeSync(Int32.Number)(200);
			expect(Int32.compare(a, b)).toBe(-1);
		});

		it("returns 1 when a > b", () => {
			const a = S.decodeSync(Int32.Number)(200);
			const b = S.decodeSync(Int32.Number)(100);
			expect(Int32.compare(a, b)).toBe(1);
		});
	});

	describe("Utility: isZero", () => {
		it("returns true for zero", () => {
			const zero = S.decodeSync(Int32.Number)(0);
			expect(Int32.isZero(zero)).toBe(true);
		});

		it("returns false for non-zero", () => {
			const a = S.decodeSync(Int32.Number)(1);
			expect(Int32.isZero(a)).toBe(false);
		});
	});

	describe("Constants", () => {
		it("INT32_MIN equals -2147483648", () => {
			expect(Int32.INT32_MIN).toBe(-2147483648);
		});

		it("INT32_MAX equals 2147483647", () => {
			expect(Int32.INT32_MAX).toBe(2147483647);
		});
	});
});
