import { describe, expect, it } from "vitest";
import * as Slot from "./index.js";

describe("Slot", () => {
	describe("from", () => {
		it("creates Slot from bigint", () => {
			const slot = Slot.from(1000000n);
			expect(slot).toBe(1000000n);
		});

		it("creates Slot from number", () => {
			const slot = Slot.from(1000000);
			expect(slot).toBe(1000000n);
		});

		it("creates Slot from hex string", () => {
			const slot = Slot.from("0xf4240");
			expect(slot).toBe(1000000n);
		});

		it("creates Slot from decimal string", () => {
			const slot = Slot.from("1000000");
			expect(slot).toBe(1000000n);
		});

		it("rejects negative number", () => {
			expect(() => Slot.from(-1)).toThrow("cannot be negative");
		});

		it("rejects negative bigint", () => {
			expect(() => Slot.from(-1n)).toThrow("cannot be negative");
		});

		it("rejects non-integer number", () => {
			expect(() => Slot.from(1.5)).toThrow("safe integer");
		});
	});

	describe("toNumber", () => {
		it("converts to number", () => {
			const slot = Slot.from(1000000n);
			expect(Slot.toNumber(slot)).toBe(1000000);
		});

		it("rejects value exceeding MAX_SAFE_INTEGER", () => {
			const slot = Slot.from(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
			expect(() => Slot.toNumber(slot)).toThrow("exceeds MAX_SAFE_INTEGER");
		});
	});

	describe("toBigInt", () => {
		it("converts to bigint", () => {
			const slot = Slot.from(1000000);
			expect(Slot.toBigInt(slot)).toBe(1000000n);
		});
	});

	describe("equals", () => {
		it("returns true for equal slots", () => {
			const a = Slot.from(1000000n);
			const b = Slot.from(1000000n);
			expect(Slot.equals(a, b)).toBe(true);
		});

		it("returns false for unequal slots", () => {
			const a = Slot.from(1000000n);
			const b = Slot.from(1000001n);
			expect(Slot.equals(a, b)).toBe(false);
		});
	});

	describe("toEpoch", () => {
		it("converts slot to epoch (division by 32)", () => {
			const slot = Slot.from(96n);
			const epoch = Slot.toEpoch(slot);
			expect(epoch).toBe(3n);
		});

		it("rounds down for partial epochs", () => {
			const slot = Slot.from(97n);
			const epoch = Slot.toEpoch(slot);
			expect(epoch).toBe(3n);
		});

		it("handles slot 0", () => {
			const slot = Slot.from(0n);
			const epoch = Slot.toEpoch(slot);
			expect(epoch).toBe(0n);
		});

		it("handles first slot of epoch", () => {
			const slot = Slot.from(32n);
			const epoch = Slot.toEpoch(slot);
			expect(epoch).toBe(1n);
		});
	});
});
