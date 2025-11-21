import { describe, expect, it } from "vitest";
import * as Slot from "./index.js";

describe("Slot.from", () => {
	describe("valid inputs", () => {
		it("creates from bigint", () => {
			const slot = Slot.from(1000000n);
			expect(slot).toBe(1000000n);
		});

		it("creates from number", () => {
			const slot = Slot.from(1000000);
			expect(slot).toBe(1000000n);
		});

		it("creates from hex string", () => {
			const slot = Slot.from("0xf4240");
			expect(slot).toBe(1000000n);
		});

		it("creates from decimal string", () => {
			const slot = Slot.from("1000000");
			expect(slot).toBe(1000000n);
		});

		it("creates from zero", () => {
			const slot = Slot.from(0);
			expect(slot).toBe(0n);
		});

		it("creates from zero bigint", () => {
			const slot = Slot.from(0n);
			expect(slot).toBe(0n);
		});

		it("creates from zero string", () => {
			const slot = Slot.from("0");
			expect(slot).toBe(0n);
		});

		it("creates from large value", () => {
			const large = 2n ** 100n;
			const slot = Slot.from(large);
			expect(slot).toBe(large);
		});

		it("creates genesis slot", () => {
			const slot = Slot.from(0);
			expect(slot).toBe(0n);
		});

		it("creates slot at epoch boundary", () => {
			const slot = Slot.from(32);
			expect(slot).toBe(32n);
		});

		it("creates current realistic slot", () => {
			const slot = Slot.from(7000000);
			expect(slot).toBe(7000000n);
		});
	});

	describe("error cases", () => {
		it("throws on negative number", () => {
			expect(() => Slot.from(-1)).toThrow("cannot be negative");
		});

		it("throws on negative bigint", () => {
			expect(() => Slot.from(-1n)).toThrow("cannot be negative");
		});

		it("throws on non-integer number", () => {
			expect(() => Slot.from(1.5)).toThrow("safe integer");
		});

		it("throws on NaN", () => {
			expect(() => Slot.from(Number.NaN)).toThrow("safe integer");
		});

		it("throws on Infinity", () => {
			expect(() => Slot.from(Number.POSITIVE_INFINITY)).toThrow("safe integer");
		});

		it("throws on negative Infinity", () => {
			expect(() => Slot.from(Number.NEGATIVE_INFINITY)).toThrow("safe integer");
		});

		it("throws on unsafe large number", () => {
			expect(() => Slot.from(Number.MAX_SAFE_INTEGER + 1)).toThrow(
				"safe integer",
			);
		});
	});

	describe("round-trip", () => {
		it("preserves bigint value", () => {
			const original = 1234567n;
			const slot = Slot.from(original);
			expect(slot).toBe(original);
		});

		it("preserves number value as bigint", () => {
			const original = 1234567;
			const slot = Slot.from(original);
			expect(slot).toBe(1234567n);
		});

		it("preserves string value", () => {
			const slot = Slot.from("1234567");
			expect(slot).toBe(1234567n);
		});

		it("preserves hex string value", () => {
			const slot = Slot.from("0x12d687");
			expect(slot).toBe(1234567n);
		});
	});
});
