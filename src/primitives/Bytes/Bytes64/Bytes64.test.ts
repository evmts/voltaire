import { describe, expect, it } from "vitest";
import * as Bytes64 from "./index.js";

describe("Bytes64", () => {
	describe("constants", () => {
		it("SIZE should be 64", () => {
			expect(Bytes64.SIZE).toBe(64);
		});

		it("ZERO should be 64 zero bytes", () => {
			expect(Bytes64.ZERO.length).toBe(64);
			expect(Array.from(Bytes64.ZERO).every((b) => b === 0)).toBe(true);
		});
	});

	describe("fromBytes", () => {
		it("should create Bytes64 from valid bytes", () => {
			const input = new Uint8Array(64);
			input[0] = 1;
			input[63] = 255;
			const result = Bytes64.fromBytes(input);
			expect(result.length).toBe(64);
			expect(result[0]).toBe(1);
			expect(result[63]).toBe(255);
		});

		it("should throw on wrong length", () => {
			expect(() => Bytes64.fromBytes(new Uint8Array(63))).toThrow(
				"Bytes64 must be 64 bytes, got 63",
			);
			expect(() => Bytes64.fromBytes(new Uint8Array(65))).toThrow(
				"Bytes64 must be 64 bytes, got 65",
			);
		});

		it("should clone the input", () => {
			const input = new Uint8Array(64);
			input[0] = 42;
			const result = Bytes64.fromBytes(input);
			input[0] = 99;
			expect(result[0]).toBe(42);
		});
	});

	describe("fromHex", () => {
		it("should create Bytes64 from valid hex with 0x prefix", () => {
			const hex = `0x${"12".repeat(64)}`;
			const result = Bytes64.fromHex(hex);
			expect(result.length).toBe(64);
			expect(result[0]).toBe(0x12);
			expect(result[63]).toBe(0x12);
		});

		it("should create Bytes64 from valid hex without prefix", () => {
			const hex = "ab".repeat(64);
			const result = Bytes64.fromHex(hex);
			expect(result.length).toBe(64);
			expect(result[0]).toBe(0xab);
		});

		it("should throw on wrong length", () => {
			expect(() => Bytes64.fromHex("0x1234")).toThrow(
				"Bytes64 hex must be 128 characters",
			);
			expect(() => Bytes64.fromHex(`0x${"12".repeat(65)}`)).toThrow(
				"Bytes64 hex must be 128 characters",
			);
		});

		it("should throw on invalid hex characters", () => {
			expect(() => Bytes64.fromHex(`0x${"zz".repeat(64)}`)).toThrow(
				"Invalid hex string",
			);
		});

		it("should handle mixed case hex", () => {
			const hex = `0x${"AbCdEf0123456789".repeat(8)}`;
			const result = Bytes64.fromHex(hex);
			expect(result[0]).toBe(0xab);
			expect(result[1]).toBe(0xcd);
		});
	});

	describe("from", () => {
		it("should create from hex string", () => {
			const hex = `0x${"aa".repeat(64)}`;
			const result = Bytes64.from(hex);
			expect(result.length).toBe(64);
			expect(result[0]).toBe(0xaa);
		});

		it("should create from bytes", () => {
			const bytes = new Uint8Array(64);
			bytes[0] = 123;
			const result = Bytes64.from(bytes);
			expect(result[0]).toBe(123);
		});
	});

	describe("toHex", () => {
		it("should convert to hex with 0x prefix", () => {
			const bytes = new Uint8Array(64);
			bytes[0] = 0x12;
			bytes[1] = 0xab;
			bytes[63] = 0xff;
			const hex = Bytes64.toHex(
				Bytes64.fromBytes(bytes) as Bytes64.BrandedBytes64,
			);
			expect(hex).toMatch(/^0x[0-9a-f]{128}$/);
			expect(hex.slice(0, 6)).toBe("0x12ab");
			expect(hex.slice(-2)).toBe("ff");
		});

		it("should pad single digit hex values", () => {
			const bytes = new Uint8Array(64);
			bytes[0] = 0x01;
			bytes[1] = 0x0f;
			const hex = Bytes64.toHex(
				Bytes64.fromBytes(bytes) as Bytes64.BrandedBytes64,
			);
			expect(hex.slice(2, 6)).toBe("010f");
		});
	});

	describe("toUint8Array", () => {
		it("should convert to Uint8Array", () => {
			const bytes = new Uint8Array(64);
			bytes[0] = 42;
			const b64 = Bytes64.fromBytes(bytes);
			const result = Bytes64.toUint8Array(b64);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
			expect(result[0]).toBe(42);
		});

		it("should create a copy", () => {
			const b64 = Bytes64.fromBytes(new Uint8Array(64));
			const arr = Bytes64.toUint8Array(b64);
			arr[0] = 99;
			expect(b64[0]).toBe(0);
		});
	});

	describe("equals", () => {
		it("should return true for equal values", () => {
			const a = Bytes64.fromBytes(new Uint8Array(64));
			const b = Bytes64.fromBytes(new Uint8Array(64));
			expect(Bytes64.equals(a, b)).toBe(true);
		});

		it("should return false for different values", () => {
			const a = new Uint8Array(64);
			a[0] = 1;
			const b = new Uint8Array(64);
			b[0] = 2;
			expect(
				Bytes64.equals(
					Bytes64.fromBytes(a) as Bytes64.BrandedBytes64,
					Bytes64.fromBytes(b) as Bytes64.BrandedBytes64,
				),
			).toBe(false);
		});

		it("should return true for same instance", () => {
			const a = Bytes64.fromBytes(new Uint8Array(64));
			expect(Bytes64.equals(a, a)).toBe(true);
		});
	});

	describe("compare", () => {
		it("should return 0 for equal values", () => {
			const a = Bytes64.fromBytes(new Uint8Array(64));
			const b = Bytes64.fromBytes(new Uint8Array(64));
			expect(Bytes64.compare(a, b)).toBe(0);
		});

		it("should return -1 when first is less", () => {
			const a = new Uint8Array(64);
			a[0] = 1;
			const b = new Uint8Array(64);
			b[0] = 2;
			expect(
				Bytes64.compare(
					Bytes64.fromBytes(a) as Bytes64.BrandedBytes64,
					Bytes64.fromBytes(b) as Bytes64.BrandedBytes64,
				),
			).toBe(-1);
		});

		it("should return 1 when first is greater", () => {
			const a = new Uint8Array(64);
			a[0] = 2;
			const b = new Uint8Array(64);
			b[0] = 1;
			expect(
				Bytes64.compare(
					Bytes64.fromBytes(a) as Bytes64.BrandedBytes64,
					Bytes64.fromBytes(b) as Bytes64.BrandedBytes64,
				),
			).toBe(1);
		});

		it("should compare byte by byte", () => {
			const a = new Uint8Array(64);
			a[63] = 1;
			const b = new Uint8Array(64);
			b[63] = 2;
			expect(
				Bytes64.compare(
					Bytes64.fromBytes(a) as Bytes64.BrandedBytes64,
					Bytes64.fromBytes(b) as Bytes64.BrandedBytes64,
				),
			).toBe(-1);
		});
	});

	describe("clone", () => {
		it("should create independent copy", () => {
			const original = new Uint8Array(64);
			original[0] = 42;
			const b64 = Bytes64.fromBytes(original);
			const cloned = Bytes64.clone(b64);
			expect(cloned[0]).toBe(42);
			original[0] = 99;
			expect(cloned[0]).toBe(42);
		});

		it("should preserve all bytes", () => {
			const original = new Uint8Array(64);
			for (let i = 0; i < 64; i++) {
				original[i] = i % 256;
			}
			const cloned = Bytes64.clone(Bytes64.fromBytes(original));
			for (let i = 0; i < 64; i++) {
				expect(cloned[i]).toBe(i % 256);
			}
		});
	});

	describe("size", () => {
		it("should always return 64", () => {
			const b64 = Bytes64.fromBytes(new Uint8Array(64));
			expect(Bytes64.size(b64)).toBe(64);
		});
	});

	describe("zero", () => {
		it("should create zero-filled Bytes64", () => {
			const z = Bytes64.zero();
			expect(z.length).toBe(64);
			expect(Array.from(z).every((b) => b === 0)).toBe(true);
		});

		it("should create new instance each time", () => {
			const z1 = Bytes64.zero();
			const z2 = Bytes64.zero();
			expect(z1).not.toBe(z2);
		});
	});

	describe("isZero", () => {
		it("should return true for all zeros", () => {
			const z = Bytes64.zero();
			expect(Bytes64.isZero(z)).toBe(true);
		});

		it("should return false for non-zero values", () => {
			const bytes = new Uint8Array(64);
			bytes[63] = 1;
			expect(Bytes64.isZero(Bytes64.fromBytes(bytes))).toBe(false);
		});

		it("should return false if any byte is non-zero", () => {
			const bytes = new Uint8Array(64);
			bytes[32] = 1;
			expect(Bytes64.isZero(Bytes64.fromBytes(bytes))).toBe(false);
		});
	});

	describe("use cases", () => {
		it("should handle concatenated hashes", () => {
			const hash1 = new Uint8Array(32);
			hash1.fill(0xaa);
			const hash2 = new Uint8Array(32);
			hash2.fill(0xbb);
			const combined = new Uint8Array(64);
			combined.set(hash1, 0);
			combined.set(hash2, 32);
			const b64 = Bytes64.fromBytes(combined);
			expect(b64[0]).toBe(0xaa);
			expect(b64[32]).toBe(0xbb);
		});

		it("should handle extended hashes", () => {
			const extended = new Uint8Array(64);
			for (let i = 0; i < 64; i++) {
				extended[i] = i % 256;
			}
			const b64 = Bytes64.fromBytes(extended);
			expect(b64.length).toBe(64);
		});
	});
});
