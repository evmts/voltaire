import { describe, expect, it } from "vitest";
import { hash } from "../../../crypto/Keccak256/hash.js";
import { Address } from "../index.js";
import * as ChecksumAddress from "./ChecksumAddress.js";

describe("ChecksumAddress", () => {
	describe("From", () => {
		it("returns checksummed string", () => {
			const from = ChecksumAddress.From({ keccak256: hash });
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const checksummed = from(addr);
			expect(checksummed).toBe("0x742d35Cc6634c0532925a3b844bc9e7595F251E3");
		});

		it("handles all lowercase input", () => {
			const from = ChecksumAddress.From({ keccak256: hash });
			const addr = Address.fromHex(
				"0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			);
			const checksummed = from(addr);
			expect(typeof checksummed).toBe("string");
			expect(checksummed).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});

		it("handles all uppercase input", () => {
			const from = ChecksumAddress.From({ keccak256: hash });
			const addr = Address.fromHex(
				"0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD",
			);
			const checksummed = from(addr);
			expect(typeof checksummed).toBe("string");
			expect(checksummed).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});

		it("returns same result for same address", () => {
			const from = ChecksumAddress.From({ keccak256: hash });
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const checksummed1 = from(addr);
			const checksummed2 = from(addr);
			expect(checksummed1).toBe(checksummed2);
		});

		it("handles zero address", () => {
			const from = ChecksumAddress.From({ keccak256: hash });
			const addr = Address.zero();
			const checksummed = from(addr);
			expect(checksummed).toBe("0x0000000000000000000000000000000000000000");
		});

		it("type brands as checksummed", () => {
			const from = ChecksumAddress.From({ keccak256: hash });
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const checksummed = from(addr);
			expect(checksummed).toBe("0x742d35Cc6634c0532925a3b844bc9e7595F251E3");
		});
	});

	describe("IsValid", () => {
		it("validates EIP-55 checksum", () => {
			const isValid = ChecksumAddress.IsValid({ keccak256: hash });
			expect(isValid("0x742d35Cc6634c0532925a3b844bc9e7595F251E3")).toBe(true);
		});

		it("rejects incorrect checksum", () => {
			const isValid = ChecksumAddress.IsValid({ keccak256: hash });
			expect(isValid("0x742d35cc6634c0532925a3b844bc9e7595f251e3")).toBe(false);
		});

		it("rejects all uppercase (unless valid)", () => {
			const isValid = ChecksumAddress.IsValid({ keccak256: hash });
			expect(isValid("0x742D35CC6634C0532925A3B844BC9E7595F251E3")).toBe(false);
		});

		it("validates zero address", () => {
			const isValid = ChecksumAddress.IsValid({ keccak256: hash });
			expect(isValid("0x0000000000000000000000000000000000000000")).toBe(true);
		});

		it("validates address without 0x prefix", () => {
			const isValid = ChecksumAddress.IsValid({ keccak256: hash });
			expect(isValid("742d35Cc6634c0532925a3b844bc9e7595F251E3")).toBe(true);
		});

		it("rejects invalid hex", () => {
			const isValid = ChecksumAddress.IsValid({ keccak256: hash });
			expect(isValid("0x742d35cc6634")).toBe(false);
		});

		it("rejects non-hex characters", () => {
			const isValid = ChecksumAddress.IsValid({ keccak256: hash });
			expect(isValid("0x742d35cc6634c0532925a3b844bc9e7595f251gz")).toBe(false);
		});

		it("rejects empty string", () => {
			const isValid = ChecksumAddress.IsValid({ keccak256: hash });
			expect(isValid("")).toBe(false);
		});

		it("rejects null", () => {
			const isValid = ChecksumAddress.IsValid({ keccak256: hash });
			expect(isValid(null as any)).toBe(false);
		});
	});

	describe("roundtrip", () => {
		it("From then IsValid returns true", () => {
			const from = ChecksumAddress.From({ keccak256: hash });
			const isValid = ChecksumAddress.IsValid({ keccak256: hash });
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const checksummed = from(addr);
			expect(isValid(checksummed)).toBe(true);
		});

		it("works with multiple addresses", () => {
			const from = ChecksumAddress.From({ keccak256: hash });
			const isValid = ChecksumAddress.IsValid({ keccak256: hash });
			const addresses = [
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				"0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
				"0x1234567890123456789012345678901234567890",
			];

			for (const hex of addresses) {
				const addr = Address.fromHex(hex);
				const checksummed = from(addr);
				expect(isValid(checksummed)).toBe(true);
			}
		});
	});
});
