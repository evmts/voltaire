import { describe, expect, it } from "vitest";
import * as Storage from "./index.js";

describe("Storage.from", () => {
	describe("validates storage slot is exactly 32 bytes", () => {
		it("creates StorageSlot from bigint 0", () => {
			const slot = Storage.from(0n);
			expect(slot).toBeInstanceOf(Uint8Array);
			expect(slot.length).toBe(32);
			expect(slot.every((b) => b === 0)).toBe(true);
		});

		it("creates StorageSlot from bigint value", () => {
			const slot = Storage.from(123n);
			expect(slot.length).toBe(32);
			// Last byte should be 123 (0x7b)
			expect(slot[31]).toBe(123);
		});

		it("creates StorageSlot from max u256 value", () => {
			const maxU256 = 2n ** 256n - 1n;
			const slot = Storage.from(maxU256);
			expect(slot.length).toBe(32);
			expect(slot.every((b) => b === 0xff)).toBe(true);
		});

		it("creates StorageSlot from number", () => {
			const slot = Storage.from(42);
			expect(slot.length).toBe(32);
			expect(slot[31]).toBe(42);
		});

		it("creates StorageSlot from hex string (32 bytes)", () => {
			const hex = `0x${"ab".repeat(32)}`;
			const slot = Storage.from(hex);
			expect(slot.length).toBe(32);
			expect(slot.every((b) => b === 0xab)).toBe(true);
		});

		it("creates StorageSlot from Uint8Array (exactly 32 bytes)", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0xde;
			bytes[31] = 0xad;
			const slot = Storage.from(bytes);
			expect(slot.length).toBe(32);
			expect(slot[0]).toBe(0xde);
			expect(slot[31]).toBe(0xad);
		});
	});

	describe("rejects invalid lengths", () => {
		it("throws on Uint8Array with 31 bytes", () => {
			const bytes = new Uint8Array(31);
			expect(() => Storage.from(bytes)).toThrow(
				"StorageSlot must be exactly 32 bytes, got 31",
			);
		});

		it("throws on Uint8Array with 33 bytes", () => {
			const bytes = new Uint8Array(33);
			expect(() => Storage.from(bytes)).toThrow(
				"StorageSlot must be exactly 32 bytes, got 33",
			);
		});

		it("throws on empty Uint8Array", () => {
			const bytes = new Uint8Array(0);
			expect(() => Storage.from(bytes)).toThrow(
				"StorageSlot must be exactly 32 bytes, got 0",
			);
		});

		it("throws on hex string with wrong length", () => {
			const hex = `0x${"ab".repeat(16)}`; // 16 bytes
			expect(() => Storage.from(hex)).toThrow(
				"StorageSlot must be exactly 32 bytes",
			);
		});
	});

	describe("rejects invalid values", () => {
		it("throws on negative bigint", () => {
			expect(() => Storage.from(-1n)).toThrow("cannot be negative");
		});

		it("throws on value exceeding 256 bits", () => {
			expect(() => Storage.from(2n ** 256n)).toThrow("exceeds 256 bits");
		});

		it("throws on negative number", () => {
			expect(() => Storage.from(-1)).toThrow("must be a non-negative integer");
		});

		it("throws on non-integer number", () => {
			expect(() => Storage.from(1.5)).toThrow("must be a non-negative integer");
		});

		it("throws on unsupported type", () => {
			// @ts-expect-error - testing invalid type
			expect(() => Storage.from({ invalid: true })).toThrow(
				"Cannot convert object to StorageSlot",
			);
		});

		it("throws on null", () => {
			// @ts-expect-error - testing invalid type
			expect(() => Storage.from(null)).toThrow("Cannot convert");
		});
	});

	describe("branding", () => {
		it("creates copy of input bytes (immutability)", () => {
			const original = new Uint8Array(32);
			original[0] = 0xff;
			const slot = Storage.from(original);

			// Modify original
			original[0] = 0x00;

			// Slot should be unchanged
			expect(slot[0]).toBe(0xff);
		});

		it("has correct brand symbol", () => {
			const slot = Storage.from(0n);
			// @ts-expect-error - accessing internal brand
			expect(slot[Symbol.for("voltaire.brand")]).toBe("StorageSlot");
		});
	});

	describe("edge cases", () => {
		it("handles slot 0 correctly", () => {
			const slot = Storage.from(0n);
			expect(slot.every((b) => b === 0)).toBe(true);
		});

		it("handles large slot numbers", () => {
			// Slot at keccak256("example.main") & ~0xff (ERC-7201 style)
			const largeSlot =
				0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567800n;
			const slot = Storage.from(largeSlot);
			expect(slot.length).toBe(32);
		});

		it("handles Number.MAX_SAFE_INTEGER", () => {
			const slot = Storage.from(Number.MAX_SAFE_INTEGER);
			expect(slot.length).toBe(32);
		});

		it("throws on number exceeding MAX_SAFE_INTEGER", () => {
			expect(() => Storage.from(Number.MAX_SAFE_INTEGER + 1)).toThrow(
				"exceeds safe integer range",
			);
		});
	});
});
