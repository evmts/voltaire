import { describe, expect, it } from "vitest";
import * as StorageValue from "./index.js";

describe("StorageValue", () => {
	describe("from", () => {
		it("creates StorageValue from bigint", () => {
			const val = StorageValue.from(123n);

			expect(val).toBeInstanceOf(Uint8Array);
			expect(val.length).toBe(32);
			expect(StorageValue.toUint256(val)).toBe(123n);
		});

		it("creates StorageValue from hex string", () => {
			const hex =
				"0x0000000000000000000000000000000000000000000000000000000000000123";
			const val = StorageValue.from(hex);

			expect(val).toBeInstanceOf(Uint8Array);
			expect(val.length).toBe(32);
			expect(StorageValue.toHex(val)).toBe(hex);
		});

		it("creates StorageValue from Uint8Array", () => {
			const bytes = new Uint8Array(32);
			bytes[31] = 0x7b; // 123 in hex

			const val = StorageValue.from(bytes);
			expect(val).toBeInstanceOf(Uint8Array);
			expect(val.length).toBe(32);
			expect(StorageValue.toUint256(val)).toBe(123n);
		});

		it("handles zero value", () => {
			const val = StorageValue.from(0n);

			expect(val.length).toBe(32);
			expect(StorageValue.toUint256(val)).toBe(0n);
			expect(val.every((b) => b === 0)).toBe(true);
		});

		it("handles max uint256 value", () => {
			const maxUint256 = 2n ** 256n - 1n;
			const val = StorageValue.from(maxUint256);

			expect(val.length).toBe(32);
			expect(StorageValue.toUint256(val)).toBe(maxUint256);
			expect(val.every((b) => b === 0xff)).toBe(true);
		});

		it("returns existing StorageValue unchanged", () => {
			const val1 = StorageValue.from(123n);
			const val2 = StorageValue.from(val1);

			expect(val2).toBe(val1);
		});

		it("throws on invalid length", () => {
			expect(() => StorageValue.from(new Uint8Array(31))).toThrow();
			expect(() => StorageValue.from(new Uint8Array(33))).toThrow();
		});
	});

	describe("fromHex", () => {
		it("creates StorageValue from hex with 0x prefix", () => {
			const hex =
				"0x0000000000000000000000000000000000000000000000000000000000000123";
			const val = StorageValue.fromHex(hex);

			expect(StorageValue.toHex(val)).toBe(hex);
		});

		it("creates StorageValue from hex without 0x prefix", () => {
			const hex =
				"0000000000000000000000000000000000000000000000000000000000000123";
			const val = StorageValue.fromHex(hex);

			expect(StorageValue.toHex(val)).toBe(`0x${hex}`);
		});
	});

	describe("toHex", () => {
		it("converts StorageValue to hex string", () => {
			const val = StorageValue.from(123n);
			const hex = StorageValue.toHex(val);

			expect(hex).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000123",
			);
		});

		it("includes 0x prefix", () => {
			const val = StorageValue.from(0n);
			const hex = StorageValue.toHex(val);

			expect(hex).toMatch(/^0x/);
		});
	});

	describe("toUint256", () => {
		it("converts StorageValue to bigint", () => {
			const val = StorageValue.from(123n);
			const num = StorageValue.toUint256(val);

			expect(num).toBe(123n);
		});

		it("handles zero", () => {
			const val = StorageValue.from(0n);
			const num = StorageValue.toUint256(val);

			expect(num).toBe(0n);
		});

		it("handles max uint256", () => {
			const maxUint256 = 2n ** 256n - 1n;
			const val = StorageValue.from(maxUint256);
			const num = StorageValue.toUint256(val);

			expect(num).toBe(maxUint256);
		});

		it("handles large values correctly", () => {
			const large = 0xdeadbeefcafebabean;
			const val = StorageValue.from(large);
			const num = StorageValue.toUint256(val);

			expect(num).toBe(large);
		});
	});

	describe("equals", () => {
		it("returns true for equal StorageValues", () => {
			const val1 = StorageValue.from(123n);
			const val2 = StorageValue.from(123n);

			expect(StorageValue.equals(val1, val2)).toBe(true);
		});

		it("returns false for different StorageValues", () => {
			const val1 = StorageValue.from(123n);
			const val2 = StorageValue.from(456n);

			expect(StorageValue.equals(val1, val2)).toBe(false);
		});

		it("uses constant-time comparison", () => {
			const val1 = StorageValue.from(0n);
			const val2 = StorageValue.from(2n ** 256n - 1n);

			// Should not throw and should return false
			expect(StorageValue.equals(val1, val2)).toBe(false);
		});
	});

	describe("integration", () => {
		it("round-trips through bigint", () => {
			const original = 0xdeadbeefn;
			const val = StorageValue.from(original);
			const num = StorageValue.toUint256(val);

			expect(num).toBe(original);
		});

		it("round-trips through hex", () => {
			const original =
				"0x0000000000000000000000000000000000000000000000000000000000000123";
			const val = StorageValue.fromHex(original);
			const hex = StorageValue.toHex(val);

			expect(hex).toBe(original);
		});
	});
});
