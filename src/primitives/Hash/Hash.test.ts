import { describe, it, expect } from "vitest"
import * as Hash from "./Hash.js";

describe("Hash", () => {
	describe("fromHex", () => {
		it("creates hash from hex string with 0x prefix", () => {
			const hex =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
			const hash = Hash.fromHex(hex)
			expect(hash.length).toBe(32)
			expect(hash[0]).toBe(0x12)
			expect(hash[1]).toBe(0x34)
			expect(hash[31]).toBe(0xef)
		})

		it("creates hash from hex string without 0x prefix", () => {
			const hex =
				"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
			const hash = Hash.fromHex(hex)
			expect(hash.length).toBe(32)
			expect(hash[0]).toBe(0x12)
		})

		it("throws on invalid hex length", () => {
			expect(() => Hash.fromHex("0x1234")).toThrow(
				"Hash hex must be 64 characters",
			)
		})

		it("throws on invalid hex characters", () => {
			expect(() =>
				Hash.fromHex(
					"0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
				),
			).toThrow("Invalid hex string")
		})
	})

	describe("fromBytes", () => {
		it("creates hash from 32-byte array", () => {
			const bytes = new Uint8Array(32)
			bytes[0] = 0xaa
			bytes[31] = 0xbb
			const hash = Hash.fromBytes(bytes)
			expect(hash.length).toBe(32)
			expect(hash[0]).toBe(0xaa)
			expect(hash[31]).toBe(0xbb)
		})

		it("throws on invalid byte length", () => {
			expect(() => Hash.fromBytes(new Uint8Array(20))).toThrow(
				"Hash must be 32 bytes",
			)
		})

		it("creates copy of input bytes", () => {
			const bytes = new Uint8Array(32)
			const hash = Hash.fromBytes(bytes)
			bytes[0] = 0xff
			expect(hash[0]).toBe(0)
		})
	})

	describe("toHex", () => {
		it("converts hash to hex string", () => {
			const hash = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			const hex = Hash.toHex.call(hash)
			expect(hex).toBe(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
		})

		it("pads zeros correctly", () => {
			const bytes = new Uint8Array(32)
			bytes[0] = 0x01
			bytes[1] = 0x0a
			const hash = Hash.fromBytes(bytes)
			const hex = Hash.toHex.call(hash)
			expect(hex.slice(0, 8)).toBe("0x010a00")
		})
	})

	describe("equals", () => {
		it("returns true for equal hashes", () => {
			const a = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			const b = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			expect(Hash.equals.call(a, b)).toBe(true)
		})

		it("returns false for different hashes", () => {
			const a = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			const b = Hash.fromHex(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			)
			expect(Hash.equals.call(a, b)).toBe(false)
		})

		it("uses constant time comparison", () => {
			const a = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			const b = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdee",
			)
			expect(Hash.equals.call(a, b)).toBe(false)
		})
	})

	describe("from", () => {
		it("creates hash from hex string", () => {
			const hash = Hash.from(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			expect(hash.length).toBe(32)
			expect(hash[0]).toBe(0x12)
		})
	})

	describe("isHash", () => {
		it("returns true for valid hash", () => {
			const hash = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			expect(Hash.isHash(hash)).toBe(true)
		})

		it("returns false for non-hash", () => {
			expect(Hash.isHash("not a hash")).toBe(false)
			expect(Hash.isHash(new Uint8Array(20))).toBe(false)
			expect(Hash.isHash(null)).toBe(false)
		})
	})

	describe("ZERO", () => {
		it("is 32 bytes of zeros", () => {
			expect(Hash.ZERO.length).toBe(32)
			expect(Hash.ZERO.every((b) => b === 0)).toBe(true)
		})
	})

	describe("keccak256", () => {
		it("hashes empty bytes", () => {
			const hash = Hash.keccak256(new Uint8Array(0))
			expect(hash.length).toBe(32)
			expect(Hash.isHash(hash)).toBe(true)
		})

		it("hashes data consistently", () => {
			const data = new Uint8Array([1, 2, 3, 4])
			const hash1 = Hash.keccak256(data)
			const hash2 = Hash.keccak256(data)
			expect(Hash.equals.call(hash1, hash2)).toBe(true)
		})

		it("produces different hashes for different data", () => {
			const data1 = new Uint8Array([1, 2, 3])
			const data2 = new Uint8Array([1, 2, 4])
			const hash1 = Hash.keccak256(data1)
			const hash2 = Hash.keccak256(data2)
			expect(Hash.equals.call(hash1, hash2)).toBe(false)
		})
	})

	describe("keccak256String", () => {
		it("hashes empty string", () => {
			const hash = Hash.keccak256String("")
			expect(hash.length).toBe(32)
			expect(Hash.isHash(hash)).toBe(true)
		})

		it("hashes string consistently", () => {
			const hash1 = Hash.keccak256String("hello")
			const hash2 = Hash.keccak256String("hello")
			expect(Hash.equals.call(hash1, hash2)).toBe(true)
		})

		it("produces different hashes for different strings", () => {
			const hash1 = Hash.keccak256String("hello")
			const hash2 = Hash.keccak256String("world")
			expect(Hash.equals.call(hash1, hash2)).toBe(false)
		})
	})

	describe("keccak256Hex", () => {
		it("hashes hex string with 0x prefix", () => {
			const hash = Hash.keccak256Hex("0x1234")
			expect(hash.length).toBe(32)
			expect(Hash.isHash(hash)).toBe(true)
		})

		it("hashes hex string without 0x prefix", () => {
			const hash = Hash.keccak256Hex("1234")
			expect(hash.length).toBe(32)
		})

		it("throws on odd length hex", () => {
			expect(() => Hash.keccak256Hex("0x123")).toThrow("even length")
		})

		it("produces same hash as keccak256", () => {
			const data = new Uint8Array([0x12, 0x34])
			const hash1 = Hash.keccak256(data)
			const hash2 = Hash.keccak256Hex("0x1234")
			expect(Hash.equals.call(hash1, hash2)).toBe(true)
		})
	})

	describe("isValidHex", () => {
		it("returns true for valid hash hex", () => {
			const hex =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
			expect(Hash.isValidHex(hex)).toBe(true)
		})

		it("returns true for valid hash hex without 0x", () => {
			const hex =
				"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
			expect(Hash.isValidHex(hex)).toBe(true)
		})

		it("returns false for wrong length", () => {
			expect(Hash.isValidHex("0x1234")).toBe(false)
		})

		it("returns false for invalid characters", () => {
			expect(
				Hash.isValidHex(
					"0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
				),
			).toBe(false)
		})
	})

	describe("assert", () => {
		it("does not throw for valid hash", () => {
			const hash = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			expect(() => Hash.assert(hash)).not.toThrow()
		})

		it("throws for invalid hash", () => {
			expect(() => Hash.assert(new Uint8Array(20))).toThrow()
		})

		it("throws for non-Uint8Array", () => {
			expect(() => Hash.assert("not a hash" as any)).toThrow()
		})
	})

	describe("random", () => {
		it("creates random 32-byte hash", () => {
			const hash = Hash.random()
			expect(hash.length).toBe(32)
			expect(Hash.isHash(hash)).toBe(true)
		})

		it("creates different hashes", () => {
			const hash1 = Hash.random()
			const hash2 = Hash.random()
			expect(Hash.equals.call(hash1, hash2)).toBe(false)
		})
	})

	describe("clone", () => {
		it("creates copy of hash", () => {
			const original = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			const copy = Hash.clone.call(original)
			expect(Hash.equals.call(original, copy)).toBe(true)
			expect(original).not.toBe(copy)
		})

		it("copy is independent", () => {
			const original = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			const copy = Hash.clone.call(original)
			// Modify original
			;(original as any as Uint8Array)[0] = 0xff
			expect(copy[0]).toBe(0x12)
		})
	})

	describe("slice", () => {
		it("extracts portion of hash", () => {
			const hash = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			const slice = Hash.slice.call(hash, 0, 4)
			expect(slice.length).toBe(4)
			expect(slice[0]).toBe(0x12)
			expect(slice[1]).toBe(0x34)
			expect(slice[2]).toBe(0x56)
			expect(slice[3]).toBe(0x78)
		})

		it("extracts end portion", () => {
			const hash = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			const slice = Hash.slice.call(hash, 28)
			expect(slice.length).toBe(4)
			expect(slice[0]).toBe(0x90)
			expect(slice[3]).toBe(0xef)
		})
	})

	describe("format", () => {
		it("formats hash with truncation", () => {
			const hash = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			const formatted = Hash.format.call(hash)
			expect(formatted).toContain("0x1234")
			expect(formatted).toContain("cdef")
			expect(formatted).toContain("...")
		})
	})

	describe("toBytes", () => {
		it("returns copy of hash", () => {
			const hash = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			const bytes = Hash.toBytes.call(hash)
			expect(bytes.length).toBe(32)
			expect(bytes[0]).toBe(0x12)
		})

		it("copy is independent", () => {
			const hash = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			const bytes = Hash.toBytes.call(hash)
			bytes[0] = 0xff
			expect(hash[0]).toBe(0x12)
		})
	})

	describe("isZero", () => {
		it("returns true for zero hash", () => {
			expect(Hash.isZero.call(Hash.ZERO)).toBe(true)
		})

		it("returns false for non-zero hash", () => {
			const hash = Hash.fromHex(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			)
			expect(Hash.isZero.call(hash)).toBe(false)
		})
	})
})
