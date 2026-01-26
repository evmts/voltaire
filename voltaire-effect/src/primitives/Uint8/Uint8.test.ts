import * as S from "effect/Schema";
import { describe, expect, it } from "@effect/vitest";
import * as Uint8 from "./index.js";

const UINT8_MIN = 0;
const UINT8_MAX = 255;

describe("Uint8", () => {
	describe("Schema: Uint8.Number", () => {
		it("decodes valid number", () => {
			const value = S.decodeSync(Uint8.Number)(42);
			expect(S.encodeSync(Uint8.Number)(value)).toBe(42);
		});

		it("decodes zero", () => {
			const value = S.decodeSync(Uint8.Number)(0);
			expect(S.encodeSync(Uint8.Number)(value)).toBe(0);
		});

		it("decodes UINT8_MAX (255)", () => {
			const value = S.decodeSync(Uint8.Number)(UINT8_MAX);
			expect(S.encodeSync(Uint8.Number)(value)).toBe(UINT8_MAX);
		});

		it("fails on overflow (256)", () => {
			expect(() => S.decodeSync(Uint8.Number)(256)).toThrow();
		});

		it("fails on negative (-1)", () => {
			expect(() => S.decodeSync(Uint8.Number)(-1)).toThrow();
		});

		it("fails on non-integer", () => {
			expect(() => S.decodeSync(Uint8.Number)(1.5)).toThrow();
		});
	});

	describe("Schema: Uint8.String", () => {
		it("decodes valid string", () => {
			const value = S.decodeSync(Uint8.String)("42");
			expect(S.encodeSync(Uint8.String)(value)).toBe("42");
		});

		it("decodes zero string", () => {
			const value = S.decodeSync(Uint8.String)("0");
			expect(S.encodeSync(Uint8.String)(value)).toBe("0");
		});

		it("decodes UINT8_MAX string", () => {
			const value = S.decodeSync(Uint8.String)("255");
			expect(S.encodeSync(Uint8.String)(value)).toBe("255");
		});

		it("fails on overflow string", () => {
			expect(() => S.decodeSync(Uint8.String)("256")).toThrow();
		});

		it("fails on negative string", () => {
			expect(() => S.decodeSync(Uint8.String)("-1")).toThrow();
		});

		it("fails on invalid string", () => {
			expect(() => S.decodeSync(Uint8.String)("abc")).toThrow();
		});
	});

	describe("Schema: Uint8.BigInt", () => {
		it("decodes valid bigint", () => {
			const value = S.decodeSync(Uint8.BigInt)(42n);
			expect(S.encodeSync(Uint8.BigInt)(value)).toBe(42n);
		});

		it("decodes zero bigint", () => {
			const value = S.decodeSync(Uint8.BigInt)(0n);
			expect(S.encodeSync(Uint8.BigInt)(value)).toBe(0n);
		});

		it("decodes UINT8_MAX bigint", () => {
			const value = S.decodeSync(Uint8.BigInt)(255n);
			expect(S.encodeSync(Uint8.BigInt)(value)).toBe(255n);
		});

		it("fails on overflow bigint", () => {
			expect(() => S.decodeSync(Uint8.BigInt)(256n)).toThrow();
		});

		it("fails on negative bigint", () => {
			expect(() => S.decodeSync(Uint8.BigInt)(-1n)).toThrow();
		});
	});

	describe("Schema: Uint8.Hex", () => {
		it("decodes valid hex with 0x prefix", () => {
			const value = S.decodeSync(Uint8.Hex)("0xff");
			expect(S.encodeSync(Uint8.Number)(value)).toBe(255);
		});

		it("decodes valid hex without prefix", () => {
			const value = S.decodeSync(Uint8.Hex)("ff");
			expect(S.encodeSync(Uint8.Number)(value)).toBe(255);
		});

		it("decodes zero hex", () => {
			const value = S.decodeSync(Uint8.Hex)("0x00");
			expect(S.encodeSync(Uint8.Number)(value)).toBe(0);
		});

		it("encodes to hex string", () => {
			const value = S.decodeSync(Uint8.Number)(255);
			const hex = S.encodeSync(Uint8.Hex)(value);
			expect(hex).toMatch(/^0x[0-9a-f]+$/i);
		});

		it("round-trips correctly", () => {
			const value = S.decodeSync(Uint8.Number)(42);
			const hex = S.encodeSync(Uint8.Hex)(value);
			const decoded = S.decodeSync(Uint8.Hex)(hex);
			expect(S.encodeSync(Uint8.Number)(decoded)).toBe(42);
		});
	});

	describe("Schema: Uint8.Bytes", () => {
		it("decodes single byte array", () => {
			const bytes = new Uint8Array([255]);
			const value = S.decodeSync(Uint8.Bytes)(bytes);
			expect(S.encodeSync(Uint8.Number)(value)).toBe(255);
		});

		it("decodes zero byte", () => {
			const bytes = new Uint8Array([0]);
			const value = S.decodeSync(Uint8.Bytes)(bytes);
			expect(S.encodeSync(Uint8.Number)(value)).toBe(0);
		});

		it("encodes to single byte array", () => {
			const value = S.decodeSync(Uint8.Number)(255);
			const bytes = S.encodeSync(Uint8.Bytes)(value);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes[0]).toBe(255);
		});

		it("round-trips correctly", () => {
			const value = S.decodeSync(Uint8.Number)(42);
			const bytes = S.encodeSync(Uint8.Bytes)(value);
			const decoded = S.decodeSync(Uint8.Bytes)(bytes);
			expect(S.encodeSync(Uint8.Number)(decoded)).toBe(42);
		});
	});

	describe("Arithmetic: plus", () => {
		it("adds two values", () => {
			const a = S.decodeSync(Uint8.Number)(100);
			const b = S.decodeSync(Uint8.Number)(50);
			const result = Uint8.plus(a, b);
			expect(Uint8.toNumber(result)).toBe(150);
		});

		it("handles zero", () => {
			const a = S.decodeSync(Uint8.Number)(100);
			const zero = S.decodeSync(Uint8.Number)(0);
			const result = Uint8.plus(a, zero);
			expect(Uint8.toNumber(result)).toBe(100);
		});

		it("wraps on overflow (255 + 1)", () => {
			const max = S.decodeSync(Uint8.Number)(UINT8_MAX);
			const one = S.decodeSync(Uint8.Number)(1);
			const result = Uint8.plus(max, one);
			expect(Uint8.toNumber(result)).toBe(0);
		});

		it("wraps on large overflow (255 + 2)", () => {
			const max = S.decodeSync(Uint8.Number)(UINT8_MAX);
			const two = S.decodeSync(Uint8.Number)(2);
			const result = Uint8.plus(max, two);
			expect(Uint8.toNumber(result)).toBe(1);
		});
	});

	describe("Arithmetic: minus", () => {
		it("subtracts two values", () => {
			const a = S.decodeSync(Uint8.Number)(100);
			const b = S.decodeSync(Uint8.Number)(50);
			const result = Uint8.minus(a, b);
			expect(Uint8.toNumber(result)).toBe(50);
		});

		it("handles zero subtraction", () => {
			const a = S.decodeSync(Uint8.Number)(100);
			const zero = S.decodeSync(Uint8.Number)(0);
			const result = Uint8.minus(a, zero);
			expect(Uint8.toNumber(result)).toBe(100);
		});

		it("wraps on underflow (0 - 1)", () => {
			const zero = S.decodeSync(Uint8.Number)(0);
			const one = S.decodeSync(Uint8.Number)(1);
			const result = Uint8.minus(zero, one);
			expect(Uint8.toNumber(result)).toBe(UINT8_MAX);
		});

		it("wraps on large underflow (0 - 2)", () => {
			const zero = S.decodeSync(Uint8.Number)(0);
			const two = S.decodeSync(Uint8.Number)(2);
			const result = Uint8.minus(zero, two);
			expect(Uint8.toNumber(result)).toBe(254);
		});
	});

	describe("Arithmetic: times", () => {
		it("multiplies two values", () => {
			const a = S.decodeSync(Uint8.Number)(5);
			const b = S.decodeSync(Uint8.Number)(6);
			const result = Uint8.times(a, b);
			expect(Uint8.toNumber(result)).toBe(30);
		});

		it("multiplies by zero", () => {
			const a = S.decodeSync(Uint8.Number)(100);
			const zero = S.decodeSync(Uint8.Number)(0);
			const result = Uint8.times(a, zero);
			expect(Uint8.toNumber(result)).toBe(0);
		});

		it("multiplies by one", () => {
			const a = S.decodeSync(Uint8.Number)(100);
			const one = S.decodeSync(Uint8.Number)(1);
			const result = Uint8.times(a, one);
			expect(Uint8.toNumber(result)).toBe(100);
		});

		it("wraps on overflow", () => {
			const a = S.decodeSync(Uint8.Number)(128);
			const b = S.decodeSync(Uint8.Number)(2);
			const result = Uint8.times(a, b);
			expect(Uint8.toNumber(result)).toBe(0);
		});
	});

	describe("Comparison: equals", () => {
		it("returns true for equal values", () => {
			const a = S.decodeSync(Uint8.Number)(42);
			const b = S.decodeSync(Uint8.Number)(42);
			expect(Uint8.equals(a, b)).toBe(true);
		});

		it("returns false for different values", () => {
			const a = S.decodeSync(Uint8.Number)(42);
			const b = S.decodeSync(Uint8.Number)(43);
			expect(Uint8.equals(a, b)).toBe(false);
		});

		it("returns true for zero", () => {
			const a = S.decodeSync(Uint8.Number)(0);
			const b = S.decodeSync(Uint8.Number)(0);
			expect(Uint8.equals(a, b)).toBe(true);
		});
	});

	describe("Conversion: toNumber", () => {
		it("converts to number", () => {
			const value = S.decodeSync(Uint8.Number)(42);
			expect(Uint8.toNumber(value)).toBe(42);
		});

		it("converts zero", () => {
			const value = S.decodeSync(Uint8.Number)(0);
			expect(Uint8.toNumber(value)).toBe(0);
		});

		it("converts max", () => {
			const value = S.decodeSync(Uint8.Number)(255);
			expect(Uint8.toNumber(value)).toBe(255);
		});
	});

	describe("Conversion: toHex", () => {
		it("converts to hex string", () => {
			const value = S.decodeSync(Uint8.Number)(255);
			const hex = Uint8.toHex(value);
			expect(hex).toMatch(/^0x[0-9a-f]+$/i);
		});

		it("converts zero", () => {
			const value = S.decodeSync(Uint8.Number)(0);
			const hex = Uint8.toHex(value);
			expect(hex).toMatch(/^0x0*$/i);
		});
	});

	describe("Constants", () => {
		it("MAX equals 255", () => {
			expect(Uint8.toNumber(Uint8.MAX)).toBe(255);
		});

		it("MIN equals 0", () => {
			expect(Uint8.toNumber(Uint8.MIN)).toBe(0);
		});

		it("ZERO equals 0", () => {
			expect(Uint8.toNumber(Uint8.ZERO)).toBe(0);
		});

		it("ONE equals 1", () => {
			expect(Uint8.toNumber(Uint8.ONE)).toBe(1);
		});
	});

	describe("Edge cases", () => {
		it("MAX + MAX wraps correctly", () => {
			const max = S.decodeSync(Uint8.Number)(UINT8_MAX);
			const result = Uint8.plus(max, max);
			expect(Uint8.toNumber(result)).toBe(254);
		});

		it("MAX * MAX wraps correctly", () => {
			const max = S.decodeSync(Uint8.Number)(UINT8_MAX);
			const result = Uint8.times(max, max);
			expect(Uint8.toNumber(result)).toBe(1);
		});

		it("alternating operations", () => {
			const a = S.decodeSync(Uint8.Number)(100);
			const b = S.decodeSync(Uint8.Number)(50);
			const c = S.decodeSync(Uint8.Number)(2);
			const r1 = Uint8.plus(a, b);
			const r2 = Uint8.minus(r1, b);
			expect(Uint8.toNumber(r2)).toBe(100);
		});
	});
});
