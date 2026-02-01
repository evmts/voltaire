import { describe, expect, it } from "vitest";
import * as Epoch from "./index.js";

describe("Epoch", () => {
	describe("from", () => {
		it("creates Epoch from bigint", () => {
			const epoch = Epoch.from(100000n);
			expect(epoch).toBe(100000n);
		});

		it("creates Epoch from number", () => {
			const epoch = Epoch.from(100000);
			expect(epoch).toBe(100000n);
		});

		it("creates Epoch from hex string", () => {
			const epoch = Epoch.from("0x186a0");
			expect(epoch).toBe(100000n);
		});

		it("creates Epoch from decimal string", () => {
			const epoch = Epoch.from("100000");
			expect(epoch).toBe(100000n);
		});

		it("rejects negative number", () => {
			expect(() => Epoch.from(-1)).toThrow("cannot be negative");
		});

		it("rejects negative bigint", () => {
			expect(() => Epoch.from(-1n)).toThrow("cannot be negative");
		});

		it("rejects non-integer number", () => {
			expect(() => Epoch.from(1.5)).toThrow("safe integer");
		});
	});

	describe("toNumber", () => {
		it("converts to number", () => {
			const epoch = Epoch.from(100000n);
			expect(Epoch.toNumber(epoch)).toBe(100000);
		});

		it("rejects value exceeding MAX_SAFE_INTEGER", () => {
			const epoch = Epoch.from(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
			expect(() => Epoch.toNumber(epoch)).toThrow("exceeds MAX_SAFE_INTEGER");
		});
	});

	describe("toBigInt", () => {
		it("converts to bigint", () => {
			const epoch = Epoch.from(100000);
			expect(Epoch.toBigInt(epoch)).toBe(100000n);
		});
	});

	describe("equals", () => {
		it("returns true for equal epochs", () => {
			const a = Epoch.from(100000n);
			const b = Epoch.from(100000n);
			expect(Epoch.equals(a, b)).toBe(true);
		});

		it("returns false for unequal epochs", () => {
			const a = Epoch.from(100000n);
			const b = Epoch.from(100001n);
			expect(Epoch.equals(a, b)).toBe(false);
		});
	});

	describe("toSlot", () => {
		it("converts epoch to first slot (multiplication by 32)", () => {
			const epoch = Epoch.from(3n);
			const slot = Epoch.toSlot(epoch);
			expect(slot).toBe(96n);
		});

		it("handles epoch 0", () => {
			const epoch = Epoch.from(0n);
			const slot = Epoch.toSlot(epoch);
			expect(slot).toBe(0n);
		});

		it("handles epoch 1", () => {
			const epoch = Epoch.from(1n);
			const slot = Epoch.toSlot(epoch);
			expect(slot).toBe(32n);
		});
	});
});
