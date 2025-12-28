import { describe, expect, it } from "vitest";
import { hash } from "../../crypto/Keccak256/hash.js";
import { assert, Assert } from "./assert.js";
import { InvalidAddressError, InvalidChecksumError } from "./errors.js";

describe("Address.assert", () => {
	const validAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
	const validLowercase = "0x742d35cc6634c0532925a3b844bc454e4438f44e";
	const validUppercase = "0x742D35CC6634C0532925A3B844BC454E4438F44E";

	describe("basic validation", () => {
		it("accepts valid hex address", () => {
			const result = assert(validLowercase);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(20);
		});

		it("accepts valid Uint8Array", () => {
			const bytes = new Uint8Array(20).fill(0x12);
			expect(assert(bytes)).toBe(bytes);
		});

		it("throws on invalid format", () => {
			expect(() => assert("0x123")).toThrow(InvalidAddressError);
			expect(() => assert("not-an-address")).toThrow(InvalidAddressError);
		});

		it("throws on wrong length Uint8Array", () => {
			expect(() => assert(new Uint8Array(10))).toThrow(InvalidAddressError);
		});
	});

	describe("strict checksum validation", () => {
		it("accepts all lowercase in strict mode", () => {
			expect(() => assert(validLowercase, { strict: true })).not.toThrow();
		});

		it("accepts all uppercase in strict mode", () => {
			expect(() => assert(validUppercase, { strict: true })).not.toThrow();
		});

		it("requires keccak256 for mixed case in strict mode", () => {
			expect(() => assert(validAddress, { strict: true })).toThrow(
				/keccak256 required/,
			);
		});

		it("validates correct checksum with keccak256", () => {
			// Generate correct checksum address
			const assertWithKeccak = Assert({ keccak256: hash });
			// This is a valid EIP-55 checksummed address
			const checksummed = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
			expect(() =>
				assertWithKeccak(checksummed, { strict: true }),
			).not.toThrow();
		});

		it("rejects invalid checksum with keccak256", () => {
			const assertWithKeccak = Assert({ keccak256: hash });
			// This has wrong case - not matching EIP-55 checksum
			// The correct checksum has specific case pattern, this has wrong mix
			const badChecksum = "0x5aAEB6053f3e94c9b9a09F33669435e7ef1beaed";
			expect(() => assertWithKeccak(badChecksum, { strict: true })).toThrow(
				InvalidChecksumError,
			);
		});
	});

	describe("Assert factory", () => {
		it("creates assert function with keccak256 injected", () => {
			const assertFn = Assert({ keccak256: hash });
			expect(typeof assertFn).toBe("function");
		});
	});
});
