import * as S from "effect/Schema";
import { describe, expect, it } from "@effect/vitest";
import * as Uint16 from "./index.js";

const UINT16_MIN = 0;
const UINT16_MAX = 65535;

describe("Uint16", () => {
	describe("Schema: Uint16.Number", () => {
		it("decodes valid number", () => {
			const value = S.decodeSync(Uint16.Number)(1000);
			expect(S.encodeSync(Uint16.Number)(value)).toBe(1000);
		});

		it("decodes zero", () => {
			const value = S.decodeSync(Uint16.Number)(0);
			expect(S.encodeSync(Uint16.Number)(value)).toBe(0);
		});

		it("decodes UINT16_MAX (65535)", () => {
			const value = S.decodeSync(Uint16.Number)(UINT16_MAX);
			expect(S.encodeSync(Uint16.Number)(value)).toBe(UINT16_MAX);
		});

		it("fails on overflow (65536)", () => {
			expect(() => S.decodeSync(Uint16.Number)(65536)).toThrow();
		});

		it("fails on negative (-1)", () => {
			expect(() => S.decodeSync(Uint16.Number)(-1)).toThrow();
		});

		it("fails on non-integer", () => {
			expect(() => S.decodeSync(Uint16.Number)(1.5)).toThrow();
		});
	});

	describe("Schema: Uint16.String", () => {
		it("decodes valid string", () => {
			const value = S.decodeSync(Uint16.String)("1000");
			expect(S.encodeSync(Uint16.String)(value)).toBe("1000");
		});

		it("decodes zero string", () => {
			const value = S.decodeSync(Uint16.String)("0");
			expect(S.encodeSync(Uint16.String)(value)).toBe("0");
		});

		it("decodes UINT16_MAX string", () => {
			const value = S.decodeSync(Uint16.String)("65535");
			expect(S.encodeSync(Uint16.String)(value)).toBe("65535");
		});

		it("fails on overflow string", () => {
			expect(() => S.decodeSync(Uint16.String)("65536")).toThrow();
		});

		it("fails on negative string", () => {
			expect(() => S.decodeSync(Uint16.String)("-1")).toThrow();
		});
	});

	describe("Schema: Uint16.BigInt", () => {
		it("decodes valid bigint", () => {
			const value = S.decodeSync(Uint16.BigInt)(1000n);
			expect(S.encodeSync(Uint16.BigInt)(value)).toBe(1000n);
		});

		it("decodes zero bigint", () => {
			const value = S.decodeSync(Uint16.BigInt)(0n);
			expect(S.encodeSync(Uint16.BigInt)(value)).toBe(0n);
		});

		it("decodes UINT16_MAX bigint", () => {
			const value = S.decodeSync(Uint16.BigInt)(65535n);
			expect(S.encodeSync(Uint16.BigInt)(value)).toBe(65535n);
		});

		it("fails on overflow bigint", () => {
			expect(() => S.decodeSync(Uint16.BigInt)(65536n)).toThrow();
		});

		it("fails on negative bigint", () => {
			expect(() => S.decodeSync(Uint16.BigInt)(-1n)).toThrow();
		});
	});

	describe("Schema: Uint16.Hex", () => {
		it("decodes valid hex with 0x prefix", () => {
			const value = S.decodeSync(Uint16.Hex)("0xffff");
			expect(S.encodeSync(Uint16.Number)(value)).toBe(65535);
		});

		it("decodes valid hex without prefix", () => {
			const value = S.decodeSync(Uint16.Hex)("ffff");
			expect(S.encodeSync(Uint16.Number)(value)).toBe(65535);
		});

		it("decodes zero hex", () => {
			const value = S.decodeSync(Uint16.Hex)("0x0000");
			expect(S.encodeSync(Uint16.Number)(value)).toBe(0);
		});

		it("encodes to hex string", () => {
			const value = S.decodeSync(Uint16.Number)(65535);
			const hex = S.encodeSync(Uint16.Hex)(value);
			expect(hex).toMatch(/^0x[0-9a-f]+$/i);
		});

		it("round-trips correctly", () => {
			const value = S.decodeSync(Uint16.Number)(1000);
			const hex = S.encodeSync(Uint16.Hex)(value);
			const decoded = S.decodeSync(Uint16.Hex)(hex);
			expect(S.encodeSync(Uint16.Number)(decoded)).toBe(1000);
		});
	});

	describe("Schema: Uint16.Bytes", () => {
		it("decodes two-byte array", () => {
			const bytes = new Uint8Array([0xff, 0xff]);
			const value = S.decodeSync(Uint16.Bytes)(bytes);
			expect(S.encodeSync(Uint16.Number)(value)).toBe(65535);
		});

		it("decodes zero bytes", () => {
			const bytes = new Uint8Array([0, 0]);
			const value = S.decodeSync(Uint16.Bytes)(bytes);
			expect(S.encodeSync(Uint16.Number)(value)).toBe(0);
		});

		it("encodes to byte array", () => {
			const value = S.decodeSync(Uint16.Number)(65535);
			const bytes = S.encodeSync(Uint16.Bytes)(value);
			expect(bytes).toBeInstanceOf(Uint8Array);
		});

		it("round-trips correctly", () => {
			const value = S.decodeSync(Uint16.Number)(1000);
			const bytes = S.encodeSync(Uint16.Bytes)(value);
			const decoded = S.decodeSync(Uint16.Bytes)(bytes);
			expect(S.encodeSync(Uint16.Number)(decoded)).toBe(1000);
		});
	});

	describe("Arithmetic: plus", () => {
		it("adds two values", () => {
			const a = S.decodeSync(Uint16.Number)(10000);
			const b = S.decodeSync(Uint16.Number)(5000);
			const result = Uint16.plus(a, b);
			expect(Uint16.toNumber(result)).toBe(15000);
		});

		it("handles zero", () => {
			const a = S.decodeSync(Uint16.Number)(10000);
			const zero = S.decodeSync(Uint16.Number)(0);
			const result = Uint16.plus(a, zero);
			expect(Uint16.toNumber(result)).toBe(10000);
		});

		it("wraps on overflow (65535 + 1)", () => {
			const max = S.decodeSync(Uint16.Number)(UINT16_MAX);
			const one = S.decodeSync(Uint16.Number)(1);
			const result = Uint16.plus(max, one);
			expect(Uint16.toNumber(result)).toBe(0);
		});

		it("wraps on large overflow (65535 + 2)", () => {
			const max = S.decodeSync(Uint16.Number)(UINT16_MAX);
			const two = S.decodeSync(Uint16.Number)(2);
			const result = Uint16.plus(max, two);
			expect(Uint16.toNumber(result)).toBe(1);
		});
	});

	describe("Arithmetic: minus", () => {
		it("subtracts two values", () => {
			const a = S.decodeSync(Uint16.Number)(10000);
			const b = S.decodeSync(Uint16.Number)(5000);
			const result = Uint16.minus(a, b);
			expect(Uint16.toNumber(result)).toBe(5000);
		});

		it("handles zero subtraction", () => {
			const a = S.decodeSync(Uint16.Number)(10000);
			const zero = S.decodeSync(Uint16.Number)(0);
			const result = Uint16.minus(a, zero);
			expect(Uint16.toNumber(result)).toBe(10000);
		});

		it("wraps on underflow (0 - 1)", () => {
			const zero = S.decodeSync(Uint16.Number)(0);
			const one = S.decodeSync(Uint16.Number)(1);
			const result = Uint16.minus(zero, one);
			expect(Uint16.toNumber(result)).toBe(UINT16_MAX);
		});

		it("wraps on large underflow (0 - 2)", () => {
			const zero = S.decodeSync(Uint16.Number)(0);
			const two = S.decodeSync(Uint16.Number)(2);
			const result = Uint16.minus(zero, two);
			expect(Uint16.toNumber(result)).toBe(65534);
		});
	});

	describe("Arithmetic: times", () => {
		it("multiplies two values", () => {
			const a = S.decodeSync(Uint16.Number)(100);
			const b = S.decodeSync(Uint16.Number)(60);
			const result = Uint16.times(a, b);
			expect(Uint16.toNumber(result)).toBe(6000);
		});

		it("multiplies by zero", () => {
			const a = S.decodeSync(Uint16.Number)(10000);
			const zero = S.decodeSync(Uint16.Number)(0);
			const result = Uint16.times(a, zero);
			expect(Uint16.toNumber(result)).toBe(0);
		});

		it("multiplies by one", () => {
			const a = S.decodeSync(Uint16.Number)(10000);
			const one = S.decodeSync(Uint16.Number)(1);
			const result = Uint16.times(a, one);
			expect(Uint16.toNumber(result)).toBe(10000);
		});

		it("wraps on overflow", () => {
			const a = S.decodeSync(Uint16.Number)(32768);
			const b = S.decodeSync(Uint16.Number)(2);
			const result = Uint16.times(a, b);
			expect(Uint16.toNumber(result)).toBe(0);
		});
	});

	describe("Comparison: equals", () => {
		it("returns true for equal values", () => {
			const a = S.decodeSync(Uint16.Number)(1000);
			const b = S.decodeSync(Uint16.Number)(1000);
			expect(Uint16.equals(a, b)).toBe(true);
		});

		it("returns false for different values", () => {
			const a = S.decodeSync(Uint16.Number)(1000);
			const b = S.decodeSync(Uint16.Number)(1001);
			expect(Uint16.equals(a, b)).toBe(false);
		});

		it("returns true for zero", () => {
			const a = S.decodeSync(Uint16.Number)(0);
			const b = S.decodeSync(Uint16.Number)(0);
			expect(Uint16.equals(a, b)).toBe(true);
		});
	});

	describe("Conversion: toNumber", () => {
		it("converts to number", () => {
			const value = S.decodeSync(Uint16.Number)(1000);
			expect(Uint16.toNumber(value)).toBe(1000);
		});

		it("converts zero", () => {
			const value = S.decodeSync(Uint16.Number)(0);
			expect(Uint16.toNumber(value)).toBe(0);
		});

		it("converts max", () => {
			const value = S.decodeSync(Uint16.Number)(65535);
			expect(Uint16.toNumber(value)).toBe(65535);
		});
	});

	describe("Conversion: toHex", () => {
		it("converts to hex string", () => {
			const value = S.decodeSync(Uint16.Number)(65535);
			const hex = Uint16.toHex(value);
			expect(hex).toMatch(/^0x[0-9a-f]+$/i);
		});

		it("converts zero", () => {
			const value = S.decodeSync(Uint16.Number)(0);
			const hex = Uint16.toHex(value);
			expect(hex).toMatch(/^0x0*$/i);
		});
	});

	describe("Constants", () => {
		it("MAX equals 65535", () => {
			expect(Uint16.toNumber(Uint16.MAX)).toBe(65535);
		});

		it("MIN equals 0", () => {
			expect(Uint16.toNumber(Uint16.MIN)).toBe(0);
		});

		it("ZERO equals 0", () => {
			expect(Uint16.toNumber(Uint16.ZERO)).toBe(0);
		});

		it("ONE equals 1", () => {
			expect(Uint16.toNumber(Uint16.ONE)).toBe(1);
		});
	});

	describe("Edge cases", () => {
		it("MAX + MAX wraps correctly", () => {
			const max = S.decodeSync(Uint16.Number)(UINT16_MAX);
			const result = Uint16.plus(max, max);
			expect(Uint16.toNumber(result)).toBe(65534);
		});

		it("alternating operations", () => {
			const a = S.decodeSync(Uint16.Number)(10000);
			const b = S.decodeSync(Uint16.Number)(5000);
			const r1 = Uint16.plus(a, b);
			const r2 = Uint16.minus(r1, b);
			expect(Uint16.toNumber(r2)).toBe(10000);
		});
	});
});
