import { describe, it, expect } from "vitest"
import * as Hash from "./hash"

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
			const hex = Hash.toHex(hash)
			expect(hex).toBe(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
		})

		it("pads zeros correctly", () => {
			const bytes = new Uint8Array(32)
			bytes[0] = 0x01
			bytes[1] = 0x0a
			const hash = Hash.fromBytes(bytes)
			const hex = Hash.toHex(hash)
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
			expect(Hash.equals(a, b)).toBe(true)
		})

		it("returns false for different hashes", () => {
			const a = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			const b = Hash.fromHex(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			)
			expect(Hash.equals(a, b)).toBe(false)
		})

		it("uses constant time comparison", () => {
			const a = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			)
			const b = Hash.fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdee",
			)
			expect(Hash.equals(a, b)).toBe(false)
		})
	})

	describe("Hash factory", () => {
		it("creates hash from hex string", () => {
			const hash = Hash.Hash(
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

	describe("ZERO_HASH", () => {
		it("is 32 bytes of zeros", () => {
			expect(Hash.ZERO_HASH.length).toBe(32)
			expect(Hash.ZERO_HASH.every((b) => b === 0)).toBe(true)
		})
	})

	describe("keccak256", () => {
		it("throws NotImplementedError", () => {
			expect(() => Hash.keccak256(new Uint8Array(0))).toThrow(
				Hash.NotImplementedError,
			)
			expect(() => Hash.keccak256(new Uint8Array(0))).toThrow(
				"keccak256 not yet implemented",
			)
		})
	})
})
