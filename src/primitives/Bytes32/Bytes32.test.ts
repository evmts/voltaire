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
			expect(() => Bytes32.fromBytes(new Uint8Array(31))).toThrow();
			expect(() => Bytes32.fromBytes(new Uint8Array(33))).toThrow();
		});

		it("should clone the input (independent copy)", () => {
			const input = new Uint8Array(32);
			input[0] = 42;
			const result = Bytes32.fromBytes(input);
			input[0] = 99;
			expect(result[0]).toBe(42);
		});
	});

	describe("fromHex", () => {
		it("should create Bytes32 from hex with 0x prefix", () => {
			const hex = `0x${"ab".repeat(32)}`;
			const result = Bytes32.fromHex(hex);
			expect(result.length).toBe(32);
			expect(result[0]).toBe(0xab);
			expect(result[31]).toBe(0xab);
		});

		it("should create Bytes32 from hex without prefix", () => {
			const hex = "cd".repeat(32);
			const result = Bytes32.fromHex(hex);
			expect(result.length).toBe(32);
			expect(result[0]).toBe(0xcd);
		});

		it("should throw on wrong length", () => {
			expect(() => Bytes32.fromHex("0xaabb")).toThrow();
			expect(() => Bytes32.fromHex(`0x${"12".repeat(33)}`)).toThrow();
		});

		it("should throw on invalid hex characters", () => {
			expect(() => Bytes32.fromHex(`0x${"zz".repeat(32)}`)).toThrow();
		});

		it("should handle mixed case hex", () => {
			const hex = `0x${"AbCdEf0123456789".repeat(4)}`;
			const result = Bytes32.fromHex(hex);
			expect(result[0]).toBe(0xab);
			expect(result[1]).toBe(0xcd);
		});
	});

	describe("fromNumber", () => {
		it("should create Bytes32 from zero", () => {
			const result = Bytes32.fromNumber(0);
			expect(Bytes32.isZero(result)).toBe(true);
		});

		it("should create Bytes32 from small number (big-endian)", () => {
			const result = Bytes32.fromNumber(42);
			expect(result[31]).toBe(42);
			expect(result[30]).toBe(0);
		});

		it("should create Bytes32 from larger number", () => {
			const result = Bytes32.fromNumber(0x1234);
			expect(result[30]).toBe(0x12);
			expect(result[31]).toBe(0x34);
		});

		it("should handle MAX_SAFE_INTEGER", () => {
			const result = Bytes32.fromNumber(Number.MAX_SAFE_INTEGER);
			expect(result.length).toBe(32);
		});
	});

	describe("fromBigint", () => {
		it("should create Bytes32 from zero", () => {
			const result = Bytes32.fromBigint(0n);
			expect(Bytes32.isZero(result)).toBe(true);
		});

		it("should create Bytes32 from small bigint", () => {
			const result = Bytes32.fromBigint(42n);
			expect(result[31]).toBe(42);
		});

		it("should create Bytes32 from max u256", () => {
			const max = (1n << 256n) - 1n;
			const result = Bytes32.fromBigint(max);
			expect(result[0]).toBe(0xff);
			expect(result[31]).toBe(0xff);
		});

		it("should throw on negative value", () => {
			expect(() => Bytes32.fromBigint(-1n)).toThrow();
		});

		it("should throw on overflow", () => {
			expect(() => Bytes32.fromBigint(1n << 256n)).toThrow();
		});
	});

	describe("from (universal constructor)", () => {
		it("should create from hex string", () => {
			const result = Bytes32.from(`0x${"aa".repeat(32)}`);
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
			const hex = Bytes32.toHex(Bytes32.fromBytes(bytes));
			expect(hex).toMatch(/^0x[0-9a-f]{64}$/);
			expect(hex.slice(0, 6)).toBe("0x12ab");
			expect(hex.slice(-2)).toBe("ff");
		});

		it("should pad single digit hex values", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0x01;
			bytes[1] = 0x0f;
			const hex = Bytes32.toHex(Bytes32.fromBytes(bytes));
			expect(hex.slice(2, 6)).toBe("010f");
		});
	});

	describe("toBigint", () => {
		it("should convert zero to 0n", () => {
			const result = Bytes32.toBigint(Bytes32.zero());
			expect(result).toBe(0n);
		});

		it("should convert small value", () => {
			const bytes = new Uint8Array(32);
			bytes[31] = 42;
			const result = Bytes32.toBigint(Bytes32.fromBytes(bytes));
			expect(result).toBe(42n);
		});

		it("should roundtrip with fromBigint", () => {
			const original = 123456789012345678901234567890n;
			const bytes = Bytes32.fromBigint(original);
			const result = Bytes32.toBigint(bytes);
			expect(result).toBe(original);
		});

		it("should handle max u256", () => {
			const max = (1n << 256n) - 1n;
			const bytes = Bytes32.fromBigint(max);
			expect(Bytes32.toBigint(bytes)).toBe(max);
		});
	});

	describe("toNumber", () => {
		it("should convert zero to 0", () => {
			const result = Bytes32.toNumber(Bytes32.zero());
			expect(result).toBe(0);
		});

		it("should convert small value", () => {
			const result = Bytes32.toNumber(Bytes32.fromNumber(42));
			expect(result).toBe(42);
		});

		it("should throw on overflow", () => {
			const large = Bytes32.fromBigint(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
			expect(() => Bytes32.toNumber(large)).toThrow();
		});

		it("should handle MAX_SAFE_INTEGER", () => {
			const bytes = Bytes32.fromNumber(Number.MAX_SAFE_INTEGER);
			const result = Bytes32.toNumber(bytes);
			expect(result).toBe(Number.MAX_SAFE_INTEGER);
		});
	});

	describe("equals", () => {
		it("should return true for equal values", () => {
			const a = Bytes32.fromBytes(new Uint8Array(32));
			const b = Bytes32.fromBytes(new Uint8Array(32));
			expect(Bytes32.equals(a, b)).toBe(true);
		});

		it("should return false for different values", () => {
			const a = Bytes32.fromNumber(1);
			const b = Bytes32.fromNumber(2);
			expect(Bytes32.equals(a, b)).toBe(false);
		});

		it("should return true for same instance", () => {
			const a = Bytes32.zero();
			expect(Bytes32.equals(a, a)).toBe(true);
		});
	});

	describe("compare", () => {
		it("should return 0 for equal values", () => {
			const a = Bytes32.zero();
			const b = Bytes32.zero();
			expect(Bytes32.compare(a, b)).toBe(0);
		});

		it("should return -1 when a < b", () => {
			const a = Bytes32.fromHex(`0x01${"00".repeat(31)}`);
			const b = Bytes32.fromHex(`0x02${"00".repeat(31)}`);
			expect(Bytes32.compare(a, b)).toBe(-1);
		});

		it("should return 1 when a > b", () => {
			const a = Bytes32.fromHex(`0x03${"00".repeat(31)}`);
			const b = Bytes32.fromHex(`0x02${"00".repeat(31)}`);
			expect(Bytes32.compare(a, b)).toBe(1);
		});

		it("should compare byte by byte", () => {
			const a = Bytes32.fromNumber(1);
			const b = Bytes32.fromNumber(2);
			expect(Bytes32.compare(a, b)).toBe(-1);
		});
	});

	describe("isZero", () => {
		it("should return true for all zeros", () => {
			expect(Bytes32.isZero(Bytes32.zero())).toBe(true);
		});

		it("should return false for non-zero values", () => {
			const bytes = Bytes32.fromNumber(1);
			expect(Bytes32.isZero(bytes)).toBe(false);
		});

		it("should detect single non-zero byte", () => {
			const bytes = new Uint8Array(32);
			bytes[16] = 1;
			expect(Bytes32.isZero(Bytes32.fromBytes(bytes))).toBe(false);
		});
	});

	describe("clone", () => {
		it("should create independent copy", () => {
			const original = Bytes32.fromNumber(42);
			const cloned = Bytes32.clone(original);
			expect(Bytes32.equals(original, cloned)).toBe(true);
			(cloned as Uint8Array)[31] = 99;
			expect(original[31]).toBe(42);
		});

		it("should preserve all bytes", () => {
			const original = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				original[i] = i;
			}
			const cloned = Bytes32.clone(Bytes32.fromBytes(original));
			for (let i = 0; i < 32; i++) {
				expect(cloned[i]).toBe(i);
			}
		});
	});

	describe("zero", () => {
		it("should create zero-filled Bytes32", () => {
			const z = Bytes32.zero();
			expect(z.length).toBe(32);
			expect(Bytes32.isZero(z)).toBe(true);
		});

		it("should create new instance each time", () => {
			const z1 = Bytes32.zero();
			const z2 = Bytes32.zero();
			expect(z1).not.toBe(z2);
		});
	});

	describe("bitwiseAnd", () => {
		it("should perform AND on all bytes", () => {
			const a = Bytes32.fromHex(`0x${"ff".repeat(32)}`);
			const b = Bytes32.fromHex(`0x${"0f".repeat(32)}`);
			const result = Bytes32.bitwiseAnd(a, b);
			for (let i = 0; i < 32; i++) {
				expect(result[i]).toBe(0x0f);
			}
		});

		it("should return zero when ANDed with zero", () => {
			const a = Bytes32.fromHex(`0x${"ff".repeat(32)}`);
			const b = Bytes32.zero();
			const result = Bytes32.bitwiseAnd(a, b);
			expect(Bytes32.isZero(result)).toBe(true);
		});

		it("should be identity with all 1s", () => {
			const a = Bytes32.fromNumber(42);
			const allOnes = Bytes32.fromHex(`0x${"ff".repeat(32)}`);
			const result = Bytes32.bitwiseAnd(a, allOnes);
			expect(Bytes32.equals(result, a)).toBe(true);
		});
	});

	describe("bitwiseOr", () => {
		it("should perform OR on all bytes", () => {
			const a = Bytes32.fromHex(`0x${"f0".repeat(32)}`);
			const b = Bytes32.fromHex(`0x${"0f".repeat(32)}`);
			const result = Bytes32.bitwiseOr(a, b);
			for (let i = 0; i < 32; i++) {
				expect(result[i]).toBe(0xff);
			}
		});

		it("should be identity with zero", () => {
			const a = Bytes32.fromNumber(42);
			const z = Bytes32.zero();
			const result = Bytes32.bitwiseOr(a, z);
			expect(Bytes32.equals(result, a)).toBe(true);
		});
	});

	describe("bitwiseXor", () => {
		it("should perform XOR on all bytes", () => {
			const a = Bytes32.fromHex(`0x${"ff".repeat(32)}`);
			const b = Bytes32.fromHex(`0x${"0f".repeat(32)}`);
			const result = Bytes32.bitwiseXor(a, b);
			for (let i = 0; i < 32; i++) {
				expect(result[i]).toBe(0xf0);
			}
		});

		it("should return zero when XORed with itself", () => {
			const a = Bytes32.fromNumber(42);
			const result = Bytes32.bitwiseXor(a, a);
			expect(Bytes32.isZero(result)).toBe(true);
		});

		it("should be identity with zero", () => {
			const a = Bytes32.fromNumber(42);
			const z = Bytes32.zero();
			const result = Bytes32.bitwiseXor(a, z);
			expect(Bytes32.equals(result, a)).toBe(true);
		});
	});

	describe("min", () => {
		it("should return smaller value", () => {
			const a = Bytes32.fromNumber(1);
			const b = Bytes32.fromNumber(2);
			const result = Bytes32.min(a, b);
			expect(Bytes32.equals(result, a)).toBe(true);
		});

		it("should handle equal values", () => {
			const a = Bytes32.fromNumber(42);
			const b = Bytes32.fromNumber(42);
			const result = Bytes32.min(a, b);
			expect(Bytes32.equals(result, a)).toBe(true);
		});

		it("should compare lexicographically (first byte)", () => {
			const a = Bytes32.fromHex(`0x01${"00".repeat(31)}`);
			const b = Bytes32.fromHex(`0x02${"00".repeat(31)}`);
			const result = Bytes32.min(a, b);
			expect(Bytes32.equals(result, a)).toBe(true);
		});
	});

	describe("max", () => {
		it("should return larger value", () => {
			const a = Bytes32.fromNumber(1);
			const b = Bytes32.fromNumber(2);
			const result = Bytes32.max(a, b);
			expect(Bytes32.equals(result, b)).toBe(true);
		});

		it("should handle equal values", () => {
			const a = Bytes32.fromNumber(42);
			const b = Bytes32.fromNumber(42);
			const result = Bytes32.max(a, b);
			expect(Bytes32.equals(result, a)).toBe(true);
		});

		it("should compare lexicographically (first byte)", () => {
			const a = Bytes32.fromHex(`0x01${"00".repeat(31)}`);
			const b = Bytes32.fromHex(`0x02${"00".repeat(31)}`);
			const result = Bytes32.max(a, b);
			expect(Bytes32.equals(result, b)).toBe(true);
		});
	});

	describe("Ethereum use cases", () => {
		it("should handle storage slot (slot 0)", () => {
			const slot = Bytes32.fromNumber(0);
			expect(Bytes32.isZero(slot)).toBe(true);
		});

		it("should handle storage slot (slot 5)", () => {
			const slot = Bytes32.fromNumber(5);
			expect(Bytes32.toNumber(slot)).toBe(5);
		});

		it("should handle keccak256 result size", () => {
			const hashLike = new Uint8Array(32);
			const b32 = Bytes32.fromBytes(hashLike);
			expect(b32.length).toBe(32);
		});

		it("should handle merkle tree node comparison", () => {
			const node1 = Bytes32.fromHex(`0x${"aa".repeat(32)}`);
			const node2 = Bytes32.fromHex(`0x${"bb".repeat(32)}`);
			expect(Bytes32.equals(node1, node2)).toBe(false);
			expect(Bytes32.compare(node1, node2)).toBe(-1);
		});

		it("should handle u256 storage value", () => {
			const value =
				0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0n;
			const b32 = Bytes32.fromBigint(value);
			expect(Bytes32.toBigint(b32)).toBe(value);
		});
	});

	describe("namespace export", () => {
		it("should have all methods on Bytes32 namespace", () => {
			expect(Bytes32.Bytes32).toBeDefined();
			expect(Bytes32.Bytes32.from).toBe(Bytes32.from);
			expect(Bytes32.Bytes32.fromBytes).toBe(Bytes32.fromBytes);
			expect(Bytes32.Bytes32.fromHex).toBe(Bytes32.fromHex);
			expect(Bytes32.Bytes32.fromNumber).toBe(Bytes32.fromNumber);
			expect(Bytes32.Bytes32.fromBigint).toBe(Bytes32.fromBigint);
			expect(Bytes32.Bytes32.toHex).toBe(Bytes32.toHex);
			expect(Bytes32.Bytes32.toNumber).toBe(Bytes32.toNumber);
			expect(Bytes32.Bytes32.toBigint).toBe(Bytes32.toBigint);
			expect(Bytes32.Bytes32.equals).toBe(Bytes32.equals);
			expect(Bytes32.Bytes32.compare).toBe(Bytes32.compare);
			expect(Bytes32.Bytes32.isZero).toBe(Bytes32.isZero);
			expect(Bytes32.Bytes32.clone).toBe(Bytes32.clone);
			expect(Bytes32.Bytes32.zero).toBe(Bytes32.zero);
			expect(Bytes32.Bytes32.bitwiseAnd).toBe(Bytes32.bitwiseAnd);
			expect(Bytes32.Bytes32.bitwiseOr).toBe(Bytes32.bitwiseOr);
			expect(Bytes32.Bytes32.bitwiseXor).toBe(Bytes32.bitwiseXor);
			expect(Bytes32.Bytes32.min).toBe(Bytes32.min);
			expect(Bytes32.Bytes32.max).toBe(Bytes32.max);
			expect(Bytes32.Bytes32.SIZE).toBe(32);
		});
	});
});
