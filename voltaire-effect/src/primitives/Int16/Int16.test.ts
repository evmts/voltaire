import { describe, expect, it } from "@effect/vitest";
import { BrandedInt16 } from "@tevm/voltaire";
import * as S from "effect/Schema";
import * as Int16 from "./index.js";

const INT16_MIN = -32768;
const INT16_MAX = 32767;

describe("Int16", () => {
	describe("Schema: Int16.Number", () => {
		it("decodes valid positive number", () => {
			const value = S.decodeSync(Int16.Number)(1000);
			expect(S.encodeSync(Int16.Number)(value)).toBe(1000);
		});

		it("decodes valid negative number", () => {
			const value = S.decodeSync(Int16.Number)(-1000);
			expect(S.encodeSync(Int16.Number)(value)).toBe(-1000);
		});

		it("decodes zero", () => {
			const value = S.decodeSync(Int16.Number)(0);
			expect(S.encodeSync(Int16.Number)(value)).toBe(0);
		});

		it("decodes INT16_MIN (-32768)", () => {
			const value = S.decodeSync(Int16.Number)(INT16_MIN);
			expect(S.encodeSync(Int16.Number)(value)).toBe(INT16_MIN);
		});

		it("decodes INT16_MAX (32767)", () => {
			const value = S.decodeSync(Int16.Number)(INT16_MAX);
			expect(S.encodeSync(Int16.Number)(value)).toBe(INT16_MAX);
		});

		it("fails on overflow (32768)", () => {
			expect(() => S.decodeSync(Int16.Number)(32768)).toThrow();
		});

		it("fails on underflow (-32769)", () => {
			expect(() => S.decodeSync(Int16.Number)(-32769)).toThrow();
		});

		it("fails on non-integer", () => {
			expect(() => S.decodeSync(Int16.Number)(1.5)).toThrow();
		});
	});

	describe("Schema: Int16.String", () => {
		it("decodes valid positive hex string", () => {
			const value = S.decodeSync(Int16.String)("0x03e8");
			expect(S.encodeSync(Int16.String)(value)).toBe("1000");
		});

		it("decodes valid negative hex string", () => {
			const value = S.decodeSync(Int16.String)("0xfc18");
			expect(S.encodeSync(Int16.String)(value)).toBe("-1000");
		});

		it("decodes INT16_MIN hex string", () => {
			const value = S.decodeSync(Int16.String)("0x8000");
			expect(S.encodeSync(Int16.String)(value)).toBe("-32768");
		});

		it("decodes INT16_MAX hex string", () => {
			const value = S.decodeSync(Int16.String)("0x7fff");
			expect(S.encodeSync(Int16.String)(value)).toBe("32767");
		});

		it("fails on overflow hex string", () => {
			expect(() => S.decodeSync(Int16.String)("0x18000")).toThrow();
		});
	});

	describe("Schema: Int16.BigInt", () => {
		it("decodes valid positive bigint", () => {
			const value = S.decodeSync(Int16.BigInt)(1000n);
			expect(S.encodeSync(Int16.BigInt)(value)).toBe(1000n);
		});

		it("decodes valid negative bigint", () => {
			const value = S.decodeSync(Int16.BigInt)(-1000n);
			expect(S.encodeSync(Int16.BigInt)(value)).toBe(-1000n);
		});

		it("decodes INT16_MIN bigint", () => {
			const value = S.decodeSync(Int16.BigInt)(BigInt(INT16_MIN));
			expect(S.encodeSync(Int16.BigInt)(value)).toBe(BigInt(INT16_MIN));
		});

		it("decodes INT16_MAX bigint", () => {
			const value = S.decodeSync(Int16.BigInt)(BigInt(INT16_MAX));
			expect(S.encodeSync(Int16.BigInt)(value)).toBe(BigInt(INT16_MAX));
		});

		it("fails on overflow bigint", () => {
			expect(() => S.decodeSync(Int16.BigInt)(32768n)).toThrow();
		});
	});

	describe("Arithmetic: add (via BrandedInt16.plus)", () => {
		it("adds two positive values", () => {
			const a = S.decodeSync(Int16.Number)(5000);
			const b = S.decodeSync(Int16.Number)(3000);
			const result = BrandedInt16.plus(a, b);
			expect(S.encodeSync(Int16.Number)(result)).toBe(8000);
		});

		it("adds positive and negative", () => {
			const a = S.decodeSync(Int16.Number)(5000);
			const b = S.decodeSync(Int16.Number)(-3000);
			const result = BrandedInt16.plus(a, b);
			expect(S.encodeSync(Int16.Number)(result)).toBe(2000);
		});

		it("throws on overflow (32767 + 1)", () => {
			const max = S.decodeSync(Int16.Number)(INT16_MAX);
			const one = S.decodeSync(Int16.Number)(1);
			expect(() => BrandedInt16.plus(max, one)).toThrow();
		});

		it("throws on underflow (-32768 + -1)", () => {
			const min = S.decodeSync(Int16.Number)(INT16_MIN);
			const negOne = S.decodeSync(Int16.Number)(-1);
			expect(() => BrandedInt16.plus(min, negOne)).toThrow();
		});
	});

	describe("Arithmetic: sub", () => {
		it("subtracts two positive values", () => {
			const a = S.decodeSync(Int16.Number)(5000);
			const b = S.decodeSync(Int16.Number)(3000);
			const result = Int16.sub(a, b);
			expect(S.encodeSync(Int16.Number)(result)).toBe(2000);
		});

		it("throws on underflow (-32768 - 1)", () => {
			const min = S.decodeSync(Int16.Number)(INT16_MIN);
			const one = S.decodeSync(Int16.Number)(1);
			expect(() => Int16.sub(min, one)).toThrow();
		});
	});

	describe("Arithmetic: mul", () => {
		it("multiplies two positive values", () => {
			const a = S.decodeSync(Int16.Number)(50);
			const b = S.decodeSync(Int16.Number)(60);
			const result = Int16.mul(a, b);
			expect(S.encodeSync(Int16.Number)(result)).toBe(3000);
		});

		it("multiplies positive and negative", () => {
			const a = S.decodeSync(Int16.Number)(50);
			const b = S.decodeSync(Int16.Number)(-60);
			const result = Int16.mul(a, b);
			expect(S.encodeSync(Int16.Number)(result)).toBe(-3000);
		});

		it("throws on overflow", () => {
			const a = S.decodeSync(Int16.Number)(16384);
			const b = S.decodeSync(Int16.Number)(2);
			expect(() => Int16.mul(a, b)).toThrow();
		});
	});

	describe("Arithmetic: div", () => {
		it("divides two positive values", () => {
			const a = S.decodeSync(Int16.Number)(3000);
			const b = S.decodeSync(Int16.Number)(50);
			const result = Int16.div(a, b);
			expect(S.encodeSync(Int16.Number)(result)).toBe(60);
		});

		it("truncates toward zero", () => {
			const a = S.decodeSync(Int16.Number)(7);
			const b = S.decodeSync(Int16.Number)(3);
			const result = Int16.div(a, b);
			expect(S.encodeSync(Int16.Number)(result)).toBe(2);
		});

		it("truncates negative toward zero", () => {
			const a = S.decodeSync(Int16.Number)(-7);
			const b = S.decodeSync(Int16.Number)(3);
			const result = Int16.div(a, b);
			expect(S.encodeSync(Int16.Number)(result)).toBe(-2);
		});
	});

	describe("Sign handling: negate", () => {
		it("negates positive value", () => {
			const a = S.decodeSync(Int16.Number)(1000);
			const result = Int16.negate(a);
			expect(S.encodeSync(Int16.Number)(result)).toBe(-1000);
		});

		it("negates negative value", () => {
			const a = S.decodeSync(Int16.Number)(-1000);
			const result = Int16.negate(a);
			expect(S.encodeSync(Int16.Number)(result)).toBe(1000);
		});

		it("negate of INT16_MIN throws overflow", () => {
			const min = S.decodeSync(Int16.Number)(INT16_MIN);
			expect(() => Int16.negate(min)).toThrow();
		});
	});

	describe("Sign handling: abs", () => {
		it("abs of positive value", () => {
			const a = S.decodeSync(Int16.Number)(1000);
			const result = Int16.abs(a);
			expect(S.encodeSync(Int16.Number)(result)).toBe(1000);
		});

		it("abs of negative value", () => {
			const a = S.decodeSync(Int16.Number)(-1000);
			const result = Int16.abs(a);
			expect(S.encodeSync(Int16.Number)(result)).toBe(1000);
		});

		it("abs of INT16_MIN throws overflow", () => {
			const min = S.decodeSync(Int16.Number)(INT16_MIN);
			expect(() => Int16.abs(min)).toThrow();
		});
	});

	describe("Sign handling: isNegative", () => {
		it("returns false for positive value", () => {
			const a = S.decodeSync(Int16.Number)(1000);
			expect(Int16.isNegative(a)).toBe(false);
		});

		it("returns true for negative value", () => {
			const a = S.decodeSync(Int16.Number)(-1000);
			expect(Int16.isNegative(a)).toBe(true);
		});

		it("returns false for zero", () => {
			const zero = S.decodeSync(Int16.Number)(0);
			expect(Int16.isNegative(zero)).toBe(false);
		});
	});

	describe("Comparison: compare", () => {
		it("returns 0 for equal values", () => {
			const a = S.decodeSync(Int16.Number)(1000);
			const b = S.decodeSync(Int16.Number)(1000);
			expect(Int16.compare(a, b)).toBe(0);
		});

		it("returns -1 when a < b", () => {
			const a = S.decodeSync(Int16.Number)(100);
			const b = S.decodeSync(Int16.Number)(200);
			expect(Int16.compare(a, b)).toBe(-1);
		});

		it("returns 1 when a > b", () => {
			const a = S.decodeSync(Int16.Number)(200);
			const b = S.decodeSync(Int16.Number)(100);
			expect(Int16.compare(a, b)).toBe(1);
		});
	});

	describe("Utility: isZero", () => {
		it("returns true for zero", () => {
			const zero = S.decodeSync(Int16.Number)(0);
			expect(Int16.isZero(zero)).toBe(true);
		});

		it("returns false for non-zero", () => {
			const a = S.decodeSync(Int16.Number)(1);
			expect(Int16.isZero(a)).toBe(false);
		});
	});

	describe("Constants", () => {
		it("INT16_MIN equals -32768", () => {
			expect(BrandedInt16.toNumber(Int16.INT16_MIN)).toBe(-32768);
		});

		it("INT16_MAX equals 32767", () => {
			expect(BrandedInt16.toNumber(Int16.INT16_MAX)).toBe(32767);
		});
	});
});
