import { describe, expect, it } from "vitest";
import { from } from "./from.js";
import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
} from "../errors/index.js";

describe("Nonce.from", () => {
	it("creates nonce from number", () => {
		const nonce = from(0);
		expect(typeof nonce).toBe("bigint");
		expect(nonce).toBe(0n);
	});

	it("creates nonce from bigint", () => {
		const nonce = from(42n);
		expect(typeof nonce).toBe("bigint");
		expect(nonce).toBe(42n);
	});

	it("creates nonce from hex string", () => {
		const nonce = from("0x2a");
		expect(typeof nonce).toBe("bigint");
		expect(nonce).toBe(42n);
	});

	it("handles zero nonce", () => {
		const nonce = from(0);
		expect(nonce).toBe(0n);
	});

	it("handles max uint64 nonce", () => {
		const maxUint64 = 18446744073709551615n;
		const nonce = from(maxUint64);
		expect(nonce).toBe(maxUint64);
	});

	describe("validation", () => {
		it("rejects negative number", () => {
			expect(() => from(-1)).toThrow(IntegerUnderflowError);
			expect(() => from(-1)).toThrow("Nonce cannot be negative");
		});

		it("rejects negative bigint", () => {
			expect(() => from(-1n)).toThrow(IntegerUnderflowError);
			expect(() => from(-1n)).toThrow("Nonce cannot be negative");
		});

		it("rejects negative hex string", () => {
			// "-0x1" is not valid BigInt syntax, throws InvalidFormat
			expect(() => from("-0x1")).toThrow(InvalidFormatError);
			// "-1" is valid BigInt syntax, throws Underflow
			expect(() => from("-1")).toThrow(IntegerUnderflowError);
		});

		it("rejects large negative values", () => {
			expect(() => from(-9999999999n)).toThrow(IntegerUnderflowError);
		});

		it("rejects value exceeding uint64 max", () => {
			const overMax = 18446744073709551616n; // 2^64
			expect(() => from(overMax)).toThrow(IntegerOverflowError);
			expect(() => from(overMax)).toThrow("exceeds maximum uint64");
		});

		it("rejects non-integer number", () => {
			expect(() => from(1.5)).toThrow(InvalidFormatError);
			expect(() => from(1.5)).toThrow("must be an integer");
		});

		it("rejects invalid string", () => {
			expect(() => from("not-a-number")).toThrow(InvalidFormatError);
		});
	});
});
