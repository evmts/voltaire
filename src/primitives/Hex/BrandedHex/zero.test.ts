import { describe, expect, it } from "vitest";
import { zero } from "./zero.js";
import { size } from "./size.js";
import { toNumber } from "./toNumber.js";
import { toBigInt } from "./toBigInt.js";
import { toBoolean } from "./toBoolean.js";

describe("zero", () => {
	it("creates zero-filled hex of specified size", () => {
		expect(zero(1)).toBe("0x00");
		expect(zero(2)).toBe("0x0000");
		expect(zero(4)).toBe("0x00000000");
	});

	it("creates empty hex for size 0", () => {
		expect(zero(0)).toBe("0x");
	});

	it("creates large zero-filled hex", () => {
		const hex = zero(32);
		expect(size(hex)).toBe(32);
		expect(hex).toBe(
			"0x0000000000000000000000000000000000000000000000000000000000000000",
		);
	});

	it("creates zero hex that converts to 0", () => {
		expect(toNumber(zero(1))).toBe(0);
		expect(toNumber(zero(2))).toBe(0);
		expect(toNumber(zero(4))).toBe(0);
		expect(toBigInt(zero(8))).toBe(0n);
		expect(toBigInt(zero(32))).toBe(0n);
	});

	it("creates zero hex that converts to false", () => {
		expect(toBoolean(zero(1))).toBe(false);
		expect(toBoolean(zero(4))).toBe(false);
		expect(toBoolean(zero(32))).toBe(false);
	});

	it("creates address-sized zero hex (20 bytes)", () => {
		const hex = zero(20);
		expect(size(hex)).toBe(20);
		expect(hex.length).toBe(2 + 20 * 2);
	});

	it("creates hash-sized zero hex (32 bytes)", () => {
		const hex = zero(32);
		expect(size(hex)).toBe(32);
		expect(hex.length).toBe(2 + 32 * 2);
	});

	it("creates very large zero hex", () => {
		const hex = zero(1000);
		expect(size(hex)).toBe(1000);
		expect(hex).toBe("0x" + "00".repeat(1000));
	});

	it("uses lowercase hex characters", () => {
		expect(zero(4)).toBe("0x00000000");
	});
});
