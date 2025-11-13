import { describe, expect, it } from "vitest";
import * as Bytes32 from "./index.js";

describe("Bytes32", () => {
	describe("constants", () => {
		it("SIZE should be 32", () => {
			expect(Bytes32.SIZE).toBe(32);
		});

		it("ZERO should be 32 zero bytes", () => {
			expect(Bytes32.ZERO.length).toBe(32);
			expect(Array.from(Bytes32.ZERO).every((b) => b === 0)).toBe(true);
		});
	});

	describe("fromBytes", () => {
		it("should create Bytes32 from valid bytes", () => {
			const input = new Uint8Array(32);
			input[0] = 1;
			input[31] = 255;
			const result = Bytes32.fromBytes(input);
			expect(result.length).toBe(32);
			expect(result[0]).toBe(1);
			expect(result[31]).toBe(255);
		});

		it("should throw on wrong length", () => {
			expect(() => Bytes32.fromBytes(new Uint8Array(31))).toThrow(
				"Bytes32 must be 32 bytes, got 31",
			);
			expect(() => Bytes32.fromBytes(new Uint8Array(33))).toThrow(
				"Bytes32 must be 32 bytes, got 33",
			);
		});

		it("should clone the input", () => {
			const input = new Uint8Array(32);
			input[0] = 42;
			const result = Bytes32.fromBytes(input);
			input[0] = 99;
			expect(result[0]).toBe(42);
		});
	});

	describe("fromHex", () => {
		it("should create Bytes32 from valid hex with 0x prefix", () => {
			const hex = "0x" + "12".repeat(32);
			const result = Bytes32.fromHex(hex);
			expect(result.length).toBe(32);
			expect(result[0]).toBe(0x12);
			expect(result[31]).toBe(0x12);
		});

		it("should create Bytes32 from valid hex without prefix", () => {
			const hex = "ab".repeat(32);
			const result = Bytes32.fromHex(hex);
			expect(result.length).toBe(32);
			expect(result[0]).toBe(0xab);
		});

		it("should throw on wrong length", () => {
			expect(() => Bytes32.fromHex("0x1234")).toThrow(
				"Bytes32 hex must be 64 characters",
			);
			expect(() => Bytes32.fromHex("0x" + "12".repeat(33))).toThrow(
				"Bytes32 hex must be 64 characters",
			);
		});

		it("should throw on invalid hex characters", () => {
			expect(() => Bytes32.fromHex("0x" + "zz".repeat(32))).toThrow(
				"Invalid hex string",
			);
		});

		it("should handle mixed case hex", () => {
			const hex = "0x" + "AbCdEf0123456789".repeat(4);
			const result = Bytes32.fromHex(hex);
			expect(result[0]).toBe(0xab);
			expect(result[1]).toBe(0xcd);
		});
	});

	describe("fromNumber", () => {
		it("should create Bytes32 from number", () => {
			const result = Bytes32.fromNumber(42);
			expect(result.length).toBe(32);
			expect(result[31]).toBe(42);
			expect(result[30]).toBe(0);
		});

		it("should pad to 32 bytes (big-endian)", () => {
			const result = Bytes32.fromNumber(0x1234);
			expect(result[30]).toBe(0x12);
			expect(result[31]).toBe(0x34);
			for (let i = 0; i < 30; i++) {
				expect(result[i]).toBe(0);
			}
		});

		it("should handle zero", () => {
			const result = Bytes32.fromNumber(0);
			expect(Array.from(result).every((b) => b === 0)).toBe(true);
		});

		it("should handle max safe integer", () => {
			const result = Bytes32.fromNumber(Number.MAX_SAFE_INTEGER);
			expect(result.length).toBe(32);
		});
	});

	describe("fromBigint", () => {
		it("should create Bytes32 from bigint", () => {
			const result = Bytes32.fromBigint(42n);
			expect(result.length).toBe(32);
			expect(result[31]).toBe(42);
		});

		it("should pad to 32 bytes (big-endian)", () => {
			const result = Bytes32.fromBigint(0x1234n);
			expect(result[30]).toBe(0x12);
			expect(result[31]).toBe(0x34);
			for (let i = 0; i < 30; i++) {
				expect(result[i]).toBe(0);
			}
		});

		it("should handle large bigints", () => {
			const large =
				0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0n;
			const result = Bytes32.fromBigint(large);
			expect(result.length).toBe(32);
			expect(result[0]).toBe(0x12);
			expect(result[31]).toBe(0xf0);
		});

		it("should handle zero", () => {
			const result = Bytes32.fromBigint(0n);
			expect(Array.from(result).every((b) => b === 0)).toBe(true);
		});
	});

	describe("from", () => {
		it("should create from hex string", () => {
			const hex = "0x" + "aa".repeat(32);
			const result = Bytes32.from(hex);
			expect(result.length).toBe(32);
			expect(result[0]).toBe(0xaa);
		});

		it("should create from bytes", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 123;
			const result = Bytes32.from(bytes);
			expect(result[0]).toBe(123);
		});

		it("should create from number", () => {
			const result = Bytes32.from(42);
			expect(result[31]).toBe(42);
		});

		it("should create from bigint", () => {
			const result = Bytes32.from(42n);
			expect(result[31]).toBe(42);
		});
	});

	describe("toHex", () => {
		it("should convert to hex with 0x prefix", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0x12;
			bytes[1] = 0xab;
			bytes[31] = 0xff;
			const hex = Bytes32.toHex(
				Bytes32.fromBytes(bytes) as Bytes32.BrandedBytes32,
			);
			expect(hex).toMatch(/^0x[0-9a-f]{64}$/);
			expect(hex.slice(0, 6)).toBe("0x12ab");
			expect(hex.slice(-2)).toBe("ff");
		});

		it("should pad single digit hex values", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0x01;
			bytes[1] = 0x0f;
			const hex = Bytes32.toHex(
				Bytes32.fromBytes(bytes) as Bytes32.BrandedBytes32,
			);
			expect(hex.slice(2, 6)).toBe("010f");
		});
	});

	describe("toUint8Array", () => {
		it("should convert to Uint8Array", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 42;
			const b32 = Bytes32.fromBytes(bytes);
			const result = Bytes32.toUint8Array(b32);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
			expect(result[0]).toBe(42);
		});

		it("should create a copy", () => {
			const b32 = Bytes32.fromBytes(new Uint8Array(32));
			const arr = Bytes32.toUint8Array(b32);
			arr[0] = 99;
			expect(b32[0]).toBe(0);
		});
	});

	describe("toBigint", () => {
		it("should convert to bigint (big-endian)", () => {
			const bytes = new Uint8Array(32);
			bytes[31] = 42;
			const result = Bytes32.toBigint(Bytes32.fromBytes(bytes));
			expect(result).toBe(42n);
		});

		it("should handle large values", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0xff;
			bytes[31] = 0xff;
			const result = Bytes32.toBigint(Bytes32.fromBytes(bytes));
			expect(result).toBeGreaterThan(0n);
		});

		it("should handle zero", () => {
			const result = Bytes32.toBigint(Bytes32.zero());
			expect(result).toBe(0n);
		});

		it("should roundtrip with fromBigint", () => {
			const original = 123456789012345678901234567890n;
			const bytes = Bytes32.fromBigint(original);
			const result = Bytes32.toBigint(bytes);
			expect(result).toBe(original);
		});
	});

	describe("toHash", () => {
		it("should convert to Hash", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 1;
			bytes[31] = 255;
			const b32 = Bytes32.fromBytes(bytes);
			const hash = Bytes32.toHash(b32);
			expect(hash.length).toBe(32);
			expect(hash[0]).toBe(1);
			expect(hash[31]).toBe(255);
		});

		it("should create a copy", () => {
			const b32 = Bytes32.fromBytes(new Uint8Array(32));
			const hash = Bytes32.toHash(b32);
			(hash as Uint8Array)[0] = 99;
			expect(b32[0]).toBe(0);
		});
	});

	describe("toAddress", () => {
		it("should extract last 20 bytes as Address", () => {
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				bytes[i] = i;
			}
			const b32 = Bytes32.fromBytes(bytes);
			const addr = Bytes32.toAddress(b32);
			expect(addr.length).toBe(20);
			expect(addr[0]).toBe(12);
			expect(addr[19]).toBe(31);
		});

		it("should work with storage slot format", () => {
			const slot = new Uint8Array(32);
			for (let i = 12; i < 32; i++) {
				slot[i] = 0xff;
			}
			const addr = Bytes32.toAddress(Bytes32.fromBytes(slot));
			expect(addr.length).toBe(20);
			expect(Array.from(addr).every((b) => b === 0xff)).toBe(true);
		});
	});

	describe("equals", () => {
		it("should return true for equal values", () => {
			const a = Bytes32.fromBytes(new Uint8Array(32));
			const b = Bytes32.fromBytes(new Uint8Array(32));
			expect(Bytes32.equals(a, b)).toBe(true);
		});

		it("should return false for different values", () => {
			const a = new Uint8Array(32);
			a[0] = 1;
			const b = new Uint8Array(32);
			b[0] = 2;
			expect(
				Bytes32.equals(
					Bytes32.fromBytes(a) as Bytes32.BrandedBytes32,
					Bytes32.fromBytes(b) as Bytes32.BrandedBytes32,
				),
			).toBe(false);
		});

		it("should return true for same instance", () => {
			const a = Bytes32.fromBytes(new Uint8Array(32));
			expect(Bytes32.equals(a, a)).toBe(true);
		});
	});

	describe("compare", () => {
		it("should return 0 for equal values", () => {
			const a = Bytes32.fromBytes(new Uint8Array(32));
			const b = Bytes32.fromBytes(new Uint8Array(32));
			expect(Bytes32.compare(a, b)).toBe(0);
		});

		it("should return -1 when first is less", () => {
			const a = new Uint8Array(32);
			a[0] = 1;
			const b = new Uint8Array(32);
			b[0] = 2;
			expect(
				Bytes32.compare(
					Bytes32.fromBytes(a) as Bytes32.BrandedBytes32,
					Bytes32.fromBytes(b) as Bytes32.BrandedBytes32,
				),
			).toBe(-1);
		});

		it("should return 1 when first is greater", () => {
			const a = new Uint8Array(32);
			a[0] = 2;
			const b = new Uint8Array(32);
			b[0] = 1;
			expect(
				Bytes32.compare(
					Bytes32.fromBytes(a) as Bytes32.BrandedBytes32,
					Bytes32.fromBytes(b) as Bytes32.BrandedBytes32,
				),
			).toBe(1);
		});

		it("should compare byte by byte", () => {
			const a = new Uint8Array(32);
			a[31] = 1;
			const b = new Uint8Array(32);
			b[31] = 2;
			expect(
				Bytes32.compare(
					Bytes32.fromBytes(a) as Bytes32.BrandedBytes32,
					Bytes32.fromBytes(b) as Bytes32.BrandedBytes32,
				),
			).toBe(-1);
		});
	});

	describe("clone", () => {
		it("should create independent copy", () => {
			const original = new Uint8Array(32);
			original[0] = 42;
			const b32 = Bytes32.fromBytes(original);
			const cloned = Bytes32.clone(b32);
			expect(cloned[0]).toBe(42);
			original[0] = 99;
			expect(cloned[0]).toBe(42);
		});

		it("should preserve all bytes", () => {
			const original = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				original[i] = i % 256;
			}
			const cloned = Bytes32.clone(Bytes32.fromBytes(original));
			for (let i = 0; i < 32; i++) {
				expect(cloned[i]).toBe(i % 256);
			}
		});
	});

	describe("size", () => {
		it("should always return 32", () => {
			const b32 = Bytes32.fromBytes(new Uint8Array(32));
			expect(Bytes32.size(b32)).toBe(32);
		});
	});

	describe("zero", () => {
		it("should create zero-filled Bytes32", () => {
			const z = Bytes32.zero();
			expect(z.length).toBe(32);
			expect(Array.from(z).every((b) => b === 0)).toBe(true);
		});

		it("should create new instance each time", () => {
			const z1 = Bytes32.zero();
			const z2 = Bytes32.zero();
			expect(z1).not.toBe(z2);
		});
	});

	describe("isZero", () => {
		it("should return true for all zeros", () => {
			const z = Bytes32.zero();
			expect(Bytes32.isZero(z)).toBe(true);
		});

		it("should return false for non-zero values", () => {
			const bytes = new Uint8Array(32);
			bytes[31] = 1;
			expect(Bytes32.isZero(Bytes32.fromBytes(bytes))).toBe(false);
		});

		it("should return false if any byte is non-zero", () => {
			const bytes = new Uint8Array(32);
			bytes[16] = 1;
			expect(Bytes32.isZero(Bytes32.fromBytes(bytes))).toBe(false);
		});
	});

	describe("Ethereum use cases", () => {
		it("should handle storage slot", () => {
			const slot = Bytes32.fromNumber(0);
			expect(Bytes32.isZero(slot)).toBe(true);
		});

		it("should handle keccak256 result size", () => {
			const hashLike = new Uint8Array(32);
			const b32 = Bytes32.fromBytes(hashLike);
			const hash = Bytes32.toHash(b32);
			expect(hash.length).toBe(32);
		});

		it("should handle merkle tree node", () => {
			const node1 = Bytes32.fromHex("0x" + "aa".repeat(32));
			const node2 = Bytes32.fromHex("0x" + "bb".repeat(32));
			expect(Bytes32.equals(node1, node2)).toBe(false);
		});
	});
});
