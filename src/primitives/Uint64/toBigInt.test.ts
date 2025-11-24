import { describe, expect, it } from "vitest";
import { MAX, ONE, ZERO } from "./constants.js";
import { from } from "./from.js";
import { toBigInt } from "./toBigInt.js";

describe("Uint64.toBigInt", () => {
	it("converts zero", () => {
		expect(toBigInt(ZERO)).toBe(0n);
	});

	it("converts one", () => {
		expect(toBigInt(ONE)).toBe(1n);
	});

	it("converts small value", () => {
		expect(toBigInt(from(42n))).toBe(42n);
	});

	it("converts MAX", () => {
		expect(toBigInt(MAX)).toBe(18446744073709551615n);
	});

	it("converts power of 2", () => {
		expect(toBigInt(from(1n << 32n))).toBe(4294967296n);
	});

	it("converts large value", () => {
		expect(toBigInt(from(12345678901234567890n))).toBe(12345678901234567890n);
	});

	it("preserves value through round-trip", () => {
		const original = 999999999999n;
		const uint = from(original);
		expect(toBigInt(uint)).toBe(original);
	});
});
