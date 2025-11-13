import { describe, expect, it } from "vitest";
import * as Bytes16 from "./index.js";

describe("Bytes16", () => {
	describe("constants", () => {
		it("SIZE should be 16", () => {
			expect(Bytes16.SIZE).toBe(16);
		});

		it("ZERO should be 16 zero bytes", () => {
			expect(Bytes16.ZERO.length).toBe(16);
			expect(Array.from(Bytes16.ZERO).every((b) => b === 0)).toBe(true);
		});
	});

	describe("fromBytes", () => {
		it("should create Bytes16 from valid bytes", () => {
			const input = new Uint8Array(16);
			input[0] = 1;
			input[15] = 255;
			const result = Bytes16.fromBytes(input);
			expect(result.length).toBe(16);
			expect(result[0]).toBe(1);
			expect(result[15]).toBe(255);
		});

		it("should throw on wrong length", () => {
			expect(() => Bytes16.fromBytes(new Uint8Array(15))).toThrow(
				"Bytes16 must be 16 bytes, got 15",
			);
			expect(() => Bytes16.fromBytes(new Uint8Array(17))).toThrow(
				"Bytes16 must be 16 bytes, got 17",
			);
		});

		it("should clone the input", () => {
			const input = new Uint8Array(16);
			input[0] = 42;
			const result = Bytes16.fromBytes(input);
			input[0] = 99;
			expect(result[0]).toBe(42);
		});
	});

	describe("fromHex", () => {
		it("should create Bytes16 from valid hex with 0x prefix", () => {
			const hex = "0x" + "12".repeat(16);
			const result = Bytes16.fromHex(hex);
			expect(result.length).toBe(16);
			expect(result[0]).toBe(0x12);
			expect(result[15]).toBe(0x12);
		});

		it("should create Bytes16 from valid hex without prefix", () => {
			const hex = "ab".repeat(16);
			const result = Bytes16.fromHex(hex);
			expect(result.length).toBe(16);
			expect(result[0]).toBe(0xab);
		});

		it("should throw on wrong length", () => {
			expect(() => Bytes16.fromHex("0x1234")).toThrow(
				"Bytes16 hex must be 32 characters",
			);
			expect(() => Bytes16.fromHex("0x" + "12".repeat(17))).toThrow(
				"Bytes16 hex must be 32 characters",
			);
		});

		it("should throw on invalid hex characters", () => {
			expect(() => Bytes16.fromHex("0x" + "zz".repeat(16))).toThrow(
				"Invalid hex string",
			);
		});

		it("should handle mixed case hex", () => {
			const hex = "0xAbCdEf0123456789AbCdEf0123456789";
			const result = Bytes16.fromHex(hex);
			expect(result[0]).toBe(0xab);
			expect(result[1]).toBe(0xcd);
		});
	});

	describe("from", () => {
		it("should create from hex string", () => {
			const hex = "0x" + "aa".repeat(16);
			const result = Bytes16.from(hex);
			expect(result.length).toBe(16);
			expect(result[0]).toBe(0xaa);
		});

		it("should create from bytes", () => {
			const bytes = new Uint8Array(16);
			bytes[0] = 123;
			const result = Bytes16.from(bytes);
			expect(result[0]).toBe(123);
		});
	});

	describe("toHex", () => {
		it("should convert to hex with 0x prefix", () => {
			const bytes = new Uint8Array(16);
			bytes[0] = 0x12;
			bytes[1] = 0xab;
			bytes[15] = 0xff;
			const hex = Bytes16.toHex(
				Bytes16.fromBytes(bytes) as Bytes16.BrandedBytes16,
			);
			expect(hex).toMatch(/^0x[0-9a-f]{32}$/);
			expect(hex.slice(0, 6)).toBe("0x12ab");
			expect(hex.slice(-2)).toBe("ff");
		});

		it("should pad single digit hex values", () => {
			const bytes = new Uint8Array(16);
			bytes[0] = 0x01;
			bytes[1] = 0x0f;
			const hex = Bytes16.toHex(
				Bytes16.fromBytes(bytes) as Bytes16.BrandedBytes16,
			);
			expect(hex.slice(2, 6)).toBe("010f");
		});
	});

	describe("toUint8Array", () => {
		it("should convert to Uint8Array", () => {
			const bytes = new Uint8Array(16);
			bytes[0] = 42;
			const b16 = Bytes16.fromBytes(bytes);
			const result = Bytes16.toUint8Array(b16);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(16);
			expect(result[0]).toBe(42);
		});

		it("should create a copy", () => {
			const b16 = Bytes16.fromBytes(new Uint8Array(16));
			const arr = Bytes16.toUint8Array(b16);
			arr[0] = 99;
			expect(b16[0]).toBe(0);
		});
	});

	describe("equals", () => {
		it("should return true for equal values", () => {
			const a = Bytes16.fromBytes(new Uint8Array(16));
			const b = Bytes16.fromBytes(new Uint8Array(16));
			expect(Bytes16.equals(a, b)).toBe(true);
		});

		it("should return false for different values", () => {
			const a = new Uint8Array(16);
			a[0] = 1;
			const b = new Uint8Array(16);
			b[0] = 2;
			expect(
				Bytes16.equals(
					Bytes16.fromBytes(a) as Bytes16.BrandedBytes16,
					Bytes16.fromBytes(b) as Bytes16.BrandedBytes16,
				),
			).toBe(false);
		});

		it("should return true for same instance", () => {
			const a = Bytes16.fromBytes(new Uint8Array(16));
			expect(Bytes16.equals(a, a)).toBe(true);
		});
	});

	describe("compare", () => {
		it("should return 0 for equal values", () => {
			const a = Bytes16.fromBytes(new Uint8Array(16));
			const b = Bytes16.fromBytes(new Uint8Array(16));
			expect(Bytes16.compare(a, b)).toBe(0);
		});

		it("should return -1 when first is less", () => {
			const a = new Uint8Array(16);
			a[0] = 1;
			const b = new Uint8Array(16);
			b[0] = 2;
			expect(
				Bytes16.compare(
					Bytes16.fromBytes(a) as Bytes16.BrandedBytes16,
					Bytes16.fromBytes(b) as Bytes16.BrandedBytes16,
				),
			).toBe(-1);
		});

		it("should return 1 when first is greater", () => {
			const a = new Uint8Array(16);
			a[0] = 2;
			const b = new Uint8Array(16);
			b[0] = 1;
			expect(
				Bytes16.compare(
					Bytes16.fromBytes(a) as Bytes16.BrandedBytes16,
					Bytes16.fromBytes(b) as Bytes16.BrandedBytes16,
				),
			).toBe(1);
		});

		it("should compare byte by byte", () => {
			const a = new Uint8Array(16);
			a[15] = 1;
			const b = new Uint8Array(16);
			b[15] = 2;
			expect(
				Bytes16.compare(
					Bytes16.fromBytes(a) as Bytes16.BrandedBytes16,
					Bytes16.fromBytes(b) as Bytes16.BrandedBytes16,
				),
			).toBe(-1);
		});
	});

	describe("clone", () => {
		it("should create independent copy", () => {
			const original = new Uint8Array(16);
			original[0] = 42;
			const b16 = Bytes16.fromBytes(original);
			const cloned = Bytes16.clone(b16);
			expect(cloned[0]).toBe(42);
			// Modify original typed array reference
			original[0] = 99;
			expect(cloned[0]).toBe(42);
		});

		it("should preserve all bytes", () => {
			const original = new Uint8Array(16);
			for (let i = 0; i < 16; i++) {
				original[i] = i;
			}
			const cloned = Bytes16.clone(Bytes16.fromBytes(original));
			for (let i = 0; i < 16; i++) {
				expect(cloned[i]).toBe(i);
			}
		});
	});

	describe("size", () => {
		it("should always return 16", () => {
			const b16 = Bytes16.fromBytes(new Uint8Array(16));
			expect(Bytes16.size(b16)).toBe(16);
		});
	});

	describe("zero", () => {
		it("should create zero-filled Bytes16", () => {
			const z = Bytes16.zero();
			expect(z.length).toBe(16);
			expect(Array.from(z).every((b) => b === 0)).toBe(true);
		});

		it("should create new instance each time", () => {
			const z1 = Bytes16.zero();
			const z2 = Bytes16.zero();
			expect(z1).not.toBe(z2);
		});
	});

	describe("isZero", () => {
		it("should return true for all zeros", () => {
			const z = Bytes16.zero();
			expect(Bytes16.isZero(z)).toBe(true);
		});

		it("should return false for non-zero values", () => {
			const bytes = new Uint8Array(16);
			bytes[15] = 1;
			expect(Bytes16.isZero(Bytes16.fromBytes(bytes))).toBe(false);
		});

		it("should return false if any byte is non-zero", () => {
			const bytes = new Uint8Array(16);
			bytes[8] = 1;
			expect(Bytes16.isZero(Bytes16.fromBytes(bytes))).toBe(false);
		});
	});
});
