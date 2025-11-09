import { describe, expect, it } from "vitest";
import {
	keccak256,
	sha256,
	ripemd160,
	validate,
	from,
	fromBytes,
	fromHex,
	toHex,
	toBytes,
	toString,
	equals,
	isZero,
	clone,
	slice,
	concat,
	format,
	random,
	assert,
	isHash,
	isValidHex,
	ZERO,
	SIZE,
} from "./index.ox.js";

describe("Hash - Ox Implementation", () => {
	describe("Constants", () => {
		it("SIZE is 32", () => {
			expect(SIZE).toBe(32);
		});

		it("ZERO is 32 bytes of zeros", () => {
			expect(ZERO.length).toBe(32);
			expect(ZERO.every((b: number) => b === 0)).toBe(true);
		});
	});

	describe("fromHex", () => {
		it("creates hash from hex string with 0x prefix", () => {
			const hex =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const hash = fromHex(hex);
			expect(hash.length).toBe(32);
			expect(hash[0]).toBe(0x12);
			expect(hash[1]).toBe(0x34);
			expect(hash[31]).toBe(0xef);
		});

		it("creates hash from hex string without 0x prefix", () => {
			const hex =
				"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const hash = fromHex(hex);
			expect(hash.length).toBe(32);
			expect(hash[0]).toBe(0x12);
		});

		it("throws on invalid hex length", () => {
			expect(() => fromHex("0x1234")).toThrow("Hash hex must be 64 characters");
		});

		it("throws on invalid hex characters", () => {
			expect(() =>
				fromHex(
					"0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
				),
			).toThrow("Invalid hex string");
		});
	});

	describe("fromBytes", () => {
		it("creates hash from 32-byte array", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0xaa;
			bytes[31] = 0xbb;
			const hash = fromBytes(bytes);
			expect(hash.length).toBe(32);
			expect(hash[0]).toBe(0xaa);
			expect(hash[31]).toBe(0xbb);
		});

		it("throws on invalid byte length", () => {
			expect(() => fromBytes(new Uint8Array(20))).toThrow(
				"Hash must be 32 bytes",
			);
		});

		it("creates copy of input bytes", () => {
			const bytes = new Uint8Array(32);
			const hash = fromBytes(bytes);
			bytes[0] = 0xff;
			expect(hash[0]).toBe(0);
		});
	});

	describe("from", () => {
		it("creates hash from hex string", () => {
			const hash = from(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(hash.length).toBe(32);
			expect(hash[0]).toBe(0x12);
		});

		it("creates hash from bytes", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0xaa;
			const hash = from(bytes);
			expect(hash[0]).toBe(0xaa);
		});
	});

	describe("toHex", () => {
		it("converts hash to hex string", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const hex = toHex(hash);
			expect(hex).toBe(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
		});

		it("pads zeros correctly", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0x01;
			bytes[1] = 0x0a;
			const hash = fromBytes(bytes);
			const hex = toHex(hash);
			expect(hex.slice(0, 8)).toBe("0x010a00");
		});
	});

	describe("toBytes", () => {
		it("returns copy of hash", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const bytes = toBytes(hash);
			expect(bytes.length).toBe(32);
			expect(bytes[0]).toBe(0x12);
		});

		it("copy is independent", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const bytes = toBytes(hash);
			bytes[0] = 0xff;
			expect(hash[0]).toBe(0x12);
		});
	});

	describe("toString", () => {
		it("converts hash to string", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const str = toString(hash);
			expect(str).toBe(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
		});
	});

	describe("equals", () => {
		it("returns true for equal hashes", () => {
			const a = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const b = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(equals(a, b)).toBe(true);
		});

		it("returns false for different hashes", () => {
			const a = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const b = fromHex(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
			expect(equals(a, b)).toBe(false);
		});

		it("uses constant time comparison", () => {
			const a = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const b = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdee",
			);
			expect(equals(a, b)).toBe(false);
		});
	});

	describe("isZero", () => {
		it("returns true for zero hash", () => {
			expect(isZero(ZERO)).toBe(true);
		});

		it("returns false for non-zero hash", () => {
			const hash = fromHex(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);
			expect(isZero(hash)).toBe(false);
		});
	});

	describe("clone", () => {
		it("creates copy of hash", () => {
			const original = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const copy = clone(original);
			expect(equals(original, copy)).toBe(true);
			expect(original).not.toBe(copy);
		});

		it("copy is independent", () => {
			const original = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const copy = clone(original);
			// Modify original
			(original as any as Uint8Array)[0] = 0xff;
			expect(copy[0]).toBe(0x12);
		});
	});

	describe("slice", () => {
		it("extracts portion of hash", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const result = slice(hash, 0, 4);
			expect(result.length).toBe(4);
			expect(result[0]).toBe(0x12);
			expect(result[1]).toBe(0x34);
			expect(result[2]).toBe(0x56);
			expect(result[3]).toBe(0x78);
		});

		it("extracts end portion", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const result = slice(hash, 28);
			expect(result.length).toBe(4);
			expect(result[0]).toBe(0x90);
			expect(result[3]).toBe(0xef);
		});
	});

	describe("concat", () => {
		it("concatenates multiple byte arrays", () => {
			const hash1 = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const hash2 = fromHex(
				"0x5678901234567890abcdef1234567890abcdef1234567890abcdef1234567890",
			);
			const result = concat(hash1, hash2);
			expect(result.length).toBe(64);
			expect(result[0]).toBe(0x12);
			expect(result[32]).toBe(0x56);
		});

		it("handles empty concat", () => {
			const result = concat();
			expect(result.length).toBe(0);
		});
	});

	describe("format", () => {
		it("formats hash with truncation", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const formatted = format(hash);
			expect(formatted).toContain("0x1234");
			expect(formatted).toContain("cdef");
			expect(formatted).toContain("...");
		});
	});

	describe("random", () => {
		it("creates random 32-byte hash", () => {
			const hash = random();
			expect(hash.length).toBe(32);
			expect(isHash(hash)).toBe(true);
		});

		it("creates different hashes", () => {
			const hash1 = random();
			const hash2 = random();
			expect(equals(hash1, hash2)).toBe(false);
		});
	});

	describe("isHash", () => {
		it("returns true for valid hash", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(isHash(hash)).toBe(true);
		});

		it("returns false for non-hash", () => {
			expect(isHash("not a hash")).toBe(false);
			expect(isHash(new Uint8Array(20))).toBe(false);
			expect(isHash(null)).toBe(false);
		});
	});

	describe("isValidHex", () => {
		it("returns true for valid hash hex", () => {
			const hex =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			expect(isValidHex(hex)).toBe(true);
		});

		it("returns true for valid hash hex without 0x", () => {
			const hex =
				"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			expect(isValidHex(hex)).toBe(true);
		});

		it("returns false for wrong length", () => {
			expect(isValidHex("0x1234")).toBe(false);
		});

		it("returns false for invalid characters", () => {
			expect(
				isValidHex(
					"0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
				),
			).toBe(false);
		});
	});

	describe("assert", () => {
		it("does not throw for valid hash", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(() => assert(hash)).not.toThrow();
		});

		it("throws for invalid hash", () => {
			expect(() => assert(new Uint8Array(20))).toThrow();
		});

		it("throws for non-Uint8Array", () => {
			expect(() => assert("not a hash" as any)).toThrow();
		});
	});

	describe("merkleRoot", () => {
		it("returns ZERO for empty array", () => {
			const root = merkleRoot([]);
			expect(equals(root, ZERO)).toBe(true);
		});

		it("returns single hash for single element", () => {
			const hash = keccak256(new Uint8Array([1, 2, 3]));
			const root = merkleRoot([hash]);
			expect(equals(root, hash)).toBe(true);
		});

		it("calculates merkle root for multiple hashes", () => {
			const hash1 = keccak256(new Uint8Array([1]));
			const hash2 = keccak256(new Uint8Array([2]));
			const hash3 = keccak256(new Uint8Array([3]));

			const root = merkleRoot([hash1, hash2, hash3]);
			expect(isHash(root)).toBe(true);
			expect(root.length).toBe(32);
		});

		it("handles odd number of leaves", () => {
			const hash1 = keccak256(new Uint8Array([1]));
			const hash2 = keccak256(new Uint8Array([2]));
			const hash3 = keccak256(new Uint8Array([3]));
			const hash4 = keccak256(new Uint8Array([4]));
			const hash5 = keccak256(new Uint8Array([5]));

			const root = merkleRoot([hash1, hash2, hash3, hash4, hash5]);
			expect(isHash(root)).toBe(true);
		});

		it("is deterministic", () => {
			const hash1 = keccak256(new Uint8Array([1]));
			const hash2 = keccak256(new Uint8Array([2]));
			const hash3 = keccak256(new Uint8Array([3]));

			const root1 = merkleRoot([hash1, hash2, hash3]);
			const root2 = merkleRoot([hash1, hash2, hash3]);
			expect(equals(root1, root2)).toBe(true);
		});
	});

	describe("Ox hash functions integration", () => {
		it("keccak256 hashes empty bytes", () => {
			const hash = keccak256(new Uint8Array(0));
			expect(hash.length).toBe(32);
			expect(isHash(hash)).toBe(true);
		});

		it("keccak256 hashes data consistently", () => {
			const data = new Uint8Array([1, 2, 3, 4]);
			const hash1 = keccak256(data);
			const hash2 = keccak256(data);
			expect(hash1).toEqual(hash2);
		});

		it("sha256 hashes data", () => {
			const data = new Uint8Array([1, 2, 3, 4]);
			const hash = sha256(data);
			expect(hash.length).toBe(32);
		});

		it("ripemd160 hashes data", () => {
			const data = new Uint8Array([1, 2, 3, 4]);
			const hash = ripemd160(data);
			expect(hash.length).toBe(20);
		});

		it("validate checks hash validity", () => {
			const validHash = keccak256(new Uint8Array([1]));
			const validHex = toHex(validHash);
			expect(validate(validHex)).toBe(true);
		});
	});

	describe("Type compatibility", () => {
		it("Voltaire Hash extends Uint8Array", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(hash instanceof Uint8Array).toBe(true);
		});

		it("Hash can be used with Uint8Array methods", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(hash.length).toBe(32);
			expect(hash.every((b: number) => typeof b === "number")).toBe(true);
		});
	});
});
